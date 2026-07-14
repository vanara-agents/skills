#!/usr/bin/env node
// Runnable check: validates that a threat-model document covers all six STRIDE
// categories for every element it names. Accepts either JSON or a markdown
// threat table, so you can lint a model before review.
//
// STRIDE = Spoofing, Tampering, Repudiation, Information disclosure,
//          Denial of service, Elevation of privilege.
//
// Usage:
//   node stride-checklist.mjs model.json          # check a JSON model file
//   node stride-checklist.mjs model.md            # check a markdown threat table
//   cat model.md | node stride-checklist.mjs      # check from stdin
//   node stride-checklist.mjs --selftest          # run built-in test cases
//
// JSON shape (either accepted):
//   { "elements": [ { "name": "Auth", "categories": ["S","T","R","I","D","E"] } ] }
//   [ { "name": "Auth", "categories": ["Spoofing", "Tampering", ...] } ]
//
// Markdown: any table with an "Element" column and a "STRIDE" column; rows are
// grouped by element and the STRIDE cells are unioned per element.

import { readFileSync } from 'node:fs';

const STRIDE = ['S', 'T', 'R', 'I', 'D', 'E'];
const STRIDE_NAME = {
  S: 'Spoofing', T: 'Tampering', R: 'Repudiation',
  I: 'Information disclosure', D: 'Denial of service', E: 'Elevation of privilege',
};

// Normalize a category token (letter or full word) to a single STRIDE letter, or null.
export function toLetter(token) {
  if (typeof token !== 'string') return null;
  const t = token.trim().toUpperCase();
  if (STRIDE.includes(t)) return t;
  const word = token.trim().toLowerCase();
  if (word.startsWith('spoof')) return 'S';
  if (word.startsWith('tamper')) return 'T';
  if (word.startsWith('repudiat')) return 'R';
  if (word.startsWith('info')) return 'I';
  if (word.startsWith('denial') || word === 'dos') return 'D';
  if (word.startsWith('elevat') || word.includes('privilege')) return 'E';
  return null;
}

// Build a map of element name -> Set of covered STRIDE letters.
function buildCoverage(elements) {
  const map = new Map();
  for (const el of elements) {
    const name = (el && el.name ? String(el.name) : '').trim();
    if (!name) continue;
    if (!map.has(name)) map.set(name, new Set());
    const set = map.get(name);
    for (const c of el.categories || []) {
      const letter = toLetter(c);
      if (letter) set.add(letter);
    }
  }
  return map;
}

// Parse a JSON threat model into an elements array.
function parseJson(text) {
  const obj = JSON.parse(text);
  const arr = Array.isArray(obj) ? obj : obj.elements;
  if (!Array.isArray(arr)) throw new Error('expected an array or { elements: [...] }');
  return arr;
}

// Parse a markdown threat table into an elements array.
function parseMarkdown(text) {
  const lines = text.split('\n').filter((l) => l.trim().startsWith('|'));
  if (lines.length < 2) throw new Error('no markdown table found');
  const cells = (line) => line.split('|').slice(1, -1).map((c) => c.trim());
  const header = cells(lines[0]).map((h) => h.toLowerCase());
  const elIdx = header.findIndex((h) => h.includes('element'));
  const strideIdx = header.findIndex((h) => h.includes('stride') || h === 'category');
  if (elIdx === -1 || strideIdx === -1) {
    throw new Error('table needs an "Element" column and a "STRIDE" column');
  }
  const out = [];
  for (const line of lines.slice(1)) {
    const row = cells(line);
    if (row.every((c) => /^[-:]*$/.test(c))) continue; // separator row
    if (row.length <= Math.max(elIdx, strideIdx)) continue;
    out.push({ name: row[elIdx], categories: [row[strideIdx]] });
  }
  return out;
}

function parse(text) {
  const trimmed = text.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return parseJson(trimmed);
  return parseMarkdown(trimmed);
}

// Returns { ok, elements: [{ name, missing: [letters] }] }
export function checkCoverage(elements) {
  const coverage = buildCoverage(elements);
  const report = [];
  for (const [name, covered] of coverage) {
    const missing = STRIDE.filter((c) => !covered.has(c));
    report.push({ name, missing });
  }
  const ok = report.length > 0 && report.every((r) => r.missing.length === 0);
  return { ok, elements: report };
}

function render(label, result) {
  if (result.elements.length === 0) {
    console.error(`✗ ${label}: no elements found in document`);
    return;
  }
  for (const { name, missing } of result.elements) {
    if (missing.length === 0) {
      console.log(`✓ ${name}: all six STRIDE categories covered`);
    } else {
      const names = missing.map((m) => `${m} (${STRIDE_NAME[m]})`).join(', ');
      console.error(`✗ ${name}: missing ${names}`);
    }
  }
  console.log(result.ok ? `✓ ${label}: complete` : `✗ ${label}: incomplete`);
}

function checkText(label, text) {
  let elements;
  try { elements = parse(text); }
  catch (e) { console.error(`✗ ${label}: ${e.message}`); return false; }
  const result = checkCoverage(elements);
  render(label, result);
  return result.ok;
}

function selftest() {
  const all = ['S', 'T', 'R', 'I', 'D', 'E'];
  const complete = { elements: [
    { name: 'Auth Service', categories: all },
    { name: 'Order API', categories: ['Spoofing', 'Tampering', 'Repudiation',
      'Information disclosure', 'Denial of service', 'Elevation of privilege'] },
  ] };
  const incomplete = { elements: [
    { name: 'Auth Service', categories: ['S', 'T', 'R', 'I', 'D', 'E'] },
    { name: 'Order API', categories: ['S', 'T'] }, // missing R, I, D, E
  ] };
  const completeMd = [
    '| ID | Element     | STRIDE | Threat |',
    '|----|-------------|--------|--------|',
    '| T1 | Auth        | S      | spoof  |',
    '| T2 | Auth        | T      | tamper |',
    '| T3 | Auth        | R      | repud  |',
    '| T4 | Auth        | I      | leak   |',
    '| T5 | Auth        | D      | flood  |',
    '| T6 | Auth        | E      | escal  |',
  ].join('\n');

  const cases = [
    ['complete_json', complete, true],
    ['incomplete_json', incomplete, false],
    ['complete_markdown', completeMd, true],
  ];
  let allExpected = true;
  for (const [name, input, shouldPass] of cases) {
    const elements = typeof input === 'string' ? parseMarkdown(input) : input.elements;
    const { ok } = checkCoverage(elements);
    const correct = ok === shouldPass;
    allExpected &&= correct;
    console.log(`${correct ? '✓' : '✗'} selftest ${name}: ${ok ? 'complete' : 'incomplete'} (expected ${shouldPass ? 'complete' : 'incomplete'})`);
  }
  process.exit(allExpected ? 0 : 1);
}

const arg = process.argv[2];
if (arg === '--selftest') {
  selftest();
} else if (arg) {
  let text;
  try { text = readFileSync(arg, 'utf8'); }
  catch (e) { console.error(`✗ cannot read ${arg}: ${e.message}`); process.exit(1); }
  process.exit(checkText(arg, text) ? 0 : 1);
} else {
  let buf = '';
  process.stdin.on('data', (c) => (buf += c));
  process.stdin.on('end', () => process.exit(checkText('stdin', buf) ? 0 : 1));
}

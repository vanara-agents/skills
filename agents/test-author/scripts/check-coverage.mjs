#!/usr/bin/env node
// Coverage gate: reads an Istanbul/c8/Jest-style coverage-summary.json and fails (exit 1)
// if total coverage falls below a threshold. Zero dependencies — Node built-ins only.
//
// A coverage-summary.json looks like:
//   { "total": { "lines": { "pct": 92.3 }, "statements": { "pct": 90.1 },
//                "functions": { "pct": 85.0 }, "branches": { "pct": 88.2 } }, ... }
//
// Usage:
//   node check-coverage.mjs coverage/coverage-summary.json            # gate at 80% (default)
//   node check-coverage.mjs coverage/coverage-summary.json --min=90   # custom threshold
//   node check-coverage.mjs --min=75 < coverage-summary.json          # read JSON from stdin
//   node check-coverage.mjs --selftest                                # built-in test cases

import { readFileSync } from 'node:fs';

const DEFAULT_MIN = 80;
// Metrics we gate on; the lowest of these must meet the threshold.
const METRICS = ['lines', 'statements', 'functions', 'branches'];

// Pull the per-metric pct numbers out of a coverage summary's `total` block.
export function extractTotals(summary) {
  if (!summary || typeof summary !== 'object' || !summary.total) {
    throw new Error('missing "total" block in coverage summary');
  }
  const totals = {};
  for (const m of METRICS) {
    const pct = summary.total?.[m]?.pct;
    if (typeof pct === 'number' && Number.isFinite(pct)) totals[m] = pct;
  }
  if (Object.keys(totals).length === 0) {
    throw new Error('no numeric coverage metrics found in "total"');
  }
  return totals;
}

// Returns { ok, min, worst, totals, failures } — pure, so it is unit-testable.
export function evaluateCoverage(summary, min = DEFAULT_MIN) {
  const totals = extractTotals(summary);
  const failures = Object.entries(totals)
    .filter(([, pct]) => pct < min)
    .map(([metric, pct]) => ({ metric, pct }));
  const worst = Math.min(...Object.values(totals));
  return { ok: failures.length === 0, min, worst, totals, failures };
}

function parseMin(argv) {
  const flag = argv.find((a) => a.startsWith('--min='));
  if (!flag) return DEFAULT_MIN;
  const n = Number(flag.slice('--min='.length));
  if (!Number.isFinite(n) || n < 0 || n > 100) {
    console.error(`✗ invalid --min value: "${flag}" (expected 0–100)`);
    process.exit(1);
  }
  return n;
}

function report(label, result) {
  const pad = (m) => m.padEnd(11);
  for (const [metric, pct] of Object.entries(result.totals)) {
    const mark = pct < result.min ? '✗' : '✓';
    console.log(`  ${mark} ${pad(metric)} ${pct.toFixed(2)}%`);
  }
  if (result.ok) {
    console.log(`✓ ${label}: coverage ${result.worst.toFixed(2)}% meets ${result.min}% threshold`);
  } else {
    const names = result.failures.map((f) => `${f.metric} ${f.pct.toFixed(2)}%`).join(', ');
    console.error(`✗ ${label}: below ${result.min}% threshold — ${names}`);
  }
  return result.ok;
}

function runFile(path, min) {
  let summary;
  try {
    summary = JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    console.error(`✗ could not read/parse "${path}": ${err.message}`);
    process.exit(1);
  }
  try {
    process.exit(report(path, evaluateCoverage(summary, min)) ? 0 : 1);
  } catch (err) {
    console.error(`✗ ${path}: ${err.message}`);
    process.exit(1);
  }
}

function runStdin(min) {
  let buf = '';
  process.stdin.on('data', (c) => (buf += c));
  process.stdin.on('end', () => {
    try {
      process.exit(report('stdin', evaluateCoverage(JSON.parse(buf), min)) ? 0 : 1);
    } catch (err) {
      console.error(`✗ stdin: ${err.message}`);
      process.exit(1);
    }
  });
}

function selftest() {
  const passing = { total: {
    lines: { pct: 92.3 }, statements: { pct: 90.1 },
    functions: { pct: 85.0 }, branches: { pct: 88.2 },
  } };
  const failing = { total: {
    lines: { pct: 72.0 }, statements: { pct: 70.5 },
    functions: { pct: 60.0 }, branches: { pct: 55.0 },
  } };
  const edge = { total: { lines: { pct: 80.0 }, statements: { pct: 80.0 },
    functions: { pct: 80.0 }, branches: { pct: 80.0 } } }; // exactly at threshold -> pass

  const cases = [
    ['passing above 80', evaluateCoverage(passing, 80).ok, true],
    ['failing below 80', evaluateCoverage(failing, 80).ok, false],
    ['exactly at 80 passes', evaluateCoverage(edge, 80).ok, true],
    ['passing fails a 95 gate', evaluateCoverage(passing, 95).ok, false],
    ['worst metric is the branch pct', evaluateCoverage(passing, 80).worst === 85.0, true],
  ];

  let allOk = true;
  for (const [name, actual, expected] of cases) {
    const correct = actual === expected;
    allOk &&= correct;
    console.log(`${correct ? '✓' : '✗'} selftest ${name}: got ${actual} (expected ${expected})`);
  }
  // Error handling: malformed input must throw.
  let threw = false;
  try { extractTotals({ nope: true }); } catch { threw = true; }
  console.log(`${threw ? '✓' : '✗'} selftest rejects malformed summary: threw ${threw} (expected true)`);
  allOk &&= threw;

  process.exit(allOk ? 0 : 1);
}

const argv = process.argv.slice(2);
if (argv.includes('--selftest')) {
  selftest();
} else {
  const min = parseMin(argv);
  const file = argv.find((a) => !a.startsWith('--'));
  if (file) runFile(file, min);
  else runStdin(min);
}

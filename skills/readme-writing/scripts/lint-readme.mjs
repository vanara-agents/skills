#!/usr/bin/env node
// Runnable check: lints a README for the required sections and a runnable
// quickstart code block. Demonstrates an *executed*, verifiable example asset.
// Zero dependencies — Node built-ins only.
//
// Usage:
//   node lint-readme.mjs README.md            # lint a file
//   node lint-readme.mjs --selftest           # run built-in test cases (exit 0/1)
//   echo '<markdown>' | node lint-readme.mjs  # lint from stdin
//
// A README passes when it has a title (# H1), a one-line description, every
// required section heading, and at least one fenced code block (the quickstart).

import { readFileSync } from 'node:fs';

// Each rule: [label, predicate(markdown) -> boolean]. Heading matches are
// case-insensitive and accept common synonyms.
const REQUIRED_SECTIONS = [
  ['Install', /^#{1,6}\s+(install|installation|setup|getting started)\b/im],
  ['Usage', /^#{1,6}\s+(usage|quick ?start|getting started|examples?)\b/im],
  ['License', /^#{1,6}\s+licen[sc]e\b/im],
];

const RULES = [
  ['has a top-level title (# H1)', (md) => /^#\s+\S+/m.test(md)],
  ['has a one-line description under the title', (md) => hasDescription(md)],
  ['has at least one fenced code block (quickstart)', (md) => /```[\s\S]*?```/.test(md)],
  ...REQUIRED_SECTIONS.map(([name, re]) => [`has a "${name}" section`, (md) => re.test(md)]),
];

// A description is a non-empty, non-heading, non-badge line appearing after the
// H1 title within the first several lines.
function hasDescription(md) {
  const lines = md.split(/\r?\n/);
  const titleIdx = lines.findIndex((l) => /^#\s+\S+/.test(l));
  if (titleIdx === -1) return false;
  for (let i = titleIdx + 1; i < Math.min(lines.length, titleIdx + 8); i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (line.startsWith('#')) return false;          // hit next heading first
    if (line.startsWith('<!--')) continue;           // skip comments
    if (/^[[!]/.test(line) && /\]\(/.test(line)) continue; // skip badge/link-only lines
    return true;                                     // found prose
  }
  return false;
}

export function lintReadme(md) {
  const failures = RULES.filter(([, fn]) => !safe(fn, md)).map(([msg]) => msg);
  return { ok: failures.length === 0, failures };
}

function safe(fn, md) { try { return fn(md); } catch { return false; } }

function lint(label, md) {
  const { ok, failures } = lintReadme(md);
  if (ok) console.log(`✓ ${label}: README has all required sections`);
  else { console.error(`✗ ${label}:`); failures.forEach((f) => console.error(`    - ${f}`)); }
  return ok;
}

const COMPLETE = `# Acme

A fast CLI for doing the thing.

## Install
\`\`\`bash
npm install acme
\`\`\`

## Usage
\`\`\`bash
acme run
\`\`\`

## License
MIT
`;

const INCOMPLETE = `# Acme

Some text but no fenced code block and no license section.

## Install
Run npm install acme.
`;

function selftest() {
  const cases = {
    valid_complete: COMPLETE,
    invalid_incomplete: INCOMPLETE,
  };
  let allExpected = true;
  for (const [name, md] of Object.entries(cases)) {
    const { ok } = lintReadme(md);
    const shouldPass = name.startsWith('valid');
    const correct = ok === shouldPass;
    allExpected &&= correct;
    console.log(
      `${correct ? '✓' : '✗'} selftest ${name}: ${ok ? 'pass' : 'fail'} (expected ${shouldPass ? 'pass' : 'fail'})`
    );
  }
  process.exit(allExpected ? 0 : 1);
}

const arg = process.argv[2];
if (arg === '--selftest') selftest();
else if (arg) {
  let md;
  try { md = readFileSync(arg, 'utf8'); }
  catch { console.error(`✗ cannot read file: ${arg}`); process.exit(1); }
  process.exit(lint(arg, md) ? 0 : 1);
} else {
  let buf = '';
  process.stdin.on('data', (c) => (buf += c));
  process.stdin.on('end', () => process.exit(lint('stdin', buf) ? 0 : 1));
}

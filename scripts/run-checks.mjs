#!/usr/bin/env node
// The public evals runner: discovers and runs every bundled verification
// check in this repo (agents/*/scripts/*.mjs and skills/*/scripts/*.mjs)
// and fails on the first non-zero total. This is the runner behind the CI
// badge — every check runs on every push, nothing is skipped silently.
//   node scripts/run-checks.mjs
import { readdirSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KIND_DIRS = ['agents', 'skills'];

function discover() {
  const checks = [];
  for (const kind of KIND_DIRS) {
    const kindDir = path.join(ROOT, kind);
    for (const item of readdirSync(kindDir, { withFileTypes: true })) {
      if (!item.isDirectory()) continue;
      const scriptsDir = path.join(kindDir, item.name, 'scripts');
      let entries = [];
      try {
        entries = readdirSync(scriptsDir).filter((f) => f.endsWith('.mjs'));
      } catch {
        continue; // item ships no scripts
      }
      for (const file of entries) {
        const full = path.join(scriptsDir, file);
        // Scripts that ship a selftest run it; the rest are argument-free
        // checks that exit 0/1 on their own.
        const args = readFileSync(full, 'utf8').includes('--selftest') ? ['--selftest'] : [];
        checks.push({ name: `${kind}/${item.name}/${file}`, full, args });
      }
    }
  }
  return checks;
}

const checks = discover();
if (checks.length === 0) {
  console.error('No checks discovered — repo layout changed?');
  process.exit(1);
}

let failed = 0;
for (const c of checks) {
  const res = spawnSync(process.execPath, [c.full, ...c.args], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 60_000,
  });
  const ok = res.status === 0;
  const mode = c.args.length ? 'selftest' : 'check';
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${c.name} (${mode})`);
  if (!ok) {
    failed += 1;
    const output = `${res.stdout ?? ''}${res.stderr ?? ''}`.trim();
    if (output) console.log(output.split('\n').map((l) => `      ${l}`).join('\n'));
    if (res.error) console.log(`      ${res.error.message}`);
  }
}

console.log(`\n${checks.length - failed}/${checks.length} checks passing`);
process.exit(failed === 0 ? 0 : 1);

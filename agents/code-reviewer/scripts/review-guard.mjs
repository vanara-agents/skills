#!/usr/bin/env node
// Runnable check: flags maintainability violations from a diff-stat-like JSON so a
// reviewer (human or agent) can mechanically catch oversized functions and files
// before the manual pass. Mirrors the --selftest convention of check-envelope.mjs.
//
// Input shape (a "diff stat"):
//   {
//     "files": [
//       { "path": "a.js", "lines": 120,
//         "functions": [ { "name": "doThing", "lines": 40 } ] }
//     ]
//   }
//
// Usage:
//   node review-guard.mjs '<json>'              # check a literal JSON string
//   echo '<json>' | node review-guard.mjs      # check from stdin
//   node review-guard.mjs --selftest           # run built-in test cases

const MAX_FUNC_LINES = 50;   // functions should stay under 50 lines
const MAX_FILE_LINES = 800;  // files should stay under 800 lines

export function reviewGuard(stat) {
  const violations = [];
  const files = (stat && Array.isArray(stat.files)) ? stat.files : [];
  for (const f of files) {
    const path = f.path ?? '<unknown>';
    if (typeof f.lines === 'number' && f.lines > MAX_FILE_LINES) {
      violations.push({
        severity: 'MEDIUM',
        where: path,
        msg: `file is ${f.lines} lines (> ${MAX_FILE_LINES}); split into smaller modules`,
      });
    }
    const fns = Array.isArray(f.functions) ? f.functions : [];
    for (const fn of fns) {
      if (typeof fn.lines === 'number' && fn.lines > MAX_FUNC_LINES) {
        violations.push({
          severity: 'MEDIUM',
          where: `${path}:${fn.name ?? '<anon>'}`,
          msg: `function is ${fn.lines} lines (> ${MAX_FUNC_LINES}); extract focused helpers`,
        });
      }
    }
  }
  return { ok: violations.length === 0, violations };
}

function check(label, json) {
  let stat;
  try { stat = typeof json === 'string' ? JSON.parse(json) : json; }
  catch { console.error(`✗ ${label}: invalid JSON`); return false; }
  const { ok, violations } = reviewGuard(stat);
  if (ok) console.log(`✓ ${label}: no oversized functions or files`);
  else {
    console.error(`✗ ${label}: ${violations.length} violation(s)`);
    violations.forEach((v) => console.error(`    [${v.severity}] ${v.where} — ${v.msg}`));
  }
  return ok;
}

function selftest() {
  const cases = {
    clean: {
      files: [
        { path: 'ok.js', lines: 120, functions: [{ name: 'small', lines: 20 }] },
      ],
    },
    bad_big_function: {
      files: [
        { path: 'svc.js', lines: 200, functions: [{ name: 'processOrder', lines: 59 }] },
      ],
    },
    bad_big_file: {
      files: [
        { path: 'huge.js', lines: 1200, functions: [{ name: 'fine', lines: 10 }] },
      ],
    },
    bad_both: {
      files: [
        { path: 'monster.js', lines: 900, functions: [{ name: 'god', lines: 300 }] },
      ],
    },
  };
  let allExpected = true;
  for (const [name, payload] of Object.entries(cases)) {
    const { ok } = reviewGuard(payload);
    const shouldPass = name === 'clean';
    const correct = ok === shouldPass;
    allExpected &&= correct;
    console.log(`${correct ? '✓' : '✗'} selftest ${name}: ${ok ? 'clean' : 'violations'} (expected ${shouldPass ? 'clean' : 'violations'})`);
  }
  process.exit(allExpected ? 0 : 1);
}

const arg = process.argv[2];
if (arg === '--selftest') selftest();
else if (arg) process.exit(check('diff-stat', arg) ? 0 : 1);
else {
  let buf = '';
  process.stdin.on('data', (c) => (buf += c));
  process.stdin.on('end', () => process.exit(check('stdin', buf) ? 0 : 1));
}

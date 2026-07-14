#!/usr/bin/env node
// Runnable linter: scans source code for SWALLOWED errors — the #1 error-handling
// defect. Flags empty catch blocks, bare `except: pass`, no-op promise .catch
// handlers, and ignored Go errors. Use it in CI to fail builds that hide failures.
//
// Usage:
//   node lint-empty-catch.mjs <file> [<file>...]   # lint files, exit 1 if any findings
//   echo '<code>' | node lint-empty-catch.mjs       # lint code from stdin
//   node lint-empty-catch.mjs --selftest            # run built-in test cases
//
// Exit code: 0 = clean, 1 = swallowed errors found (or a selftest case failed).

import { readFileSync } from 'node:fs';

// Each rule: a label and a regex matching a swallow anti-pattern.
// Patterns are intentionally conservative to limit false positives.
const RULES = [
  // JS/TS/Java/C#: catch with an empty or whitespace/comment-only body.
  ['empty catch block', /catch\s*(\([^)]*\))?\s*\{\s*(\/\/[^\n]*\s*|\/\*[\s\S]*?\*\/\s*)*\}/g],
  // JS/TS: a promise .catch that does nothing.
  ['no-op .catch handler', /\.catch\s*\(\s*\(?\s*[\w$]*\s*\)?\s*=>\s*\{\s*\}\s*\)/g],
  // JS/TS: .catch(() => undefined) style swallow.
  ['no-op .catch (returns nothing)', /\.catch\s*\(\s*\(?\s*[\w$]*\s*\)?\s*=>\s*(undefined|null|void 0)\s*\)/g],
  // Python: bare except (optionally typed) whose only statement is pass.
  ['python except: pass', /except\b[^\n:]*:\s*(\n\s*)?pass\b/g],
  // Python: except whose only statement is `...` (ellipsis stub left in prod).
  ['python except: ...', /except\b[^\n:]*:\s*(\n\s*)?\.\.\.\s*/g],
  // Go: an `if err != nil` block that is empty.
  ['go empty err check', /if\s+err\s*!=\s*nil\s*\{\s*\}/g],
];

export function lint(source) {
  const findings = [];
  for (const [label, re] of RULES) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(source)) !== null) {
      const line = source.slice(0, m.index).split('\n').length;
      findings.push({ label, line });
      if (m.index === re.lastIndex) re.lastIndex++; // guard against zero-width loops
    }
  }
  findings.sort((a, b) => a.line - b.line);
  return findings;
}

function lintLabeled(label, source) {
  const findings = lint(source);
  if (findings.length === 0) {
    console.log(`✓ ${label}: no swallowed errors`);
    return true;
  }
  console.error(`✗ ${label}: ${findings.length} swallowed error(s)`);
  for (const f of findings) console.error(`    line ${f.line}: ${f.label}`);
  return false;
}

function selftest() {
  // name starts with "clean" => expect 0 findings; otherwise expect >=1 finding.
  const cases = {
    bad_empty_catch: 'try { risky(); } catch (e) {}',
    bad_catch_comment_only: 'try { risky(); } catch (e) {\n  // ignore\n}',
    bad_noop_promise_catch: 'doThing().catch(() => {});',
    bad_noop_catch_undefined: 'doThing().catch(e => undefined);',
    bad_python_except_pass: 'try:\n    risky()\nexcept Exception:\n    pass',
    bad_python_except_ellipsis: 'try:\n    risky()\nexcept ValueError:\n    ...',
    bad_go_empty_err: 'v, err := load()\nif err != nil {}\nuse(v)',
    clean_handled_catch: 'try { risky(); } catch (e) {\n  logger.error(e);\n  throw e;\n}',
    clean_handled_promise: 'doThing().catch(e => logger.error(e));',
    clean_python_handled: 'try:\n    risky()\nexcept Exception as e:\n    log.error(e)\n    raise',
    clean_go_handled: 'v, err := load()\nif err != nil {\n  return err\n}\nuse(v)',
  };

  let allExpected = true;
  for (const [name, code] of Object.entries(cases)) {
    const found = lint(code).length;
    const shouldBeClean = name.startsWith('clean');
    const isClean = found === 0;
    const correct = isClean === shouldBeClean;
    allExpected &&= correct;
    console.log(
      `${correct ? '✓' : '✗'} selftest ${name}: ${found} finding(s) ` +
        `(expected ${shouldBeClean ? 'clean' : 'swallow'})`,
    );
  }
  console.log(allExpected ? '\nAll selftest cases passed.' : '\nSelftest FAILED.');
  process.exit(allExpected ? 0 : 1);
}

// --- CLI -------------------------------------------------------------------

const args = process.argv.slice(2);
if (args[0] === '--selftest') {
  selftest();
} else if (args.length > 0) {
  let clean = true;
  for (const file of args) {
    let src;
    try {
      src = readFileSync(file, 'utf8');
    } catch {
      console.error(`✗ ${file}: cannot read file`);
      clean = false;
      continue;
    }
    clean = lintLabeled(file, src) && clean;
  }
  process.exit(clean ? 0 : 1);
} else {
  let buf = '';
  process.stdin.on('data', (c) => (buf += c));
  process.stdin.on('end', () => process.exit(lintLabeled('stdin', buf) ? 0 : 1));
}

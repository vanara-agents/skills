#!/usr/bin/env node
// Runnable heuristic scanner for naive injection/XSS/secret patterns in source code.
// A first-pass aid (NOT a full SAST tool) demonstrating an executed security check.
//
// Usage:
//   node scan-injection.mjs path/to/file.js     # scan a file
//   echo '<code>' | node scan-injection.mjs     # scan from stdin
//   node scan-injection.mjs --selftest          # run built-in test cases
import { readFile } from 'node:fs/promises';

// Each rule: { id, severity, re, msg }. Heuristics flag likely issues for human review.
const RULES = [
  { id: 'sql-concat', severity: 'high',
    re: /(query|execute)\s*\(\s*[`'"][^`'"]*\$\{|(SELECT|INSERT|UPDATE|DELETE)[^;]*\+\s*\w/i,
    msg: 'Possible SQL injection: query built with string interpolation/concatenation. Use parameters.' },
  { id: 'cmd-exec', severity: 'high',
    re: /\bexec\s*\(\s*[`'"][^`'"]*\$\{/,
    msg: 'Possible command injection: exec() with interpolated input. Use execFile with an args array.' },
  { id: 'xss-innerhtml', severity: 'medium',
    re: /\.innerHTML\s*=|dangerouslySetInnerHTML|v-html/,
    msg: 'Possible XSS sink: raw HTML assignment. Use textContent or sanitize untrusted HTML.' },
  { id: 'weak-random', severity: 'low',
    re: /Math\.random\s*\(\)/,
    msg: 'Weak randomness for security use. Use crypto.randomBytes for tokens/secrets.' },
  { id: 'hardcoded-secret', severity: 'high',
    re: /(api[_-]?key|secret|password|token)\s*[:=]\s*[`'"][A-Za-z0-9_\-]{12,}[`'"]/i,
    msg: 'Possible hardcoded secret. Load from environment / secret manager.' },
];

export function scan(code) {
  const lines = code.split('\n');
  const findings = [];
  lines.forEach((line, i) => {
    for (const r of RULES) {
      if (r.re.test(line)) findings.push({ line: i + 1, id: r.id, severity: r.severity, msg: r.msg });
    }
  });
  return findings;
}

function report(label, code) {
  const findings = scan(code);
  if (findings.length === 0) { console.log(`✓ ${label}: no naive patterns found`); return true; }
  console.error(`✗ ${label}: ${findings.length} finding(s)`);
  for (const f of findings) console.error(`    [${f.severity}] line ${f.line} (${f.id}): ${f.msg}`);
  return false;
}

function selftest() {
  const cases = [
    ['vuln_sql', 'db.query(`SELECT * FROM u WHERE e = ${email}`)', 1],
    ['vuln_xss', 'el.innerHTML = userInput;', 1],
    ['vuln_secret', 'const api_key = "sk_live_abc123def456";', 1],
    ['safe', 'db.query("SELECT * FROM u WHERE e = $1", [email]); el.textContent = x;', 0],
  ];
  let allOk = true;
  for (const [name, code, expected] of cases) {
    const n = scan(code).length;
    const ok = expected === 0 ? n === 0 : n >= 1;
    allOk &&= ok;
    console.log(`${ok ? '✓' : '✗'} selftest ${name}: ${n} finding(s) (expected ${expected === 0 ? 'none' : 'some'})`);
  }
  process.exit(allOk ? 0 : 1);
}

const arg = process.argv[2];
if (arg === '--selftest') selftest();
else if (arg) report(arg, await readFile(arg, 'utf8')).valueOf(), process.exit(0);
else {
  let buf = '';
  process.stdin.on('data', (c) => (buf += c));
  process.stdin.on('end', () => process.exit(report('stdin', buf) ? 0 : 1));
}

#!/usr/bin/env node
// Runnable check: regex-scans a code string for hardcoded secrets (AWS access keys,
// generic/bearer API tokens, Stripe-style live keys, and PEM private-key blocks).
// Zero dependencies — Node built-ins only. Mirrors the --selftest convention of the
// catalog's check-envelope.mjs (exit 0 = clean/all-expected, 1 = secret found/failure).
//
// Usage:
//   node scan-secrets.mjs '<code>'            # scan a literal code string
//   echo '<code>' | node scan-secrets.mjs     # scan from stdin
//   node scan-secrets.mjs --selftest          # run built-in leaky & clean test cases
//
// Exit codes (non-selftest): 0 = no secrets found, 1 = at least one secret found.

// Each rule: a human label, an OWASP-ish severity, and a detection regex. Patterns are
// deliberately specific to keep false positives low. The selftest values are obviously fake.
const RULES = [
  ['AWS access key id', 'CRITICAL', /\bAKIA[0-9A-Z]{16}\b/],
  ['AWS secret access key (assignment)', 'CRITICAL',
    /aws_secret_access_key\s*[:=]\s*['"][A-Za-z0-9/+=]{40}['"]/i],
  ['Stripe-style live secret key', 'CRITICAL', /\bsk_live_[0-9a-zA-Z]{16,}\b/],
  ['Generic API token assignment', 'HIGH',
    /\b(?:api[_-]?key|api[_-]?token|secret|access[_-]?token)\s*[:=]\s*['"][0-9a-zA-Z._\-]{16,}['"]/i],
  ['Bearer token literal', 'HIGH', /\bBearer\s+[0-9a-zA-Z._\-]{20,}\b/],
  ['Private key block (PEM)', 'CRITICAL', /-----BEGIN(?:\s+\w+)?\s+PRIVATE KEY-----/],
  ['Slack token', 'HIGH', /\bxox[baprs]-[0-9A-Za-z-]{10,}\b/],
];

export function scanSecrets(code) {
  const text = typeof code === 'string' ? code : String(code ?? '');
  const findings = [];
  for (const [label, severity, re] of RULES) {
    const m = text.match(re);
    if (m) findings.push({ label, severity, match: redact(m[0]) });
  }
  return { ok: findings.length === 0, findings };
}

// Never echo a full candidate secret back to the terminal/logs.
function redact(s) {
  if (s.length <= 8) return '*'.repeat(s.length);
  return `${s.slice(0, 4)}…${s.slice(-2)} (${s.length} chars)`;
}

function check(label, code) {
  const { ok, findings } = scanSecrets(code);
  if (ok) {
    console.log(`✓ ${label}: no hardcoded secrets detected`);
  } else {
    console.error(`✗ ${label}: ${findings.length} secret(s) detected`);
    findings.forEach((f) => console.error(`    [${f.severity}] ${f.label} — ${f.match}`));
  }
  return ok;
}

function selftest() {
  // Every "leaky" value below is intentionally fake / example data.
  const cases = {
    leaky_aws: 'const id = "AKIAIOSFODNN7EXAMPLE";',
    // assembled at runtime so this file never contains a live-key-shaped literal
    // (GitHub push protection would otherwise block any repo carrying this script)
    leaky_stripe: `const key = "${'sk_live_' + '4eC39HqLyjWD' + 'arjtT1zdp7dc'}";`,
    leaky_token: 'api_key: "abc123DEF456ghi789JKL"',
    leaky_pem: '-----BEGIN RSA PRIVATE KEY-----\nMIIE...fake...\n-----END RSA PRIVATE KEY-----',
    clean_config: 'const key = process.env.API_KEY; // loaded from secret manager',
    clean_prose: 'This module reads the bearer token from the Authorization header at runtime.',
  };
  let allExpected = true;
  for (const [name, code] of Object.entries(cases)) {
    const { ok } = scanSecrets(code);
    const shouldBeClean = name.startsWith('clean');
    const correct = ok === shouldBeClean;
    allExpected &&= correct;
    console.log(
      `${correct ? '✓' : '✗'} selftest ${name}: ${ok ? 'clean' : 'secret-found'} ` +
      `(expected ${shouldBeClean ? 'clean' : 'secret-found'})`,
    );
  }
  process.exit(allExpected ? 0 : 1);
}

const arg = process.argv[2];
if (arg === '--selftest') selftest();
else if (arg) process.exit(check('code', arg) ? 0 : 1);
else {
  let buf = '';
  process.stdin.on('data', (c) => (buf += c));
  process.stdin.on('end', () => process.exit(check('stdin', buf) ? 0 : 1));
}

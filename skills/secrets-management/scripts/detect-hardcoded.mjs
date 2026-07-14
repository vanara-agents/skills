#!/usr/bin/env node
// Zero-dependency scanner: flags likely hardcoded secrets in a code string and
// redacts the matched value so the finding can be logged safely.
//
// Usage:
//   node detect-hardcoded.mjs '<code string>'        # scan a literal string
//   echo '<code>' | node detect-hardcoded.mjs        # scan from stdin
//   node detect-hardcoded.mjs --selftest             # built-in leaky + clean cases
//
// Exit codes: 0 = no secrets found (clean) ; 1 = secret(s) found OR selftest failed.

// Each rule: a name and a regex with the sensitive value in capture group 1 (or 0).
const RULES = [
  ['AWS access key id', /\b(AKIA[0-9A-Z]{16})\b/],
  ['Stripe secret key', /\b(sk_(?:live|test)_[A-Za-z0-9]{16,})\b/],
  ['Google API key', /\b(AIza[0-9A-Za-z_\-]{35})\b/],
  ['Slack token', /\b(xox[baprs]-[0-9A-Za-z-]{10,})\b/],
  ['GitHub token', /\b(gh[pousr]_[0-9A-Za-z]{20,})\b/],
  ['JWT', /\b(eyJ[A-Za-z0-9_\-]{8,}\.[A-Za-z0-9_\-]{8,}\.[A-Za-z0-9_\-]{8,})\b/],
  ['Private key block', /(-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/],
  // Generic: an assignment to a secret-ish name with a non-trivial inline string literal.
  ['Hardcoded password/secret assignment',
    /\b(?:password|passwd|secret|api[_-]?key|token|access[_-]?key)\b\s*[:=]\s*["'`]([^"'`\s]{6,})["'`]/i],
];

// Mask all but a short prefix so output never echoes a real secret.
function redactValue(v) {
  if (v.length <= 6) return '*'.repeat(v.length);
  return v.slice(0, 4) + '*'.repeat(Math.max(4, v.length - 4));
}

export function scan(code) {
  const findings = [];
  for (const [name, re] of RULES) {
    const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    let m;
    while ((m = g.exec(code)) !== null) {
      const value = m[1] ?? m[0];
      findings.push({ rule: name, redacted: redactValue(value) });
      if (m.index === g.lastIndex) g.lastIndex++; // avoid zero-width loop
    }
  }
  return findings;
}

function report(label, code) {
  const findings = scan(code);
  if (findings.length === 0) {
    console.log(`OK ${label}: no hardcoded secrets detected`);
    return true;
  }
  console.error(`FAIL ${label}: ${findings.length} potential secret(s):`);
  for (const f of findings) console.error(`    - ${f.rule}: ${f.redacted}`);
  return false;
}

function selftest() {
  // All sample values are OBVIOUSLY FAKE — fixed filler, not real credentials.
  const leaky = [
    "const k = 'AKIAIOSFODNN7EXAMPLE';",
    "stripe = 'sk_test_0000000000000000FAKE';",
    "googleKey = 'AIzaBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB';",
    "const password = 'hunter2hunter2';",
    "apiKey: 'tok_FAKEFAKEFAKE'",
  ];
  const clean = [
    "const k = process.env.AWS_ACCESS_KEY_ID;",
    "const password = process.env.DB_PASSWORD; // loaded from env",
    "// example: set STRIPE_SECRET_KEY in your secret manager",
    "const limit = 20; const name = 'orders';",
  ];
  let pass = true;
  leaky.forEach((c, i) => {
    const found = scan(c).length > 0;
    const ok = found === true;
    pass &&= ok;
    console.log(`${ok ? 'OK' : 'XX'} leaky[${i}]: ${found ? 'flagged' : 'missed'} (expected flagged)`);
  });
  clean.forEach((c, i) => {
    const found = scan(c).length > 0;
    const ok = found === false;
    pass &&= ok;
    console.log(`${ok ? 'OK' : 'XX'} clean[${i}]: ${found ? 'flagged' : 'clean'} (expected clean)`);
  });
  console.log(pass ? 'selftest: PASS' : 'selftest: FAIL');
  process.exit(pass ? 0 : 1);
}

const arg = process.argv[2];
if (arg === '--selftest') selftest();
else if (arg) process.exit(report('input', arg) ? 0 : 1);
else {
  let buf = '';
  process.stdin.on('data', (c) => (buf += c));
  process.stdin.on('end', () => process.exit(report('stdin', buf) ? 0 : 1));
}

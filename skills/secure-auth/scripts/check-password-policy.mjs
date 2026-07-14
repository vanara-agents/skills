#!/usr/bin/env node
// Runnable check: validates a candidate password against a configurable policy
// (minimum length, character-class diversity, and a small breached/common-password
// denylist). Zero dependencies — Node built-ins only.
//
// This is a *policy linter*, not a strength meter. It mirrors the kind of
// server-side validation you should run at registration / password-change time,
// BEFORE hashing with argon2id or bcrypt (see references/password-hashing.md).
//
// Usage:
//   node check-password-policy.mjs '<password>'        # check one password
//   echo '<password>' | node check-password-policy.mjs # check from stdin
//   node check-password-policy.mjs --selftest          # run built-in test cases
//
// Exit code: 0 = password satisfies the policy, 1 = it does not (or selftest failed).

// --- Policy configuration ---------------------------------------------------
// NIST SP 800-63B favors length over composition rules and screening against
// known-breached passwords. We keep a modest class requirement for demos but the
// breached-list screen is the most valuable check in practice.
const POLICY = Object.freeze({
  minLength: 12,
  maxLength: 128, // cap to avoid DoS on the hashing function
  minClasses: 3,  // of: lowercase, uppercase, digit, symbol
});

// A tiny stand-in for a real breached-password corpus (e.g. HaveIBeenPwned's
// k-anonymity range API or a local Pwned Passwords bloom filter). These are
// obviously fake/illustrative entries used only to exercise the check.
const BREACHED_COMMON = new Set([
  'password', 'password1', 'password123', '123456', '12345678', '123456789',
  'qwerty', 'qwerty123', 'letmein', 'admin', 'admin123', 'welcome', 'iloveyou',
  'monkey', 'dragon', 'football', 'changeme', 'passw0rd', 'p@ssw0rd', 'test1234',
]);

// --- Validation logic -------------------------------------------------------
export function countClasses(pw) {
  let n = 0;
  if (/[a-z]/.test(pw)) n++;
  if (/[A-Z]/.test(pw)) n++;
  if (/[0-9]/.test(pw)) n++;
  if (/[^A-Za-z0-9]/.test(pw)) n++;
  return n;
}

export function validatePassword(pw, policy = POLICY) {
  const failures = [];
  if (typeof pw !== 'string') {
    return { ok: false, failures: ['password must be a string'] };
  }
  if (pw.length < policy.minLength) {
    failures.push(`too short: ${pw.length} < ${policy.minLength} chars`);
  }
  if (pw.length > policy.maxLength) {
    failures.push(`too long: ${pw.length} > ${policy.maxLength} chars`);
  }
  const classes = countClasses(pw);
  if (classes < policy.minClasses) {
    failures.push(`not enough character classes: ${classes} < ${policy.minClasses}`);
  }
  // Case-insensitive membership check against the breached/common denylist.
  if (BREACHED_COMMON.has(pw.toLowerCase())) {
    failures.push('matches a known breached/common password');
  }
  return { ok: failures.length === 0, failures };
}

// --- CLI plumbing -----------------------------------------------------------
function check(label, pw) {
  const { ok, failures } = validatePassword(pw);
  if (ok) {
    console.log(`OK ${label}: password satisfies policy`);
  } else {
    console.error(`FAIL ${label}:`);
    failures.forEach((f) => console.error(`    - ${f}`));
  }
  return ok;
}

function selftest() {
  // Each case asserts the *expected* verdict so the selftest catches regressions
  // in either direction (a strong password wrongly rejected, or a weak one passed).
  const cases = [
    // name, password (obviously fake), shouldPass
    ['strong_passphrase', 'Tr0ubadour&Horse-Battery!', true],
    ['strong_mixed',      'X9k!mQ2$wLp7vZ', true],
    ['weak_short',        'Ab1!', false],
    ['weak_common',       'password123', false],
    ['weak_one_class',    'aaaaaaaaaaaaaaaa', false],
    ['weak_two_classes',  'lowercaseonly123', false],
  ];
  let allExpected = true;
  for (const [name, pw, shouldPass] of cases) {
    const { ok } = validatePassword(pw);
    const correct = ok === shouldPass;
    allExpected = allExpected && correct;
    const mark = correct ? 'OK' : 'XX';
    console.log(
      `${mark} selftest ${name}: ${ok ? 'accepted' : 'rejected'} (expected ${shouldPass ? 'accepted' : 'rejected'})`
    );
  }
  process.exit(allExpected ? 0 : 1);
}

const arg = process.argv[2];
if (arg === '--selftest') {
  selftest();
} else if (arg !== undefined) {
  process.exit(check('password', arg) ? 0 : 1);
} else {
  let buf = '';
  process.stdin.on('data', (c) => (buf += c));
  process.stdin.on('end', () => process.exit(check('stdin', buf.replace(/\r?\n$/, '')) ? 0 : 1));
}

#!/usr/bin/env node
// Runnable check: validates that a JSON payload matches the standard response
// envelope from this skill. Demonstrates an *executed*, verifiable example asset.
//
// Usage:
//   node check-envelope.mjs '<json>'      # check a literal JSON string
//   echo '<json>' | node check-envelope.mjs   # check from stdin
//   node check-envelope.mjs --selftest    # run built-in test cases

const RULES = [
  ['has "data" key (may be null)', (o) => 'data' in o],
  ['has "error" key', (o) => 'error' in o],
  ['error is null OR an object with a string code', (o) =>
    o.error === null || (typeof o.error === 'object' && typeof o.error.code === 'string')],
  ['on error, data is null', (o) => o.error === null || o.data === null],
  ['list responses include meta.limit', (o) =>
    !Array.isArray(o.data) || (o.meta && typeof o.meta.limit === 'number')],
];

export function validateEnvelope(obj) {
  const failures = RULES.filter(([, fn]) => !safe(fn, obj)).map(([msg]) => msg);
  return { ok: failures.length === 0, failures };
}

function safe(fn, o) { try { return fn(o); } catch { return false; } }

function check(label, json) {
  let obj;
  try { obj = typeof json === 'string' ? JSON.parse(json) : json; }
  catch { console.error(`✗ ${label}: invalid JSON`); return false; }
  const { ok, failures } = validateEnvelope(obj);
  if (ok) console.log(`✓ ${label}: valid envelope`);
  else { console.error(`✗ ${label}:`); failures.forEach((f) => console.error(`    - ${f}`)); }
  return ok;
}

function selftest() {
  const cases = {
    valid_list: { data: [{ id: '1' }], meta: { limit: 20 }, error: null },
    valid_error: { data: null, error: { code: 'not_found', message: 'x' } },
    bad_200_error: { data: { id: '1' }, error: { code: 'oops' } }, // data not null on error -> fail
    bad_list_no_meta: { data: [{ id: '1' }], error: null },        // list without meta.limit -> fail
  };
  let allExpected = true;
  for (const [name, payload] of Object.entries(cases)) {
    const { ok } = validateEnvelope(payload);
    const shouldPass = name.startsWith('valid');
    const correct = ok === shouldPass;
    allExpected &&= correct;
    console.log(`${correct ? '✓' : '✗'} selftest ${name}: ${ok ? 'valid' : 'invalid'} (expected ${shouldPass ? 'valid' : 'invalid'})`);
  }
  process.exit(allExpected ? 0 : 1);
}

const arg = process.argv[2];
if (arg === '--selftest') selftest();
else if (arg) process.exit(check('payload', arg) ? 0 : 1);
else {
  let buf = '';
  process.stdin.on('data', (c) => (buf += c));
  process.stdin.on('end', () => process.exit(check('stdin', buf) ? 0 : 1));
}

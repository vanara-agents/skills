#!/usr/bin/env node
// Runnable check: validates that an LLM's JSON output matches an expected schema.
// Demonstrates the "always validate structured output" discipline from this skill.
// Tolerates ```json fences and surrounding prose by extracting the first {...} block.
//
// Usage:
//   node validate-output.mjs '<model output>'   # validate a literal string
//   echo '<output>' | node validate-output.mjs  # validate from stdin
//   node validate-output.mjs --selftest         # run built-in test cases

// Example schema: a support-ticket classification. Adapt `SCHEMA` to your task.
const SCHEMA = {
  category: { type: 'enum', values: ['billing', 'bug', 'feature', 'other'] },
  urgency: { type: 'enum', values: ['low', 'medium', 'high'] },
};

export function extractJson(text) {
  if (typeof text !== 'string') return text;
  const stripped = text.replace(/```json/gi, '').replace(/```/g, '');
  const match = stripped.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('no JSON object found');
  return JSON.parse(match[0]);
}

export function validate(obj, schema = SCHEMA) {
  const failures = [];
  for (const [key, rule] of Object.entries(schema)) {
    if (!(key in obj)) { failures.push(`missing field: ${key}`); continue; }
    if (rule.type === 'enum' && !rule.values.includes(obj[key])) {
      failures.push(`field ${key}="${obj[key]}" not in [${rule.values.join(', ')}]`);
    }
  }
  return { ok: failures.length === 0, failures };
}

function check(label, raw) {
  let obj;
  try { obj = extractJson(raw); } catch (e) { console.error(`✗ ${label}: ${e.message}`); return false; }
  const { ok, failures } = validate(obj);
  if (ok) console.log(`✓ ${label}: valid`);
  else { console.error(`✗ ${label}:`); failures.forEach((f) => console.error(`    - ${f}`)); }
  return ok;
}

function selftest() {
  const cases = [
    ['valid_plain', '{"category":"billing","urgency":"high"}', true],
    ['valid_fenced', '```json\n{"category":"bug","urgency":"low"}\n```', true],
    ['valid_with_prose', 'Here you go: {"category":"other","urgency":"medium"} hope that helps', true],
    ['bad_enum', '{"category":"refund","urgency":"high"}', false],
    ['bad_missing', '{"category":"bug"}', false],
  ];
  let allOk = true;
  for (const [name, input, shouldPass] of cases) {
    let pass;
    try { pass = validate(extractJson(input)).ok; } catch { pass = false; }
    const correct = pass === shouldPass;
    allOk &&= correct;
    console.log(`${correct ? '✓' : '✗'} selftest ${name}: got ${pass ? 'valid' : 'invalid'} (expected ${shouldPass ? 'valid' : 'invalid'})`);
  }
  process.exit(allOk ? 0 : 1);
}

const arg = process.argv[2];
if (arg === '--selftest') selftest();
else if (arg) process.exit(check('output', arg) ? 0 : 1);
else {
  let buf = '';
  process.stdin.on('data', (c) => (buf += c));
  process.stdin.on('end', () => process.exit(check('stdin', buf) ? 0 : 1));
}

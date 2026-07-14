#!/usr/bin/env node
// Runnable check: validates a Conventional Commit *header* against the spec from
// this skill — type, optional scope, optional `!`, colon-space, and a subject
// within a 72-char total header. Zero dependencies, Node built-ins only.
//
// Usage:
//   node lint-commit.mjs "feat(api): add pagination"   # check a literal header
//   echo "fix: handle null" | node lint-commit.mjs      # check from stdin
//   node lint-commit.mjs --selftest                     # run built-in test cases

const ALLOWED_TYPES = [
  'feat', 'fix', 'docs', 'style', 'refactor',
  'perf', 'test', 'build', 'ci', 'chore', 'revert',
];
const MAX_HEADER = 72;

// type(scope)!: subject  — scope and ! are optional; capture each part.
const HEADER_RE = /^(?<type>[a-z]+)(?:\((?<scope>[^()\s]+)\))?(?<bang>!)?: (?<subject>.+)$/;

export function lintHeader(header) {
  const failures = [];
  if (typeof header !== 'string' || header.length === 0) {
    return { ok: false, failures: ['header is empty'] };
  }
  if (header.length > MAX_HEADER) {
    failures.push(`header is ${header.length} chars (max ${MAX_HEADER})`);
  }
  const m = header.match(HEADER_RE);
  if (!m) {
    failures.push('does not match "type(scope)!: subject" (need a lowercase type and ": " separator)');
    return { ok: false, failures };
  }
  const { type, scope, subject } = m.groups;
  if (!ALLOWED_TYPES.includes(type)) {
    failures.push(`type "${type}" is not allowed (use one of: ${ALLOWED_TYPES.join(', ')})`);
  }
  if (scope !== undefined && scope !== scope.toLowerCase()) {
    failures.push(`scope "${scope}" must be lowercase`);
  }
  if (subject.trim().length === 0) {
    failures.push('subject is empty');
  }
  if (/^[A-Z]/.test(subject)) {
    failures.push('subject should start lowercase (imperative mood)');
  }
  if (/\.$/.test(subject)) {
    failures.push('subject must not end with a period');
  }
  return { ok: failures.length === 0, failures };
}

function check(label, header) {
  const trimmed = String(header).split('\n')[0].trimEnd();
  const { ok, failures } = lintHeader(trimmed);
  if (ok) console.log(`✓ ${label}: valid commit header`);
  else {
    console.error(`✗ ${label}: "${trimmed}"`);
    failures.forEach((f) => console.error(`    - ${f}`));
  }
  return ok;
}

function selftest() {
  const cases = {
    'valid feat':          'feat: add cursor pagination',
    'valid scope':         'feat(orders): add cursor pagination',
    'valid breaking':      'refactor(api)!: drop v0 auth header',
    'valid fix':           'fix(auth): treat expired token as 401',
    'invalid type':        'feature: add thing',
    'invalid capitalized': 'feat: Add thing',
    'invalid period':      'fix: handle null cursor.',
    'invalid no-colon':    'feat add thing',
    'invalid too-long':    'feat: ' + 'x'.repeat(80),
    'invalid upper scope': 'feat(API): add thing',
  };
  let allExpected = true;
  for (const [name, header] of Object.entries(cases)) {
    const { ok } = lintHeader(header);
    const shouldPass = name.startsWith('valid');
    const correct = ok === shouldPass;
    allExpected &&= correct;
    console.log(
      `${correct ? '✓' : '✗'} selftest ${name}: ` +
      `${ok ? 'valid' : 'invalid'} (expected ${shouldPass ? 'valid' : 'invalid'})`
    );
  }
  process.exit(allExpected ? 0 : 1);
}

const arg = process.argv[2];
if (arg === '--selftest') selftest();
else if (arg) process.exit(check('header', arg) ? 0 : 1);
else {
  let buf = '';
  process.stdin.on('data', (c) => (buf += c));
  process.stdin.on('end', () => process.exit(check('stdin', buf) ? 0 : 1));
}

#!/usr/bin/env node
// Runnable check: given a set of requirements and a set of test cases, report which
// requirements have NO covering test. Maps a traceability matrix to a build gate, so an
// untested requirement can fail CI instead of shipping silently.
//
// Input JSON shape:
//   {
//     "requirements": [ { "id": "R1", "title": "...", "priority": "high" }, ... ],
//     "testCases":    [ { "id": "t1", "requirement": "R1" }, ... ]
//   }
// A test "covers" a requirement when its `requirement` field (string or array) matches the
// requirement's `id`.
//
// Usage:
//   node coverage-gaps.mjs '<json>'            # check a literal JSON string
//   echo '<json>' | node coverage-gaps.mjs     # check from stdin
//   node coverage-gaps.mjs --selftest          # run built-in test cases
//
// Exit code: 0 = every requirement is covered; 1 = gaps found / invalid input / selftest failed.

export function findCoverageGaps(model) {
  const requirements = Array.isArray(model?.requirements) ? model.requirements : [];
  const testCases = Array.isArray(model?.testCases) ? model.testCases : [];

  const covered = new Set();
  for (const tc of testCases) {
    const refs = Array.isArray(tc?.requirement) ? tc.requirement : [tc?.requirement];
    for (const r of refs) {
      if (typeof r === 'string' && r.length > 0) covered.add(r);
    }
  }

  const gaps = requirements
    .filter((req) => typeof req?.id === 'string')
    .filter((req) => !covered.has(req.id))
    .map((req) => ({ id: req.id, title: req.title ?? '', priority: req.priority ?? 'unspecified' }));

  return { total: requirements.length, coveredCount: requirements.length - gaps.length, gaps };
}

function report(label, json) {
  let model;
  try {
    model = typeof json === 'string' ? JSON.parse(json) : json;
  } catch {
    console.error(`x ${label}: invalid JSON`);
    return false;
  }
  const { total, coveredCount, gaps } = findCoverageGaps(model);
  if (gaps.length === 0) {
    console.log(`ok ${label}: all ${total} requirement(s) covered`);
    return true;
  }
  console.error(`x ${label}: ${gaps.length} of ${total} requirement(s) uncovered (${coveredCount} covered):`);
  for (const g of gaps) {
    console.error(`    - ${g.id} [${g.priority}] ${g.title}`.trimEnd());
  }
  return false;
}

function selftest() {
  const fullCoverage = {
    requirements: [
      { id: 'R1', title: 'Totals include tax', priority: 'high' },
      { id: 'R2', title: 'Expired coupons rejected', priority: 'medium' },
    ],
    testCases: [
      { id: 't1', requirement: 'R1' },
      { id: 't2', requirement: ['R1', 'R2'] }, // array form also covers R2
    ],
  };
  const withGaps = {
    requirements: [
      { id: 'R1', title: 'Totals include tax', priority: 'high' },
      { id: 'R2', title: 'Expired coupons rejected', priority: 'medium' },
      { id: 'R3', title: 'Coupon min cart $50', priority: 'high' },
    ],
    testCases: [
      { id: 't1', requirement: 'R1' }, // R2 and R3 left uncovered
    ],
  };

  const a = findCoverageGaps(fullCoverage);
  const b = findCoverageGaps(withGaps);

  const checks = [
    ['full-coverage reports zero gaps', a.gaps.length === 0],
    ['full-coverage counts all covered', a.coveredCount === 2 && a.total === 2],
    ['gaps case finds two gaps', b.gaps.length === 2],
    ['gaps case identifies R2 and R3', b.gaps.map((g) => g.id).join(',') === 'R2,R3'],
    ['gaps case counts one covered', b.coveredCount === 1 && b.total === 3],
  ];

  let allPass = true;
  for (const [name, ok] of checks) {
    allPass &&= ok;
    console.log(`${ok ? 'ok' : 'x'} selftest: ${name}`);
  }
  process.exit(allPass ? 0 : 1);
}

const arg = process.argv[2];
if (arg === '--selftest') selftest();
else if (arg) process.exit(report('input', arg) ? 0 : 1);
else {
  let buf = '';
  process.stdin.on('data', (c) => (buf += c));
  process.stdin.on('end', () => process.exit(report('stdin', buf) ? 0 : 1));
}

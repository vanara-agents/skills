#!/usr/bin/env node
// Normalizes a list of raw vulnerability findings: dedupes and sorts by
// triaged severity. Demonstrates the triage step (raw output -> ranked list)
// from this agent package. Zero dependencies; Node built-ins only.
//
// Usage:
//   node parse-scan-results.mjs findings.json     # read a JSON array from a file
//   cat findings.json | node parse-scan-results.mjs   # read from stdin
//   node parse-scan-results.mjs --selftest        # run built-in tests (exit 0/1)
//
// Input: JSON array of findings, each with at least { id, severity }.
// Optional fields: package, location, cvss, reachability, fix, bucket.
// Output: { total, deduped, bySeverity, findings } sorted critical -> info.

const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low', 'info'];
const SEVERITY_RANK = Object.fromEntries(SEVERITY_ORDER.map((s, i) => [s, i]));

function normalizeSeverity(sev) {
  const s = String(sev ?? '').toLowerCase().trim();
  return SEVERITY_RANK[s] !== undefined ? s : 'info';
}

// Dedup key: advisory id + affected package/location. The same CVE reported by
// multiple tools or via multiple paths collapses to one finding.
function dedupKey(f) {
  const id = String(f.id ?? 'unknown').toLowerCase();
  const where = String(f.package ?? f.location ?? '').toLowerCase();
  return `${id}::${where}`;
}

export function parseFindings(rawList) {
  if (!Array.isArray(rawList)) {
    throw new Error('input must be a JSON array of findings');
  }

  const seen = new Map();
  for (const raw of rawList) {
    const finding = { ...raw, severity: normalizeSeverity(raw.severity) };
    const key = dedupKey(finding);
    if (!seen.has(key)) {
      seen.set(key, finding);
    } else {
      // Keep the higher severity when duplicates disagree.
      const existing = seen.get(key);
      if (SEVERITY_RANK[finding.severity] < SEVERITY_RANK[existing.severity]) {
        seen.set(key, finding);
      }
    }
  }

  const findings = [...seen.values()].sort((a, b) => {
    const d = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    if (d !== 0) return d;
    return String(a.id ?? '').localeCompare(String(b.id ?? ''));
  });

  const bySeverity = Object.fromEntries(SEVERITY_ORDER.map((s) => [s, 0]));
  for (const f of findings) bySeverity[f.severity] += 1;

  return { total: rawList.length, deduped: findings.length, bySeverity, findings };
}

function run(json) {
  let parsed;
  try {
    parsed = JSON.parse(json);
  } catch {
    console.error('✗ invalid JSON input');
    process.exit(1);
  }
  try {
    const result = parseFindings(parsed);
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(`✗ ${err.message}`);
    process.exit(1);
  }
}

function selftest() {
  const raw = [
    { id: 'CVE-1', package: 'lodash@4.17.15', severity: 'high' },
    { id: 'CVE-1', package: 'lodash@4.17.15', severity: 'medium' }, // dup, lower sev
    { id: 'CVE-2', package: 'axios@0.21.0', severity: 'CRITICAL' },  // case-insensitive
    { id: 'CVE-3', package: 'jest@29', severity: 'low' },
    { id: 'SECRET-1', location: 'config/x.env', severity: 'critical' },
    { id: 'CVE-4', package: 'debug@4', severity: 'weird' },          // -> info
  ];

  const result = parseFindings(raw);
  const checks = [];

  // Dedup: 6 raw -> 5 unique (the two CVE-1 collapse).
  checks.push(['dedupes duplicates', result.total === 6 && result.deduped === 5]);

  // Duplicate keeps the higher severity (high, not medium).
  const cve1 = result.findings.find((f) => f.id === 'CVE-1');
  checks.push(['dup keeps higher severity', cve1 && cve1.severity === 'high']);

  // Severity counts after normalization.
  checks.push(['critical count is 2', result.bySeverity.critical === 2]);
  checks.push(['high count is 1', result.bySeverity.high === 1]);
  checks.push(['unknown severity -> info', result.bySeverity.info === 1]);

  // Sort order: criticals first, info last.
  const order = result.findings.map((f) => f.severity);
  const sorted = [...order].sort(
    (a, b) => SEVERITY_RANK[a] - SEVERITY_RANK[b]
  );
  checks.push(['sorted by severity', JSON.stringify(order) === JSON.stringify(sorted)]);
  checks.push(['first finding is critical', order[0] === 'critical']);
  checks.push(['last finding is info', order[order.length - 1] === 'info']);

  let ok = true;
  for (const [label, passed] of checks) {
    console.log(`${passed ? '✓' : '✗'} ${label}`);
    ok &&= passed;
  }
  process.exit(ok ? 0 : 1);
}

const arg = process.argv[2];
if (arg === '--selftest') {
  selftest();
} else if (arg) {
  const { readFileSync } = await import('node:fs');
  run(readFileSync(arg, 'utf8'));
} else {
  let buf = '';
  process.stdin.on('data', (c) => (buf += c));
  process.stdin.on('end', () => run(buf));
}

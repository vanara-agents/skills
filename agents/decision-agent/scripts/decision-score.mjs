#!/usr/bin/env node
/**
 * decision-score — validate and score a weighted decision matrix.
 * Zero dependencies. Node >= 18, ESM.
 *
 *   node decision-score.mjs <matrix.json>   # score a decision matrix
 *   node decision-score.mjs --selftest      # run embedded fixtures, exit 0/1
 *
 * matrix.json shape:
 * {
 *   "decision": "Datastore for the events service",
 *   "constraints": ["must run self-hosted"],           // informational
 *   "criteria": [ { "name": "write throughput", "weight": 0.4 }, ... ],  // weights sum to 1.0
 *   "options":  [ { "name": "Postgres", "scores": { "write throughput": 3, ... } },
 *                 { "name": "Kafka+KV", "eliminated": true, "reason": "fails self-hosted constraint" } ]
 * }
 */
import { readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const WEIGHT_SUM_TOLERANCE = 0.001;
const CLOSE_MARGIN = 0.25; // weighted gap below this = too close to call on these weights

/** Return an array of human-readable validation errors (empty = valid). */
export function validate(m) {
  if (!m || typeof m !== 'object') return ['matrix is not an object'];
  const errors = [];
  if (!Array.isArray(m.criteria) || m.criteria.length === 0) errors.push('criteria: must be a non-empty array');
  if (!Array.isArray(m.options) || m.options.length === 0) errors.push('options: must be a non-empty array');
  if (errors.length) return errors;

  const weightSum = m.criteria.reduce((s, c) => s + (Number(c.weight) || 0), 0);
  if (Math.abs(weightSum - 1) > WEIGHT_SUM_TOLERANCE) errors.push(`criteria weights must sum to 1.0 (got ${weightSum.toFixed(3)})`);
  for (const c of m.criteria) {
    if (!c.name) errors.push('a criterion is missing "name"');
    if (typeof c.weight !== 'number' || c.weight < 0) errors.push(`criterion "${c.name}": weight must be a non-negative number`);
  }
  const active = m.options.filter((o) => !o.eliminated);
  if (active.length === 0) errors.push('every option is eliminated — nothing to score');
  for (const o of active) {
    if (!o.name) errors.push('an active option is missing "name"');
    for (const c of m.criteria) {
      const s = o.scores?.[c.name];
      if (typeof s !== 'number') errors.push(`option "${o.name}": missing score for "${c.name}"`);
      else if (s < 1 || s > 5) errors.push(`option "${o.name}": score for "${c.name}" must be 1–5 (got ${s})`);
    }
  }
  return errors;
}

/** Compute weighted totals, ranking, margin, decisive criterion, and sensitivity. */
export function score(m) {
  const active = m.options.filter((o) => !o.eliminated);
  const ranking = active
    .map((o) => ({ name: o.name, total: m.criteria.reduce((s, c) => s + c.weight * o.scores[c.name], 0) }))
    .sort((a, b) => b.total - a.total);

  const result = {
    decision: m.decision ?? null,
    ranking,
    eliminated: m.options.filter((o) => o.eliminated).map((o) => ({ name: o.name, reason: o.reason ?? null })),
  };
  if (ranking.length >= 2) {
    const [top, second] = ranking;
    result.margin = top.total - second.total;
    const topOpt = active.find((o) => o.name === top.name);
    const secOpt = active.find((o) => o.name === second.name);
    // decisive criterion = the largest weighted score gap between the top two options
    let decisive = null;
    for (const c of m.criteria) {
      const edge = c.weight * (topOpt.scores[c.name] - secOpt.scores[c.name]);
      if (decisive === null || Math.abs(edge) > Math.abs(decisive.edge)) decisive = { criterion: c.name, edge };
    }
    result.decisive = decisive;
    // Sensitive if the win sits inside the noise band, or a single criterion carries the whole margin.
    result.sensitive = result.margin < CLOSE_MARGIN || (decisive.edge > 0 && result.margin <= decisive.edge + WEIGHT_SUM_TOLERANCE);
  }
  return result;
}

function render(r) {
  const lines = [];
  if (r.decision) lines.push(`decision: ${r.decision}`, '');
  lines.push('RANKING (weighted total):');
  r.ranking.forEach((o, i) => lines.push(`  ${i + 1}. ${o.name.padEnd(24)} ${o.total.toFixed(3)}`));
  for (const e of r.eliminated) lines.push(`  ✗  ${e.name.padEnd(24)} eliminated${e.reason ? ` — ${e.reason}` : ''}`);
  if (r.ranking.length >= 2) {
    lines.push('', `margin (#1 − #2): ${r.margin.toFixed(3)}`);
    if (r.decisive) lines.push(`decisive criterion: "${r.decisive.criterion}" (${r.decisive.edge >= 0 ? '+' : ''}${r.decisive.edge.toFixed(3)} for #1)`);
    lines.push(r.sensitive
      ? `⚠ close / sensitive — the winner does not clearly survive a re-weighting. Decide on the trade-off, or get better evidence on "${r.decisive?.criterion}".`
      : 'robust — #1 leads by more than the noise band and does not hinge on a single criterion.');
  }
  return lines.join('\n');
}

function selftest() {
  const fixture = {
    decision: 'Datastore for the events service',
    criteria: [
      { name: 'write throughput', weight: 0.4 },
      { name: 'operability', weight: 0.35 },
      { name: 'cost', weight: 0.25 },
    ],
    options: [
      { name: 'Postgres', scores: { 'write throughput': 3, operability: 5, cost: 5 } },
      { name: 'Cassandra', scores: { 'write throughput': 5, operability: 2, cost: 3 } },
      { name: 'Kafka+KV', eliminated: true, reason: 'fails self-hosted constraint' },
    ],
  };
  const r = score(fixture);
  const bad = { criteria: [{ name: 'a', weight: 0.5 }, { name: 'b', weight: 0.2 }], options: [{ name: 'X', scores: { a: 3, b: 3 } }] };
  const bad2 = { criteria: [{ name: 'a', weight: 1 }], options: [{ name: 'X', scores: { a: 9 } }] };
  const checks = [
    ['fixture validates', validate(fixture).length === 0, validate(fixture).join('; ')],
    ['Postgres wins', r.ranking[0].name === 'Postgres', r.ranking[0].name],
    ['Postgres total = 4.200', Math.abs(r.ranking[0].total - 4.2) < 1e-9, String(r.ranking[0].total)],
    ['Cassandra total = 3.450', Math.abs(r.ranking[1].total - 3.45) < 1e-9, String(r.ranking[1].total)],
    ['eliminated recorded', r.eliminated.length === 1 && r.eliminated[0].name === 'Kafka+KV', JSON.stringify(r.eliminated)],
    ['decisive = operability', r.decisive.criterion === 'operability', r.decisive?.criterion],
    ['bad weights rejected', validate(bad).some((e) => /sum to 1/.test(e)), validate(bad).join('; ')],
    ['out-of-range score rejected', validate(bad2).some((e) => /1–5/.test(e)), validate(bad2).join('; ')],
  ];
  let failed = 0;
  for (const [name, ok, detail] of checks) {
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok ? '' : ` — ${detail}`}`);
    if (!ok) failed++;
  }
  console.log(failed === 0 ? '\ndecision-score --selftest: all checks passed' : `\ndecision-score --selftest: ${failed} check(s) failed`);
  return failed === 0 ? 0 : 1;
}

function main(argv) {
  if (argv.includes('--selftest')) return selftest();
  const file = argv.find((a) => !a.startsWith('--'));
  if (!file) { console.error('usage: decision-score <matrix.json> | --selftest'); return 2; }
  let m;
  try { m = JSON.parse(readFileSync(file, 'utf8')); }
  catch (e) { console.error(`decision-score: cannot read/parse ${file}: ${e.message}`); return 2; }
  const errs = validate(m);
  if (errs.length) { console.error('INVALID decision matrix:'); for (const e of errs) console.error(`  - ${e}`); return 1; }
  console.log(render(score(m)));
  return 0;
}

const isDirect = (() => {
  try { return process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url); }
  catch { return false; }
})();
if (isDirect) process.exit(main(process.argv.slice(2)));

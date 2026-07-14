#!/usr/bin/env node
// suggest-index.mjs
// Propose a composite B-tree index from a query's WHERE / ORDER BY columns,
// honoring two rules from this skill:
//   1. equality-before-range  -- equality columns first, then a single range column
//   2. leftmost-prefix        -- the proposed order is what the index can seek on
// Equality columns are ordered most-selective-first when a "cardinality" hint is
// given (higher distinct-count => more selective => leads). ORDER BY columns not
// already in the key are appended so the sort can be served from the index.
//
// Zero dependencies. Node built-ins only.
//
// Usage:
//   node suggest-index.mjs '<json-spec>'            # propose from a literal JSON spec
//   echo '<json-spec>' | node suggest-index.mjs     # propose from stdin
//   node suggest-index.mjs --selftest               # run built-in assertions (exit 0/1)
//
// Spec shape:
//   {
//     "table": "orders",
//     "predicates": [
//       { "column": "tenant_id",  "op": "eq",    "cardinality": 5000 },
//       { "column": "status",     "op": "eq",    "cardinality": 5 },
//       { "column": "created_at", "op": "range" }
//     ],
//     "orderBy": [ { "column": "created_at", "direction": "desc" } ]
//   }
// op is one of: "eq" (equality) | "range" (>, <, BETWEEN, LIKE 'x%').

const RANGE_OPS = new Set(['range', 'gt', 'lt', 'gte', 'lte', 'between', 'like_prefix']);
const EQ_OPS = new Set(['eq', 'equals', '=']);

export function suggestIndex(spec) {
  const warnings = [];
  if (!spec || typeof spec !== 'object') throw new Error('spec must be an object');

  const table = typeof spec.table === 'string' && spec.table ? spec.table : 'my_table';
  const predicates = Array.isArray(spec.predicates) ? spec.predicates : [];
  const orderBy = Array.isArray(spec.orderBy) ? spec.orderBy : [];

  const equality = predicates.filter((p) => EQ_OPS.has(p.op));
  const ranges = predicates.filter((p) => RANGE_OPS.has(p.op));
  const unknown = predicates.filter((p) => !EQ_OPS.has(p.op) && !RANGE_OPS.has(p.op));
  for (const p of unknown) warnings.push(`predicate on "${p.column}" has unknown op "${p.op}"; ignored`);

  // 1. Equality columns first, most-selective (highest cardinality) first.
  //    Stable: ties and missing cardinality preserve input order.
  const eqSorted = equality
    .map((p, i) => ({ p, i }))
    .sort((a, b) => {
      const ca = num(a.p.cardinality);
      const cb = num(b.p.cardinality);
      if (ca !== cb) return cb - ca; // higher cardinality leads
      return a.i - b.i;
    })
    .map((x) => x.p.column);

  // 2. At most ONE range column is useful in the seek; the rest become filters.
  let rangeCol = null;
  if (ranges.length > 0) {
    rangeCol = ranges[0].column;
    for (let i = 1; i < ranges.length; i++) {
      warnings.push(
        `multiple range predicates; only "${rangeCol}" can seek -- "${ranges[i].column}" becomes a filter`,
      );
    }
  }

  // 3. ORDER BY columns not already present, appended so the sort is index-served.
  const columns = [...eqSorted];
  if (rangeCol) columns.push(rangeCol);
  for (const o of orderBy) {
    const col = typeof o === 'string' ? o : o && o.column;
    if (col && !columns.includes(col)) columns.push(col);
  }

  if (columns.length === 0) {
    warnings.push('no usable equality/range/order-by columns found; nothing to index');
    return { table, columns, ddl: null, warnings };
  }

  // Carry ORDER BY direction onto matching trailing columns (DESC needs it stated).
  const dir = new Map();
  for (const o of orderBy) {
    if (o && typeof o === 'object' && o.column && o.direction) {
      dir.set(o.column, String(o.direction).toLowerCase() === 'desc' ? 'DESC' : 'ASC');
    }
  }
  const rendered = columns.map((c) => (dir.get(c) === 'DESC' ? `${c} DESC` : c));

  const indexName = `ix_${table}_${columns.join('_')}`.slice(0, 63);
  const ddl = `CREATE INDEX CONCURRENTLY ${indexName}\n    ON ${table} (${rendered.join(', ')});`;

  if (rangeCol && eqSorted.length === 0) {
    warnings.push('no equality columns -- a leading range column limits selectivity; verify it pays off');
  }

  return { table, columns, ddl, warnings };
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : -1; // missing cardinality sorts last (-1)
}

function run(json) {
  let spec;
  try {
    spec = typeof json === 'string' ? JSON.parse(json) : json;
  } catch {
    console.error('✗ invalid JSON spec');
    return false;
  }
  let result;
  try {
    result = suggestIndex(spec);
  } catch (e) {
    console.error(`✗ ${e.message}`);
    return false;
  }
  console.log(`Proposed index columns: (${result.columns.join(', ')})`);
  if (result.ddl) console.log(result.ddl);
  for (const w of result.warnings) console.log(`! ${w}`);
  return true;
}

function selftest() {
  const cases = [
    {
      name: 'equality-before-range + selectivity ordering',
      spec: {
        table: 'orders',
        predicates: [
          { column: 'status', op: 'eq', cardinality: 5 },
          { column: 'tenant_id', op: 'eq', cardinality: 5000 },
          { column: 'created_at', op: 'range' },
        ],
        orderBy: [{ column: 'created_at', direction: 'desc' }],
      },
      // tenant_id (higher cardinality) leads, then status, then the range/sort col
      expectColumns: ['tenant_id', 'status', 'created_at'],
      expectDdlIncludes: 'created_at DESC',
    },
    {
      name: 'order-by column appended when not already in key',
      spec: {
        table: 'events',
        predicates: [{ column: 'user_id', op: 'eq' }],
        orderBy: [{ column: 'occurred_at', direction: 'asc' }],
      },
      expectColumns: ['user_id', 'occurred_at'],
    },
    {
      name: 'preserve input order when no cardinality hints',
      spec: {
        table: 'memberships',
        predicates: [
          { column: 'tenant_id', op: 'eq' },
          { column: 'role', op: 'eq' },
        ],
      },
      expectColumns: ['tenant_id', 'role'],
    },
    {
      name: 'second range predicate warns and becomes a filter',
      spec: {
        table: 'orders',
        predicates: [
          { column: 'tenant_id', op: 'eq' },
          { column: 'created_at', op: 'range' },
          { column: 'total_cents', op: 'range' },
        ],
      },
      expectColumns: ['tenant_id', 'created_at'],
      expectWarningIncludes: 'total_cents',
    },
    {
      name: 'empty predicates yields no index',
      spec: { table: 'orders', predicates: [], orderBy: [] },
      expectColumns: [],
      expectNullDdl: true,
    },
  ];

  let allOk = true;
  for (const c of cases) {
    const r = suggestIndex(c.spec);
    let ok = arrEq(r.columns, c.expectColumns);
    if (ok && c.expectDdlIncludes) ok = !!r.ddl && r.ddl.includes(c.expectDdlIncludes);
    if (ok && c.expectWarningIncludes) ok = r.warnings.some((w) => w.includes(c.expectWarningIncludes));
    if (ok && c.expectNullDdl) ok = r.ddl === null;
    allOk = allOk && ok;
    console.log(
      `${ok ? '✓' : '✗'} ${c.name}: got (${r.columns.join(', ')})` +
        (ok ? '' : ` -- expected (${c.expectColumns.join(', ')})`),
    );
  }
  console.log(allOk ? 'All selftests passed.' : 'Selftest FAILURES present.');
  process.exit(allOk ? 0 : 1);
}

function arrEq(a, b) {
  return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => v === b[i]);
}

const arg = process.argv[2];
if (arg === '--selftest') selftest();
else if (arg) process.exit(run(arg) ? 0 : 1);
else {
  let buf = '';
  process.stdin.on('data', (c) => (buf += c));
  process.stdin.on('end', () => process.exit(run(buf) ? 0 : 1));
}

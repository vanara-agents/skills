# Selectivity & Cardinality

These two concepts decide whether an index is worth building and which column should lead a composite.

## Definitions

- **Cardinality** — the number of distinct values in a column. `user_id` has high cardinality; a boolean
  `is_active` has cardinality 2.
- **Selectivity** — the fraction of rows a predicate keeps. `WHERE id = 42` on a unique column is maximally
  selective (1 row). `WHERE is_active = true` on a table that's 90% active is poorly selective (0.9 of
  rows).

An index is worthwhile in proportion to selectivity. Seeking to retrieve 0.001 of a table is a massive
win; seeking to retrieve 0.5 of it is slower than a sequential scan because of random heap fetches — and
the planner will ignore the index, correctly.

## How the planner decides

Databases keep **statistics** per column: number of distinct values, most-common-values (MCV) list, and a
**histogram** of the value distribution. From these it estimates how many rows a predicate returns and
compares the cost of an index scan (seek + random heap I/O) against a sequential scan (streaming reads).
If the estimate is wrong because stats are stale, it makes the wrong choice — run `ANALYZE <table>` after
bulk loads or large deletes to refresh them.

```sql
ANALYZE orders;                              -- refresh statistics
SELECT n_distinct, most_common_vals
FROM pg_stats WHERE tablename = 'orders' AND attname = 'status';
```

## Choosing the leading composite column

Lead with the **most selective equality column the query filters on**. For
`WHERE tenant_id = ? AND status = ?`:

- If a tenant has thousands of orders and `status` has 5 values, `tenant_id` is more selective → lead with
  it: `(tenant_id, status)`.
- The leading column must be one the query constrains with equality (leftmost-prefix rule), so selectivity
  is the tiebreaker among eligible equality columns, not a free choice.

## Skew and partial indexes

Selectivity can differ wildly **per value**. If `status = 'archived'` is 95% of rows but `status =
'pending'` is 0.1%, an index on `status` is useless for the former and gold for the latter. A **partial
index** targets exactly the selective slice and stays tiny:

```sql
CREATE INDEX ix_orders_pending
ON orders (tenant_id, created_at)
WHERE status = 'pending';
```

This index only contains pending rows, so it's small, cheap to maintain, and the planner uses it whenever
the query includes `status = 'pending'`. Partial indexes are the standard fix for queue/worker tables
where you repeatedly scan for a rare state.

## Rules of thumb

- Unique or near-unique column in the predicate → index almost always wins.
- Predicate keeps more than ~10–20% of the table → index probably loses to a scan.
- Low-cardinality column → only useful inside a composite, or as a partial-index predicate.
- Re-`ANALYZE` after big data shifts; most "the index isn't being used" reports are stale statistics.

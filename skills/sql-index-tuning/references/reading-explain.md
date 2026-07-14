# Reading EXPLAIN / EXPLAIN ANALYZE

`EXPLAIN` prints the planner's chosen execution plan and its **estimated** costs. `EXPLAIN ANALYZE`
executes the query and adds **actual** times and row counts. Tune against `ANALYZE` — estimates are only
as good as the table statistics.

```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT id FROM orders
WHERE tenant_id = 9 AND created_at > now() - interval '7 days';
```

## Plan nodes you'll meet

| Node | Meaning | Signal |
|---|---|---|
| `Seq Scan` | read every row | bad under a selective filter on a big table — index candidate |
| `Index Scan` | seek the index, then fetch rows from the heap | good; random heap I/O remains |
| `Index Only Scan` | answer entirely from the index | best; the index is covering |
| `Bitmap Heap Scan` | gather many matches, then fetch heap pages in order | good for medium-selectivity ranges |
| `Sort` | explicit sort step | removable if an ordered index matches the `ORDER BY` |
| `Hash Join` / `Nested Loop` | join strategies | nested loop without an inner index can explode |

## The numbers that matter

- **`cost=`** — planner's unitless estimate (`startup..total`). Compare alternatives, don't read as ms.
- **`rows=` (estimate) vs `actual rows=`** — a big divergence means **stale statistics**. Run
  `ANALYZE <table>` (or `VACUUM ANALYZE`) so the planner has fresh histograms.
- **`actual time=`** — real `startup..total` milliseconds per loop. Multiply by `loops` for total.
- **`Rows Removed by Filter: N`** — rows the node read and then discarded. A large number means the index
  located far more rows than the query keeps — the leading column isn't selective enough, or a predicate
  isn't part of the index.
- **`Buffers: shared hit/read`** — `hit` is cache, `read` is disk. High `read` on a Seq Scan is the I/O
  you're trying to eliminate.

## A tuning loop

1. Run `EXPLAIN ANALYZE` on the slow query; identify the dominant node (usually a `Seq Scan` or a `Sort`).
2. Check `actual rows` returned vs scanned — confirm the query is actually selective (an index won't help
   a query that keeps most of the table).
3. Propose an index following equality-before-range and leftmost-prefix (see
   `composite-and-covering.md`, or run `scripts/suggest-index.mjs`).
4. Create it (use `CREATE INDEX CONCURRENTLY` in production to avoid locking).
5. Re-run `EXPLAIN ANALYZE`. Confirm the plan switched to `Index Scan`/`Index Only Scan`, `Rows Removed by
   Filter` dropped, and `actual time` fell. If the planner still chose a `Seq Scan`, your predicate
   probably isn't selective enough — the index won't pay off.

## Gotchas

- **`EXPLAIN` without `ANALYZE` never runs the query** — safe on writes, but shows estimates only.
- **`EXPLAIN ANALYZE` on an `INSERT`/`UPDATE`/`DELETE` executes it.** Wrap in a transaction and `ROLLBACK`.
- The first run pays cold-cache I/O; run twice to see warm timings.
- A loop count in a `Nested Loop` multiplies per-row cost — a cheap-looking inner node run 10,000 times is
  your bottleneck.

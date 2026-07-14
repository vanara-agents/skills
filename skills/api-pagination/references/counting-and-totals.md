# Counting and Totals

`COUNT(*)` is the hidden cost center of pagination. On a large Postgres table it is a full index
or heap scan — routinely slower than fetching the page itself — and the number is stale the moment
it is computed.

## Decision table

| Product need | Implementation |
|---|---|
| "Load more" / infinite scroll | No count at all — `has_more` from the +1-row trick |
| "~12,300 results" | Estimated count (below), clearly rounded in the UI |
| Exact count on small filtered sets (<10k rows) | Real `COUNT(*)`, acceptable |
| Exact count on big tables, hard requirement | Maintained counter (trigger or async rollup) |

## Estimated counts (Postgres)

```sql
-- Table-wide estimate: instant, from the planner's statistics
SELECT reltuples::bigint FROM pg_class WHERE relname = 'items';

-- Filtered estimate: run the query through EXPLAIN and parse rows=
EXPLAIN (FORMAT JSON) SELECT 1 FROM items WHERE status = 'active';
-- -> Plan.["Plan Rows"]
```

Estimates drift after bulk writes until autovacuum/analyze runs — fine for "~N results", wrong for
billing or quotas.

## Maintained counters

A trigger-updated counter table gives exact totals at O(1) read cost, but serializes writes on hot
rows (every insert contends on the same counter row). For high write rates, shard the counter
(N rows, sum on read) or roll up asynchronously and accept seconds of lag. Never compute quotas
or invoices from pagination counts — those need their own transactional bookkeeping.

## The `total_pages` trap

Exposing `total_pages` invites clients to build page links (`?page=812`), which drags you back to
deep offsets. If the UI needs a jump-to-end affordance, offer a reversed sort (`?order=asc`)
instead — last page becomes first page, at first-page cost.

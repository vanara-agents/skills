-- explain-walkthrough.sql
-- A before/after EXPLAIN ANALYZE walkthrough for the same query, showing how the
-- right composite index changes the plan. Annotations are inline (-- ...).
-- Target: PostgreSQL. The same shape applies to MySQL EXPLAIN ANALYZE.

-- ---------------------------------------------------------------------------
-- Setup: a multi-tenant orders table, ~10M rows, no useful index yet.
-- ---------------------------------------------------------------------------
CREATE TABLE orders (
    id          bigserial PRIMARY KEY,
    tenant_id   bigint      NOT NULL,
    status      text        NOT NULL,         -- 'open' | 'paid' | 'archived'
    total_cents bigint      NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now()
);
-- (assume 10M rows loaded; one tenant owns ~5k rows; ~2% are 'open')

-- The query we want to make fast: a tenant's recent open orders.
-- WHERE has two equality columns and one range column, plus an ORDER BY.

-- ===========================================================================
-- BEFORE: only the primary-key index exists.
-- ===========================================================================
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, total_cents
FROM orders
WHERE tenant_id = 9
  AND status = 'open'
  AND created_at > now() - interval '30 days'
ORDER BY created_at DESC
LIMIT 20;

-- Typical plan (abridged):
--
--  Limit  (actual time=812.4..812.4 rows=20)
--    ->  Sort  (actual rows=20 loops=1)               -- explicit sort step
--          Sort Key: created_at DESC
--          ->  Seq Scan on orders                     -- reads ALL 10M rows
--                Filter: (tenant_id = 9 AND status = 'open' AND created_at > ...)
--                Rows Removed by Filter: 9994800       -- threw away ~10M rows
--                Buffers: shared read=98112            -- heavy disk I/O
--  Execution Time: 813.1 ms
--
-- Diagnosis: Seq Scan + huge "Rows Removed by Filter" + a Sort node. The query
-- is highly selective (keeps ~100 rows of 10M) but the engine has no index to
-- seek with, so it scans everything and sorts the survivors.

-- ===========================================================================
-- THE FIX: composite index following equality-before-range + leftmost-prefix.
-- Two equality columns lead (tenant_id, status); the range/sort column last.
-- ===========================================================================
CREATE INDEX CONCURRENTLY ix_orders_tenant_status_created
    ON orders (tenant_id, status, created_at DESC);
--                ^equality  ^equality ^range + ORDER BY (matching DESC direction)

-- Refresh stats so the planner trusts the new index.
ANALYZE orders;

-- ===========================================================================
-- AFTER: re-run the identical query.
-- ===========================================================================
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, total_cents
FROM orders
WHERE tenant_id = 9
  AND status = 'open'
  AND created_at > now() - interval '30 days'
ORDER BY created_at DESC
LIMIT 20;

-- Typical plan (abridged):
--
--  Limit  (actual time=0.05..0.12 rows=20)
--    ->  Index Scan using ix_orders_tenant_status_created on orders
--          Index Cond: (tenant_id = 9 AND status = 'open' AND created_at > ...)
--          Buffers: shared hit=6                       -- a handful of cached pages
--  Execution Time: 0.18 ms                             -- ~4500x faster
--
-- Note: NO Sort node — the index is already ordered by created_at DESC, so the
-- ORDER BY is satisfied for free. "Rows Removed by Filter" is gone because the
-- Index Cond seeked straight to the matching slice.

-- ===========================================================================
-- BONUS: make it an index-only scan by covering total_cents (and id) so the
-- heap is never touched.  total_cents is payload-only -> use INCLUDE.
-- ===========================================================================
DROP INDEX CONCURRENTLY ix_orders_tenant_status_created;
CREATE INDEX CONCURRENTLY ix_orders_cover
    ON orders (tenant_id, status, created_at DESC) INCLUDE (id, total_cents);
ANALYZE orders;
-- Re-running now yields "Index Only Scan ... Heap Fetches: 0" -- no heap I/O.

-- index-ddl.sql
-- Copy-paste index DDL covering the common shapes. Target: PostgreSQL (notes
-- mark MySQL/SQL Server differences). Always create indexes CONCURRENTLY in
-- production so you don't hold an exclusive lock on the table during the build.

-- ---------------------------------------------------------------------------
-- 1. Single-column index.
--    Use for a selective equality or range on one column.
-- ---------------------------------------------------------------------------
CREATE INDEX CONCURRENTLY ix_users_email
    ON users (email);

-- ---------------------------------------------------------------------------
-- 2. Composite index: equality columns first, then ONE range column, then any
--    column needed only for ORDER BY. Serves the leftmost prefixes too:
--    (tenant_id), (tenant_id, status), and the full triple.
--    Query: WHERE tenant_id = ? AND status = ? AND created_at > ? ORDER BY created_at
-- ---------------------------------------------------------------------------
CREATE INDEX CONCURRENTLY ix_orders_tenant_status_created
    ON orders (tenant_id, status, created_at);
--             ^equality   ^equality ^range / sort

-- A separate (tenant_id) or (tenant_id, status) index would now be REDUNDANT
-- because the composite already serves those prefixes. Drop such overlaps:
-- DROP INDEX CONCURRENTLY ix_orders_tenant;   -- redundant with the composite

-- ---------------------------------------------------------------------------
-- 3. Covering index (index-only scan). INCLUDE keeps payload columns in the
--    leaf only -- they're returnable without a heap visit but don't widen the
--    tree or impose sort semantics. Use for hot read paths you've measured.
--    Query: SELECT id, total_cents FROM orders WHERE tenant_id = ? AND status = ?
-- ---------------------------------------------------------------------------
CREATE INDEX CONCURRENTLY ix_orders_cover
    ON orders (tenant_id, status) INCLUDE (id, total_cents);
-- MySQL/InnoDB has no INCLUDE: add the columns as trailing key columns instead:
--   CREATE INDEX ix_orders_cover ON orders (tenant_id, status, id, total_cents);

-- ---------------------------------------------------------------------------
-- 4. Partial index: target only the selective slice of a skewed column. Tiny
--    and cheap to maintain. Perfect for queue/worker tables scanning a rare
--    state.  Query: WHERE status = 'pending' ORDER BY created_at
-- ---------------------------------------------------------------------------
CREATE INDEX CONCURRENTLY ix_orders_pending
    ON orders (tenant_id, created_at)
    WHERE status = 'pending';

-- ---------------------------------------------------------------------------
-- 5. Expression (functional) index: needed when the query wraps the column in a
--    function, which otherwise disables a plain index.
--    Query: WHERE lower(email) = ?
-- ---------------------------------------------------------------------------
CREATE INDEX CONCURRENTLY ix_users_lower_email
    ON users (lower(email));

-- ---------------------------------------------------------------------------
-- 6. Unique composite constraint (also builds a usable index).
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX CONCURRENTLY ux_memberships_tenant_user
    ON memberships (tenant_id, user_id);

-- ---------------------------------------------------------------------------
-- Housekeeping: find unused indexes (pure write tax) and drop them.
-- ---------------------------------------------------------------------------
-- SELECT relname AS table, indexrelname AS index, idx_scan AS scans
-- FROM pg_stat_user_indexes
-- WHERE idx_scan = 0          -- never used since stats reset
-- ORDER BY pg_relation_size(indexrelid) DESC;

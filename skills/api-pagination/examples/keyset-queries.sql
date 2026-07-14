-- Keyset pagination: canonical queries (Postgres syntax).

-- The supporting index. Column order and direction must match the ORDER BY exactly.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_items_created_id
  ON items (created_at DESC, id DESC);

-- Page 1 (no cursor): newest first, page_size 50, +1 row to detect has_more.
SELECT id, created_at, title
FROM items
WHERE tenant_id = $1
ORDER BY created_at DESC, id DESC
LIMIT 51;

-- Page N (cursor decoded to ($2 = created_at, $3 = id) of the last row seen).
-- Row-value comparison keeps the composite ordering correct in one clause.
SELECT id, created_at, title
FROM items
WHERE tenant_id = $1
  AND (created_at, id) < ($2, $3)
ORDER BY created_at DESC, id DESC
LIMIT 51;

-- Verify the index is used (look for "Index Scan ... idx_items_created_id",
-- no Sort node, and rows examined ≈ LIMIT):
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, created_at, title
FROM items
WHERE tenant_id = $1 AND (created_at, id) < (now(), 2147483647)
ORDER BY created_at DESC, id DESC
LIMIT 51;

-- Ascending variant (jump-to-oldest without deep offsets): flip both the
-- comparison and the sort, same index scanned backwards.
SELECT id, created_at, title
FROM items
WHERE tenant_id = $1 AND (created_at, id) > ($2, $3)
ORDER BY created_at ASC, id ASC
LIMIT 51;

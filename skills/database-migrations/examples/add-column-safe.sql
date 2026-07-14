-- Safe, batched, reversible migration: add orders.priority with a backfill.
-- Demonstrates: fail-fast lock, additive nullable add, batched backfill outside
-- the schema transaction, NOT NULL via validated CHECK, and a real down-migration.
--
-- == UP =====================================================================

-- Fail fast instead of queueing behind live traffic.
SET lock_timeout = '3s';

-- Step 1 (Expand): additive, nullable, metadata-only. Old code is unaffected.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS priority int NULL;

-- Step 2 (Migrate): backfill existing rows in bounded batches.
-- Run this loop in the app/runner, NOT in the schema transaction, committing
-- between batches. Repeat until 0 rows are affected. WHERE ... IS NULL makes it
-- idempotent and resumable after a partial failure.
--   UPDATE orders
--   SET priority = 0
--   WHERE id IN (
--     SELECT id FROM orders WHERE priority IS NULL ORDER BY id LIMIT 5000
--   );

-- Step 3: enforce NOT NULL without a blocking validating scan.
ALTER TABLE orders
  ADD CONSTRAINT orders_priority_nn CHECK (priority IS NOT NULL) NOT VALID;
-- After the backfill confirms no NULLs remain:
ALTER TABLE orders VALIDATE CONSTRAINT orders_priority_nn;

-- == DOWN ===================================================================
-- Reversible: the column was newly added and the constraint is ours to drop.
-- No data loss, because nothing depended on this column before this migration.

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_priority_nn;
ALTER TABLE orders DROP COLUMN IF EXISTS priority;

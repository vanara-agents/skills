# Zero-Downtime Change Recipes

Per-operation guidance: which DDL is safe, which rewrites/locks the table, and the safe alternative.
Examples use PostgreSQL syntax; the *principles* (don't hold long locks, batch backfills, additive-first)
apply to MySQL/MariaDB too, though the exact lock behaviour differs by engine and version.

## Add a column

```sql
-- SAFE: nullable add is metadata-only.
ALTER TABLE orders ADD COLUMN priority int NULL;

-- SAFE on modern Postgres: a CONSTANT default is metadata-only (no rewrite).
ALTER TABLE orders ADD COLUMN status text NOT NULL DEFAULT 'open';

-- UNSAFE: a VOLATILE default forces a full table rewrite under an exclusive lock.
ALTER TABLE orders ADD COLUMN token uuid NOT NULL DEFAULT gen_random_uuid();
```
For a volatile default: add the column nullable, backfill in batches, then add the default + NOT NULL.

## Backfill in batches

Never `UPDATE` an entire large table in one statement — it locks every touched row, blocks writes, and
bloats WAL/replication lag. Loop in bounded chunks with short transactions:

```sql
-- Run repeatedly (in the app or a job) until 0 rows are affected.
UPDATE orders
SET priority = 0
WHERE priority IS NULL
  AND id IN (
    SELECT id FROM orders WHERE priority IS NULL ORDER BY id LIMIT 5000
  );
-- COMMIT between batches; optionally sleep to ease replica lag.
```
Keep batches small enough that each transaction is sub-second. Backfills belong **outside** the schema
migration transaction.

## Create an index

```sql
-- UNSAFE: plain CREATE INDEX takes a write lock for the whole build.
CREATE INDEX idx_orders_status ON orders (status);

-- SAFE: CONCURRENTLY builds without blocking reads/writes.
-- Caveat: cannot run inside a transaction, and a failure leaves an INVALID index to drop & retry.
CREATE INDEX CONCURRENTLY idx_orders_status ON orders (status);
```
After a failed concurrent build: `DROP INDEX CONCURRENTLY idx_orders_status;` then retry.

## Add NOT NULL safely

```sql
-- Step 1: validate new rows only, no scan, no exclusive lock.
ALTER TABLE users ADD CONSTRAINT users_email_nn CHECK (email IS NOT NULL) NOT VALID;
-- Step 2: backfill NULLs in batches (see above).
-- Step 3: validate existing rows without an exclusive lock.
ALTER TABLE users VALIDATE CONSTRAINT users_email_nn;
```

## Set lock_timeout

```sql
-- Make a migration that can't acquire its lock fail fast instead of queueing behind traffic.
SET lock_timeout = '3s';
SET statement_timeout = '0';   -- but let a long CONCURRENTLY build run
```

## Drop / rename — never one-shot in production

`DROP COLUMN`, `RENAME COLUMN`, and type changes break still-running old code. Route them through
expand/contract (`expand-contract.md`). A drop is destructive — gate it behind a backup.

## Quick reference

| Operation | One-shot safe? | Safe approach |
|---|---|---|
| Add nullable column | yes | direct |
| Add column w/ constant default | yes (modern PG) | direct |
| Add column w/ volatile default | no | nullable → backfill → default |
| Create index | no | `CONCURRENTLY` |
| Add NOT NULL | no | CHECK NOT VALID → backfill → VALIDATE |
| Rename / drop column | no | expand/contract |
| Change column type | no | new column + backfill + swap |

# Expand / Migrate / Contract

The pattern for making a breaking schema change with **zero downtime**. The insight: you cannot atomically
change schema *and* code together, so you split one logical change into a sequence of backward-compatible
deploys where old and new code always coexist safely.

## The three phases

1. **Expand** — additively introduce the new shape. The schema now supports *both* old and new. Old code
   is untouched; new code can begin targeting the new shape. This phase is always backward-compatible.
2. **Migrate** — get all data and all traffic onto the new shape:
   - deploy code that **dual-writes** (writes both old and new),
   - **backfill** existing rows in batches,
   - switch **reads** to the new shape and verify metrics/parity,
   - stop writing the old shape.
3. **Contract** — once nothing reads or writes the old shape, **remove it** in a later, separate deploy.

Each step is independently shippable and reversible until the final destructive contract.

## Worked example: rename `users.email` → `users.email_address`

A column rename in one statement breaks every still-running old instance the moment it lands. Spread it out:

### Deploy 1 — Expand
```sql
ALTER TABLE users ADD COLUMN email_address text NULL;
```
Old code ignores the new column; nothing breaks.

### Deploy 2 — Migrate
App code now writes **both** columns on every insert/update (dual-write). Backfill the old rows in batches
(see `zero-downtime-changes.md` for the batching loop):
```sql
UPDATE users
SET email_address = email
WHERE email_address IS NULL
  AND id BETWEEN :lo AND :hi;   -- repeat across id ranges
```
Then switch reads to `email_address`, verify parity (counts match, no NULLs where there shouldn't be), and
stop writing `email`.

### Deploy 3 — Contract
Only after every instance has stopped using `email`:
```sql
ALTER TABLE users DROP COLUMN email;
```
This is the one irreversible step — gate it behind a verified backup.

## Worked example: making a column `NOT NULL`

You cannot just `SET NOT NULL` on a populated table serving traffic — old code may still insert NULLs, and
the validating scan takes a lock.

1. **Expand:** add a `CHECK (col IS NOT NULL) NOT VALID` constraint — this applies to *new* rows only and
   takes no validating scan.
2. **Migrate:** deploy code that always sets the column; backfill existing NULLs in batches; then
   `ALTER TABLE t VALIDATE CONSTRAINT ...` (scans without an exclusive lock).
3. **Contract:** optionally replace with a real `SET NOT NULL` now that the data is clean, or keep the
   validated CHECK.

## Why each phase is reversible

- After Expand, drop the new (empty) column — no data lost.
- During Migrate, revert reads to the old column — both are still populated by dual-write.
- Only Contract is destructive, which is exactly why it lives in its own deploy that you can delay.

## Checklist

- [ ] New shape added nullable / non-blocking
- [ ] Dual-write deployed and confirmed on every instance
- [ ] Backfill complete and verified (no missing rows)
- [ ] Reads switched and validated against metrics
- [ ] Old-shape writes stopped everywhere
- [ ] Backup taken before the contract/drop

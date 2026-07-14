# Rollback & Safety

How to make migrations recoverable, and how to handle the changes that *can't* be cleanly undone.

## Reversible vs irreversible

A migration's `down` should restore the prior state. But "reverse the DDL" is not the same as "restore the
data." Classify every change:

| Operation | Reversible? | Notes |
|---|---|---|
| ADD COLUMN | yes | `down` = DROP COLUMN (the column was empty/new) |
| CREATE TABLE / INDEX | yes | `down` = DROP it |
| ADD CONSTRAINT | yes | `down` = DROP CONSTRAINT |
| DROP COLUMN | **no** | `down` recreates *structure*, not the deleted data |
| DROP TABLE | **no** | data is gone; only a backup restores it |
| TRUNCATE | **no** | not a schema change at all; deletes all rows irrecoverably |
| Type change with data loss | **no** | narrowing/casting can lose precision |

For irreversible operations, a fake "reversing" `down` is *worse than none* — it gives false confidence
while the data is already lost. Mark them explicitly irreversible and rely on backups.

## The backup rule

Before any **destructive** migration (drop/truncate/lossy type change):

1. Take a verified backup or snapshot **immediately before** the migration (point-in-time recovery window
   confirmed, or a fresh logical/physical dump).
2. Confirm you can actually restore it (an untested backup is a hope, not a plan).
3. Run the destructive step in its **own migration**, separate from non-destructive work, so a rollback of
   the safe parts doesn't force you to touch the dangerous one.

## Forward-fix over rollback

In production, rolling *back* a migration that already ran against live data is often more dangerous than
rolling *forward* with a corrective migration. Reasons:

- The `down` may itself be slow/locking on a now-larger table.
- Code already deployed may depend on the new schema.
- Reverting can discard data written since the migration ran.

Keep `down` migrations for local dev and staging; in prod, prefer a new forward migration that fixes the
problem. Design changes (via expand/contract) so a forward fix is always available.

## Dry-run discipline

- Run the migration on a **production-like copy** (similar row counts, indexes, and load), not an empty dev
  DB.
- **Time it.** A backfill that takes 30s on 10k staging rows can take hours on 50M prod rows.
- Watch lock waits and replication lag during the dry run; that's where surprises hide.
- For long backfills, prove the batch loop terminates and that a mid-run failure can be safely resumed
  (idempotent: `WHERE col IS NULL`).

## Idempotency & partial failure

A migration may die halfway (timeout, deploy abort). Make re-runs safe:

```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS priority int NULL;
DROP INDEX IF EXISTS idx_orders_old;
```
Backfills keyed on `WHERE col IS NULL` naturally resume from where they stopped.

## Pre-ship checklist

- [ ] Every step classified reversible or irreversible
- [ ] `down` provided for reversible steps; irreversible ones flagged, not faked
- [ ] Destructive steps isolated in their own migration
- [ ] Verified backup taken before destructive changes
- [ ] Dry-run on prod-like data, timed, lock/lag observed
- [ ] Re-run is idempotent / resumable

# Worked example — defining a custom workflow

The built-ins (fix-defect, ship-feature, harden) cover most work. This is how
a team added their own `data-migration` workflow, stage by stage.

## The need

Recurring, risky job: backfilling schema changes across tenant data. Twice it
was done by hand; the second time cost an evening.

## The workflow they wrote

```text
stages:
  1 PLAN      migration-agent drafts phases + rollback   gate: plan lists a
                                                          rollback per phase
  2 DRY-RUN   run against a prod-shaped fixture           gate: row counts
                                                          match expectations file
  3 CANARY    execute on 3 internal tenants               gate: checksums equal
                                                          dry-run predictions
  4 EXECUTE   batched run, 500 tenants per batch          gate: error rate 0,
                                                          lag < 30s, else HALT
  5 VERIFY    data-quality-auditor compares invariants    gate: zero violations
```

## What made it work

The expectations file in stage 2 — predictions written before execution give
every later stage something objective to check against. Without it, stages 3-5
would be gates in name only.

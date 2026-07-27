# Worked example — reading a checkpoint log

What `.claude/vanara-checkpoints.jsonl` looks like after a real fix-defect
run, and how to read it in review.

```text
{"run":"fx-2107","stage":"reproduce","status":"pass","evidence":"test: dup-webhook RED"}
{"run":"fx-2107","stage":"test","status":"pass","evidence":"contract test added"}
{"run":"fx-2107","stage":"patch","status":"pass","evidence":"diff 4 files"}
{"run":"fx-2107","stage":"review","status":"fail","evidence":"non-concurrent index"}
{"run":"fx-2107","stage":"patch","status":"pass","evidence":"CONCURRENTLY rewrite"}
{"run":"fx-2107","stage":"review","status":"pass","evidence":"re-review clean"}
{"run":"fx-2107","stage":"commit","status":"pass","evidence":"sha 9f2c41"}
```

## How a reviewer uses it

- The **fail line is the valuable one** — it proves the review gate has teeth.
  A log that is all-pass across many runs is a gate-smell (see
  references/gate-design.md).
- The commit cites the run id, so "was this reviewed?" has a lookup, not a
  memory.
- Two patch entries = one retry. Frequent multi-retry runs mean the patch
  stage needs better inputs, and the log shows exactly where to look.

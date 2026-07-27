# Balancing review load across a team

How to keep review fast without burning out your strongest reviewers.

## The failure mode

One senior engineer becomes the de-facto gate for everything. Latency grows,
they stop doing their own work, and review quality drops as fatigue sets in.
The agent-first flow in this pack changes the economics: the first pass is
automated, so the human pass can be distributed.

## Rotation that works

- **Round-robin within a review group**, not the whole org — reviewers need
  context continuity on a codebase area.
- **Two-tier duty:** the agent's findings triage which PRs need a senior
  (CRITICAL/HIGH present) vs any teammate (MEDIUM/LOW only).
- **Cap concurrent reviews per person** (3 is a good default). A queue beats
  a pile-up on one desk.
- **Time-box:** first human response within 4 working hours; a stale PR is
  re-routed, not re-pinged.

## Metrics that keep it honest

- Time-to-first-review and time-to-merge, weekly, by reviewer — spread, not
  just average.
- Percentage of PRs where the agent's findings were addressed BEFORE human
  review (target: >80% — that's the point of the first pass).
- Reverts per hundred merges — the outcome metric review exists to protect.

## Pitfalls

- Rotating reviewers with zero codebase context produces rubber stamps —
  keep rotation inside ownership boundaries.
- Metrics on individuals become weapons; report at team granularity.

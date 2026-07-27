# Merge queues: when "green on branch" stops being enough

The failure mode merge queues exist for, and how to adopt one without
grinding the team.

## The problem, precisely

PR A and PR B are each green against main. Both merge. Main is red —
their changes conflict SEMANTICALLY (A renamed the helper B started
calling). Frequency scales with merge rate: rare at 5 merges/day,
weekly chaos at 50.

## What a queue actually does

Serializes the final check: each PR is tested against main + everything
queued ahead of it, then merges atomically. "Green" starts meaning "green
in the world it will actually land in."

## Adoption thresholds (don't adopt early)

- < ~15 merges/day with a fast suite: skip the queue; require
  up-to-date-with-main branches instead — same guarantee, less machinery.
- Adopt when: semantic-conflict reverts appear monthly, or the
  update-rebase-rerun loop visibly taxes the team.

## Making a queue livable

- **Batching**: test 4-8 PRs as a group; on failure, bisect the batch.
  Cuts CI cost ~5× at the price of occasional bisection.
- **The suite must be fast and unflaky FIRST** — a queue amplifies flake
  pain (one flaky test now blocks everyone behind it). Fix flake rate
  <0.5% before queuing, or the queue becomes the team's enemy.
- **Emergency lane**: a documented skip-queue path for incident fixes,
  audited after use — because someone WILL need it at 3am, and the
  undocumented version is called force-push.

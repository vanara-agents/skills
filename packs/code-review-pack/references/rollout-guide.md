# Rollout Guide

Review culture changes fail when imposed all at once. The two-week sequence that lands:

## Week 1 — observation mode

- Wire `pr-summarizer` only. Zero friction, immediate value: every PR gets a map. Nobody
  argues with a summary.
- Run `code-reviewer` in **comment-only** mode (findings posted, nothing blocks). The team
  calibrates trust: are the findings real? (Tune severity thresholds now, while stakes are
  low.)
- Baseline the three metrics: time-to-first-review, PR size p50, revert rate. You need the
  "before" or the "after" is a vibe.

## Week 2 — the contract

- Turn on branch protection per the skill's settings (checks required, stale-dismissal,
  squash-only). Announce it as config, with the escape hatch documented (hotfix label path).
- Adopt comment prefixes (`blocking:/q:/nit:`) and the 4-hour first-response SLO — put the
  SLO on a dashboard where standup sees it.
- commit-lint on (warning for 3 days, then required).

## Weeks 3+ — enforcement earned

- `code-reviewer` blocking findings now actually block (the team has seen two weeks of its
  judgment; false-positive rate is known and tuned).
- Weekly hygiene audit (`check-branch-hygiene.mjs`) posted to the team channel — trends,
  not blame.

## Objection handling (you will hear these)

- **"The bot nitpicks."** Nits never block — that's what the prefix system encodes. Tune or
  demote rules that misfire; the config is code-reviewable.
- **"Summaries are wrong sometimes."** They're maps, not territory — a wrong summary on a
  2,000-line PR is an argument for smaller PRs, which the size norms fix.
- **"This slows us down."** The SLO + protection settings measurably speed up the queue;
  show the week-1 baseline vs week-4. What slows teams is review latency and re-review
  churn, both of which drop.
- **"Admins need bypass."** The bypass IS the vulnerability; the hotfix path exists and is
  faster than arguing at 2 a.m.

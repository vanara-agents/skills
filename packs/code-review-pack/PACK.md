---
name: code-review-pack
description: Review pull requests faster and better — automated first-pass review, PR summaries reviewers can trust, healthy git workflow settings, conventional history, and query-performance checks, sequenced into one review pipeline.
type: pack
version: 1.0.0
updated: 2026-07-10
agents: [code-reviewer, pr-summarizer]
skills: [git-collaboration-workflows, conventional-commits, sql-index-tuning]
---
# Code Review Pack

The review toolkit for teams whose bottleneck is the pull-request queue: get every PR a
fast, rigorous first pass, give human reviewers a summary they can trust, and keep the
workflow settings and history hygiene that make review scale. The value of the pack is the
**sequence** — which item runs at which moment of a PR's life — not the item list.

## Who this is for

Teams merging more PRs than their senior reviewers can deeply read; leads who want review
latency down without review quality collapsing; anyone inheriting a repo where "review"
means LGTM-stamping.

## What's included

- **Agents:** `code-reviewer` (rigorous first-pass review: correctness, security, tests,
  maintainability), `pr-summarizer` (what changed, why, risk areas — the reviewer's map).
- **Skills:** `git-collaboration-workflows` (branch protection, PR sizing, merge strategy,
  monorepo questions), `conventional-commits` (machine-readable history that powers
  changelogs and bisect), `sql-index-tuning` (the query-performance review lens most teams
  lack — N+1s and missing indexes are the top silent regressions PRs ship).

## The review pipeline (how the pieces sequence)

```text
PR opened
  1. pr-summarizer     → posts the map: what changed, why, blast radius, files to read first
  2. code-reviewer     → first-pass findings: blocking / question / nit, with file:line
       └─ SQL touched? → sql-index-tuning lens: EXPLAIN the new queries, check indexes
  3. human reviewer    → reads the summary + findings, spends attention ONLY on judgment
                         calls the machine flagged and the design questions it can't make
merge
  4. conventional-commits → squash message feeds changelog + bisect-friendly history
weekly
  5. git-collaboration-workflows → hygiene audit: branch age, PR size trend, protection drift
```

The division of labor is the point: agents do coverage (every line, every time), humans do
judgment (architecture, product fit, taste). Teams that flip this — humans doing coverage,
no machine pass — get slow reviews AND missed bugs.

## Setup

1. Install the pack; wire `pr-summarizer` + `code-reviewer` to run on PR-open (CI job or
   scheduled agent).
2. Apply the branch-protection settings from `git-collaboration-workflows`
   (`examples/branch-protection.md`) — required checks, stale-review dismissal, squash-only.
3. Adopt the `blocking:/q:/nit:` comment convention from the PR review playbook; announce
   the review SLO (first response < 4h).
4. Enable commit-lint per `conventional-commits` so the history contract is enforced, not
   hoped for.

## Comment convention (adopt verbatim)

```text
blocking:  must be fixed before merge — correctness, security, data loss
q:         genuine question; answer may resolve it
nit:       author's call; NEVER blocks
(unprefixed comments read as blocking — prefix everything)
```

## Pitfalls

- **LGTM-stamping past machine findings** — the pipeline's failure mode; blocking findings
  must actually block, or reverts won't move.
- **Bot-nit fatigue** — untuned severity turns the first-pass reviewer into noise; demote
  misfiring rules weekly during rollout (see `references/rollout-guide.md`).
- **Summaries as gospel on giant PRs** — a wrong map on a 2,000-line PR is an argument for
  the size norms, not against the mapper.
- **Skipping the SQL lens** — missing-index regressions pass every test and fail at the
  10× tenant; the `EXPLAIN` step is not optional when queries change.
- **Anti-pattern: humans doing coverage** — re-reading every line the machine read wastes
  the scarce resource (judgment) on the abundant one (attention).

## When NOT to use this shape

Solo projects (review theater), and rubber-stamp compliance environments where findings
can't block merges anyway — fix the process authority first, then install tooling.
Edge case worth naming: generated code and vendored files should be excluded from both
summary and review scope up front, or they drown every real finding.

## Verification

After two weeks, three numbers should move: median time-to-first-review (down), PR size p50
(down — the summary+size norms push authors to split), and post-merge defect
reverts (down). If reverts didn't move, check whether `code-reviewer` findings are being
LGTM'd past — the pipeline only works when blocking findings block. A full worked PR
walkthrough lives in [examples/pr-flow-example.md](examples/pr-flow-example.md).

Pairs with the `secure-delivery-pack` (security-focused review lenses) and
`craftsmanship-pack` (refactoring and test depth beyond the review gate).

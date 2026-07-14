# PR & Review Playbook

## Author side

- **Size**: ≤ ~400 changed lines. Bigger? Split: mechanical prep PRs (rename, extract,
  format — trivially approvable) first, the behavior change last and small.
- **Stacked PRs** for large features: each PR one reviewable slice, description links the
  stack ("2/5, builds on #341"). Land bottom-up; rebase the stack on each merge (tooling
  helps; discipline suffices).
- **Description contract**: what + why + how-verified (test evidence, screenshots for UI),
  plus rollback note if non-trivial ("revert cleanly" or the flag to flip). A reviewer
  should know the intent before reading the diff.
- **Self-review first**: your own pass catches the debug prints and stray files; respect
  reviewers' attention as the scarce resource it is.
- Draft PRs early for direction checks ("is this approach sane?") — cheaper than polished
  wrongness.

## Reviewer side

- **First response < 4 working hours; small PRs same-day.** Review latency sets integration
  speed for the whole team — it IS the constraint, treat it like on-call.
- Review for: correctness, tests actually asserting behavior, security on tainted paths,
  and "will the next reader understand this" — not personal style (the linter owns style;
  what the linter doesn't own isn't blocking).
- **Prefix comments by weight**: `blocking:` (must fix), `q:` (genuine question),
  `nit:` (author's call, never blocks). Unprefixed comments read as blocking — inflation
  by default.
- Approve with nits rather than round-tripping for trivia; re-request only when something
  `blocking:` changed.
- Big PR arrives anyway? First comment: "split suggestion", not 45 line-notes on code
  that'll be rewritten.

## Team mechanics

- **Review SLO on the dashboard** (median time-to-first-review) — what's measured gets
  staffed.
- Rotate a daily "review goalie" who owns unblocking the queue before their own work.
- Disagreements past two round-trips move to a 10-minute call; write the resolution back
  into the PR (the thread is the record).
- Merge is the author's job once approved (or auto-merge/queue) — approved-but-unmerged PRs
  rot against main.

## Anti-patterns, named

LGTM-stamping (approval without evidence of reading — ask one substantive question per
review as a personal rule) · drive-by rewrites in review comments (open your own follow-up
PR) · review as status hierarchy (junior reviews senior code; fresh eyes are the point) ·
the 47-comment style war (fix the linter config, apologize, move on).

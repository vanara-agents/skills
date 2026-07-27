# Worked scenario — The dependency-bump PR nobody wants to read

How `code-review-pack` handles the reviews humans skim.

## The situation

Renovate opens a PR bumping 14 packages, including a major of the ORM. Reviews
like this get rubber-stamped — which is exactly how a breaking change ships.

## How the pack plays it

1. **`pr-summarizer`** separates signal from noise: 12 patch bumps (safe), one
   minor with a changed default, one ORM major with a migration guide — the
   summary links the guide and flags the two files using the removed API.
2. **`code-reviewer`** reviews only the app-side usages the summary flagged,
   catching a silent behavior change in transaction retry semantics.
3. **`conventional-commits`** the squash lands as build(deps) with a BREAKING
   CHANGE footer, so the next release is correctly versioned as major.
4. **`git-collaboration-workflows`** the protected-branch checks require the
   integration suite, which exercises the ORM paths before merge.

## Outcome

The one dangerous line in a 4,000-line diff got human attention; the other
3,999 got exactly the attention they deserved — none.

> Install everything above at once: `npx vanara install code-review-pack`

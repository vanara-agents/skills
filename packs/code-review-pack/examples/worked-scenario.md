# Worked scenario — A risky auth diff lands safely

How `code-review-pack` runs on a realistic engagement, member by member.

## The situation

A 400-line PR touches session handling two days before release.

## How the pack plays it

1. **`code-reviewer`** runs security-first: flags a session-fixation path and an unsafe redirect before any human review.
2. **`pr-summarizer`** produces the reviewer-facing summary — risk areas up top, so the human spends attention where it matters.
3. **`git-collaboration-workflows`** the skill's branch-protection setup means the fix lands via a clean, revertable merge.
4. **`conventional-commits`** the history reads fix(auth): pin session on privilege change — the changelog writes itself.

## Outcome

The vulnerability dies in review, the human reviewed 40 lines instead of 400, and the release notes are free.

> Install everything above at once: `npx vanara install code-review-pack`

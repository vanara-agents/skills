# Writing the Reviewer-Friendly Summary

The Summary section is 2-4 sentences that let a reviewer decide where to look *before* they open the
diff. It is prose, not a bullet list, and it is a risk map, not a changelog. This reference is how to
write it without drifting into the two failure modes: inventing behavior, and listing everything
neutrally.

## What the Summary must answer

1. **What changed** — the net effect at HEAD, in the reviewer's vocabulary (features, endpoints,
   tables), not a file-by-file recital.
2. **Why (probable intent)** — inferred from the code, hedged when uncertain. "Appears to..." is
   honest; stating intent as fact you can't see is not.
3. **Where to look first** — the single highest-consequence spot. This is the sentence that earns
   the summary its keep.
4. **Any mismatch** — where the diff and the PR description disagree. The mismatch is often the
   headline (a "no behavior change" PR that changes a default).

## Anchor every claim to a changed line

The cardinal rule: **if it's not in the diff, you don't know it.** Concretely:

- Describe what the *changed lines* do, not what you assume the surrounding system does.
- If a function is *called* in the diff but its body isn't changed, say "now calls `charge()`," not
  "charges the card twice" — you haven't seen `charge`'s body.
- Don't claim a test passes, a migration is safe, or an edge case is handled unless the diff shows
  it. Absence of evidence is a *gap to flag*, not a fact to assert.
- Prefer `file:line` anchors in Risk areas so the reviewer can jump straight there.

## Scale words to consequence

Collapse mechanical churn; expand judgment calls.

| Instead of | Write |
|---|---|
| One line per file for 30 renamed files | "Renames `oldApi`→`newApi` across 30 files (mechanical)." |
| "Updated the auth file." | "Changes the session-ownership check in `auth/session.js:40` — the security-relevant line." |
| "Various config changes." | "Raises the default rate limit 100→1000 in `config/limits.js:8` (unrelated to stated purpose)." |

Lines-changed is not importance. A 3-line auth change outranks a 400-line lockfile update.

## Writing the Risk areas list

- One risk per line: `file:line` — the specific risk — why it matters.
- Order by consequence (security > migration > API break > config), not file order.
- Be specific about the failure, not the category: not "migration risk" but "adds NOT NULL column
  with no default → fails on non-empty `accounts` table."
- If nothing is elevated, say so explicitly rather than padding with non-risks.

## Tone

- **Neutral and precise**, not congratulatory or harsh. You inform; you don't approve or reject.
- **Reviewer's time is the budget.** Every sentence should change where they look or what they
  verify. Cut anything that doesn't.
- **Name gaps without accusation.** "No test covers the 401 path" states a fact; it doesn't scold.

## Quick self-check before emitting

- [ ] Did I read `base...HEAD`, not just the last commit?
- [ ] Can every sentence be traced to a changed line?
- [ ] Is the highest-consequence change first, in both Summary and Risk areas?
- [ ] Did I note any diff-vs-description mismatch?
- [ ] Did I flag missing tests for risky code, rather than staying silent?

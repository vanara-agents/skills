# Branch Protection — recommended settings

GitHub terminology; GitLab/Bitbucket equivalents in parentheses. Apply to `main` and all
`release/*` patterns.

## Required (the load-bearing set)

| Setting | Value | Why |
|---|---|---|
| Require a pull request before merging | on | No direct pushes, no exceptions |
| Required approvals | 1 (2 via CODEOWNERS for `/payments`, `/auth`, `/infra`) | Match rigor to blast radius |
| Dismiss stale approvals on new commits | **on** | Re-push invalidates what was reviewed |
| Require review from Code Owners | on where CODEOWNERS exists | Routing, not gatekeeping |
| Require status checks to pass | build, test, lint, typecheck | The same bar for everyone |
| Require branches to be up to date / merge queue | merge queue when >10 merges/day | Kills "two green PRs, red main" |
| Require linear history (or squash-only) | on | main reads as changelog; bisect stays fast |
| Include administrators (no bypass) | **on** | The bypass you allow is the one used at the worst moment |
| Allow force pushes / deletions | **off** | Non-negotiable on shared branches |

## Recommended

- **Require signed commits** on release branches (supply-chain posture; pairs with
  provenance in `OPEN-CORE`-style distribution).
- **Conversation resolution required** — threads don't vanish on merge.
- Auto-delete head branches after merge — stale-branch hygiene by default.
- `CODEOWNERS` kept small and real: teams, not individuals (vacation-proof); every entry
  answers "who must know about changes here", not "who wrote it once".

## The escape hatch, designed

Emergencies happen; design the fast path so nobody disables protection:

- A `hotfix` label + on-call approver satisfies the review requirement (a second human, fast).
- Checks stay required — a hotfix that doesn't build isn't fast, it's twice.
- Break-glass audit: any settings change to protection pages an owner (settings drift is
  how "temporary" bypasses become permanent).

## CODEOWNERS sketch

```
# Default: any senior reviewer team
*                    @org/reviewers
# Blast-radius paths: two approvals via team + specialist
/services/payments/  @org/payments @org/security
/auth/               @org/security
/infra/              @org/platform
/.github/            @org/platform   # CI is code; protect the protector
```

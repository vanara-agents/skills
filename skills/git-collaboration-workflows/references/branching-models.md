# Branching Models in Detail

## Trunk-based (continuous deploy)

```
main ──●──●──●──●──●──●──►  every merge deployable; deploy = promote latest green main
        \feat-a (hours)
         ●──● → PR → squash → main
```

- Unfinished work ships **dark** behind flags — integration happens daily even when release
  doesn't.
- A **merge queue** (GitHub merge queue / Bors-style) serializes merges and tests each
  against the true post-merge state — eliminates "two green PRs, red main" races; adopt it
  once merges/day > ~10.
- Broken main = full stop: auto-revert the offending merge (bot or on-call) rather than
  fix-forward under pressure; the author re-lands calmly.

## Release-branch overlay (cadence shipping)

```
main ──●──●──●──●──●──●──►
              \release/1.24 ──●(cp)──●(cp)──tag 1.24.0──tag 1.24.1
```

- Cut from main at code-freeze; the branch only receives **cherry-picks** of fixes that
  landed on main first (main-first is the invariant that prevents regressions in 1.25).
- Tag builds from the release branch; the tag, not the branch tip, is what shipped.
- Delete the branch when the version leaves support; tags are permanent.

## Hotfix path (works in both models)

1. Branch from the **shipped tag** (not main — main has moved).
2. Fix, PR, tag `1.24.2` from the hotfix branch, ship.
3. **Forward-port to main immediately** — the #1 hotfix failure is the fix missing from the
   next regular release. A required "forward-ported? link" field in the hotfix PR template
   is cheap insurance.

## Multi-major support (enterprise/on-prem)

Long-lived `release/2.x`, `release/3.x` lines. Every fix: main first, then cherry-pick down
each supported line it applies to (automate with a cherry-pick bot + per-line labels).
Support-matrix discipline: each line has an EOL date published; EOL means the branch goes
read-only. The cost of each supported line is roughly a part-time engineer — price support
contracts accordingly.

## Migration notes (git-flow → trunk-based)

Teams rarely regret the direction; the sequence that works: (1) merge queue + required
checks on main, (2) flags for the two in-flight epics, (3) shrink PR-size norms via review
culture, (4) delete `develop` — it's by then a stale mirror. Do (4) last; deleting develop
first just moves the long-lived-branch problem to feature branches.

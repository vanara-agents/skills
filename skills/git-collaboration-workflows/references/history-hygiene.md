# History Hygiene

History is a debugging tool and an audit trail; hygiene is what keeps `bisect`, `blame`, and
`revert` usable at 3 a.m.

## The rules

- **Never rewrite pushed shared history.** `push --force` on main/release erases teammates'
  reference points and CI provenance. Personal branches: force-push freely *before* review
  starts; after review begins, prefer `--force-with-lease` (refuses if someone else pushed)
  and only to your own branch.
- **Revert forward.** A bad merge on main gets `git revert -m 1 <merge>` (or revert of the
  squash commit) — a new commit that undoes it. History stays true: the mistake happened,
  the fix happened.
- **Atomic commits with why-messages.** Each commit builds and tests green (keeps bisect
  honest); message body explains *why*, the diff already shows *what*
  (`conventional-commits` for the format).
- Separate **mechanical churn from logic**: formatting/rename-only commits isolated (and
  listed in `.git-blame-ignore-revs` so blame skips them — one config line saves years of
  "blame says the formatter wrote everything").

## Bisect discipline

`git bisect run ./test.sh` finds the breaking commit in log₂(n) steps — but only if commits
build independently (atomic rule above) and main is linear-ish (squash/rebase merges). A
history of "wip", "fix", "fix2" turns bisect from minutes into an afternoon of manual
skipping. This is the practical argument that wins the squash-merge debate.

## Recovering from disasters

- Deleted branch / botched rebase: `git reflog` — every HEAD position for ~90 days; branch
  from the lost SHA. Nothing pushed is ever really lost within the window.
- Committed secret: rotate the secret FIRST (history cleaning is not containment — clones
  and CI logs exist), then scrub with `git filter-repo` and force-push with the whole
  team coordinated. Treat as an incident (`secrets-management`), not a git trick.
- Wrong-branch commit: `git cherry-pick` it where it belongs, `git reset --keep` where it
  doesn't (before push) or revert (after).

## Large repos / large files

Binary assets and datasets: LFS from day one — retrofitting LFS after 2GB of PSDs are in
history requires a full rewrite event. Generated artifacts never get committed (CI rebuilds
them); a `check-branch-hygiene` finding of build outputs in git is a config bug in
`.gitignore`, fix at the root.

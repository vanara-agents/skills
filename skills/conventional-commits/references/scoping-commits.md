# Scoping Commits — One Logical Change

A flawless message on a tangled commit is still a bad commit. The hardest part of good history isn't
wording — it's deciding **what belongs in one commit**.

## The atomic-commit rule

Each commit should be a single coherent change that **builds and passes tests on its own**. If you can't
describe it in one Conventional Commit subject without using "and", it's probably two commits.

Good signs:
- `git revert <sha>` would cleanly back out exactly one concern.
- `git bisect` landing on this commit points at a single suspect.
- A reviewer can hold the whole change in their head.

## Splitting a messy working tree

When you've already written tangled changes, stage them by concern instead of `git add .`:

```bash
git add -p              # interactively stage hunks — accept only the fix's hunks
git commit -m "fix: reject negative quantity in cart total"
git add -p              # now stage the refactor hunks
git commit -m "refactor: extract priceFor() from CartTotal"
```

`git add -p` walks each hunk and asks y/n/s (split). It's the single most useful habit for clean history.
For changes that can't be hunk-split (intertwined lines), use `git stash` to park one concern while you
commit the other, or `git restore --staged -p` to unstage.

## Anti-patterns

- **"WIP" / "fixes" / "stuff"** — unparseable, unreviewable. Squash or reword before merge.
- **The end-of-day mega-commit** — a day's unrelated work in one blob. Commit as you finish each unit.
- **Mixing formatting with logic** — a Prettier sweep buried in a feature hides the real change in noise.
  Do formatting in its own `style:` commit.

## Rewriting before you push

History is cheap to fix *before* it's shared. Use `git rebase -i` to squash fixups, reorder, and reword
local commits into a clean series. Once pushed to a shared branch, leave it alone (or coordinate) — never
rewrite published history others have built on.

# Reading the Full Diff

The summary is only as honest as the diff you read. The single most common failure is reading the
latest commit instead of the whole branch. This reference is how you get the *complete* change set
and turn it into a structure you can summarize.

## Get the whole branch, not the tip

Always read the union of every commit on the branch since it forked from its base — the
**three-dot** range:

```bash
# What files changed and by how much (read this first for shape)
git diff --stat <base>...HEAD

# The full patch across the whole branch
git diff <base>...HEAD

# The list of commits, so you can see intent but never summarize from it alone
git log --oneline <base>..HEAD
```

- `<base>...HEAD` (three dots) diffs HEAD against the *merge base* — exactly what the PR proposes to
  merge. This is what you want.
- `<base>..HEAD` (two dots) can include unrelated changes that landed on base after the fork. Avoid
  it for the patch; it is fine for `git log`.
- `git show HEAD` or `git diff HEAD~1` reads **one commit**. Never summarize from these — a branch
  that introduces and later fixes an issue must be summarized as it stands at HEAD.

If the base branch is unknown, it is usually `main`, `master`, or `develop`. Confirm with
`git remote show origin` or the PR metadata rather than guessing.

## When there is no git access

If you only have the working tree (no VCS, or a squashed export you cannot expand), read the changed
files directly with Read/Grep and say explicitly in the summary that it was produced from a
snapshot, not a `base...HEAD` diff. Do not fabricate a delta you cannot see.

## Group changes by area

Before writing prose, bucket every changed file. This structure becomes the skeleton of the summary
and makes risk obvious:

| Bucket | What goes here | Attention level |
|---|---|---|
| **Feature / behavior** | New or changed runtime logic | High — read closely |
| **Refactor / mechanical** | Renames, moves, formatting, codemods | Low — collapse to one line |
| **Tests** | New/changed test files | Cross-check against feature changes |
| **Config / infra** | CI, Dockerfiles, env, dependency manifests | High — silent blast radius |
| **Migrations** | Schema/data migration files | Highest — often irreversible |
| **Docs / generated** | READMEs, lockfiles, generated code | Low — note but don't dwell |

A useful heuristic: **lines changed is not importance.** A 400-line lockfile churn is low-signal; a
3-line change to an auth check is the headline.

## Handling large and rename-heavy diffs

- **Rename detection:** `git diff -M <base>...HEAD` marks moves as renames so a moved file doesn't
  read as a full delete+add. This collapses noise dramatically.
- **Ignore whitespace:** `git diff -w <base>...HEAD` when a formatter touched many lines, so you see
  the real logic change underneath.
- **Focus a path:** `git diff <base>...HEAD -- path/to/dir` to read one area at a time on a big PR.
- **Numstat for triage:** `git diff --numstat <base>...HEAD` gives machine-readable add/delete
  counts per file — feed this shape into `scripts/diff-risk.mjs` to flag oversized or risky files
  before you read them line by line.

Read the highest-attention buckets in full. Skim mechanical churn only to confirm it *is* mechanical
— codemods occasionally smuggle a real behavior change into an otherwise-uniform rename.

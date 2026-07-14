# The Conventional Commits Grammar

The canonical spec is [conventionalcommits.org](https://www.conventionalcommits.org/). This is a working
summary with the parts teams trip over.

## Structure

```
<type>[(<scope>)][!]: <subject>

[body]

[footer(s)]
```

- Exactly one blank line separates header, body, and footers.
- The header is a single line. Everything machine-read lives here.

## Header

| Part | Required | Rules |
|---|---|---|
| type | yes | lowercase; from the agreed set |
| scope | no | `(noun)`; lowercase; the affected area |
| `!` | no | breaking-change flag, placed right before `:` |
| `: ` | yes | colon then a single space |
| subject | yes | imperative, lowercase start, no trailing `.`, header ≤ 72 chars |

The "imperative mood" test: the subject should complete *"If applied, this commit will ___"*. So write
`fix: handle null cursor`, not `fixed null cursor` or `fixes null cursor`.

## Body

- Free-form, wrapped at ~72 columns.
- Explain **why** the change exists and any context the diff can't show. Do not restate the diff.
- May contain multiple paragraphs and bullet lists.

## Footers

Footers follow the [git trailer](https://git-scm.com/docs/git-interpret-trailers) format —
`Token: value`, one per line, after a blank line:

```
BREAKING CHANGE: the `token` field was renamed to `accessToken`.
Refs: #214
Closes: #220
Reviewed-by: Jordan Lee
Co-Authored-By: A. Dev <a.dev@example.com>
```

- `BREAKING CHANGE:` (uppercase, with a space) is special: its presence forces a MAJOR bump. `BREAKING-CHANGE:`
  (hyphen) is accepted as a synonym by parsers.
- Issue references (`Closes #220`) let platforms auto-close issues on merge.

## Reverts

```
revert: let us never speak of the night deploy again

This reverts commit 676104e.
```

The footer `This reverts commit <sha>.` is what `git revert` generates and what tooling looks for.

## Merge commits

Merge commits are typically excluded from changelog generation (they have no single type). Squash-merge
workflows collapse a branch into one commit — make sure the **squash subject** is itself a valid
Conventional Commit, because that is the message that lands on the main branch.

## FAQ

- **Multiple types in one change?** Split the commit. One logical change → one type.
- **Where do `scope`s come from?** Define a fixed list per repo (e.g. `api`, `web`, `auth`, `deps`) and
  enforce it via `scope-enum` in commitlint so they stay consistent.
- **Capital or lowercase subject?** Lowercase by convention; some teams allow sentence case — pick one and
  lint it.
- **Emoji (gitmoji)?** A different convention. Don't mix it with Conventional Commits or parsers choke.

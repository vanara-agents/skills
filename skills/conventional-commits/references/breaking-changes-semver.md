# Breaking Changes and SemVer Mapping

Conventional Commits exists to make [Semantic Versioning](https://semver.org/) (`MAJOR.MINOR.PATCH`)
automatic. This is the exact mapping release tools use.

## Type → version bump

| Commit | Bump | Example: from `1.4.2` |
|---|---|---|
| any commit with `!` or `BREAKING CHANGE:` footer | **MAJOR** | → `2.0.0` |
| `feat:` | **MINOR** | → `1.5.0` |
| `fix:` | **PATCH** | → `1.4.3` |
| `perf:` | PATCH | → `1.4.3` |
| `docs:` / `style:` / `refactor:` / `test:` / `build:` / `ci:` / `chore:` | no release | `1.4.2` |

The highest-priority change across all commits since the last tag wins: one `feat` among twenty `chore`s
still produces a MINOR release; one breaking change produces a MAJOR.

## Two ways to mark a break

Both are valid; you can use either or both. The `!` is the scannable signal; the footer carries the
migration note. **Prefer using both** so humans get the explanation:

```
feat(api)!: require Bearer tokens on all endpoints

BREAKING CHANGE: the legacy `X-Api-Key` header is no longer accepted.
Migrate by exchanging your key for a token at POST /v1/auth/token.
```

A breaking change can ride on **any** type — `fix!:` is a bug fix that also breaks the contract.

## Pre-1.0.0 caveat

SemVer treats `0.y.z` as unstable: anything may break at any time. Many tools therefore map a breaking
change to a **MINOR** bump (`0.4.0 → 0.5.0`) rather than `1.0.0` until you explicitly cut `1.0.0`.
Configure this deliberately — accidentally shipping `1.0.0` signals an API-stability promise you may not
be ready to make.

## What actually counts as "breaking"

Breaking = an existing consumer following the documented contract would now fail. Examples:

- Removing or renaming a public field, endpoint, function, or CLI flag.
- Changing a default value, response shape, or error code clients branch on.
- Tightening validation so previously-accepted input is now rejected.
- Raising a minimum runtime/engine version.

Adding an *optional* field, a new endpoint, or a new enum value is **additive** (MINOR), not breaking —
provided clients are built to ignore unknown fields.

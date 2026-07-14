# Annotated Commit Examples

Copy these shapes. Each shows the header, and where useful, body and footers.

## Good

A feature with context and an issue reference:

```
feat(orders): add cursor pagination to the list endpoint

Offset pagination scanned the whole table on deep pages and double-counted
rows under concurrent inserts. Cursor pagination keeps queries O(limit)
regardless of depth.

Refs: #214
```

A plain bug fix (PATCH):

```
fix(auth): treat an expired token as 401, not 500
```

A breaking change — `!` plus a migration footer (MAJOR):

```
refactor(api)!: drop the deprecated v0 auth header

BREAKING CHANGE: clients must send `Authorization: Bearer <token>`.
The `X-Api-Key` header is no longer read.
```

A performance fix (PATCH) and a docs-only change (no release):

```
perf(search): memoize the analyzer to cut p99 by 40ms
```
```
docs: document the cursor pagination contract
```

A scoped dependency bump that closes a security issue — note it's a `fix`, not `chore`:

```
fix(deps): bump qs to 6.11.2 to patch CVE-2022-24999

Closes: #301
```

## Bad — and the fix

| Bad | Why | Fixed |
|---|---|---|
| `Added user login` | past tense, capitalized | `feat(auth): add user login` |
| `fix: Fixed the bug.` | capital + trailing period + vague | `fix(cart): reject negative quantities` |
| `feat(fix): patch thing` | scope is a type, not a place | `fix(thing): handle empty payload` |
| `chore: rewrite payment retries` | hides a real fix as no-release noise | `fix(payments): retry idempotently on timeout` |
| `update stuff and refactor and fix tests` | three changes, no type | three separate commits |
| `feat: implement the entire new dashboard with charts, filters, export, and dark mode toggle` | 80+ char header | shorten subject, push detail to body |

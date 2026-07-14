# PR Comment Templates

Copy-paste templates for leaving review comments. Keep each comment to one finding: an anchor, the
problem, and the fix.

## Inline comment (single finding)

```md
**[HIGH]** `path/to/file.js:88`

User-supplied `sort` is interpolated into the SQL string, allowing injection.

**Fix:** whitelist the sortable columns and bind the value:
\`\`\`js
const SORTABLE = { date: 'created_at', total: 'amount' };
const col = SORTABLE[sort] ?? 'created_at';
\`\`\`
```

## Top-level summary comment

```md
## Review summary

- **Verdict:** Request-changes
- **Blocking:** 1 HIGH (SQL injection at `repo.js:88`)
- **Non-blocking:** 2 MEDIUM, 1 LOW

Logic is sound and the tests are well structured. The one blocker is the dynamic sort column —
once that's whitelisted this is good to merge. Detailed findings are inline.
```

## Approval comment (clean change)

```md
## Review summary

**Verdict: Approve** — read the full diff. Security, correctness, and tests all check out; no
findings above LOW. Nice, focused change.
```

## Nit prefix convention

Prefix optional comments with `nit:` so authors know they don't block:

```md
nit: `const d` → `createdAt` reads more clearly here.
```

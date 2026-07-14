# Single-Finding Template

Copy this block per finding. Keep it to one anchor, one exploit sentence, one fix. Delete the guidance
comments before shipping.

```md
### <CRITICAL | HIGH | MEDIUM | LOW>
- `<path>:<line>` — **<Vulnerability name> (<OWASP category, e.g. A03>)**. <One sentence: which
  attacker-controlled input reaches which dangerous sink, and the concrete impact. Include the exploit
  string if it makes it real.> **Fix:** <the corrected code or precise action — a real control
  (parameterize / encode / allow-list / rotate), never a blocklist.>
```

## Filled example

```md
### CRITICAL
- `orders/repo.js:88` — **SQL injection (A03)**. The `sort` query param is interpolated into the SQL
  text (`ORDER BY ${req.query.sort}`); `?sort=id;DROP TABLE orders--` executes arbitrary SQL.
  **Fix:** allow-list sortable columns (`{ created_at, total }`) and map the param through it; bind
  all values as parameters. Identifiers can't be bound, so the allow-list is mandatory.
```

## Checklist before you ship a finding

- [ ] Anchored to a real `file:line` that contains the quoted code.
- [ ] Names the source (input), the sink, and the impact.
- [ ] Has an OWASP category.
- [ ] Severity matches the rubric in `../references/severity-and-reporting.md`.
- [ ] Fix is a real control, not a blocklist; includes rotation if a secret was exposed.
- [ ] You could defend it to the author without hand-waving.

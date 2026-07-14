# Walkthrough: triaging and fixing an OWASP-class vulnerability

Not every task starts at design time. This shows the pack applied to a vulnerability found in
existing code — where `security-auditor` leads and the workflow compresses.

## The finding

A routine `security-auditor` pass on a diff flags:

```md
### CRITICAL
- `api/documents.js:73` — GET /documents/:id loads the record by id and returns it with no check
  that the document belongs to the requesting user. Any authenticated user can read any document by
  guessing/enumerating ids. (A01 Broken Access Control — IDOR)
```

Intermittent guessing isn't needed — the ids are sequential integers, so this is trivially
enumerable. CRITICAL is correct.

## Classify (`owasp-top10`)

This is **A01 Broken Access Control**, the IDOR variant: the endpoint authenticates ("are you logged
in?") but does not authorize ("is this *your* document?"). The reference is clear — authorization must
be checked server-side against the resource owner on every request, deny-by-default.

## Reproduce as a failing test first (`security-auditor` direction)

Before touching the handler, lock the bug down as a regression test:

```text
✗ user B requesting user A's document id receives 404, not 200 + the document
```

It fails against current code — confirming the vulnerability and giving the fix a target. (404, not
403, so the endpoint doesn't confirm the id exists — avoids the enumeration side channel too.)

## Fix the access-control check

Add the ownership guard *before* the record is returned:

```text
const doc = await Documents.findById(id);
if (!doc || doc.ownerId !== session.userId) return res.status(404).end();
return res.json({ data: doc, error: null });
```

The check runs for every request and denies by default. Test goes green. A grep for the same pattern
across sibling routes (`/documents/:id/download`, `/documents/:id/versions`) confirms whether the same
gap exists elsewhere — IDOR is rarely a single-endpoint problem.

## Re-audit + scan (`security-auditor` + `vuln-scanner`)

- `security-auditor` re-reviews: the guard is present on all three routes, the 404 leaks nothing, no
  new finding introduced.
- `vuln-scanner` runs on the branch: dependencies clean, no secret introduced by the change.

## Ship

CRITICAL closed, sibling routes patched, regression tests in place, scan clean. The fix ships.

## The lesson

The pack turned a single flagged line into a *class* fix: classify the vulnerability (A01/IDOR), lock
it with a failing test, apply the deny-by-default mitigation, then sweep for the same pattern
elsewhere. Fixing only line 73 would have left the download and versions routes exploitable — the
OWASP framing is what prompts checking the whole class, not just the reported instance.

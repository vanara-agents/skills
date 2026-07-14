# Sample Review Output

A complete review of a hypothetical PR, in the standard format. Use this as the model for tone,
structure, and the anchor → problem → fix pattern.

---

## Code Review — feat: add invoice export endpoint

### CRITICAL
- `api/invoices.js:31` — **IDOR.** `findByUser(req.params.id)` returns any user's invoices; ownership
  is never checked against the session. Any logged-in user can read others' financial data.
  **Fix:** `if (req.params.id !== req.session.userId) return res.status(404).end();` before the query
  (404, not 403, to avoid leaking existence).
- `api/invoices.js:47` — **SQL injection.** `order by ${req.query.sort}` interpolates user input.
  **Fix:** whitelist sortable columns:
  ```js
  const SORTABLE = { date: 'created_at', total: 'amount' };
  const col = SORTABLE[req.query.sort] ?? 'created_at';
  ```

### HIGH
- `api/invoices.js:58` — Unhandled rejection: `await pdf.render()` has no try/catch; a render failure
  500s with a stack trace in the body. **Fix:** wrap in try/catch, log server-side, return a generic
  error envelope.
- `api/invoices.test.js` — No test covers the export path or the authz check. **Fix:** add a test
  asserting a non-owner gets 404 and an owner gets 200.

### MEDIUM
- `api/invoices.js:20-72` — `exportInvoices` is 52 lines doing auth, query, formatting, and PDF
  rendering. **Fix:** extract `assertOwnership()`, `loadInvoices()`, `renderPdf()`.

### LOW
- `api/invoices.js:24` — `const r` → rename to `rows` for readability.

**Verdict: Block** — two CRITICAL issues (IDOR + SQL injection) must be fixed before merge. The
HIGH items (error handling + missing tests) should land in the same change. Structure is otherwise
reasonable; the medium refactor is a nice-to-have.

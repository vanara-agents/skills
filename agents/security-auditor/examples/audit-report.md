# Example: Full Security Audit Report

A complete, realistic audit of a small Express orders service, in the standard format. Use it as the
shape your output should take. (Secret values shown are obviously fake illustrations.)

---

## Security Audit — `orders-service` (branch `feat/order-export`)

Scope: 4 changed files — `orders/controller.js`, `orders/repo.js`, `reports/controller.js`,
`config.js`. Surfaces: 3 HTTP routes (1 public, 2 authenticated), 1 SQL data layer, 1 file read, 1
config module.

### CRITICAL

- `orders/repo.js:88` — **SQL injection (A03)**. `req.query.sort` is interpolated into the query
  (`ORDER BY ${sort}`). Exploit: `GET /orders?sort=id;DROP TABLE orders--`. **Fix:** allow-list
  sortable columns and bind values:
  ```js
  const COLS = { created_at: 'created_at', total: 'total' };
  const col = COLS[req.query.sort] ?? 'created_at';
  db.query(`SELECT * FROM orders WHERE owner = ? ORDER BY ${col} DESC LIMIT 50`, [req.session.userId]);
  ```

- `reports/controller.js:12` — **Path traversal (A01)**. `req.query.name` is concatenated into a file
  path read and returned. Exploit: `GET /reports?name=../../../../etc/passwd`. **Fix:** confine to a
  base dir and strip components:
  ```js
  const base = path.resolve('/var/reports');
  const target = path.resolve(base, path.basename(req.query.name));
  if (!target.startsWith(base + path.sep)) return res.status(400).end();
  ```

### HIGH

- `orders/controller.js:34` — **Broken access control / IDOR (A01)**. `GET /orders/:id` fetches by id
  with no ownership check; any authenticated user reads any order. **Fix:** compare to the session
  principal and 404 on mismatch:
  ```js
  const order = await repo.findById(req.params.id);
  if (!order || order.ownerId !== req.session.userId) return res.status(404).end();
  ```

- `config.js:7` — **Hardcoded secret / cryptographic failure (A02)**. A live-looking API token is
  committed: `const STRIPE = 'sk_live_4eC39HqLyjEXAMPLEzdp7dc'` (fake illustration). **Fix:** load from
  env/secret manager and **rotate** the token — git history still contains it. Add a pre-commit secret
  scan (`scripts/scan-secrets.mjs`).

### MEDIUM

- `orders/controller.js:9` — **Security misconfiguration (A05)**. Errors return the full stack trace to
  the client (`res.status(500).send(err.stack)`), leaking file paths and library versions. **Fix:**
  return a generic message; log the detail server-side.

### LOW

- `config.js:1` — **Missing hardening (A05)**. No security headers are set (CSP, HSTS,
  X-Content-Type-Options). **Fix:** add a headers middleware (e.g. `helmet`).

---

**Verdict: No-go (block)** — 2 CRITICAL and 2 HIGH must be fixed before merge.

**Remediation notes:**
- Rotate the Stripe token immediately; deleting the line does not un-leak it (history retains it).
- The injection and traversal share a root cause — request data reaching a sink unsanitized. Sweep the
  other controllers for the same pattern; it is usually copied.
- Re-audit after fixes; verify the IDOR fix returns 404 (not 403) to avoid leaking order existence.

# Security Review

The first pass of every review. These are the highest-impact, most-missed classes. Map to OWASP Top
10; for a deep audit escalate to the `security-auditor` agent and the `owasp-top10` skill.

## Injection

User input must never be interpreted as code/query syntax.

```js
// BAD — SQL injection
db.query(`SELECT * FROM orders WHERE status = '${req.query.status}'`);

// GOOD — parameterized
db.query('SELECT * FROM orders WHERE status = $1', [req.query.status]);
```

- SQL: bind parameters; never string-concatenate. For dynamic columns (sort/filter), **whitelist**
  the allowed set — you can't parameterize an identifier.
- Command: avoid shelling out with user input; if unavoidable, pass an argv array, never a shell
  string.
- Template/XSS: escape output by default; treat any HTML built from input as suspect.

## Broken authorization (IDOR)

The most common real vuln in CRUD apps. Authentication ≠ authorization.

```js
// BAD — authenticated, but ownership never checked
const doc = await db.docs.findById(req.params.id);

// GOOD — verify the caller owns the resource
const doc = await db.docs.findById(req.params.id);
if (!doc || doc.ownerId !== req.session.userId) return res.status(404).end();
```

- Check ownership/role on **every** action that reads or mutates a specific resource.
- Prefer 404 over 403 for resources the caller may not even know exist (avoid leaking existence).
- Don't trust IDs, roles, or prices sent from the client — re-derive server-side.

## Secrets

- No hardcoded keys, tokens, passwords, or connection strings — even in tests or comments.
- Pull from environment variables or a secret manager; validate presence at startup.
- If a secret is found in a diff, flag CRITICAL and instruct rotation — committed secrets are
  compromised even if later removed (git history).

## Unsafe deserialization

- Never deserialize untrusted data with executable formats: Python `pickle`, `yaml.load` (use
  `safe_load`), Java native serialization, PHP `unserialize` on user input.
- Prefer JSON with a schema validator at the boundary.

## Other high-value checks

- **SSRF:** outbound requests to user-supplied URLs must be allow-listed; block internal IP ranges
  and metadata endpoints (`169.254.169.254`).
- **Path traversal:** normalize and confine file paths to a base directory; reject `..` segments.
- **Crypto:** constant-time comparison for tokens (`crypto.timingSafeEqual`); strong, salted hashing
  (argon2/bcrypt/scrypt) for passwords; never MD5/SHA1 for secrets.
- **Rate limiting:** state-changing and auth endpoints should be rate-limited (return 429).
- **Error leakage:** no stack traces or internal details in client-facing error responses.

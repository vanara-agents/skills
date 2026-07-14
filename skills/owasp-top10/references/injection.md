# A03 — Injection (in depth)

Injection happens when untrusted input is interpreted as code in some interpreter (SQL, shell, HTML,
LDAP, etc.). The universal defense: **keep code and data separate**.

## SQL injection
```js
// VULNERABLE
db.query(`SELECT * FROM users WHERE email = '${email}'`);
// FIXED: parameterized / prepared statement
db.query('SELECT * FROM users WHERE email = $1', [email]);
```
Use an ORM or parameterized queries everywhere. Never build SQL by string concatenation, even for
"internal" values — second-order injection bites later.

## Command injection
```js
// VULNERABLE
exec(`convert ${userFile} out.png`);
// FIXED: pass args as an array; no shell interpolation
execFile('convert', [userFile, 'out.png']);
```
Avoid shelling out with interpolated input. If you must, use an args array (no shell) and validate inputs.

## XSS (cross-site scripting)
Untrusted data rendered into HTML executes as script:
```js
// VULNERABLE
el.innerHTML = userComment;
// FIXED: assign as text, or encode for the context
el.textContent = userComment;
```
- Encode for the **output context** (HTML body, attribute, JS, URL) — each needs different encoding.
- Frameworks (React/Vue) auto-escape; the danger is `dangerouslySetInnerHTML` / `v-html` with raw input.
- If you must allow HTML, sanitize with a vetted library, not a homemade regex.

## Why blocklists fail
Stripping `<script>` misses `<img onerror=...>`, encoded payloads, and dozens of vectors. Encode for the
context and/or allow-list — don't try to enumerate every bad input.

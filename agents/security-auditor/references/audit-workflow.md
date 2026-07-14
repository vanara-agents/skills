# Audit Workflow — Step by Step

This is the detailed procedure behind the workflow summarized in `AGENT.md`. Work top to bottom; each
phase produces findings you carry into the report. The governing rule is **source → sink → control**:
a vulnerability exists only when attacker-controlled data reaches a dangerous operation without a
neutralizing control in between.

## Phase 0 — Establish scope

1. Determine the change set: `git diff <base>...HEAD --stat`, or read the modified files directly.
2. Identify the security-relevant surfaces in scope: auth, input handling, data access, file I/O,
   outbound requests, deserialization, templating, secrets/config.
3. Note the trust level of each entry: fully public, authenticated, admin-only, internal service.

## Phase 1 — Map the attack surface

Build two lists. Use `Grep`/`Glob` to populate them quickly.

**Entry points (sources of untrusted data):**
```
req.body | req.query | req.params | req.headers | req.cookies   # web inputs
multipart / file upload handlers                                 # uploaded bytes
process.argv | process.env                                       # CLI / env
message/queue consumers, webhook handlers                        # async inputs
```

**Dangerous sinks:**
```
query( | execute( | raw( | `SELECT ... ${                        # SQL/NoSQL
exec( | execSync( | spawn( | system(                             # OS command
fs.readFile | fs.writeFile | path.join(.*req                     # filesystem
innerHTML | dangerouslySetInnerHTML | res.send(.*req | render(   # HTML/XSS/SSTI
fetch( | axios( | http.get( | requests.get(                      # outbound / SSRF
pickle.loads | yaml.load | eval( | JSON-with-reviver | Deserialize  # deserialization
res.redirect( | Location:                                        # open redirect
```

A finding is born wherever a Phase-1 source feeds a Phase-1 sink. The rest of the workflow checks
each pairing for a neutralizing control.

## Phase 2 — Broken access control (OWASP A01) — do this FIRST

A01 is the most common real-world breach class. For every state-changing or data-returning action:

1. Is there an authentication check? (Necessary, not sufficient.)
2. Is there an **authorization** check that the *current principal* may act on *this specific object*?
   - IDOR test: take any handler that reads `req.params.id` / `req.body.userId` and look for an
     ownership comparison against the session principal. If absent → finding.
3. Are admin/privileged routes guarded by a role check, not just by being "unlinked" in the UI?
4. Are there default-allow branches (`if (denied) {...}` with an implicit allow fall-through)?

Grep starters:
```
findBy.*req.params | findById\(req | where.*req.body.*id
isAdmin | role === | hasPermission | can\(   # confirm these actually gate the action
```

## Phase 3 — Injection (A03)

Trace each untrusted input to its sink and confirm a parameterizing/encoding control exists.

- **SQL/NoSQL:** any query assembled with string concatenation or template literals containing
  request data. Fix = parameterized queries / prepared statements; allow-list identifiers (columns,
  table names, sort direction) since those can't be bound.
- **OS command:** request data in `exec`/`spawn`/`system`. Fix = avoid the shell; pass an argv array
  to `execFile`; allow-list the command and arguments.
- **XSS:** request data rendered into HTML without contextual encoding; `innerHTML`,
  `dangerouslySetInnerHTML`, unescaped template interpolation. Fix = contextual output encoding;
  framework auto-escaping; sanitize with a vetted library only when raw HTML is unavoidable.
- **Template injection (SSTI):** user input concatenated into a template *string* (not passed as
  data). Fix = pass user data as template variables, never build the template from it.

See `vuln-classes.md` for per-class exploit strings and fixes.

## Phase 4 — Secrets & cryptographic failures (A02/A07)

1. Run `node scripts/scan-secrets.mjs "<code>"` (or pipe files) over changed content to catch
   hardcoded AWS keys, bearer/API tokens, and private-key blocks.
2. Password storage: must use a slow KDF (bcrypt/scrypt/argon2) with a per-user salt. MD5/SHA1/SHA256
   for passwords = finding.
3. Token/secret comparison: `a == b` on secrets is timing-attackable. Fix = constant-time compare.
4. Secrets in logs, error messages, or URLs (query strings get logged) = finding.
5. If any secret is found committed, the remediation **includes rotating it** — git history retains
   the old value even after deletion.

## Phase 5 — SSRF, path traversal, open redirect (A01/A10)

- **SSRF:** user-influenced URL/host reaching an outbound fetch. Fix = allow-list of permitted hosts;
  block private/link-local ranges and metadata IPs (`169.254.169.254`); resolve-then-validate.
- **Path traversal:** user input in a filesystem path. Fix = `path.basename` to strip components,
  `path.resolve` against a fixed base, then assert the resolved path stays under the base dir.
- **Open redirect:** user-controlled redirect target. Fix = allow-list of relative paths / known hosts.

## Phase 6 — Insecure deserialization & unsafe sinks (A08)

Untrusted bytes into `pickle.loads`, `yaml.load` (use `safe_load`), `eval`, `Function()`, or native
binary deserializers is a critical RCE class. Also check prototype pollution (`obj[userKey] = val` /
unfiltered `Object.assign` from request bodies). Fix = safe parsers, schema validation, never
deserialize untrusted data into live objects.

## Phase 7 — Misconfiguration & dependencies (A05/A06)

- Debug mode / stack traces exposed in production.
- CORS `Access-Control-Allow-Origin: *` combined with credentials.
- Missing security headers (CSP, HSTS, X-Content-Type-Options, X-Frame-Options).
- Known-vulnerable dependency versions (cross-check lockfile against advisories).

## Phase 8 — Self-check (maker-checker)

For each finding, before it goes in the report:
- Can you state the **input**, the **path**, and the **impact** in one sentence?
- Does the cited `file:line` exist and contain the quoted code?
- Is the proposed fix correct, minimal, and a real control (not a blocklist)?
- Is the severity defensible against the rubric?

Cut anything that fails. A short audit of real findings beats a long one padded with guesses.

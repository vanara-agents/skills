# Identifying Risk Areas

A risk area is any changed line where a mistake has consequences beyond the immediate feature —
security, data integrity, downstream consumers, or operability. Your job is to surface these so the
reviewer spends their attention where it pays off. Walk the whole diff against this taxonomy; do not
rely on the author to have flagged them.

## 1. Security-sensitive code (flag first, always)

Look for changes touching:

- **Authentication / authorization** — login, session, token handling, permission checks, ownership
  checks. A changed or *missing* authz check is the highest-consequence line in most diffs.
- **Secrets** — new API keys, passwords, tokens, connection strings, private keys added to source or
  config. Anything matching `KEY=`, `SECRET`, `TOKEN`, `PASSWORD`, `-----BEGIN` is a stop-and-look.
- **Injection surface** — user input reaching SQL, shell, template, HTML, or file paths. New string
  interpolation into a query or command is a flag.
- **Crypto** — new hashing/comparison of secrets, random-number use for security, TLS/cert config.
- **Input at a trust boundary** — new endpoints, deserialization, file uploads, outbound URLs (SSRF).

You are not auditing — you are pointing. "This PR changes the session check in `auth/session.js:40`;
a reviewer should confirm the authz path" is the right altitude. Deep analysis is the
`security-auditor` agent's job.

## 2. Database migrations (often irreversible)

Migrations are the highest-risk category because they run once, in production, against real data.
Flag every migration file and check for:

- **Non-nullable column with no default** added to a populated table → migration fails or locks.
- **Dropped column / table** → data loss; irreversible without a backup.
- **Type changes / narrowing** → truncation or cast failure on existing rows.
- **Index creation on a large table without `CONCURRENTLY`** → long write lock.
- **Data backfills** embedded in schema migrations → can be slow and non-transactional.

Always ask in the summary: does this run cleanly against a *non-empty* production table? Most
migration incidents come from a migration that passed on an empty test DB.

## 3. Public API / contract changes

A change that others depend on is a change you cannot see the blast radius of. Flag:

- **Signature changes** to exported/public functions, REST/GraphQL endpoints, event schemas.
- **Renamed or removed** public fields, params, routes, env vars.
- **Behavior changes under an unchanged signature** — same function, different return/side effect.
  These are the most dangerous because nothing at the call site looks different.
- **Response-shape changes** that break existing clients (removed field, changed type, new required
  request field).

Call out whether the change is backward-compatible and whether versioning/deprecation is handled.

## 4. Config, dependencies, and infra

Low-visibility, wide blast radius:

- **Dependency changes** — new packages (supply-chain risk), major version bumps (breaking changes),
  removed pins. A new transitive dependency in a lockfile is worth a glance.
- **Config defaults** — timeouts, rate limits, feature flags, pool sizes changed silently. A default
  changed inside a "feature" PR (as in the AGENT.md worked example) is a classic buried risk.
- **CI/CD and infra** — build steps, deploy scripts, Dockerfiles, permissions. A weakened check or a
  disabled test in CI is a flag.

## Turning risk into output

For each flagged item, the Risk areas line names the `file:line`, states the specific risk, and says
why it matters — one sentence. Order the list by consequence, not by file order. When the diff has
*no* elevated risk, say so plainly: "Risk areas: none elevated — mechanical refactor, no security,
migration, or API-surface changes." That is a valid and useful result.

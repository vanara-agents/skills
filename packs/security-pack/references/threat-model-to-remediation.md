# From threat model to remediation: the discipline playbook

A threat model only pays off if its threats become fixes. This playbook is the connective tissue
between `threat-modeler`'s output and a clean `security-auditor` pass — how a STRIDE finding turns
into a mitigation, a test, and an audited change.

## Step 1 — Enumerate with STRIDE (`threat-modeler`)

Walk each trust boundary in the feature and ask the six STRIDE questions. For every "yes", write a
one-line abuse case in the attacker's voice:

```text
Spoofing        → "I replay another user's session token to act as them."
Tampering       → "I change the price field in the checkout request."
Repudiation     → "I perform a refund and there's no log tying it to me."
Info disclosure → "The error response tells me whether an email is registered."
DoS             → "I hit the reset endpoint 10k times with no rate limit."
Elevation       → "I call the admin endpoint with a normal user's token."
```

## Step 2 — Classify and prioritize (`owasp-top10`)

Tag each abuse case with its OWASP category and a severity driven by *impact × likelihood*:

| Abuse case | OWASP | Severity |
|---|---|---|
| Session token replay | A07 Auth failures | HIGH |
| Price tampering | A04 Insecure design / A08 | CRITICAL |
| Missing refund audit log | A09 Logging failures | MEDIUM |
| Email enumeration | A01 Access control | MEDIUM |
| No rate limit on reset | A04 / A07 | HIGH |
| Privilege escalation | A01 Broken access control | CRITICAL |

Fix CRITICAL/HIGH before shipping; schedule MEDIUM/LOW with an owner.

## Step 3 — Design the mitigation (skills)

Each category has a known defense — reach for the skill, don't improvise:

- Access control (A01) → deny by default; authorize every request server-side against the *resource
  owner*, not just "is logged in".
- Auth failures (A07) → `secure-auth`: strong hashing, single-use tokens, constant-time compare,
  rotate on privilege change.
- Insecure design (A04) → re-derive trusted values (price, role) server-side; never trust the client.
- Sensitive data (A02) → `secrets-management` for keys; encrypt at rest; identical responses to
  prevent enumeration.

## Step 4 — Test the abuse case, then implement

Turn each abuse case into a failing test *first*, so the fix has a target and a regression guard:

```text
✗ a request with user B's token cannot mutate user A's resource   (A01)
✗ POST /checkout ignores a client-supplied price field            (A04)
✗ /password-reset returns 429 after N attempts per window         (A07)
```

Implement until green. The test now permanently encodes the threat.

## Step 5 — Audit and scan (`security-auditor` + `vuln-scanner`)

Hand the diff to `security-auditor` with the stage-2 severity table as the agenda — it verifies each
mitigation is present and correct, citing `file:line`. Then `vuln-scanner` sweeps dependencies and
history. Ship only when the CRITICAL/HIGH rows are all closed and the scan is clean.

## The through-line

Threat → OWASP class → mitigation skill → failing abuse-case test → audited fix. When a finding
skips a step — a threat with no test, or a fix with no audit — that's where regressions re-enter.

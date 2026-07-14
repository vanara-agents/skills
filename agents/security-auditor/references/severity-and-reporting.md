# Severity Calibration & Reporting Contract

A finding is only useful if its severity is trustworthy and its report is actionable. This reference
defines how to assign severity and how to structure the audit report.

## Severity definitions

| Severity | Definition | Examples | Action |
|---|---|---|---|
| **CRITICAL** | Directly exploitable for RCE, full auth bypass, or mass data exposure, often pre-auth | SQL injection on a public endpoint, `pickle.loads` on request body, hardcoded live cloud key, path traversal reading arbitrary files | **Block merge.** Fix immediately; rotate secrets if exposed. |
| **HIGH** | Real vulnerability requiring a condition (authentication, a specific input, or chaining) | IDOR readable by any logged-in user, stored XSS, SSRF to internal hosts, weak password hashing | Fix before merge. |
| **MEDIUM** | Genuine weakness with limited impact or a defense-in-depth gap | Missing rate limit on login, verbose error leaking stack traces, permissive but credential-less CORS, reflected XSS needing user interaction in a low-value flow | Should fix; document if deferred. |
| **LOW** | Hardening or best-practice nit with no direct exploit | Missing `X-Content-Type-Options` header, cookie without `SameSite`, overly long session TTL | Optional. |

## Calibration rules

1. **No exploit, no HIGH+.** If you cannot state the input, path, and impact, it is at most MEDIUM.
2. **Reachability matters.** A SQL injection behind an admin-only, MFA-gated route is HIGH, not
   CRITICAL — note the mitigating control explicitly.
3. **Data sensitivity scales severity.** IDOR on public profile data is MEDIUM; IDOR on financial or
   PII records is HIGH/CRITICAL.
4. **Don't inflate to seem thorough.** A missing header is never CRITICAL. Miscalibration makes the
   whole report ignorable.
5. **Don't deflate to avoid blocking.** A real injection is CRITICAL even if "it's just an internal
   tool". Internal tools get breached too.
6. **Defense-in-depth gaps are real but lower.** A second control missing where a first still holds is
   typically MEDIUM/LOW — say "the primary control holds; this is hardening".

## OWASP mapping

Every finding cites its OWASP Top 10 (2021) category so readers can group and prioritize. See the
mapping table in `vuln-classes.md`. If a finding spans two (e.g. SSRF enabling secret theft), list the
primary and mention the chain.

## Report contract

The audit report MUST contain, in order:

1. **Title line** — `## Security Audit — <component / branch>`.
2. **Findings grouped by severity**, highest first. Each finding includes:
   - a `file:line` anchor;
   - the OWASP category in bold;
   - a one-sentence exploit scenario (input → path → impact);
   - a **Fix:** with corrected code or a precise action — a real control, not a blocklist.
3. **Verdict** — exactly one of **Go** / **Go-with-fixes** / **No-go (block)**, with the count of
   blocking findings.
4. **Remediation notes** — any cross-cutting action (e.g. "rotate the leaked DB credential; the value
   remains in git history").

## Verdict rules

- Any **CRITICAL** → **No-go (block)**.
- Any **HIGH** and no CRITICAL → **Go-with-fixes** (fix the HIGHs before merge).
- Only MEDIUM/LOW → **Go-with-fixes** if owner agrees to track, else **Go**.
- Nothing found after a real audit → **Go**, and say so plainly. A clean verdict from a thorough pass
  is a valid, valuable result — do not invent findings to justify the effort.

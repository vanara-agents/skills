---
name: security-pack
description: Build and ship secure software — threat modeling at design time, OWASP code audits, dependency/secret scanning, and secure auth and secrets handling, sequenced into one shift-left workflow.
type: pack
version: 2.0.0
updated: 2026-07-06
agents: [threat-modeler, security-auditor, vuln-scanner]
skills: [owasp-top10, secure-auth, secrets-management]
---
# Security Pack

Security is cheapest when it moves **left** — designed in at the whiteboard, enforced while the code
is written, verified before merge, and monitored in the supply chain. This pack bundles three agents
and three skills that cover that whole arc and, more importantly, teaches **which one to reach for at
each stage of a feature's life**.

The value of a pack is not the list of items — it is the sequencing. A threat model with no audit is
a document nobody enforces; an audit with no threat model is a checklist with no context. This
document ties them into one repeatable loop: **model → build → audit → scan → ship**.

## Who this is for

- Security engineers who own the security posture of a product or service.
- Developers who own the security of the features they build — the ones expected to threat-model,
  self-audit, and keep their dependencies clean before asking for review.
- Tech leads introducing a shift-left practice to a team that currently bolts security on at the end.

If you only need a one-off review of an existing diff, the `security-auditor` agent alone is enough.
Reach for the full pack when you are carrying a feature **from design through to a clean merge** and
want security enforced at every handoff instead of a single gate at the finish line.

## What's included

| Item | Kind | Job in the workflow |
|---|---|---|
| `threat-modeler` | agent | STRIDE-style threat modeling at design time — enumerate attack surface, trust boundaries, and abuse cases before code exists |
| `security-auditor` | agent | OWASP-focused code review of the diff — injection, auth flaws, broken access control, unsafe crypto |
| `vuln-scanner` | agent | Dependency CVE scanning and secret detection across the tree and git history |
| `owasp-top10` | skill | Per-risk defenses for the OWASP Top 10 — the reference the auditor and you apply |
| `secure-auth` | skill | Correct password hashing, session/token handling, and MFA construction |
| `secrets-management` | skill | Keep secrets out of source, load them safely, and rotate without downtime |

Agents *do* the work; skills are the *reference* they (and you) apply while doing it. Pair an agent
with its matching skill — `security-auditor` + `owasp-top10`, or building auth with `secure-auth` —
so the output is both produced and grounded in a standard.

## The end-to-end workflow

A secure feature moves through five stages. The pack maps one primary item to each:

```text
1. Model   → threat-modeler   (+ owasp-top10)        enumerate threats before code
2. Build   → secure-auth / secrets-management        implement the risky parts correctly
3. Audit   → security-auditor (+ owasp-top10)        review the diff, security-first
4. Scan    → vuln-scanner                            CVEs in deps + secrets in the tree
5. Ship    → gate on: no open CRITICAL/HIGH, clean scan
```

Model **first**, before any code. A threat model produced after the feature is built is a
rationalization, not a design tool — its whole purpose is to change what you build. The threats it
surfaces become the audit checklist in stage 3 and the abuse-case tests you write while building.

### Worked example: adding "password reset via email link"

```text
threat-modeler   → surfaces: token guessability, token reuse/replay, host-header poisoning in the
                   reset link, user enumeration on the "email sent" response, rate-limit bypass
owasp-top10      → maps those to A01 (access control), A07 (auth failures), A04 (insecure design)
secure-auth      → reset token = 256-bit random, single-use, 15-min TTL, hashed at rest; response is
                   identical whether or not the email exists (no enumeration)
secrets-management → the email-provider API key is loaded from the secret store, never in the repo
security-auditor → confirms token is compared in constant time, is invalidated on use, and the
                   "sent" response leaks nothing; flags the missing rate limit as HIGH
vuln-scanner     → the email SDK pulls a transitive dep with a known SSRF CVE — flagged, bump required
```

Every item earned its place: the threat model set the agenda, the skills shaped the implementation,
the auditor verified it, and the scanner caught a supply-chain issue no human review would have.

## How to choose the right item

- **Designing a feature that touches auth, money, or user data?** `threat-modeler` + `owasp-top10`
  first — enumerate abuse cases before a line is written.
- **Implementing login, sessions, or MFA?** `secure-auth` — do not hand-roll password hashing or
  token generation.
- **About to reference a credential, key, or token?** `secrets-management` — it never belongs in
  source, config committed to git, or a client bundle.
- **Diff ready for review?** `security-auditor` — security pass before correctness, every time.
- **Before merge, always?** `vuln-scanner` — CVEs and leaked secrets are invisible to code review.

See `references/choosing-the-right-tool.md` for the full decision table, `references/workflow.md` for
the stage-by-stage playbook, and `references/threat-model-to-remediation.md` for the discipline
playbook that connects a threat model to concrete fixes. Two complete runs are in `examples/`.

## Common pitfalls (anti-patterns this pack prevents)

- **Threat-modeling after the build.** A model written to justify existing code enumerates the
  threats you already handled and misses the ones you didn't. The workflow puts it at stage 1 so it
  can actually change the design.
- **Auditing without a threat model.** A generic OWASP checklist misses domain abuse cases (e.g. a
  refund flow that can go negative). The threat model *is* the audit's context.
- **Treating secret scanning as one-time.** A secret committed once lives in git history forever even
  after it's deleted from HEAD. `vuln-scanner` checks history, and the fix is rotation, not just
  removal.
- **Rolling your own crypto/auth.** Hand-rolled password hashing, JWT verification, or token
  comparison is a reliable source of criticals. `secure-auth` points to vetted constructions.
- **Fixing the secret, forgetting to rotate.** Deleting a leaked key from source does not un-leak it.
  Any exposed secret must be rotated, not just removed.

## When NOT to use this pack

- **Compliance/audit-trail work** (GDPR, SOC 2 evidence) — that's `compliance-auditor` and the
  privacy/audit-logging skills, not this pack's application-security focus.
- **Infrastructure and network hardening** — firewall rules, TLS termination, and cloud IAM are
  DevOps/network territory, not application-code security.
- **A one-line, no-risk change** — a copy tweak or a CSS fix does not need a threat model; a single
  `security-auditor` pass (or nothing) is proportionate.
- **Smart-contract security** — use `smart-contract-auditor` and `smart-contract-security`; the
  threat surface there is different.

## Files in this package

- `references/workflow.md` — the five-stage security workflow in detail, with entry/exit criteria.
- `references/choosing-the-right-tool.md` — full decision table: symptom → item.
- `references/threat-model-to-remediation.md` — the discipline playbook connecting STRIDE threats to
  audited, tested remediations.
- `examples/threat-model-then-audit.md` — a feature threat-modeled at design time, then audited.
- `examples/owasp-vuln-triage-and-fix.md` — an OWASP-class vulnerability triaged and remediated.

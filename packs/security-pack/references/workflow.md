# The five-stage security workflow

Each stage has an owner (the primary item), the skills it applies, and an explicit **exit criterion**
— you don't advance until the criterion is met. This is what keeps security from collapsing into a
single rushed review at the end.

## Stage 1 — Model

- **Owner:** `threat-modeler` · **Applies:** `owasp-top10`
- Draw the trust boundaries (client, server, third parties, data store). For each boundary, walk
  STRIDE — Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of
  privilege — and write down the concrete abuse cases for *this* feature.
- Map each threat to its OWASP Top 10 category so the audit later has a checklist.
- **Exit criterion:** a written list of threats, each tagged with an OWASP category and a planned
  mitigation, that the build and audit stages can reference.

## Stage 2 — Build

- **Owners:** `secure-auth`, `secrets-management` (as the feature demands)
- Implement the risk-bearing parts against a vetted construction, not from memory. Auth: correct
  hashing, single-use tokens, constant-time comparison, no user enumeration. Secrets: loaded from a
  store or environment, never committed, never shipped to the client.
- Write the abuse-case tests from stage 1 alongside the implementation.
- **Exit criterion:** the risky paths are implemented per the skills' guidance and the abuse-case
  tests pass.

## Stage 3 — Audit

- **Owner:** `security-auditor` · **Applies:** `owasp-top10`
- Review the diff security-first, using the stage-1 threat list as the agenda: broken access control
  (IDOR/authorization), injection, auth failures, unsafe crypto, sensitive-data exposure. Every
  finding cites `file:line`, a severity, and a concrete fix.
- **Exit criterion:** no CRITICAL or HIGH finding remains open.

## Stage 4 — Scan

- **Owner:** `vuln-scanner`
- Scan dependencies (including transitive) for known CVEs, and scan the working tree **and git
  history** for secrets. A secret found in history is treated as exposed even if HEAD is clean.
- **Exit criterion:** no unaddressed CVE at High/Critical severity; no secret in tree or history
  (removal alone is insufficient for a real leak — see below).

## Stage 5 — Ship

- **Gate:** no open CRITICAL/HIGH audit finding, clean dependency scan, no committed secret.
- If a secret was ever exposed, it is **rotated**, not merely deleted. If a CVE has no patch,
  document the risk acceptance or apply a mitigating control before shipping.
- **Exit criterion:** all gates green; any accepted risk is written down with an owner.

## Why order matters

The threat model is the shared dependency of every later stage — it sets what to build carefully in
stage 2 and what to look for in stage 3. Building before modeling means you protect the wrong things.
Auditing before scanning means you can pass human review while a vulnerable dependency or a leaked key
sits in the tree. Skipping or reordering stages is the single biggest source of shipped
vulnerabilities.

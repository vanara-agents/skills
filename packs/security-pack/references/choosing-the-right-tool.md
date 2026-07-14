# Choosing the right item: symptom → tool

When you're mid-feature and not sure what to reach for, match the symptom to the item.

| Symptom / task | Reach for | Why |
|---|---|---|
| "New feature touches auth, money, or PII" | `threat-modeler` + `owasp-top10` | Enumerate abuse cases before code exists |
| "Which OWASP risk applies here?" | `owasp-top10` | The per-risk defense reference |
| "I'm building login / sessions / MFA" | `secure-auth` | Vetted hashing, tokens, session handling |
| "I need to reset passwords / issue tokens" | `secure-auth` | Single-use, TTL'd, constant-time compared |
| "Where does this API key / credential go?" | `secrets-management` | Never in source; loaded from a store |
| "Diff is ready for review" | `security-auditor` + `owasp-top10` | Security-first code review before merge |
| "Is a dependency vulnerable?" | `vuln-scanner` | CVEs, including transitive, are invisible to review |
| "Did a secret get committed?" | `vuln-scanner` | Scans tree *and* git history |
| "A secret leaked — now what?" | `secrets-management` | Rotate, don't just delete |

## Agent + skill pairings

Each agent has a natural skill partner. Use them together:

- `threat-modeler` + `owasp-top10` — enumerate threats *and* tag each with the risk category that
  drives its defense.
- `security-auditor` + `owasp-top10` — the auditor reviews against a concrete Top 10 checklist rather
  than a vibe.
- Building auth or handling secrets — apply `secure-auth` / `secrets-management` *while writing*, not
  as an afterthought the auditor has to catch.

## Escalation boundaries

- Regulatory/compliance evidence (GDPR, SOC 2, audit trails) → `compliance-auditor` and the
  privacy/audit-logging skills, not this pack.
- Infrastructure, network, TLS, and cloud IAM hardening → DevOps/network specialists; this pack is
  application-code security.
- Smart-contract vulnerabilities → `smart-contract-auditor` + `smart-contract-security`; the threat
  surface differs from web app security.
- A CVE with no available patch → this is a risk-acceptance decision (document + mitigate), not
  something `vuln-scanner` resolves for you.

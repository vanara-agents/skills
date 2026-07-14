# Example: Vulnerability Scan Report

A worked example of the report shape this agent produces. Note the structure: a tight summary, a short
*fix now* list, then everything else ranked below it. The raw scan had 47 findings; triage reduced the
release-blocking set to 3.

---

## Summary

- **Scope:** npm dependencies (lockfile), source secret scan, Dockerfile base image.
- **Findings:** 1 critical, 2 high, 6 medium, 38 low/info (47 raw -> 9 actionable after triage).
- **Most urgent:** rotate the AWS key committed in `config/legacy.env` — assume compromised.

## Fix now (release-blocking)

| Item | Severity | Fix | Breaking? | Reachability |
|---|---|---|---|---|
| AWS access key in `config/legacy.env` | critical | rotate in IAM, move to env var | n/a | Live credential, public history |
| `lodash@4.17.15` (CVE-2020-8203) | high | -> `4.17.21` | no | Reachable via `util/merge.js` |
| `axios@0.21.0` (SSRF, CVE-2021-3749) | high | -> `0.21.4` | no | Used in outbound webhook client |

## Plan (schedule, not blocking)

- **`next@12 -> 14` (3 medium CVEs):** breaking major. Clears 3 advisories but requires app-router
  migration review. Estimate: 1 sprint. Group as one coordinated upgrade.
- **`debug=true` in `config/prod.json`:** medium. Leaks stack traces to clients; set `false`.
- **6 transitive medium CVEs in dev-only deps:** real but build-time only; bump opportunistically.

## Exposed secrets

| Secret | Location | Action |
|---|---|---|
| AWS access key `AKIA…` | `config/legacy.env:4` | **Rotate** in IAM (revoke old), replace with `AWS_ACCESS_KEY_ID` env var, add pre-commit secret hook |
| Slack webhook URL | `scripts/notify.sh:12` | Rotate webhook in Slack, move to secret manager |

Removal from the latest commit is **not** sufficient — both are still valid at the provider.

## Config / container risks

- **Base image `node:18.0-alpine`:** carries 4 OS-package CVEs. Bump to current `node:18-alpine` patch.
- **Container runs as root:** add a non-root `USER` to the Dockerfile.

## Accepted / suppressed (with reason)

- **CVE-2025-XXXX in `fast-xml@3.1.0` (CVSS 9.8):** vulnerable `parseAttrs` path requires
  `allowAttributes:true`; app uses defaults. Downgraded critical -> medium, scheduled.
- **`AKIAEXAMPLE…` in `docs/setup.md`:** documentation placeholder, not a live key. Suppressed.
- **CVE in `jest@…`:** dev/test-only dependency, not in production bundle. Backlog.

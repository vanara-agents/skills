# Finding Template

The canonical shape of a single triaged finding. Every finding the agent reports should carry these
fields so the reader never has to ask "is it real?", "does it matter here?", or "what do I do?".

## Fields

| Field | Required | Description |
|---|---|---|
| `id` | yes | Advisory ID (CVE/GHSA) or a stable local id for non-CVE findings |
| `title` | yes | One-line human summary |
| `type` | yes | `dependency` \| `secret` \| `config` \| `sast` \| `container` |
| `package` / `location` | yes | Affected package@version, or file:line |
| `severity` | yes | Final triaged severity: `critical`/`high`/`medium`/`low`/`info` |
| `cvss` | when known | Raw scanner score, shown alongside the adjusted severity |
| `reachability` | yes | `reachable` \| `unreachable` \| `dev-only` \| `unknown` + one-line reason |
| `fix` | yes | Concrete remediation (fix version, rotate, config change) |
| `breaking` | deps only | `yes` / `no` — semver/changelog judgment |
| `bucket` | yes | `fix-now` \| `plan` \| `accept-monitor` |
| `notes` | optional | Triage reasoning, especially any severity adjustment |

## Worked example (dependency)

```json
{
  "id": "CVE-2020-8203",
  "title": "Prototype pollution in lodash",
  "type": "dependency",
  "package": "lodash@4.17.15",
  "severity": "high",
  "cvss": 7.4,
  "reachability": "reachable — called from util/merge.js with request data",
  "fix": "upgrade to lodash@4.17.21",
  "breaking": "no",
  "bucket": "fix-now",
  "notes": "Direct dependency; minimal patch bump clears the advisory."
}
```

## Worked example (secret)

```json
{
  "id": "SECRET-001",
  "title": "AWS access key committed to repo",
  "type": "secret",
  "location": "config/legacy.env:4",
  "severity": "critical",
  "reachability": "reachable — live credential in shared history",
  "fix": "rotate in IAM (revoke old key), replace with AWS_ACCESS_KEY_ID env var, add pre-commit hook",
  "bucket": "fix-now",
  "notes": "Assume compromised. Removal from latest commit is NOT sufficient — rotation required."
}
```

This is also the schema `scripts/parse-scan-results.mjs` normalizes toward (it keys on `id` + `package`
for dedup and sorts by `severity`).

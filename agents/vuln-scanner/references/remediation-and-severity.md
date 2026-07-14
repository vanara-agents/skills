# Remediation and Severity

Once a finding is triaged, the deliverable is a *fix the reader can act on*. This reference defines the
severity scale, the dependency-fix strategy, and the secret-rotation playbook.

## Severity scale

Use a single normalized scale across all scan families so the report is comparable:

| Severity | Meaning | Default action |
|---|---|---|
| `critical` | Reachable RCE, auth bypass, or active secret leak | Block release; fix now |
| `high` | Serious impact, exploitable with moderate effort | Fix before release |
| `medium` | Real but constrained (limited reach or impact) | Schedule next sprint |
| `low` | Minor / hardening | Backlog |
| `info` | Awareness only | No action required |

Final severity = scanner severity **adjusted by reachability and impact** (see
[triage-and-false-positives](triage-and-false-positives.md)). Always show your adjustment reasoning.

## Dependency remediation strategy

For every vulnerable dependency, state the fix version and whether it's breaking:

1. **Prefer the minimal bump that clears the CVE.** If `1.2.3 -> 1.2.4` fixes it, recommend that, not
   the latest 3.x.
2. **Label breaking vs. non-breaking** by semver distance and changelog. Crossing a major is breaking
   until proven otherwise.
3. **Transitive deps:** if you don't own the dependency directly, fix via the parent bump, or a
   lockfile override / resolution (`overrides` in npm, `resolutions` in yarn/pnpm) — and flag overrides
   as a temporary measure, not a permanent pin.
4. **Group breaking upgrades separately** under *plan* with a migration-risk note. Never bundle a risky
   major bump into a "quick fix" list.
5. **No fix available?** Document the mitigation (disable the feature, add input validation, network
   isolation) and mark for monitoring.

```text
Fix-now bucket  -> non-breaking bumps that clear critical/high, reachable
Plan bucket     -> breaking upgrades, lower-severity, or coordinated changes
Accept/monitor  -> no fix yet, or risk-accepted with justification
```

## Secret remediation — rotation, not removal

A committed secret is compromised the moment it lands in a shared repo. The fix is always:

1. **Rotate first.** Issue a new credential at the provider and revoke the old one. Until this is done,
   the secret is live regardless of repo state.
2. **Remove from code.** Replace with an env var or secret-manager reference.
3. **Purge from history** if required (history rewrite or, more often, treat as exposed and rely on
   rotation — rewriting shared history is disruptive and incomplete if the repo was cloned/forked).
4. **Add prevention.** A pre-commit secret hook and a `.gitignore` entry so it doesn't recur.

> "Deleted the key in the latest commit" is **not** remediation. The credential is still valid at the
> provider and still present in every prior commit, clone, and CI cache.

## Writing the remediation line

Each finding's recommendation should be copy-pasteable and unambiguous:

```text
lodash 4.17.15 -> 4.17.21   | high | non-breaking | prototype-pollution CVE-2020-8203, reachable in util/merge.js
AWS key in config/old.env   | critical | rotate    | revoke in IAM, replace with env var, add pre-commit hook
debug=true in prod config    | medium | config     | set debug=false; leaks stack traces to clients
```

Tie remediation effort to severity so the reader can plan: a *fix now* of ten non-breaking bumps is an
afternoon; one breaking major in *plan* may be a sprint. Make that tradeoff visible.

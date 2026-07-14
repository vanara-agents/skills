# Scan Types and Tools

Vulnerability scanning is not one activity — it is a family of complementary techniques, each with a
different blind spot. A credible scan combines several. Use this reference to pick the right family for
the target and to understand what each one *cannot* see.

## SCA — Software Composition Analysis (dependency scanning)

Matches your resolved dependency versions against known-vulnerability databases (CVE/NVD, GitHub
Advisory, OSV).

- **Inputs:** lockfiles (`package-lock.json`, `pnpm-lock.yaml`, `poetry.lock`, `Cargo.lock`, `go.sum`).
  Always read the **lockfile**, not the manifest range — `^1.2.0` tells you nothing about what shipped.
- **Strengths:** high-precision for *known* CVEs; cheap; covers transitive deps.
- **Blind spots:** zero-days, logic bugs, anything not yet in an advisory DB. Version-only matching can
  over-report (advisory may need a specific feature flag).
- **Triage hook:** flag direct vs. transitive — a transitive CVE may be fixable only by bumping the
  parent, or pinning via an override/resolution.

```bash
# Inventory before judging — never trust the manifest range alone
node -e "const l=require('./package-lock.json');console.log(Object.keys(l.packages||{}).length,'resolved packages')"
```

## Secret scanning

Finds credentials committed to the repo: API keys, tokens, private keys, connection strings,
high-entropy blobs.

- **Inputs:** working tree by default; git history when explicitly requested.
- **Detection:** known-format regexes (e.g. `AKIA…` AWS keys, `ghp_…` GitHub tokens, `-----BEGIN ...
  PRIVATE KEY-----`) plus entropy heuristics.
- **Blind spots:** secrets in untracked files, encrypted blobs, or rotated-but-still-referenced values.
- **Critical rule:** a found secret is assumed compromised. Removal ≠ remediation. See
  [remediation-and-severity](remediation-and-severity.md) for the rotation playbook.

```bash
# Cheap first pass for common key formats (illustrative — a real scan uses a tool)
grep -rERn 'AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36}|-----BEGIN [A-Z ]*PRIVATE KEY-----' . \
  --include='*.*' || echo "no obvious key-format matches"
```

## SAST — Static Application Security Testing

Analyzes source/AST for vulnerable patterns: injection sinks, unsafe deserialization, path traversal,
hardcoded crypto, tainted-data flows.

- **Strengths:** finds bugs in *your* code, not just dependencies; runs without deploying.
- **Blind spots:** high false-positive rate; struggles with dynamic dispatch and framework magic;
  cannot judge runtime config.
- **Triage hook:** SAST output needs the heaviest false-positive filtering. Confirm the sink is
  reachable with attacker-controlled input before alarming.

## DAST — Dynamic Application Security Testing

Probes a *running* application from the outside: injection, auth handling, misconfigured headers, TLS.

- **Strengths:** finds runtime/config issues SAST can't see; low false positives for what it confirms.
- **Blind spots:** only covers exercised endpoints; needs a deployed target; can be destructive.
- **Boundary:** this agent does **not** perform live DAST/exploitation — that is a pen-test activity.
  Note when DAST is warranted and hand off.

## Container & IaC scanning

When a `Dockerfile`, image, or infra-as-code (Terraform, Kubernetes manifests) is present:

- **Base-image CVEs:** OS packages in the image carry their own advisories; a clean app on a stale base
  image is still vulnerable.
- **Image hygiene:** running as root, secrets baked into layers, unpinned `latest` tags.
- **IaC misconfig:** public S3 buckets, `0.0.0.0/0` security groups, disabled encryption.

## Choosing per target

| Target present | Run | Primary risk caught |
|---|---|---|
| Lockfile | SCA | Known CVEs in deps |
| Any source | Secret scan + SAST | Leaked creds, injection sinks |
| Dockerfile / image | Container scan | Base-image CVEs, root, baked secrets |
| Terraform / k8s | IaC scan | Public exposure, weak crypto config |
| Deployed URL | DAST (hand off) | Runtime/config exploits |

No single family is sufficient. Combine, then triage everything through
[triage-and-false-positives](triage-and-false-positives.md).

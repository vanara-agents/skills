# Secret Managers — Env Vars vs Vault vs Cloud KMS

Where the *truth* of a secret lives. Environment variables deliver secrets to a process; they do not
securely store them. For anything past a single laptop, the source of truth belongs in a manager.

## Why env vars are not a store

Env vars are convenient and universal, but:
- They are inherited by **child processes** — a shelled-out command sees every secret.
- They appear in `/proc/<pid>/environ`, crash dumps, and many APM/observability agents.
- They are trivially leaked by `console.log(process.env)` or an error reporter that captures context.
- They are **static** — no rotation, no expiry, no audit trail of who read what.

Use them as the *delivery* channel (the app reads `process.env.X`), but populate them from a manager.

## Options compared

| Manager | Model | Strengths | Costs / caveats |
|---|---|---|---|
| HashiCorp Vault | central server, dynamic secrets | short-lived DB/cloud creds, leasing, rich audit | run/operate a server; auth bootstrap |
| AWS Secrets Manager / SSM | managed, IAM-scoped | native rotation Lambdas, IAM policies | AWS-only; per-secret cost |
| GCP Secret Manager | managed, IAM-scoped | versioning, IAM, CMEK | GCP-only |
| Azure Key Vault | managed, RBAC + keys | HSM-backed keys, certs + secrets | Azure-only |
| Cloud KMS | key custody, not blob store | envelope encryption of your own data | you still store the ciphertext somewhere |

## The bootstrap-auth problem

A manager removes secrets from your repo, but the app still needs **one** credential to authenticate to the
manager. Solve it with platform identity, not another static secret:
- **Workload identity / IAM roles** — the cloud assigns the running instance an identity; no key to store.
- **Vault auth methods** — Kubernetes service-account JWT, AWS IAM, or AppRole with a short-lived secret-id.
- **OIDC federation** in CI — the pipeline exchanges a signed OIDC token for short-lived cloud creds; no
  long-lived keys in CI settings.

The goal: the only thing on disk is an *identity*, and the actual secrets are fetched at runtime over TLS.

## Dynamic, short-lived credentials

The biggest win of a real manager is **generated-on-demand** credentials:
```
# Conceptual: Vault issues a DB credential that auto-expires
GET vault/database/creds/app-readonly
-> { username: "v-app-ro-7f3a", password: "<generated>", lease_duration: 3600 }
```
The credential lives one hour, is unique to this request, and is revoked automatically. A leak is bounded
by the lease, and every issuance is in the audit log.

## Choosing

- Solo / hobby: gitignored `.env` + a pre-commit scanner. A manager is overkill.
- Team / multi-env / compliance: a managed secret manager with IAM-scoped access and rotation.
- Encrypting your own data at rest: KMS envelope encryption (see `rotation.md` for key rotation).

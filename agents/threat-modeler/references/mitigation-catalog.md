# Mitigation Catalog

Reusable, concrete mitigations indexed by STRIDE category. Use these as a starting point — then make each
one *specific* to the threat it addresses (name the endpoint, the field, the store). A mitigation that
could be copy-pasted into any model unchanged is too vague to verify.

Every mitigation should be **testable**: you should be able to write a test or a check that proves it is
present and working.

## Spoofing → strengthen authentication

| Control | Notes |
|---|---|
| Strong authentication (OIDC/OAuth2, WebAuthn) | Avoid rolling your own; use established protocols |
| MFA on sensitive accounts and actions | Step-up auth for high-value operations (transfers, role changes) |
| Mutual TLS for service-to-service | Each service proves its identity, not just the client |
| Short-lived, signed tokens (JWT with `exp`, audience, issuer checks) | Validate signature, expiry, `aud`, `iss` server-side every request |
| Anti-automation on login (rate limit, lockout, CAPTCHA/proof-of-work) | Defends credential stuffing and brute force |

## Tampering → protect integrity

| Control | Notes |
|---|---|
| TLS for all data in transit | Prevents on-path modification |
| Server-side input validation against an allow-list/schema | Validate at the trust boundary, before use; never trust client checks |
| Parameterized queries / prepared statements | Eliminates SQL injection tampering |
| HMAC or digital signatures on critical messages | Detects modification of webhooks, tokens, inter-service messages |
| Integrity checks on stored data (checksums, append-only stores) | Detect or prevent at-rest modification |
| Subresource Integrity (SRI) on third-party scripts | Detects tampered CDN assets |

## Repudiation → ensure accountability

| Control | Notes |
|---|---|
| Tamper-evident audit log of security-relevant actions | Append-only or signed; actor, action, timestamp, before/after |
| Logs stored outside the actor's control | An admin should not be able to edit logs of their own actions |
| Synchronized, trusted timestamps | NTP; record server time, not client-claimed time |
| Correlation/request IDs across services | Reconstruct an action end-to-end |

## Information disclosure → enforce confidentiality

| Control | Notes |
|---|---|
| Encryption at rest for sensitive stores | DB/disk/bucket encryption; manage keys in a KMS |
| TLS in transit (see Tampering) | Confidentiality + integrity together |
| Least-privilege data access; field-level authz | Return only what the caller is entitled to |
| Generic error messages externally; detail in server logs only | Don't leak stack traces, SQL, or existence (404 vs 403) |
| Scrub secrets/PII from logs and telemetry | Redact tokens, card numbers, emails before logging |
| Avoid IDOR | Check resource *ownership*, not just authentication |

## Denial of service → preserve availability

| Control | Notes |
|---|---|
| Rate limiting and quotas per client/key | Return `429` + `Retry-After`; defend per-tenant |
| Timeouts and circuit breakers on outbound calls | Stop a slow dependency from exhausting your threads |
| Input size and complexity limits | Cap payload size, page size, query depth, regex complexity (ReDoS) |
| Resource pooling and back-pressure | Bounded queues; shed load instead of collapsing |
| CDN/WAF and autoscaling for public surfaces | Absorb volumetric floods upstream |

## Elevation of privilege → enforce authorization

| Control | Notes |
|---|---|
| Centralized, server-side authorization on every action | Deny by default; never rely on hidden UI or client checks |
| Principle of least privilege for processes and tokens | Minimal DB grants, scoped tokens, no ambient admin |
| Sandboxing / isolation of untrusted input handling | Separate parsing/deserialization from privileged logic |
| Avoid unsafe deserialization, template injection, path traversal | Allow-list types/paths; canonicalize before checks |
| Re-check authz after any state or role change | Don't cache a stale privilege decision across a privilege change |

## Choosing among controls

- Prefer **eliminating** a threat (remove the feature/flow) over mitigating it.
- Prefer a **single well-placed control at the trust boundary** over many scattered patches.
- Layer controls so the failure of one (a bypassed WAF, a leaked token) is not total (defense in depth).
- For any threat you choose **not** to mitigate, record it as an accepted/transferred risk with a named
  owner and rationale — see `AGENT.md` output format.

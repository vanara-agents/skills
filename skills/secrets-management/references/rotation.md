# Secret Rotation

Rotation is the control that turns a leak into a non-event. A credential that is rotated regularly and can
be rotated *fast* limits how long any exposure is useful.

## Two triggers

1. **Scheduled rotation** — replace credentials on a fixed cadence so none becomes ancient.
   - Long-lived static keys: every 30–90 days.
   - Signing keys (JWT, sessions): rotate with overlap; keep the previous key valid for verification until
     all issued tokens expire.
   - Prefer **short-lived dynamic credentials** so "rotation" is automatic and continuous.
2. **Reactive rotation** — rotate **immediately** on any suspected exposure: a key in a commit, a leaked
   log, a laptop loss, a departing employee, or a third-party breach. Do not wait to "confirm" — rotate first.

## Zero-downtime overlap pattern

Never rotate by deleting the old credential first — that causes an outage. Overlap instead:

1. **Provision** a new credential alongside the old one (both valid).
2. **Deploy / inject** the new value (update the secret manager; let instances pick it up).
3. **Verify** the new credential works in production (health check, canary).
4. **Revoke** the old credential.
5. **Confirm** nothing broke; check error rates and audit logs for use of the revoked key.

```
old key: valid ============================x (revoked at step 4)
new key:           valid =========================================>
                   ^deploy   ^verify        ^safe to revoke old
```

For **signing keys**, the overlap must outlast the longest token lifetime: publish both keys (by key id),
sign with the new one, accept either for verification, and drop the old key only after every token signed
with it has expired.

## KMS / envelope-encryption key rotation

When you encrypt data yourself, rotate the **key-encryption key** (KEK) in KMS without re-encrypting every
record: data is encrypted with per-record data keys, which are themselves encrypted by the KEK. Rotating the
KEK re-wraps data keys lazily. Keep old KEK versions enabled for decryption until re-wrap completes.

## Automate it

Manual rotation is rotation that doesn't happen. Use the manager's native rotation (AWS rotation Lambdas,
Vault leases, GCP versions) so the cadence is enforced by infrastructure, not a calendar reminder. See
`leak-response.md` for the reactive path and `examples/rotation-runbook.md` for a fill-in checklist.

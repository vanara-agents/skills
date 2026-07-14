# Rotation / Leak Runbook (fill-in)

Copy this into your incident tracker and fill the blanks. The goal of the first hour is to make the leaked
credential useless — rotate first, investigate second.

## Incident header

- **Date / time detected (UTC):** ________
- **Detected by:** (scanner / human / third-party report) ________
- **Credential type:** (API key / DB password / signing key / deploy token / other) ________
- **Where it leaked:** (commit SHA / log / screenshot / paste / laptop) ________
- **Likely exposure window start:** ________

## Step 1 — Rotate / revoke (do this FIRST)

- [ ] Provision replacement credential
- [ ] Deploy / inject new value via secret manager
- [ ] Verify new credential works in production
- [ ] Revoke the leaked credential
- [ ] New credential id / version: ________

## Step 2 — Assess blast radius

- [ ] What can this credential do? ________
- [ ] Which environments / data are reachable? ________
- [ ] Could it have unlocked other secrets? (list) ________

## Step 3 — Check for abuse

- [ ] Pulled audit logs since exposure window: yes / no
- [ ] Unfamiliar IPs / regions / patterns found? ________
- [ ] Derived sessions/tokens revoked if needed: yes / n/a

## Step 4 — Notify

- [ ] Owning team notified
- [ ] Security / compliance notified (if required by policy)

## Step 5 — Cleanup (after rotation)

- [ ] Scrubbed value from git history (`git filter-repo`)
- [ ] Invalidated CI caches / mirrors
- [ ] Did NOT paste the raw secret into this ticket

## Step 6 — Prevent recurrence

- [ ] Added/tightened scanner rule that missed it
- [ ] Pre-commit + CI secret gate in place
- [ ] Post-incident timeline written
- [ ] Owner: ________  Due: ________

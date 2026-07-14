# Leak Response — The First Hour

When a secret leaks, speed beats blame. The credential is burned; your job is to make it useless before it
is abused. Deleting the commit is **not** a fix — history persists in clones, forks, CI caches, and mirrors.

## Immediate steps (in order)

1. **Rotate / revoke the credential first.** Generate a replacement and invalidate the leaked value. This
   is the only action that actually closes the hole. Everything else is cleanup.
2. **Assess blast radius.** What could this credential do? Which environments, data, and actions? Use that
   to set urgency and notification scope.
3. **Check for abuse.** Pull audit logs for the credential since the likely exposure time. Look for
   unfamiliar IPs, regions, or access patterns.
4. **Contain.** If abuse is suspected, also revoke sessions/tokens derived from it and rotate any secrets
   it could have unlocked (a leaked deploy key may have read other secrets).
5. **Notify** the owning team and, if required, security/compliance — per your incident policy.
6. **Purge history** only after rotation: scrub the value from git history (e.g. `git filter-repo`),
   invalidate CI caches, and force-update. Treat this as hygiene, not remediation.
7. **Post-incident:** add or tighten the scanner rule that missed it; add a pre-commit/CI gate if one was
   absent; write up the timeline.

## Redaction (prevent the next leak in logs)

Most leaks after the first are in logs. Redact at the logging boundary so secrets never reach the
aggregator:

```js
const SECRET_KEYS = /(pass(word)?|secret|token|api[-_]?key|authorization)/i;
function redact(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  const out = Array.isArray(obj) ? [] : {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = SECRET_KEYS.test(k) ? '[REDACTED]' : redact(v);
  }
  return out;
}
logger.info('request', redact(context)); // never log raw process.env or auth headers
```

The package scanner (`scripts/detect-hardcoded.mjs`) redacts matched values in its output for the same
reason — never echo the secret you just found.

## Don'ts

- Don't quietly delete the commit and move on — the credential is still valid until rotated.
- Don't paste the leaked value into a ticket, chat, or email to "show" the leak.
- Don't wait for confirmation of abuse before rotating; rotation is cheap, a breach is not.

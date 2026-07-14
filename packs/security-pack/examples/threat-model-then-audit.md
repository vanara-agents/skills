# Walkthrough: threat-modeling "password reset via email", then auditing it

A complete run through the five stages for a classic high-risk feature, showing which pack item leads
at each point.

## Stage 1 — Model (`threat-modeler` + `owasp-top10`)

Trust boundaries: browser → API → email provider → token store. Walking STRIDE surfaces:

```text
- Token guessability      → tokens must be cryptographically random (A07)
- Token reuse / replay     → single-use, short TTL, invalidated on use (A07)
- Host-header poisoning    → reset link host must not come from the request header (A04)
- User enumeration         → "email sent" response identical for known/unknown emails (A01)
- No rate limit            → attacker can brute-force or spam resets (A04/A07)
```

Each threat is tagged with its OWASP class and a planned mitigation. This list becomes the audit
agenda.

## Stage 2 — Build (`secure-auth` + `secrets-management`)

Implement against the vetted construction:

- Reset token = 256-bit CSPRNG value, stored **hashed** at rest, single-use, 15-minute TTL.
- The "we sent you an email" response is byte-identical whether or not the account exists.
- The reset link's host is built from server config, not the incoming `Host` header.
- The email-provider API key is loaded from the secret store via `secrets-management` — it never
  appears in source or committed config.

Abuse-case tests are written alongside:

```text
✗ a used reset token cannot be redeemed a second time
✗ /forgot-password returns the same body for known and unknown emails
✗ /forgot-password returns 429 after 5 attempts in the window
```

Implement until green.

## Stage 3 — Audit (`security-auditor` + `owasp-top10`)

The auditor reviews the diff against the stage-1 list:

```md
### HIGH
- `auth/reset.js:41` — token compared with `===`; use a constant-time compare to avoid a timing
  oracle on the token value.
- `auth/reset.js:12` — no rate limiter on the request-reset endpoint (threat listed in the model,
  not yet implemented). Add per-IP + per-account throttling.

### LOW
- `auth/reset.js:58` — TTL is 60 min; model called for 15. Tighten.
```

The timing-compare and rate-limit findings are fixed and re-reviewed. No CRITICAL/HIGH remains.

## Stage 4 — Scan (`vuln-scanner`)

```text
CVE: email-sdk@2.3.0 → transitive dep `node-fetch@2.6.1` has a known SSRF advisory.
     Fix: bump to email-sdk@2.4.1 (pulls patched fetch).
Secrets: none in tree; git history clean.
```

Dependency bumped; scan re-run clean.

## Stage 5 — Ship

Audit clean, scan clean, no committed secret. The feature ships with its abuse-case tests as
permanent regression guards.

## The lesson

The threat model did the heavy lifting: it predicted the rate-limit gap and the enumeration risk
*before* code existed, and it gave the auditor a precise agenda. Without it, stage 3 would have been a
generic pass that could easily have missed the missing rate limiter.

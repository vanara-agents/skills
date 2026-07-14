# Common Auth Attacks and Defenses

Most authentication breaches exploit operational gaps, not broken crypto. Know the named attacks and the
specific control that stops each.

## Credential stuffing

Attackers replay username/password pairs leaked from *other* breaches, betting on password reuse. It is
high-volume and automated.

**Defenses:**
- Rate-limit and progressively delay/lock by IP **and** by account.
- Screen new/changed passwords against a breached-password corpus (HaveIBeenPwned range API or a local
  Pwned Passwords list) — see `scripts/check-password-policy.mjs`.
- Offer/require MFA; it neutralizes a correct-but-stolen password.
- Add bot defenses (device fingerprinting, CAPTCHA on risk) for anomalous traffic.

## Brute force

Guessing one account's password through sheer volume.

**Defenses:** account lockout / exponential backoff, strong minimum length, slow password hashing
(argon2id), and MFA. Avoid hard permanent lockouts — they become a denial-of-service against legitimate
users; prefer temporary backoff plus alerting.

## Session fixation

The attacker obtains or sets a session ID *before* the victim logs in, then rides the now-authenticated
session.

**Defense:** **regenerate the session identifier at every privilege change** (especially on login). Never
accept a session ID supplied via URL/query string. Set `HttpOnly; Secure; SameSite` cookies.

## CSRF (Cross-Site Request Forgery)

A malicious site causes the victim's browser to send an authenticated, state-changing request to your app
using the victim's cookies.

**Defenses:**
- `SameSite=Lax` (or `Strict`) cookies — blocks most cross-site sends.
- Anti-CSRF tokens (synchronizer or double-submit) on state-changing requests.
- Require a custom header / re-auth for sensitive actions.
- Note: token-in-`Authorization`-header APIs (not cookie-auth) are largely immune, since the browser
  doesn't auto-attach the header cross-site.

## Account enumeration

The app reveals whether an account exists via different responses, status codes, or **timing** on login,
signup, or password reset.

**Defense:** return identical responses and keep timing uniform regardless of account existence ("If that
email is registered, we've sent a reset link.").

## XSS-driven token theft

Cross-site scripting that steals tokens from `localStorage` or readable cookies.

**Defenses:** `HttpOnly` cookies (JS can't read them), a strict Content-Security-Policy, output encoding,
and never storing long-lived credentials in web storage.

## Phishing / MITM of credentials

**Defenses:** phishing-resistant MFA (WebAuthn/passkeys bind to origin), HSTS, and never accepting
credentials over plain HTTP.

## Quick map

| Attack | Primary control |
|---|---|
| Credential stuffing | Rate limit + breached-password screen + MFA |
| Brute force | Backoff/lockout + slow hash + MFA |
| Session fixation | Regenerate session ID on login |
| CSRF | SameSite cookies + anti-CSRF token |
| Enumeration | Uniform responses + timing |
| XSS token theft | HttpOnly cookies + CSP |
| Phishing | WebAuthn/passkeys + HSTS |

# Sessions vs JWT — Storage, Expiry, Refresh, Revocation

Both answer "how do we remember a logged-in user across stateless HTTP requests?" The decisive
difference is **revocation**: server-side sessions are trivial to revoke; signed JWTs are not.

## Server-side sessions (stateful)

The server issues a random, high-entropy **opaque** session ID and stores the session state
(user, expiry, CSRF token) in a database or Redis. The ID travels in a cookie.

```http
Set-Cookie: session=Gd8...n2; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=3600
```

- **Revocation:** delete the server-side record — instant logout-everywhere.
- **Expiry:** enforce both an idle timeout and an absolute lifetime.
- **Trade-off:** requires shared session storage; a tiny lookup per request.
- **Best for:** classic server-rendered web apps; anything needing reliable forced logout.

## Stateless JWT

A signed token (header.payload.signature) the client carries, usually in the `Authorization: Bearer`
header. The server validates the signature and claims with no lookup.

- **Cannot be un-issued.** Once signed, a JWT is valid until `exp`. There is no "delete the row."
- **Expiry is your main control** — keep access tokens **short (5–15 min)**.
- **Best for:** APIs and microservices that must validate auth without shared session state.

### Access + refresh token pattern

Pair a short-lived access token with a longer-lived **refresh token** that *is* tracked server-side so
it can be revoked:

1. Login issues a short access token (~10 min) + a refresh token (~days/weeks), refresh stored server-side.
2. Client uses the access token until it expires.
3. Client exchanges the refresh token for a new access token (and a **new** refresh token — rotation).
4. Logout / compromise: delete the refresh token record; access dies within minutes.

### Refresh token rotation + reuse detection

On each refresh, issue a new refresh token and invalidate the old one. If an *already-used* (rotated-out)
refresh token is presented again, treat it as theft: revoke the entire token family and force re-login.
This catches a stolen refresh token because either the attacker or the victim will replay a consumed one.

## Storage: where the token/cookie lives

| Location | XSS-readable? | CSRF-exposed? | Verdict |
|---|---|---|---|
| `HttpOnly` cookie | No | Yes (mitigate w/ SameSite + token) | **Preferred** for browser auth |
| `localStorage` / `sessionStorage` | **Yes** | No | Avoid — any XSS exfiltrates it |
| In-memory (JS variable) | Only during session | No | OK for short access token in SPA |

The headline rule: **never put a long-lived credential in `localStorage`.** `HttpOnly` cookies keep the
token out of reach of injected JavaScript.

## Quick decision guide

- Need easy forced logout / session revocation, server-rendered app → **server-side sessions**.
- Stateless API across many services, comfortable with short tokens + refresh rotation → **JWT**.
- Hybrid is common and good: opaque session cookie for the web app, short JWT for downstream service calls.

## Checklist

- [ ] Access tokens short-lived (5–15 min)
- [ ] Refresh tokens server-side, rotated on use, with reuse detection
- [ ] Cookies set `HttpOnly; Secure; SameSite`
- [ ] No long-lived credential in `localStorage`
- [ ] Session ID regenerated on login (anti session-fixation)
- [ ] Logout actually revokes server-side state, not just clears the client

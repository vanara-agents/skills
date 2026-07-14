# Annotated Auth Flows

Three end-to-end flows with the security-relevant step called out at each line. These are reference
sequences, not framework-specific code.

## 1. Password login → session

```text
POST /login  { email, password }
  1. Look up user by email.
  2. ALWAYS run argon2.verify even if the user doesn't exist (compare against a dummy hash)
     -> keeps response time uniform, defeats account enumeration by timing.
  3. On success:
       a. Regenerate the session ID            <- defeats session fixation
       b. Persist session server-side (user, absolute + idle expiry, CSRF token)
       c. Set-Cookie: session=...; HttpOnly; Secure; SameSite=Lax
  4. On failure: generic 401 "invalid email or password" (never say which was wrong).
  5. Increment a per-account + per-IP failure counter -> backoff/lockout on abuse.
```

The dummy-hash compare in step 2 matters: skipping the hash when the user is missing makes "no such
user" measurably faster than "wrong password," which is an enumeration oracle.

## 2. Access token refresh (JWT model)

```text
Login issues:
   access_token  (JWT, exp ~10 min, carried in Authorization: Bearer)
   refresh_token (opaque, stored server-side, exp ~14 days, in HttpOnly cookie)

POST /token/refresh   (presents refresh_token)
  1. Look up the refresh token record server-side.
  2. If it's already been used (rotated out) -> REUSE DETECTED:
        revoke the entire token family + force re-login.       <- catches stolen refresh tokens
  3. Otherwise: issue a NEW access_token AND a NEW refresh_token,
     invalidate the old refresh token (rotation).
  4. Logout: delete the refresh record -> access dies within ~10 min.
```

## 3. OAuth2 / OIDC login (Authorization Code + PKCE)

```text
  1. App generates code_verifier (random) + code_challenge = SHA256(verifier),
     and a random `state`. Store both in the user's pending session.
  2. Redirect to provider /authorize?...&code_challenge=...&state=...&scope=openid email
  3. User authenticates at the provider; redirected back with ?code=...&state=...
  4. App verifies returned state == stored state.               <- CSRF defense on callback
  5. App POSTs code + code_verifier to /token.                  <- PKCE binds code to this client
  6. Provider returns access_token + id_token (+ refresh_token).
  7. App verifies id_token: signature (JWKS), iss, aud, exp, nonce.  (see jwt-verify.ts)
  8. App maps id_token.sub -> local user (create on first login). Use `sub`, not `email`.
  9. Establish a local session/token exactly as in flows 1 or 2.
```

## Logout that actually logs out

- Server-side sessions: delete the session record (not just the cookie). Optionally support
  "log out all devices" by deleting every session for the user.
- JWT model: delete the refresh token; rely on short access-token expiry for the residual window. If you
  need *instant* access-token revocation, keep a short-TTL denylist of token IDs (`jti`).

# OAuth2 / OIDC — Flows and Validation

OAuth2 is a **delegated authorization** framework: it lets your app obtain an access token to call an API
on a user's behalf. OpenID Connect (OIDC) is a thin identity layer on top that adds an `id_token` so you
also learn **who the user is**. For "log in with Google/Apple/etc.", you want OIDC.

## Use Authorization Code + PKCE

For both server-side web apps and public clients (SPAs, mobile), use the **Authorization Code flow with
PKCE** (Proof Key for Code Exchange).

```text
1. Client generates code_verifier (random) + code_challenge = SHA256(code_verifier).
2. Redirect user to /authorize?response_type=code&client_id=...&redirect_uri=...
       &scope=openid profile email&state=<csrf>&code_challenge=...&code_challenge_method=S256
3. User authenticates at the provider, is redirected back with ?code=...&state=...
4. Client verifies returned state == sent state, then POSTs to /token with the code + code_verifier.
5. Provider returns access_token (+ id_token for OIDC, + refresh_token).
```

PKCE binds the authorization code to the client that started the flow, so a stolen code is useless to an
attacker who lacks the original `code_verifier`.

## Flows to avoid

| Flow | Verdict |
|---|---|
| Authorization Code + PKCE | **Use this** for web, SPA, mobile |
| Client Credentials | Machine-to-machine only (no user) |
| Implicit | **Deprecated** — tokens leak via URL/history; use Code+PKCE |
| Resource Owner Password | **Avoid** — app handles the user's IdP password; defeats the point of delegation |

## The `state` parameter (CSRF defense)

Always send a random, unguessable `state` on the authorize request and reject the callback if the
returned `state` doesn't match what you stored. Without it, an attacker can splice their own
authorization code into the victim's session (login CSRF).

## Validating the `id_token` (OIDC)

The `id_token` is a JWT. Do not trust it until you verify:

- **Signature** — against the provider's published JWKS (`jwks_uri`), matched by the `kid` header.
- **`iss`** — exactly equals the provider's issuer.
- **`aud`** — contains your client_id.
- **`exp` / `iat`** — not expired; issued recently.
- **`nonce`** — matches the nonce you sent (replay defense), when used.

Never accept an unsigned token (`alg: none`) and never let the token dictate the algorithm — pin the
expected algorithm server-side. See `examples/jwt-verify.ts` for the structural checks.

## Scopes vs claims

- **Scopes** (`openid profile email`) request *access* to categories of data.
- **Claims** (`sub`, `email`, `name`) are the actual values inside the `id_token` / userinfo response.
- Treat `sub` (subject) as the stable user identifier — `email` can change or be reassigned.

## Checklist

- [ ] Authorization Code + PKCE (not implicit, not password grant)
- [ ] `state` generated, stored, and verified on callback
- [ ] `id_token` signature verified against JWKS; `iss`/`aud`/`exp` checked
- [ ] Algorithm pinned server-side; `alg: none` rejected
- [ ] `sub` used as the durable user key, not `email`
- [ ] `redirect_uri` allowlisted exactly (no open redirects)

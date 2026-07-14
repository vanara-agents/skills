# A02 — Cryptographic Failures (in depth)

Formerly "Sensitive Data Exposure." The failures are usually about *not* using crypto, or using it wrong
— rarely about breaking the math.

## Passwords
- Store only a salted hash with a slow, memory-hard algorithm: **argon2id** (preferred) or **bcrypt**.
- Never use fast hashes (MD5/SHA-256) for passwords, and never reversible encryption.
```js
const hash = await argon2.hash(password);      // store hash
const ok = await argon2.verify(hash, attempt); // constant-time compare
```

## Data in transit and at rest
- **In transit:** TLS everywhere; redirect HTTP→HTTPS; set HSTS.
- **At rest:** encrypt sensitive fields/columns; protect keys in a KMS/secret manager, not in code.

## Key & randomness handling
- Use a cryptographically secure RNG (`crypto.randomBytes`), never `Math.random()`, for tokens/secrets.
- Rotate keys; scope them least-privilege; never commit them (see the `secrets-management` skill).

## Don't roll your own
Use vetted libraries and standard constructions (AEAD like AES-GCM, libsodium). Custom crypto and
clever schemes are how subtle, catastrophic bugs get introduced.

## Edge cases
- **Tokens in URLs** get logged and leak via referrers — keep them in headers/cookies.
- **Timing attacks:** compare secrets with constant-time comparison, not `===`.
- **Sensitive data in logs/backups** is the silent leak — scrub it (ties to A09 logging).

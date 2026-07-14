# Password Hashing — argon2id, bcrypt, and tuning

The job of a password hash is to make offline cracking of a stolen database *slow and expensive*. That
is the opposite of a normal hash function's goal (speed). Never use `MD5`, `SHA-1`, `SHA-256`, or any
fast hash for passwords — a single GPU computes billions of SHA-256 hashes per second, so an unsalted
fast-hash dump is effectively plaintext within hours.

## Algorithm choice

| Algorithm | Status | Notes |
|---|---|---|
| **argon2id** | **Preferred** | Memory-hard; resists GPU/ASIC cracking. Tunable memory + time + parallelism. |
| **bcrypt** | Acceptable | Mature, ubiquitous. 72-byte input cap; pre-hash long inputs with SHA-256. |
| **scrypt** | Acceptable | Memory-hard; fine if argon2 unavailable. |
| **PBKDF2** | Last resort | Only when FIPS compliance forces it; use a high iteration count. |
| MD5 / SHA-* | **Never** | Fast = crackable. Not password hashes. |

## Salting and peppering

- **Salt** — a unique random value per password that defeats rainbow tables and stops identical
  passwords producing identical hashes. argon2 and bcrypt generate and embed the salt for you; do not
  add your own or store it separately.
- **Pepper** — an optional secret key mixed in (or used to encrypt the hash) and stored *outside* the
  database (e.g. in a secrets manager / HSM). It means a DB-only leak isn't enough to start cracking.
  Manage it like any other secret (see the `secrets-management` skill).

## Tuning cost parameters

Pick parameters so a single verification takes roughly **250–500 ms** on your production hardware — slow
enough to hurt attackers, fast enough not to DoS your own login endpoint.

```ts
import argon2 from 'argon2';

const hash = await argon2.hash(password, {
  type: argon2.argon2id,
  memoryCost: 19456, // ~19 MiB; raise as hardware allows (OWASP baseline)
  timeCost: 2,       // iterations
  parallelism: 1,
});
```

Cap input length (e.g. 128 chars) before hashing so an attacker can't submit a multi-megabyte password
to exhaust CPU/memory — a cheap denial-of-service otherwise.

## Rehash on login (parameter migration)

Cost targets rise as hardware improves. On each successful login, check whether the stored hash used
weaker parameters than your current policy and transparently rehash:

```ts
if (await argon2.verify(stored, attempt)) {
  if (argon2.needsRehash(stored, currentOpts)) {
    const fresh = await argon2.hash(attempt, currentOpts);
    await users.update(id, { passwordHash: fresh });
  }
}
```

This lets you upgrade an entire user base's hash strength gradually without a forced reset.

## Checklist

- [ ] argon2id (or bcrypt) — never a fast/general-purpose hash
- [ ] Per-password salt (library-managed), not reused or hand-rolled
- [ ] Verification tuned to ~250–500 ms on prod hardware
- [ ] Input length capped before hashing (DoS guard)
- [ ] Breached-password screening at registration (`scripts/check-password-policy.mjs`)
- [ ] Rehash-on-login to migrate parameters over time
- [ ] Optional pepper stored outside the database

# Model `.env.example`

Commit this template; never commit the real `.env`. Values here are **obviously fake placeholders** so a
scanner won't flag them and a human won't mistake them for real. Document every key the app needs.

```dotenv
# === Database ===
# Real value lives in the secret manager; this is the shape only.
DATABASE_URL=postgres://USER:PASSWORD@localhost:5432/appdb

# === Third-party APIs ===
STRIPE_SECRET_KEY=sk_test_REPLACE_ME_xxxxxxxxxxxxxxxx
SENDGRID_API_KEY=SG.REPLACE_ME.xxxxxxxxxxxxxxxxxxxxxxxx

# === Auth / signing ===
# Generate locally with: openssl rand -base64 32
JWT_SIGNING_KEY=REPLACE_WITH_RANDOM_32_BYTES
SESSION_SECRET=REPLACE_WITH_RANDOM_32_BYTES

# === Runtime config (not secret) ===
NODE_ENV=development
LOG_LEVEL=info
```

## `.gitignore` (add before the first commit)

```gitignore
# Real secrets — never commit
.env
.env.local
.env.*.local
*.pem
*.key
```

## Rules

1. Keep `.env.example` in sync with the code — every `process.env.X` the app reads should appear here.
2. Placeholders must be clearly fake: `REPLACE_ME`, `sk_test_...`, `xxxx`. Never a redacted-but-real value.
3. The real `.env` is for local dev only. In CI/production, inject values from the secret manager.
4. Validate presence at startup (see `SKILL.md` §1) so a missing key fails fast with a named error.

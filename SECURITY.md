# Security Policy

## Reporting a vulnerability

If you find a security issue in any item here (e.g. an example that encourages an unsafe
pattern, a script with an injection path) or in the `vanara` CLI, please report it privately:

- Email: **support@vanaraagents.com** with subject `[SECURITY]`
- Or use GitHub's private vulnerability reporting on this repo

Please don't open a public issue for exploitable problems. You'll get a response within
72 hours.

## Scope notes

- Items in this repo are markdown + dependency-free Node scripts; the scripts run locally and
  make no network calls.
- Example "secrets" in security-focused items are intentionally fake and defanged (truncated
  or runtime-concatenated) — see `agents/security-auditor/scripts/scan-secrets.mjs`. If you
  find a live-format credential pattern anywhere, that's a bug: report it.
- The `vanara` CLI's one privileged operation (premium catalog download) verifies content with
  a zip-slip guard before extraction; issues with that path are in scope and appreciated.

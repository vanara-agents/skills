# Versioning & Evolution

Once an API is public, other people's software depends on it. Plan to evolve without breaking them.

## What is a breaking change?
**Breaking** (needs a new version): removing/renaming a field or endpoint, changing a type, adding a
required request field, changing status-code or error semantics, tightening validation.

**Non-breaking** (safe in place): adding a new endpoint, adding an **optional** request field, adding a
new field to a response (clients must ignore unknown fields — document this expectation).

## Strategies
| Strategy | Example | Notes |
|---|---|---|
| URI path | `/v1/orders` | Most operationally clear; easy routing, caching, logs. Most common. |
| Header | `Accept: application/vnd.api.v1+json` | Cleaner URLs, harder to test/debug. |
| Query param | `/orders?version=1` | Simple but easy to omit; weakest. |

Recommendation: **URI path versioning** for public APIs — explicit and unambiguous.

## Deprecation playbook
1. Announce the new version and a deprecation date for the old one.
2. Add a `Deprecation` (and optional `Sunset`) header to old-version responses.
3. Maintain both versions during a published overlap window.
4. Monitor old-version usage; reach out to remaining consumers.
5. Remove only after usage approaches zero and the sunset date passes.

## Tips
- Avoid versioning as long as possible by making additive changes.
- Never silently change behavior within a version — that's a breaking change in disguise.
- Document unknown-field tolerance so adding fields stays non-breaking.

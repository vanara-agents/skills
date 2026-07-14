# Versioning & Evolution

APIs are forever once published: a consumer you've never met may depend on any field you expose. Design
so you can **add without breaking**, and version explicitly when you must break.

## Choosing a versioning strategy

| Strategy | Example | Pros | Cons |
|---|---|---|---|
| **URI path** | `/v1/orders` | Operationally clearest; trivial to route, cache, log | Version in every URL; "ugly" to purists |
| **Header** | `Accept: application/vnd.api.v2+json` | Clean URLs; content-negotiation native | Invisible in logs/caches; easy to get wrong |
| **Query param** | `/orders?version=2` | Simple | Pollutes caching; easy to omit |

**Default recommendation: URI path versioning** (`/v1/...`). It is the most operationally legible —
you can see the version in every request log, route it at the gateway, and cache it cleanly. Reserve
header-based versioning for APIs where URL stability is a hard requirement.

Version the **major** number only. Minor, backward-compatible changes ship within the same version.

## Additive (safe) vs breaking (needs a new version)

**Safe — ship within the current version:**

- Adding a new endpoint.
- Adding a new **optional** request field (with a sensible default).
- Adding a new field to a response (clients must ignore unknown fields — the *tolerant reader* rule).
- Adding a new optional query parameter.
- Adding a new enum value **only if** clients are documented to tolerate unknown values.

**Breaking — requires a new major version:**

- Removing or renaming a field (request or response).
- Changing a field's type or its meaning.
- Making a previously optional request field required.
- Tightening validation so previously valid requests now fail.
- Changing default behavior, pagination style, or the error shape.
- Removing an endpoint or changing its URL/method.

## The tolerant reader contract

Tell consumers, in the docs, that they **must ignore unknown fields** and tolerate new enum values. This
single rule turns a whole class of otherwise-breaking changes (adding fields, adding enum members) into
safe additive ones. State it explicitly — you cannot rely on behavior you never published.

## Deprecation playbook

When a breaking change is unavoidable:

1. **Ship the new version** (`/v2`) alongside the old. Never break `/v1` in place.
2. **Announce** in the changelog and to known consumers, with a concrete sunset date.
3. **Signal at runtime.** Return a `Deprecation: true` header and a `Sunset: <date>` header on the old
   endpoints; optionally add a `Warning` header.
4. **Monitor usage** of the old version so you know who still depends on it.
5. **Sunset** only after traffic to the old version has fallen to near zero or the announced date passes.

## Anti-patterns

- **Breaking `/v1` in place** "because only a few clients use that field" — you cannot know who depends
  on it; that's the whole point of a published contract.
- **Versioning per endpoint** — a patchwork of `/orders/v2` and `/users/v3` is unnavigable. Version the
  API surface, not individual routes.
- **Infinite versions** — every major version is an operational and support cost. Deprecate aggressively
  once a successor is stable.

# API Design Checklist

Run through this before declaring an API contract done. It is ordered the way you should *design*:
resources first, cross-cutting rules last. Every box is a place real APIs go wrong in production.

## 1. Resource modeling

- [ ] Collections are **plural nouns** (`/orders`, `/users`) — never verbs (`/getOrders` is wrong; the
      verb is `GET`).
- [ ] Nesting shows ownership and is **at most one level deep** (`/users/{id}/orders`). Deeper than that,
      link by ID instead.
- [ ] Non-CRUD actions are modeled as sub-resources or controller endpoints
      (`POST /orders/{id}/refunds`), not RPC verbs (`POST /refundOrder`).
- [ ] Identifiers are **stable and opaque**. Prefer UUID/ULID over auto-increment where enumeration is a
      risk (`ord_01H...` not `/orders/41`).
- [ ] Field naming is **consistent casing** across the whole API (pick `camelCase` or `snake_case` once).

## 2. HTTP methods & status codes

| Method | Use | Safe | Idempotent |
|---|---|---|---|
| GET | read | yes | yes |
| POST | create / non-idempotent action | no | no |
| PUT | full replace | no | yes |
| PATCH | partial update | no | no |
| DELETE | remove | no | yes |

- [ ] `GET` **never mutates** state. Caches and proxies rely on this.
- [ ] Each endpoint lists the **accurate** status codes for success *and* failure.
- [ ] `201 Created` returns a `Location` header for the new resource.
- [ ] `204 No Content` for successful deletes with no body.
- [ ] Never `200 OK` with `{"success": false}` — use real 4xx/5xx codes.
- [ ] `401` (not authenticated) vs `403` (authenticated, not allowed) are used correctly; `404`-vs-`403`
      is a deliberate choice to avoid leaking existence.
- [ ] `409` (conflict) vs `422` (semantically invalid) vs `400` (malformed) are distinguished.

## 3. Response envelope & errors

- [ ] **One envelope shape** everywhere: `data`, `meta` (for lists), `error`.
- [ ] On error, `data: null` and a populated `error` with a machine-readable `code`, a human `message`,
      and optional field-level `details`.
- [ ] The **same** error shape is returned for every failure across every endpoint.
- [ ] Errors include a `requestId`/correlation id for support.

## 4. Pagination, filtering, sorting

- [ ] **Every** collection endpoint paginates. No exceptions — an unbounded list is a latent outage.
- [ ] `limit` is **capped server-side** (e.g. max 100) so a client can't request a million rows.
- [ ] Cursor (keyset) pagination for large/growing/real-time data; offset only for small datasets or
      genuine page-number UX.
- [ ] Filtering and sorting use consistent query-param conventions (`?status=open&sort=-createdAt`).
- [ ] A unique tiebreaker (e.g. `id`) is part of any sort to avoid dropped/repeated rows at boundaries.

## 5. Auth, rate limiting, idempotency, concurrency

- [ ] Auth requirement is documented **per endpoint** (and which scopes/roles).
- [ ] Authorization is enforced server-side per action (guard against IDOR — check ownership, not just
      authentication).
- [ ] Rate limits are documented; throttled responses use `429` + `Retry-After`.
- [ ] `POST`s that create resources accept an `Idempotency-Key` header so retries don't double-create.
- [ ] Updates support optimistic concurrency (`ETag` + `If-Match`) where lost-update is a real risk.
- [ ] All input is validated at the boundary; invalid input fails fast with `400`/`422` and field details.

## 6. Evolvability

- [ ] An explicit versioning strategy is chosen and documented (see `versioning-and-evolution.md`).
- [ ] The change you are making is classified **additive (safe)** or **breaking (needs a version)**.
- [ ] New optional fields default sensibly so old clients keep working.

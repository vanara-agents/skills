# Status Codes — Decision Guide

Return the most specific accurate code. Clients, proxies, and caches all key off the status line.

## Success
- `200 OK` — successful GET/PUT/PATCH with a body.
- `201 Created` — successful POST that created a resource. Include a `Location` header pointing to it.
- `202 Accepted` — accepted for async processing; not done yet (return a status URL).
- `204 No Content` — success with no body (typical for DELETE).

## Client errors
- `400 Bad Request` — malformed syntax / unparseable.
- `401 Unauthorized` — not authenticated (no/invalid credentials). Add `WWW-Authenticate`.
- `403 Forbidden` — authenticated but not allowed.
- `404 Not Found` — resource doesn't exist (or you're hiding its existence — see below).
- `405 Method Not Allowed` — wrong verb for the resource. Include an `Allow` header.
- `409 Conflict` — state conflict (e.g. duplicate, version mismatch on PUT).
- `422 Unprocessable Entity` — syntactically valid but semantically invalid (failed validation).
- `429 Too Many Requests` — rate limited. Include `Retry-After`.

## Server errors
- `500 Internal Server Error` — unexpected fault. Never leak stack traces to clients.
- `503 Service Unavailable` — overloaded/down for maintenance. Include `Retry-After`.

## Edge cases & judgement calls
- **404 vs 403 (existence leakage):** if telling an unauthorized user a resource exists is itself a leak
  (e.g. `/users/{id}` in a multi-tenant app), return `404` instead of `403` so attackers can't enumerate.
- **400 vs 422:** use `400` for unparseable requests; `422` for well-formed requests that fail business
  validation. Pick one convention and apply it consistently.
- **409 vs 422 on conflict:** `409` for a conflict with current resource state (stale version, duplicate
  unique key); `422` for input that can't be processed regardless of state.
- **PUT semantics:** `200`/`204` if it replaced an existing resource; `201` if PUT created one.

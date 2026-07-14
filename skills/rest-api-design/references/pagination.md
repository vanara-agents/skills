# Pagination — Cursor vs Offset

Every collection endpoint must paginate. Choosing the wrong style causes slow queries and inconsistent
results at scale.

## Offset/limit
```http
GET /orders?limit=20&offset=40
```
- **Pros:** simple, allows jumping to an arbitrary page.
- **Cons:** the database must scan and discard `offset` rows — page 10,000 is slow. Worse, if rows are
  inserted/deleted while a client paginates, items get **skipped or duplicated** across pages.
- **Use when:** datasets are small, or users genuinely need page numbers.

## Cursor (keyset) pagination
```http
GET /orders?limit=20&cursor=eyJpZCI6MTAwfQ
```
- The cursor encodes the position (e.g. the last seen sort key), so the DB query is
  `WHERE (created_at, id) < (:lastCreated, :lastId) ORDER BY created_at DESC, id DESC LIMIT :limit`.
- **Pros:** O(limit) regardless of depth; stable under concurrent inserts/deletes.
- **Cons:** no arbitrary page jumps; requires a stable, unique sort key (add a tiebreaker like `id`).
- **Use when:** large, growing, or real-time data — the default for most production APIs.

## Cursor encoding
Encode the cursor opaquely (base64 of the sort key) so clients treat it as a token, not a number to
manipulate:
```
cursor = base64({"created_at":"2026-06-28T10:00:00Z","id":100})
```

## Response shape
```json
{ "data": [ /* ... */ ], "meta": { "nextCursor": "eyJ...", "limit": 20, "hasMore": true } }
```

## Pitfalls
- Always include a **unique tiebreaker** in the sort (e.g. `id`); sorting by a non-unique column alone
  drops or repeats rows at page boundaries.
- Cap `limit` server-side (e.g. max 100) so a client can't request a million rows.
- Don't mix offset and cursor on the same endpoint — pick one.

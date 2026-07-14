# Response Shapes

## Cursor-paginated list (recommended default)

```json
{
  "data": [
    { "id": "itm_9x2", "created_at": "2026-07-01T12:00:00.412Z", "title": "..." }
  ],
  "page_info": {
    "has_more": true,
    "next_cursor": "v1.eyJrIjpbIjIwMjYt...IsNDcxMV0sImQiOiJkZXNjIn0.3f9a1c22b0"
  }
}
```

Last page: `has_more: false` and **no** `next_cursor` key. Clients must treat absence — not
empty string, not null — as the terminal signal (document exactly one convention and test it).

## Offset-paginated list (admin/small data only)

```json
{
  "data": [ ... ],
  "page_info": { "page": 3, "per_page": 50, "total": 1204, "total_pages": 25 }
}
```

Only ship `total`/`total_pages` when the dataset is small enough that COUNT is cheap and the
product genuinely offers page jumping.

## Request parameters

```
GET /v1/items?limit=50&cursor=v1.eyJr...          # cursor flow
GET /v1/admin/items?page=3&per_page=50            # offset flow
```

- `limit` capped server-side (e.g., max 200); over-cap requests get the cap, not an error.
- Filters/sort are request parameters, never encoded inside the cursor — but changing them
  mid-iteration invalidates the cursor (return `CURSOR_INVALID`, client restarts).

## Error shapes

```json
{ "error": { "code": "CURSOR_EXPIRED", "message": "Restart iteration from the beginning." } }
{ "error": { "code": "CURSOR_INVALID", "message": "Cursor is malformed or filters changed." } }
```

Both are 400s. Clients restart from their last durable checkpoint; idempotent processing absorbs
the overlap.

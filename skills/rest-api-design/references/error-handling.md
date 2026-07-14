# Error Handling

One error shape across every endpoint, with machine-readable codes and human-readable messages.

## The shape
```json
{
  "data": null,
  "error": {
    "code": "validation_failed",
    "message": "The request was invalid.",
    "details": [
      { "field": "email", "issue": "must be a valid email" },
      { "field": "age", "issue": "must be >= 18" }
    ],
    "requestId": "req_01HX..."
  }
}
```

## Rules
- `code` is a **stable, machine-readable** string (clients branch on it) — e.g. `not_found`,
  `validation_failed`, `rate_limited`, `conflict`. Don't change codes once published.
- `message` is for humans/logs; never put sensitive data or stack traces in it.
- `details` is optional, used for field-level validation errors.
- Include a `requestId` so support can correlate a client report with server logs.
- The HTTP status code and the `error.code` must agree (a `404` carries `not_found`).

## Common codes ↔ status
| code | status |
|---|---|
| `validation_failed` | 422 |
| `not_found` | 404 |
| `unauthorized` | 401 |
| `forbidden` | 403 |
| `conflict` | 409 |
| `rate_limited` | 429 |
| `internal_error` | 500 |

## Don'ts
- Don't return `200` with an error body.
- Don't expose internal exception messages, SQL, or stack traces.
- Don't use free-form, ever-changing error strings as the thing clients match on — that's what `code` is for.

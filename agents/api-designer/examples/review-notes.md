# Review Notes — Critiquing a Draft Contract

This shows how the api-designer agent reviews a flawed draft. Findings are severity-ranked so the
implementer fixes the contract-breakers first. Severity legend: **CRITICAL** (breaks clients / data
risk), **HIGH** (real bug or inconsistency), **MEDIUM** (maintainability), **LOW** (style).

## The draft under review

```http
POST /createOrder                  → 200 { "success": true, "order": {...} }
GET  /getOrders                    → 200 [ {...}, {...}, ... ]      # entire table
POST /refundOrder                  → 200 { "success": false, "msg": "already refunded" }
GET  /orders/{id}                  → 200 { "id": 41, "status": "open" }
DELETE /orders/{id}                → 200 { "success": true }
```

## Findings

### CRITICAL

1. **`200 OK` with `{"success": false}` on refund.** A failed refund returns HTTP 200, so every client
   that checks the status code treats a failure as success. Use a real code — `409 Conflict` for "already
   refunded" — with the standard error envelope.
   *Fix:* `POST /orders/{id}/refunds → 201` on success, `409` + `{ "data": null, "error": { "code":
   "already_refunded", ... } }` on conflict.

2. **Unbounded `GET /getOrders` returns the entire table.** No pagination and no `limit` cap is a
   self-inflicted DoS as the table grows.
   *Fix:* `GET /orders?limit=20&cursor=...` with `limit` capped server-side at 100, returning the list
   envelope with `meta.nextCursor`.

### HIGH

3. **Verbs in URLs** (`/createOrder`, `/getOrders`, `/refundOrder`). The HTTP method is the verb; paths
   are nouns.
   *Fix:* `POST /orders`, `GET /orders`, `POST /orders/{id}/refunds`.

4. **Inconsistent response shapes.** `GET /getOrders` returns a bare array; other endpoints return
   objects with ad-hoc keys (`order`, `success`, `msg`). Clients can't generalize.
   *Fix:* one envelope everywhere — `{ data, meta, error }`.

5. **Wrong success codes.** `POST /createOrder` returns 200 with no `Location`; it creates a resource so
   it should be `201 Created` + `Location: /orders/{id}`. `DELETE` should be `204 No Content`.

### MEDIUM

6. **Enumerable integer IDs** (`"id": 41`). Sequential IDs leak volume and invite enumeration attacks.
   *Fix:* opaque IDs (`ord_01H...`, UUID/ULID).

7. **No idempotency on create.** A retried `POST /orders` will double-create.
   *Fix:* accept an `Idempotency-Key` header.

### LOW

8. **Inconsistent error key** (`msg` vs the rest of the API). Standardize on `error.message`.

## Rewritten contract

See `openapi-snippet.yaml` in this package for the corrected version: plural nouns, `201`/`204`/`409`
status codes, cursor pagination with a capped `limit`, the single `{ data, meta, error }` envelope,
opaque IDs, and an `Idempotency-Key` on create.

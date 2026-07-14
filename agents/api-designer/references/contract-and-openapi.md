# Contract & OpenAPI

The contract is the deliverable. Express it as an **OpenAPI 3.1** document so it is human-readable *and*
machine-checkable. This reference covers how to structure that document and what
`scripts/lint-openapi.mjs` enforces.

## Why OpenAPI

- It is the lingua franca: tooling generates client SDKs, mock servers, request validators, and docs
  from it.
- It forces you to be explicit about every status code and schema — the things designers skip.
- It is diffable, so a reviewer can see exactly what a change adds or removes.

## Minimum viable document

Every OpenAPI doc must have these top-level fields, or downstream tooling rejects it:

```yaml
openapi: 3.1.0           # the spec version — required
info:
  title: Orders API      # required
  version: "1.0.0"       # required — the API version, not the spec version
paths: {}                # required — the endpoints (may start empty but must exist)
components:
  schemas: {}            # reusable schemas referenced via $ref
```

`scripts/lint-openapi.mjs` checks exactly these load-bearing fields on a doc supplied as **JSON** (no
YAML parser dependency): `openapi` is present, `info.title` and `info.version` are non-empty strings,
`paths` is an object, and every operation's responses carry at least a schema or description. Run it with
`--selftest` to see it pass a valid doc and fail an invalid one.

## Structure for reuse with `$ref`

Define each schema once under `components/schemas` and reference it. Define the **error envelope and
common error responses once** and `$ref` them from every operation — this is how you guarantee the
"one error shape everywhere" rule mechanically rather than by discipline.

```yaml
components:
  responses:
    Error:
      description: Standard error envelope
      content:
        application/json:
          schema: { $ref: "#/components/schemas/ErrorEnvelope" }
  schemas:
    Order:
      type: object
      properties:
        id: { type: string }
        status: { type: string, enum: [open, paid, refunded] }
    ErrorEnvelope:
      type: object
      properties:
        data: { nullable: true }
        error:
          type: object
          properties:
            code: { type: string }
            message: { type: string }
            details: { type: array, items: { type: object } }
            requestId: { type: string }
```

## What to specify per operation

For every operation:

- `summary` — one line.
- `parameters` — path, query (incl. `limit`/`cursor` for lists), and headers (`Idempotency-Key`).
- `requestBody` — schema for write operations, `required: true` where applicable.
- `responses` — **every** status code, success and failure, each with a schema or `$ref`.
- Auth via `security` referencing a `securityScheme`.

## Checklist before emitting

- [ ] Top-level required fields present (`openapi`, `info.title`, `info.version`, `paths`).
- [ ] Shared schemas and error responses defined once and `$ref`-ed.
- [ ] Every operation documents both success and error responses.
- [ ] List operations declare `limit` + `cursor` (or `offset`) parameters.
- [ ] The doc passes `node scripts/lint-openapi.mjs <doc.json>`.

# HTTP Caching: Cache-Control, ETag, and 304

The cheapest cache is the one you never run: push caching to the browser and CDN with HTTP headers. No
key-value store, no invalidation code — the protocol does it.

## Cache-Control

The primary knob. Tells browsers and shared caches (CDNs, proxies) how long a response is fresh.

```http
# Public, cacheable by CDNs, fresh for 1 hour, then revalidate.
Cache-Control: public, max-age=3600, must-revalidate

# Per-user/private data: only the browser may cache, never a shared CDN.
Cache-Control: private, max-age=0, no-cache

# Truly sensitive (never store): 
Cache-Control: no-store

# Immutable, content-hashed asset (app.9f3a2.js) — cache for a year, never revalidate.
Cache-Control: public, max-age=31536000, immutable
```

Key directives:
- `max-age=N` — fresh for N seconds.
- `s-maxage=N` — overrides `max-age` for *shared* caches (CDN) only.
- `public` / `private` — may a shared cache store it?
- `no-cache` — store it, but **revalidate** before each use (not "don't cache").
- `no-store` — never write it to any cache.
- `stale-while-revalidate=N` — serve stale up to N seconds while revalidating in the background.
- `immutable` — the body will never change at this URL; skip revalidation entirely.

## ETag + conditional requests (revalidation)

An `ETag` is an opaque fingerprint of the response body. The client sends it back to ask "still
valid?", and the server answers `304 Not Modified` with *no body* if unchanged — saving bandwidth.

```http
# First response
HTTP/1.1 200 OK
Cache-Control: no-cache
ETag: "v7-9f3a2c"
Content-Type: application/json

{ "id": 42, "name": "Product 42", "price": 1999 }
```

```http
# Client revalidates with the stored validator
GET /products/42 HTTP/1.1
If-None-Match: "v7-9f3a2c"
```

```http
# Server: unchanged -> tiny response, no body
HTTP/1.1 304 Not Modified
ETag: "v7-9f3a2c"
Cache-Control: no-cache
```

`Last-Modified` + `If-Modified-Since` is the date-based equivalent; `ETag` is preferred because it's
exact (sub-second changes, content-based) rather than 1-second-granular.

## Picking a strategy

| Asset | Headers |
|---|---|
| Content-hashed JS/CSS (`app.9f3a2.js`) | `public, max-age=31536000, immutable` |
| HTML shell | `no-cache` + `ETag` (always revalidate, cheap when unchanged) |
| Public API list, slow-changing | `public, max-age=60, stale-while-revalidate=300` |
| Per-user dashboard JSON | `private, no-cache` + `ETag` |
| Auth tokens, payment pages | `no-store` |

## Pitfalls

- `no-cache` does **not** mean "don't cache" — it means "revalidate every time". Use `no-store` to
  forbid storage.
- Forgetting `private` on personalized responses lets a CDN serve user A's data to user B.
- Long `max-age` on a URL whose content changes = stale clients with no way to bust. Use content-hashed
  filenames (`immutable`) so the URL changes when the content does.
- `ETag` mismatches across a load-balanced fleet (e.g. inode-based ETags) cause needless re-downloads;
  use a deterministic, content-derived ETag.

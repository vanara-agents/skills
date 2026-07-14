# How-to: Add a rate limit to an HTTP endpoint

> Doc type: **how-to guide**. Goal-first, assumes you can already run the service locally. For the
> concepts behind rate limiting, see the explanation doc; for every config field, see the reference.

**Goal:** protect a single endpoint with a per-client rate limit so a burst of requests returns `429`
instead of overloading the service.

## Before you start

- The service runs locally (`npm run dev`) and you can hit `http://localhost:3000`.
- You have write access to `src/middleware/`.
- Redis is reachable at `REDIS_URL` (the limiter stores counters there).

## Steps

1. Add the limiter middleware:

   ```js
   // src/middleware/rate-limit.js
   import { RateLimiter } from "../lib/rate-limiter.js";

   const limiter = new RateLimiter({ windowMs: 60_000, max: 100 }); // 100 req/min/client

   export function rateLimit(req, res, next) {
     const key = req.ip;
     const { allowed, retryAfter } = limiter.hit(key);
     if (!allowed) {
       res.set("Retry-After", String(retryAfter));
       return res.status(429).json({ error: "rate_limited" });
     }
     next();
   }
   ```

2. Apply it to the endpoint you want to protect (not globally, yet):

   ```js
   import { rateLimit } from "./middleware/rate-limit.js";
   app.post("/v1/messages", rateLimit, sendMessage);
   ```

3. Restart the dev server so the middleware loads:

   ```bash
   npm run dev
   ```

## Verify

Fire more than the limit and confirm the `429`:

```bash
for i in $(seq 1 101); do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/v1/messages
done | sort | uniq -c
```

Expected output — 100 allowed, then the limiter trips:

```text
    100 200
      1 429
```

## If it goes wrong

- **All requests pass:** the counter store isn't shared. Confirm `REDIS_URL` is set and reachable.
- **Every request is 429:** your client IP is shared (proxy). Key on an API token instead of `req.ip`.
- **Roll back:** remove the `rateLimit` argument from the route and restart.

---

Why this is a good how-to: it states the goal in one line, lists prerequisites *before* the steps, every
snippet is runnable, there's an explicit verification with expected output, and a troubleshooting/rollback
section. It does **not** explain the token-bucket algorithm — that's linked, not inlined.

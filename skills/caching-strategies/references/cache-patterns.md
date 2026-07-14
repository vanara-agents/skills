# Cache Read/Write Patterns

The *pattern* is how data flows between your application, the cache, and the source of truth (usually a
database). Choose one per dataset based on read/write ratio and consistency needs.

## Cache-aside (lazy loading) — the default

The application owns the cache logic. The cache knows nothing about the database.

```
READ:
  v = cache.get(key)
  if v exists: return v                  # hit
  v = db.load(key)                       # miss
  cache.set(key, v, ttl)
  return v

WRITE:
  db.write(key, v)
  cache.del(key)                         # invalidate; next read repopulates
```

- **Pros:** simple; resilient — a dead cache degrades to "slow", not "broken"; only requested data is
  cached, so the working set stays small.
- **Cons:** every key's first read is a miss (cold-start latency); cache and DB can drift if you forget
  to invalidate on write.
- **Use when:** read-heavy workloads with tolerable staleness. This is the right answer ~80% of the
  time.

## Read-through

Same flow as cache-aside, but the *cache layer* loads from the source on a miss via a configured
loader, instead of the application doing it inline.

```
READ:
  return cache.getOrLoad(key, loader=db.load)   # cache calls loader on miss
```

- **Pros:** loading logic is centralized behind the cache abstraction; application code is cleaner.
- **Cons:** requires a cache library/provider that supports loaders; still cold on first read.
- **Use when:** you want one canonical load path and your cache library supports it.

## Write-through

Writes are applied to the cache *and* the source synchronously, as one logical operation.

```
WRITE:
  cache.set(key, v)
  db.write(key, v)        # both, synchronously, before returning
```

- **Pros:** the cache is always consistent with the DB for written keys; reads after a write are always
  fresh.
- **Cons:** every write pays the cache write cost; you can cache data that's never read again (write
  amplification). Often paired with read-through.
- **Use when:** read-after-write freshness matters and writes are not the bottleneck.

## Write-behind (write-back)

Writes hit the cache immediately and are flushed to the source asynchronously (batched).

```
WRITE:
  cache.set(key, v)
  queue.push(key)         # background worker flushes to db later
```

- **Pros:** very fast writes; absorbs write spikes; enables batching/coalescing of DB writes.
- **Cons:** **data loss risk** if the process crashes before flush; the DB is eventually consistent
  with the cache; ordering and failure handling get complex.
- **Use when:** high write throughput where some durability risk is acceptable (metrics, counters,
  activity feeds). Never for data you can't afford to lose.

## Refresh-ahead

Proactively refresh entries that are *about to* expire and are being actively read, so a hot key never
serves a miss.

- **Pros:** hides refresh latency for hot keys; helps prevent stampedes.
- **Cons:** wasted refreshes for keys that won't be read again; needs access-pattern prediction.
- **Use when:** a small set of very hot, predictable keys.

## Quick selector

| Need | Pattern |
|---|---|
| General read-heavy, tolerate staleness | cache-aside |
| Centralized load path | read-through |
| Read-after-write must be fresh | write-through |
| Extreme write throughput, can risk loss | write-behind |
| Hot keys must never miss | refresh-ahead |

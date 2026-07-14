# Invalidation & Stampede Control

The two hardest caching problems: keeping the cache *correct* (invalidation) and keeping it *safe under
load* (stampedes).

## Invalidation strategies

### 1. Explicit bust (delete on write)

The standard move for cache-aside. On update, delete the key; the next read repopulates from the
source.

```
db.update(key, newValue)   # 1. commit to source of truth FIRST
cache.del(key)             # 2. then invalidate
```

**Ordering matters.** If you `cache.del` *before* the DB commit, a concurrent read can miss, load the
*old* (pre-commit) value, and repopulate the cache with stale data that now never expires until TTL.
Always: commit, then delete.

Even commit-then-delete has a narrow race (a read that loaded the old value before commit can write it
back after your delete). Mitigations: a short TTL as a backstop, or delayed double-delete (delete,
wait briefly, delete again).

### 2. Write-through

Update the cache on the write path so there's nothing to invalidate — the cache is always correct for
written keys. Trades write latency for read correctness.

### 3. Versioned / generation keys

Embed a version in the key: `product:42:v7`. To invalidate, bump the version (stored separately or
derived from an `updated_at`/etag). Old entries are instantly orphaned and aged out by eviction — no
scan, no delete storm. Great for invalidating *groups* of related entries at once.

### 4. TTL as the only mechanism

Acceptable only when eventual freshness is genuinely fine. Document the staleness window.

### Distributed invalidation

With multiple app nodes each holding a local (in-process) cache, deleting on one node doesn't touch the
others. Options: a pub/sub invalidation channel (publish "key X changed", every node drops it), short
local TTLs, or a shared tier (Redis) as the single cache so there's one place to invalidate.

## Stampede control (thundering herd / dogpile)

When a hot key expires, every concurrent request misses simultaneously and all hit the source at once.
A single popular key can saturate a database this way. The "dogpile" is the pile-up of redundant
recomputations.

### Per-key lock (single-flight)

The first miss acquires a lock and recomputes; concurrent requests wait for that one result instead of
each recomputing.

```
function getWithLock(key):
  v = cache.get(key)
  if v exists: return v
  if acquireLock(key, ttl=5s):          # only one winner
    try:
      v = db.load(key)
      cache.set(key, v, jitteredTtl(300))
      return v
    finally: releaseLock(key)
  else:
    wait briefly, then retry cache.get   # follower waits for the winner
```

`examples/redis-cache-aside.js` implements this single-flight pattern runnably.

### Stale-while-revalidate

Serve the slightly-stale value immediately while *one* background task refreshes it. Requires storing
a "soft" expiry alongside the hard TTL: past soft-expiry, return stale and trigger a refresh; past hard
expiry, block and reload. Hides all refresh latency and naturally prevents the herd.

### Probabilistic early expiration (XFetch)

Recompute a key *before* it expires, with a probability that rises as expiry approaches. Each reader
rolls the dice; on average exactly one refreshes early, so the herd never forms and no lock is needed.
A common form recomputes when `now - delta * beta * ln(rand()) >= expiry`.

### TTL jitter

The cheapest first line of defense: prevent *synchronized* expiry so the herd can't form for
batch-populated keys. See `references/eviction-and-ttl.md`.

## Choosing

| Symptom | Fix |
|---|---|
| Many keys expire together | TTL jitter |
| One hot key expires under load | single-flight lock or stale-while-revalidate |
| Refresh latency visible to users | stale-while-revalidate / refresh-ahead |
| Lock contention itself is a problem | probabilistic early expiration |
| Random non-existent keys hammer the DB | negative caching + Bloom filter |

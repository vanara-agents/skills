# Eviction, TTL & Jitter

A cache is finite. Entries leave by **TTL expiry** (time) or **eviction** (space pressure). Tune both
deliberately, or the cache tunes itself badly.

## Eviction policies

When memory is full and a new entry arrives, the policy picks a victim.

| Policy | Evicts | Good for | Watch out |
|---|---|---|---|
| **LRU** (Least Recently Used) | the entry untouched longest | general purpose, temporal locality | a full scan can flush the whole hot set |
| **LFU** (Least Frequently Used) | the entry with fewest accesses | skewed popularity (a few very hot keys) | new entries look "cold" and get evicted early; needs aging |
| **FIFO** (First In First Out) | the oldest inserted, regardless of use | rarely the right choice | evicts hot keys just because they're old |
| **Random** | a random entry | cheap, surprisingly OK under uniform access | unpredictable tail latency |
| **TTL-only** | nothing until expiry | when size is genuinely unbounded-safe | memory leak if the key space is large |

**Default to LRU.** Move to LFU (or a hybrid like LRU-K / W-TinyLFU) only when you've measured a
popularity skew where LRU underperforms. Modern Redis offers `allkeys-lru`, `allkeys-lfu`, and
`volatile-*` variants (evict only keys with a TTL set).

### Always bound the size

An in-process cache (a plain `Map`) with no max size is a memory leak that ends in an OOM crash. Cap by
entry count or bytes and attach an eviction policy. A bounded LRU map is the minimum viable in-process
cache.

## TTL tuning

TTL bounds the maximum staleness window. Pick it from the data's tolerance, not by feel:

- **Volatile, correctness-sensitive** (prices shown at checkout): seconds, plus explicit invalidation.
- **Slowly changing** (a product description, a config blob): minutes to hours.
- **Effectively static** (country list, feature flags read constantly): hours, with explicit bust on
  change.

Document the chosen staleness window as a number. "Up to 5 minutes stale" is a contract; "300" is a
magic number nobody remembers the reason for.

## TTL jitter (mandatory at scale)

If many keys are populated together (a deploy warm-up, a batch import, a cache flush + refill) with the
*same* fixed TTL, they all expire in the same instant and stampede the source together. Spread expiry
by adding randomness:

```js
function jitteredTtl(baseSeconds, jitterRatio = 0.1) {
  const delta = baseSeconds * jitterRatio;
  const offset = (Math.random() * 2 - 1) * delta;   // uniform in [-delta, +delta]
  return Math.max(1, Math.round(baseSeconds + offset));
}
```

With `jitterRatio = 0.1`, a nominal 300s TTL becomes a value in `[270, 330]`, so a batch of 10,000 keys
expires smeared across a 60-second window instead of all at once. See `scripts/ttl-jitter.mjs` for a
self-tested version.

## Negative caching (avoid cache penetration)

If a key has no value in the source (a row that doesn't exist), naive cache-aside re-queries the DB on
*every* request for it — **cache penetration**, which an attacker can weaponize by requesting random
non-existent IDs.

- Cache the "not found" result too, but with a **short** TTL (e.g. 10-30s) so a later insert becomes
  visible quickly.
- For high-cardinality miss attacks, front the cache with a **Bloom filter** of known-existing keys to
  reject impossible lookups before they hit the DB.

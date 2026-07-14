// Cache-aside with single-flight (stampede protection), demonstrated against an
// in-memory fake that mimics the slice of the Redis API we use (get/set/del +
// SET NX for locking). Swap `new FakeRedis()` for a real client (e.g. ioredis)
// and the logic is unchanged.
//
// Run it directly with Node (built-ins only; ES module syntax):
//   node redis-cache-aside.js
//
// It fires 50 concurrent reads of one cold key and shows that the expensive
// "DB" load runs exactly once — the herd is collapsed by the per-key lock.

import { fileURLToPath } from 'node:url';
import process from 'node:process';

// --- tiny TTL helper (mirrors scripts/ttl-jitter.mjs) ------------------------
function jitteredTtl(baseSeconds, jitterRatio = 0.1) {
  const delta = baseSeconds * jitterRatio;
  const offset = (Math.random() * 2 - 1) * delta;
  return Math.max(1, Math.round(baseSeconds + offset));
}

// --- minimal in-memory stand-in for Redis -----------------------------------
class FakeRedis {
  constructor() { this.store = new Map(); } // key -> { value, expiresAt }
  async get(key) {
    const e = this.store.get(key);
    if (!e) return null;
    if (e.expiresAt && e.expiresAt < Date.now()) { this.store.delete(key); return null; }
    return e.value;
  }
  async set(key, value, { ex } = {}) {
    this.store.set(key, { value, expiresAt: ex ? Date.now() + ex * 1000 : 0 });
    return 'OK';
  }
  // SET key val NX EX ttl  -> returns 'OK' only if the key did not exist (lock).
  // Atomic check-and-set: in real Redis this is one command; here we do the
  // check + write synchronously (no await between) so concurrent callers can't
  // both win the lock.
  async setNx(key, value, ttlSeconds) {
    const e = this.store.get(key);
    const live = e && (!e.expiresAt || e.expiresAt >= Date.now());
    if (live) return null;
    this.store.set(key, { value, expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : 0 });
    return 'OK';
  }
  async del(key) { return this.store.delete(key) ? 1 : 0; }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- the expensive source of truth (counts how often it actually runs) ------
let dbCalls = 0;
async function loadProductFromDb(id) {
  dbCalls += 1;
  await sleep(50); // pretend this is a slow query
  return { id, name: `Product ${id}`, price: 1999 };
}

// --- cache-aside read with single-flight lock -------------------------------
async function getProduct(id, { cache, ttl = 300, lockTtl = 5, maxWaitMs = 2000 }) {
  const key = `product:${id}`;
  const lockKey = `lock:${key}`;

  const hit = await cache.get(key);
  if (hit !== null) return JSON.parse(hit);

  // Try to become the single loader for this key.
  const gotLock = await cache.setNx(lockKey, '1', lockTtl);
  if (gotLock === 'OK') {
    try {
      const product = await loadProductFromDb(id);
      await cache.set(key, JSON.stringify(product), { ex: jitteredTtl(ttl) });
      return product;
    } finally {
      await cache.del(lockKey);
    }
  }

  // Follower: wait for the winner to populate the cache, then read it.
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    await sleep(10);
    const v = await cache.get(key);
    if (v !== null) return JSON.parse(v);
  }
  // Last resort if the winner died: load directly (degrade, don't fail).
  return loadProductFromDb(id);
}

async function main() {
  const cache = new FakeRedis();
  const herd = Array.from({ length: 50 }, () => getProduct(42, { cache }));
  const results = await Promise.all(herd);

  console.log(`Concurrent reads:     ${results.length}`);
  console.log(`Distinct DB loads:    ${dbCalls}  (single-flight collapsed the herd)`);
  console.log(`Sample result:        ${JSON.stringify(results[0])}`);

  // A second read is now a pure cache hit (no new DB load).
  const before = dbCalls;
  await getProduct(42, { cache });
  console.log(`DB loads after warm:  ${dbCalls - before}  (0 == cache hit)`);
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((e) => { console.error(e); process.exit(1); });
}

export { getProduct, jitteredTtl, FakeRedis };

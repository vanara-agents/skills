#!/usr/bin/env node
// Runnable helper: compute a jittered TTL so a batch of cache keys never expires
// in lockstep (the synchronized-expiry stampede). Demonstrates an *executed*,
// verifiable example asset.
//
// Usage:
//   node ttl-jitter.mjs <baseSeconds> [jitterRatio]   # print one jittered TTL
//   node ttl-jitter.mjs --selftest                    # run built-in test cases

const MIN_TTL = 1;

// Returns an integer TTL within [base*(1-ratio), base*(1+ratio)], floored at MIN_TTL.
export function jitteredTtl(baseSeconds, jitterRatio = 0.1, rand = Math.random) {
  if (!Number.isFinite(baseSeconds) || baseSeconds <= 0)
    throw new RangeError('baseSeconds must be a positive number');
  if (!Number.isFinite(jitterRatio) || jitterRatio < 0 || jitterRatio > 1)
    throw new RangeError('jitterRatio must be in [0, 1]');
  const delta = baseSeconds * jitterRatio;
  const offset = (rand() * 2 - 1) * delta;            // uniform in [-delta, +delta]
  return Math.max(MIN_TTL, Math.round(baseSeconds + offset));
}

// Inclusive bounds the result is guaranteed to fall within.
export function jitterBounds(baseSeconds, jitterRatio = 0.1) {
  const delta = baseSeconds * jitterRatio;
  return {
    min: Math.max(MIN_TTL, Math.round(baseSeconds - delta)),
    max: Math.max(MIN_TTL, Math.round(baseSeconds + delta)),
  };
}

function selftest() {
  const cases = [];
  const record = (name, pass, detail = '') => cases.push({ name, pass, detail });

  // 1. Many samples stay within ±ratio bounds (fuzz with the real RNG).
  {
    const base = 300, ratio = 0.1;
    const { min, max } = jitterBounds(base, ratio);
    let allInBounds = true;
    let sawSpread = new Set();
    for (let i = 0; i < 10000; i++) {
      const t = jitteredTtl(base, ratio);
      if (t < min || t > max) { allInBounds = false; break; }
      sawSpread.add(t);
    }
    record('stays within ±10% bounds over 10k samples', allInBounds, `[${min}, ${max}]`);
    record('produces a spread of values (not constant)', sawSpread.size > 10,
      `${sawSpread.size} distinct values`);
  }

  // 2. Extreme RNG values hit the exact bounds (deterministic injection).
  {
    const lo = jitteredTtl(300, 0.1, () => 0);   // rand=0 -> -delta
    const hi = jitteredTtl(300, 0.1, () => 1);   // rand=1 -> +delta (1 is exclusive in Math.random, tested as edge)
    record('rand=0 yields the low bound (270)', lo === 270, `got ${lo}`);
    record('rand~1 yields the high bound (330)', hi === 330, `got ${hi}`);
  }

  // 3. Floor at MIN_TTL: tiny base with full jitter never drops below 1.
  {
    let neverBelowMin = true;
    for (let i = 0; i < 1000; i++) {
      if (jitteredTtl(1, 1.0) < MIN_TTL) { neverBelowMin = false; break; }
    }
    record('never returns below MIN_TTL', neverBelowMin, `MIN_TTL=${MIN_TTL}`);
  }

  // 4. Zero jitter is a pure passthrough.
  record('jitterRatio=0 returns base unchanged', jitteredTtl(300, 0) === 300,
    `got ${jitteredTtl(300, 0)}`);

  // 5. Invalid inputs throw.
  const throws = (fn) => { try { fn(); return false; } catch { return true; } };
  record('rejects non-positive base', throws(() => jitteredTtl(0)));
  record('rejects out-of-range ratio', throws(() => jitteredTtl(300, 2)));

  let allPass = true;
  for (const { name, pass, detail } of cases) {
    if (!pass) allPass = false;
    console.log(`${pass ? '✓' : '✗'} ${name}${detail ? `  (${detail})` : ''}`);
  }
  console.log(allPass ? '\nAll selftests passed.' : '\nSelftests FAILED.');
  process.exit(allPass ? 0 : 1);
}

const arg = process.argv[2];
if (arg === '--selftest') {
  selftest();
} else if (arg) {
  const base = Number(arg);
  const ratio = process.argv[3] !== undefined ? Number(process.argv[3]) : 0.1;
  const { min, max } = jitterBounds(base, ratio);
  console.log(`jitteredTtl(${base}, ${ratio}) = ${jitteredTtl(base, ratio)}  (range [${min}, ${max}])`);
} else {
  console.log('Usage: node ttl-jitter.mjs <baseSeconds> [jitterRatio]');
  console.log('       node ttl-jitter.mjs --selftest');
  process.exit(2);
}

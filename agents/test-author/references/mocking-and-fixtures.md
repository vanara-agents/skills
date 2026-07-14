# Mocking, Fixtures, and Determinism

Tests must be **isolated** (independent of each other) and **deterministic** (same result
every run). That means controlling everything that crosses a boundary or varies between runs:
time, randomness, network, filesystem, and shared collaborators.

## Test doubles — know which one you need

| Double | Purpose |
|---|---|
| **Dummy** | Filler passed to satisfy a signature; never used. |
| **Stub** | Returns canned answers to calls made during the test. |
| **Spy** | A stub that also records how it was called. |
| **Mock** | A double with pre-set expectations that verifies interactions. |
| **Fake** | A working but lightweight implementation (in-memory DB, fake clock). |

Reach for the **simplest** double that does the job. Prefer **fakes and stubs** over strict
mocks: asserting on exact call sequences couples the test to implementation and makes
refactoring break green tests.

## Mock at the boundary, only the boundary

```ts
// GOOD: mock the HTTP client (a true external boundary)
const httpGet = vi.fn().mockResolvedValue({ status: 200, body: { rate: 1.1 } });
const rate = await fetchExchangeRate(httpGet, 'USD', 'EUR');
expect(rate).toBe(1.1);
```

```ts
// BAD: mocking the function under test leaves nothing real to verify
const fetchExchangeRate = vi.fn().mockResolvedValue(1.1); // tests the mock, not the code
```

Over-mocking is a top cause of tests that pass while the system is broken. If a test is
almost entirely mock setup, you are testing the mock framework. Either widen the unit or move
the check to an integration test with a real collaborator.

## Controlling time

Wall-clock time is the most common flakiness source. Inject a clock or freeze it:

```ts
import { vi } from 'vitest';

vi.useFakeTimers();
vi.setSystemTime(new Date('2026-06-29T12:00:00Z'));

expect(isExpired(token)).toBe(false);

vi.advanceTimersByTime(60_000); // jump 60s deterministically
expect(isExpired(token)).toBe(true);

vi.useRealTimers(); // always restore
```

Never assert on `Date.now()` or sleep with real timeouts — that makes tests slow and racy.

## Controlling randomness

Seed the RNG or inject it. A test that depends on `Math.random()` passes-then-fails at random:

```ts
const rng = () => 0.42;               // injected, deterministic
expect(pickWinner(players, rng)).toBe('alice');
```

## Fixtures and factories

- **Factories over literals.** A `makeOrder(overrides)` helper keeps tests readable and
  resilient — when a required field is added, you change the factory once, not 50 tests.
- **Build only what the test needs.** Override just the fields relevant to the behavior;
  let the factory default the rest. This makes the *intent* of each test obvious.
- **Isolate state.** Reset shared resources (DB rows, in-memory stores, module mocks) in
  `beforeEach`/`afterEach` so tests can run in any order. Order-dependent tests are a bug.

```ts
function makeOrder(overrides = {}) {
  return { id: 'ord_1', status: 'open', total: 100, createdAt: new Date(0), ...overrides };
}

it('marks a paid order as fulfilled', () => {
  const order = makeOrder({ status: 'paid' }); // only the relevant field is set
  expect(fulfill(order).status).toBe('fulfilled');
});
```

## Determinism checklist

- [ ] No real network, filesystem, or DB in unit tests (use fakes/stubs).
- [ ] Time and randomness are frozen or injected.
- [ ] No shared mutable state leaks between tests; setup/teardown resets it.
- [ ] All async work is awaited — no dangling promises or unhandled timers.
- [ ] The suite passes when run in a randomized order.

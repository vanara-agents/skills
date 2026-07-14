# Test Plan: Refund Eligibility

A filled-in example of the test plan this agent produces before writing code. Copy the shape
for any new behavior: enumerate cases by type, mark scope, and state how to run + gate.

## Behavior under test

`isRefundEligible(order, now)` decides whether an order can be refunded. An order is eligible
when it was placed within the last 30 days, is unused, and has not already been refunded.

## Cases

| # | Case | Type | Expected |
|---|---|---|---|
| 1 | order placed 5 days ago, unused | happy | `true` |
| 2 | order placed exactly 30 days ago | boundary | `true` (inclusive) |
| 3 | order placed 31 days ago | boundary | `false` |
| 4 | order placed 0 days ago (today) | boundary | `true` |
| 5 | order already marked refunded | failure | throws `AlreadyRefunded` |
| 6 | order is `null` / missing | failure | throws `NotFound` |
| 7 | order used (redeemed) | edge | `false` |

## Determinism notes

- `now` is **injected**, not read from the system clock, so the 30-day boundary tests are
  stable. The suite freezes `now` to `2026-06-29T12:00:00Z`.
- No network or DB access — `order` is built by a `makeOrder(overrides)` factory.

## Out of scope (tracked separately)

- Partial refunds and refund *amount* calculation — separate behavior, separate plan.
- Payment-provider interaction — covered by an integration test, not this unit.

## Coverage target

80% minimum (branch coverage emphasized — every `true`/`false`/throw path above is exercised).

## How to run

```bash
# Run just this behavior's tests
npm test -- refund

# Gate coverage in CI (fails below 80%)
node scripts/check-coverage.mjs coverage/coverage-summary.json --min=80
```

## Red → Green evidence (to be filled at implementation time)

```text
RED:   5 failing — isRefundEligible is not defined
GREEN: 7 passing — statements 92% · branches 88% · target 80% met
Gaps:  none for this behavior; partial-refund path intentionally deferred
```

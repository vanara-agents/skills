# Test Plan — Checkout v2

A filled-in example you can copy and adapt. Keep it short; a plan nobody reads is wasted effort.

## 1. Scope

In scope: cart pricing, tax, coupon validation, payment capture/refund, order confirmation.
Out of scope: marketing emails (covered by the comms team), the static footer.

## 2. Risk ranking

| Area | Impact | Likelihood | Risk | Primary layer |
|---|---|---|---|---|
| Payment capture/refund | 5 | 4 | 20 | integration + E2E |
| Price & tax math | 5 | 3 | 15 | unit |
| Coupon validation | 3 | 4 | 12 | unit (decision table) |
| Inventory decrement | 4 | 3 | 12 | integration |
| Confirmation email | 2 | 2 | 4 | integration (fake mailer) |
| Footer year | 1 | 1 | 1 | not tested (accepted by PO) |

## 3. Entry criteria

- Feature branch merged to `test`, CI build green.
- Test environment provisioned; seed catalog + test cards loaded.
- Payment gateway sandbox reachable OR contract fakes deployed.

## 4. Exit criteria

- All planned cases executed.
- Every CRITICAL/HIGH requirement has ≥1 passing test (see matrix).
- Line coverage ≥ 80% on changed files.
- Zero open Sev-1/Sev-2 defects; remaining issues triaged and accepted.

## 5. Requirement → test traceability matrix

This is the data `scripts/coverage-gaps.mjs` consumes (as JSON) to fail the build on any uncovered
requirement.

| Req ID | Requirement | Covering test(s) | Layer |
|---|---|---|---|
| R1 | Totals include tax for the buyer's region | `tax_us`, `tax_eu_boundary` | unit |
| R2 | Expired coupons are rejected | `coupon_expired` | unit |
| R3 | Coupon needs cart ≥ $50 | `coupon_min_4999`, `coupon_min_5000` | unit |
| R4 | Declined card shows a retry message | `pay_declined` | integration |
| R5 | Gateway timeout does not double-charge | `pay_timeout_idempotent` | integration |
| R6 | Successful pay → confirmation screen | `e2e_happy_checkout` | E2E |

## 6. Test data & environment

- Cards: `4242…` (success), `4000…0002` (decline), a sandbox timeout trigger.
- Cart fixtures hit each coupon partition (below-min, at-min, above-min) and tax boundary.
- Data is seeded per-run and torn down after; no shared mutable rows.

## 7. Notes

- Confirmation email asserted via a fake mailer, not the real provider (avoids flaky external dep).
- Footer year explicitly out of scope — recorded so it reads as a decision, not a miss.

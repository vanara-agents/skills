# Test Case Template

A reusable shape for a single test case. Keep one per case; the `id` is what the traceability matrix and
`scripts/coverage-gaps.mjs` reference.

```yaml
id: coupon_min_5000
requirement: R3            # links back to a requirement in the test plan
title: Coupon applies exactly at the $50 minimum
layer: unit               # unit | integration | e2e
technique: boundary       # partition | boundary | decision-table | exploratory
priority: high            # from risk ranking

preconditions:
  - a valid, non-expired coupon "SAVE10" exists

# Arrange / Act / Assert
arrange:
  cartTotal: 50.00        # the boundary value (min is inclusive)
  coupon: "SAVE10"
act:
  call: validateCoupon(coupon, cartTotal)
assert:
  result: applied
  discountPercent: 10

notes: paired with coupon_min_4999 (just below) and coupon_min_5001 (just above)
```

## Filled boundary trio

The same requirement R3 needs three cases to pin the `$50` edge — copy the block above per row:

| id | cartTotal | expected |
|---|---|---|
| `coupon_min_4999` | `49.99` | `min_not_met` |
| `coupon_min_5000` | `50.00` | `applied` |
| `coupon_min_5001` | `50.01` | `applied` |

## Why this shape

- `id` + `requirement` make traceability machine-checkable.
- `technique` documents *why* this case exists, so reviewers can spot a partition or boundary that is
  missing.
- Arrange/Act/Assert keeps each case focused on one behavior with one reason to fail.

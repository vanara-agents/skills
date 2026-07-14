# Case-Design Techniques

Do not invent test cases ad hoc — derive them. These three techniques cover most input-space reasoning
and stop you from writing many tests that all hit the same path while missing the one that breaks.

## 1. Equivalence partitioning

Split the input domain into classes whose members *should* behave identically, then test **one
representative per class**. Testing forty values from the same class adds cost, not confidence.

Example — a shipping-cost function by weight (kg):

| Partition | Range | Representative |
|---|---|---|
| invalid (negative) | `w < 0` | `-1` |
| light | `0 ≤ w ≤ 5` | `2` |
| medium | `5 < w ≤ 20` | `12` |
| heavy | `20 < w ≤ 50` | `35` |
| over-limit (rejected) | `w > 50` | `60` |

Five tests cover the whole domain's behavior classes.

## 2. Boundary value analysis

Defects cluster at edges (off-by-one, `<` vs `<=`). For each boundary test **just-below, on, and
just-above**. For the light/medium boundary at `5`:

```text
w = 4.99  → light
w = 5.00  → light   (boundary is inclusive)
w = 5.01  → medium
```

Repeat at every partition edge (`0`, `5`, `20`, `50`). Boundaries are where equivalence partitioning and
real bugs intersect, so this is the highest-yield technique per test.

## 3. Decision tables

When output depends on a **combination** of conditions, enumerate the combinations so no rule — and no
interaction between rules — is missed.

```text
Loan approval
Credit ≥ 700 | Income ≥ 50k | Existing debt | → Decision
   no        |    no         |    -          |  reject
   no        |    yes        |    yes        |  reject
   yes       |    no         |    no         |  review
   yes       |    yes        |    no         |  approve
   yes       |    yes        |    yes        |  review   ← interaction, easy to miss
```

For N independent booleans there are 2^N rows; collapse with "don't care" (`-`) entries where a condition
cannot change the outcome, and keep the interaction rows that ad-hoc testing skips.

## Worked example — combining all three

Function: `validateCoupon(code, cartTotal)` returns `applied | min_not_met | expired | invalid`.

1. **Partition** `cartTotal`: invalid (`< 0`), below-min (`0..49.99`), at-or-above-min (`>= 50`).
2. **Boundaries** on the `50` minimum: `49.99`, `50.00`, `50.01`.
3. **Decision table** over `code` state × threshold:

```text
code state | cartTotal ≥ 50 | → result
 valid     |    yes          |  applied
 valid     |    no           |  min_not_met
 expired   |    yes          |  expired      (expiry checked before threshold)
 unknown   |    -            |  invalid
```

Result: ~8 deliberate cases that cover the domain, the edges, and the rule interactions — versus a dozen
random inputs that would likely all land in the same partition.

## Pitfalls

- **All cases in one partition** — many "valid" inputs, none invalid, none at a boundary.
- **Skipping interaction rows** — testing each condition alone but never the combination that flips the
  result.
- **Boundary blindness** — testing `2` and `35` but never `5` or `50`, exactly where off-by-one hides.

# Risk-Based Prioritization

You cannot test everything, so test what matters most first. Rank each feature area by
**risk = impact × likelihood** and let that ranking drive where rigor goes.

## Scoring rubric

Score each axis 1–5, multiply, and sort descending.

### Impact (cost of failure)

| Score | Meaning | Examples |
|---|---|---|
| 5 | Catastrophic | money moved wrongly, data loss, security breach, legal/compliance breach |
| 4 | Severe | core flow blocked for all users, corrupted records |
| 3 | Moderate | feature broken for a segment, recoverable with effort |
| 2 | Minor | inconvenient, easy workaround |
| 1 | Cosmetic | visual glitch, no functional effect |

### Likelihood (probability of a defect)

| Score | Meaning | Signals that raise it |
|---|---|---|
| 5 | Very likely | brand-new code, complex logic, vague requirements, many integrations |
| 4 | Likely | recently changed, moderate complexity |
| 3 | Possible | some history, average complexity |
| 2 | Unlikely | stable code, simple logic, well understood |
| 1 | Rare | trivial, unchanged for a long time, heavily exercised in production |

## Worked heat-map (checkout feature)

| Area | Impact | Likelihood | Risk | Rigor |
|---|---|---|---|---|
| Payment capture / refund | 5 | 4 | 20 | exhaustive: unit + integration (success/decline/timeout) + E2E |
| Price & tax calculation | 5 | 3 | 15 | unit-heavy: partitions + full boundary analysis + decision table |
| Inventory decrement | 4 | 3 | 12 | integration with concurrency case |
| Coupon validation | 3 | 4 | 12 | decision table over rule combinations |
| Order confirmation email | 2 | 2 | 4 | one integration test with a fake mailer |
| Footer copyright year | 1 | 1 | 1 | not tested — documented as accepted |

The bottom rows matter as much as the top: writing "footer year — not tested, low risk" is an explicit,
defensible decision, not an oversight.

## Turning risk into a budget

1. Sort areas by risk score.
2. Allocate effort top-down until the budget (time, people) runs out.
3. For anything below the cut line, record the decision to under-test and who accepted it.
4. Re-rank when the system changes — risk is not static; a quiet module becomes high-risk the moment it
   is rewritten.

## Anti-patterns

- **Flat prioritization** — every area gets equal attention, so the payment path and a tooltip compete
  for the same hour.
- **Gut-feel only** — skipping the score and "just knowing" what is risky; the matrix forces the
  conversation and creates an auditable record.
- **Set-and-forget** — never re-scoring after a refactor moves the risk.

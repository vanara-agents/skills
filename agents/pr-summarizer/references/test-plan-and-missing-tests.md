# Test Plan and Missing Tests

The test plan is the payoff of the risk analysis: it tells the reviewer (and the author) exactly what
to verify before merge. A weak test plan says "test the feature." A strong one names the specific
path, input, and edge case that would catch a regression. Each item derives from a risk area.

## Derive the plan from the risk areas

Every risk area should produce at least one test-plan item. Walk the risk list and ask, for each:
"what concrete check would prove this is safe?"

| Risk area | Test-plan item it yields |
|---|---|
| Auth check changed | Valid credential → 200; missing/expired/revoked → 401; wrong-owner → 404. |
| Migration adds NOT NULL column | Migration runs cleanly on a DB with existing rows, not just empty. |
| Public API signature changed | Existing client calling the old shape still works, or is intentionally broken + versioned. |
| Rate-limit / config default changed | Behavior at the new limit matches expectation under load. |
| Injection surface added | Malicious input (`'; DROP`, `../../etc`) is rejected/escaped. |

## Make each item concrete

A test-plan item must name the **input or condition** that exercises the path, not just the feature.

- Weak: `- [ ] Test the export endpoint.`
- Strong: `- [ ] Export with a valid key → 200 and a well-formed PDF; with a revoked key → 401.`

- Weak: `- [ ] Check the migration.`
- Strong: `- [ ] Run the migration against a DB seeded with 1k `accounts` rows; confirm it completes
  without locking and backfills `api_key_id`.`

Cover the unhappy paths explicitly — empty, null, zero, max, unicode, unauthorized, concurrent.
Happy-path-only test plans miss exactly the cases that break in production.

## Flagging missing tests

New risky behavior with no accompanying test is a finding, not an omission to stay quiet about.
Cross-reference the **Tests** bucket from `reading-the-diff.md` against the **Feature** bucket:

- **Feature changed, no test file touched** → flag: "No test covers the new `POST /export` auth
  path." Put this in Risk areas *and* as an unchecked test-plan item.
- **Test added but asserts the wrong thing** → note if a test asserts implementation detail (a mock
  was called) rather than behavior (the response is 401).
- **Bug-fix PR with no regression test** → flag: a fix without a test that fails before it and passes
  after can silently regress. This is a HIGH-value gap to name.
- **Deleted or skipped tests** → a `it.skip` / `xtest` / removed assertion inside a feature PR is a
  red flag; call it out.

## What the test plan is *not*

- Not a guarantee — you list what *should* be verified; you don't run it. If you can run tests
  (Bash), do, and report results separately, but the plan stands regardless.
- Not exhaustive coverage math — you target the *risk*, not 100% of lines. Precision over volume.
- Not the reviewer's whole job — it's a checklist to make sure the highest-consequence paths aren't
  taken on faith.

## Example (rendered)

```md
**Test plan**
- [ ] Valid API key → 200 with PDF; missing/expired/revoked → 401 (no test currently exists).
- [ ] Migration `0007_api_keys` runs on a non-empty `accounts` table without lock or failure.
- [ ] Constant-time key comparison — valid vs invalid keys take indistinguishable time.
- [ ] Rate limit at the new 1000/min default behaves as intended under burst load, or is reverted.
```

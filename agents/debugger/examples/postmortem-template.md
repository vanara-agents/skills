# Blameless Postmortem Template

Write this after a significant bug or incident is resolved. The goal is **systems, not scapegoats** — ask
how the process let the defect through, not who typed it.

## Summary

- **Title:** _short description of the failure_
- **Date / duration:** _when it started, when it was resolved_
- **Severity / impact:** _who/what was affected, how badly (users, data, revenue)_
- **Status:** Resolved / Mitigated / Monitoring

## Timeline (UTC)

| Time | Event |
|---|---|
| 14:01 | Deploy of `abc123` |
| 14:05 | Error rate alarm fires |
| 14:12 | On-call acknowledges, begins investigation |
| 14:30 | Root cause identified (see below) |
| 14:38 | Fix deployed, error rate normal |

## Root cause

State the **confirmed** cause, distinguished from the symptom, with `file:line` and the commit that
introduced it. Explain *why the bad state arose*, not just where it crashed.

> e.g. `applyDiscount` mutated the shared `cart` array (`src/cart.js:48`), so a retried request applied
> the discount twice. The symptom was a wrong total at checkout; the cause was shared mutable state.

## Detection

- How was it found? (alarm / customer report / log)
- How long until detection? Could a metric or test have caught it sooner?

## Resolution & recovery

- What fixed it (the minimal change at the cause)?
- Any cleanup needed (data backfill, cache invalidation)?

## The five whys

1. Why did the total double? → discount applied twice.
2. Why twice? → request was retried and the cart was mutated.
3. Why was it mutated? → `applyDiscount` edited the array in place.
4. Why in place? → no immutability convention in cart code.
5. Why no convention? → no lint rule / review check for shared mutation.

## Action items

| Action | Owner | Type | Status |
|---|---|---|---|
| Add regression test for double-retry discount | | prevent | |
| Make cart operations immutable | | fix-class | |
| Add alarm on total-mismatch metric | | detect | |

## What went well / what was lucky

_Separate good process from good fortune — luck isn't repeatable._

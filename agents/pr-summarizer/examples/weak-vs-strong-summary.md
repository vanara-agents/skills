# Weak vs Strong Summary

The same PR, summarized two ways. The weak version is what you get from skimming the title and the
last commit. The strong version comes from reading the full `base...HEAD` diff and applying the risk
taxonomy. The contrast shows the specific habits that separate a useful summary from a useless one.

The PR: a branch titled **"fix: handle empty cart"** with four commits.

---

## Weak summary (avoid)

```md
## PR Summary — fix: handle empty cart

**Summary**
This PR fixes a bug where the cart didn't handle the empty case. It updates the checkout code to be
more robust. Looks good overall.

**Risk areas**
- Some changes to the checkout flow.

**Test plan**
- [ ] Test the cart.
- [ ] Make sure checkout works.
```

**Why it fails:**
- **Summarized from the title/last commit**, not the diff. The last commit was "handle empty cart,"
  but commit 2 on the branch also changed the discount calculation — invisible here.
- **Invents a verdict** ("Looks good overall") — orientation is not approval.
- **No anchors.** "Some changes to the checkout flow" tells the reviewer nothing about where to look.
- **Vague test plan.** "Test the cart" names no input, no edge case, no path.
- **Silent on the real risk** (a pricing change) and on missing tests.

---

## Strong summary (target)

```md
## PR Summary — fix: handle empty cart

**Summary**
Fixes a crash when checking out an empty cart (`checkout/total.js:18` now returns 0 instead of
dereferencing `items[0]`). Beyond the stated fix, commit 2 also changes discount rounding in
`checkout/discount.js:33` from `Math.round` to `Math.floor` — a real pricing behavior change the PR
title doesn't mention, and the first thing a reviewer should scrutinize. Net +47/-12 across 3 files;
no new tests were added.

**Risk areas**
- `checkout/discount.js:33` — discount now rounds *down* instead of to-nearest; every discounted
  order's total shifts by up to a cent. Money math change, unrelated to the empty-cart fix — confirm
  it's intentional and expected by finance/accounting.
- `checkout/total.js:18` — the empty-cart guard returns `0`; verify downstream code treats a `0`
  total as valid (not as "unpriced") so it doesn't skip payment or tax steps.
- No test file touched — neither the crash fix nor the rounding change has a regression test.

**Test plan**
- [ ] Checkout an empty cart → returns total 0, no crash (regression test for the reported bug).
- [ ] Discounted order → total uses floor rounding as intended; compare against a known expected
      value (covers the unannounced pricing change).
- [ ] A `0` total order flows through payment/tax steps correctly and isn't dropped as "unpriced."
```

**Why it works:** it read the whole branch (caught the commit-2 pricing change the title hid),
anchored every claim to a `file:line`, led with the highest-consequence change (money math), stayed
neutral (no "looks good"), and turned each risk into a concrete, input-specific test — including the
missing regression tests it flagged.

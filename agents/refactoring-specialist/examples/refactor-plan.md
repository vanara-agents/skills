# Worked Refactor Plan — Untangling `processCheckout`

A realistic, step-by-step plan for refactoring one overgrown function. Every step is
behavior-preserving and gated by a green test run.

## Starting point

```javascript
function processCheckout(cart, user, coupon) {
  let total = 0;
  for (const item of cart.items) {
    total += item.price * item.qty;
  }
  if (coupon) {
    if (coupon.type === "percent") {
      total = total - (total * coupon.value) / 100;
    } else if (coupon.type === "flat") {
      total = total - coupon.value;
    }
  }
  if (user.tier === "gold") {
    total = total * 0.9;
  }
  if (total < 0) total = 0;
  db.orders.insert({ userId: user.id, total });
  email.send(user.email, "Order confirmed", `You paid ${total}`);
  return total;
}
```

Smells: long function mixing calculation + persistence + notification; nested coupon conditional;
magic numbers (`0.9`); the pricing math is untested and hard to test because of side effects.

## Step 0 — Safety net

The function has no unit tests, only a flaky end-to-end test. **Add characterization tests** for the
pure pricing outcomes first:

```javascript
test("subtotal with no coupon, standard tier", () => {
  expect(priceOf(cart([{price:10,qty:2}]), user("standard"), null)).toBe(20);
});
test("percent coupon then gold discount", () => {
  expect(priceOf(cart([{price:100,qty:1}]), user("gold"), {type:"percent",value:10})).toBe(81);
});
test("never goes negative", () => {
  expect(priceOf(cart([{price:5,qty:1}]), user("standard"), {type:"flat",value:50})).toBe(0);
});
```

These pin *current* behavior (including the `81` that results from applying percent then gold). Run →
GREEN. (They reference a `priceOf` we will extract in Step 2; write them against the current function
first, then point them at the extraction.)

## Step 1 — Guard clause for the negative-total clamp

Pull the clamp to a named helper. Run tests → GREEN.

```javascript
const clampNonNegative = (n) => (n < 0 ? 0 : n);
```

## Step 2 — Extract the pure pricing function

Move all calculation into a side-effect-free `priceOf(cart, user, coupon)`; `processCheckout` calls it.
Now the characterization tests target `priceOf` directly. Run tests → GREEN.

## Step 3 — Replace nested coupon conditional with a lookup

```javascript
const COUPON = {
  percent: (t, c) => t - (t * c.value) / 100,
  flat:    (t, c) => t - c.value,
};
const applyCoupon = (t, c) => (c && COUPON[c.type] ? COUPON[c.type](t, c) : t);
```

Run tests → GREEN.

## Step 4 — Name the magic number

```javascript
const GOLD_DISCOUNT = 0.9; // 10% off for gold tier
```

Run tests → GREEN.

## Step 5 — Separate side effects

`processCheckout` keeps the `db.orders.insert` and `email.send`; the testable pricing now lives in
`priceOf`. Persistence/notification stay as the orchestration shell. Run tests → GREEN.

## Result

`priceOf` is pure and fully tested; the conditional is flat; the magic number is named; side effects
are isolated. **No behavior changed** — every characterization test that was green at Step 0 is still
green. Each step was a separate, revertible commit.

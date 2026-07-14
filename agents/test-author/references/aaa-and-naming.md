# Arrange-Act-Assert and Test Naming

A good test reads like a specification. Two habits get you most of the way: a consistent
three-phase body (AAA) and a name that states the behavior, not the method.

## Arrange-Act-Assert (AAA)

Structure every test in three visually separated phases:

```ts
it('caps the cart total at the configured maximum', () => {
  // Arrange — set up inputs, fixtures, doubles
  const cart = makeCart({ items: 5, unitPrice: 100 });
  const maxTotal = 400;

  // Act — invoke exactly ONE behavior
  const total = cart.totalWithCap(maxTotal);

  // Assert — verify the observable outcome
  expect(total).toBe(400);
});
```

Why it works:

- **One Act per test.** If you need two actions, you probably have two tests. A single Act
  keeps failures unambiguous — you know exactly what broke.
- **Assertions only in Assert.** An assertion buried in Arrange hides setup failures as
  behavior failures.
- **No logic in tests.** Loops, conditionals, and try/catch in a test are a smell; they can
  hide bugs in the test itself. Prefer table-driven cases or parameterized tests instead.

## Given-When-Then

The same shape, phrased for behavior-driven tests: *Given* a context, *When* an action
occurs, *Then* an outcome is observed. Map Given→Arrange, When→Act, Then→Assert.

## Naming tests

A test name should let a reader understand the requirement **without reading the body**.
State the scenario and the expected outcome.

**Weak (restates the method):**
```
test('applyDiscount')
test('test refund')
test('works')
```

**Strong (states the behavior):**
```
test('subtracts a percentage discount and rounds to two decimals')
test('throws RangeError when the discount exceeds 100 percent')
test('returns empty array when no markets match the query')
test('falls back to substring search when Redis is unavailable')
```

A useful template: **`<does X> when <condition Y>`** or **`<verb> <expected> given <state>`**.

## One behavior per test

When a test fails, its name plus its single Act should tell you what's broken without
debugging. Resist the "mega test" that arranges a huge world and asserts twenty things — the
first failure masks the rest, and the name can't describe what it covers. Split by behavior.

## Multiple assertions are fine — if they describe one behavior

```ts
// OK: these three assertions all describe "creates an open order"
expect(order.id).toBeDefined();
expect(order.status).toBe('open');
expect(order.createdAt).toBeInstanceOf(Date);
```

The guideline is *one logical concept per test*, not literally one `expect`.

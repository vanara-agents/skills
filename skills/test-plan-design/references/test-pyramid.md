# The Test Pyramid — Choosing a Layer

Test each behavior at the **lowest layer that can meaningfully verify it**. Lower is faster, cheaper, and
more precise about *where* a defect lives.

```
        /\        E2E         few   — full journeys, real-ish stack, slow, flakiest
       /  \       Integration some  — module + collaborators (DB, gateway, queue)
      /____\      Unit          many — one function/class, no I/O, milliseconds
```

## The three layers

### Unit
- Scope: a single function/class with no I/O.
- Verifies: pure logic — pricing, validation, parsing, state machines.
- Speed: milliseconds; run thousands on every commit.
- Rule of thumb: if it needs a network, a DB, or the clock, it is not a unit test (inject those).

### Integration
- Scope: a module talking to a real or faithfully faked collaborator.
- Verifies: wiring — does the repository persist correctly against a test DB? Does the payment client
  handle success, decline, and timeout from a mocked gateway?
- Speed: tens to hundreds of ms; run on every push.

### End-to-end (E2E)
- Scope: the whole system through its real entry point (HTTP, UI).
- Verifies: critical user journeys only — login, checkout, the one flow whose failure is unacceptable.
- Speed: seconds; the slowest and flakiest. Keep this layer thin.

## Layer-selection heuristics

| If you are verifying... | Prefer |
|---|---|
| a calculation or branch in logic | unit |
| that two components talk correctly | integration |
| that a third-party contract holds | contract test (a focused integration test) |
| that a user can complete a journey | E2E (one happy path + key failure) |

Push tests down whenever possible. A bug findable by a unit test should not be left for E2E to catch
slowly and vaguely.

## Integration vs contract tests

A **contract test** pins the shape of the boundary with an external service (request/response schema) so
you catch drift without depending on the live service in CI. Use it instead of hitting a flaky vendor
sandbox on every build; run the real integration on a slower cadence.

## Anti-patterns

- **Ice-cream cone (inverted pyramid)** — many E2E, few units. Slow, flaky, and tells you *that*
  something broke but not *where*.
- **Testing the framework** — asserting that the ORM saves a row or the HTTP library sends a header; test
  *your* logic, not the dependency's.
- **Integration tests that are secretly E2E** — spinning up the entire stack to check one function;
  collapse it to a unit.
- **No E2E at all** — every layer green, yet the assembled product is broken because nothing exercised
  the seams.

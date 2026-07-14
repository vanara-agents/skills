# Test Types and the Test Pyramid

Not all tests are equal. Choosing the right *level* for a given behavior is the difference
between a suite that gives fast, reliable signal and one that is slow, flaky, and ignored.

## The pyramid

```
        /\        E2E / UI        few, slow, high-confidence, brittle
       /  \
      /----\      Integration     some, medium speed, real collaborators
     /      \
    /--------\    Unit             many, fast, isolated, cheap
```

Push the bulk of your assertions **down** to the unit level where they are fast and stable.
Use the higher levels sparingly to prove the pieces wire together, not to re-test logic that
unit tests already cover. An inverted pyramid (mostly E2E) is slow and flaky.

## Unit tests

- **Scope:** one function, method, or class in isolation. Collaborators that cross a process
  or I/O boundary are replaced with doubles.
- **Cost:** milliseconds. Run thousands on every save.
- **Owns:** business logic, pure functions, edge cases, error branches, algorithms.
- **Rule of thumb:** if a behavior can be tested at the unit level, test it there.

## Integration tests

- **Scope:** several real units working together, or one unit against a real adjacent
  dependency (a database, an in-memory queue, a local HTTP server).
- **Cost:** tens to hundreds of milliseconds. Often need setup/teardown.
- **Owns:** the seams — ORM queries against a real schema, repository wiring, serialization,
  framework request/response handling, transaction behavior.
- **Avoid:** re-testing branch logic here that a unit test already covers; keep these about
  the *wiring*, not the *rules*.

## End-to-end (E2E) tests

- **Scope:** the whole system through its real entry point — a browser, a CLI, a public API.
- **Cost:** seconds. Slow, infrastructure-heavy, the most prone to flakiness.
- **Owns:** a handful of critical user journeys (sign up, checkout, the money path).
- **Hand off:** browser-driven E2E belongs to the **e2e-playwright** skill, not this agent.

## What goes where — a decision guide

| Question | Level |
|---|---|
| Does `applyDiscount(49.99, 10)` round correctly? | Unit |
| Does an invalid percentage throw `RangeError`? | Unit |
| Does the repository persist and re-read an order from Postgres? | Integration |
| Does `POST /orders` return `201` with a `Location` header? | Integration |
| Can a user add to cart and complete checkout in the browser? | E2E |

## Coverage as a signal, not a goal

The 80% target is a floor that flags untested regions, not a trophy. 100% line coverage with
assertion-free tests proves nothing. Chase **branch and behavior** coverage — every error
path and boundary — over raw line percentage. Use `scripts/check-coverage.mjs` to gate the
floor in CI, and read the uncovered lines to find the cases you forgot.

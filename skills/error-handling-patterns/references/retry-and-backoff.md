# Retry & Backoff

Retries turn transient failures into success — or turn a small blip into a self-inflicted outage. The
difference is discipline: retry only the right errors, back off exponentially, add jitter, and cap the
budget.

## What is safe to retry

A call is retry-safe only if **all three** hold:

1. **Operational + transient** — `503`, `429`, connection reset, timeout. Not `400`, `401`, `404`, `422`,
   and never a programmer bug.
2. **Idempotent** — the same call twice has the same effect. `GET`, `PUT`, `DELETE` usually qualify.
   `POST` does *not* unless protected by an idempotency key.
3. **Within budget** — you have attempts and time left.

Retrying a non-idempotent `POST /charge` after a timeout can double-charge the customer (the first
request may have succeeded; only the *response* was lost). Use an `Idempotency-Key` so the server
deduplicates — see the `rest-api-design` skill.

## Exponential backoff with jitter

Fixed-interval retries from many clients synchronize into waves that hammer a recovering service (the
**thundering herd**). Exponential backoff spreads attempts out; **jitter** desynchronizes clients.

```js
// Full jitter (AWS-recommended): sleep = random(0, base * 2**attempt), capped.
function backoffDelay(attempt, { baseMs = 100, capMs = 10_000 } = {}) {
  const exp = Math.min(capMs, baseMs * 2 ** attempt);
  return Math.random() * exp;
}
```

| Strategy | Behavior | Verdict |
|---|---|---|
| Fixed delay | every client retries at the same cadence | thundering herd |
| Exponential, no jitter | spreads over time but clients still align | better, still synchronized |
| Exponential + **full jitter** | random spread over the window | **recommended default** |

## Caps and budgets

- **Max attempts:** typically 3–5. Beyond that you're usually masking a real outage.
- **Total deadline:** cap wall-clock time (e.g. 30s) so a request doesn't hang the caller.
- **Respect `Retry-After`:** if the server sends it (on `429`/`503`), honor it over your own backoff.
- **Retry budget:** limit retries to a small fraction (e.g. 10%) of total requests so retries can't more
  than ~double load during an incident.

## Circuit breakers

When a dependency is clearly down, stop sending it traffic — retries just pile on. A circuit breaker
tracks the recent failure rate and **opens** (fails fast) past a threshold, periodically letting a
**half-open** trial request through to test recovery.

```
CLOSED  --(failures > threshold)-->  OPEN  --(cooldown elapsed)-->  HALF-OPEN
   ^                                                                    |
   +--------------------(trial request succeeds)------------------------+
                         (trial fails -> back to OPEN)
```

This protects the failing service (lets it recover) and the caller (fails fast instead of waiting on
timeouts).

## Timeouts come first

Retries are pointless without timeouts — a hung connection with no timeout never fails, so it never
retries. Always set a per-attempt timeout *and* an overall deadline. `AbortController` (JS),
`context.WithTimeout` (Go), and `asyncio.wait_for` (Python) are the standard tools.

## Pitfalls
- **Retrying everything** — retrying `400`/`401`/`422` is pure waste; they'll fail identically.
- **No jitter** — synchronized retries DDoS your own recovering service.
- **Unbounded retries** — a stuck dependency turns into an infinite loop and resource exhaustion.
- **Retrying non-idempotent writes** without an idempotency key — duplicate charges, duplicate orders.
- **Nested retries** — retry at the HTTP client *and* the service *and* the caller multiplies attempts
  exponentially (3×3×3 = 27). Retry at exactly one layer.

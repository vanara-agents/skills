# Error Taxonomy — Operational vs Programmer Errors

The most important classification in error handling. Get it wrong and you either crash on recoverable
conditions or limp along with corrupted state.

## The two categories

### Operational errors
Expected runtime conditions a correct program will still encounter. They are **values to be handled**,
not bugs.

- Failed to connect to a server / connection reset
- Request timed out
- Server returned `503` / `429`
- Invalid user input (failed validation)
- File not found, disk full, permission denied
- Out-of-money / out-of-stock business conditions

**Response:** recover, retry (if transient + idempotent), or surface a clear message to the caller/user.
These should *never* crash the process.

### Programmer errors
Bugs. The code is wrong. The program is now in a state its author did not anticipate.

- `undefined is not a function` / `TypeError` / `AttributeError`
- Reading a property of `null`
- Passing the wrong type to a function
- Forgetting to `await` a promise
- A violated invariant / failed assertion

**Response:** **fail fast and loud.** Do not `catch` them to "be safe". Let the process crash and let a
supervisor (systemd, Kubernetes, PM2, a worker pool) restart it in a known-good state. Catching a bug to
continue running risks acting on corrupted data.

## Why the distinction drives everything

| Decision | Operational | Programmer |
|---|---|---|
| Catch it? | Yes, where you can act | No — let it propagate to a top-level crash |
| Retry it? | If transient + idempotent | Never (the bug is deterministic) |
| Show the user? | A friendly, specific message | A generic "something went wrong" + 500, log internally |
| Alert on it? | Rate/aggregate (it's expected sometimes) | Page someone — it's a bug |

## Modeling operational errors as types

Give operational errors a stable, machine-readable identity so callers and the HTTP layer can branch on
them without string-matching messages.

```js
class AppError extends Error {
  constructor(message, { code, status = 500, retryable = false, cause } = {}) {
    super(message, { cause });
    this.name = 'AppError';
    this.code = code;          // e.g. 'order_not_found' — stable, machine-readable
    this.status = status;      // maps to an HTTP status at the boundary
    this.retryable = retryable;
    this.isOperational = true; // distinguishes from programmer bugs
  }
}

// At the top-level handler:
function isOperational(err) {
  return err instanceof AppError && err.isOperational === true;
}
```

At your crash handler, **only** swallow-and-respond for `isOperational` errors; rethrow everything else
so the process restarts.

## The uncaught handler

```js
process.on('uncaughtException', (err) => {
  logger.fatal('uncaught exception — crashing', { err });
  // Do NOT resume. Flush logs, then exit; let the supervisor restart.
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  // Promote to an exception so the above handler runs.
  throw reason;
});
```

## Pitfalls
- **Treating all errors the same.** A blanket `try/catch` around `main()` that logs and continues turns
  bugs into silent data corruption.
- **Retrying programmer errors.** They're deterministic — the retry fails identically while burning time
  and load.
- **A "500 for everything" API.** Validation failures are operational and should be `400/422`, not `500`.
- **Catching to add a log then re-throwing at every layer** — you get the same bug logged N times with no
  added signal. Decide one owner.

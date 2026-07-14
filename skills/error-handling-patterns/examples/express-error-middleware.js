// Centralized error handling for an Express app.
//
// Pattern: routes never format error responses themselves. They throw (or pass
// to next()) typed AppErrors, and ONE error-handling middleware translates them
// to a consistent HTTP envelope, logs full detail server-side, and hides
// internals from the client.
//
// Run a quick demo:  node express-error-middleware.js   (no deps; uses a fake req/res)

// --- 1. A typed, operational error -----------------------------------------

class AppError extends Error {
  constructor(message, { code, status = 500, retryable = false, cause } = {}) {
    super(message, { cause });
    this.name = 'AppError';
    this.code = code; // stable, machine-readable: 'order_not_found'
    this.status = status; // maps to HTTP status
    this.retryable = retryable;
    this.isOperational = true; // distinguishes from programmer bugs
  }
}

// Convenience constructors for common cases.
const NotFound = (msg, code = 'not_found') => new AppError(msg, { code, status: 404 });
const BadRequest = (msg, code = 'bad_request') => new AppError(msg, { code, status: 400 });
const Conflict = (msg, code = 'conflict') => new AppError(msg, { code, status: 409 });

// --- 2. Wrap async route handlers so rejections reach the error middleware --
// Without this, a thrown error in an async handler becomes an unhandledRejection
// instead of hitting Express's error pipeline.
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// --- 3. The ONE error-handling middleware (must have 4 args) ----------------

function errorMiddleware(logger) {
  return (err, req, res, _next) => {
    const operational = err instanceof AppError && err.isOperational;
    const status = operational ? err.status : 500;

    // Log full detail server-side ALWAYS — including the cause chain.
    logger.error('request failed', {
      method: req.method,
      path: req.path,
      status,
      code: err.code,
      message: err.message,
      cause: err.cause && String(err.cause),
      stack: err.stack,
    });

    // Never leak internals to the client on a non-operational (bug) error.
    const body = operational
      ? { data: null, error: { code: err.code, message: err.message } }
      : { data: null, error: { code: 'internal_error', message: 'Something went wrong.' } };

    res.status(status).json(body);
  };
}

// --- 4. Example routes ------------------------------------------------------
// app.get('/orders/:id', asyncHandler(async (req, res) => {
//   const order = await db.orders.find(req.params.id);
//   if (!order) throw NotFound(`order ${req.params.id} not found`, 'order_not_found');
//   res.json({ data: order, error: null });
// }));
// app.use(errorMiddleware(logger)); // registered LAST, after all routes.

// --- Tiny self-contained demo (no Express needed) --------------------------

function demo() {
  const logger = { error: (m, ctx) => console.log(`[log] ${m}`, ctx.code, '|', ctx.message) };
  const handle = errorMiddleware(logger);
  const fakeReq = { method: 'GET', path: '/orders/42' };
  const fakeRes = {
    status(s) { this._s = s; return this; },
    json(b) { console.log(`-> HTTP ${this._s}`, JSON.stringify(b)); },
  };

  console.log('Operational error (safe to show user):');
  handle(NotFound('order 42 not found', 'order_not_found'), fakeReq, fakeRes);

  console.log('\nProgrammer bug (internals hidden from user):');
  handle(new TypeError("Cannot read properties of undefined (reading 'id')"), fakeReq, fakeRes);
}

export { AppError, NotFound, BadRequest, Conflict, asyncHandler, errorMiddleware };

// Run the demo when executed directly (robust on Windows paths with spaces).
import { fileURLToPath } from 'node:url';
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  demo();
}

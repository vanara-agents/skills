// A typed Result<T, E> for TypeScript: model *expected* failures as values so the
// compiler forces callers to handle them, instead of throwing for control flow.
//
// Reserve `throw` for programmer errors / truly exceptional paths. Use Result for
// validation, "not found", parse failures, and other ordinary outcomes.

// --- The type --------------------------------------------------------------

export type Ok<T> = { readonly ok: true; readonly value: T };
export type Err<E> = { readonly ok: false; readonly error: E };
export type Result<T, E> = Ok<T> | Err<E>;

export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });
export const err = <E>(error: E): Err<E> => ({ ok: false, error });

// --- Helpers ---------------------------------------------------------------

/** Transform the success value, leaving errors untouched. */
export function map<T, U, E>(r: Result<T, E>, fn: (t: T) => U): Result<U, E> {
  return r.ok ? ok(fn(r.value)) : r;
}

/** Chain operations that can themselves fail (railway-oriented). */
export function flatMap<T, U, E>(
  r: Result<T, E>,
  fn: (t: T) => Result<U, E>,
): Result<U, E> {
  return r.ok ? fn(r.value) : r;
}

/** Provide a fallback for the error case. */
export function unwrapOr<T, E>(r: Result<T, E>, fallback: T): T {
  return r.ok ? r.value : fallback;
}

/** Wrap a throwing function so its exception becomes an Err value. */
export function tryCatch<T>(fn: () => T): Result<T, Error> {
  try {
    return ok(fn());
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
}

// --- Domain error type -----------------------------------------------------

export type ValidationError = { code: 'validation'; field: string; message: string };

// --- Example: validation that returns Result instead of throwing -----------

interface SignupInput {
  email: string;
  age: number;
}

export function validateSignup(input: SignupInput): Result<SignupInput, ValidationError> {
  if (!input.email.includes('@')) {
    return err({ code: 'validation', field: 'email', message: 'must be a valid email' });
  }
  if (input.age < 18) {
    return err({ code: 'validation', field: 'age', message: 'must be 18 or older' });
  }
  return ok(input);
}

// --- Usage: the caller CANNOT forget the error case (compiler enforces it) --

export function handleSignup(input: SignupInput): string {
  const result = validateSignup(input);
  if (!result.ok) {
    // result is narrowed to Err<ValidationError> here.
    return `rejected: ${result.error.field} ${result.error.message}`;
  }
  // result is narrowed to Ok<SignupInput> here.
  return `accepted: ${result.value.email}`;
}

// Example with chaining:
//   const parsed = tryCatch(() => JSON.parse(raw));
//   const validated = flatMap(parsed, (obj) => validateSignup(obj as SignupInput));
//   const msg = validated.ok ? 'ok' : `bad: ${validated.error.message}`;

# Language Patterns — Exceptions vs Result vs Panics

Different languages encode failure differently. Using the idiom the language was designed for keeps code
readable and tooling effective.

## JavaScript / TypeScript — exceptions + `cause`

Throw/`try`/`catch` is idiomatic. Since Node 16.9 / ES2022, always chain the cause:

```js
try {
  await writeFile(path, data);
} catch (err) {
  throw new Error(`failed to persist ${path}`, { cause: err });
}
```

For *expected* failures (validation, "not found") in TypeScript, a `Result` type makes the failure path
explicit in the signature and forces the caller to handle it — see [`result-pattern.ts`](../examples/result-pattern.ts).
Reserve `throw` for exceptional/programmer paths.

Async caveat: a rejected promise that isn't `await`ed or `.catch`ed becomes an `unhandledRejection`.
Never write `.catch(() => {})` to silence it — that's swallowing.

## Python — exceptions + `raise from`

Exceptions are the idiom. Preserve the chain and catch narrowly:

```python
try:
    config = json.loads(raw)
except json.JSONDecodeError as err:
    raise ConfigError("config file is not valid JSON") from err
```

- Catch the **narrowest** exception (`except KeyError`, not bare `except:`).
- A bare `except:` even catches `KeyboardInterrupt`/`SystemExit` — almost always a bug.
- Use `else` for the success path and `finally` for cleanup; or a context manager (`with`) for
  acquire/release so cleanup can't be forgotten.

```python
# Anti-pattern this skill's linter flags:
try:
    do_thing()
except Exception:
    pass   # swallowed — the failure is now invisible
```

## Go — errors as values

Go has no exceptions for ordinary failures; errors are returned values you must check. Wrap with `%w` to
preserve the chain, then unwrap with `errors.Is`/`errors.As`.

```go
func loadUser(id string) (*User, error) {
    u, err := db.Get(id)
    if err != nil {
        return nil, fmt.Errorf("loadUser %s: %w", id, err)
    }
    return u, nil
}

// caller:
if err != nil {
    if errors.Is(err, sql.ErrNoRows) { /* operational: 404 */ }
    return err // propagate with context already attached
}
```

- `panic` is for **programmer errors / unrecoverable** states only — not control flow.
- `if err != nil {}` with an empty body is the Go form of swallowing.
- `recover()` belongs at goroutine/server boundaries to stop one bad request from crashing the process,
  not as a general try/catch.

## Rust — `Result<T, E>` and `?`

Failure is in the type system. `Result<T, E>` must be handled (the compiler warns on an unused one), and
`?` propagates concisely while converting error types via `From`.

```rust
fn read_config(path: &str) -> Result<Config, ConfigError> {
    let raw = std::fs::read_to_string(path)?;      // io::Error -> ConfigError via From
    let cfg: Config = toml::from_str(&raw)?;       // toml error -> ConfigError via From
    Ok(cfg)
}
```

- `Option<T>` models absence; `Result<T, E>` models failure with a reason.
- `panic!`, `.unwrap()`, `.expect()` are for unrecoverable/programmer errors — avoid in library code.
- Crates like `thiserror` (typed library errors) and `anyhow` (application-level context) are the
  ecosystem standard.

## Cross-cutting principles

| Principle | JS/TS | Python | Go | Rust |
|---|---|---|---|---|
| Preserve cause | `{ cause }` | `raise ... from` | `%w` + `errors.Is/As` | `source()` / `?` + `From` |
| Expected-failure idiom | `Result` type | exceptions | error return | `Result<T,E>` |
| Programmer-error idiom | `throw` (crash) | exception (crash) | `panic` | `panic!`/`unwrap` |
| Swallow anti-pattern | `.catch(()=>{})` | `except: pass` | `if err != nil {}` | `let _ = ...;` ignoring `Result` |

The throughline: **make failure explicit, preserve the cause, handle at a boundary, and never silence.**

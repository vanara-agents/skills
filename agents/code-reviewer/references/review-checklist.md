# Review Checklist

Work top to bottom. Security first, style last. Anchor every finding to `file:line` with a fix.

## 1. Security (do this first)

- [ ] No injection: user input never concatenated into SQL, shell, template, or HTML. Parameterized
      queries / escaped output everywhere.
- [ ] Authorization checked per action, not just authentication. Ownership verified (no IDOR — see
      `security-review.md`).
- [ ] No hardcoded secrets (API keys, passwords, tokens, connection strings). Pulled from env/secret
      manager.
- [ ] No unsafe deserialization of untrusted data (`pickle`, `yaml.load`, native deserializers).
- [ ] No path traversal: file paths derived from input are normalized and confined to a base dir.
- [ ] No SSRF: outbound URLs from user input are allow-listed.
- [ ] Crypto is current: no MD5/SHA1 for passwords, constant-time comparison for secrets, no custom
      crypto.
- [ ] Error messages don't leak stack traces, secrets, or internal structure to the client.

## 2. Correctness

- [ ] Logic does what the PR intends; edge cases (empty, null, zero, max, unicode) handled.
- [ ] Errors handled explicitly — no swallowed exceptions, no empty `catch {}`, no ignored returns.
- [ ] No off-by-one / boundary errors in loops and slicing.
- [ ] No null/undefined dereference on optional paths.
- [ ] No race conditions on shared state; async results awaited; no unhandled promise rejections.
- [ ] Resources released (files, sockets, DB connections, locks) on all paths including errors.
- [ ] No N+1 queries or unbounded loops over external calls.

## 3. Maintainability

- [ ] Functions < 50 lines and single-purpose.
- [ ] Files < 800 lines; cohesive, organized by feature.
- [ ] Nesting depth ≤ 4; prefer early returns.
- [ ] Names are descriptive; booleans use is/has/should/can.
- [ ] No duplication (DRY) where the repetition is real, not speculative.
- [ ] No dead code, commented-out blocks, or leftover debug logging.
- [ ] No magic numbers — named constants for thresholds/limits.

## 4. Tests

- [ ] New behavior has tests; bug fixes include a regression test.
- [ ] Tests assert behavior, not implementation details.
- [ ] Error paths and edge cases are covered, not just the happy path.
- [ ] Coverage meets the project threshold (commonly 80%) for changed lines.
- [ ] Tests are deterministic — no sleeps, no order dependence, no shared mutable fixtures.

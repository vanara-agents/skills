# Large-Scale Refactoring — The Strangler Fig Pattern

Some restructurings are too big to do as a single behavior-preserving step: replacing a data layer,
splitting a god module, migrating off a deprecated API. The wrong move is a **big-bang rewrite** —
branch for weeks, swap everything at once, and discover the regressions in production. The right move
is an **incremental migration** where the system stays shippable the entire time.

## Why big-bang rewrites fail

- No safe revert point — you cannot bisect a single 4,000-line commit.
- Review is impossible; "looks fine" is the best a reviewer can honestly say.
- The old and new code drift apart while the rewrite is in flight.
- Integration problems all surface at the end, at once, under pressure.

## The strangler fig

Named after the vine that grows around a tree and gradually replaces it: you build the new
implementation *beside* the old, route a slice of work through it, verify, then widen the slice — until
the old code is dead and can be deleted.

```
        ┌─────────────┐
caller ─┤  seam /     ├─► OLD implementation   (shrinking)
        │  facade     ├─► NEW implementation   (growing)
        └─────────────┘
```

### Steps

1. **Introduce a seam.** Put an interface/facade between callers and the code you're replacing, so
   callers depend on the seam, not the implementation. This itself is a behavior-preserving refactor.
2. **Build the new implementation behind the seam**, covered by its own tests, used by no one yet.
3. **Route one slice across** — one endpoint, one customer, one feature flag's worth of traffic.
4. **Verify in production-like conditions.** Compare outputs (consider a brief period of running both
   and diffing results — a "parallel run") before trusting the new path.
5. **Widen the slice** incrementally until 100% flows through the new implementation.
6. **Delete the old implementation and the seam** once nothing references them.

### What keeps it safe

- The system is shippable after every step; you can pause or roll back at any slice.
- Each step is small enough to review and to revert.
- Tests (and the parallel run) prove behavior is preserved as traffic shifts.
- A feature flag makes the cutover instant to reverse.

## When a strangler is overkill

For a change you can complete in a handful of small behavior-preserving steps within one session, just
use the normal loop in [`safe-workflow.md`](safe-workflow.md). Reserve the strangler fig for
migrations that span many commits, modules, or deploys.

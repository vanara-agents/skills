# Safe Refactoring Workflow

Refactoring is only "safe" because of the process around it. The moves themselves are mechanical; the
discipline is what prevents regressions.

## The two hats (Kent Beck)

At any moment you are wearing exactly one hat:

- **Adding behavior** — you write a new failing test, then make it pass. The structure may get a little
  worse; that's fine.
- **Refactoring** — you change structure while **all tests stay green**. You add no tests (except as a
  safety net before starting) and you change no behavior.

Never wear both at once. The instant a test breaks, the hat you're wearing tells you what kind of mistake
you made. Mixing them destroys that signal and pollutes the diff so reviewers can't see the real change.

## Red-Green-Refactor

The TDD loop bakes refactoring in as a first-class step:

1. **Red** — write a test for the next behavior; it fails.
2. **Green** — write the *simplest* code that passes, even if ugly.
3. **Refactor** — now, with a green bar, clean up the code you just wrote *and* the surrounding code your
   change touched. Tests stay green.

The refactor step is where design actually happens. Skipping it is how "temporary" green code calcifies
into permanent debt.

## Characterization tests (the legacy-code entry point)

When you must refactor code that has **no tests** and you're unsure what it does:

1. Write a test that calls the code and asserts *whatever it currently returns* — even if that output
   looks wrong. You're not asserting correctness; you're **pinning current behavior**.
2. A fast way to discover the expected value: assert something obviously false, run it, and copy the
   actual value from the failure message into the assertion.
3. Build up enough of these to cover the branches you're about to touch.
4. Now refactor. Any behavior drift breaks a characterization test immediately.

Characterization tests document the *as-is* contract. If you later decide some pinned behavior was a bug,
that's a **separate, behavior-changing** task (other hat) with its own test update and commit.

## Strangler fig (refactoring at system scale)

Big-bang rewrites fail because they discard embedded edge-case knowledge and offer no incremental safety.
The strangler fig grows the new structure *around* the old, like the vine that envelops a tree:

1. Put a **seam** (interface/facade/router) in front of the thing you want to replace.
2. Build the new implementation behind the seam for **one** slice of functionality.
3. Route that slice's traffic to the new code; keep everything else on the old.
4. Verify in production (metrics, parity checks); migrate the next slice.
5. When nothing routes to the old code, delete it.

At every step the system is fully working and releasable. You can stop, pause, or roll back a single
slice — none of which a rewrite allows.

## Commit hygiene

- **One refactoring move per commit** where practical; at minimum, never mix a refactor with a feature in
  one commit. A reviewer should be able to read a commit message of `refactor: extract totalFor()` and
  trust the behavior is unchanged.
- Land refactors **continuously** onto `main`. Long-lived refactor branches rot against everyone else's
  work and create merge hell.
- Keep the suite **fast**. If running tests after every step is painful, you'll stop doing it — and the
  whole safety net collapses. Invest in test speed first.

## Pre-flight checklist

- [ ] Green test suite covering the behavior I'm about to move (or characterization tests written).
- [ ] I know which hat I'm wearing right now.
- [ ] My next step is small enough that a red bar points at one change.
- [ ] I will run the suite after this step.
- [ ] My commit contains only refactoring, no behavior change.

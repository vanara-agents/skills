# The Safe Refactoring Workflow

Refactoring is only safe when each step is small, behavior-preserving, and verified. This is the loop
and the mechanics behind it.

## The core loop

```
confirm tests GREEN
  └─ pick ONE smell
       └─ apply ONE small transformation
            └─ run tests
                 ├─ GREEN → keep, optionally commit, loop
                 └─ RED   → revert last step, take a smaller step (or add a test)
```

The loop is non-negotiable. The two questions that gate every step:

1. **Were the tests green before I started?** If not, you are not refactoring — you are debugging.
   Get to green first.
2. **Are the tests still green after this step?** If not, you changed behavior. Revert.

## Characterization tests (when coverage is missing)

If the code you must refactor has no tests, write tests that **describe what it does now**, not what
it should do:

1. Call the code with representative inputs.
2. Observe the actual output (run it).
3. Assert that exact output — even if it looks wrong. The goal is to detect *change*, not to judge
   correctness.
4. Now refactor under that net. If a characterization test goes red, your refactor altered behavior.

Fixing genuinely-wrong behavior is a *separate* task done *after* the refactor, with its own test.

## Transformation mechanics

Each refactoring has a known recipe. A few of the most common:

### Extract Function
1. Copy the fragment into a new function with an intention-revealing name.
2. Pass in the variables it reads as parameters; return the values it writes.
3. Replace the original fragment with a call.
4. Run tests.

### Rename
1. Use editor/tooling rename so every reference updates atomically.
2. Run tests. (With good tooling this is among the safest moves.)

### Replace Nested Conditional with Guard Clauses
1. Identify the error/edge conditions.
2. Turn each into an early `return`/`throw` at the top.
3. De-indent the remaining happy path.
4. Run tests.

### Introduce Parameter Object
1. Create a type/struct grouping the parameters that travel together.
2. Add it as a new parameter; populate from the old ones at the call site.
3. Move logic to read from the object; remove the old parameters.
4. Run tests after each sub-step.

## Commit discipline

- One behavior-preserving step per commit where practical. Message: `refactor: extract normalizeName`.
- Never bundle a refactor commit with a feature or fix commit. A reviewer (or `git bisect`) must be
  able to trust that a `refactor:` commit changed no behavior.
- Keep steps revertible: each commit should leave the suite green.

## Stop conditions

Stop refactoring when any of these is true:
- The targeted smell is gone and the code reads clearly.
- You can no longer make a change you're confident preserves behavior.
- You've drifted out of the requested scope.
- A behavior change is actually required — switch tasks and say so.

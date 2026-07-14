# Code Smell Catalogue

A smell is a surface symptom that usually points to a deeper structural problem. Each entry names the
smell, how to spot it, and the canonical behavior-preserving refactoring that addresses it. Apply one
at a time, tests green between each.

## Bloaters

### Long function
- **Spot it:** more than ~20–50 lines, multiple levels of abstraction in one body, comments that
  section it into "phases".
- **Fix:** **Extract Function** for each phase; name each by *what* it does, not *how*.

### Large class / module
- **Spot it:** a file past ~800 lines doing several unrelated jobs.
- **Fix:** **Extract Class / Extract Module** along responsibility lines; move related fields and the
  methods that use them together.

### Long parameter list
- **Spot it:** four or more parameters, especially several passed as a group everywhere.
- **Fix:** **Introduce Parameter Object** or **Preserve Whole Object**.

### Primitive obsession
- **Spot it:** raw strings/ints carrying domain meaning (a `string currency`, a `number cents`).
- **Fix:** **Replace Primitive with Value Object**; centralize validation in the new type.

## Conditional complexity

### Deep nesting
- **Spot it:** arrow-shaped code, 3+ nested `if`s, the happy path buried at the bottom.
- **Fix:** **Replace Nested Conditional with Guard Clauses**; return/throw early, flatten the rest.

### Switch / type-code dispatch
- **Spot it:** the same `switch` on a type field repeated in several places.
- **Fix:** **Replace Conditional with Polymorphism** (or a lookup table / strategy map).

### Repeated boolean expressions
- **Spot it:** the same compound condition spelled out multiple times.
- **Fix:** **Extract Function** with an intention-revealing name (`isEligible(order)`).

## Duplication

### Duplicated code
- **Spot it:** the same statements (or near-identical) in two or more places.
- **Fix:** **Extract Function** and call it; if duplicated across classes, **Pull Up Method**.

### Shotgun surgery
- **Spot it:** one logical change forces edits in many scattered files.
- **Fix:** **Move Method / Move Field** to gather the responsibility into one place.

## Naming and clarity

### Mysterious name
- **Spot it:** `data2`, `tmp`, `doStuff`, single-letter non-loop variables.
- **Fix:** **Rename** to reveal intent. Cheap, high value, almost always safe with tooling.

### Comments compensating for unclear code
- **Spot it:** a comment explaining *what* a block does.
- **Fix:** **Extract Function** named after the comment, then delete the comment.

## Coupling

### Feature envy
- **Spot it:** a method that reaches into another object's data more than its own.
- **Fix:** **Move Method** to the class that owns the data.

### Message chains / inappropriate intimacy
- **Spot it:** `a.getB().getC().getD()`; objects knowing each other's internals.
- **Fix:** **Hide Delegate**; expose intent-level methods instead of chains.

## How to use this catalogue

1. Find the smell that matches what you see.
2. Confirm tests cover the code (add characterization tests if not).
3. Apply only the canonical fix, in small steps, re-running tests after each.
4. Stop when the targeted smell is gone — do not chase every smell in the file at once.

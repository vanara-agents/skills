# Code Smells — and the move each one calls for

A *smell* is a surface symptom that usually (not always) points at a deeper structural problem. Smells
tell you **where** to refactor; the named refactoring tells you **how**. Use judgment — a smell is a
prompt to look, not an automatic mandate to change.

## Bloaters

### Long method / long function
**Symptom:** the body has comment-delimited "paragraphs," scrolls off-screen, mixes levels of
abstraction (high-level orchestration next to bit-twiddling).
**Move:** *Extract Function* on each paragraph; *Replace Temp with Query*; *Decompose Conditional*.
**Heuristic:** if you feel the urge to write a comment explaining a block, extract that block and let the
function name be the comment.

### Large class / god object
**Symptom:** dozens of fields, many unrelated responsibilities, low cohesion (fields used by disjoint
subsets of methods).
**Move:** *Extract Class* / *Extract Subclass*; group fields that change together into their own type.

### Primitive obsession
**Symptom:** `string currency`, `int cents`, `string` for a phone number — primitives standing in for
domain concepts, with validation/formatting scattered around every use site.
**Move:** *Replace Primitive with Object* (a `Money`, `PhoneNumber`, `EmailAddress` value type that owns
its validation and behavior). Kills duplicated validation and impossible states.

### Long parameter list
**Symptom:** five-plus parameters, or the same clump of args passed together everywhere.
**Move:** *Introduce Parameter Object* / *Preserve Whole Object*.

### Data clumps
**Symptom:** the same three or four data items travel together through many signatures
(`x, y, width, height`).
**Move:** *Introduce Parameter Object* — they want to be a `Rect`.

## Change-preventers (these make change expensive)

### Shotgun surgery
**Symptom:** one conceptual change (e.g. "add a new tax rule") forces small edits in many scattered
files/classes.
**Move:** *Move Function/Field* to pull the scattered logic into one place; *Inline Class* if a class
adds no value.

### Divergent change
**Symptom:** the opposite — one class is changed for many *different* reasons (a new report format *and*
a new DB column both touch it).
**Move:** *Extract Class* so each axis of change lives in its own type.

## Couplers

### Feature envy
**Symptom:** a method spends more time reading another object's fields than its own.
**Move:** *Move Function* to the class whose data it envies; *Extract Function* then move the part that
envies.

### Inappropriate intimacy
**Symptom:** two classes reach deep into each other's private parts.
**Move:** *Move Function/Field*, *Hide Delegate*, or merge if they're really one concept.

### Message chains
**Symptom:** `a.getB().getC().getD().doThing()` — the caller is coupled to the whole navigation path.
**Move:** *Hide Delegate* (ask the first object to do the work).

## Dispensables

### Duplicated code
**Symptom:** the same (or near-same) logic in multiple places.
**Move:** *Extract Function* and call it from both. **Rule of three:** duplication is acceptable twice;
on the third occurrence, extract. Extracting too early (on the second) risks a wrong abstraction that
couples things that only *coincidentally* looked alike.

### Comments (as deodorant)
**Symptom:** a comment exists to explain *what* confusing code does.
**Move:** *Extract Function* / *Rename* so the code self-documents; keep comments for *why*, not *what*.

### Dead code / speculative generality
**Symptom:** unused params, unreachable branches, abstractions with a single implementation "for the
future."
**Move:** delete it (YAGNI). Pairs with the `refactor-cleaner` agent.

## Conditionals

### Complex / nested conditional
**Symptom:** deep `if/else` pyramids; a `switch` on a type code that recurs in several places.
**Move:** *Replace Nested Conditional with Guard Clauses*; *Decompose Conditional* (extract the
condition and each leg into named functions); *Replace Conditional with Polymorphism* when the switch is
on a type.

### Repeated switch on a type
**Symptom:** the same `switch (kind)` appears in `area()`, `perimeter()`, `draw()`…
**Move:** *Replace Conditional with Polymorphism* — each type owns all its behaviors; new types become
additive (Open/Closed).

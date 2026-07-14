# Refactoring Catalog — named moves with mechanics

Each refactoring is a *named* procedure with explicit **mechanics** — a small step sequence designed so
the suite stays green throughout. Run tests after every numbered step where noted. Most modern IDEs
automate the safe versions (Rename, Extract Function/Variable, Inline, Move); prefer the automated
version when available because it preserves references mechanically.

## Extract Function
**When:** a fragment of a function can be grouped and named for its intent (long method, duplication,
comment-as-deodorant).
**Mechanics:**
1. Create a new function named for *what it does*, not how.
2. Copy the extracted code into it.
3. Pass in any local variables it reads as parameters; return any it writes.
4. Replace the original fragment with a call.
5. Run tests.

## Inline Function / Inline Variable
**When:** the body is as clear as the name, or a layer of indirection earns nothing.
**Mechanics:** verify it isn't polymorphically overridden; replace each call with the body; remove the
declaration; run tests. (The inverse of Extract — use it to undo a premature extraction.)

## Rename (Variable / Function / Field)
**When:** a name no longer reveals intent. The highest value-to-risk move there is.
**Mechanics:** prefer the IDE's rename (updates all references atomically). If manual, change the
declaration, find every reference, update, run tests. Renaming a published API element requires a
deprecation step — keep the old name delegating for one release.

## Extract Variable
**When:** a sub-expression is hard to read or repeated within an expression.
**Mechanics:** introduce a well-named `const` for the sub-expression; replace occurrences; run tests.
Makes complex booleans and arithmetic self-explaining.

## Replace Nested Conditional with Guard Clauses
**When:** deep `if` nesting where some branches are exceptional/early-exit cases.
**Mechanics:** for each "this isn't the normal path" check, return (or throw) early at the top; the happy
path then drops out of the nesting. Run tests after each guard.

## Decompose Conditional
**When:** a complex `if (cond) { ... } else { ... }` where the condition and legs are all hard to read.
**Mechanics:** *Extract Function* on the condition (name it `isEligible(...)`), and on each leg. The
conditional becomes `if (isEligible(x)) return discounted(x); return standard(x);`.

## Replace Conditional with Polymorphism
**When:** the same `switch`/`if`-on-type appears in multiple methods (repeated switch smell).
**Mechanics:**
1. Ensure an inheritance/interface structure exists (create it via *Extract Class* / *Replace Type Code
   with Subclasses* if needed).
2. Move one `switch` into the superclass/interface as a method.
3. For each leg, override the method in the matching subclass with that leg's body.
4. Remove the leg from the superclass; leave the default/abstract.
5. Run tests after each leg moved. Repeat per method that switched on the same type.

## Introduce Parameter Object
**When:** a clump of arguments (data clump) recurs across signatures.
**Mechanics:** create a class/record for the clump; add it as a parameter; one call site at a time, route
the individual args through the object; remove the originals once all sites are migrated; run tests
between sites.

## Replace Magic Literal with Symbolic Constant
**When:** an unexplained literal (`0.2`, `86400`, `"ACTIVE"`) carries meaning.
**Mechanics:** declare a named constant; replace each occurrence; run tests. Search for the literal value
elsewhere — duplicated magic numbers often hide.

## Move Function / Move Field
**When:** feature envy or shotgun surgery — the element lives in the wrong class.
**Mechanics:** check what it references; create it in the target; adjust references; turn the original
into a delegating call (or remove if no longer needed); update callers; run tests.

## Separate Query from Modifier
**When:** a function both returns a value *and* has a side effect (surprising to callers).
**Mechanics:** create a pure query that returns the value; leave the modifier returning void; update
callers to call both where they truly need the side effect; run tests.

## Mechanics discipline
The point of writing mechanics down is that under pressure you follow the *steps*, not your intuition.
Small steps + green tests after each = you can always revert exactly one move. If a step list feels too
small, that's the point — speed comes from never having to debug.

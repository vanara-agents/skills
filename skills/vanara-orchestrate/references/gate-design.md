# Designing good gates

A pipeline is only as honest as its gates. This reference is how to write
gates that stop bad work without stopping all work.

## The anatomy of a gate

A gate is three things, all written down BEFORE the stage runs:
1. **An exit condition** that is checkable — a command, a diff, a test run.
   "Code looks good" is not a gate; "contract tests green" is.
2. **A failure route** — retry (with what changed?), escalate (to whom?), or
   abort (cleaning up what?). A gate with no failure route is a hope.
3. **A record** — checkpoint.mjs writes pass/fail + evidence id. Unrecorded
   gates didn't happen.

## Gate smells

- **The rubber stamp**: a gate that has never failed. Either the work is
  perfect (unlikely) or the condition is toothless — tighten it.
- **The flake gate**: fails randomly, so humans auto-retry it. It trains the
  team to ignore red. Fix the flake or delete the gate.
- **The scope creep gate**: "review" that relitigates requirements. Gates
  check the stage's OWN exit condition, nothing else.

## Sizing gates to risk

Money paths and auth get adversarial gates (a skeptic pass whose job is to
refute). Internal tooling gets contract tests. Docs get a link check. The
budget you spend on a gate should track the blast radius of the stage lying.

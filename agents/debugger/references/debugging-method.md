# The Debugging Method — Hypothesis-Driven

Debugging is the scientific method applied to a misbehaving system. You don't "stare at code until you
see it"; you run controlled experiments that each rule something in or out.

## The loop

```text
   observe ──> hypothesize ──> predict ──> experiment ──> compare
      ^                                                      │
      └──────────────────── refine ─────────────────────────┘
```

1. **Observe.** Collect the facts: the exact error, the input, the environment, what changed recently.
   Resist theorizing before you have the message in front of you.
2. **Hypothesize.** Propose one *falsifiable* cause: "The total is wrong because `applyDiscount` mutates
   the shared `cart` array." A good hypothesis predicts something you can check.
3. **Predict.** If the hypothesis is true, what must also be true? "Then logging `cart` before and after
   should show it changed."
4. **Experiment.** Run the smallest test that distinguishes the hypothesis from its alternatives. Change
   **one variable at a time**.
5. **Compare.** Did the prediction hold? If yes, you've localized the cause. If no, the hypothesis is
   wrong — discard it (don't patch it) and form a new one from what you learned.

## Why "one variable at a time" is non-negotiable

If you change input, code, and config simultaneously and the bug vanishes, the experiment has no signal:
you cannot attribute the change. Worse, multi-change "fixes" routinely introduce new defects that hide
behind the apparent success. Keep a clean control: a known-failing case you re-run after each change.

## Rubber-duck and assumption auditing

Explain the failing path aloud, line by line, to an imaginary listener. The bug is usually hidden in a
step you *assumed* was correct and therefore never checked. Make a list of your assumptions and verify the
cheapest ones first:

- "This value is never null." → log it.
- "This branch always runs." → add a counter.
- "These two configs match." → diff them.

## Confirmation before fixing

The most common mistake is editing the fix before confirming the hypothesis. Confirm first with a probe
(log, assertion, debugger, unit test). Only then edit — and only the smallest surface at the **origin** of
the bad state, not the place where it finally crashed.

## Binary search of everything

When you can't reason your way to the cause, *search* for it. Halve the space repeatedly: comment out half
the code, feed half the input, check the midpoint commit. See `bisection.md`. Each halving turns an
N-step problem into log₂(N) steps — a 1,000-line search becomes ~10 checks.

## Knowing when to stop

Stop and escalate (or write down what you need) when: you cannot reproduce after a bounded effort; the
cause is in a third-party dependency you can't change; or two equally-likely hypotheses both survive
testing and you need more instrumentation. Guessing past this point produces band-aids.

# Weighted decision matrix — the method

A weighted decision matrix (a.k.a. weighted scoring model, Pugh matrix when scored against a
baseline) turns "which option is best?" into an explicit, inspectable calculation. Its value is
**not** the number it produces — it is that it forces the criteria and their relative importance
into the open, where they can be argued with. A matrix with hidden or unjustified weights is worse
than no matrix, because it launders a preference as arithmetic.

## The five steps

### 1. List genuine options
Include the status quo ("do nothing / keep what we have") and the simplest thing that could work.
Two or more real options are required — a single option is a proposal, not a decision.

### 2. Separate constraints from criteria
- A **constraint** is a hard pass/fail requirement: a budget ceiling, a compliance rule, a
  dealbreaker ("must run on-prem"). Constraints are **gates** — an option that fails one is
  eliminated, full stop. They are never scored, because a high score elsewhere must not be able to
  buy back a fatal flaw.
- A **criterion** is a dimension where *more is better* and options differ by degree (latency,
  cost, team fit, DX). These get weighted and scored.

Getting this split wrong is the single most common way a matrix produces a confidently wrong answer.

### 3. Weight the criteria (they must sum to 1.0)
Assign each criterion a weight reflecting how much it should influence *this* decision. Normalize so
the weights sum to 1.0. Methods, roughly in increasing rigor:
- **Direct allocation** — hand out 100 points across the criteria; divide by 100. Fast, fine for most.
- **Rank then convert** — rank the criteria, then assign weights (e.g. rank-sum) so the ranking is
  reflected. Good when stakeholders agree on order but not magnitude.
- **Pairwise comparison (AHP-lite)** — for each pair, ask "which matters more, and how much?"; derive
  weights from the comparisons. Use only when the decision is expensive and the criteria genuinely
  contested — it is heavier than most decisions justify.

The weights encode the **values** behind the decision. They are contested far more often than the
scores, and they are where you should spend the argument. Write down *why* each weight is what it is.

### 4. Score each option against each criterion
Use a consistent scale — **1–5** is plenty (1 = poor, 3 = adequate, 5 = excellent). Score each cell
on its own evidence, ideally filling the matrix **column by column** (one criterion across all
options) rather than row by row, which reduces halo effect. Attach a one-line justification to every
score, and mark any score that rests on a guess rather than a fact — those are where the decision is
actually weak.

Anchoring the scale to concrete descriptors ("5 = p99 < 50ms; 3 = p99 < 200ms; 1 = p99 > 500ms")
beats vibes and makes the scores reproducible.

### 5. Compute, then interrogate
Weighted total for an option = Σ (weight × score). Rank by total. Then **do not stop at the ranking** —
run the sensitivity check below. `scripts/decision-score.mjs` does the arithmetic and the margin/
decisive-criterion analysis for you from a small JSON description of the matrix.

## Sensitivity analysis — the step that separates honest matrices from theater

A weighted total is a point estimate built on judgment calls. Before trusting the winner, ask:

- **Is the margin inside the noise?** If #1 beats #2 by 0.05 on a 1–5 scale, the options are
  effectively tied; the "winner" is an artifact of scoring precision you don't have. Report the tie
  and decide on the trade-off instead.
- **What is the decisive criterion?** Find the criterion carrying the win — the largest
  `weight × (score_top − score_second)`. If the entire margin rests on one criterion, the decision is
  really a decision about *that criterion's weight and score*. Pressure-test both.
- **Does the winner survive a plausible re-weight?** Nudge the most-contested weight up and down by a
  defensible amount and re-rank. If the winner flips, you have found the real crux — the decision
  hinges on a values call about that weight, not on the arithmetic. Surface it; don't bury it.

A matrix whose winner survives sensitivity is a strong recommendation. A matrix whose winner flips on
a small, arguable weight change is telling you the options are close and the decision is a judgment
call — which is also a valuable, honest result.

## Worked micro-example

Choosing an events datastore, weights already justified:

```text
Criterion (weight)      | Postgres | Cassandra
------------------------|----------|----------
write throughput (0.40) | 3        | 5
operability      (0.35) | 5        | 2
cost             (0.25) | 5        | 3
------------------------|----------|----------
Weighted total          | 4.20     | 3.45
```

Postgres wins 4.20 to 3.45 — a 0.75 margin, well outside the noise. The decisive criterion is
*operability* (0.35 × (5−2) = +1.05 for Postgres), which more than covers Cassandra's throughput
edge (0.40 × (3−5) = −0.80). Read: "unless raw write throughput should outweigh operability *and*
cost combined — i.e. unless you re-weight throughput above ~0.55 — Postgres is the call." That
sentence, not the 4.20, is the deliverable.

## Common failure modes (see also `decision-biases.md`)
- Setting weights *after* scoring, to reach a predetermined winner (criteria-fishing).
- Scoring a constraint as a criterion, letting strengths buy back a dealbreaker.
- Treating a 0.03 margin as decisive (false precision).
- Never doing the sensitivity check, so a coin-flip is reported as a clear winner.

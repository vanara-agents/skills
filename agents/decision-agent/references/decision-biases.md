# Decision biases — how they corrupt a matrix, and how to counter them

A weighted matrix does not make a decision objective. It makes the judgment *visible*, which is more
useful — but only if you actively defend against the biases that quietly bend the weights and scores.
Each bias below comes with its **tell** (how to notice it) and a **structural counter** (a step baked
into the process, not just "try harder to be rational").

## Criteria-fishing / rationalization
**What it is.** Choosing or weighting the criteria *after* you already know which option you want, so
the matrix confirms a pre-made decision. The most dangerous bias here because it wears the costume of
rigor.
**Tell.** The weights were set (or quietly adjusted) once the scores were in view. The "winner"
happens to be the option someone favored going in.
**Counter.** Set and justify the weights **before** scoring, ideally with a second person, and don't
touch them afterward. If a weight genuinely needs to change, change it openly and re-run the whole
thing — and be suspicious of any change that just happens to flip the result your way.

## Anchoring
**What it is.** The first number/option seen drags all subsequent judgments toward it — the first
option scored becomes the yardstick; a vendor's list price anchors the "fair" price.
**Tell.** Early options cluster at similar scores; later options are judged as "better/worse than the
first" rather than on their own merits.
**Counter.** Score **column by column** (one criterion across all options at once) using an
anchored scale with concrete descriptors, so each cell is judged against a fixed reference, not
against whichever option you saw first.

## Confirmation bias
**What it is.** Seeking and over-weighting evidence that supports the option you like; ignoring or
explaining away evidence against it.
**Tell.** The favored option's weak scores all have a "but actually…" excuse; the disfavored option's
strengths are dismissed as edge cases.
**Counter.** For the *leading* option, deliberately go find the disconfirming evidence and the failure
mode (a mini-premortem). Ask "what would have to be true for this to be the wrong choice?" and check it.

## Halo effect
**What it is.** One salient strength (or the brand/hype of an option) inflates its scores on unrelated
criteria. A tool that's great at X gets generously scored on Y and Z it isn't actually good at.
**Tell.** One option scores uniformly high with little cell-level justification; the scores feel like a
gestalt impression rather than per-criterion evidence.
**Counter.** Require a one-line, evidence-based justification for **every** cell. Score independently
per criterion. A high score with no specific reason is a halo, not a finding.

## Sunk cost / status-quo bias
**What it is.** Favoring the option you've already invested in (time, money, code, identity), or the
current state, because switching *feels* like waste — even when the past investment is irrecoverable
and irrelevant to the forward decision.
**Tell.** "We've already put six months into X" appears as an argument; the status quo isn't scored
on the same terms as the alternatives.
**Counter.** Decide only on **forward** costs and benefits — sunk costs are gone regardless of choice.
Always include the status quo as an explicitly scored option so it competes on the merits, not by
default inertia.

## False precision / over-quantification
**What it is.** Treating small differences in weighted totals as meaningful, or believing that
assigning numbers made the judgment objective. The scores are 1-significant-figure opinions; the
total cannot carry more certainty than its inputs.
**Tell.** "Option B wins, 3.47 to 3.42." A 0.05 gap on a 1–5 scale reported as a verdict.
**Counter.** Always report the **margin** and run the **sensitivity check** (`weighted-decision-matrix.md`).
If the winner sits inside the noise band or flips on a small, defensible re-weight, say "effectively
tied — decide on the trade-off," not "B wins."

## Groupthink / authority anchoring
**What it is.** In a group, weights and scores converge on whatever the most senior or loudest voice
said first; dissent is suppressed.
**Tell.** Suspiciously fast consensus; the weights match the boss's stated preference.
**Counter.** Collect weights and scores **independently first** (silent, written), then compare and
discuss the divergences — the disagreements are the most informative part.

## Quick map: bias → structural counter

| Bias | Structural counter (a workflow step, not willpower) |
|---|---|
| Criteria-fishing | Fix and justify weights before scoring; change them only in the open |
| Anchoring | Anchored 1–5 scale; score column-by-column |
| Confirmation | Actively disconfirm the leading option; premortem |
| Halo | One evidence-based justification per cell; independent per-criterion scoring |
| Sunk cost / status quo | Forward costs only; score the status quo as a real option |
| False precision | Report the margin; always run sensitivity analysis |
| Groupthink | Independent silent scoring first, then reconcile |

The through-line: **make each judgment explicit, evidence-backed, and set before you can see which
answer it produces.** That is what the matrix is for.

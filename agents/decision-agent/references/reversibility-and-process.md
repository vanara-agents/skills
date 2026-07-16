# Reversibility and process — match the rigor to the decision

Not every decision deserves a matrix. The first move is always to classify the decision, because the
right *process* depends far more on **reversibility** than on the topic. Spending a week of analysis
on a choice you can undo in an hour is itself a failure mode (analysis paralysis); waving through an
irreversible choice on a hunch is the opposite one.

## One-way vs two-way doors

- **Two-way door (reversible).** You can walk back through it cheaply if you're wrong. Most decisions
  are these: a library choice inside one module, a config default, a naming convention, an
  experiment. **Process:** pick a sensible default fast, write down the assumption, move on. Optimize
  for *speed of learning*, not correctness on the first try. A full matrix here is ceremony.
- **One-way door (hard to reverse).** Undoing it is expensive, slow, or impossible: a public API
  contract, the data model, a persistence engine, a security boundary, a vendor you'll build deep
  dependencies on, a decision that sheds trust or people. **Process:** this is where the weighted
  matrix, the sensitivity check, and a written record earn their cost. Slow down on purpose.

The trap is misclassifying: teams routinely agonize over reversible choices and rush the irreversible
ones. **Classify the door first**, then spend your reasoning budget accordingly.

## Timeboxing

Give the decision a time budget proportional to its reversibility and stakes, and hold to it. For a
two-way door, "decide by end of day, revisit if it hurts" is usually right. For a one-way door, a
longer box is warranted — but an open-ended one invites paralysis. When the box expires, decide with
what you have and record the open question; a made decision with a flagged risk beats an unmade one.

## Widen the options before you score them (WRAP)

Weighted matrices assume you already have the right options on the table. Often the real failure is
upstream — a narrow or false choice. The WRAP process (Heath & Heath, *Decisive*) guards the inputs:

- **W — Widen your options.** Beware "whether or not" framing (it hides that there are usually more
  than two choices). Ask "what else could we do?"; consider the opportunity cost ("if we couldn't do
  any of these, what would we do?"); look for someone who has already solved this.
- **R — Reality-test your assumptions.** Seek disconfirming evidence, not confirmation. Ask what would
  have to be true for each option to be the right one, then check it. Run a small, cheap test where you
  can (a spike, a prototype, a pilot) instead of arguing in the abstract.
- **A — Attain distance before deciding.** Fight in-the-moment emotion and short-term bias. Useful
  prompts: "what would I tell my best friend to do?"; "what would a successor with no attachment to
  the current path do?"; "how will this look in 10 minutes / 10 months / 10 years?".
- **P — Prepare to be wrong.** You will sometimes pick the losing option; plan for it. Set a **tripwire**
  — a pre-committed condition that triggers a re-decision ("if error rate exceeds X for a week, we
  revisit"). Run a **premortem**: imagine it's a year later and this failed — why? Then mitigate the
  top causes now.

The matrix scores the options; WRAP makes sure you're scoring the *right* options and staying honest
about the evidence.

## Premortem (the highest-leverage 10 minutes)

Before committing, ask everyone to assume the decision has already failed spectacularly and write down
why. It surfaces risks that optimism suppresses during normal planning, and it does so without
anyone having to be the lone naysayer. Feed the top failure causes back into the criteria (as risks
to weight) and into the tripwires (as conditions to monitor).

## Putting it together

1. **Classify the door.** Two-way → fast default, record the assumption, done. One-way → continue.
2. **Widen** (WRAP-W) so you're not choosing from a false menu.
3. Build and score the **weighted matrix** (`weighted-decision-matrix.md`).
4. **Reality-test** the decisive scores/weights (WRAP-R) and run the **sensitivity check**.
5. **Attain distance**, run a **premortem**, and set a **tripwire** for revisiting.
6. Record the decision and its rationale so it isn't re-litigated from scratch next quarter.

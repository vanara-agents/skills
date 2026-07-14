# Diátaxis and the four doc types

Diátaxis splits documentation into four modes along two axes: **practical vs theoretical** (doing vs
knowing) and **study vs work** (acquiring skill vs applying it). Each mode answers a different reader
question. Mixing them is the single most common documentation failure.

## The four quadrants

| Type | Reader's question | Mode | Posture |
|---|---|---|---|
| **Tutorial** | "Teach me, I'm new." | learning / doing | Hand-holding, linear, builds confidence |
| **How-to guide** | "Help me do X." | working / doing | Goal-first, assumes competence |
| **Reference** | "What is the exact behavior of Y?" | working / knowing | Dry, exhaustive, consistent |
| **Explanation** | "Why does it work this way?" | learning / knowing | Discursive, gives context and trade-offs |

## Decision table

Pick the type from the reader's *intent*, not the subject matter:

| If the reader wants to… | Write a… |
|---|---|
| Get a first win and learn by doing | Tutorial |
| Accomplish a specific, known task | How-to guide |
| Look up a flag, field, signature, or value | Reference |
| Understand a concept, decision, or trade-off | Explanation |

## Tell-tale signs of a blended (broken) doc

- A "getting started" page that pauses to enumerate every config option → tutorial leaking into reference.
- A how-to that stops to explain the underlying theory → how-to leaking into explanation. Link instead.
- A reference page with a friendly narrative arc → reference leaking into tutorial. References are lookup
  tables, not stories.
- An explanation page with copy-paste steps → split the steps into a how-to.

## Per-type skeletons

**Tutorial** — linear, every step succeeds, no choices to make:
1. Promise a concrete outcome ("by the end you'll have a running X").
2. List prerequisites once, up front.
3. Numbered steps, each producing visible progress.
4. Show expected output after each meaningful step.
5. End with what they built and where to go next.

**How-to guide** — goal-first, assumes competence (see `examples/how-to-example.md`):
- One-line goal → prerequisites → steps → verify → rollback/troubleshooting.

**Reference** — exhaustive and *consistent* (see `examples/reference-example.md`):
- Every entry uses the same structure (name, type, default, description, example).
- Alphabetical or grouped, never narrative. Optimized for scanning and `Ctrl-F`.

**Explanation** — discursive, makes trade-offs explicit:
- State the question, give context, walk through alternatives, explain why this choice, note the costs.
- No step lists; this is prose for understanding, not doing.

## Cross-linking strategy

Keep each doc single-purpose and connect them:
- Tutorials link *out* to how-tos and references for "more detail."
- How-tos link to explanations for "why," and to references for exact values.
- References link to explanations for concepts and to how-tos for tasks.
- Explanations link to how-tos so a convinced reader can act.

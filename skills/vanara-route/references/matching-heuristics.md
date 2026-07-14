# Matching heuristics — scoring an agent against a task

The router's job is to map a task to the installed agent whose *stated purpose* fits best.
The signal is each agent's `description` frontmatter — agents are authored to declare exactly
when they should be used. Score on three axes, then combine.

## The three axes

| Axis | Question | Strong signal | Weak / no signal |
|---|---|---|---|
| **Domain** | Is the task in this agent's field? | task nouns match the agent's domain (schema → database, WCAG → accessibility) | domain is adjacent but not the same |
| **Verb** | Does the agent *do* the needed action? | review↔reviewer, write↔author, audit↔auditor, plan↔planner | agent only reads when the task needs writing |
| **Trigger** | Does the description name this situation? | "Use PROACTIVELY when \<exactly this\>" | generic description with no trigger |

Confidence = **strong** only when Domain and Verb both match. Domain-only or Verb-only is
**partial**. Neither is **none**.

## Worked examples

- *"add pagination to the orders endpoint"* → `api-designer` **partial** (domain match, but it
  advises rather than implements) + `feature-builder` **strong** (writes the code). Route to
  `feature-builder`; mention `api-designer` for the contract if the user wants review.
- *"is this dependency bump safe?"* → `dependency-upgrader` **strong**. One clear owner.
- *"our SOC 2 auditor asked for an access-review policy"* → `compliance-auditor` **strong**.
- *"make the game's boss fight less frustrating"* → `game-systems-designer` **strong** (design),
  `game-developer` **partial** (implements once the design is decided).

## Anti-patterns

- **Keyword collision:** the word "review" appears in many descriptions — confirm the *domain*
  too before routing a security task to a code reviewer.
- **One agent for an orchestration job:** "fix the failing build and stop it regressing" is
  reproduce → test → patch → review. Prefer an installed orchestrator pack over a lone agent.
- **Forcing a fit:** a partial match on a real, consequential task is a reason to ask the user,
  or to log a gap — not to run the wrong specialist and hope.

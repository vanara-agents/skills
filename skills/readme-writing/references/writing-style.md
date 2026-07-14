# README Writing Style — Voice, Scannability, Badges

A README is a document people *skim under time pressure*. The writing has to survive that. This is the
style reference: how to phrase things, what to cut, and how to format for the eye.

## Voice

- **Second person, present tense, active voice.** "Run `forge audit`" not "The audit can be run by the
  user." Direct instructions are faster to act on.
- **Concrete over abstract.** "Audits a project in under two seconds" beats "blazingly fast". If you
  have a number, use it; if you don't, describe the capability, not its adjective.
- **Confident but not salesy.** State what it does. You're documenting, not pitching.

## Filler phrases to cut

These add length and subtract information. Delete on sight:

| Cut this | Why |
|---|---|
| "Welcome to..." | Wastes the most-read line on a greeting |
| "powerful, flexible, robust, modern" | Unfalsifiable adjective soup — say *what* it does |
| "simply", "just", "easy" | Condescending and often untrue for the reader |
| "blazing-fast", "lightning-fast" | A benchmark number is credible; an adjective isn't |
| "enterprise-grade", "production-ready" | Meaningless without evidence (tests, SLAs, users) |
| "as you can see", "obviously", "of course" | If it's obvious, don't say it; if it's not, it's rude |
| "in order to" | "to" is shorter and identical in meaning |

## Scannability techniques

- **Headings as signposts.** A reader scrolls and reads only headings until one matches their goal.
  Make headings describe content (`## Configuration`), not be cute (`## The knobs`).
- **Tables for structured data.** Anything that's "X has property Y with default Z" is a table, not a
  paragraph. Options, flags, comparisons, env vars.
- **Fenced code blocks with a language.** Always tag the fence (` ```bash `, ` ```js `) so syntax
  highlighting kicks in and the reader can tell commands from output.
- **Short paragraphs, one idea each.** Three sentences max. White space is a feature.
- **Bold the load-bearing word** in a bullet so the eye catches it while scanning.
- **Lists over comma-runs.** Three or more parallel items become a bulleted list.

## Code block discipline

- Show **expected output** alongside commands, as comments or a following block. A command with no
  visible result is an unverifiable claim.
- Keep examples **minimal and runnable** — no `...` placeholders in a block you're telling people to
  paste. If you must elide, make it obvious and non-pasteable.
- Use **realistic values**, not `foo`/`bar`, where a realistic value teaches something.

## Badges, done right

Badges are a glanceable health dashboard. The high-signal set:

- **Build / CI status** — is the main branch green?
- **Version** — npm/PyPI/crates.io published version.
- **License** — at a glance, can I use it?
- **Coverage** — optional, only if it's genuinely good and maintained.

Keep them on one line, near the title. A wall of fifteen badges (downloads-this-week, Discord, Twitter,
sponsors, code style, dependencies, ...) is noise that pushes your description below the fold. Shields.io
generates consistent ones.

## Links, not inlining

The README is a launchpad. When a topic needs more than a screen, write a short summary and **link out**:

- Deep configuration → `docs/configuration.md` or a hosted docs site
- Full API → generated reference (TypeDoc, rustdoc, Sphinx)
- Contribution details → `CONTRIBUTING.md`
- Version history → `CHANGELOG.md`

This keeps the README scannable and the deep content in a place where it can be versioned and generated
without bloating the front door.

## Accessibility and rendering

- Give images **alt text** (`![alt](url)`) — screen readers and broken-image fallbacks rely on it.
- Don't encode meaning in **color alone** (e.g. a red/green badge); the text label must carry it too.
- Prefer **relative links** to in-repo files (`./LICENSE`) so they work on forks and mirrors.
- Test the rendered Markdown on the host (GitHub/GitLab) — not every renderer supports the same
  extensions (collapsible `<details>`, task lists, footnotes).

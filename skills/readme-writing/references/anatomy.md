# README Anatomy — Section by Section

A complete README is built from a known set of sections. Below is each one: its job, what to put in it,
and what to leave out. Order matters — readers consume top to bottom and bail early, so the highest-value
content goes first.

## 1. Title and one-line description

- **Job:** answer "what is this and is it for me?" in under ten seconds.
- **Do:** the project name as an `# H1`, then a single sentence naming the category and the payoff.
- **Don't:** "Welcome to", a logo before the name, or a tagline so abstract it could describe anything.

```markdown
# Forge

A self-improving maker/checker loop for building and maintaining AI agents and skills.
```

## 2. Badges

- **Job:** a health signal scanned in a glance — is it maintained, does it build, what license.
- **Do:** build/CI status, package version, license, test coverage. Keep to one row.
- **Don't:** twenty badges. A badge wall is noise and pushes the description below the fold.

## 3. Why / value (and a visual)

- **Job:** convince the skimmer this solves their problem.
- **Do:** name the problem, then the result. For visual or interactive tools, a screenshot or GIF here
  is worth a thousand words. For libraries, a tiny before/after code example.
- **Don't:** a history of the project, your motivation, or a manifesto. Save it for `docs/`.

## 4. Install

- **Job:** get the dependency in place with zero ambiguity.
- **Do:** the exact command(s) for the primary install path. State prerequisites (runtime version,
  system deps) immediately above it.
- **Don't:** five package managers and three OSes inline. Pick the primary, link the matrix.

```markdown
## Install

Requires Node 20+.

\`\`\`bash
npm install forge
\`\`\`
```

## 5. Quickstart / Usage

- **Job:** prove it works and teach the happy path.
- **Do:** the smallest end-to-end example that produces a visible result, with expected output shown.
  Then a few common-task examples.
- **Don't:** an exhaustive API dump. Link to generated reference docs for that.

## 6. Configuration

- **Job:** make options discoverable without reading source.
- **Do:** a table of options, env vars, and defaults. Tables scan far better than prose here.

```markdown
| Option | Env var | Default | Description |
|---|---|---|---|
| `target` | `FORGE_TARGET` | `.` | Directory to audit |
| `depth` | `FORGE_DEPTH` | `3` | Max recursion depth |
```

## 7. Contributing

- **Job:** lower the barrier for the next contributor.
- **Do:** dev setup commands, how to run tests, and a link to `CONTRIBUTING.md` for the full flow.
- **Don't:** paste the entire code-of-conduct and PR checklist inline. Link them.

## 8. License

- **Job:** tell people whether they can legally use it. A repo with no license is all-rights-reserved.
- **Do:** the SPDX identifier (e.g. `MIT`, `Apache-2.0`) and a link to the `LICENSE` file.

```markdown
## License

[MIT](./LICENSE) © 2026 Acme
```

## Optional sections (use when relevant)

| Section | Add when |
|---|---|
| Table of contents | The README is long enough to need in-page navigation (keep it collapsed) |
| Features | The value isn't obvious from one line and benefits from a bulleted list |
| Architecture | Contributors need a mental map; otherwise link to `docs/architecture.md` |
| FAQ / Troubleshooting | There are recurring support questions worth pre-empting |
| Roadmap | The project is early and you want to set expectations |
| Acknowledgements / Credits | You're standing on others' work and want to credit it |

## Tailoring by project type

| Type | Lead with | Emphasize | De-emphasize |
|---|---|---|---|
| **Library** | a code snippet using it | install + import + usage | CLI, screenshots |
| **CLI tool** | the primary command | flags table, examples | import-as-module API |
| **Service / API** | what it serves + a curl example | run/deploy, config, endpoints | language-level API |
| **Framework** | a "hello world" | concepts, links to a docs site | exhaustive reference inline |
| **App / end-user** | a screenshot or GIF | how to install and run | code internals |

The rule across all of them: **lead with the thing the reader most wants to do**, and move everything
else to its right place — usually a linked doc.

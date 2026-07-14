<div align="center">

<img src="assets/vanara.png" width="140" alt="Vanara — the coding vanara mascot" />

# Vanara

**🐒 Free agents, skills & packs for Claude Code**

*One subscription. An army of Claude Code agents.*

[![npm](https://img.shields.io/npm/v/vanara?color=FFB000&labelColor=0E0B06)](https://www.npmjs.com/package/vanara)
[![license](https://img.shields.io/badge/license-Apache--2.0-FFB000?labelColor=0E0B06)](LICENSE)
[![catalog](https://img.shields.io/badge/full_catalog-206_items-FFB000?labelColor=0E0B06)](https://vanaraagents.com)
[![checks](https://img.shields.io/badge/verification_checks-163%2F163_passing-FFB000?labelColor=0E0B06)](https://vanaraagents.com)

**[Website](https://vanaraagents.com)** · **[Browse the catalog](https://vanaraagents.com/agents)** · **[Getting started](https://vanaraagents.com/start)** · **[npm](https://www.npmjs.com/package/vanara)** · **[X](https://x.com/VanaraAgents)**

</div>

---

**29 production-grade agents, skills, and packs for [Claude Code](https://claude.com/claude-code) — free, Apache-2.0, install with one command.** This is the open free tier of the [Vanara catalog](https://vanaraagents.com) (206 items total).

```bash
npx vanara install code-reviewer     # one agent
npx vanara install security-pack     # a pack — expands to all its members
npx vanara doctor                    # scans your repo, tells you what's worth installing
```

Items land in your project's `.claude/` directory and Claude Code picks them up automatically. They run on the Claude subscription you already have — **no API keys, nothing metered**.

## Why these aren't one-file prompt dumps

Every item here is a packaged directory, not a single markdown file:

- **`references/`** — deep, focused reference docs the agent actually reads while working
- **`examples/`** — worked examples of the output it should produce
- **`scripts/`** — runnable verification checks; a deterministic evals runner keeps the ✓ marks below honest
- **Memory** — agents write lessons to `.claude/memory/` as they work your codebase and get sharper over time; commit that folder and your team inherits what one agent learned
- **Orchestration** — the included [`vanara-orchestrate`](skills/vanara-orchestrate) skill chains agents into gated pipelines (reproduce → test → patch → review → commit) where nothing advances past a failed gate

## What's in the free tier

✓ = ships runnable verification checks, currently passing.

### Agents (10)

| Item | What it does |
|---|---|
| [`api-designer`](agents/api-designer) | For when designing a new HTTP/GraphQL API or changing an existing one — modeling resources, defining endpoint contracts, choosing status… ✓ |
| [`code-reviewer`](agents/code-reviewer) | Runs immediately after writing or modifying code, and before any commit to a shared branch. ✓ |
| [`debugger`](agents/debugger) | Hypothesis-driven debugging specialist. ✓ |
| [`pr-summarizer`](agents/pr-summarizer) | Runs after a pull request is opened (or updated) to produce a concise, reviewer-friendly summary of the change, its risk areas,… ✓ |
| [`refactoring-specialist`](agents/refactoring-specialist) | For when code is hard to change, duplicated, deeply nested, or accumulating tech debt and you want it restructured for clarity WITHOUT… ✓ |
| [`security-auditor`](agents/security-auditor) | Runs before commits/merges and whenever code touches auth, user input, secrets, file paths, DB queries, deserialization, or… ✓ |
| [`technical-writer`](agents/technical-writer) | For when documentation is needed for a feature, tool, API, or system — READMEs, tutorials, how-to guides, references, or… ✓ |
| [`test-author`](agents/test-author) | For when adding a feature or fixing a bug — writes tests FIRST (TDD red-green-refactor). ✓ |
| [`threat-modeler`](agents/threat-modeler) | For when designing a new system or feature, or assessing the attack surface of an existing one. ✓ |
| [`vuln-scanner`](agents/vuln-scanner) | For when scanning a project's dependencies, source, config, and container images for known vulnerabilities (CVEs), risky versions, and… ✓ |

### Skills (17)

| Item | What it does |
|---|---|
| [`api-pagination`](skills/api-pagination) | Implement correct, fast API pagination — cursor vs offset trade-offs, opaque cursor encoding, stable sort keys, page-size limits,… ✓ |
| [`caching-strategies`](skills/caching-strategies) | Deep reference for caching — what to cache, cache-aside vs read/write-through/write-behind, TTLs with jitter, eviction (LRU/LFU/FIFO),… ✓ |
| [`conventional-commits`](skills/conventional-commits) | Write Conventional Commits — the type(scope)!: subject + body + footer spec — so history is readable and changelogs and SemVer bumps can be… ✓ |
| [`database-migrations`](skills/database-migrations) | How to write safe, reversible, zero-downtime database schema migrations — additive-first changes, the expand/migrate/contract pattern,… ✓ |
| [`error-handling-patterns`](skills/error-handling-patterns) | How to handle errors explicitly and consistently across an app — validate at boundaries, classify operational vs programmer errors, add… ✓ |
| [`git-collaboration-workflows`](skills/git-collaboration-workflows) | Run git collaboration that scales — trunk-based vs git-flow decided by deploy cadence, branch protection and required checks, PR sizing and… ✓ |
| [`owasp-top10`](skills/owasp-top10) | A deep prevention reference for the OWASP Top 10 web risks — broken access control, injection, crypto failures, insecure design, SSRF and… ✓ |
| [`prompt-engineering`](skills/prompt-engineering) | A deep, practical guide to engineering reliable LLM prompts — role/context, instructions, few-shot, structured output, chain-of-thought,… ✓ |
| [`readme-writing`](skills/readme-writing) | How to write a README that gets a project understood and running fast — lead with what/why, a 60-second quickstart, then usage, config,… ✓ |
| [`refactoring-patterns`](skills/refactoring-patterns) | Improve code structure without changing behavior — the discipline of small, named, test-backed moves. ✓ |
| [`rest-api-design`](skills/rest-api-design) | Conventions for designing clean, consistent, evolvable REST APIs — resource modeling, HTTP semantics, status codes, pagination, filtering,… ✓ |
| [`secrets-management`](skills/secrets-management) | Handle secrets safely across the lifecycle — keep them out of source, load from env or a secret manager, scope to least privilege, encrypt… ✓ |
| [`secure-auth`](skills/secure-auth) | Implement authentication securely — authentication vs authorization, password hashing (argon2id/bcrypt), sessions vs JWT (storage, expiry,… ✓ |
| [`sql-index-tuning`](skills/sql-index-tuning) | Diagnose slow SQL queries and add the right indexes without over-indexing — B-tree mechanics, composite ordering (equality-before-range),… ✓ |
| [`test-plan-design`](skills/test-plan-design) | How to design a test plan — scope and risk-based prioritization, the test pyramid, case-design techniques (equivalence partitioning,… ✓ |
| [`vanara-orchestrate`](skills/vanara-orchestrate) | Run a goal end-to-end as a gated pipeline of specialist agents — reproduce → test → patch → review → commit — where nothing advances past a… ✓ |
| [`vanara-route`](skills/vanara-route) | Given a task, find the best-fit installed Vanara agent and run it. ✓ |

### Packs (2)

| Item | What it does |
|---|---|
| [`code-review-pack`](packs/code-review-pack) | Review pull requests faster and better — automated first-pass review, PR summaries reviewers can trust, healthy git workflow settings,… |
| [`security-pack`](packs/security-pack) | Build and ship secure software — threat modeling at design time, OWASP code audits, dependency/secret scanning, and secure auth and secrets… |

## Manual install (no CLI)

Every item is plain files in the Claude Code layout — copy them in directly if you prefer:

```bash
# an agent: one .md (plus its support folder) into .claude/agents/
cp -r agents/code-reviewer/AGENT.md your-project/.claude/agents/code-reviewer.md

# a skill: the whole directory into .claude/skills/
cp -r skills/rest-api-design your-project/.claude/skills/
```

The [`vanara` CLI](https://www.npmjs.com/package/vanara) just automates this, tracks versions in `.vanara.json`, and adds `doctor`, `update`, `report`, and `memory` on top.

## The full catalog

This repo is 29 of **206 items** — the rest (63 more agents, 80 more skills, 34 more packs, across 28 fields) are in [Vanara Pro](https://vanaraagents.com) at $10/mo: one subscription, everything installable, continuous updates, same no-API-keys model.

```bash
npx vanara list            # browse everything
npx vanara unlock <key>    # after subscribing at vanaraagents.com
```

## Contributing & requests

Missing a specialist? Log it in one line — it goes on the roadmap:

```bash
npx vanara request "a Kafka consumer-lag alerting agent"
```

Issues and PRs to the free-tier items are welcome. Item format is documented inline (frontmatter + `references/` + `examples/` + `scripts/`).

## License

[Apache-2.0](LICENSE) — these 29 items are free to use, modify, and redistribute. The premium catalog is licensed separately.

---

<div align="center">
<sub>🐒 <b>VANARA</b> — the agent army for Claude Code · <a href="https://vanaraagents.com">vanaraagents.com</a> · <a href="https://x.com/VanaraAgents">@VanaraAgents</a> · © 2026 Vanara Agents</sub>
</div>

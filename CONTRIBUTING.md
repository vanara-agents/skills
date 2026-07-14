# Contributing

Contributions to the free tier are welcome — improvements, fixes, examples, and new verification checks.

## How this repo relates to the catalog

This repo mirrors the free tier of the [Vanara catalog](https://vanaraagents.com). Accepted changes are upstreamed into the catalog source (where every item runs through depth gates and the evals runner) and flow back here — that keeps the published items and the `npx vanara install` versions identical. Practically: open your PR here, and once merged your change ships in both places.

## What makes a good PR

- **Sharpen an item**: better reference docs, a missing edge case, a clearer worked example
- **Add a runnable check**: every item ships `scripts/` that verify its machinery — more coverage is always welcome
- **Fix an error**: factual mistakes, broken commands, stale API usage

## Item anatomy

Every item is a packaged directory, not a single prompt file:

```
<item-name>/
├── AGENT.md | SKILL.md | PACK.md   # frontmatter (name, description, version) + the core doc
├── references/                     # deep, focused reference docs the agent reads while working
├── examples/                       # worked examples of the output it should produce
└── scripts/                        # runnable verification checks (node, zero deps)
```

Conventions:

- Scripts must run with plain `node` and no dependencies; include a `--selftest` where it makes sense
- **Never include live-format secrets** — even fake examples must be defanged (truncated or runtime-concatenated). GitHub push protection enforces this; see `agents/security-auditor/scripts/scan-secrets.mjs` for the pattern
- Match the voice of the item you're editing: direct, specific, no filler
- One item per PR

## Requesting a new agent or skill

Two ways, both reach the same backlog:

- Open an [item request issue](https://github.com/vanara-agents/skills/issues/new?template=request-item.yml)
- Or from the CLI: `npx vanara request "a Kafka consumer-lag alerting agent"`

## Customizing items for your own stack

You don't need a PR for that — items are plain files, fork away. See [CUSTOMIZING.md](CUSTOMIZING.md) for the 2-minute walkthrough.

## License

By contributing you agree your contribution is licensed under [Apache-2.0](LICENSE), same as the repo.

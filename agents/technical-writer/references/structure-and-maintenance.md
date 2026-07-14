# Structure and maintenance

Individual docs must be clear; the *set* of docs must be navigable and must not rot. This reference covers
information architecture and keeping documentation alive.

## Information architecture

Organize the documentation set around the four Diátaxis types and the reader's journey, not around the
codebase's module layout:

```text
docs/
├── tutorials/        # learning-oriented, linear
│   └── getting-started.md
├── how-to/           # task-oriented
│   ├── rotate-signing-key.md
│   └── configure-timeouts.md
├── reference/        # lookup-oriented, exhaustive
│   ├── cli.md
│   └── config.md
└── explanation/      # understanding-oriented
    └── why-cursor-pagination.md
```

- A reader who knows their *intent* should land in the right folder immediately.
- Name files by the reader's task ("rotate-signing-key"), not the implementation ("key-service-internals").

## Linking

- Link generously between types (tutorial → how-to → reference → explanation), but never inline another
  type's full content. A link keeps each page single-purpose.
- Use descriptive link text ("see the CLI reference"), never "click here."
- Keep a single entry point (an index/README) that routes by reader intent.

## Keeping docs from rotting

Documentation rots when it duplicates a source of truth that changes without it. Defenses, in order of
preference:

1. **Generate from source.** CLI help, config schemas, API specs, and route tables should be generated
   (or extracted) so they can't drift. Pair with the `update-docs` skill.
2. **Link to source.** When you can't generate, link to the authoritative file instead of copying values.
3. **Single source per fact.** A given default/flag/limit is documented in exactly one place; everything
   else links to it.
4. **Date and version.** Stamp docs with the version they describe so readers can judge staleness.

## Review and verification cadence

- Re-run every example when the documented surface changes (a flag rename, a new required arg).
- Treat a failed copy-paste as a P1 doc bug — it destroys trust instantly.
- On each release, diff the changelog against the docs: any user-visible change needs a doc change.

## Anti-patterns

- **Docs as a dumping ground:** an "FAQ" or "notes" page that accumulates everything no one filed properly.
- **Mirror-the-code structure:** folders named after services, so readers must understand the architecture
  to find a task.
- **Copy-pasted constants:** the same timeout value written in five guides; change one, the rest lie.
- **Orphan pages:** docs with no inbound links, found only by search, never maintained.

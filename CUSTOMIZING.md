# Customize an agent for your stack — in about 2 minutes

Every Vanara item is plain markdown in the open Claude Code format. That means any agent here is a **template** for your own specialist. No build step, no SDK — copy, rename, sharpen.

## The 2-minute version

Say you want a **Next.js-specific reviewer** built from `code-reviewer`:

```bash
# 1. Start from the installed agent (or copy from this repo)
npx vanara install code-reviewer
cd your-project

# 2. Copy it under a new name
cp .claude/agents/code-reviewer.md .claude/agents/nextjs-reviewer.md
```

Then edit `.claude/agents/nextjs-reviewer.md`:

```markdown
---
name: nextjs-reviewer                     # 3. rename
description: Use PROACTIVELY on changes to a Next.js App Router codebase —
  server/client component boundaries, "use client" placement, RSC data flow,
  route handlers, and hydration pitfalls, plus everything a code review checks.
---
```

4. Add your stack's rules to the body — the highest-leverage section is the checklist. For a Next.js variant you'd add things like:

```markdown
## Next.js-specific review points
- "use client" only where state/effects/browser APIs demand it; check for
  server-only imports leaking into client components
- Data fetching in Server Components, not useEffect
- Route handlers validate input at the boundary (they're public API)
- next/image with explicit dimensions; no <img> for LCP-critical media
```

5. Open Claude Code. Your agent is live — Claude picks it up from `.claude/agents/` automatically.

## Sharper variants: keep the support files

Agents in this repo ship `references/`, `examples/`, and `scripts/`. When you copy the whole directory (not just the `.md`), your variant inherits the deep material:

```bash
cp -r agents/code-reviewer .claude/agents/nextjs-reviewer
# then rename the main file's frontmatter as above
```

Edit or add reference files for your stack — e.g. drop in a `references/nextjs-pitfalls.md` with your team's hard-won rules. The agent reads them while working.

## Things worth customizing first

| Base item | Easy high-value variants |
|---|---|
| `code-reviewer` | nextjs-reviewer, django-reviewer, terraform-reviewer, monorepo-reviewer |
| `test-author` | your test framework's conventions, fixtures policy, coverage gates |
| `security-auditor` | your threat model: multi-tenant SaaS, PCI scope, internal tools |
| `api-designer` | your API house style: envelope shape, versioning rule, auth model |
| `technical-writer` | your docs voice, required sections, terminology |

## Memory makes your variant compound

Your customized agent writes lessons to `.claude/memory/<agent>.md` as it works your repo. Commit that folder — the variant gets sharper with use, and your whole team inherits it.

## Share it back (optional)

Built a variant others would want? Open a PR or an [item request](https://github.com/vanara-agents/skills/issues/new?template=request-item.yml) describing it — the best ones get productized into the catalog with full references and verification checks.

# Stack-specific reviewer variants

Ready-to-use agent templates built from the free [`code-reviewer`](../../agents/code-reviewer)
base, per the [2-minute customization guide](../../CUSTOMIZING.md). Each is a complete
`.claude/agents/` file — install with one command and Claude Code picks it up automatically:

```bash
curl -o .claude/agents/nextjs-reviewer.md \
  https://raw.githubusercontent.com/vanara-agents/skills/main/examples/variants/nextjs-reviewer.md
```

| Variant | Reviews for | Maintained deep version |
|---|---|---|
| [`nextjs-reviewer`](nextjs-reviewer.md) | Server/client boundaries, Server Actions, caching semantics, hydration | `react-reviewer` + `typescript-reviewer` ([catalog](https://vanaraagents.com)) |
| [`django-reviewer`](django-reviewer.md) | Object-level auth, N+1, migration locks, serializer validation | `django-reviewer` ([catalog](https://vanaraagents.com)) |
| [`terraform-reviewer`](terraform-reviewer.md) | Blast radius, state/secrets, IAM scope, pinning | `devops-cloud-pack` ([catalog](https://vanaraagents.com)) |
| [`kubernetes-reviewer`](kubernetes-reviewer.md) | Probes, securityContext, rollout strategy, PDBs, RBAC | `kubernetes-manifests` + `devops-cloud-pack` ([catalog](https://vanaraagents.com)) |
| [`rails-reviewer`](rails-reviewer.md) | Strong params, callbacks, safe migrations, job idempotency | catalog backend items ([catalog](https://vanaraagents.com)) |

**What these are:** community templates — genuinely usable as-is, and honest about their
limits: they carry the stack checklist but not the `references/`, worked `examples/`, or
runnable verification checks that maintained catalog items ship with.

**Want one for your stack?** Copy any of these and swap the checklist (that's the whole
method — see [CUSTOMIZING.md](../../CUSTOMIZING.md)), or
[request it](https://github.com/vanara-agents/skills/issues/new?template=request-item.yml)
and it may get productized with full depth.

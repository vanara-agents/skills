# Data-Flow Diagrams and Trust Boundaries

A threat model is only as good as the diagram it sits on. The data-flow diagram (DFD) is the map; trust
boundaries are where the dangerous neighborhoods are. Build the diagram first, then hunt threats along
the boundaries.

## The four element types

Every DFD is built from exactly four kinds of element. Keep them distinct — the element type determines
which STRIDE categories apply (see `stride-method.md`).

| Element | What it is | Notation here |
|---|---|---|
| **External entity** | An actor outside your control: a user, a browser, a third-party API | `(E1) Browser` |
| **Process** | Code that transforms data: a service, a Lambda, a function | `(P2) Auth Service` |
| **Data store** | Where data rests: a DB, cache, queue, bucket, file | `(DS3) User DB` |
| **Data flow** | Data in motion between two elements | `──1: HTTPS POST──►` |

Number every element and every flow. Threat IDs reference these numbers, which is what makes the model
auditable: anyone can check that flow 4 has been considered.

## What a trust boundary is

A trust boundary is any line where the level of trust changes — where data or control passes from a
less-trusted zone into a more-trusted one. Threats concentrate here because this is where an attacker on
the outside tries to influence the inside.

Draw a boundary at:

- **Network edges** — Internet → DMZ → internal network.
- **Privilege changes** — unauthenticated → authenticated; user → admin; user-space → kernel.
- **Ownership changes** — your service → a third-party API; first-party → vendor SDK.
- **Process/host edges** — browser → server; container → host; tenant A → tenant B in multi-tenancy.
- **Data sensitivity changes** — public data → PII/PCI/PHI store.

The classic mistake is drawing too few boundaries. A monolith still has a boundary between the
unauthenticated request handler and the authenticated business logic.

## Text notation

Render the DFD as text so it lives in version control next to the design and diffs cleanly. The
convention used across this package:

```text
TRUST BOUNDARY: <less trusted>  ││  <more trusted>

  (E1) Entity ──N: flow label──►││──► (Pn) Process ──M: flow──►││──► (DSn) Store
  Legend: (E)=external entity (P)=process (DS)=data store
          N: numbered data flow   ││ = trust boundary crossing
```

- `││` marks each point where a flow crosses a boundary. A flow with no `││` stays inside one trust zone.
- Keep labels verb-or-protocol oriented (`HTTPS POST /login`, `SQL query`, `publish to queue`) so the
  reader knows what crosses.

## Reading threats off the diagram

Once boundaries are marked, the highest-value work is mechanical:

1. **List every flow that crosses a `││`.** These are your priority targets.
2. For each crossing flow, the **destination process** is where untrusted input lands — apply Tampering,
   Information disclosure, DoS, and Elevation of privilege there.
3. For each **data store**, ask what happens if the flow writing to it is malicious (Tampering) or the
   store leaks (Information disclosure).
4. For each **external entity**, ask how it's authenticated (Spoofing) and whether its actions are
   logged (Repudiation).

## Common diagram mistakes

- **Missing the return flow.** Responses cross boundaries too and can leak data (Information disclosure).
- **Collapsing distinct stores.** "The database" might be a user table, a session cache, and an audit log
  with very different sensitivity — model them separately.
- **Hiding third parties.** A payment processor or auth provider is an external entity behind a trust
  boundary; its compromise or outage is in scope.
- **No boundary inside the server.** Authenticated vs. unauthenticated handlers, or user vs. admin paths,
  are boundaries even on one host.

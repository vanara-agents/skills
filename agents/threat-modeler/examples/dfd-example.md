# DFD Example — Annotated

A standalone data-flow diagram with its trust boundaries explained, to illustrate the notation before you
build your own. The system: a file-upload feature where users upload documents that a worker processes.

## The diagram

```text
TRUST BOUNDARY A: Internet  ││  App tier        TRUST BOUNDARY B: App tier  ┊┊  Worker tier

  (E1) User ──1: HTTPS PUT /files (JWT)──►││──► (P2) Upload API ──2: store object──►││──► (DS3) Object Store
                                         ││          │                            ││
                                         ││          └──3: enqueue job────────────►││──► (DS4) Job Queue
                                         ││                                        ┊┊
                                        ││                       (P5) Worker ◄──4: dequeue──┊┊── (DS4) Job Queue
                                         ││                            │
                                         ││                            └──5: read object──► (DS3) Object Store
                                         ││                            │
                                         ││                            └──6: write result──► (DS6) Results DB

  Legend: (E)=external entity (P)=process (DS)=data store
          N: numbered data flow   ││ = network/privilege boundary   ┊┊ = process/tier boundary
```

## Why the boundaries are where they are

- **Boundary A (Internet → App tier):** flow 1 carries untrusted, attacker-controllable input — the file
  bytes, the filename, the content-type header, and the JWT. Everything arriving here must be
  authenticated (Spoofing), authorized (Elevation of privilege), and validated (Tampering). This is the
  single most important boundary in the system.
- **Boundary B (App tier → Worker tier):** the job queue is a *trust boundary even though it's internal*.
  The worker (P5) consumes whatever the Upload API enqueued plus the object it stored. If an attacker can
  influence the filename or object contents, the worker is processing attacker-controlled data — so
  parsing in P5 (think: image/PDF/zip parsers) is a prime Tampering and Elevation-of-privilege target,
  even though no public flow touches the worker directly.

## Threats that fall out of this diagram

Reading along the crossing flows:

- **Flow 1 → P2:** unrestricted file upload (a `.php`/`.svg` masquerading as an image) → Elevation of
  privilege / stored XSS. Path traversal in the filename → Tampering of the object store.
- **DS3 Object Store:** public-readable bucket → Information disclosure of other users' files.
  Missing ownership check on later retrieval → IDOR (Elevation of privilege).
- **Flow 4 → P5:** a malicious file enqueued earlier is parsed by the worker → memory-corruption or
  decompression-bomb DoS in the parser. The worker often runs with more privileges than the API — a
  parser exploit here is high impact.
- **DS6 Results DB:** if results include rendered user content, stored XSS can resurface when displayed.

## Takeaways

1. Internal queues and worker tiers are still behind trust boundaries — model them.
2. The most dangerous element is often not the public API but the *background process* that parses what
   the public API accepted.
3. Number flows so the threat table can reference them unambiguously (e.g. "T-flow1-E", "T-flow4-T").

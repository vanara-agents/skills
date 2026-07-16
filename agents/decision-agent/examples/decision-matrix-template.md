# Decision matrix — template + worked example

Two things here: a **blank template** to copy, and a **fully worked example** (with the JSON that
`scripts/decision-score.mjs` consumes so the arithmetic and sensitivity are checked, not hand-waved).

---

## Blank template (copy this)

```markdown
## Decision: <the question, in one sentence>
- Owner: <who makes the call>
- Door: one-way (hard to reverse) | two-way (reversible)   ← if two-way, consider skipping the matrix

### Constraints (pass/fail gate — an option failing any is eliminated, not scored)
- <must-have 1>
- <must-have 2>

### Criteria & weights (must sum to 1.0; justify each weight)
- <criterion 1> — <weight> — <why it matters this much>
- <criterion 2> — <weight> — <why>
- <criterion 3> — <weight> — <why>

### Scoring (1–5, one-line evidence per cell)

Criterion (weight)   | Option A | Option B | Option C
---------------------|----------|----------|----------
<criterion 1> (0.__) | _        | _        | _
<criterion 2> (0.__) | _        | _        | _
<criterion 3> (0.__) | _        | _        | _
---------------------|----------|----------|----------
Weighted total       | _        | _        | _

### Recommendation
- Choice: <option>
- Justified against: <the weights that carry it>
- What it trades away vs the runner-up: <the cost you're accepting>
- Confidence: high | medium | low
- Sensitivity: <robust, or "flips if <criterion> weight moves past <x>">
- Reversal cost / tripwire: <what would make us revisit>
```

---

## Worked example: choosing a datastore for a new events service

### Decision
Which datastore should the new event-ingestion service use? · Owner: platform lead · **One-way door**
(the persistence engine and data model are expensive to change once we're writing production traffic).

### Constraints (gate)
- **Must run self-hosted** (no managed-cloud-only services — regulatory).
- Must support **≥ 20k writes/sec** sustained.

→ *Kafka + external KV* is **eliminated**: the proposed design fails the self-hosted operability
budget (two more stateful systems to run than the team can staff). It never enters the scoring.

### Criteria & weights (sum = 1.0)
- **write throughput** — 0.40 — ingestion is write-heavy; this is the core requirement.
- **operability** — 0.35 — a 4-person team runs this on-call; a system they can't operate is a
  liability regardless of raw speed.
- **cost at scale** — 0.25 — matters, but a distant third behind "works" and "we can run it."

### Scoring

Criterion (weight)      | Postgres | Cassandra
------------------------|----------|----------
write throughput (0.40) | 3        | 5
operability      (0.35) | 5        | 2
cost at scale    (0.25) | 5        | 3
------------------------|----------|----------
Weighted total          | **4.20** | 3.45

Evidence, per cell: *throughput* — Postgres handles our volume with partitioning + `COPY` but needs
tuning (3); Cassandra is built for write scale (5). *Operability* — the team runs Postgres today (5);
nobody has operated a Cassandra cluster, repair/compaction is a new on-call burden (2). *Cost* —
Postgres is one boring box (5); Cassandra needs a multi-node cluster from day one (3).

### Recommendation
- **Choice: Postgres** (4.20 vs 3.45; margin 0.75, well outside the noise band).
- **Justified against:** operability (0.35) and cost (0.25) together outweigh Cassandra's throughput
  edge. The decisive criterion is **operability** — Postgres's +1.05 there covers its −0.80 throughput
  deficit with room to spare.
- **What it trades away:** raw write headroom. If ingestion grows past what a partitioned Postgres can
  take, we revisit — but we'd rather solve that problem later, with data, than adopt an unfamiliar
  operational burden now for scale we don't yet have.
- **Confidence: medium-high.**
- **Sensitivity:** the call flips only if *write throughput* should be weighted above ~0.55 — i.e. if
  we believed we'd blow past Postgres's ceiling soon. We don't have evidence for that, so the weight
  stays at 0.40. That is the one assumption to revisit.
- **Tripwire:** if sustained writes exceed 60% of the tuned Postgres ceiling for two weeks, re-open
  this decision with real load data.

### The JSON `decision-score.mjs` consumes

```json
{
  "decision": "Datastore for the events service",
  "constraints": ["must run self-hosted", ">= 20k writes/sec"],
  "criteria": [
    { "name": "write throughput", "weight": 0.4 },
    { "name": "operability", "weight": 0.35 },
    { "name": "cost", "weight": 0.25 }
  ],
  "options": [
    { "name": "Postgres", "scores": { "write throughput": 3, "operability": 5, "cost": 5 } },
    { "name": "Cassandra", "scores": { "write throughput": 5, "operability": 2, "cost": 3 } },
    { "name": "Kafka+KV", "eliminated": true, "reason": "fails self-hosted operability budget" }
  ]
}
```

Run it: `node ../scripts/decision-score.mjs matrix.json` → prints the ranking (Postgres 4.200,
Cassandra 3.450), the margin (0.750), the decisive criterion (operability, +1.050 for #1), and
"robust". Change a weight and re-run to watch the sensitivity move — that is the point.

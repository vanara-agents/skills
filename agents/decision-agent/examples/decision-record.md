# Decision record — build vs buy for feature flags

The artifact this agent leaves behind — findable, dated, revisitable.

## Question

Adopt a flags SaaS or build on our config system? (Team: 9 eng. Flags needed
for one product area now, likely three within a year.)

## Criteria and weights (agreed before scoring)

Delivery speed 35% · reliability blast-radius 25% · cost over 3y 20% ·
flexibility 20%

## Scores

- **Buy (SaaS)**: 8.1 weighted — wins on speed and reliability (their outage
  ≠ our outage, kill-switch semantics battle-tested).
- **Build**: 6.2 — wins flexibility, loses 6-8 weeks of a senior engineer and
  becomes an unowned internal product (the graveyard pattern).

## Decision

Buy. Wrap it behind our own `flags.isOn()` facade so the vendor is swappable
and the flexibility loss is contained to the facade.

## Revisit triggers

Vendor price doubling · >3 incidents/year attributable to the vendor ·
flag evaluation needed in the hot path (<1ms budget).

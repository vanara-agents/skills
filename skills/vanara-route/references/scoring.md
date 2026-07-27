# How routing scores are built

The route decision is a ranked list with reasons. This reference explains the
signals so you can predict — and correct — the router.

## Signals, in weight order

1. **Trigger-phrase match** against each item's description ("use when…") —
   the author wrote those lines for exactly this purpose.
2. **Symptom shape**: regressions ("since Tuesday") route to diagnosis
   (debugger) before optimization (perf-*) — a dated change implies a cause
   to find, not a design to improve.
3. **Artifact type**: a failing test routes differently than a stack trace,
   which routes differently than "make this faster".
4. **Installed-set bias**: only installed items are ranked; a better match
   that isn't installed becomes a logged gap (vanara request), never a
   silent miss.

## Reading a route decision

The runner-up line matters most: it encodes the likely NEXT hop if the first
agent's work points elsewhere. A good handoff names that path explicitly.

## Correcting the router

If a route feels wrong, the fix is almost always the item description's
trigger line, not the router: sharpen "use when" to name the symptom, and the
same task routes correctly next time. Memory records corrections so repeats
route right without re-litigating.

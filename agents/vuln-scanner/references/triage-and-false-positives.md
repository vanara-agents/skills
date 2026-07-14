# Triage and False Positives

Triage is the difference between a security agent and a `grep` wrapper. Raw scanner output is a starting
point with a high noise floor; this reference is how you turn it into signal.

## The triage pipeline

```text
raw findings
  -> normalize    (one schema: id, package, severity, location, source-tool)
  -> dedupe       (same CVE from SCA + container scan = one finding)
  -> false-positive filter (suppress with a recorded reason)
  -> reachability assessment (is the vulnerable path used/exposed?)
  -> final severity (CVSS adjusted by reachability + impact)
  -> rank + bucket (fix now / plan / accept-monitor)
```

The bundled `scripts/parse-scan-results.mjs` automates normalize + dedupe + severity sort. Human
judgment owns the false-positive and reachability steps.

## Deduplication

The same underlying CVE often appears from multiple tools and multiple dependency paths. Collapse them:

- Key on the advisory ID (CVE / GHSA) **plus** the affected package+version.
- Keep the highest-confidence source and union the locations.
- Count once in the summary. Reporting one CVE five times manufactures fake urgency and is a form of
  alert fatigue.

## Identifying false positives

Common false positives and how to confirm them:

| Pattern | Why it's flagged | How to confirm it's benign |
|---|---|---|
| Example/placeholder secret | Matches a key regex | Value is `AKIAEXAMPLE…`, in `*.example`, or in test fixtures |
| Vendored test data | CVE in a bundled sample | Path is under `test/`, `fixtures/`, `__mocks__/` and not shipped |
| Unreachable CVE | Vulnerable function never called | `grep` for the import/call; if absent, code path is dead |
| Dev-only dependency | CVE in a build/test tool | Not in production bundle; lower severity, not zero |
| Feature-gated advisory | Applies only with a flag on | Confirm the flag/default; note the qualifier |

**Always record the suppression reason.** A silently dropped finding is indistinguishable from a missed
one. Put suppressed items in an "Accepted / suppressed" section with their justification.

## Reachability — the multiplier

Reachability is what separates theoretical from exploitable risk:

- **Exposed + reachable** (e.g. a deserialization CVE on a public POST handler): keep or raise severity.
- **Present but unreachable** (vulnerable parser never invoked): downgrade, schedule, don't block.
- **Dev/build-time only:** real but lower; an attacker needs supply-chain or CI access to exploit.

State the reasoning explicitly so a reviewer can overrule:

> CVE-2025-XXXX (CVSS 9.8) in `fast-xml@3.1.0`. The vulnerable `parseAttrs` path is only hit when
> `allowAttributes:true`; this app calls the parser with defaults. **Downgraded critical -> medium**,
> scheduled, not release-blocking.

## Avoiding alert fatigue

- Hard-rank. The top finding must be the genuinely most urgent, not the highest raw CVSS.
- Bucket aggressively: *fix now* should be short (single digits ideally). Everything else goes to
  *plan* or *accept/monitor*.
- Push low/info findings into an appendix. Do not make a reader scroll past 200 lows to find the one
  critical — that is how real issues get missed.
- Be consistent run-to-run so developers can diff reports and see what's new.

## When triage is genuinely uncertain

If you cannot determine reachability from static analysis alone, say so and assign provisional severity
on the conservative side, with a note on what would resolve the uncertainty (e.g. "needs DAST against
staging" or "confirm whether `module X` is in the production bundle"). Honest uncertainty beats false
confidence in either direction.

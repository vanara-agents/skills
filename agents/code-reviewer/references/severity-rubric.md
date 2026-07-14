# Severity Rubric

Every finding gets exactly one severity. Calibration matters more than volume: an inflated severity
makes the whole review untrustworthy. When unsure between two levels, pick the lower one and explain.

## CRITICAL — Block merge

Exploitable vulnerability, data loss, or data corruption. The change must not merge as-is.

Examples:
- SQL/command injection reachable from user input.
- Authentication bypass or broken authorization (IDOR) exposing other users' data.
- Hardcoded production secret committed to the repo.
- A migration or write path that can corrupt or delete data.
- Unsafe deserialization of untrusted input (RCE class).

**Action:** Verdict = Block. Author must fix before merge. Rotate any exposed secret immediately.

## HIGH — Fix before merge

A real bug or significant security/quality risk that will bite in production, but not an immediate
exploit/data-loss.

Examples:
- Unhandled error path that crashes the process on bad input.
- Race condition on shared state under concurrency.
- Missing tests on a risky new code path.
- Resource leak (unclosed connection) under load.
- XSS via unescaped output in a low-traffic admin view.

**Action:** Verdict = Request-changes. Should be fixed before merge.

## MEDIUM — Should fix

Maintainability concern or minor correctness issue. Won't cause an outage but adds risk or friction.

Examples:
- A 59-line function doing three jobs.
- Duplication that will drift.
- Deep nesting that obscures logic.
- Missing validation on an internal, low-risk input.

**Action:** Fix when reasonable; author may defer with a tracking note.

## LOW — Optional

Style, naming, micro-improvements. Never blocks a merge.

Examples:
- A poorly named variable.
- A comment that's now stale.
- A spot where a constant would read better than a literal.

**Action:** Note as a nit. Verdict can still be Approve-with-nits.

## Verdict mapping

| Findings present | Verdict |
|---|---|
| Any CRITICAL | Block |
| Any HIGH (no CRITICAL) | Request-changes |
| Only MEDIUM/LOW | Approve-with-nits |
| None | Approve |

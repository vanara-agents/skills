# Gates — how to check an exit condition

A gate is the single verifiable condition that must hold before a pipeline advances. Gates are
what make orchestration trustworthy: they turn "looks done" into "is done." Evaluate each
gate concretely — never by assertion.

## The gate types

| Gate | How to verify it concretely |
|------|-----------------------------|
| **RED** (a failing test exists) | run the test suite; the new test must be present and **failing** for the stated reason, not an unrelated error |
| **GREEN** (tests pass) | run the full suite; the target test passes **and** no previously-passing test regressed |
| **Review clean** | the reviewer's output has **zero** blocking/CRITICAL/HIGH findings still open; advisories are allowed |
| **No new secrets** | a secret scan over the diff is clean (e.g., the `security-auditor`'s scanner) |
| **Reproduced** | the failure is triggered by written steps and the observed error is recorded |
| **Findings gone** | a re-run of the same audit no longer reports the previously-listed items, and reports no new ones |

## Rules

- **Unverifiable = not passed.** If you can't actually run the check (no tests, no scanner),
  treat the gate as failed and say why — do not wave it through on faith.
- **A gate failure is an output, not an error to swallow.** Report exactly which condition
  failed, the evidence, and which stage the pipeline is looping back to.
- **Don't move the goalposts.** The gate for a stage is fixed before the stage runs; don't
  weaken it after the fact to force an advance.
- **Cap retries.** If a stage can't clear its gate in 2–3 attempts, stop and escalate to the
  user with the specific blocker rather than looping indefinitely.

## Why gates beat a single agent

A one-shot agent can produce a plausible-looking patch that doesn't compile, breaks another
test, or reintroduces the bug. A gate between "patch" and "commit" catches all three before they
reach the repo. The value of orchestration is entirely in the gates — the sequence without them
is just several agents run in a row.

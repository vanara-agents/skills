# Named workflows — stages and gates

Each workflow is a sequence of stages. Every stage names **one owner agent**, an **action**,
and a **gate** (the exit condition that must hold before advancing). Gates are hard stops.

## fix-defect

Turn a bug report into a fixed, tested, reviewed, committed change.

| # | Stage | Owner | Gate to advance |
|---|-------|-------|-----------------|
| 1 | Reproduce | `debugger` | the failure is reproduced deterministically (steps + observed error) |
| 2 | Regression test | `test-author` | a test that captures the bug is written **and fails** (RED) |
| 3 | Patch | `debugger` / `feature-builder` | the stage-2 test now **passes** (GREEN), no other test broke |
| 4 | Review | `code-reviewer` | **no blocking findings**; advisories may be noted |
| 5 | Commit | — | conventional message; run recorded |

If stage 4 flags a blocker, loop to stage 3 — never forward.

## ship-feature

Build a feature test-first, reviewed before it lands.

| # | Stage | Owner | Gate to advance |
|---|-------|-------|-----------------|
| 1 | Plan | `project-planner` | a short, ordered plan exists (files, steps, risks) |
| 2 | Tests first | `test-author` | tests for the new behavior exist and **fail** (RED) |
| 3 | Implement | `feature-builder` | tests **pass** (GREEN); coverage of the new path |
| 4 | Review | `code-reviewer` (+ `security-auditor` if auth/payments touched) | no blocking findings |
| 5 | Commit | — | conventional message; run recorded |

## harden

Reduce real risk in an existing codebase and prove it's gone.

| # | Stage | Owner | Gate to advance |
|---|-------|-------|-----------------|
| 1 | Audit | `security-auditor` | findings enumerated with severity + `file:line` |
| 2 | Triage | `threat-modeler` | findings ranked; top items chosen with rationale |
| 3 | Fix | `feature-builder` / `debugger` | chosen findings addressed, tests still green |
| 4 | Re-audit | `security-auditor` | the fixed findings are **gone** and **no new** ones appear |
| 5 | Report | — | before/after summary of severity counts |

## Composing your own

If no named workflow fits, compose one: pick agents by stage, and for each stage write the
single exit condition that proves it succeeded. If you can't state a gate for a stage, that
stage isn't well-defined yet — refine it before running.

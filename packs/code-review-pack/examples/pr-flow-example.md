# Worked Example — one PR through the pipeline

PR #512: "Add invoice CSV export" — 380 lines, touches API + a new query + one UI table.

## 1. pr-summarizer posts (2 min after open)

> **What**: New `GET /invoices/export.csv` endpoint (streaming), export button on the
> invoices table, `invoices_export` permission.
> **Why**: FEAT-201 — finance team needs monthly exports.
> **Read first**: `export-controller.ts` (new query!), `permissions.ts` (auth change).
> **Blast radius**: read-only endpoint; new DB query on `invoices` (potentially large);
> no schema change. **Risk**: memory on large exports, query performance.

## 2. code-reviewer posts (5 min after open)

> `blocking:` export-controller.ts:41 — query selects `*` and loads all rows into memory
> before streaming; a 500k-invoice tenant OOMs the pod. Stream with a cursor
> (keyset pagination) or use the DB driver's row stream.
>
> `blocking:` export-query.sql — `WHERE tenant_id = ? AND created_at > ?` has no
> supporting composite index (per sql-index-tuning: needs `(tenant_id, created_at)`;
> current plan is a seq scan at 2M rows — EXPLAIN attached).
>
> `q:` permissions.ts:88 — `invoices_export` granted to `member` by default; FEAT-201
> says finance-only. Intended?
>
> `nit:` csv column headers hardcoded English — project is i18n'd (`internationalization`).

## 3. Human reviewer (18 min later, reads summary + findings first)

Spends attention on the two judgment calls: confirms permission should be finance-only
(product check), and decides streaming approach (driver row-stream over keyset — simpler
here). Doesn't re-read the 300 lines the machine already covered line-by-line; spot-checks
the test file.

## 4. Author revises → checks green → squash-merge

```text
feat(invoices): add streaming CSV export (FEAT-201)

Finance-only permission; keyset-cursor streaming; composite index
(tenant_id, created_at) added expand-only.
```

## Outcome ledger

- OOM prevented pre-merge (would have been a Sev-2 at month-end).
- Missing index caught before it met the 2M-row tenant.
- Human review time: ~20 min for a 380-line PR, spent entirely on judgment.
- History entry supports changelog + bisect.

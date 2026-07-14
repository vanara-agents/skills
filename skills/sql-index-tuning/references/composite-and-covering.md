# Composite Indexes, the Leftmost-Prefix Rule, and Covering Scans

## The leftmost-prefix rule

A composite index `(a, b, c)` physically sorts rows by `a`, then `b` within each `a`, then `c` within each
`(a, b)`. A seek can therefore use the index only for a **left-anchored prefix** of the columns:

| Predicate | Index columns used for seek |
|---|---|
| `a = ?` | `(a)` |
| `a = ? AND b = ?` | `(a, b)` |
| `a = ? AND b = ? AND c = ?` | `(a, b, c)` |
| `b = ?` | none (gap at `a`) |
| `a = ? AND c = ?` | `(a)` only; `c` becomes a filter (gap at `b`) |

The moment there's a gap, the columns after the gap can't be used for seeking — only for filtering rows
already located by the prefix.

## Equality before range

A range predicate (`>`, `<`, `>=`, `<=`, `BETWEEN`, `LIKE 'x%'`) returns a contiguous slice of the index.
Everything **after** a range column in the index can no longer narrow the seek — the engine has to scan the
whole slice and filter. Therefore:

> **Order composite columns: all equality columns first, then a single range column, then any columns
> needed only to satisfy `ORDER BY`.**

Example — query `WHERE tenant_id = ? AND status = ? AND created_at > ? ORDER BY created_at`:

- Good: `(tenant_id, status, created_at)` — two equalities seek precisely, the range walks the slice, and
  the slice is already ordered by `created_at` so the sort disappears.
- Bad: `(tenant_id, created_at, status)` — the range on `created_at` comes before the `status` equality,
  so `status` degrades to a filter and the seek is wider than necessary.

## ORDER BY and indexes

An index can supply sort order for free if the `ORDER BY` columns are a prefix of the remaining index
columns **with matching direction**. `(tenant_id, created_at)` serves
`WHERE tenant_id = ? ORDER BY created_at ASC` with no sort node. For `ORDER BY created_at DESC`, most
engines can scan the index backwards. Mixed directions (`a ASC, b DESC`) need a matching mixed-direction
index.

## Covering indexes and index-only scans

If the index contains every column the query references, the engine never touches the table heap — an
**index-only scan**. Two ways to make an index cover:

1. **Add the columns as key columns**: `(tenant_id, status, created_at)` covers a query selecting those
   three. Downside: they participate in sorting and widen every internal node.
2. **`INCLUDE` non-key columns** (Postgres, SQL Server): `(tenant_id, status) INCLUDE (total, created_at)`
   stores the extra columns only in the leaf, so they're available for the scan without bloating the tree
   or imposing sort semantics. Prefer `INCLUDE` for payload columns you only need to return, not filter.

Covering indexes are wider, so they cost more to write and store. Reserve them for measured hot paths.

## Redundancy

`(a, b, c)` already serves seeks on `(a)` and `(a, b)`. A separate `(a)` or `(a, b)` index is redundant —
drop it to reclaim the write cost, unless the narrower one is also covering for a specific query or has a
different sort direction you depend on.

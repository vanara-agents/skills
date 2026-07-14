# B-tree Internals

The B-tree (technically a B+tree in most databases) is the default index structure. Understanding its
shape explains exactly which queries it can accelerate.

## Structure

- **Root and internal nodes** hold separator keys and pointers to child pages. They route a search.
- **Leaf nodes** hold the actual sorted key values plus a pointer (tuple id / row locator) back to the
  table row. In a B+tree, leaves are doubly-linked, so a range scan walks neighbours without re-descending
  the tree.
- The tree is **balanced**: every leaf is the same depth from the root. A lookup is `O(log n)` — for a
  billion rows that's roughly 4–5 page reads.

```
                 [ . m . ]                 root (separators)
                /         \
        [ . f . ]         [ . t . ]        internal
        /    |    \        /    |   \
     a→ ... f→ ... m→ ... t→ ...           leaves: sorted keys → row pointers
     └──── linked leaf chain for range scans ────┘
```

## Page splits and write cost

Keys live in fixed-size pages. When an insert lands in a full leaf page, the page **splits** into two and
the separator propagates up — occasionally cascading to the root. This is why inserts into the *middle* of
the key space are costlier than appending to the end. A monotonically increasing key (an autoincrement id,
or `created_at` on an append table) always inserts at the right edge, minimizing splits but concentrating
contention on the rightmost page.

## What a B-tree can serve

| Operation | Served by B-tree? | Note |
|---|---|---|
| `col = v` | Yes | descend to leaf, done |
| `col > v` / `BETWEEN` | Yes | seek then walk the leaf chain |
| `ORDER BY col` | Yes | leaves are already sorted; no sort node |
| `MIN(col)` / `MAX(col)` | Yes | first / last leaf entry |
| `col LIKE 'pre%'` | Yes | prefix is a range |
| `col LIKE '%suf'` | No | no prefix to anchor the descent |
| `f(col) = v` | No | unless an expression index on `f(col)` exists |
| `col != v` | No | matches almost everything; scan is cheaper |

## Cardinality and the leading column

Because the tree branches on the leading column first, a **low-cardinality** leading column (e.g. a
boolean) creates only two huge subtrees — a seek lands you in 50% of the rows, which the planner will
reject in favour of a sequential scan. Lead with selective, high-cardinality columns. Low-cardinality
columns are useful only deeper in a composite, or as a **partial index** predicate.

## Heap vs index-organized

In Postgres and MySQL/InnoDB the details differ: InnoDB's primary key **is** the table (clustered /
index-organized), so secondary indexes store the primary key as the row pointer and a lookup is two
B-tree descents. Postgres keeps a separate heap, so secondary and primary indexes are symmetric but the
heap can require a visibility check (mitigated by the visibility map for index-only scans). This is why a
covering index that avoids the heap visit is such a large win in Postgres.

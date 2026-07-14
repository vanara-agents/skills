# Cursor Encoding

A cursor must carry enough to rebuild the keyset `WHERE` clause and nothing more: the sort-key
values, the direction, and a version byte. It must be opaque, tamper-evident (public APIs), and
survive encoding changes across deploys.

## Layout

```
v1 . base64url( json({ k: ["2026-07-01T12:00:00.000Z", 4711], d: "desc" }) ) . hmac10
```

- **`v1` prefix** — bump when the payload shape changes; reject unknown versions with 400
  `CURSOR_INVALID`, which clients treat as "restart iteration".
- **base64url**, not base64 — cursors travel in query strings; `+/=` break naive clients.
- **HMAC (first 10 bytes, hex)** over `version + payload` with a server-side key. Not secrecy —
  integrity. Without it, clients will reverse-engineer the payload and build their own cursors,
  and your encoding becomes an accidental public API you can never change.

## Rules

- Timestamps in the payload must be **full precision** (milliseconds or better). Truncated seconds
  re-introduce the duplicate-key ambiguity the tiebreaker was meant to solve.
- Never embed user IDs, filters, or auth state in the cursor — re-derive those from the request.
  A cursor pasted into another user's session must not leak or authorize anything.
- Cursors may expire (e.g., if the underlying snapshot is gone). Expired cursor → 400 with a
  distinct `CURSOR_EXPIRED` code so clients restart rather than retry.
- Treat decode failures as client errors (400), never 500 — fuzzers will send garbage.

## Anti-pattern: the "readable" cursor

`?after_id=4711&after_ts=...` looks friendlier but freezes your sort semantics forever: adding a
tiebreaker, changing direction defaults, or switching the sort column becomes a breaking change.
Opaque tokens keep the contract at "pass back what we gave you".

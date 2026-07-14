# Consuming Paginated APIs Correctly

The consumer side has its own failure modes: partial iteration on crash, duplicate processing on
retry, and silent stalls when a provider changes page semantics.

## The iteration loop

```js
let cursor = savedCheckpoint ?? null;
do {
  const page = await get('/items', { cursor, limit: 100 });
  for (const item of page.data) await processIdempotently(item);
  cursor = page.page_info.next_cursor ?? null;
  await saveCheckpoint(cursor);          // AFTER processing the page
} while (cursor);
```

Rules encoded above:

- **Checkpoint the cursor, not the item index.** Persist `next_cursor` after each fully processed
  page; on restart, resume from the checkpoint instead of page one.
- **Process idempotently.** At-least-once is the reality: a crash between processing and
  checkpointing replays the page. Dedupe on item ID exactly like a webhook consumer.
- **Loop on `next_cursor` presence, not on `data.length > 0`.** Some providers return short or
  empty pages mid-stream (filtered rows); an empty page with a cursor is NOT the end.
- **Bound the loop.** A provider bug that returns the same cursor forever becomes your infinite
  loop; track `pages_fetched` against a sane ceiling and alert past it.

## Retry semantics

Page fetches are GETs — safe to retry with backoff. But a `CURSOR_EXPIRED` or `CURSOR_INVALID`
response is not retryable: restart the iteration from your last durable checkpoint (or from
scratch) and rely on idempotent processing to absorb the overlap.

## Rate limits and burst shape

Full-table syncs hammer providers. Respect `Retry-After` on 429s, spread scheduled syncs with
jitter, and prefer provider-side incremental endpoints (`updated_since=`) over re-walking
everything — pagination is for the backfill, deltas are for steady state.

# Observability — Reading the Evidence

You can't fix what you can't see. Observability is the practice of making a system's internal state
inspectable from the outside, through three complementary signals plus the artifacts a crash leaves behind.

## The three pillars

| Signal | Answers | Use for |
|---|---|---|
| **Logs** | "What happened, exactly here?" | discrete events, error context, the bad value |
| **Metrics** | "How much / how often, over time?" | rates, latencies, error %, spotting *when* a regression started |
| **Traces** | "What was the path across services?" | distributed call graphs, finding the slow/failing hop |

Logs give detail, metrics give trends, traces give causality across boundaries. A bug hunt usually starts
at a metric spike ("errors jumped at 14:05"), zooms to a trace ("the payment service hop failed"), then
lands on a log line with the exact exception.

## Reading a stack trace

1. **Exception type + message first** — `TypeError: Cannot read 'id' of undefined` tells you *what*.
2. **Top user-code frame** — skip framework/stdlib frames; the first frame in *your* files is where to
   start. (Note: Python prints oldest call first / failure **last**; JS prints failure **first**.)
3. **Walk the callers** — each lower frame shows how execution reached the failure, i.e. who passed the
   bad value.

```text
JavaScript (most-recent first):          Python (most-recent LAST):
  TypeError: ... 'id' of undefined         Traceback (most recent call last):
    at formatOrder (format.js:42)            File "list.py", line 88, in render
    at renderOrders (list.js:88)               File "format.py", line 42, in format_order
                                             KeyError: 'id'      <- read this line first
```

Use `scripts/parse-stacktrace.mjs` to extract the top user frame mechanically from either format.

## Logging that actually helps

- Log the **value and the context**, not "got here": `log('discount', {cartId, before, after})`.
- Use **structured** logs (JSON) so you can filter/aggregate, not grep prose.
- Use **levels** deliberately: `error` for failures, `warn` for recovered anomalies, `debug` for probes
  you'll remove. Never leave `console.log` debug spew in committed code.
- Include a **correlation/request id** so you can stitch one request's logs together.

## Core dumps & post-mortem artifacts

When a process dies hard, it may leave a snapshot of memory at the moment of death:

- **Native (C/C++/Go):** a core file — open with `gdb ./bin core` and `bt` for the backtrace, inspect
  locals with `frame`/`print`.
- **Node:** run with `--abort-on-uncaught-exception` or use `--heapsnapshot-signal` / `--cpu-prof` for
  memory and CPU forensics.
- **JVM:** an `hs_err_pid.log` plus a heap dump (`jmap`) you open in a memory analyzer.

These let you debug a failure you can observe but not re-trigger live.

## Pitfalls

- **Logging after the failure.** Put probes *before* the suspect operation so you capture the bad input.
- **Too much log noise.** Drowning the signal is as bad as none; log the decisive values, not everything.
- **No timestamps / no ids.** Unordered, uncorrelated logs can't reconstruct a sequence.
- **Sensitive data in logs.** Never log secrets, tokens, or PII — redact at the boundary.

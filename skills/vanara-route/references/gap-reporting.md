# Gap reporting — the privacy model

When the router finds no installed agent for a task, that is a useful signal: it tells the
Vanara team which specialist to build next. But a task description can contain proprietary
code, customer data, or business context — so **nothing is ever sent automatically.**

## How it works

1. **Local log.** The router appends a one-line, generic description of the *missing
   capability* (not the task contents) to `~/.vanara/gaps.jsonl` on your machine. Example line:
   ```json
   {"ts":"2026-07-13T18:00:00Z","capability":"Terraform drift diagnosis / state reconciliation"}
   ```
2. **You decide.** Running `vanara request` reads that log and prepares an email to the Vanara
   team (`support@vanaraagents.com`) with the capability phrases pre-filled. You review it and
   **you** send it — or edit it, or delete a line, or send nothing.
3. **No telemetry.** There is no background upload, no phone-home, no account tie-in. If you
   never run `vanara request`, nothing leaves your machine.

## What to record — and what never to

| Record (generic capability) | Never record |
|---|---|
| "Kafka consumer-lag alerting agent" | the task's actual code or config |
| "Stripe webhook reconciliation reviewer" | customer names, emails, secrets |
| "ARM template (Bicep) linter" | proprietary business logic |

The rule is one short phrase naming the *kind of agent* that was missing. If in doubt, write
less. You can always add detail yourself when you send the request.

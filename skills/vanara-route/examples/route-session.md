# Worked example — a full routing session

```text
$ task: "the nightly ETL has been failing intermittently for a week"

RANKED:
  debugger               0.81  intermittent + dated → bisect first
  data-pipeline-engineer 0.77  owns the ETL domain; likely second hop
  incident-responder     0.32  no user-facing impact declared

DECISION: debugger, with data-pipeline-engineer named as the handoff if the
fault is in pipeline design rather than a regression.

HANDOFF PACKAGE: failure timestamps (correlate with deploy log), the two
error signatures, and the note that failures cluster on Mondays (backlog
volume?) — hypotheses, labeled as hypotheses.
```

Two days later the bisect lands on a dependency bump; the route log's
runner-up was never needed — but it was there, with a reason, before anyone
was tired at 2am.

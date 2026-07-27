# Worked example — when nothing matches

Routing honesty: the no-match path is a feature, not a failure.

```text
$ task: "review our Terraform for security issues"

RANKED (installed set):
  security-auditor   0.41  general code audit — CAN look, wrong depth
  iac-author         0.38  writes IaC, doesn't audit it

BEST MATCH BELOW THRESHOLD (0.6).

ACTION TAKEN:
  1. honest partial: security-auditor runs with an explicit scope note —
     "generic audit, not Terraform-state/provider-pinning aware"
  2. gap logged:  vanara request "terraform security reviewer"
```

The wrong behavior would be silently stretching iac-author to a job it
doesn't claim. The gap log is how the catalog learns what's missing — and the
user got a truthfully-scoped partial instead of confident miscoverage.

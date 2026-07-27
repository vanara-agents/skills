# Review culture: comments that get acted on

The same finding can land as a fight or a fix. This reference is the pack's
guidance for the human half of review tone and norms.

## Comment protocol

- **Severity first.** Prefix blocking comments (`blocking:`) and preferences
  (`nit:`). Mixed signals are why PRs stall.
- **Point at the principle, not the person.** "This query is injectable —
  see owasp-top10 §injection" beats "you always forget sanitization".
- **Offer the diff.** A concrete suggestion converts 10× more often than a
  question mark.
- **One round rule:** batch your comments; serial drip-feeding doubles cycle
  time.

## Author protocol

- Respond to every blocking comment with a change or a reasoned disagreement —
  silence reads as ignored.
- Disagreements escalate to a 10-minute call after two rounds, never a third
  written round.
- Keep PRs under ~400 lines; the pack's pr-summarizer output includes size
  warnings for a reason.

## What the agent changes

With code-reviewer's pass landing first, human comments should concentrate on
design and domain judgment — if humans are still catching injection bugs, the
agent config needs attention, not the author.

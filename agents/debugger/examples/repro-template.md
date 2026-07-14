# Minimal Reproduction Checklist

A bug isn't ready to fix until you can trigger it on demand. Fill this out *before* editing any code.

## 1. The failure (verbatim)

- **Error message / stack trace:** _paste the full text, unedited_
- **Where it surfaced:** `file:line` of the top user-code frame
- **Expected vs actual behavior:** _one line each_

## 2. The trigger

- **Exact input / steps:**
  1. _step_
  2. _step_
  3. _failure observed_
- **Frequency:** [ ] every time  [ ] intermittent (___ % of runs)  [ ] only under load/concurrency
- **First seen:** _commit / version / date_ — and the last known-good version, if any

## 3. The environment

| Factor | Value |
|---|---|
| OS / runtime version | |
| Dependency versions | |
| Config / env vars | |
| Data / fixtures | |

## 4. Reduce to the minimum

Strip everything that *doesn't* affect the outcome until you have the smallest case that still fails:

- [ ] Removed unrelated code paths
- [ ] Replaced external calls with fixed stubs/fixtures
- [ ] Hard-coded the triggering input
- [ ] Confirmed it **still fails** after reduction
- [ ] Confirmed it is **deterministic** (or documented the flake rate + suspected race)

## 5. The repro artifact

A runnable snippet or single failing test is the goal — paste it here:

```text
# minimal failing command or test
$ npm test -- checkout.spec.js -t "applies discount once"
  ✗ applies discount once  (expected 90, got 81)
```

> If you cannot produce a deterministic repro after a bounded effort, **stop**. Record what you tried and
> exactly what additional evidence (logs, prod input, env access) you need — do not guess-edit.

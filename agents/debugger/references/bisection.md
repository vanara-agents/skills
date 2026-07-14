# Bisection — Binary Search for Bugs

When reasoning stalls, *search*. Halving the problem space repeatedly finds the culprit in log₂(N) steps
instead of N. Bisection applies to three spaces: **history** (which commit), **code** (which statement),
and **input** (which data).

## 1. History: `git bisect`

When a bug appeared "sometime in the last 200 commits," let git binary-search them. Mark a known-bad and
known-good revision; git checks out the midpoint and you tell it good or bad until it names the culprit.

```bash
git bisect start
git bisect bad                 # current HEAD is broken
git bisect good v1.4.0         # this old tag worked
# git checks out the midpoint; test it, then:
git bisect good                # ...or: git bisect bad
# repeat until git prints "<sha> is the first bad commit"
git bisect reset               # return to where you started
```

Automate it when you have a script that exits 0 (good) / non-zero (bad):

```bash
git bisect start HEAD v1.4.0
git bisect run npm test -- --testPathPattern=checkout
```

`git bisect run` will drive the entire search unattended and print the first bad commit. Keep the test
fast and deterministic, or the search inherits its flakiness.

## 2. Code: bisect the execution path

Within a single bad function, find *where* the state goes wrong by checking the midpoint. Print or assert
the suspect value halfway through; if it's already wrong, the bug is in the first half — otherwise the
second. Repeat on the bad half.

```text
function process(x) {
  step A          // assert(valid) here -> OK?  search lower half
  step B
  step C          // <-- midpoint probe: value already corrupt? bug is A/B
  step D
  step E          // assert(valid) here -> still OK?  bug is D/E
}
```

A "wolf-fence" probe (a single well-placed log of the suspect value) beats scattering ten prints.

## 3. Input: bisect the data

A 100k-row file that crashes the parser? Don't read 100k rows. Feed the first half — still crashes? The
offending row is in that half. Halve again. ~17 iterations isolate one row out of 100k. The same works
for narrowing a failing config to one key, or a failing request to one field.

## Pitfalls

- **Non-deterministic test → useless bisect.** Flaky good/bad answers send the search to the wrong commit.
  Stabilize the repro first.
- **Skipping untestable midpoints.** If a midpoint commit won't build, use `git bisect skip` — don't guess.
- **Forgetting `git bisect reset`** leaves you on a detached checkout.
- **Too-coarse halving.** Bisect to the *commit*, then bisect *within* it to the statement; don't stop at
  "this 400-line commit did it."

# Keeping a README Honest — Maintenance and Drift

The most dangerous README is one that *used* to be correct. A broken quickstart or a snippet that no
longer matches the API erodes trust faster than having no example at all. This reference is about keeping
the README true over time.

## Why READMEs drift

- **Code changes, docs don't.** A flag is renamed, an import path moves, a default changes — the README
  still shows the old form because nobody re-ran it.
- **Copy-paste rot.** Examples copied from an old version or another project that never quite applied.
- **Untested commands.** The quickstart was written from memory, not from a clean checkout, and a step
  (usually `install`) is missing.

## Treat snippets as testable artifacts

The fix is to make examples *executable* rather than *aspirational*:

- **Run the quickstart in CI** against a clean checkout. If `git clone && npm install && npx forge audit`
  is the promise, run exactly that in a fresh container and fail the build if it errors.
- **Extract and execute code blocks.** Tools like `mdsnippets`, `doctest`-style harnesses, or a small
  script that pulls fenced blocks and runs them keep snippets in sync. Even a smoke test that the
  documented command exits 0 catches the worst breakage.
- **Lint structure in CI.** Use `scripts/lint-readme.mjs` (in this package) to assert the required
  sections and a quickstart code block are present, so a refactor can't silently gut the README.

## A pre-release checklist

Before tagging a release, verify:

- [ ] Quickstart runs end-to-end in a clean checkout (no missing prerequisite or step).
- [ ] Every command's flags match the current CLI (`--help` agrees with the README).
- [ ] Code snippets compile/run against the current version.
- [ ] Version badge and any version-pinned install command point at the release.
- [ ] Links resolve (no 404s to moved docs); relative links work on the repo host.
- [ ] License section matches the actual `LICENSE` file.
- [ ] Screenshots/GIFs still reflect the current UI.

## Automating the check

A minimal CI step that catches the structural failures:

```yaml
# .github/workflows/readme.yml
name: readme
on: [push, pull_request]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: node catalog/skills/readme-writing/scripts/lint-readme.mjs README.md
```

The linter exits non-zero when a required section or the quickstart block is missing, so a PR that
deletes the install section fails review automatically.

## Single-source where you can

Drift is hardest to avoid when the same fact lives in two places. Reduce duplication:

- **Generate** API reference from source (TypeDoc/rustdoc/Sphinx) rather than hand-copying signatures.
- **Link** to `CHANGELOG.md` instead of summarizing release notes in the README.
- **Pull** the version from the package manifest in CI rather than hardcoding it in prose.

The less the README restates, the less there is to fall out of date.

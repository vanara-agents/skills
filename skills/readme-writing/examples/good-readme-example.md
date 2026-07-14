<!--
  WORKED EXAMPLE — a complete, realistic README for a small CLI tool ("tiderss",
  a terminal RSS reader). Use it as a reference for tone, length, and structure.
  Notice: what/why in the first three lines, a 60-second quickstart with expected
  output, a config table, links out for depth, and a license. It passes lint-readme.mjs.
-->

# tiderss

A fast terminal RSS reader that lives in your shell — subscribe, sync, and read feeds without leaving
the keyboard.

[![build](https://img.shields.io/badge/build-passing-brightgreen)]()
[![npm](https://img.shields.io/badge/npm-v1.4.0-blue)]()
[![license](https://img.shields.io/badge/license-MIT-blue)]()

## Why

Web feed readers are slow, ad-laden, and pull you into a browser tab you'll never close. `tiderss` keeps
reading where the work already is: the terminal. It syncs in the background, caches offline, and renders
articles as clean, readable text.

![tiderss reading view](./docs/screenshot.png)

## Install

Requires Node 20+.

```bash
npm install -g tiderss
```

## Quick start

```bash
tiderss add https://blog.acme.dev/feed.xml   # subscribe to a feed
tiderss sync                                  # fetch latest items
tiderss read                                  # open the reader
```

After `sync` you'll see a count of new items (`12 new across 1 feed`), and `read` opens an interactive
list. Use `j`/`k` to move, `Enter` to open, `q` to quit.

## Usage

List your subscriptions and unread counts:

```bash
tiderss list
# acme-blog      12 unread
# rust-weekly     3 unread
```

Mark everything read and export your subscriptions as OPML:

```bash
tiderss mark-all-read
tiderss export > feeds.opml
```

For scripting, every command accepts `--json`:

```bash
tiderss list --json
# [{ "feed": "acme-blog", "unread": 12 }, { "feed": "rust-weekly", "unread": 3 }]
```

See [the command reference](./docs/commands.md) for the full list.

## Configuration

Config lives at `~/.config/tiderss/config.toml`. All values are overridable by env var.

| Option | Env var | Default | Description |
|---|---|---|---|
| `sync_interval` | `TIDERSS_SYNC_INTERVAL` | `30m` | Background sync cadence |
| `cache_dir` | `TIDERSS_CACHE_DIR` | `~/.cache/tiderss` | Where article bodies are cached |
| `theme` | `TIDERSS_THEME` | `auto` | `light`, `dark`, or `auto` |
| `concurrency` | `TIDERSS_CONCURRENCY` | `8` | Parallel feed fetches |

## Contributing

Contributions are welcome. To set up a dev environment:

```bash
git clone https://github.com/acme/tiderss && cd tiderss
npm install
npm test
```

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) and open an issue before large changes.

## License

[MIT](./LICENSE) © 2026 Acme

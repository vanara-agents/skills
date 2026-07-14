# Reference: `imageproc` CLI

> Doc type: **reference**. Exhaustive and consistent; optimized for scanning and `Ctrl-F`, not for
> reading top to bottom. Every entry uses the same structure. For a guided walkthrough, see the tutorial.

## Synopsis

```text
imageproc <command> [options] <input> [output]
```

## Commands

| Command | Purpose |
|---|---|
| `resize` | Scale an image to a target width/height |
| `convert` | Change file format |
| `optimize` | Re-encode to reduce file size |

## Global options

Every entry below follows the same shape: **flag**, type, default, description, example.

### `--quality`
- **Type:** integer (1–100)
- **Default:** `82`
- **Description:** Output encoder quality. Higher is larger and sharper. Ignored for lossless formats.
- **Example:** `imageproc optimize --quality 70 photo.jpg`

### `--width`
- **Type:** integer (pixels)
- **Default:** *(unset — preserves source width)*
- **Description:** Target width. If `--height` is omitted, aspect ratio is preserved.
- **Example:** `imageproc resize --width 1200 hero.png hero@2x.png`

### `--height`
- **Type:** integer (pixels)
- **Default:** *(unset — preserves source height)*
- **Description:** Target height. Combine with `--width` to force exact dimensions (may distort).
- **Example:** `imageproc resize --width 800 --height 600 in.jpg out.jpg`

### `--format`
- **Type:** enum (`jpeg` \| `png` \| `webp` \| `avif`)
- **Default:** *(inferred from output extension)*
- **Description:** Output format. Overrides the extension when both are given.
- **Example:** `imageproc convert --format webp in.png out.webp`

### `--overwrite`
- **Type:** boolean flag
- **Default:** `false`
- **Description:** Allow writing over an existing output file. Without it, an existing target aborts the run.
- **Example:** `imageproc optimize --overwrite big.jpg`

## Exit codes

| Code | Meaning |
|---|---|
| `0` | Success |
| `1` | Invalid arguments |
| `2` | Input file not found or unreadable |
| `3` | Output exists and `--overwrite` not set |
| `4` | Encode/decode failure |

## Environment variables

| Variable | Default | Effect |
|---|---|---|
| `IMAGEPROC_THREADS` | number of CPUs | Worker threads used for encoding |
| `IMAGEPROC_TMPDIR` | system temp | Scratch directory for intermediate files |

---

Why this is a good reference: identical structure for every flag, a default stated for each, tables for
enumerable facts (exit codes, env vars), and no narrative. A reader lands via search, reads one entry, and
leaves.

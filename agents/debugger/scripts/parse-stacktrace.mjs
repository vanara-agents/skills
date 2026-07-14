#!/usr/bin/env node
// Extract the top *user-code* frame (file:line) from a JS or Python stack trace.
// Framework / stdlib / node_modules frames are skipped so you land on YOUR code —
// the place a bug hunt should start (see references/observability.md).
//
// Usage:
//   node parse-stacktrace.mjs "<trace text>"     # parse a literal string
//   cat trace.txt | node parse-stacktrace.mjs    # parse from stdin
//   node parse-stacktrace.mjs --selftest         # run built-in tests (exit 0/1)

// Frames we consider "not user code" and skip when looking for the origin.
const NOISE = [
  /node_modules[\\/]/,
  /\bnode:internal\//,
  /\b<anonymous>\b/,
  /[\\/](site-packages|dist-packages)[\\/]/,
  /[\\/]lib[\\/]python\d/i,
  /\bin <module>\b.*\b(site-packages|python\d)/i,
];

const isNoise = (line) => NOISE.some((re) => re.test(line));

// JS:     "    at formatOrder (src/orders/format.js:42:18)"  or  "    at /a/b.js:10:5"
// Python: '  File "src/format.py", line 42, in format_order'
function parseFrame(line) {
  const js = line.match(/^\s*at\s+(?:(.*?)\s+\()?(.+?):(\d+)(?::\d+)?\)?\s*$/);
  if (js) {
    return { func: js[1] || '<top>', file: js[2], line: Number(js[3]) };
  }
  const py = line.match(/^\s*File\s+"(.+?)",\s+line\s+(\d+)(?:,\s+in\s+(.*))?\s*$/);
  if (py) {
    return { func: (py[3] || '<module>').trim(), file: py[1], line: Number(py[2]) };
  }
  return null;
}

// Returns the top user frame. JS traces list the failure FIRST (scan top-down);
// Python lists it LAST (scan bottom-up). We detect Python by its "File ..." frames.
export function topUserFrame(trace) {
  const lines = trace.split(/\r?\n/);
  const isPython = lines.some((l) => /^\s*File\s+".+?",\s+line\s+\d+/.test(l));
  const ordered = isPython ? [...lines].reverse() : lines;

  let firstFrame = null;
  for (const line of ordered) {
    const frame = parseFrame(line);
    if (!frame) continue;
    if (!firstFrame) firstFrame = frame;   // fallback if everything is "noise"
    if (!isNoise(line)) return frame;      // first non-noise frame = user code
  }
  return firstFrame; // all frames were noise: return the outermost we saw
}

function selftest() {
  const jsTrace = [
    "TypeError: Cannot read properties of undefined (reading 'id')",
    '    at formatOrder (src/orders/format.js:42:18)',
    '    at Array.map (<anonymous>)',
    '    at renderOrders (src/orders/list.js:88:24)',
    '    at handleRequest (node_modules/express/lib/router.js:12:3)',
  ].join('\n');

  const pyTrace = [
    'Traceback (most recent call last):',
    '  File "/usr/lib/python3.11/runpy.py", line 196, in _run_module',
    '  File "src/orders/list.py", line 88, in render',
    '  File "src/orders/format.py", line 42, in format_order',
    "KeyError: 'id'",
  ].join('\n');

  // A trace where the only frames are in node_modules -> fall back to outermost.
  const noiseOnly = [
    'Error: boom',
    '    at foo (node_modules/x/index.js:1:1)',
  ].join('\n');

  const cases = [
    ['js top user frame', jsTrace, { file: 'src/orders/format.js', line: 42, func: 'formatOrder' }],
    ['python top user frame', pyTrace, { file: 'src/orders/format.py', line: 42, func: 'format_order' }],
    ['noise-only fallback', noiseOnly, { file: 'node_modules/x/index.js', line: 1, func: 'foo' }],
  ];

  let ok = true;
  for (const [name, trace, want] of cases) {
    const got = topUserFrame(trace) || {};
    const pass = got.file === want.file && got.line === want.line && got.func === want.func;
    ok &&= pass;
    console.log(`${pass ? '✓' : '✗'} ${name}: ${got.func} @ ${got.file}:${got.line}` +
      (pass ? '' : ` (expected ${want.func} @ ${want.file}:${want.line})`));
  }
  process.exit(ok ? 0 : 1);
}

function report(trace) {
  const frame = topUserFrame(trace);
  if (!frame) { console.error('No stack frame found in input.'); return false; }
  console.log(`Top user-code frame: ${frame.func} @ ${frame.file}:${frame.line}`);
  console.log('Start your investigation here.');
  return true;
}

const arg = process.argv[2];
if (arg === '--selftest') selftest();
else if (arg) process.exit(report(arg) ? 0 : 1);
else {
  let buf = '';
  process.stdin.on('data', (c) => (buf += c));
  process.stdin.on('end', () => process.exit(report(buf) ? 0 : 1));
}

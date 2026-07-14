#!/usr/bin/env node
// Runnable check: scans a string of code for two structural smells this agent
// targets — long functions and deeply nested blocks — and reports them. It is a
// heuristic indicator (brace/indent based, language-agnostic), not a parser.
//
// Usage:
//   node detect-smells.mjs '<code>'            # scan a literal code string
//   echo '<code>' | node detect-smells.mjs     # scan from stdin
//   node detect-smells.mjs --selftest          # run built-in smelly & clean cases
//
// Zero dependencies, Node built-ins only. Exit 0 = no smells found (or selftest
// passed); exit 1 = smells found (or selftest failed).

const MAX_FUNCTION_LINES = 25; // a function body longer than this is "long"
const MAX_NESTING_DEPTH = 3;   // brace depth deeper than this is "deeply nested"

// Detect function-like headers across common languages (JS/TS, Python, Go, Java-ish).
const FUNC_RE = /(\bfunction\b|\bdef\b|=>\s*\{|\bfunc\b|\)\s*\{)/;

export function detectSmells(code, opts = {}) {
  const maxLines = opts.maxLines ?? MAX_FUNCTION_LINES;
  const maxDepth = opts.maxDepth ?? MAX_NESTING_DEPTH;
  const lines = String(code).split('\n');
  const smells = [];

  // --- Deep nesting: track running brace depth ---
  let depth = 0;
  let deepestReported = false;
  lines.forEach((line, i) => {
    const opens = (line.match(/\{/g) || []).length;
    const closes = (line.match(/\}/g) || []).length;
    // depth on this line is measured after opens, before this line's closes apply
    const lineDepth = depth + opens;
    if (lineDepth > maxDepth && !deepestReported) {
      smells.push({
        type: 'deep-nesting',
        line: i + 1,
        message: `nesting depth ${lineDepth} exceeds ${maxDepth} (consider guard clauses / extract function)`,
      });
      deepestReported = true; // report once to avoid noise
    }
    depth += opens - closes;
    if (depth < 0) depth = 0;
  });

  // --- Long functions: measure span from a function header to its matching close,
  //     or (brace-less languages) to the next blank line / dedent boundary. ---
  for (let i = 0; i < lines.length; i++) {
    if (!FUNC_RE.test(lines[i])) continue;
    const span = spanOfFunction(lines, i);
    if (span > maxLines) {
      smells.push({
        type: 'long-function',
        line: i + 1,
        message: `function spans ${span} lines, exceeds ${maxLines} (consider extract function)`,
      });
    }
    i += Math.max(0, span - 1); // skip past the counted body
  }

  return { ok: smells.length === 0, smells };
}

function spanOfFunction(lines, start) {
  const header = lines[start];
  if (header.includes('{')) {
    // brace-counted span
    let depth = 0, seen = false;
    for (let j = start; j < lines.length; j++) {
      depth += (lines[j].match(/\{/g) || []).length;
      depth -= (lines[j].match(/\}/g) || []).length;
      if (depth > 0) seen = true;
      if (seen && depth <= 0) return j - start + 1;
    }
    return lines.length - start;
  }
  // brace-less (e.g. Python): count until a blank line or a dedent to column 0
  const baseIndent = indentOf(header);
  let j = start + 1;
  for (; j < lines.length; j++) {
    const ln = lines[j];
    if (ln.trim() === '') break;
    if (indentOf(ln) <= baseIndent && ln.trim() !== '') break;
  }
  return j - start;
}

function indentOf(line) {
  const m = line.match(/^(\s*)/);
  return m ? m[1].length : 0;
}

function report(label, code) {
  const { ok, smells } = detectSmells(code);
  if (ok) {
    console.log(`✓ ${label}: no structural smells detected`);
  } else {
    console.error(`✗ ${label}: ${smells.length} smell(s) found`);
    for (const s of smells) console.error(`    - [${s.type}] line ${s.line}: ${s.message}`);
  }
  return ok;
}

function selftest() {
  const smelly = [
    'function f(a) {',
    '  if (a) {',
    '    if (a.b) {',
    '      if (a.b.c) {',          // depth 4 -> deep nesting
    '        return a.b.c;',
    '      }',
    '    }',
    '  }',
    '}',
  ].join('\n');

  const longFn = 'function big() {\n' + Array.from({ length: 30 }, (_, i) => `  const x${i} = ${i};`).join('\n') + '\n}';

  const clean = [
    'function priceFor(order) {',
    '  if (order == null) throw new Error("no order");',
    '  if (order.items.length === 0) throw new Error("empty");',
    '  return order.subtotal - order.discount;',
    '}',
  ].join('\n');

  const cases = [
    ['smelly_nesting', smelly, false],
    ['smelly_long_function', longFn, false],
    ['clean', clean, true],
  ];

  let allPass = true;
  for (const [name, code, expectOk] of cases) {
    const { ok } = detectSmells(code);
    const correct = ok === expectOk;
    allPass &&= correct;
    console.log(`${correct ? '✓' : '✗'} selftest ${name}: ${ok ? 'clean' : 'smelly'} (expected ${expectOk ? 'clean' : 'smelly'})`);
  }
  process.exit(allPass ? 0 : 1);
}

const arg = process.argv[2];
if (arg === '--selftest') selftest();
else if (arg) process.exit(report('code', arg) ? 0 : 1);
else {
  let buf = '';
  process.stdin.on('data', (c) => (buf += c));
  process.stdin.on('end', () => process.exit(report('stdin', buf) ? 0 : 1));
}

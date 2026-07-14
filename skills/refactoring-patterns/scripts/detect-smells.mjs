#!/usr/bin/env node
// detect-smells.mjs — a tiny, dependency-free heuristic scanner that flags two
// structural smells in a code string: long functions and deep nesting. It is a
// teaching aid, not a real linter — it works on brace/indent heuristics, so it
// is intentionally conservative.
//
// Usage:
//   node detect-smells.mjs '<code string>'        # scan a literal string
//   echo '<code>' | node detect-smells.mjs        # scan from stdin
//   node detect-smells.mjs --selftest             # run built-in cases (exit 0/1)
//
// Thresholds (tunable):
const MAX_FUNCTION_LINES = 25; // longer than this -> "long function"
const MAX_NESTING_DEPTH = 4;   // deeper brace nesting than this -> "deep nesting"

// Scan a code string and return an array of { type, message, line } findings.
export function detectSmells(code, {
  maxFunctionLines = MAX_FUNCTION_LINES,
  maxNestingDepth = MAX_NESTING_DEPTH,
} = {}) {
  const lines = code.split(/\r?\n/);
  const findings = [];

  // --- deep nesting: track running brace depth ---
  let depth = 0;
  let maxSeenDepth = 0;
  let deepLine = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const ch of line) {
      if (ch === "{") {
        depth++;
        if (depth > maxSeenDepth) { maxSeenDepth = depth; deepLine = i + 1; }
      } else if (ch === "}") {
        depth = Math.max(0, depth - 1);
      }
    }
  }
  if (maxSeenDepth > maxNestingDepth) {
    findings.push({
      type: "deep-nesting",
      message: `nesting depth ${maxSeenDepth} exceeds ${maxNestingDepth} (consider guard clauses)`,
      line: deepLine,
    });
  }

  // --- long function: brace-counted spans from a function header ---
  const fnHeader = /\b(function\b|=>\s*\{|\)\s*\{)/;
  for (let i = 0; i < lines.length; i++) {
    if (!fnHeader.test(lines[i]) || !lines[i].includes("{")) continue;
    let d = 0, started = false, span = 0, startLine = i + 1;
    for (let j = i; j < lines.length; j++) {
      for (const ch of lines[j]) {
        if (ch === "{") { d++; started = true; }
        else if (ch === "}") d--;
      }
      if (started) { span++; if (d <= 0) break; }
    }
    if (span > maxFunctionLines) {
      findings.push({
        type: "long-function",
        message: `function spanning ${span} lines exceeds ${maxFunctionLines} (consider Extract Function)`,
        line: startLine,
      });
    }
  }

  return findings;
}

function report(label, code) {
  const findings = detectSmells(code);
  if (findings.length === 0) {
    console.log(`✓ ${label}: no smells detected`);
    return true;
  }
  console.error(`✗ ${label}: ${findings.length} smell(s)`);
  for (const f of findings) console.error(`    - [${f.type}] line ${f.line}: ${f.message}`);
  return false;
}

function selftest() {
  const clean = `
function add(a, b) {
  return a + b;
}`;

  const smelly = `
function process(x) {
  if (x) {
    if (x.a) {
      if (x.b) {
        if (x.c) {
          if (x.d) {
            return x.a + x.b + x.c + x.d;
          }
        }
      }
    }
  }
  return 0;
}`;

  const longFn =
    "function big() {\n" +
    Array.from({ length: 30 }, (_, i) => `  const v${i} = ${i};`).join("\n") +
    "\n  return 0;\n}";

  const cases = [
    { name: "clean (no smells)", code: clean, expectSmells: false },
    { name: "deeply nested", code: smelly, expectSmells: true },
    { name: "long function", code: longFn, expectSmells: true },
  ];

  let allOk = true;
  for (const c of cases) {
    const found = detectSmells(c.code);
    const hasSmells = found.length > 0;
    const ok = hasSmells === c.expectSmells;
    allOk = allOk && ok;
    console.log(
      `${ok ? "✓" : "✗"} selftest ${c.name}: ${hasSmells ? `${found.length} smell(s)` : "clean"} ` +
      `(expected ${c.expectSmells ? "smells" : "clean"})`
    );
    if (!ok) for (const f of found) console.log(`      [${f.type}] line ${f.line}: ${f.message}`);
  }
  process.exit(allOk ? 0 : 1);
}

const arg = process.argv[2];
if (arg === "--selftest") selftest();
else if (arg) process.exit(report("code", arg) ? 0 : 1);
else {
  let buf = "";
  process.stdin.on("data", (c) => (buf += c));
  process.stdin.on("end", () => process.exit(report("stdin", buf) ? 0 : 1));
}

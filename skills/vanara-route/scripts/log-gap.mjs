#!/usr/bin/env node
// Appends a missing-capability gap to ~/.vanara/gaps.jsonl — LOCAL ONLY, nothing
// is sent anywhere. `vanara request` later lets the user submit these on purpose.
//   node log-gap.mjs "short capability that was missing"   |   --selftest
import { appendFileSync, mkdirSync, readFileSync, existsSync, mkdtempSync, rmSync, realpathSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

// Windows-safe direct-run check (see roster.mjs).
function isDirectRun() {
  try {
    return Boolean(process.argv[1]) &&
      realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch { return false; }
}

export function gapsPath(home = os.homedir()) {
  return path.join(home, ".vanara", "gaps.jsonl");
}

export function logGap(capability, { home = os.homedir(), now = new Date() } = {}) {
  const cap = String(capability ?? "").trim();
  if (!cap) throw new Error("empty capability");
  if (cap.length > 200) throw new Error("capability too long — keep it a short phrase");
  const file = gapsPath(home);
  mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  // De-dupe: skip if the same capability was already logged.
  if (existsSync(file)) {
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      if (!line.trim()) continue;
      try { if (JSON.parse(line).capability === cap) return { added: false, file }; } catch {}
    }
  }
  appendFileSync(file, `${JSON.stringify({ ts: now.toISOString(), capability: cap })}\n`, "utf8");
  return { added: true, file };
}

function selftest() {
  const home = mkdtempSync(path.join(os.tmpdir(), "gap-"));
  const a = logGap("drift diagnosis", { home });
  const b = logGap("drift diagnosis", { home }); // dupe
  const ok = a.added === true && b.added === false;
  rmSync(home, { recursive: true, force: true });
  if (ok) { console.log("selftest ok"); process.exit(0); }
  console.error("selftest FAILED"); process.exit(1);
}

if (process.argv.includes("--selftest")) selftest();
else if (isDirectRun()) {
  const cap = process.argv.slice(2).join(" ").trim();
  if (!cap) { console.error('usage: node log-gap.mjs "missing capability"'); process.exit(1); }
  const r = logGap(cap);
  console.log(r.added ? `logged gap → ${r.file}` : "already logged (skipped duplicate)");
  console.log("submit it any time with:  vanara request");
}

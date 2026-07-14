#!/usr/bin/env node
// Records an orchestration stage result so a gated pipeline is auditable and
// resumable. Appends to .claude/vanara-orchestration.log in the project.
//   node checkpoint.mjs <workflow> <stage> <pass|fail> ["note"]   |   --selftest
import { appendFileSync, mkdirSync, readFileSync, existsSync, mkdtempSync, rmSync, realpathSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const LOG = path.join(".claude", "vanara-orchestration.log");
const RESULTS = new Set(["pass", "fail"]);

export function checkpoint(workflow, stage, result, note = "", { root = process.cwd(), now = new Date() } = {}) {
  const wf = String(workflow ?? "").trim();
  const st = String(stage ?? "").trim();
  const res = String(result ?? "").trim().toLowerCase();
  if (!wf || !st) throw new Error("usage: checkpoint <workflow> <stage> <pass|fail> [note]");
  if (!RESULTS.has(res)) throw new Error(`result must be pass or fail, got "${res}"`);
  const file = path.join(root, LOG);
  mkdirSync(path.dirname(file), { recursive: true });
  const line = `${now.toISOString()} ${wf}/${st} ${res.toUpperCase()}${note ? ` — ${note}` : ""}`;
  appendFileSync(file, `${line}\n`, "utf8");
  return { line, file };
}

/** Read back the stages recorded for a workflow (for resume). */
export function history(workflow, root = process.cwd()) {
  const file = path.join(root, LOG);
  if (!existsSync(file)) return [];
  const out = [];
  for (const raw of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = raw.match(/^(\S+)\s+(\S+)\/(\S+)\s+(PASS|FAIL)(?:\s+—\s+(.+))?$/);
    if (m && m[2] === workflow) out.push({ ts: m[1], stage: m[3], result: m[4], note: m[5] ?? "" });
  }
  return out;
}

function isDirectRun() {
  try {
    return Boolean(process.argv[1]) &&
      realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch { return false; }
}

function selftest() {
  const root = mkdtempSync(path.join(os.tmpdir(), "orch-"));
  checkpoint("fix-defect", "review", "pass", "no blocking findings", { root });
  const h = history("fix-defect", root);
  let ok = h.length === 1 && h[0].stage === "review" && h[0].result === "PASS";
  try { checkpoint("x", "y", "maybe", "", { root }); ok = false; } catch { /* expected */ }
  rmSync(root, { recursive: true, force: true });
  if (ok) { console.log("selftest ok"); process.exit(0); }
  console.error("selftest FAILED"); process.exit(1);
}

if (process.argv.includes("--selftest")) selftest();
else if (isDirectRun()) {
  const [workflow, stage, result, ...note] = process.argv.slice(2);
  try {
    const { line, file } = checkpoint(workflow, stage, result, note.join(" "));
    console.log(`✓ ${line}`);
    console.log(`  → ${file}`);
  } catch (err) { console.error(err.message); process.exit(1); }
}

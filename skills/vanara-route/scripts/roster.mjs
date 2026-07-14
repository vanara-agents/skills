#!/usr/bin/env node
// Lists installed Vanara agents (name + description) so the router can score
// them against a task. Reads .claude/agents/*.md in the current project.
//   node roster.mjs [--json] [--dir <project-root>]  |  --selftest
import { readdirSync, readFileSync, existsSync, statSync, mkdtempSync, writeFileSync, mkdirSync, rmSync, realpathSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

// Cross-platform "is this file being run directly?" — compare canonical paths.
// A plain string/URL compare breaks on Windows (backslashes, drive-letter case,
// 8.3 short names in TEMP); realpathSync normalizes both sides.
function isDirectRun() {
  try {
    return Boolean(process.argv[1]) &&
      realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch { return false; }
}

function frontmatter(md) {
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const out = {};
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(":");
    if (i === -1) continue;
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

export function readRoster(root = process.cwd()) {
  const dir = path.join(root, ".claude", "agents");
  if (!existsSync(dir)) return [];
  const agents = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    let file = null;
    if (entry.endsWith(".md")) file = full;
    else if (statSync(full).isDirectory()) {
      const a = path.join(full, "AGENT.md");
      if (existsSync(a)) file = a;
    }
    if (!file) continue;
    const fm = frontmatter(readFileSync(file, "utf8"));
    if (fm.name) agents.push({ name: fm.name, description: fm.description ?? "" });
  }
  return agents.sort((a, b) => a.name.localeCompare(b.name));
}

function selftest() {
  const tmp = mkdtempSync(path.join(os.tmpdir(), "roster-"));
  mkdirSync(path.join(tmp, ".claude", "agents"), { recursive: true });
  writeFileSync(
    path.join(tmp, ".claude", "agents", "code-reviewer.md"),
    "---\nname: code-reviewer\ndescription: Reviews diffs.\n---\nbody",
  );
  const r = readRoster(tmp);
  rmSync(tmp, { recursive: true, force: true });
  if (r.length === 1 && r[0].name === "code-reviewer") { console.log("selftest ok"); process.exit(0); }
  console.error("selftest FAILED", r); process.exit(1);
}

if (process.argv.includes("--selftest")) selftest();
else if (isDirectRun()) {
  const dirFlag = process.argv.indexOf("--dir");
  const root = dirFlag !== -1 ? process.argv[dirFlag + 1] : process.cwd();
  const roster = readRoster(root);
  if (process.argv.includes("--json")) console.log(JSON.stringify(roster, null, 2));
  else {
    if (!roster.length) console.log("(no installed agents — run: npx vanara install <name>)");
    for (const a of roster) console.log(`${a.name} — ${a.description.slice(0, 100)}`);
  }
}

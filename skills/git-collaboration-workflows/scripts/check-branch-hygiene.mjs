#!/usr/bin/env node
// Repo hygiene audit: stale branches, oversized in-flight work, non-linear
// history, and tracked build artifacts. Read-only. Run inside any git repo:
//   node scripts/check-branch-hygiene.mjs [repo-path]
import { execFileSync } from 'node:child_process';

const repo = process.argv[2] ?? process.cwd();
const git = (...args) => {
  try { return execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8' }).trim(); }
  catch { return ''; }
};

if (!git('rev-parse', '--is-inside-work-tree')) {
  console.error(`Not a git repo: ${repo}`);
  process.exit(1);
}

const findings = [];
const DAY = 86_400_000;
const main = git('symbolic-ref', 'refs/remotes/origin/HEAD').split('/').pop() ||
             (git('rev-parse', '--verify', 'main') ? 'main' : 'master');

// 1. Stale local branches (> 14 days since last commit, not merged into main)
const branches = git('for-each-ref', 'refs/heads', '--format=%(refname:short)|%(committerdate:iso8601)')
  .split('\n').filter(Boolean).map((l) => { const [name, date] = l.split('|'); return { name, date: new Date(date) }; });
for (const b of branches) {
  if (b.name === main) continue;
  const ageDays = Math.floor((Date.now() - b.date) / DAY);
  const merged = git('branch', '--merged', main).includes(b.name);
  if (merged && b.name !== main) findings.push(`merged-but-undeleted branch: ${b.name} — delete it`);
  else if (ageDays > 14) findings.push(`stale branch: ${b.name} (${ageDays}d old) — rebase & land in slices, or delete`);
  else if (ageDays > 2) findings.push(`aging branch: ${b.name} (${ageDays}d) — branch-age rule is <2 days`);
}

// 2. Oversized undelivered work on current branch vs main
const current = git('rev-parse', '--abbrev-ref', 'HEAD');
if (current && current !== main) {
  const stat = git('diff', '--shortstat', `${main}...HEAD`);
  const changed = [...stat.matchAll(/(\d+) (insertion|deletion)/g)].reduce((s, m) => s + Number(m[1]), 0);
  if (changed > 400) findings.push(`current branch carries ${changed} changed lines vs ${main} — split (≤400/PR)`);
}

// 3. Non-linear history in recent main (merge commits other than PR merges pattern)
const merges = git('log', main, '--merges', '--oneline', '-n', '200').split('\n').filter(Boolean);
if (merges.length > 50) findings.push(`${merges.length}/200 recent ${main} commits are merge commits — consider squash/linear policy`);

// 4. Tracked files that look like build artifacts or secrets-adjacent
const tracked = git('ls-files').split('\n');
const artifactRe = /^(dist|build|out|node_modules)\/|\.(log|tmp)$/;
const secretRe = /(^|\/)\.env(\.|$)|id_rsa|\.pem$/;
const artifacts = tracked.filter((f) => artifactRe.test(f)).slice(0, 5);
const secretish = tracked.filter((f) => secretRe.test(f) && !f.endsWith('.example')).slice(0, 5);
if (artifacts.length) findings.push(`build artifacts tracked: ${artifacts.join(', ')} — .gitignore + git rm --cached`);
if (secretish.length) findings.push(`SECRET-SHAPED tracked files: ${secretish.join(', ')} — rotate + scrub (see history-hygiene.md)`);

// Report
if (findings.length === 0) {
  console.log(`Hygiene clean: ${branches.length} branches, ${main} linear-enough, no artifacts tracked.`);
} else {
  console.log(`Hygiene findings (${findings.length}):\n` + findings.map((f) => `  - ${f}`).join('\n'));
}
process.exit(secretish.length ? 1 : 0); // only secret-shaped files fail the check hard

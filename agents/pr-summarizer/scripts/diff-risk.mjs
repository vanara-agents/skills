#!/usr/bin/env node
// Runnable check: flags risk areas from a diff-stat-like JSON so a PR summarizer (human or
// agent) can mechanically surface migrations, secret-like additions, and oversized changes
// before writing the summary. Mirrors the --selftest convention of review-guard.mjs.
//
// Input shape (a "diff stat"):
//   {
//     "files": [
//       { "path": "migrations/0007_api_keys.sql", "added": 40, "removed": 0,
//         "addedLines": ["ALTER TABLE accounts ADD COLUMN api_key_id ..."] }
//     ]
//   }
// `added`/`removed` are line counts; `addedLines` (optional) are the raw added lines, used to
// sniff secret-like content.
//
// Usage:
//   node diff-risk.mjs '<json>'            # check a literal JSON string
//   echo '<json>' | node diff-risk.mjs     # check from stdin
//   node diff-risk.mjs --selftest          # run built-in test cases

const LARGE_CHANGE_LINES = 400;            // total added+removed above this is a "large change"
const MIGRATION_RE = /(^|\/)(migrations?|migrate)(\/|_)|\.(sql)$/i;
const SECRET_RE = /(api[_-]?key|secret|password|passwd|token|private[_-]?key)\s*[:=]|-----BEGIN|AKIA[0-9A-Z]{16}/i;

export function diffRisk(stat) {
  const flags = [];
  const files = (stat && Array.isArray(stat.files)) ? stat.files : [];
  for (const f of files) {
    const path = f.path ?? '<unknown>';
    const added = typeof f.added === 'number' ? f.added : 0;
    const removed = typeof f.removed === 'number' ? f.removed : 0;

    if (MIGRATION_RE.test(path)) {
      flags.push({ kind: 'MIGRATION', where: path,
        msg: 'database migration — verify it runs cleanly against a non-empty production table' });
    }

    const lines = Array.isArray(f.addedLines) ? f.addedLines : [];
    for (const line of lines) {
      if (typeof line === 'string' && SECRET_RE.test(line)) {
        flags.push({ kind: 'SECRET', where: path,
          msg: `possible hardcoded secret in an added line: ${line.trim().slice(0, 60)}` });
        break; // one flag per file is enough to make a human look
      }
    }

    if (added + removed > LARGE_CHANGE_LINES) {
      flags.push({ kind: 'LARGE', where: path,
        msg: `large change (+${added}/-${removed}); confirm it isn't mixing unrelated concerns` });
    }
  }
  return { ok: flags.length === 0, flags };
}

function check(label, json) {
  let stat;
  try { stat = typeof json === 'string' ? JSON.parse(json) : json; }
  catch { console.error(`x ${label}: invalid JSON`); return false; }
  const { ok, flags } = diffRisk(stat);
  if (ok) console.log(`ok ${label}: no migration / secret / large-change risks flagged`);
  else {
    console.error(`! ${label}: ${flags.length} risk flag(s)`);
    flags.forEach((v) => console.error(`    [${v.kind}] ${v.where} - ${v.msg}`));
  }
  return ok;
}

function selftest() {
  const cases = {
    clean: {
      files: [
        { path: 'src/util.js', added: 20, removed: 5, addedLines: ['const x = 1;'] },
      ],
    },
    migration: {
      files: [
        { path: 'migrations/0007_api_keys.sql', added: 40, removed: 0,
          addedLines: ['ALTER TABLE accounts ADD COLUMN api_key_id INT NOT NULL;'] },
      ],
    },
    secret: {
      files: [
        { path: 'config/app.js', added: 3, removed: 0,
          addedLines: ['const apiKey = "sk_live_abc123";'] },
      ],
    },
    large: {
      files: [
        { path: 'src/huge.js', added: 350, removed: 120, addedLines: ['ok'] },
      ],
    },
  };
  let allExpected = true;
  for (const [name, payload] of Object.entries(cases)) {
    const { ok } = diffRisk(payload);
    const shouldPass = name === 'clean';
    const correct = ok === shouldPass;
    allExpected &&= correct;
    console.log(`${correct ? 'ok' : 'x'} selftest ${name}: ${ok ? 'clean' : 'flagged'} (expected ${shouldPass ? 'clean' : 'flagged'})`);
  }
  process.exit(allExpected ? 0 : 1);
}

const arg = process.argv[2];
if (arg === '--selftest') selftest();
else if (arg) process.exit(check('diff-stat', arg) ? 0 : 1);
else {
  let buf = '';
  process.stdin.on('data', (c) => (buf += c));
  process.stdin.on('end', () => process.exit(check('stdin', buf) ? 0 : 1));
}

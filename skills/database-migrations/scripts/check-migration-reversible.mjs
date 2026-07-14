#!/usr/bin/env node
// Runnable check: scans a migration's SQL text for safety problems —
//   1. irreversible statements (DROP COLUMN/TABLE, TRUNCATE) that destroy data
//   2. missing a down-migration (no "-- DOWN" / "== DOWN" section)
//   3. risky operations that should be made non-blocking (plain CREATE INDEX)
//
// Usage:
//   node check-migration-reversible.mjs path/to/migration.sql
//   cat migration.sql | node check-migration-reversible.mjs
//   node check-migration-reversible.mjs --selftest    # built-in test cases
//
// Exit code: 0 = no blocking issues, 1 = blocking issue (or selftest failed).

import { readFileSync } from 'node:fs';

const IRREVERSIBLE = [
  [/\bDROP\s+COLUMN\b/i, 'DROP COLUMN destroys data — irreversible; isolate it and back up first'],
  [/\bDROP\s+TABLE\b/i, 'DROP TABLE destroys data — irreversible; back up before running'],
  [/\bTRUNCATE\b/i, 'TRUNCATE deletes all rows irrecoverably — irreversible'],
];

const WARNINGS = [
  [/\bCREATE\s+INDEX\b(?!\s+CONCURRENTLY)(?![^\n]*CONCURRENTLY)/i,
    'plain CREATE INDEX locks the table — prefer CREATE INDEX CONCURRENTLY'],
];

// Strip line/block comments so a statement mentioned in a comment isn't flagged,
// but keep section markers detectable separately (we test the raw text for those).
function stripComments(sql) {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, ' ')   // block comments
    .replace(/--[^\n]*/g, ' ');          // line comments
}

const DOWN_MARKER = /(^|\n)[^\S\n]*(--+\s*)?(==+\s*)?DOWN\b/i;

function hasDownSection(rawSql) {
  return DOWN_MARKER.test(rawSql) || /\bMIGRATE\s+DOWN\b/i.test(rawSql);
}

// The UP section is what runs against live data; a DROP COLUMN there is
// destructive. The DOWN section legitimately reverses an additive UP (e.g. an
// ADD COLUMN's down IS a DROP COLUMN), so only the UP portion is scanned for
// irreversible/risky statements.
function upSection(rawSql) {
  const m = DOWN_MARKER.exec(rawSql);
  return m ? rawSql.slice(0, m.index) : rawSql;
}

export function analyze(rawSql) {
  const code = stripComments(upSection(rawSql));
  const errors = [];
  const warnings = [];

  for (const [re, msg] of IRREVERSIBLE) {
    if (re.test(code)) errors.push(`irreversible: ${msg}`);
  }
  const irreversible = errors.length > 0;

  // A down-migration is required UNLESS the change is irreversible (a faked
  // "down" for an irreversible op is worse than none — see rollback-and-safety).
  if (!irreversible && !hasDownSection(rawSql)) {
    errors.push('missing down-migration: add a "-- DOWN" section or mark reversibility');
  }

  for (const [re, msg] of WARNINGS) {
    if (re.test(code)) warnings.push(`risky: ${msg}`);
  }

  return { ok: errors.length === 0, errors, warnings, irreversible };
}

function report(label, sql) {
  const { ok, errors, warnings } = analyze(sql);
  if (ok) console.log(`✓ ${label}: no blocking issues`);
  else {
    console.error(`✗ ${label}:`);
    errors.forEach((e) => console.error(`    - ${e}`));
  }
  warnings.forEach((w) => console.warn(`    ! ${label}: ${w}`));
  return ok;
}

function selftest() {
  const cases = {
    pass_add_column_reversible: {
      sql: '-- UP\nALTER TABLE t ADD COLUMN x int NULL;\n-- DOWN\nALTER TABLE t DROP COLUMN x;',
      shouldPass: true,
    },
    pass_concurrent_index: {
      sql: '-- UP\nCREATE INDEX CONCURRENTLY i ON t (x);\n-- DOWN\nDROP INDEX CONCURRENTLY i;',
      shouldPass: true,
    },
    pass_drop_in_comment_only: {
      // "DROP TABLE" appears ONLY inside a comment; real statements are additive
      // with a valid down. Comment-stripping must prevent a false positive.
      sql: '-- NOTE: this does NOT drop table t\n-- UP\nALTER TABLE t ADD COLUMN y int NULL;\n-- DOWN\nALTER TABLE t ALTER COLUMN y DROP DEFAULT;',
      shouldPass: true,
    },
    fail_drop_table: {
      sql: '-- UP\nDROP TABLE legacy;',
      shouldPass: false,
    },
    fail_truncate: {
      sql: '-- UP\nTRUNCATE audit_log;',
      shouldPass: false,
    },
    fail_missing_down: {
      sql: '-- UP\nALTER TABLE t ADD COLUMN z int NULL;',
      shouldPass: false,
    },
  };

  let allOk = true;
  for (const [name, { sql, shouldPass }] of Object.entries(cases)) {
    const { ok } = analyze(sql);
    const correct = ok === shouldPass;
    allOk = allOk && correct;
    console.log(
      `${correct ? '✓' : '✗'} selftest ${name}: ${ok ? 'pass' : 'fail'} ` +
      `(expected ${shouldPass ? 'pass' : 'fail'})`
    );
  }
  process.exit(allOk ? 0 : 1);
}

const arg = process.argv[2];
if (arg === '--selftest') {
  selftest();
} else if (arg) {
  let sql;
  try { sql = readFileSync(arg, 'utf8'); }
  catch { console.error(`cannot read file: ${arg}`); process.exit(1); }
  process.exit(report(arg, sql) ? 0 : 1);
} else {
  let buf = '';
  process.stdin.on('data', (c) => (buf += c));
  process.stdin.on('end', () => process.exit(report('stdin', buf) ? 0 : 1));
}

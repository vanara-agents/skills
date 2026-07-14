#!/usr/bin/env node
// Runnable check for the opaque-cursor contract (encode -> decode -> tamper -> version).
// Usage: node scripts/check-cursor.mjs   (exits 0 on pass, 1 on first failure)
import { createHmac } from 'node:crypto';

const KEY = 'demo-key-rotate-me';
const VERSION = 'v1';

const b64u = (buf) => Buffer.from(buf).toString('base64url');
const sign = (s) => createHmac('sha256', KEY).update(s).digest('hex').slice(0, 20);

export function encodeCursor(keyValues, direction = 'desc') {
  const payload = b64u(JSON.stringify({ k: keyValues, d: direction }));
  return `${VERSION}.${payload}.${sign(VERSION + payload)}`;
}

export function decodeCursor(token) {
  const [version, payload, mac] = String(token).split('.');
  if (version !== VERSION) return { error: 'CURSOR_INVALID' }; // unknown version
  if (!payload || sign(version + payload) !== mac) return { error: 'CURSOR_INVALID' };
  try {
    const { k, d } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!Array.isArray(k) || !['asc', 'desc'].includes(d)) return { error: 'CURSOR_INVALID' };
    return { keyValues: k, direction: d };
  } catch {
    return { error: 'CURSOR_INVALID' };
  }
}

let failed = 0;
const check = (name, ok) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (!ok) failed = 1;
};

// Round trip preserves full timestamp precision and the tiebreaker.
const token = encodeCursor(['2026-07-01T12:00:00.412Z', 4711]);
const out = decodeCursor(token);
check('round-trip', out.keyValues?.[1] === 4711 && out.keyValues?.[0].endsWith('.412Z'));
check('url-safe (no + / =)', !/[+/=]/.test(token));

// Tampered payload must be rejected, not half-parsed.
const [v, p, m] = token.split('.');
check('tamper detected', decodeCursor(`${v}.${p.slice(0, -2)}xx.${m}`).error === 'CURSOR_INVALID');

// Unknown version and garbage are client errors, never crashes.
check('unknown version rejected', decodeCursor(`v9.${p}.${m}`).error === 'CURSOR_INVALID');
check('garbage rejected', decodeCursor('not-a-cursor').error === 'CURSOR_INVALID');
check('empty rejected', decodeCursor('').error === 'CURSOR_INVALID');

process.exit(failed);

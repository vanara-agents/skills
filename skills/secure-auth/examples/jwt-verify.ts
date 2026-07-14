// jwt-verify.ts
//
// A dependency-light illustration of how to verify a JWT *correctly*. In production
// you would use a maintained library (e.g. `jose`) plus JWKS fetching/caching — this
// file shows the checks that library performs so you know what "good" looks like and
// can audit a hand-rolled verifier. It uses only the Node built-in `crypto` module.
//
// SECURITY NOTES (the parts people get wrong):
//   1. PIN the algorithm. Never trust the token's own `alg` header — an attacker can
//      set `alg: none` or switch RS256 -> HS256 and sign with the public key.
//   2. ALWAYS verify the signature BEFORE reading any claim as trusted.
//   3. Check `iss`, `aud`, and `exp` (and `nbf`/`iat`) — a valid signature on a token
//      meant for a different audience is still not for you.

import { createHmac, timingSafeEqual } from 'node:crypto';

interface VerifyOptions {
  secret: string;          // HMAC secret (HS256). For RS256 you'd verify with a public key.
  issuer: string;          // expected `iss`
  audience: string;        // expected `aud`
  now?: number;            // injectable clock (seconds) for testing
}

interface JwtClaims {
  iss?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  sub?: string;
  [k: string]: unknown;
}

function b64urlDecode(part: string): Buffer {
  return Buffer.from(part.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

function b64urlEncode(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function verifyJwtHS256(token: string, opts: VerifyOptions): JwtClaims {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('malformed token: expected 3 segments');
  const [headerB64, payloadB64, signatureB64] = parts;

  // 1. Pin the algorithm — reject whatever the header claims if it isn't ours.
  const header = JSON.parse(b64urlDecode(headerB64).toString('utf8'));
  if (header.alg !== 'HS256') throw new Error(`unexpected alg: ${header.alg}`);

  // 2. Recompute and compare the signature in constant time.
  const expected = createHmac('sha256', opts.secret)
    .update(`${headerB64}.${payloadB64}`)
    .digest();
  const provided = b64urlDecode(signatureB64);
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    throw new Error('invalid signature');
  }

  // 3. Only now is it safe to read claims as trusted.
  const claims: JwtClaims = JSON.parse(b64urlDecode(payloadB64).toString('utf8'));
  const now = opts.now ?? Math.floor(Date.now() / 1000);

  if (claims.iss !== opts.issuer) throw new Error('issuer mismatch');
  const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!aud.includes(opts.audience)) throw new Error('audience mismatch');
  if (typeof claims.exp === 'number' && now >= claims.exp) throw new Error('token expired');
  if (typeof claims.nbf === 'number' && now < claims.nbf) throw new Error('token not yet valid');

  return claims;
}

// Tiny demo helper to mint a token for local experimentation (NOT for production use).
export function signJwtHS256(claims: JwtClaims, secret: string): string {
  const header = b64urlEncode(Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const payload = b64urlEncode(Buffer.from(JSON.stringify(claims)));
  const sig = b64urlEncode(createHmac('sha256', secret).update(`${header}.${payload}`).digest());
  return `${header}.${payload}.${sig}`;
}

// Example (fake secret — never hardcode real secrets; load from a secrets manager):
//   const SECRET = process.env.JWT_SECRET!;
//   const token = signJwtHS256(
//     { iss: 'https://auth.example.com', aud: 'my-api', sub: 'user-123',
//       exp: Math.floor(Date.now() / 1000) + 600 },
//     SECRET,
//   );
//   const claims = verifyJwtHS256(token, {
//     secret: SECRET, issuer: 'https://auth.example.com', audience: 'my-api',
//   });

# A10 SSRF & A04 Insecure Design

## A10 — Server-Side Request Forgery
SSRF: the server makes a request to a URL the attacker controls, letting them reach internal systems
(cloud metadata endpoints, internal admin services) from inside your trust boundary.

```js
// VULNERABLE
const data = await fetch(req.query.url);

// FIXED
const url = new URL(req.query.url);
if (url.protocol !== 'https:') throw new Error('only https');
if (!ALLOWED_HOSTS.has(url.hostname)) throw new Error('host not allowed');
// resolve DNS and reject private/link-local ranges to defeat DNS rebinding:
//   127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16
```

Defenses:
- **Allow-list** destination hosts; don't try to blocklist "internal" by string.
- **Resolve and check the IP**, not just the hostname (rebinding maps a public name to a private IP).
- **Block cloud metadata** (`169.254.169.254`) explicitly.
- Disable unneeded URL schemes (`file:`, `gopher:`).

## A04 — Insecure Design
Some vulnerabilities aren't bugs in code — they're missing security in the *design*. No amount of clean
code fixes a feature that was unsafe by conception (e.g. a password-reset flow that leaks whether an
account exists, or unlimited money transfers without limits).

Defenses:
- **Threat model before building** (use the `threat-modeler` agent): assets, trust boundaries, STRIDE.
- **Secure defaults** and abuse-case thinking ("how would someone misuse this?").
- **Rate limits, quotas, and integrity checks** designed in, not bolted on.

You can audit code for A03; you must *design* against A04.

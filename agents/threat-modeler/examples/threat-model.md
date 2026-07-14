# Threat Model — "QuickCheckout" Checkout Service

A complete, worked threat model for a small checkout service. Use it as a template for shape and depth.

## 1. Scope & assets

**In scope:** the public checkout API, its auth, the orders and session stores, and the Stripe
integration. **Out of scope:** the marketing site, internal analytics pipeline.

**Assets (ranked):**
1. Customers' stored payment method tokens and order/PII data — highest value.
2. Account credentials / session tokens.
3. Integrity of order and refund records (financial correctness).
4. Service availability during a sale.

**Adversaries:** unauthenticated external attacker; authenticated malicious customer (abuse/IDOR);
compromised third-party JS dependency; opportunistic bot networks.

## 2. Data-flow diagram

```text
TRUST BOUNDARY: Internet  ││  Private network

  (E1) Browser ──1: POST /login──────────►││──► (P2) Auth Service ──3: read/write──►││──► (DS3) User DB
       │                                  ││         │                              ││
       │                                  ││         └──4: read/write session──────►││──► (DS4) Session Cache
       │                                  ││
       └──2: POST /checkout (JWT)─────────►││──► (P5) Order API ──6: SQL────────────►││──► (DS6) Orders DB
                                          ││         │
                                          ││         ├──7: append──────────────────►││──► (DS7) Audit Log
                                          ││         │
                                          ││         └──8: POST /charge─────────────►││──► (E8) Stripe API
  Legend: (E)=external entity (P)=process (DS)=data store  N: flow  ││ = trust boundary
```

## 3. STRIDE threat table

```text
| ID  | Element              | STRIDE | Threat                                          | L | I | Sev | Decision  |
|-----|----------------------|--------|-------------------------------------------------|---|---|-----|-----------|
| T1  | (2) /checkout flow   | T      | SQL injection via cart item id into Orders DB   | 3 | 3 | 9   | Mitigate  |
| T2  | (P2) Auth Service    | S      | Credential stuffing against /login              | 3 | 2 | 6   | Mitigate  |
| T3  | (2) /checkout (JWT)  | E      | IDOR: user A submits order referencing user B   | 3 | 3 | 9   | Mitigate  |
| T4  | (DS4) Session Cache  | I      | Session tokens readable in Redis at rest        | 2 | 3 | 6   | Mitigate  |
| T5  | (DS7) Audit Log      | R      | User disputes refund; log row is editable       | 2 | 2 | 4   | Mitigate  |
| T6  | (8) Stripe flow      | I      | Card data passes through our server unnecessarily| 2 | 3 | 6  | Avoid     |
| T7  | (P5) Order API       | D      | Checkout flood exhausts DB connection pool      | 2 | 2 | 4   | Mitigate  |
| T8  | (E1) Browser         | T      | Compromised third-party JS skims card form      | 2 | 3 | 6   | Mitigate  |
| T9  | (P2) Auth Service    | I      | Verbose error reveals which emails are registered| 2 | 1 | 2  | Mitigate  |
```

## 4. Mitigations

```text
| Threat | Control                                                              | Verify by                                  |
|--------|----------------------------------------------------------------------|--------------------------------------------|
| T1     | Parameterized queries only; reject non-ULID item ids at boundary     | Static check + injection test in CI        |
| T2     | Per-account + per-IP rate limit, lockout, MFA option                  | Load test login; assert 429 after N tries  |
| T3     | Server-side ownership check: order.user_id == token.sub on every read | Authz test: user A cannot fetch B's order  |
| T4     | Encrypt session cache at rest; short TTL; rotate on privilege change  | Confirm KMS-backed encryption; TTL config  |
| T5     | Append-only audit store; logs outside app write path; signed rows    | Attempt UPDATE on audit row → denied        |
| T7     | Bounded conn pool + per-key rate limit + queue with back-pressure     | Stress test; assert graceful 429, no crash |
| T8     | Use Stripe-hosted fields/iframe; SRI on third-party scripts; CSP      | CSP report-only in staging; SRI hashes set |
| T9     | Generic "invalid credentials" response; constant-time compare        | Test login with unknown vs known email     |
```

## 5. Accepted / transferred risks

- **T6 (avoided):** card data will never transit our servers — we use Stripe Elements so the browser
  posts card details directly to Stripe. This *avoids* the threat (and most PCI scope) rather than
  mitigating it. Owner: Payments lead.
- **Volumetric DDoS at the network layer:** transferred to the CDN/WAF provider; accepted residual risk
  of brief degradation during an extreme flood. Owner: SRE on-call.

## 6. Top risks & riskiest assumption

**Fix before launch:** T1 (SQLi, sev 9), T3 (IDOR, sev 9), then T2 (credential stuffing, sev 6).

**Riskiest assumption to validate first:** that the JWT `sub` claim is validated server-side on *every*
order read and write. If any handler trusts a client-supplied `user_id` instead, T3 is exploitable
regardless of the other controls — verify this first.

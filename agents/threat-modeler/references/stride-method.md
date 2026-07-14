# The STRIDE Method

STRIDE is a threat-classification model created at Microsoft. Each letter names a category of threat
defined by the security property it violates. Walking every element of a system against all six
categories gives you systematic coverage instead of relying on whatever attacks you happen to think of.

## The six categories

| Category | Property violated | The attacker's goal | Example |
|---|---|---|---|
| **Spoofing** | Authentication | Pretend to be someone/something else | Forged JWT, stolen session, impersonated service identity |
| **Tampering** | Integrity | Modify data or code | Altered request body, poisoned cache, modified DB row |
| **Repudiation** | Non-repudiation | Deny having done something | No audit trail for a refund; logs are editable |
| **Information disclosure** | Confidentiality | Read data they shouldn't | PII in logs, verbose errors, IDOR exposing other users' records |
| **Denial of service** | Availability | Make the system unavailable | Connection flood, expensive query amplification, lock exhaustion |
| **Elevation of privilege** | Authorization | Gain rights they shouldn't have | Missing server-side authz check, path traversal, sandbox escape |

## Element-type → applicable categories

Not every category applies to every element type. Use this mapping so you don't waste effort (and don't
miss the relevant ones):

| Element type | S | T | R | I | D | E |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| External entity (user, third party) | ● | | ● | | | |
| Process (service, function) | ● | ● | ● | ● | ● | ● |
| Data store (DB, cache, queue, files) | | ● | ● | ● | ● | |
| Data flow (network call, IPC) | | ● | | ● | ● | |

A *process* is the most exposed element — all six categories apply. A *data store* can't be "spoofed"
(it has no identity to forge) but can be tampered with, leak data, be DoS'd, and may need to defend
against repudiation if it holds audit records.

## Per-element question checklist

For each element on the diagram, ask the questions for its applicable categories:

**Spoofing**
- How is this entity/process authenticated? Can the credential be stolen, replayed, or forged?
- Is mutual authentication needed for service-to-service calls?

**Tampering**
- Can a request, message, or stored record be modified in transit or at rest?
- Is integrity protected (TLS, signatures, HMAC, checksums)?

**Repudiation**
- Is there a tamper-evident audit log of security-relevant actions?
- Can a user or admin alter or delete the evidence of their own actions?

**Information disclosure**
- What sensitive data does this element hold or transmit? Who can read it?
- Do errors, logs, headers, or timing leak information? Is data encrypted at rest and in transit?

**Denial of service**
- What resource (CPU, memory, connections, locks, quota) can an attacker exhaust?
- Are there rate limits, timeouts, quotas, and back-pressure?

**Elevation of privilege**
- Is every action authorized server-side, checking *ownership* not just authentication (IDOR)?
- Can input cross a trust boundary into a more privileged context (injection, deserialization, traversal)?

## How STRIDE relates to DREAD and risk rating

STRIDE *finds and classifies* threats; it does not rate them. Pair it with a rating scheme — this package
uses a lightweight Likelihood × Impact score (see `AGENT.md` → Risk rating). DREAD (Damage,
Reproducibility, Exploitability, Affected users, Discoverability) is an alternative; it is more granular
but harder to apply consistently. For most design-time models, Likelihood × Impact is enough and more
repeatable across reviewers.

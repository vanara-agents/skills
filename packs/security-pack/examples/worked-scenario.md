# Worked scenario — A breach drill before the breach

How `security-pack` runs on a realistic engagement, member by member.

## The situation

New feature: user-uploaded files. Nobody has asked 'how does this get us owned?' yet.

## How the pack plays it

1. **`threat-modeler`** runs STRIDE on the upload path — spoofed content types, zip bombs, stored XSS via SVG.
2. **`security-auditor`** audits the implementation against the model; finds the S3 bucket policy wider than the design.
3. **`owasp-top10`** the skill maps each finding to its category with the canonical fix.
4. **`vuln-scanner`** catches the image-processing lib two CVEs behind.
5. **`secure-auth + secrets-management`** signed URLs replace the shared key that was headed for the client bundle.

## Outcome

The upload feature ships with the attack surface enumerated, tested, and closed — before an attacker enumerated it first.

> Install everything above at once: `npx vanara install security-pack`

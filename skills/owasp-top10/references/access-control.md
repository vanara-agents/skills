# A01 — Broken Access Control (in depth)

The most common serious web vulnerability. Authentication answers "who are you?"; authorization answers
"are you allowed to do *this*?" — and that second check is what's usually missing or wrong.

## Core rules
1. **Deny by default.** Every protected route/action requires an explicit allow.
2. **Enforce server-side.** Client-side checks (hiding a button) are UX, not security.
3. **Check ownership, not just login.** A logged-in user must not access another user's records.

## IDOR (Insecure Direct Object Reference)
Changing an identifier to access someone else's data:
```
GET /api/orders/1001   # mine
GET /api/orders/1002   # ...someone else's, if the server only checks that I'm logged in
```
Fix: verify the object belongs to the caller (or that the caller has a role permitting it) before returning it.

## Mass assignment
Binding a request body directly to a model lets attackers set fields you didn't intend:
```js
// VULNERABLE
user.update(req.body);            // attacker sends { "isAdmin": true }
// FIXED: allow-list bindable fields
const { name, email } = req.body;
user.update({ name, email });
```

## Function-level access control
Don't rely on hiding admin URLs ("security by obscurity"). Every admin endpoint must check the role
server-side; attackers will find and call the URL directly.

## Edge cases
- **404 vs 403:** return `404` for unauthorized access to existence-sensitive resources to prevent enumeration.
- **JWT/role tampering:** verify token signatures; never trust a role claim the client could forge.
- **CORS misconfig** can effectively broaden access — don't reflect arbitrary origins with credentials.

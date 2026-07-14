# Example: SQL Injection — Vulnerable vs Fixed

## Vulnerable
```js
// User-controlled `email` concatenated directly into SQL
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const row = db.query(
    `SELECT * FROM users WHERE email = '${email}' AND password = '${password}'`
  );
  // input  email = "' OR '1'='1' --"  ->  returns the first user, bypassing auth
});
```

## Fixed
```js
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const row = await db.query(
    'SELECT id, password_hash FROM users WHERE email = $1',
    [email]                        // bound parameter — treated strictly as data
  );
  if (!row || !(await argon2.verify(row.password_hash, password))) {
    return res.status(401).json({ error: { code: 'unauthorized', message: 'Invalid credentials' } });
  }
});
```

## What changed & edge cases
- **Parameterized query** — the driver sends the SQL and the data separately, so injected SQL can't execute.
- **No password in SQL** — verify a hash, never compare plaintext passwords in the query.
- **Generic error** — don't reveal whether the email or the password was wrong (avoids user enumeration).
- **Second-order:** even values you stored earlier must be parameterized when reused in a query.

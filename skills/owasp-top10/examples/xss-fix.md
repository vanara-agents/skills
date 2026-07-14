# Example: XSS — Vulnerable vs Fixed

## Vulnerable (DOM XSS)
```js
// Renders untrusted comment as HTML -> <img src=x onerror=stealCookies()> executes
commentEl.innerHTML = comment.text;
```

## Fixed
```js
// Assign as text — the browser never parses it as HTML
commentEl.textContent = comment.text;
```

## Fixed (when you must render rich HTML)
```js
import DOMPurify from 'dompurify';
commentEl.innerHTML = DOMPurify.sanitize(comment.html); // vetted sanitizer, allow-list of tags
```

## Framework note & edge cases
- React/Vue auto-escape by default — the risk is the escape hatch (`dangerouslySetInnerHTML`, `v-html`).
- **Encode for the context:** HTML body vs attribute vs URL vs inline JS each need different encoding.
  `textContent` handles the body case; a value placed into an `href` needs URL validation
  (`javascript:` URLs are an XSS vector).
- **Don't regex-strip tags** — it's bypassable. Use a maintained sanitizer or encode for output.
- Pair with a **Content-Security-Policy** as defense-in-depth so injected scripts won't run.

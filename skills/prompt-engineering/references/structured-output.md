# Structured Output

When you parse the model's output in code, you need structure you can rely on.

## Require a schema
Specify the exact JSON shape and the allowed values:
```
Respond ONLY with JSON:
{ "sentiment": "positive|neutral|negative", "score": <number 0-1> }
```

## Prefer provider features over hope
If the platform offers structured-output / tool-use / JSON mode, use it — it constrains the model to
valid output far more reliably than prose instructions alone.

## Always validate, then handle failure
Even with a schema, validate in code and have a fallback:
1. Parse the JSON; on parse failure, retry once with an instruction to "return valid JSON only."
2. Validate against the schema (allowed enum values, required keys, types).
3. If it still fails, degrade gracefully (default value, route to human) — never crash on bad model output.

See `scripts/validate-output.mjs` for a runnable validator with a passing selftest.

## Reasoning + structure together
If you want both step-by-step reasoning and a clean field, keep them in separate keys:
```
{ "reasoning": "the user mentions a double charge -> billing", "category": "billing" }
```
Read the `category` field in code; keep `reasoning` for debugging/eval.

## Pitfalls
- Markdown fences: models often wrap JSON in ```json fences — strip them before `JSON.parse`.
- Trailing prose: instruct "JSON only, no commentary," and extract the first `{...}` block defensively.
- Enum drift: validate enum values; a model may invent a category not in your list.

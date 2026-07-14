# Prompt Techniques — In Depth

## Role / persona priming
Open by framing the model's role. This shifts vocabulary, standards, and defaults.
```
You are a meticulous security reviewer. You flag issues by severity and never rubber-stamp.
```

## Few-shot (demonstrations)
For tasks where format or judgement is nuanced, show 2–3 input→output pairs. The model pattern-matches
the demonstrated behavior far more reliably than it follows a prose description.
- Make examples representative, including at least one edge case.
- Keep the format of examples identical to what you want back.
- Too many examples waste tokens and can over-fit to their surface features — 2–4 is usually enough.

## Chain-of-thought (CoT)
For multi-step reasoning, instruct "think step by step." This improves accuracy on math/logic/analysis.
Caveats:
- It adds tokens and latency.
- If you need a clean machine answer, isolate the reasoning: ask for a JSON object with a `reasoning`
  string and a separate `answer` field, or do reasoning in one call and formatting in another.

## Task decomposition
Hard tasks get more reliable when broken into steps or separate calls (extract → transform → format),
each simple and independently checkable. This is the prompt-level version of small functions.

## Setting constraints
State the boundaries explicitly: length, tone, what to exclude, and how to handle the unknown
("If the answer isn't in the context, say you don't know"). Explicit "don'ts" prevent common failure modes.

## Output priming
End the prompt with the start of the desired output (e.g. ` ```json `) to nudge the model straight into
the right format. Combine with an explicit schema for best results.

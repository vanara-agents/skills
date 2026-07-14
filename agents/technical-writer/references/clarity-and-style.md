# Clarity and style

The clarity pass is where good docs are made. Draft to get the ideas down, then edit ruthlessly for the
reader. The goal: the shortest path to the reader's understanding.

## Sentence-level rules

- **One idea per sentence.** If you used "and" to join two actions, consider two sentences or two steps.
- **Cut hedging.** Delete "generally," "it should be possible to," "in most cases," "as needed." State
  the behavior; note exceptions explicitly.
- **Prefer active voice and the imperative.** "Set `TIMEOUT`," not "the timeout can be set."
- **Replace abstraction with the concrete.** "the appropriate variable" → name the variable. "a large
  value" → give the number and unit.
- **Lead with the verb in steps.** "Run," "Open," "Set," "Verify" — the reader scans for the action.

## Word-level rules

- Cut filler words: *just, simply, basically, actually, very, really, in order to* (→ "to").
- Avoid undefined jargon and acronyms; define on first use, then use consistently.
- Use one term per concept. Don't alternate "user / customer / account holder" for the same thing.
- Numbers and units always together: `30s`, `512 MB`, `60000` ms — and say which unit.

## Voice and tone

- Address the reader as "you." Avoid "we" except in explanation/rationale.
- Be direct, not chatty. Warmth comes from clarity and respect for the reader's time, not exclamation marks.
- Don't apologize for the software or editorialize ("unfortunately," "obviously"). "Obviously" insults a
  reader for whom it isn't obvious.

## Formatting for scannability

- Headings every few paragraphs; a reader should locate their section by scanning H2/H3s.
- Lists for sequences (ordered) and for sets of options (unordered).
- Tables for any "name → value/meaning" mapping (flags, status codes, fields).
- Code blocks for anything a reader types or sees output; never inline a multi-line command in prose.
- Bold the **one word** that carries the warning or the key term, not whole sentences.

## The wall-of-text test

If a paragraph is more than ~4 sentences or contains a sequence of actions, restructure it: a list, a
table, or sub-steps almost always reads better. Run `scripts/readability.mjs` over the draft — it flags
sentences whose average length and long-word ratio mark dense, hard-to-read prose.

## Before / after pattern

Apply this transformation everywhere:

- Hedged + abstract + passive → direct + concrete + imperative.
- Long compound sentence → short sentence + list.
- "It is recommended that you configure X" → "Set X to … . Raise it when … ."

A reader should never have to read a sentence twice to find the instruction inside it.

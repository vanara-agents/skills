#!/usr/bin/env node
// Runnable readability signal for prose. Computes two cheap proxies for
// hard-to-read writing and flags text that trips either threshold:
//   1. average sentence length (words per sentence)
//   2. long-word ratio (share of words with >= LONG_WORD_LEN letters)
//
// These are intentionally simple, dependency-free heuristics — not a true
// Flesch score — meant to catch the dense, run-on prose the clarity pass exists
// to remove (see references/clarity-and-style.md).
//
// Usage:
//   node readability.mjs "Some prose to score."     # score a literal string
//   echo "Some prose" | node readability.mjs         # score from stdin
//   node readability.mjs --selftest                  # run built-in test cases
//
// Exit code: 0 if the text reads clearly, 1 if it is flagged as hard to read.

const MAX_AVG_SENTENCE_WORDS = 25; // longer average => likely run-on prose
const MAX_LONG_WORD_RATIO = 0.2;   // more than 20% long words => dense
const LONG_WORD_LEN = 12;          // letters; "configuration" (13) counts

export function analyze(text) {
  const sentences = splitSentences(text);
  const words = (text.match(/[A-Za-z][A-Za-z'-]*/g) || []);
  const wordCount = words.length;
  const sentenceCount = Math.max(sentences.length, 1);
  const avgSentenceWords = wordCount / sentenceCount;
  const longWords = words.filter((w) => w.replace(/[^A-Za-z]/g, '').length >= LONG_WORD_LEN);
  const longWordRatio = wordCount === 0 ? 0 : longWords.length / wordCount;

  const reasons = [];
  if (avgSentenceWords > MAX_AVG_SENTENCE_WORDS) {
    reasons.push(`avg sentence length ${avgSentenceWords.toFixed(1)} words > ${MAX_AVG_SENTENCE_WORDS}`);
  }
  if (longWordRatio > MAX_LONG_WORD_RATIO) {
    reasons.push(`long-word ratio ${(longWordRatio * 100).toFixed(0)}% > ${MAX_LONG_WORD_RATIO * 100}%`);
  }

  return {
    ok: reasons.length === 0,
    wordCount,
    sentenceCount,
    avgSentenceWords,
    longWordRatio,
    reasons,
  };
}

function splitSentences(text) {
  return text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function report(label, text) {
  const r = analyze(text);
  const stats = `avg ${r.avgSentenceWords.toFixed(1)} w/sentence, ${(r.longWordRatio * 100).toFixed(0)}% long words`;
  if (r.ok) {
    console.log(`OK ${label}: reads clearly (${stats})`);
  } else {
    console.error(`FLAG ${label}: hard to read (${stats})`);
    r.reasons.forEach((reason) => console.error(`    - ${reason}`));
  }
  return r.ok;
}

function selftest() {
  const simple = 'Set the timeout. Raise it if requests stall. The default is thirty seconds.';
  const dense =
    'Notwithstanding the aforementioned considerations regarding configuration, the implementation ' +
    'necessitates comprehensive understanding of the interdependent architectural characteristics ' +
    'whose interrelationships fundamentally determine the operational behaviour exhibited throughout ' +
    'the entirety of the distributed infrastructure under consideration herein presently.';

  const cases = [
    ['simple_text_passes', simple, true],
    ['dense_text_flags', dense, false],
  ];

  let allExpected = true;
  for (const [name, text, shouldPass] of cases) {
    const { ok } = analyze(text);
    const correct = ok === shouldPass;
    allExpected = allExpected && correct;
    console.log(
      `${correct ? 'OK' : 'FAIL'} selftest ${name}: ${ok ? 'clear' : 'flagged'} ` +
        `(expected ${shouldPass ? 'clear' : 'flagged'})`
    );
  }
  process.exit(allExpected ? 0 : 1);
}

const arg = process.argv[2];
if (arg === '--selftest') {
  selftest();
} else if (arg) {
  process.exit(report('text', arg) ? 0 : 1);
} else {
  let buf = '';
  process.stdin.on('data', (c) => (buf += c));
  process.stdin.on('end', () => process.exit(report('stdin', buf) ? 0 : 1));
}

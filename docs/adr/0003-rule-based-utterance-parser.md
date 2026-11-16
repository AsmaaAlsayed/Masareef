# ADR 0003: Rule-based utterance parser shared by all platforms

- **Status:** Proposed (accepted at Design sign-off)
- **Date:** 2026-11-16
- **Relates to:** FR-024, FR-025, FR-026, FR-027, FR-028, FR-029, FR-030, FR-032, NFR-001, NFR-002, NFR-003, NFR-008, NFR-021

## Context
After speech becomes text, the app must extract amount, currency, category and date from one sentence in Egyptian Arabic, English, or Arabic with English words mixed in, including piastres, halves and quarters, relative dates and numbers written as words or as digits in either script. The requirements state that these behaviours are verified with typed transcripts fed to the parser, deterministically, and that fields the app could not determine are marked for the user's attention. By the definition of "on-device" in the requirements, no data derived from audio other than the confirmed expense may be sent over the network, so the transcript cannot go to a server. The download budget is already under pressure from the speech model (ADR 0002).

The domain is narrow: numbers, about seven currency words, a fixed list of date expressions (FR-027) and ten categories.

## Decision
Write the parser as deterministic rules in pure TypeScript in `packages/core`, with its vocabularies as reviewed data files, and run it on the device on both platforms. It never calls the network and never saves anything; it returns fields and per-field "attention" flags to the review screen.

Pipeline:
1. **Normalise.** Unicode NFKC; remove diacritics and tatweel; map Arabic-Indic and Eastern Arabic digits to Western; unify alef, ya and ta marbuta forms for matching; lower-case Latin text; strip punctuation; split attached particles ("بخمسين" -> "ب" + "خمسين", "وربع" -> "و" + "ربع"); drop the definite article and the tatweel-joined form "الـ".
2. **Numbers.** A small grammar over a lexicon of Egyptian and Standard Arabic number words and their common spellings (for example "اتنين" and "اثنين", "تلاتة" and "ثلاثة", "مية", "ميتين", "ألف", "ألفين"), compound forms joined by "و", English number words, and digit strings with separators. Fractions: "نص" or "نصف" and "half" add 0.50; "ربع" and "quarter" add 0.25. Piastres ("قرش", "قروش", "piastres") divide by 100 and imply EGP.
3. **Dates.** The FR-027 expressions in both languages, evaluated against an injected "today". A number inside a date expression ("من تلات أيام") is consumed here and cannot become the amount. Future or unsupported expressions give today with the attention flag.
4. **Amount.** The number next to a currency word wins; otherwise the first remaining number. More than one unrelated amount: the first is used and flagged (FR-025 criterion 7). None: empty and flagged.
5. **Currency.** Lexicon per FR-028; "جنيه" or "pounds" without a qualifier is EGP; the user's default when no currency word is present.
6. **Category.** Longest-match keyword lexicon per language, with each English keyword also listed in its usual Arabic-script spelling (the recogniser in Arabic mode tends to write "سوبر ماركت", "لانش", "اوبر"), and brand names. Tokens of five or more letters also match at edit distance one, to absorb spelling variation from the recogniser. No match: Other, flagged.
7. **Result.** `{ amount?, currency, category, date, attention, text }`.

## Alternatives considered
| Option | For | Against |
|---|---|---|
| **Deterministic rules and lexicons (chosen)** | Testable exactly as the requirements prescribe; every FR example is a unit test; adds nothing to the download; instant; explainable when wrong; same code on web and Android; lexicons can be reviewed by a native speaker (OQ-03) | Does not generalise to phrasing nobody anticipated; lexicons need upkeep; fuzzy matching can produce false category matches and must be tuned on the test set |
| Small on-device language model | Handles free phrasing | Hundreds of megabytes more to download on top of the speech model; slow on a 4 GB phone; non-deterministic output is hard to test against fixed examples |
| Android's on-device generative model (Gemini Nano through ML Kit) | No download where present | Present only on recent high-end devices; absent on the reference phone class and on Android 8; not available on the web |
| Server-side or cloud language model | Best understanding | Sends the transcript off the device, which the requirements prohibit; adds per-use cost |
| A trained entity-recognition model | Compact and fast | Needs labelled Egyptian Arabic expense sentences that do not exist; still needs rules for number words and dates |
| Existing date and number parsing libraries | Less code | None found that covers Egyptian dialect number words, piastres and Arabic mixed with English; a dependency for the easy half only |

## Consequences
- Easier: accuracy work becomes adding words and test cases; failures are reproducible from a typed sentence; the tester can run the FR-025 to FR-030 examples without audio.
- Harder: the lexicons are product content that needs a native Egyptian Arabic reviewer before release (OQ-03); the draft lists are the team's until then.
- NFR-001 depends on the recogniser and the parser together. The PoC reports parser accuracy on typed transcripts separately from end-to-end accuracy, so a miss can be attributed.
- The parser has no access to the API client or to storage, which is one of the two structural guarantees behind NFR-008 (the other is the single Save path on the review screen).
- To watch: false positives from fuzzy matching; sentences the rules cannot read fall to FR-030 (review screen with fields flagged), which is safe but counts against NFR-001.

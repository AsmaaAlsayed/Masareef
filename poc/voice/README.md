# Voice proof of concept (`poc/voice`)

Measurement code for milestone M0 (docs/03-architecture.md, "Voice proof of concept"). Not shipped in the product.

## Test-set manifests

`manifests/ar-eg.json` (Egyptian Arabic) and `manifests/en.json` (English) hold the scripted expense sentences used for NFR-001 to NFR-003 and PoC measures P1 to P3. They are drafts written by the team and stay drafts until the native-speaker review (P-14).

| Field                  | Meaning                                                                                                                     |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `schemaVersion`        | `1`                                                                                                                         |
| `language`, `locale`   | `ar` / `ar-EG`, or `en` / `en`                                                                                              |
| `status`, `statusNote` | `draft` until the native-speaker review                                                                                     |
| `today`                | The fixed date relative dates are scored against (`2026-11-16`, a Monday)                                                   |
| `defaultCurrency`      | The user's default currency for every sentence (`EGP`)                                                                      |
| `utterances[]`         | `id` (`ar-001`), `text`, `tags`, `expected` { `amount`, `currency`, `category`, `date` }, optional `note`, optional `audio` |
| `dropped[]`            | Sentences removed before scoring because their correct answer is unclear, with the reason                                   |

- `expected.amount` is decimal text with exactly the currency's decimal places (`"50.00"`, `"10.000"` for KWD). `category` is one of the T-002 codes. `date` is `YYYY-MM-DD`.
- `audio` is reserved for T-008: an array of `{ "file", "sha256" }`. Audio files are not in the repository (docs/04-plan.md, PQ-04).

### How the expected values are chosen

The expected values are what the speaker means, decided from the requirements and not from the parser's output:

- No category word, or nothing in the list fits (a haircut, a tip, charity): `other` (FR-026 c3).
- No currency word: the default currency. "جنيه", "pounds" and "قرش" are EGP; "جنيه استرليني" and "pounds sterling" are GBP (FR-028).
- No date expression: `today`. "Last night" means yesterday; "من أسبوع" and "a week ago" mean seven days ago; a past expense on a weekday ("on Friday") means the most recent such day.
- A count or unit price is not the amount: "تلات تذاكر كل واحدة بميتين" is 600, and "نص كيلو جبنة بخمسة وتمانين" is 85.
- Colloquial pounds and piastres without the word قرش: "خمسة جنيه وخمسين" and "12 pounds 50" are 5.50 and 12.50.
- Conventions where the list needs a choice: mobile credit is `bills_utilities`, books are `education`, home repairs and building service charges are `housing`, supermarket and raw food for home are `groceries`, and prepared food and drinks are `food_drink`.

### Tags

`mixed`, `piastres_or_fraction` and `relative_date` are the NFR-001 mix. The validator checks that each tag is plausible. A `mixed` sentence must contain both Arabic and Latin letters. `piastres_or_fraction` needs a fraction or piastre word, or a fractional amount. The tags `relative_date`, `foreign_currency`, `no_category` and `digits` must agree with the expected date, the currency, the category and the text in both directions. `quantity`, `multiple_numbers`, `filler`, `transliterated`, `standard_arabic` and `bare_weekday` are descriptive.

## Commands

| Command                                      | What it does                                                                                                  |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `npm run voice:validate`                     | Builds, then validates both manifests (fields, tags, NFR-001 and NFR-003 composition)                         |
| `npm run voice:score`                        | Builds, then gives every sentence to `parseUtterance` as typed text and writes `reports/typed-transcripts.md` |
| `npm run score:check -w @masareef/poc-voice` | Fails if the committed report differs from a fresh run (build first)                                          |

The root `npm test` also validates both committed manifests.

`reports/typed-transcripts.md` is the **parser-only** score on typed transcripts. It is not end-to-end speech accuracy. End-to-end accuracy is measured in T-010, and ADR 0003 requires the two to be reported separately. Regenerate and commit the report whenever the parser or a manifest changes.

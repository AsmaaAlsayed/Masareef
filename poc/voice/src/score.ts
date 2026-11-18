import type { CurrencyCode, Language } from '@masareef/core';
import {
  TAGS,
  type DroppedSentence,
  type ExpectedFields,
  type Manifest,
  type Tag,
} from './manifest.js';

/**
 * Parser-only score on typed transcripts (T-007). Each manifest sentence is given to the parser
 * as typed text, so this measures the parser alone; end-to-end accuracy through a speech
 * recogniser is measured separately by the PoC (ADR 0003, Consequences; T-010).
 */

export const FIELDS = ['amount', 'currency', 'category', 'date'] as const;
export type Field = (typeof FIELDS)[number];

/** The parser output this score reads; `parseUtterance` from `@masareef/core` returns more. */
export interface ParsedFields {
  readonly amount?: string;
  readonly currency: string;
  readonly category: string;
  readonly date: string;
}

export type Parse = (
  text: string,
  options: { language: Language; defaultCurrency: CurrencyCode; today: string },
) => ParsedFields;

/** Counts of correct results. `allFields` is amount, category and date all correct (NFR-001). */
export interface Tally {
  readonly total: number;
  readonly allFields: number;
  readonly amount: number;
  readonly currency: number;
  readonly category: number;
  readonly date: number;
}

export interface Miss {
  readonly id: string;
  readonly text: string;
  readonly tags: readonly Tag[];
  readonly expected: ExpectedFields;
  readonly got: ParsedFields;
  readonly wrong: readonly Field[];
}

export interface Score {
  readonly language: Language;
  readonly today: string;
  readonly defaultCurrency: CurrencyCode;
  readonly overall: Tally;
  readonly byTag: readonly { readonly tag: Tag; readonly tally: Tally }[];
  /** Every sentence with at least one of the four fields wrong. */
  readonly misses: readonly Miss[];
  readonly dropped: readonly DroppedSentence[];
}

const DECIMAL = /^(\d+)(?:\.(\d+))?$/;

function canonicalDecimal(text: string): string | undefined {
  const match = DECIMAL.exec(text);
  if (match === null) return undefined;
  const whole = (match[1] ?? '').replace(/^0+(?=\d)/, '');
  const fraction = (match[2] ?? '').replace(/0+$/, '');
  return fraction === '' ? whole : `${whole}.${fraction}`;
}

/** True when both are decimal text with the same value ("50.00" and "50"). */
export function sameAmount(expected: string, got: string | undefined): boolean {
  if (got === undefined) return false;
  const left = canonicalDecimal(expected);
  return left !== undefined && left === canonicalDecimal(got);
}

const EMPTY: Tally = { total: 0, allFields: 0, amount: 0, currency: 0, category: 0, date: 0 };

function add(tally: Tally, wrong: readonly Field[]): Tally {
  const right = (field: Field) => (wrong.includes(field) ? 0 : 1);
  const allFields = right('amount') && right('category') && right('date');
  return {
    total: tally.total + 1,
    allFields: tally.allFields + allFields,
    amount: tally.amount + right('amount'),
    currency: tally.currency + right('currency'),
    category: tally.category + right('category'),
    date: tally.date + right('date'),
  };
}

/** Runs every sentence of a manifest through `parse` and compares with the expected fields. */
export function scoreManifest(manifest: Manifest, parse: Parse): Score {
  const options = {
    language: manifest.language,
    defaultCurrency: manifest.defaultCurrency,
    today: manifest.today,
  };
  let overall = EMPTY;
  const byTag = new Map<Tag, Tally>();
  const misses: Miss[] = [];

  for (const entry of manifest.utterances) {
    const parsed = parse(entry.text, options);
    const got: ParsedFields = {
      ...(parsed.amount === undefined ? {} : { amount: parsed.amount }),
      currency: parsed.currency,
      category: parsed.category,
      date: parsed.date,
    };
    const { expected } = entry;
    const wrong = FIELDS.filter((field) =>
      field === 'amount'
        ? !sameAmount(expected.amount, got.amount)
        : expected[field] !== got[field],
    );
    overall = add(overall, wrong);
    for (const tag of entry.tags) {
      byTag.set(tag, add(byTag.get(tag) ?? EMPTY, wrong));
    }
    if (wrong.length > 0) {
      misses.push({ id: entry.id, text: entry.text, tags: entry.tags, expected, got, wrong });
    }
  }

  return {
    language: manifest.language,
    today: manifest.today,
    defaultCurrency: manifest.defaultCurrency,
    overall,
    byTag: TAGS.filter((tag) => byTag.has(tag)).map((tag) => ({
      tag,
      tally: byTag.get(tag) ?? EMPTY,
    })),
    misses,
    dropped: manifest.dropped,
  };
}

const LANGUAGE_NAMES: Readonly<Record<Language, string>> = {
  ar: 'Egyptian Arabic',
  en: 'English',
};

/** The end-to-end targets, shown beside the parser-only numbers for reference only. */
const TARGETS: Readonly<Record<Language, Partial<Record<'allFields' | Field, string>>>> = {
  ar: { allFields: 'NFR-001: 80%', amount: 'NFR-002: 90%' },
  en: { allFields: 'NFR-003: 90%' },
};

const percent = (count: number, total: number): string =>
  total === 0 ? 'n/a' : `${((count / total) * 100).toFixed(1)}%`;
const ratio = (count: number, total: number): string =>
  `${count} / ${total} (${percent(count, total)})`;
const cell = (text: string): string => text.replace(/\|/g, '\\|');
const fields = (value: ParsedFields): string =>
  `${value.amount ?? '(none)'} ${value.currency}, ${value.category}, ${value.date}`;

function renderLanguage(score: Score): string[] {
  const { overall, language } = score;
  const target = (key: 'allFields' | Field) => TARGETS[language][key] ?? '-';
  const row = (name: string, key: 'allFields' | Field) =>
    `| ${name} | ${overall[key]} / ${overall.total} | ${percent(overall[key], overall.total)} | ${target(key)} |`;

  const lines = [
    `## ${LANGUAGE_NAMES[language]} (\`${language}\`)`,
    '',
    `Today ${score.today}, default currency ${score.defaultCurrency}, ${overall.total} sentences scored, ${score.dropped.length} dropped as ambiguous.`,
    '',
    '| Measure | Correct | Accuracy | End-to-end target, for reference only |',
    '| --- | --- | --- | --- |',
    row('All three fields (amount, category, date)', 'allFields'),
    row('Amount', 'amount'),
    row('Currency', 'currency'),
    row('Category', 'category'),
    row('Date', 'date'),
    '',
    '### By tag',
    '',
    '| Tag | Sentences | All three fields | Amount | Currency |',
    '| --- | --- | --- | --- | --- |',
    ...score.byTag.map(
      ({ tag, tally }) =>
        `| ${tag} | ${tally.total} | ${ratio(tally.allFields, tally.total)} | ${ratio(tally.amount, tally.total)} | ${ratio(tally.currency, tally.total)} |`,
    ),
    '',
    `### Misses (${score.misses.length})`,
    '',
    'Every sentence with at least one of amount, currency, category or date wrong. Expected and got read "amount currency, category, date".',
    '',
  ];
  if (score.misses.length === 0) {
    lines.push('No misses.');
  } else {
    lines.push('| Id | Sentence | Wrong | Expected | Got |', '| --- | --- | --- | --- | --- |');
    for (const miss of score.misses) {
      lines.push(
        `| ${miss.id} | ${cell(miss.text)} | ${miss.wrong.join(', ')} | ${fields(miss.expected)} | ${fields(miss.got)} |`,
      );
    }
  }
  lines.push('', '### Dropped before scoring', '');
  if (score.dropped.length === 0) {
    lines.push('None dropped.');
  } else {
    lines.push('| Sentence | Why it was dropped |', '| --- | --- |');
    for (const entry of score.dropped) {
      lines.push(`| ${cell(entry.text)} | ${cell(entry.reason)} |`);
    }
  }
  lines.push('');
  return lines;
}

/** The committed report: deterministic Markdown, with no timestamps, so a re-run diffs cleanly. */
export function renderReport(scores: readonly Score[]): string {
  return [
    '# Typed-transcript score',
    '',
    '> **Parser only, typed transcripts — not end-to-end speech accuracy.**',
    '>',
    '> Each sentence of the voice test-set manifests (`poc/voice/manifests`) is given to `parseUtterance` from `@masareef/core` as typed text. No audio and no speech recogniser are involved, so these numbers say how well the parser reads correctly transcribed sentences. End-to-end accuracy (speech to text to parser, PoC measures P1 to P3) is measured separately in T-010, as ADR 0003 requires. The sentences are drafts written by the team and not yet reviewed by a native speaker (P-14). The NFR targets are end-to-end targets and are shown for reference only.',
    '>',
    '> **Development score.** Since T-007a the parser has been tuned on these same sentences, so these results are optimistic. The independent measure is the real-speaker test set (P-14).',
    '',
    'Generated by `npm run voice:score`; do not edit by hand.',
    '',
    ...scores.flatMap(renderLanguage),
  ].join('\n');
}

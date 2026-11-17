import { describe, expect, it } from 'vitest';
import arabic from '../manifests/ar-eg.json' with { type: 'json' };
import english from '../manifests/en.json' with { type: 'json' };
import { describeComposition, validateManifest } from './manifest.js';

type Json = Record<string, unknown>;

const TODAY = '2026-11-16';

const plain = (id: string, overrides: Json = {}): Json => ({
  id,
  text: 'صرفت خمسين جنيه على الغدا',
  tags: [],
  expected: { amount: '50.00', currency: 'EGP', category: 'food_drink', date: TODAY },
  ...overrides,
});

const mixed = (id: string): Json => plain(id, { text: 'جبت lunch بخمسين جنيه', tags: ['mixed'] });
const fraction = (id: string): Json =>
  plain(id, {
    text: 'ركبت ميكروباص بخمسة جنيه ونص',
    tags: ['piastres_or_fraction'],
    expected: { amount: '5.50', currency: 'EGP', category: 'transport', date: TODAY },
  });
const relative = (id: string): Json =>
  plain(id, {
    text: 'صرفت خمسين جنيه على الغدا امبارح',
    tags: ['relative_date'],
    expected: { amount: '50.00', currency: 'EGP', category: 'food_drink', date: '2026-11-15' },
  });

/** A valid Arabic manifest with the given composition; the rest are plain sentences. */
function arabicManifest({ total = 100, mixedCount = 20, fractions = 10, relatives = 15 } = {}) {
  const utterances: Json[] = [];
  const id = () => `ar-${String(utterances.length + 1).padStart(3, '0')}`;
  for (let i = 0; i < mixedCount; i += 1) utterances.push(mixed(id()));
  for (let i = 0; i < fractions; i += 1) utterances.push(fraction(id()));
  for (let i = 0; i < relatives; i += 1) utterances.push(relative(id()));
  while (utterances.length < total) utterances.push(plain(id()));
  // Texts must be unique: suffix each with its index spelt in Arabic letters, not digits.
  utterances.forEach((entry, index) => {
    const letters = [...String(index)].map((digit) => 'ابتثجحخدذر'[Number(digit)]).join('');
    entry.text = `${String(entry.text)} ${letters}`;
  });
  return {
    schemaVersion: 1,
    language: 'ar',
    locale: 'ar-EG',
    status: 'draft',
    today: TODAY,
    defaultCurrency: 'EGP',
    utterances,
    dropped: [],
  };
}

function englishManifest(total = 100) {
  const utterances = Array.from({ length: total }, (_, index) => ({
    id: `en-${String(index + 1).padStart(3, '0')}`,
    text: `spent fifty pounds on lunch number ${index + 1}`,
    tags: ['digits'],
    expected: { amount: '50.00', currency: 'EGP', category: 'food_drink', date: TODAY },
  }));
  return { ...arabicManifest(), language: 'en', locale: 'en', utterances };
}

function errorsOf(input: unknown): readonly string[] {
  const result = validateManifest(input);
  return result.ok ? [] : result.errors;
}

describe('validateManifest: composition (NFR-001, NFR-003, FR-029 c4)', () => {
  it('accepts_valid_manifest', () => {
    const result = validateManifest(arabicManifest());
    expect(result.ok).toBe(true);
    expect(validateManifest(englishManifest()).ok).toBe(true);
  });

  it('rejects_fewer_than_100', () => {
    expect(errorsOf(arabicManifest({ total: 99 }))).toEqual([
      'composition: 99 utterances, at least 100 required',
    ]);
    expect(errorsOf(englishManifest(99))).toEqual([
      'composition: 99 utterances, at least 100 required',
    ]);
  });

  it('rejects_fewer_than_20_mixed', () => {
    expect(errorsOf(arabicManifest({ mixedCount: 19 }))).toEqual([
      'composition: 19 utterances tagged mixed, at least 20 required',
    ]);
  });

  it('rejects fewer than 10 with piastres or fractions and fewer than 15 relative dates', () => {
    expect(errorsOf(arabicManifest({ fractions: 9, relatives: 14 }))).toEqual([
      'composition: 9 utterances tagged piastres_or_fraction, at least 10 required',
      'composition: 14 utterances tagged relative_date, at least 15 required',
    ]);
  });

  it('does not ask English for the Arabic mix', () => {
    expect(errorsOf(englishManifest())).toEqual([]);
  });
});

describe('validateManifest: fields', () => {
  it('rejects_missing_expected_field', () => {
    const manifest = arabicManifest();
    const first = manifest.utterances[0] as { expected: Json };
    delete first.expected.category;
    expect(errorsOf(manifest)).toEqual([
      'ar-001: expected.category must be one of the category codes',
    ]);
  });

  it('rejects input that is not a manifest object', () => {
    expect(errorsOf(null)).toEqual(['manifest must be an object']);
    expect(errorsOf([])).toEqual(['manifest must be an object']);
  });

  it('rejects wrong header fields', () => {
    const manifest = {
      ...arabicManifest(),
      schemaVersion: 2,
      language: 'fr',
      today: '2026-02-30',
      defaultCurrency: 'JPY',
      status: '',
      utterances: 'none',
      dropped: [{ text: 'x' }],
    };
    expect(errorsOf(manifest)).toEqual([
      'schemaVersion must be 1',
      'language must be "ar" or "en"',
      'today must be a calendar date YYYY-MM-DD',
      'defaultCurrency must be one of the currency codes',
      'status must be a non-empty string',
      'dropped[0] needs a non-empty text and reason',
      'utterances must be an array',
    ]);
  });

  it('rejects an utterance that is not an object, and an empty or duplicate text or id', () => {
    const manifest = arabicManifest();
    const list = manifest.utterances as unknown[];
    list[60] = 'oops';
    (list[61] as Json).id = 'ar-001';
    (list[62] as Json).text = '  ';
    (list[63] as Json).text = (list[0] as Json).text;
    (list[64] as Json).id = 'en-065';
    expect(errorsOf(manifest)).toEqual([
      'utterances[60] must be an object',
      'ar-001: duplicate id',
      'ar-063: text must be a non-empty string',
      'ar-064: duplicate text (same as ar-001)',
      'en-065: id must look like ar-001',
    ]);
  });

  it('rejects bad amounts, currencies, categories and dates', () => {
    const manifest = arabicManifest();
    const set = (index: number, expected: Json) => {
      const entry = manifest.utterances[index] as { expected: Json };
      entry.expected = { ...entry.expected, ...expected };
    };
    set(60, { amount: '50' });
    set(61, { amount: '10.555' });
    set(62, { amount: '0.00' });
    set(63, { amount: '10000000.00' });
    set(64, { currency: 'JPY' });
    set(65, { date: '2026-11-17' });
    set(66, { date: '16/11/2026' });
    expect(errorsOf(manifest)).toEqual([
      'ar-061: expected.amount "50" must be a decimal with exactly 2 decimal places for EGP',
      'ar-062: expected.amount "10.555" must be a decimal with exactly 2 decimal places for EGP',
      'ar-063: expected.amount "0.00" is not a valid amount (not_positive)',
      'ar-064: expected.amount "10000000.00" is not a valid amount (above_maximum)',
      'ar-065: expected.currency must be one of the currency codes',
      'ar-066: expected.date 2026-11-17 is after today (2026-11-16)',
      'ar-067: expected.date must be a calendar date YYYY-MM-DD',
    ]);
  });

  it('accepts three decimal places for KWD only', () => {
    const manifest = arabicManifest();
    const entry = manifest.utterances[70] as Json;
    entry.tags = ['foreign_currency'];
    entry.expected = { amount: '1.250', currency: 'KWD', category: 'education', date: TODAY };
    expect(errorsOf(manifest)).toEqual([]);
  });

  it('rejects unknown tags, a bad note and bad audio references', () => {
    const manifest = arabicManifest();
    const list = manifest.utterances;
    list[60]!.tags = ['loud'];
    list[61]!.tags = 'mixed';
    list[62]!.note = 7;
    list[63]!.audio = [{ file: 'ar-064.salma.wav', sha256: 'abc' }];
    list[64]!.audio = 'ar-065.wav';
    list[65]!.audio = [
      { file: 'ar-066.salma.wav', sha256: 'a'.repeat(64) },
      { file: '../ar-066.wav', sha256: 'b'.repeat(64) },
    ];
    expect(errorsOf(manifest)).toEqual([
      'ar-061: unknown tag "loud"',
      'ar-062: tags must be an array',
      'ar-063: note must be a string',
      'ar-064: audio[0] needs a file name and a lower-case hex sha256',
      'ar-065: audio must be an array',
      'ar-066: audio[1] needs a file name and a lower-case hex sha256',
    ]);
  });
});

describe('validateManifest: tags must be plausible', () => {
  const withEntry = (entry: Json) => {
    const manifest = arabicManifest();
    manifest.utterances[80] = { ...plain('ar-081'), ...entry };
    return errorsOf(manifest);
  };

  it('a mixed sentence has both Arabic and Latin letters', () => {
    expect(withEntry({ text: 'صرفت خمسين جنيه', tags: ['mixed'] })).toEqual([
      'ar-081: tagged mixed but the text does not contain both Arabic and Latin letters',
    ]);
  });

  it('a piastres_or_fraction sentence names a fraction or piastres, or expects a fractional amount', () => {
    expect(withEntry({ text: 'صرفت خمسين جنيه', tags: ['piastres_or_fraction'] })).toEqual([
      'ar-081: tagged piastres_or_fraction but has no fraction or piastre word and a whole amount',
    ]);
    const decimals = {
      text: 'دفعت 37.5 جنيه',
      tags: ['piastres_or_fraction', 'digits'],
      expected: { amount: '37.50', currency: 'EGP', category: 'other', date: TODAY },
    };
    expect(withEntry({ ...decimals, tags: [...decimals.tags, 'no_category'] })).toEqual([]);
  });

  it('relative_date is tagged exactly when the date is not today', () => {
    expect(withEntry({ tags: ['relative_date'] })).toEqual([
      'ar-081: tagged relative_date but the expected date is today',
    ]);
    expect(
      withEntry({
        expected: { amount: '50.00', currency: 'EGP', category: 'food_drink', date: '2026-11-15' },
      }),
    ).toEqual(['ar-081: expected date is not today but the sentence is not tagged relative_date']);
  });

  it('foreign_currency is tagged exactly when the currency is not the default', () => {
    expect(withEntry({ tags: ['foreign_currency'] })).toEqual([
      'ar-081: tagged foreign_currency but the expected currency is the default',
    ]);
    expect(
      withEntry({
        expected: { amount: '50.00', currency: 'USD', category: 'food_drink', date: TODAY },
      }),
    ).toEqual(['ar-081: expected currency is not the default but not tagged foreign_currency']);
  });

  it('no_category is tagged exactly when the category is other', () => {
    expect(withEntry({ tags: ['no_category'] })).toEqual([
      'ar-081: tagged no_category but the expected category is not other',
    ]);
    expect(
      withEntry({
        expected: { amount: '50.00', currency: 'EGP', category: 'other', date: TODAY },
      }),
    ).toEqual(['ar-081: expected category is other but not tagged no_category']);
  });

  it('digits is tagged exactly when the text has a digit in any script', () => {
    expect(withEntry({ tags: ['digits'] })).toEqual([
      'ar-081: tagged digits but the text has no digit',
    ]);
    expect(withEntry({ text: 'صرفت ٥٠ جنيه على الغدا' })).toEqual([
      'ar-081: the text has a digit but is not tagged digits',
    ]);
  });
});

describe('the committed manifests', () => {
  it.each([
    ['ar-eg.json', arabic],
    ['en.json', english],
  ])('%s is valid', (_name, manifest) => {
    expect(errorsOf(manifest)).toEqual([]);
  });

  it('describes the composition per tag', () => {
    const result = validateManifest(arabicManifest({ total: 100 }));
    if (!result.ok) throw new Error('fixture must be valid');
    expect(describeComposition(result.manifest)).toBe(
      'ar: 100 utterances; mixed 20, piastres_or_fraction 10, relative_date 15',
    );
  });
});

import { parseUtterance } from '@masareef/core';
import { describe, expect, it } from 'vitest';
import type { Manifest, Utterance } from './manifest.js';
import { renderReport, sameAmount, scoreManifest, type ParsedFields } from './score.js';

const TODAY = '2026-11-16';

const utterance = (id: string, text: string, tags: Utterance['tags'], amount: string) =>
  ({
    id,
    text,
    tags,
    expected: { amount, currency: 'EGP', category: 'other', date: TODAY },
  }) as const;

/** Three sentences; the third is the known miss (PQ-07: 5.50 said without the word قرش). */
const fixture: Manifest = {
  schemaVersion: 1,
  language: 'ar',
  locale: 'ar-EG',
  status: 'draft',
  today: TODAY,
  defaultCurrency: 'EGP',
  utterances: [
    {
      ...utterance('ar-001', 'صرفت خمسين جنيه على الغدا', [], '50.00'),
      expected: { amount: '50.00', currency: 'EGP', category: 'food_drink', date: TODAY },
    },
    {
      ...utterance('ar-002', 'تاكسي بتلاتين جنيه', ['transliterated'], '30.00'),
      expected: { amount: '30.00', currency: 'EGP', category: 'transport', date: TODAY },
    },
    utterance('ar-003', 'خمسة جنيه وخمسين', ['piastres_or_fraction', 'no_category'], '5.50'),
  ],
  dropped: [{ text: 'دفعت خمسين للأكل وعشرين للتاكسي', reason: 'Two expenses.' }],
};

const answers: Record<string, ParsedFields> = {
  'صرفت خمسين جنيه على الغدا': {
    amount: '50',
    currency: 'EGP',
    category: 'food_drink',
    date: TODAY,
  },
  'تاكسي بتلاتين جنيه': { amount: '30', currency: 'EGP', category: 'transport', date: TODAY },
  'خمسة جنيه وخمسين': { amount: '5', currency: 'EGP', category: 'other', date: TODAY },
};
const stub = (text: string): ParsedFields =>
  answers[text] ?? { currency: 'EGP', category: 'other', date: TODAY };

describe('sameAmount', () => {
  it('compares decimal values, not spellings', () => {
    expect(sameAmount('50.00', '50')).toBe(true);
    expect(sameAmount('0.75', '0.750')).toBe(true);
    expect(sameAmount('1.250', '1.25')).toBe(true);
    expect(sameAmount('50.00', '050')).toBe(true);
  });

  it('treats a different value, a missing amount or non-decimal text as wrong', () => {
    expect(sameAmount('50.00', '500')).toBe(false);
    expect(sameAmount('5.50', '5')).toBe(false);
    expect(sameAmount('50.00', undefined)).toBe(false);
    expect(sameAmount('1000.00', '1,000')).toBe(false);
    expect(sameAmount('50.00', '')).toBe(false);
  });
});

describe('scoreManifest on a three-sentence fixture with one known miss', () => {
  const score = scoreManifest(fixture, stub);

  it('counts all three fields (amount, category, date) as NFR-001 defines, and each field', () => {
    expect(score.overall).toEqual({
      total: 3,
      allFields: 2,
      amount: 2,
      currency: 3,
      category: 3,
      date: 3,
    });
  });

  it('counts per tag', () => {
    expect(score.byTag).toEqual([
      {
        tag: 'piastres_or_fraction',
        tally: { total: 1, allFields: 0, amount: 0, currency: 1, category: 1, date: 1 },
      },
      {
        tag: 'no_category',
        tally: { total: 1, allFields: 0, amount: 0, currency: 1, category: 1, date: 1 },
      },
      {
        tag: 'transliterated',
        tally: { total: 1, allFields: 1, amount: 1, currency: 1, category: 1, date: 1 },
      },
    ]);
  });

  it('lists the miss with expected and got', () => {
    expect(score.misses).toEqual([
      {
        id: 'ar-003',
        text: 'خمسة جنيه وخمسين',
        tags: ['piastres_or_fraction', 'no_category'],
        expected: { amount: '5.50', currency: 'EGP', category: 'other', date: TODAY },
        got: { amount: '5', currency: 'EGP', category: 'other', date: TODAY },
        wrong: ['amount'],
      },
    ]);
  });

  it('passes the manifest language, default currency and today to the parser', () => {
    const calls: unknown[] = [];
    scoreManifest(fixture, (text, options) => {
      calls.push(options);
      return stub(text);
    });
    expect(calls).toEqual(Array(3).fill({ language: 'ar', defaultCurrency: 'EGP', today: TODAY }));
  });

  it('keeps a currency-only miss out of the all-fields count but lists it', () => {
    const result = scoreManifest(fixture, (text) => ({ ...stub(text), currency: 'USD' }));
    expect(result.overall.allFields).toBe(2);
    expect(result.overall.currency).toBe(0);
    expect(result.misses.map((miss) => [miss.id, miss.wrong])).toEqual([
      ['ar-001', ['currency']],
      ['ar-002', ['currency']],
      ['ar-003', ['amount', 'currency']],
    ]);
  });

  it('counts a missing amount as wrong', () => {
    const result = scoreManifest(fixture, (text) => {
      const { currency, category, date } = stub(text);
      return { currency, category, date };
    });
    expect(result.overall.amount).toBe(0);
    expect(result.misses).toHaveLength(3);
  });

  it('gives zero totals for an empty manifest', () => {
    const result = scoreManifest({ ...fixture, utterances: [] }, stub);
    expect(result.overall).toEqual({
      total: 0,
      allFields: 0,
      amount: 0,
      currency: 0,
      category: 0,
      date: 0,
    });
    expect(result.byTag).toEqual([]);
  });
});

describe('scoreManifest with the real parser (parseUtterance from @masareef/core)', () => {
  it('scores the fixture and finds the known miss', () => {
    // T-007a taught the parser the fixture's miss; "five fifty" for 5.50 is still unsupported.
    const [first, second] = fixture.utterances as [Utterance, Utterance, Utterance];
    const stillMissed = utterance('ar-003', 'five fifty', ['no_category'], '5.50');
    const score = scoreManifest(
      { ...fixture, utterances: [first, second, stillMissed] },
      parseUtterance,
    );
    expect(score.overall.total).toBe(3);
    expect(score.overall.allFields).toBe(2);
    expect(score.misses.map((miss) => miss.id)).toEqual(['ar-003']);
    expect(score.misses[0]?.wrong).toContain('amount');
  });
});

describe('renderReport', () => {
  const report = renderReport([scoreManifest(fixture, stub)]);

  it('is labelled parser only, not end-to-end speech accuracy', () => {
    expect(report).toContain('Parser only, typed transcripts — not end-to-end speech accuracy');
  });

  it('says the score is a development score, tuned on the sentences it measures', () => {
    expect(report).toContain('**Development score.**');
    expect(report).toContain('tuned on these same sentences');
    expect(report).toContain('the real-speaker test set (P-14)');
  });

  it('states each accuracy with counts and a percentage', () => {
    expect(report).toContain('| All three fields (amount, category, date) | 2 / 3 | 66.7% |');
    expect(report).toContain('| Amount | 2 / 3 | 66.7% |');
    expect(report).toContain('| Currency | 3 / 3 | 100.0% |');
    expect(report).toContain(
      '| piastres_or_fraction | 1 | 0 / 1 (0.0%) | 0 / 1 (0.0%) | 1 / 1 (100.0%) |',
    );
  });

  it('lists each miss with expected and got, and the dropped sentences', () => {
    expect(report).toContain(
      '| ar-003 | خمسة جنيه وخمسين | amount | 5.50 EGP, other, 2026-11-16 | 5 EGP, other, 2026-11-16 |',
    );
    expect(report).toContain('| دفعت خمسين للأكل وعشرين للتاكسي | Two expenses. |');
  });

  it('shows a missing amount as none, escapes table pipes and handles an empty set', () => {
    const piped: Manifest = {
      ...fixture,
      utterances: [{ ...fixture.utterances[2]!, text: 'a | b' }],
      dropped: [],
    };
    const text = renderReport([
      scoreManifest(piped, () => ({ currency: 'EGP', category: 'other', date: TODAY })),
    ]);
    expect(text).toContain('| ar-003 | a \\| b | amount |');
    expect(text).toContain('(none) EGP, other, 2026-11-16');
    expect(text).toContain('None dropped.');
    expect(renderReport([scoreManifest({ ...fixture, utterances: [] }, stub)])).toContain(
      '| 0 / 0 | n/a |',
    );
  });
});

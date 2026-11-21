import { TRANSLATIONS } from '@masareef/core';
import { describe, expect, it } from 'vitest';
import { PSEUDO_EXPANSION, pseudoLocaleTexts, pseudoLocalize } from './pseudo-locale.js';

describe('pseudoLocalize', () => {
  it('accents letters, pads and brackets the text', () => {
    expect(pseudoLocalize('Sign in')).toBe('[Šîĝñ îñ ~~~]');
  });

  it('lengthens every text by at least the expansion, before the brackets', () => {
    for (const [english, pseudo] of pseudoLocaleTexts()) {
      const inner = pseudo.slice(1, -1);
      expect(inner.length, english).toBeGreaterThanOrEqual(english.length * (1 + PSEUDO_EXPANSION));
    }
  });

  it('pads in words of at most five, so long texts can still wrap', () => {
    const pseudo = pseudoLocalize('Could not reach Masareef. Check your connection and try again.');
    expect(pseudo).toMatch(/ ~{1,5}( ~{1,5})*\]$/);
    expect(pseudo).not.toMatch(/~{6}/);
  });

  it('keeps interpolation placeholders as they are', () => {
    expect(pseudoLocalize('{{count}} items')).toBe('[{{count}} îţéɱš ~~~~~ ~]');
  });

  it('pads even an empty or one-letter text', () => {
    expect(pseudoLocalize('')).toBe('[ ~~]');
    expect(pseudoLocalize('a')).toBe('[å ~~]');
  });

  it('covers every English text and no Arabic one', () => {
    const english = pseudoLocaleTexts().map(([text]) => text);
    expect(english).toContain(TRANSLATIONS.en.status.loading);
    expect(english).toContain(TRANSLATIONS.en.pages.terms);
    expect(english).not.toContain(TRANSLATIONS.ar.status.loading);
  });
});

import type { Language } from '../language.js';

/** A tree of display texts, as i18next takes them: groups of groups, ending in strings. */
export interface TranslationTree {
  readonly [key: string]: string | TranslationTree;
}

export type TranslationProblemKind =
  'missing' | 'empty' | 'not_text' | 'non_western_digit' | 'placeholders_differ';

export interface TranslationProblem {
  readonly language: Language;
  /** Dotted path of the key; empty when a language has no keys at all. */
  readonly key: string;
  readonly problem: TranslationProblemKind;
}

/** Arabic-Indic and Extended Arabic-Indic digits: never in generated text (FR-022 criterion 1). */
const NON_WESTERN_DIGIT = /[٠-٩۰-۹]/;
const PLACEHOLDER = /\{\{\s*([^}\s]+)\s*\}\}/g;

function flatten(tree: TranslationTree, prefix = ''): Map<string, unknown> {
  const entries = new Map<string, unknown>();
  for (const [name, value] of Object.entries(tree)) {
    const key = prefix === '' ? name : `${prefix}.${name}`;
    if (typeof value === 'object' && value !== null) {
      for (const [inner, text] of flatten(value, key)) entries.set(inner, text);
      // The group itself is recorded too, so a text standing where a group belongs is reported.
      entries.set(key, value);
    } else {
      entries.set(key, value);
    }
  }
  return entries;
}

function placeholders(text: string): string {
  return [...text.matchAll(PLACEHOLDER)]
    .map((match) => match[1])
    .sort()
    .join(',');
}

/**
 * Every key must exist in both languages with non-blank text, use Western digits only, and name
 * the same placeholders in both (NFR-009; FR-022). Returns the problems in key order, English
 * first; an empty list means the resources pass.
 */
export function checkTranslations(
  resources: Readonly<Record<Language, TranslationTree>>,
): TranslationProblem[] {
  const flat = { en: flatten(resources.en), ar: flatten(resources.ar) };
  const languages: readonly Language[] = ['en', 'ar'];
  if (flat.en.size === 0 && flat.ar.size === 0) {
    return languages.map((language) => ({ language, key: '', problem: 'missing' }));
  }

  const keys = [...new Set([...flat.en.keys(), ...flat.ar.keys()])].sort();
  const problems: TranslationProblem[] = [];
  for (const language of languages) {
    const other = flat[language === 'en' ? 'ar' : 'en'];
    for (const key of keys) {
      const value = flat[language].get(key);
      const counterpart = other.get(key);
      const isGroup = typeof value === 'object';
      const counterpartIsGroup = typeof counterpart === 'object';
      if (value === undefined) {
        // A missing group is reported through its keys, not once more for the group itself.
        if (!counterpartIsGroup) problems.push({ language, key, problem: 'missing' });
      } else if (isGroup) {
        continue;
      } else if (typeof value !== 'string' || counterpartIsGroup) {
        problems.push({ language, key, problem: 'not_text' });
      } else if (value.trim() === '') {
        problems.push({ language, key, problem: 'empty' });
      } else if (NON_WESTERN_DIGIT.test(value)) {
        problems.push({ language, key, problem: 'non_western_digit' });
      } else if (
        language === 'ar' &&
        typeof counterpart === 'string' &&
        placeholders(counterpart) !== placeholders(value)
      ) {
        problems.push({ language, key, problem: 'placeholders_differ' });
      }
    }
  }
  return problems;
}

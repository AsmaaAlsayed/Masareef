import { POLICY_KINDS, POLICY_LIBRARY, policyTexts, TRANSLATIONS } from '@masareef/core';
import type { EnglishTranslation, Language } from '@masareef/core';

/** Dotted paths to the texts, such as `pages.signIn`. */
type Paths<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${Paths<T[K]>}`;
}[keyof T & string];

export type TextKey = Paths<EnglishTranslation>;

/** The interface text for `key` in `language`, from the same resources the app bundles. */
export function text(language: Language, key: TextKey): string {
  let node: unknown = TRANSLATIONS[language];
  for (const part of key.split('.')) {
    node = typeof node === 'object' && node !== null ? Reflect.get(node, part) : undefined;
  }
  if (typeof node !== 'string') throw new Error(`No ${language} text for ${key}`);
  return node;
}

/** Every text of the English resources, in key order. */
export function englishTexts(): string[] {
  const texts: string[] = [];
  const walk = (node: unknown): void => {
    if (typeof node === 'string') texts.push(node);
    else if (typeof node === 'object' && node !== null) Object.values(node).forEach(walk);
  };
  walk(TRANSLATIONS.en);
  return texts;
}

/**
 * Every run of text of the English privacy policy and terms, as the pages render them: each run is
 * a text node of its own. Runs without a letter are left out.
 */
export function englishPolicyTexts(): string[] {
  return (
    POLICY_KINDS.flatMap((kind) => {
      const document = POLICY_LIBRARY.documents[kind].en;
      return document === undefined ? [] : policyTexts(document);
    })
      // The page's text nodes are matched trimmed (pseudo-locale.ts), so the texts are too.
      .map((text) => text.trim())
      .filter((text) => /\p{L}/u.test(text))
  );
}

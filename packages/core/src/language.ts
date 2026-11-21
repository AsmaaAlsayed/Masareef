/** The two interface languages (FR-020). */
export type Language = 'en' | 'ar';

/** One piece of display text in each interface language. */
export type Localized = Readonly<Record<Language, string>>;

export const LANGUAGES: readonly Language[] = Object.freeze(['en', 'ar']);

/** Used when the browser or device asks for no language Masareef offers (FR-021 criterion 2). */
export const DEFAULT_LANGUAGE: Language = 'en';

export function isLanguage(value: unknown): value is Language {
  return value === 'en' || value === 'ar';
}

/**
 * The interface language for a first visit, from the browser's or device's preferred languages in
 * order (`navigator.languages`). The first entry Masareef offers wins, matched on the primary
 * language subtag, so every regional variant of Arabic (`ar-EG`, `ar-SA`) gives Arabic; a list
 * with no Arabic or English entry gives English (FR-021 criteria 1 and 2).
 */
export function languageFromPreferences(preferences: readonly string[]): Language {
  for (const tag of preferences) {
    const primary = tag.split('-')[0]?.toLowerCase();
    if (isLanguage(primary)) return primary;
  }
  return DEFAULT_LANGUAGE;
}

/** The value of `dir` for the language (FR-020 criteria 1 and 2). */
export function textDirection(language: Language): 'rtl' | 'ltr' {
  return language === 'ar' ? 'rtl' : 'ltr';
}

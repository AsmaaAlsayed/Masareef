/** The two interface languages (FR-020). */
export type Language = 'en' | 'ar';

/** One piece of display text in each interface language. */
export type Localized = Readonly<Record<Language, string>>;

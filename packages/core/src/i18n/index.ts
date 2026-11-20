import type { Language } from '../language.js';
import { ar } from './ar.js';
import { en } from './en.js';
import type { Translation } from './types.js';

export { checkTranslations } from './check.js';
export type { TranslationProblem, TranslationProblemKind, TranslationTree } from './check.js';
export type { Translation } from './types.js';

/** The interface texts of both languages, for i18next's single `translation` namespace. */
export const TRANSLATIONS: Readonly<Record<Language, Translation>> = Object.freeze({ en, ar });

/** The English resources with their literal texts, from which the web app types its keys. */
export type EnglishTranslation = typeof en;

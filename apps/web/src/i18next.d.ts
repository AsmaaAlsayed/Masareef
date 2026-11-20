import 'i18next';
import type { EnglishTranslation } from '@masareef/core';

// Types every `t()` key against the English resources in packages/core, so a key that does not
// exist is a compile error.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: EnglishTranslation };
  }
}

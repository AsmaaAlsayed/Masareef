import type { ApiClient } from '@masareef/api-types';
import {
  isLanguage,
  LANGUAGES,
  languageFromPreferences,
  POLICY_LIBRARY,
  textDirection,
  TRANSLATIONS,
} from '@masareef/core';
import type { Language, PolicyLibrary } from '@masareef/core';
import { QueryClient } from '@tanstack/react-query';
import i18next from 'i18next';
import type { i18n } from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { PolicySeenStore } from './policies/notice.js';

/**
 * Where the language choice is stored on the device. Architecture C1 lists everything the web app
 * may store there; the other key in use is policies/notice.ts's `POLICY_VERSIONS_STORAGE_KEY`.
 */
export const LANGUAGE_STORAGE_KEY = 'masareef.language';

/** Where a language chosen while signed out is remembered (FR-021 criterion 5). */
export interface LanguageStore {
  read(): Language | undefined;
  write(language: Language): void;
}

/**
 * Device storage. Storage can be unavailable (private browsing, blocked site data, a full quota)
 * and even reading `localStorage` can throw, so every access is guarded: the app then works for
 * the visit and starts from the browser language next time.
 */
export function deviceLanguageStore(
  storage: () => Storage = () => window.localStorage,
): LanguageStore {
  return {
    read() {
      try {
        const value = storage().getItem(LANGUAGE_STORAGE_KEY);
        return isLanguage(value) ? value : undefined;
      } catch {
        return undefined;
      }
    },
    write(language) {
      try {
        storage().setItem(LANGUAGE_STORAGE_KEY, language);
      } catch {
        // Not remembered on this device; the switch itself has already happened.
        return;
      }
    },
  };
}

export interface WebAppOptions {
  /** The browser's preferred languages, in order (`navigator.languages`). */
  readonly languages: readonly string[];
  readonly store: LanguageStore;
  /** The policy versions this device last saw, for the change notice (FR-039 criterion 4). */
  readonly policySeen: PolicySeenStore;
  readonly api: ApiClient;
  readonly document: Document;
  /** The privacy policy and terms; the shipped ones unless a test passes others. */
  readonly policies?: PolicyLibrary;
}

export interface WebApp {
  readonly i18n: i18n;
  readonly api: ApiClient;
  readonly queryClient: QueryClient;
  readonly policySeen: PolicySeenStore;
  readonly policies: PolicyLibrary;
  /** The language control: switches at once and remembers the choice on the device. */
  chooseLanguage(language: Language): void;
}

function applyLanguage(document: Document, i18n: i18n): void {
  const language = isLanguage(i18n.language) ? i18n.language : 'en';
  document.documentElement.lang = language;
  document.documentElement.dir = textDirection(language);
  document.title = i18n.t('app.name');
}

/**
 * Everything the app needs, created once at start. The language is the one chosen on this device
 * before, otherwise the browser's (FR-021 criteria 1, 2 and 5). Resources are bundled, so i18next
 * is ready synchronously and the first render is already in the right language and direction.
 */
export function createWebApp({
  languages,
  store,
  policySeen,
  api,
  document,
  policies = POLICY_LIBRARY,
}: WebAppOptions): WebApp {
  const language = store.read() ?? languageFromPreferences(languages);
  const instance = i18next.createInstance();
  void instance.use(initReactI18next).init({
    resources: {
      en: { translation: TRANSLATIONS.en },
      ar: { translation: TRANSLATIONS.ar },
    },
    lng: language,
    supportedLngs: [...LANGUAGES],
    // A missing key is caught by the key check in CI rather than shown in the other language.
    fallbackLng: false,
    initAsync: false,
    // React escapes every text it renders.
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

  applyLanguage(document, instance);
  instance.on('languageChanged', () => applyLanguage(document, instance));

  const queryClient = new QueryClient({
    // Failures are shown with a retry control (NFR-028) rather than retried out of sight.
    defaultOptions: { queries: { retry: false } },
  });

  return {
    i18n: instance,
    api,
    queryClient,
    policySeen,
    policies,
    chooseLanguage(next) {
      store.write(next);
      void instance.changeLanguage(next);
    },
  };
}

// @vitest-environment happy-dom
import { createApiClient } from '@masareef/api-types';
import { formatDate, POLICY_KINDS, POLICY_LIBRARY, policyTexts } from '@masareef/core';
import type { Language, PolicyDocument, PolicyKind, PolicyLibrary } from '@masareef/core';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { createMemoryRouter } from 'react-router';
import type { RouteObject } from 'react-router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { App } from '../App.js';
import { createWebApp, deviceLanguageStore } from '../bootstrap.js';
import { appRoutes } from '../routes.js';
import { failingStorage, memoryStorage } from '../testing/storage.js';
import { devicePolicySeenStore, POLICY_VERSIONS_STORAGE_KEY } from './notice.js';
import { PolicyNoticeFor } from './PolicyNotice.js';

const ARABIC_INDIC = /[٠-٩۰-۹]/;
const ARABIC_LETTER = /[؀-ۿ]/;
const LATIN_LETTER = /[A-Za-z]/;

const CURRENT = {
  privacy: POLICY_LIBRARY.versions.privacy.version,
  terms: POLICY_LIBRARY.versions.terms.version,
};

type Fetch = (input: string, init: RequestInit) => Promise<Response>;

const configWith =
  (versions: { privacy: string; terms: string }): Fetch =>
  () =>
    Promise.resolve(
      new Response(
        JSON.stringify({
          googleClientId: null,
          privacyVersion: versions.privacy,
          termsVersion: versions.terms,
          release: 'test-release',
        }),
        { headers: { 'Content-Type': 'application/json' } },
      ),
    );

const serving = configWith(CURRENT);
const never: Fetch = () => new Promise(() => undefined);
const failing: Fetch = () => Promise.reject(new TypeError('Failed to fetch'));

interface Visit {
  readonly language: Language;
  readonly path?: string;
  readonly fetch?: Fetch;
  /** The device's storage, shared by the language store and the policy-version store. */
  readonly device?: Storage;
  readonly policies?: PolicyLibrary;
  readonly routes?: RouteObject[];
}

function open({ language, path = '/', fetch = serving, device, policies, routes }: Visit) {
  const storage = device ?? memoryStorage();
  const app = createWebApp({
    languages: [language],
    store: deviceLanguageStore(() => storage),
    policySeen: devicePolicySeenStore(() => storage),
    api: createApiClient({ fetch }),
    document,
    ...(policies === undefined ? {} : { policies }),
  });
  render(
    <App app={app} router={createMemoryRouter(routes ?? appRoutes, { initialEntries: [path] })} />,
  );
  return { app, storage };
}

/** The text the interface wrote, without isolated values (dates, version, proper names). */
function interfaceText(): string {
  const page = document.body.cloneNode(true) as HTMLElement;
  for (const value of page.querySelectorAll('bdi')) value.remove();
  for (const control of page.querySelectorAll('[data-language-switch]')) control.remove();
  return page.textContent;
}

/** A document as the app ships it. */
function shipped(kind: PolicyKind, language: Language): PolicyDocument {
  const document_ = POLICY_LIBRARY.documents[kind][language];
  if (document_ === undefined) throw new Error(`${kind} ${language} is not shipped`);
  return document_;
}

function seenStorage(versions: unknown): Storage {
  return memoryStorage({ [POLICY_VERSIONS_STORAGE_KEY]: JSON.stringify(versions) });
}

const HEADINGS: Record<PolicyKind, Record<Language, string>> = {
  privacy: { en: 'Privacy policy', ar: 'سياسة الخصوصية' },
  terms: { en: 'Terms of use', ar: 'شروط الاستخدام' },
};

const LABELS = {
  en: { version: 'Version', effective: 'Effective date', draft: 'Draft for review' },
  ar: { version: 'رقم الإصدار', effective: 'تاريخ السريان', draft: 'مسودة للمراجعة' },
} as const;

beforeEach(() => {
  document.documentElement.removeAttribute('lang');
  document.documentElement.removeAttribute('dir');
});

afterEach(() => {
  cleanup();
});

describe('the policy pages (FR-039 criteria 1 and 4)', () => {
  for (const kind of POLICY_KINDS) {
    for (const language of ['en', 'ar'] as const) {
      it(`privacy_and_terms_render_in_both_languages_with_version_and_date ${kind} ${language}`, async () => {
        open({ language, path: `/${kind}`, fetch: never });
        const { version, effectiveDate } = POLICY_LIBRARY.versions[kind];
        const labels = LABELS[language];

        expect(
          await screen.findByRole('heading', { level: 1, name: HEADINGS[kind][language] }),
        ).toBeDefined();

        const facts = screen.getByText(labels.version).closest('dl');
        expect(facts).not.toBeNull();
        const terms = within(facts!)
          .getAllByRole('term')
          .map((term) => term.textContent);
        const values = within(facts!)
          .getAllByRole('definition')
          .map((value) => value.textContent);
        expect(terms).toEqual([labels.version, labels.effective]);
        expect(values).toEqual([version, formatDate(effectiveDate, language)]);
        expect(within(facts!).getByText(version).tagName).toBe('BDI');
        expect(facts!.querySelector('time')?.getAttribute('datetime')).toBe(effectiveDate);

        // Every section of the document in this language, as a second-level heading.
        const document_ = POLICY_LIBRARY.documents[kind][language];
        expect(document_).toBeDefined();
        const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
        expect(headings).toEqual(document_!.sections.map((section) => section.heading));

        // The draft banner, in the page's language.
        expect(screen.getByRole('note').textContent).toContain(labels.draft);

        // The whole page is in one language, with Western digits only (FR-020, FR-022).
        expect(interfaceText()).not.toMatch(language === 'en' ? ARABIC_LETTER : LATIN_LETTER);
        expect(document.body.textContent).not.toMatch(ARABIC_INDIC);
      });
    }
  }

  it('arabic_page_is_rtl', async () => {
    for (const kind of POLICY_KINDS) {
      open({ language: 'ar', path: `/${kind}`, fetch: never });
      await screen.findByRole('heading', { level: 1, name: HEADINGS[kind].ar });
      expect(document.documentElement.lang).toBe('ar');
      expect(document.documentElement.dir).toBe('rtl');
      // The version is isolated left to right; the date takes the direction of its month name.
      expect(screen.getByText(CURRENT[kind]).getAttribute('dir')).toBe('ltr');
      cleanup();
    }
  });

  it('english_page_is_ltr', async () => {
    open({ language: 'en', path: '/terms', fetch: never });
    await screen.findByRole('heading', { level: 1, name: 'Terms of use' });
    expect(document.documentElement.dir).toBe('ltr');
  });

  it('the_privacy_policy_shows_the_contact_placeholder_until_an_address_exists', async () => {
    open({ language: 'en', path: '/privacy', fetch: never });
    expect(await screen.findByText('The contact address will be published here.')).toBeDefined();
    cleanup();
    open({ language: 'ar', path: '/privacy', fetch: never });
    expect(await screen.findByText('سيُنشر عنوان التواصل هنا.')).toBeDefined();
  });

  it('a_published_contact_address_is_a_mail_link', async () => {
    open({
      language: 'ar',
      path: '/privacy',
      fetch: never,
      policies: { ...POLICY_LIBRARY, contact: { kind: 'email', address: 'privacy@x.example' } },
    });
    const link = await screen.findByRole('link', { name: 'privacy@x.example' });
    expect(link.getAttribute('href')).toBe('mailto:privacy@x.example');
    expect(link.closest('bdi')?.getAttribute('dir')).toBe('ltr');
    expect(screen.queryByText('سيُنشر عنوان التواصل هنا.')).toBeNull();
  });

  it('the_privacy_policy_links_to_the_account_deletion_page (FR-009 criterion 2)', async () => {
    for (const language of ['en', 'ar'] as const) {
      open({ language, path: '/privacy', fetch: never });
      await screen.findByRole('heading', { level: 1 });
      const links = screen.getAllByRole('link').map((link) => link.getAttribute('href'));
      expect(links, language).toContain('/delete-account');
      cleanup();
    }
  });

  it('marked_gaps_for_legal_text_are_labelled', async () => {
    open({ language: 'en', path: '/terms', fetch: never });
    await screen.findByRole('heading', { level: 1 });
    expect(screen.getAllByText('To be added after legal review').length).toBeGreaterThan(0);
  });

  it('a_final_document_has_no_draft_banner', async () => {
    const final: PolicyLibrary = {
      ...POLICY_LIBRARY,
      versions: {
        ...POLICY_LIBRARY.versions,
        terms: { ...POLICY_LIBRARY.versions.terms, draft: false },
      },
    };
    open({ language: 'en', path: '/terms', fetch: never, policies: final });
    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByRole('note')).toBeNull();
  });
});

describe('no fallback to the other language (FR-039 criterion 5)', () => {
  const withoutArabic: PolicyLibrary = {
    ...POLICY_LIBRARY,
    documents: {
      privacy: { en: shipped('privacy', 'en') },
      terms: { en: shipped('terms', 'en') },
    },
  };

  it('arabic_never_falls_back_to_english', async () => {
    for (const kind of POLICY_KINDS) {
      open({ language: 'ar', path: `/${kind}`, fetch: never, policies: withoutArabic });
      expect(
        await screen.findByRole('heading', { level: 1, name: HEADINGS[kind].ar }),
      ).toBeDefined();
      expect(screen.getByText('هذه الوثيقة غير متاحة باللغة العربية بعد.')).toBeDefined();
      expect(screen.queryAllByRole('heading', { level: 2 })).toEqual([]);
      const page = document.body.textContent;
      for (const text of policyTexts(shipped(kind, 'en'))) {
        if (text.trim().length > 3) expect(page, kind).not.toContain(text);
      }
      expect(interfaceText()).not.toMatch(LATIN_LETTER);
      cleanup();
    }
  });

  it('an_arabic_text_written_for_an_older_version_is_not_shown', async () => {
    const outdated: PolicyLibrary = {
      ...POLICY_LIBRARY,
      documents: {
        ...POLICY_LIBRARY.documents,
        terms: {
          ...POLICY_LIBRARY.documents.terms,
          ar: { ...shipped('terms', 'ar'), version: 'older' },
        },
      },
    };
    open({ language: 'ar', path: '/terms', fetch: never, policies: outdated });
    expect(await screen.findByText('هذه الوثيقة غير متاحة باللغة العربية بعد.')).toBeDefined();
  });

  it('english_never_falls_back_to_arabic', async () => {
    const withoutEnglish: PolicyLibrary = {
      ...POLICY_LIBRARY,
      documents: {
        ...POLICY_LIBRARY.documents,
        privacy: { ar: shipped('privacy', 'ar') },
      },
    };
    open({ language: 'en', path: '/privacy', fetch: never, policies: withoutEnglish });
    expect(await screen.findByText('This document is not available in English yet.')).toBeDefined();
    expect(interfaceText()).not.toMatch(ARABIC_LETTER);
  });
});

describe('change notice (FR-039 criterion 4)', () => {
  function notice(): HTMLElement | null {
    return screen.queryByRole('complementary');
  }

  it('notice_shown_when_last_seen_version_is_older', async () => {
    const device = seenStorage({ privacy: '0', terms: CURRENT.terms });
    open({ language: 'en', device });

    const aside = await screen.findByRole('complementary', { name: 'Documents updated' });
    expect(within(aside).getByRole('heading', { level: 2 }).textContent).toBe('Documents updated');
    const links = within(aside).getAllByRole('link');
    expect(links.map((link) => [link.textContent, link.getAttribute('href')])).toEqual([
      ['Privacy policy', '/privacy'],
    ]);
    // Announced without interrupting: inside a polite live region that was there from the start.
    expect(aside.parentElement?.getAttribute('aria-live')).toBe('polite');
    expect(within(aside).getByRole('button', { name: 'Dismiss' })).toBeDefined();
  });

  it('notice_lists_both_documents_when_both_changed_in_arabic', async () => {
    open({ language: 'ar', device: seenStorage({ privacy: '0', terms: '0' }) });
    const aside = await screen.findByRole('complementary', { name: 'تم تحديث الوثائق' });
    expect(
      within(aside)
        .getAllByRole('link')
        .map((link) => link.getAttribute('href')),
    ).toEqual(['/privacy', '/terms']);
    expect(within(aside).getByRole('link', { name: 'شروط الاستخدام' })).toBeDefined();
    expect(within(aside).getByRole('button', { name: 'إغلاق' })).toBeDefined();
    expect(interfaceText()).not.toMatch(LATIN_LETTER);
  });

  it('notice_appears_on_every_screen_including_the_policy_pages', async () => {
    open({ language: 'en', path: '/expenses', device: seenStorage({ privacy: '0', terms: '0' }) });
    expect(await screen.findByRole('complementary', { name: 'Documents updated' })).toBeDefined();
  });

  it('no_notice_when_versions_match', async () => {
    const device = seenStorage(CURRENT);
    open({ language: 'en', device });
    await screen.findByText('test-release');
    expect(notice()).toBeNull();
    expect(device.getItem(POLICY_VERSIONS_STORAGE_KEY)).toBe(JSON.stringify(CURRENT));
  });

  it('first_visit_shows_no_notice_and_records_the_current_versions', async () => {
    const device = memoryStorage();
    open({ language: 'en', device });
    await screen.findByText('test-release');
    expect(notice()).toBeNull();
    expect(JSON.parse(device.getItem(POLICY_VERSIONS_STORAGE_KEY) ?? 'null')).toEqual(CURRENT);
  });

  it('a_raised_version_after_the_first_visit_shows_the_notice', async () => {
    const device = memoryStorage();
    open({ language: 'en', device });
    await screen.findByText('test-release');
    cleanup();

    open({ language: 'en', device, fetch: configWith({ ...CURRENT, terms: '99' }) });
    const aside = await screen.findByRole('complementary');
    expect(within(aside).getByRole('link').getAttribute('href')).toBe('/terms');
  });

  it('dismissing_marks_the_current_versions_as_seen', async () => {
    const device = seenStorage({ privacy: '0', terms: '0' });
    open({ language: 'en', device });
    fireEvent.click(await screen.findByRole('button', { name: 'Dismiss' }));
    expect(notice()).toBeNull();
    expect(JSON.parse(device.getItem(POLICY_VERSIONS_STORAGE_KEY) ?? 'null')).toEqual(CURRENT);
    cleanup();

    open({ language: 'en', device });
    await screen.findByText('test-release');
    expect(notice()).toBeNull();
  });

  it('a_corrupt_stored_value_is_treated_as_a_first_visit', async () => {
    for (const stored of ['not json', '{"privacy":1,"terms":"1"}', '[]', 'null']) {
      const device = memoryStorage({ [POLICY_VERSIONS_STORAGE_KEY]: stored });
      open({ language: 'en', device });
      await screen.findByText('test-release');
      expect(notice(), stored).toBeNull();
      expect(JSON.parse(device.getItem(POLICY_VERSIONS_STORAGE_KEY) ?? 'null'), stored).toEqual(
        CURRENT,
      );
      cleanup();
    }
  });

  it('no_notice_while_config_is_loading_or_when_it_fails', async () => {
    const device = seenStorage({ privacy: '0', terms: '0' });
    open({ language: 'en', device, fetch: never });
    await screen.findByRole('status');
    expect(notice()).toBeNull();
    cleanup();

    open({ language: 'en', device, fetch: failing });
    await screen.findByRole('alert');
    expect(notice()).toBeNull();
    expect(device.getItem(POLICY_VERSIONS_STORAGE_KEY)).toBe(
      JSON.stringify({ privacy: '0', terms: '0' }),
    );
  });

  it('blocked_storage_shows_no_notice_and_the_app_still_works', async () => {
    for (const name of ['SecurityError', 'QuotaExceededError'] as const) {
      const storage = failingStorage(name);
      const app = createWebApp({
        languages: ['en'],
        store: deviceLanguageStore(() => storage),
        policySeen: devicePolicySeenStore(() => storage),
        api: createApiClient({ fetch: serving }),
        document,
      });
      render(<App app={app} router={createMemoryRouter(appRoutes)} />);
      expect(await screen.findByText('test-release'), name).toBeDefined();
      expect(notice(), name).toBeNull();
      cleanup();
    }
  });

  it('the_device_store_survives_reaching_for_storage_throwing', () => {
    const store = devicePolicySeenStore(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    expect(store.read()).toBeUndefined();
    expect(() => store.write(CURRENT)).not.toThrow();
  });

  it('the_default_device_store_uses_window_localStorage_guarded', () => {
    // Reaching window.localStorage throws in the unit tests (testing/no-global-storage.ts).
    const store = devicePolicySeenStore();
    expect(store.read()).toBeUndefined();
    expect(() => store.write(CURRENT)).not.toThrow();
  });

  it('a_visitor_outside_the_audience_sees_no_notice_and_nothing_is_stored', async () => {
    // The seam T-022 switches to "signed-in users only" (audience.ts).
    const device = seenStorage({ privacy: '0', terms: '0' });
    const routes: RouteObject[] = [{ path: '/', element: <PolicyNoticeFor eligible={false} /> }];
    open({ language: 'en', device, routes });
    // Give the configuration time to arrive.
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(notice()).toBeNull();

    cleanup();
    const empty = memoryStorage();
    open({ language: 'en', device: empty, routes });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(empty.length).toBe(0);
  });
});

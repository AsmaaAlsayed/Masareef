// @vitest-environment happy-dom
import { createApiClient } from '@masareef/api-types';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { createMemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from './App.js';
import { createWebApp, deviceLanguageStore } from './bootstrap.js';
import { appRoutes } from './routes.js';

const CONFIG = { googleClientId: null, termsVersion: '0', privacyVersion: '0', release: 'abc1234' };
const REQUEST_ID = '0f8fad5b-d9cb-469f-a165-70867728950e';
const ARABIC_INDIC = /[٠-٩۰-۹]/;
const ARABIC_LETTER = /[؀-ۿ]/;
const LATIN_LETTER = /[A-Za-z]/;

type Fetch = (input: string, init: RequestInit) => Promise<Response>;

const ok: Fetch = () =>
  Promise.resolve(
    new Response(JSON.stringify(CONFIG), { headers: { 'Content-Type': 'application/json' } }),
  );

const failing: Fetch = () =>
  Promise.resolve(
    new Response(
      JSON.stringify({
        type: 'about:blank',
        title: 'Internal Server Error',
        status: 500,
        code: 'internal',
        request_id: REQUEST_ID,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/problem+json', 'X-Request-Id': REQUEST_ID },
      },
    ),
  );

const offline: Fetch = () => Promise.reject(new TypeError('Failed to fetch'));
const never: Fetch = () => new Promise(() => undefined);

function open(language: 'en' | 'ar', fetch: Fetch, path = '/'): void {
  window.localStorage.clear();
  const app = createWebApp({
    languages: [language],
    store: deviceLanguageStore(),
    api: createApiClient({ fetch }),
    document,
  });
  render(<App app={app} router={createMemoryRouter(appRoutes, { initialEntries: [path] })} />);
}

/** The text the interface wrote, without values the server sent (those are marked with <bdi>). */
function interfaceText(): string {
  const page = document.body.cloneNode(true) as HTMLElement;
  for (const value of page.querySelectorAll('bdi')) value.remove();
  // The language control names the other language in that language, on purpose.
  for (const control of page.querySelectorAll('[data-language-switch]')) control.remove();
  return page.textContent;
}

afterEach(() => {
  cleanup();
});

describe('skeleton page shows the release from GET /config (FR-020 criteria 1 and 2)', () => {
  it('shows_the_release_in_english', async () => {
    open('en', ok);
    expect(await screen.findByText('abc1234')).toBeDefined();
    expect(screen.getByRole('heading', { level: 1, name: 'Masareef' })).toBeDefined();
    expect(within(screen.getByRole('main')).getByText('Release')).toBeDefined();
    expect(interfaceText()).not.toMatch(ARABIC_LETTER);
  });

  it('shows_the_release_in_arabic_with_no_english_interface_text', async () => {
    open('ar', ok);
    expect(await screen.findByText('abc1234')).toBeDefined();
    expect(screen.getByRole('heading', { level: 1, name: 'مصاريف' })).toBeDefined();
    expect(within(screen.getByRole('main')).getByText('الإصدار')).toBeDefined();
    expect(interfaceText()).not.toMatch(LATIN_LETTER);
    expect(document.body.textContent).not.toMatch(ARABIC_INDIC);
  });

  it('the_release_is_isolated_left_to_right', async () => {
    open('ar', ok);
    const release = await screen.findByText('abc1234');
    expect(release.tagName).toBe('BDI');
    expect(release.getAttribute('dir')).toBe('ltr');
  });

  for (const [language, text] of [
    ['en', 'Loading…'],
    ['ar', 'جارٍ التحميل…'],
  ] as const) {
    it(`loading_state_is_translated_${language}`, () => {
      open(language, never);
      expect(screen.getByRole('status').textContent).toBe(text);
    });
  }
});

describe('error states (NFR-028)', () => {
  it('a_server_error_shows_a_translated_message_and_the_request_id', async () => {
    open('ar', failing);
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('حدث خطأ');
    expect(within(alert).getByText(REQUEST_ID).tagName).toBe('BDI');
    expect(alert.textContent).not.toContain('internal');
    expect(interfaceText()).not.toMatch(LATIN_LETTER);
  });

  it('a_server_error_in_english', async () => {
    open('en', failing);
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Something went wrong');
    expect(alert.textContent).toContain(REQUEST_ID);
  });

  it('no_connection_shows_a_translated_message_without_a_request_id', async () => {
    open('en', offline);
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Could not reach Masareef');
    expect(within(alert).queryByText(/reference/i)).toBeNull();
  });

  it('retry_fetches_again', async () => {
    let calls = 0;
    const flaky: Fetch = (input, init) => {
      calls += 1;
      return calls === 1 ? failing(input, init) : ok(input, init);
    };
    open('en', flaky);
    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('abc1234')).toBeDefined();
    expect(calls).toBe(2);
  });
});

describe('declared routes render translated placeholders', () => {
  const routes: readonly (readonly [string, string, string])[] = [
    ['/sign-in', 'Sign in', 'تسجيل الدخول'],
    ['/sign-up', 'Create an account', 'إنشاء حساب'],
    ['/verify-email', 'Verify your email', 'تأكيد البريد الإلكتروني'],
    ['/reset-password', 'Reset your password', 'إعادة تعيين كلمة المرور'],
    ['/expenses', 'Expenses', 'المصاريف'],
    ['/expenses/new', 'Add an expense', 'إضافة مصروف'],
    ['/expenses/123', 'Expense', 'مصروف'],
    ['/summary', 'Monthly summary', 'ملخص الشهر'],
    ['/settings', 'Settings', 'الإعدادات'],
    ['/delete-account', 'Delete account', 'حذف الحساب'],
    ['/download', 'Download the Android app', 'تنزيل تطبيق أندرويد'],
    ['/privacy', 'Privacy policy', 'سياسة الخصوصية'],
    ['/terms', 'Terms of use', 'شروط الاستخدام'],
    ['/no-such-page', 'Page not found', 'الصفحة غير موجودة'],
  ];
  for (const [path, english, arabic] of routes) {
    it(`placeholder_${path}_is_translated`, async () => {
      open('en', never, path);
      expect(await screen.findByRole('heading', { level: 1, name: english })).toBeDefined();
      expect(interfaceText()).not.toMatch(ARABIC_LETTER);
      cleanup();

      open('ar', never, path);
      expect(await screen.findByRole('heading', { level: 1, name: arabic })).toBeDefined();
      expect(interfaceText()).not.toMatch(LATIN_LETTER);
    });
  }
});

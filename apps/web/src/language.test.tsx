// @vitest-environment happy-dom
import { createApiClient } from '@masareef/api-types';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createMemoryRouter } from 'react-router';
import type { RouteObject } from 'react-router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { App } from './App.js';
import { createWebApp, deviceLanguageStore, LANGUAGE_STORAGE_KEY } from './bootstrap.js';
import type { LanguageStore } from './bootstrap.js';
import { devicePolicySeenStore } from './policies/notice.js';
import { appRoutes, Layout } from './routes.js';
import { failingStorage, memoryStorage, withGlobalLocalStorage } from './testing/storage.js';

const CONFIG = {
  googleClientId: null,
  termsVersion: '0',
  privacyVersion: '0',
  release: 'test-release',
};

const api = createApiClient({
  fetch: () =>
    Promise.resolve(
      new Response(JSON.stringify(CONFIG), { headers: { 'Content-Type': 'application/json' } }),
    ),
});

/** A device store over this test's own storage, optionally with a stored language. */
function storeWith(initial?: string, storage = memoryStorage()): LanguageStore {
  if (initial !== undefined) storage.setItem(LANGUAGE_STORAGE_KEY, initial);
  return deviceLanguageStore(() => storage);
}

/** The policy versions seen, kept apart from the language store these tests inspect. */
const ownPolicyStore = () => devicePolicySeenStore(() => memoryStorage());

/** Opens the app as a visit would: the browser's language list and the device store. */
function open(languages: readonly string[], store: LanguageStore, routes = appRoutes): void {
  const app = createWebApp({ languages, store, policySeen: ownPolicyStore(), api, document });
  const router = createMemoryRouter(routes, { initialEntries: ['/'] });
  render(<App app={app} router={router} />);
}

function switchControl(): HTMLElement {
  return screen.getByRole('button', { name: /^(English|العربية)$/ });
}

beforeEach(() => {
  document.documentElement.removeAttribute('lang');
  document.documentElement.removeAttribute('dir');
});

afterEach(() => {
  cleanup();
});

describe('first visit (FR-021 criteria 1 and 2)', () => {
  for (const languages of [['ar'], ['ar-EG'], ['ar-EG', 'en-US']]) {
    it(`arabic_browser_language_starts_in_arabic ${languages.join(',')}`, async () => {
      open(languages, storeWith());
      expect(await screen.findByRole('heading', { level: 1, name: 'مصاريف' })).toBeDefined();
      expect(document.documentElement.lang).toBe('ar');
      expect(document.documentElement.dir).toBe('rtl');
    });
  }

  for (const languages of [['fr'], ['fr-FR', 'fr'], ['en-US']]) {
    it(`french_browser_language_starts_in_english ${languages.join(',')}`, async () => {
      open(languages, storeWith());
      expect(await screen.findByRole('heading', { level: 1, name: 'Masareef' })).toBeDefined();
      expect(document.documentElement.lang).toBe('en');
      expect(document.documentElement.dir).toBe('ltr');
    });
  }

  it('no_browser_language_starts_in_english', async () => {
    open([], storeWith());
    expect(await screen.findByRole('heading', { level: 1, name: 'Masareef' })).toBeDefined();
  });
});

describe('language control (FR-021 criterion 3)', () => {
  it('switching_language_sets_dir_rtl_and_lang_ar', async () => {
    open(['en-US'], storeWith());
    await screen.findByRole('heading', { level: 1, name: 'Masareef' });

    fireEvent.click(screen.getByRole('button', { name: 'العربية' }));

    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
    expect(screen.getByRole('heading', { level: 1, name: 'مصاريف' })).toBeDefined();
    expect(document.title).toBe('مصاريف');

    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    expect(document.documentElement.lang).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');
    expect(document.title).toBe('Masareef');
  });

  it('the_control_names_the_other_language_in_that_language', async () => {
    open(['en-US'], storeWith());
    await screen.findByRole('heading', { level: 1 });
    expect(switchControl().getAttribute('lang')).toBe('ar');
    fireEvent.click(switchControl());
    expect(switchControl().getAttribute('lang')).toBe('en');
  });

  it('switching_language_keeps_typed_form_values', () => {
    let mounts = 0;
    function TypedForm() {
      // Counts renders that create the inputs: a remount would lose what was typed.
      mounts += 1;
      return (
        <form>
          <input data-testid="amount" defaultValue="" />
          <textarea data-testid="note" defaultValue="" />
        </form>
      );
    }
    const routes: RouteObject[] = [
      { element: <Layout />, children: [{ path: '/', element: <TypedForm /> }] },
    ];
    open(['en-US'], storeWith(), routes);

    const amount = screen.getByTestId<HTMLInputElement>('amount');
    const note = screen.getByTestId<HTMLTextAreaElement>('note');
    fireEvent.change(amount, { target: { value: '50' } });
    fireEvent.change(note, { target: { value: 'lunch مع أحمد' } });
    const mountsBefore = mounts;

    fireEvent.click(screen.getByRole('button', { name: 'العربية' }));
    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    fireEvent.click(screen.getByRole('button', { name: 'العربية' }));

    expect(document.documentElement.dir).toBe('rtl');
    expect(screen.getByTestId('amount')).toBe(amount);
    expect(screen.getByTestId('note')).toBe(note);
    expect(amount.value).toBe('50');
    expect(note.value).toBe('lunch مع أحمد');
    expect(mounts).toBe(mountsBefore);
  });

  it('the_control_is_on_every_declared_screen', async () => {
    const paths = ['/', '/sign-in', '/expenses/new', '/expenses/abc', '/privacy', '/no-such-page'];
    for (const path of paths) {
      const app = createWebApp({
        languages: ['ar'],
        store: storeWith(),
        policySeen: ownPolicyStore(),
        api,
        document,
      });
      const router = createMemoryRouter(appRoutes, { initialEntries: [path] });
      render(<App app={app} router={router} />);
      expect(await screen.findByRole('heading', { level: 1 }), path).toBeDefined();
      expect(screen.getByRole('button', { name: 'English' }), path).toBeDefined();
      cleanup();
    }
  });
});

describe('remembered on the device (FR-021 criterion 5)', () => {
  it('language_choice_survives_reload_when_signed_out', async () => {
    const device = memoryStorage();
    open(
      ['en-US'],
      deviceLanguageStore(() => device),
    );
    fireEvent.click(await screen.findByRole('button', { name: 'العربية' }));
    cleanup();
    document.documentElement.removeAttribute('dir');

    // A reload: a new app, the same browser language, the same device storage.
    open(
      ['en-US'],
      deviceLanguageStore(() => device),
    );
    expect(await screen.findByRole('heading', { level: 1, name: 'مصاريف' })).toBeDefined();
    expect(document.documentElement.dir).toBe('rtl');
  });

  it('the_stored_choice_wins_over_the_browser_language', async () => {
    open(['ar-EG'], storeWith('en'));
    expect(await screen.findByRole('heading', { level: 1, name: 'Masareef' })).toBeDefined();
  });

  it('a_corrupt_stored_value_is_ignored', async () => {
    open(['ar-EG'], storeWith('fr'));
    expect(await screen.findByRole('heading', { level: 1, name: 'مصاريف' })).toBeDefined();
  });

  it('only_the_language_is_stored', async () => {
    const device = memoryStorage();
    open(['en-US'], storeWith(undefined, device));
    fireEvent.click(await screen.findByRole('button', { name: 'العربية' }));
    expect(device.length).toBe(1);
    expect(device.key(0)).toBe('masareef.language');
    expect(device.getItem('masareef.language')).toBe('ar');
  });

  it('nothing_is_stored_until_the_user_chooses', async () => {
    const device = memoryStorage();
    open(['ar-EG'], storeWith(undefined, device));
    await screen.findByRole('heading', { level: 1 });
    expect(device.length).toBe(0);
  });

  it('blocked_storage_still_switches_and_starts_from_the_browser', async () => {
    const blocked = deviceLanguageStore(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    open(['ar-EG'], blocked);
    expect(await screen.findByRole('heading', { level: 1, name: 'مصاريف' })).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    expect(document.documentElement.lang).toBe('en');
  });

  it('storage_whose_calls_fail_still_switches', async () => {
    for (const name of ['SecurityError', 'QuotaExceededError'] as const) {
      open(
        ['en-US'],
        deviceLanguageStore(() => failingStorage(name)),
      );
      fireEvent.click(await screen.findByRole('button', { name: 'العربية' }));
      expect(document.documentElement.lang, name).toBe('ar');
      cleanup();
    }
  });
});

describe('the default device store (production path)', () => {
  it('uses_window_localStorage', async () => {
    const device = memoryStorage();
    await withGlobalLocalStorage(device, async () => {
      open(['en-US'], deviceLanguageStore());
      fireEvent.click(await screen.findByRole('button', { name: 'العربية' }));
      cleanup();
      open(['en-US'], deviceLanguageStore());
      expect(await screen.findByRole('heading', { level: 1, name: 'مصاريف' })).toBeDefined();
    });
    expect(device.getItem(LANGUAGE_STORAGE_KEY)).toBe('ar');
  });

  it('survives_window_localStorage_itself_throwing', async () => {
    // Reaching window.localStorage throws in the unit tests (testing/no-global-storage.ts), as it
    // can in a browser with blocked site data: the app starts from the browser and still switches.
    const store = deviceLanguageStore();
    expect(store.read()).toBeUndefined();
    expect(() => store.write('ar')).not.toThrow();
    open(['ar-EG'], store);
    expect(await screen.findByRole('heading', { level: 1, name: 'مصاريف' })).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    expect(document.documentElement.lang).toBe('en');
  });
});

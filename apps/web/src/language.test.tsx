// @vitest-environment happy-dom
import { createApiClient } from '@masareef/api-types';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createMemoryRouter } from 'react-router';
import type { RouteObject } from 'react-router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { App } from './App.js';
import { createWebApp, deviceLanguageStore } from './bootstrap.js';
import type { LanguageStore } from './bootstrap.js';
import { appRoutes, Layout } from './routes.js';

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

/** A device store over a fake Storage holding one value. */
function storeWith(initial?: string): LanguageStore {
  let value = initial ?? null;
  return deviceLanguageStore(
    () =>
      ({
        getItem: () => value,
        setItem: (_key: string, next: string) => {
          value = next;
        },
      }) as unknown as Storage,
  );
}

/** Opens the app as a visit would: the browser's language list and the device store. */
function open(languages: readonly string[], store: LanguageStore, routes = appRoutes): void {
  const app = createWebApp({ languages, store, api, document });
  const router = createMemoryRouter(routes, { initialEntries: ['/'] });
  render(<App app={app} router={router} />);
}

function switchControl(): HTMLElement {
  return screen.getByRole('button', { name: /^(English|العربية)$/ });
}

beforeEach(() => {
  document.documentElement.removeAttribute('lang');
  document.documentElement.removeAttribute('dir');
  window.localStorage.clear();
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
      const app = createWebApp({ languages: ['ar'], store: storeWith(), api, document });
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
    open(['en-US'], deviceLanguageStore());
    fireEvent.click(await screen.findByRole('button', { name: 'العربية' }));
    cleanup();
    document.documentElement.removeAttribute('dir');

    // A reload: a new app, the same browser language, the same device storage.
    open(['en-US'], deviceLanguageStore());
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
    open(['en-US'], deviceLanguageStore());
    fireEvent.click(await screen.findByRole('button', { name: 'العربية' }));
    expect(Object.keys(window.localStorage)).toEqual(['masareef.language']);
    expect(window.localStorage.getItem('masareef.language')).toBe('ar');
  });

  it('nothing_is_stored_until_the_user_chooses', async () => {
    open(['ar-EG'], deviceLanguageStore());
    await screen.findByRole('heading', { level: 1 });
    expect(window.localStorage.length).toBe(0);
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

  it('storage_that_throws_on_write_still_switches', async () => {
    const full = deviceLanguageStore(
      () =>
        ({
          getItem: () => null,
          setItem: () => {
            throw new DOMException('full', 'QuotaExceededError');
          },
        }) as unknown as Storage,
    );
    open(['en-US'], full);
    fireEvent.click(await screen.findByRole('button', { name: 'العربية' }));
    expect(document.documentElement.lang).toBe('ar');
  });
});

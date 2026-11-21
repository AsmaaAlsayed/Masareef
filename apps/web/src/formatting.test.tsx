// @vitest-environment happy-dom
import { createApiClient } from '@masareef/api-types';
import { act, cleanup, render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { afterEach, describe, expect, it } from 'vitest';
import { createWebApp, deviceLanguageStore } from './bootstrap.js';
import type { WebApp } from './bootstrap.js';
import { Amount, UserText } from './formatting.js';
import { memoryStorage } from './testing/storage.js';

const NBSP = ' ';
const ARABIC_INDIC = /[٠-٩۰-۹]/;

const api = createApiClient({ fetch: () => new Promise<Response>(() => undefined) });

/** Renders `ui` in an app whose interface language is `language`; sets `dir` on <html>. */
function renderIn(language: 'en' | 'ar', ui: ReactNode): { app: WebApp; container: HTMLElement } {
  const storage = memoryStorage();
  const app = createWebApp({
    languages: [language],
    store: deviceLanguageStore(() => storage),
    api,
    document,
  });
  const { container } = render(<I18nextProvider i18n={app.i18n}>{ui}</I18nextProvider>);
  return { app, container };
}

function only(container: HTMLElement, selector: string): Element {
  const found = container.querySelectorAll(selector);
  expect(found.length).toBe(1);
  const [element] = found;
  if (element === undefined) throw new Error(`no ${selector}`);
  return element;
}

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute('lang');
  document.documentElement.removeAttribute('dir');
});

describe('<Amount> (FR-022 criterion 2, FR-015 note)', () => {
  it('1234.5_EGP_formats_as_1,234.50_EGP_in_english', () => {
    const { container } = renderIn('en', <Amount minor={123450} currency="EGP" />);
    expect(container.textContent).toBe(`1,234.50${NBSP}EGP`);
    const number = only(container, 'bdi');
    expect(number.getAttribute('dir')).toBe('ltr');
    expect(number.textContent).toBe('1,234.50');
  });

  it('1234.5_EGP_formats_as_1,234.50_ج.م_in_arabic', () => {
    const { container } = renderIn('ar', <Amount minor={123450} currency="EGP" />);
    expect(container.textContent).toBe(`1,234.50${NBSP}ج.م`);
    expect(container.textContent).not.toMatch(ARABIC_INDIC);
  });

  it('in_right_to_left_layout_the_digits_are_isolated_left_to_right_and_keep_their_order', () => {
    // happy-dom does no layout, so this checks what the browser's bidi algorithm is given: the
    // number alone, in logical order, inside <bdi dir="ltr"> (which isolates it and sets its
    // direction, HTML "the bdi element"), and the label outside it, after it in reading order.
    const { container } = renderIn('ar', <Amount minor={123450} currency="EGP" />);
    expect(document.documentElement.dir).toBe('rtl');
    const number = only(container, 'bdi');
    expect(number.getAttribute('dir')).toBe('ltr');
    expect(number.textContent).toBe('1,234.50');
    expect(number.textContent).not.toContain('ج.م');
    const amount = number.parentElement;
    expect(amount?.firstChild).toBe(number);
    expect(amount?.textContent?.endsWith('ج.م')).toBe(true);
  });

  it('KWD_shows_three_decimals_in_both_languages', () => {
    const english = renderIn('en', <Amount minor={1250} currency="KWD" />);
    expect(english.container.textContent).toBe(`1.250${NBSP}KWD`);
    cleanup();
    const arabic = renderIn('ar', <Amount minor={1250} currency="KWD" />);
    expect(arabic.container.textContent).toBe(`1.250${NBSP}KWD`);
  });

  it('zero_and_a_large_total_render', () => {
    const { container } = renderIn(
      'en',
      <>
        <Amount minor={0} currency="USD" />
        <Amount minor={123456789012} currency="EGP" />
      </>,
    );
    expect([...container.querySelectorAll('bdi')].map((bdi) => bdi.textContent)).toEqual([
      '0.00',
      '1,234,567,890.12',
    ]);
  });

  it('switching_language_changes_the_label_in_place', () => {
    const { app, container } = renderIn('en', <Amount minor={5000} currency="EGP" />);
    expect(container.textContent).toBe(`50.00${NBSP}EGP`);
    act(() => app.chooseLanguage('ar'));
    expect(container.textContent).toBe(`50.00${NBSP}ج.م`);
  });
});

describe('<UserText> (FR-020 criterion 3, FR-022 criterion 5)', () => {
  it('a_mixed_note_in_the_arabic_interface_is_isolated_with_its_own_direction', () => {
    const note = 'lunch at Costa مع أحمد';
    const { container } = renderIn('ar', <UserText text={note} />);
    const text = only(container, 'bdi');
    expect(text.getAttribute('dir')).toBe('auto');
    expect(text.textContent).toBe(note);
  });

  it('note_with_arabic_indic_digits_is_shown_exactly_as_typed', () => {
    const note = 'غدا ٥٠ مع ١٢ صديق';
    const { container } = renderIn('ar', <UserText text={note} />);
    expect(only(container, 'bdi').textContent).toBe(note);
  });

  it('markup_in_a_note_is_shown_as_text', () => {
    const note = '<script>alert(1)</script> <b>x</b>';
    const { container } = renderIn('en', <UserText text={note} />);
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('b')).toBeNull();
    expect(only(container, 'bdi').textContent).toBe(note);
  });

  it('spaces_and_line_breaks_are_kept', () => {
    const note = '  two  spaces\nand a line ';
    const { container } = renderIn('en', <UserText text={note} />);
    expect(only(container, 'bdi').textContent).toBe(note);
  });

  it('a_row_with_a_mixed_note_keeps_amount_and_note_as_separate_isolates', () => {
    // FR-020 criterion 3: the note's direction cannot move the amount, because each is isolated.
    const { container } = renderIn(
      'ar',
      <p>
        <Amount minor={5000} currency="EGP" /> <UserText text="lunch at Costa مع أحمد" />
      </p>,
    );
    const isolates = [...container.querySelectorAll('bdi')];
    expect(isolates.map((bdi) => [bdi.getAttribute('dir'), bdi.textContent])).toEqual([
      ['ltr', '50.00'],
      ['auto', 'lunch at Costa مع أحمد'],
    ]);
  });
});

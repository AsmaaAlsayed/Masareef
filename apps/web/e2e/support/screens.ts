import { fileURLToPath } from 'node:url';
import type { Locator, Page, TestInfo } from '@playwright/test';
import type { Screen, ScreenState, StateMarker } from '../screens.js';
import { fakeApi } from './api-fakes.js';
import { pseudoLocalize } from './pseudo-locale.js';
import { text } from './text.js';

/** The two languages of the app, and the browser language each run starts from. */
export const BROWSER_LOCALES = { en: 'en-GB', ar: 'ar-EG' } as const;

/** `pseudo` is the English app with the pseudo-locale texts (support/pseudo-locale.ts). */
export type LanguageUnderTest = keyof typeof BROWSER_LOCALES | 'pseudo';

/** Screenshots for review: apps/web/e2e/output/screenshots, uploaded by CI, never committed. */
export const SCREENSHOT_DIR = fileURLToPath(new URL('../output/screenshots/', import.meta.url));

/** The element that shows the state has been reached, in the language under test. */
export function stateMarker(page: Page, marker: StateMarker, language: LanguageUnderTest): Locator {
  if ('text' in marker) return page.getByText(marker.text, { exact: true });
  const role = page.getByRole(marker.role);
  if (marker.textKey === undefined) return role;
  const expected =
    language === 'pseudo'
      ? pseudoLocalize(text('en', marker.textKey))
      : text(language, marker.textKey);
  // By text, not accessible name: a live region such as `status` takes no name from its content.
  const literal = expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return role.filter({ hasText: new RegExp(`^\\s*${literal}\\s*$`) });
}

/** Opens the screen in the given state and waits until that state is on the screen. */
export async function openScreen(
  page: Page,
  screen: Screen,
  state: ScreenState,
  language: LanguageUnderTest,
): Promise<void> {
  await fakeApi(page, state.api);
  if (state.storage !== undefined) {
    // Before any script of the page runs, on the app's own origin.
    await page.addInitScript((entries) => {
      for (const [key, value] of Object.entries(entries)) window.localStorage.setItem(key, value);
    }, state.storage);
  }
  await page.goto(screen.path);
  await stateMarker(page, state.marker, language).waitFor();
}

/** Saves a full-page screenshot named by screen, state, language and project (engine and width). */
export async function saveScreenshot(
  page: Page,
  testInfo: TestInfo,
  screen: Screen,
  state: ScreenState,
  language: LanguageUnderTest,
): Promise<void> {
  const name = `${screen.id}--${state.name}--${language}--${testInfo.project.name}.png`;
  const path = `${SCREENSHOT_DIR}${name}`;
  await page.screenshot({ path, fullPage: true, animations: 'disabled' });
  await testInfo.attach(name, { path, contentType: 'image/png' });
}

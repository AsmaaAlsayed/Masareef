/**
 * Every screen of the inventory, in every state, in English and Arabic: the language and direction
 * the app sets, the axe scan with the WCAG 2.2 A and AA rules (NFR-025) and a full-page screenshot
 * for the screen-by-screen review (NFR-009). Each Playwright project is one engine at one width.
 */
import { expect, test } from '@playwright/test';
import { SCREENS } from './screens.js';
import { describeViolations, scanWcag22 } from './support/accessibility.js';
import { BROWSER_LOCALES, openScreen, saveScreenshot } from './support/screens.js';

const DIRECTION = { en: 'ltr', ar: 'rtl' } as const;

for (const language of ['en', 'ar'] as const) {
  test.describe(`${language}`, () => {
    // The language a user's browser asks for: the app starts in it (FR-021 criterion 1).
    test.use({ locale: BROWSER_LOCALES[language] });

    for (const screen of SCREENS) {
      for (const state of screen.states) {
        test(`${screen.id} ${state.name}`, async ({ page }, testInfo) => {
          await openScreen(page, screen, state, language);

          const html = page.locator('html');
          await expect(html).toHaveAttribute('lang', language);
          await expect(html).toHaveAttribute('dir', DIRECTION[language]);

          // Before the scan, so a failing scan still leaves the screenshot to look at.
          await saveScreenshot(page, testInfo, screen, state, language);

          const violations = await scanWcag22(page);
          expect(violations, describeViolations(violations)).toEqual([]);
        });
      }
    }
  });
}

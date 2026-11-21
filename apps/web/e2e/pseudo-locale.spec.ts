/**
 * The pseudo-locale run (NFR-009, "clipped text"): every screen of the inventory, in every state,
 * with each English text replaced by a longer accented form before the page first paints. Fails
 * when any text is cut off or spills out of its box, or when visible text was not reached by the
 * pseudo-locale (text not from the translations, which the check could not judge).
 */
import { expect, test } from '@playwright/test';
import { SCREENS } from './screens.js';
import {
  findClippedText,
  findTextOutsidePseudoLocale,
  installPseudoLocale,
  pseudoLocaleTexts,
} from './support/pseudo-locale.js';
import { BROWSER_LOCALES, openScreen, saveScreenshot } from './support/screens.js';

test.use({ locale: BROWSER_LOCALES.en });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(installPseudoLocale, pseudoLocaleTexts());
});

for (const screen of SCREENS) {
  for (const state of screen.states) {
    test(`pseudo ${screen.id} ${state.name}`, async ({ page }, testInfo) => {
      await openScreen(page, screen, state, 'pseudo');
      await saveScreenshot(page, testInfo, screen, state, 'pseudo');

      const outside = await page.evaluate(findTextOutsidePseudoLocale);
      expect(outside, 'visible text the pseudo-locale did not reach').toEqual([]);

      const clipped = await page.evaluate(findClippedText);
      expect(clipped, 'text cut off or spilling out of its box').toEqual([]);
    });
  }
}

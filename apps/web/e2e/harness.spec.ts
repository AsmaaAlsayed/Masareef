/**
 * Checks of the harness itself, in every engine: a fault planted in the page must fail the axe scan
 * with its rule id, and text cut off by a layout must be reported. Without these, a scan that had
 * stopped testing anything (a wrong tag list, a broken injection) would pass every screen.
 */
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { E2E_RELEASE } from './screens.js';
import { scanWcag22 } from './support/accessibility.js';
import { findClippedText } from './support/pseudo-locale.js';

test.use({ locale: 'en-GB' });

async function openHome(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByText(E2E_RELEASE, { exact: true }).waitFor();
}

/** Adds an element to the end of <main>. Styles are set through the DOM, which the CSP allows. */
async function plant(page: Page, tag: string, style: Partial<CSSStyleDeclaration>, text = '') {
  await page.locator('main').evaluate(
    (main, { tag, style, text }) => {
      const element = document.createElement(tag);
      element.textContent = text;
      Object.assign(element.style, style);
      element.dataset['planted'] = '';
      main.append(element);
    },
    { tag, style, text },
  );
}

test('the scan fails on text below 4.5:1 contrast, naming color-contrast', async ({ page }) => {
  await openHome(page);
  expect(await scanWcag22(page)).toEqual([]);

  // #959595 on white is 2.9:1.
  await plant(page, 'p', { color: '#959595', backgroundColor: '#ffffff' }, 'Planted low contrast');

  const rules = (await scanWcag22(page)).map((violation) => violation.rule);
  expect(rules).toContain('color-contrast');
});

test('the scan fails on a control without a label, naming label', async ({ page }) => {
  await openHome(page);
  await plant(page, 'input', {});

  const violations = await scanWcag22(page);
  expect(violations.map((violation) => violation.rule)).toContain('label');
  expect(violations.flatMap((violation) => violation.targets)).toContain('input');
});

test.describe('clipped text', () => {
  test('a heading cut off by overflow: hidden is reported', async ({ page }) => {
    await openHome(page);
    await page.locator('h1').evaluate((heading) => {
      Object.assign(heading.style, { inlineSize: '2em', overflow: 'hidden', whiteSpace: 'nowrap' });
    });

    const problems = await page.evaluate(findClippedText);
    expect(problems).toEqual([
      expect.objectContaining({ element: 'h1', detail: expect.stringMatching(/^clipped/) }),
    ]);
  });

  test('text truncated with an ellipsis is reported', async ({ page }) => {
    await openHome(page);
    await plant(
      page,
      'p',
      { inlineSize: '4em', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' },
      'A sentence far too long for its box',
    );

    const problems = await page.evaluate(findClippedText);
    expect(problems.map((problem) => problem.text)).toEqual([
      'A sentence far too long for its box',
    ]);
  });

  test('text spilling out of a fixed-size box is reported', async ({ page }) => {
    await openHome(page);
    await plant(
      page,
      'p',
      { inlineSize: '3em', whiteSpace: 'nowrap' },
      'Spills over its neighbours',
    );

    const problems = await page.evaluate(findClippedText);
    expect(problems).toEqual([
      expect.objectContaining({
        element: 'p',
        detail: expect.stringMatching(/^overflows its box/),
      }),
    ]);
  });

  test('a scrolling box is not reported: its text can be reached', async ({ page }) => {
    await openHome(page);
    await plant(
      page,
      'p',
      { inlineSize: '3em', whiteSpace: 'nowrap', overflow: 'auto' },
      'Scrolls',
    );

    expect(await page.evaluate(findClippedText)).toEqual([]);
  });
});

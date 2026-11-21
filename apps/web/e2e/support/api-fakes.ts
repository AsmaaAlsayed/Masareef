import type { Page, Route } from '@playwright/test';
import type { ApiFake } from '../screens.js';

/** The request id the faked server error carries, so the error state shows a reference. */
export const FAKE_REQUEST_ID = '00000000-0000-4000-8000-0000000000e2';

const SERVER_ERROR = JSON.stringify({
  type: 'about:blank',
  title: 'Internal Server Error',
  status: 500,
  code: 'internal',
  request_id: FAKE_REQUEST_ID,
});

async function answer(route: Route, fake: ApiFake): Promise<void> {
  switch (fake) {
    case 'pending':
      // Neither fulfilled nor continued: the request stays open until the page closes.
      return;
    case 'server-error':
      return route.fulfill({
        status: 500,
        contentType: 'application/problem+json',
        headers: { 'X-Request-Id': FAKE_REQUEST_ID },
        body: SERVER_ERROR,
      });
    case 'network-error':
      return route.abort('internetdisconnected');
  }
}

/**
 * Answers the listed API paths in place of the local stack, for states that the real stack cannot
 * produce on demand. Everything else, including the page and its files, comes from the stack.
 */
export async function fakeApi(
  page: Page,
  fakes: Readonly<Record<string, ApiFake>> = {},
): Promise<void> {
  for (const [path, fake] of Object.entries(fakes)) {
    await page.route(
      (url) => url.pathname === path,
      (route) => answer(route, fake),
    );
  }
}

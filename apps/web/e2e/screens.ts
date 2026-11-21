/**
 * The screen inventory (FR-020 criterion 5, NFR-009, NFR-025): every screen of the web app and the
 * states it is reviewed in. For each entry, state and language, the end-to-end run checks `lang`
 * and `dir`, runs the axe scan with the WCAG 2.2 A and AA rules and saves a full-page screenshot;
 * the pseudo-locale run checks the same entries for clipped text.
 *
 * Every task that adds or changes a screen adds or updates its entry here in the same pull request,
 * with its loading, empty and error states (docs/04-plan.md, "Test-first rule").
 */
import type { TextKey } from './support/text.js';

/** How the test answers one API path while a state is captured. */
export type ApiFake =
  /** No answer at all: the request stays pending, so the screen stays in its loading state. */
  | 'pending'
  /** 500 with an RFC 9457 problem body and a request id, as the API sends for an unexpected error. */
  | 'server-error'
  /** The request fails before any response, as when the device is offline. */
  | 'network-error';

/** What is on the screen only once the state has been reached. */
export type StateMarker =
  /** An element with this ARIA role and, when given, exactly this translated text. */
  | { readonly role: 'heading' | 'status' | 'alert'; readonly textKey?: TextKey }
  /** This literal text, for values that come from the server rather than the translations. */
  | { readonly text: string };

export interface ScreenState {
  /** Used in test titles and screenshot names: lower case, digits and hyphens. */
  readonly name: string;
  /** API paths (from the origin, without a query) answered by the test instead of the stack. */
  readonly api?: Readonly<Record<string, ApiFake>>;
  readonly marker: StateMarker;
}

export interface Screen {
  /** Used in test titles and screenshot names: lower case, digits and hyphens. */
  readonly id: string;
  /** The path a user opens. */
  readonly path: string;
  readonly states: readonly ScreenState[];
}

/** The release value the local stack is started with (playwright.config.ts). */
export const E2E_RELEASE = 'e2e-local';

const CONFIG_PATH = '/api/v1/config';

/** A declared route whose screen a later task builds: one state, its translated heading. */
const placeholder = (id: string, path: string, heading: TextKey): Screen => ({
  id,
  path,
  states: [{ name: 'placeholder', marker: { role: 'heading', textKey: heading } }],
});

export const SCREENS: readonly Screen[] = [
  {
    id: 'home',
    path: '/',
    states: [
      { name: 'ready', marker: { text: E2E_RELEASE } },
      {
        name: 'loading',
        api: { [CONFIG_PATH]: 'pending' },
        marker: { role: 'status', textKey: 'status.loading' },
      },
      { name: 'error', api: { [CONFIG_PATH]: 'server-error' }, marker: { role: 'alert' } },
      { name: 'offline', api: { [CONFIG_PATH]: 'network-error' }, marker: { role: 'alert' } },
    ],
  },
  placeholder('sign-in', '/sign-in', 'pages.signIn'),
  placeholder('sign-up', '/sign-up', 'pages.signUp'),
  placeholder('verify-email', '/verify-email', 'pages.verifyEmail'),
  placeholder('reset-password', '/reset-password', 'pages.resetPassword'),
  placeholder('expenses', '/expenses', 'pages.expenses'),
  placeholder('new-expense', '/expenses/new', 'pages.newExpense'),
  placeholder('expense', '/expenses/1', 'pages.expense'),
  placeholder('summary', '/summary', 'pages.summary'),
  placeholder('settings', '/settings', 'pages.settings'),
  placeholder('delete-account', '/delete-account', 'pages.deleteAccount'),
  placeholder('download', '/download', 'pages.download'),
  placeholder('privacy', '/privacy', 'pages.privacy'),
  placeholder('terms', '/terms', 'pages.terms'),
  {
    id: 'not-found',
    path: '/no-such-page',
    states: [{ name: 'ready', marker: { role: 'heading', textKey: 'notFound.title' } }],
  },
];

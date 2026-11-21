import type { EnglishTranslation } from '@masareef/core';
import { useTranslation } from 'react-i18next';
import { Link, Outlet } from 'react-router';
import type { RouteObject } from 'react-router';
import { HomePage } from './HomePage.js';
import { LanguageSwitch } from './LanguageSwitch.js';
import { PolicyNotice } from './policies/PolicyNotice.js';
import { PolicyPage } from './policies/PolicyPage.js';

/**
 * Every screen sits inside this layout, so the language control (FR-021 c3) and the policy change
 * notice (FR-039 c4) are on every screen.
 */
export function Layout() {
  const { t } = useTranslation();
  return (
    <>
      <header className="app-header">
        <Link to="/" className="app-name">
          {t('app.name')}
        </Link>
        <LanguageSwitch />
      </header>
      <PolicyNotice />
      <main>
        <Outlet />
      </main>
    </>
  );
}

type PageName = keyof EnglishTranslation['pages'];

/** A declared route whose screen is built by a later task. */
function PlaceholderPage({ page }: { readonly page: PageName }) {
  const { t } = useTranslation();
  return (
    <>
      <h1>{t(`pages.${page}`)}</h1>
      <p>{t('placeholder.body')}</p>
    </>
  );
}

function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <>
      <h1>{t('notFound.title')}</h1>
      <p>
        <Link to="/">{t('notFound.home')}</Link>
      </p>
    </>
  );
}

/** Replaces React Router's built-in error screen, whose text is English only. */
function RouteError() {
  const { t } = useTranslation();
  return (
    <main>
      <h1>{t('errors.generic')}</h1>
    </main>
  );
}

const placeholder = (path: string, page: PageName): RouteObject => ({
  path,
  element: <PlaceholderPage page={page} />,
});

/** The routes of architecture C1. Each later task replaces its placeholder with the screen. */
export const appRoutes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <HomePage /> },
      placeholder('sign-in', 'signIn'),
      placeholder('sign-up', 'signUp'),
      placeholder('verify-email', 'verifyEmail'),
      placeholder('reset-password', 'resetPassword'),
      placeholder('expenses', 'expenses'),
      placeholder('expenses/new', 'newExpense'),
      placeholder('expenses/:id', 'expense'),
      placeholder('summary', 'summary'),
      placeholder('settings', 'settings'),
      placeholder('delete-account', 'deleteAccount'),
      placeholder('download', 'download'),
      { path: 'privacy', element: <PolicyPage kind="privacy" /> },
      { path: 'terms', element: <PolicyPage kind="terms" /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

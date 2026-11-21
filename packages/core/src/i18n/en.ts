/**
 * English interface texts. The source of the key list: the Arabic file must have exactly these
 * keys (checked by TypeScript and by `npm run i18n:check`, NFR-009).
 */
export const en = {
  app: {
    name: 'Masareef',
  },
  language: {
    /** The language's own name, shown on the control that switches to it. */
    name: 'English',
  },
  home: {
    release: 'Release',
  },
  status: {
    loading: 'Loading…',
  },
  errors: {
    generic: 'Something went wrong. Please try again.',
    network: 'Could not reach Masareef. Check your connection and try again.',
    reference: 'Error reference',
  },
  actions: {
    retry: 'Try again',
  },
  notFound: {
    title: 'Page not found',
    home: 'Go to the home page',
  },
  placeholder: {
    body: 'This page is not available yet.',
  },
  date: {
    /**
     * Month names in displayed dates, "16 Nov 2026" (FR-022 criterion 3). Read by `formatDate` in
     * packages/core, which builds the date from them with Western digits.
     */
    months: {
      jan: 'Jan',
      feb: 'Feb',
      mar: 'Mar',
      apr: 'Apr',
      may: 'May',
      jun: 'Jun',
      jul: 'Jul',
      aug: 'Aug',
      sep: 'Sep',
      oct: 'Oct',
      nov: 'Nov',
      dec: 'Dec',
    },
  },
  pages: {
    signIn: 'Sign in',
    signUp: 'Create an account',
    verifyEmail: 'Verify your email',
    resetPassword: 'Reset your password',
    expenses: 'Expenses',
    newExpense: 'Add an expense',
    expense: 'Expense',
    summary: 'Monthly summary',
    settings: 'Settings',
    deleteAccount: 'Delete account',
    download: 'Download the Android app',
    privacy: 'Privacy policy',
    terms: 'Terms of use',
  },
} as const;

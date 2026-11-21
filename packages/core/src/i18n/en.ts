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
  /** Around the privacy policy and terms; the documents' own text is in src/policies. */
  policy: {
    draftTitle: 'Draft for review',
    draftBody:
      'This page is a draft, written by the team that builds Masareef to describe how the service works. It is not legal text and is awaiting legal review.',
    version: 'Version',
    effectiveDate: 'Effective date',
    /** Shown instead of the document when its text in this language is missing (FR-039 c5). */
    notAvailable: 'This document is not available in English yet.',
    /** Stands for the contact address until it exists (prerequisite P-12). */
    contactPending: 'The contact address will be published here.',
    pendingLabel: 'To be added after legal review',
  },
  /** The notice that a document has a new version (FR-039 criterion 4). */
  policyNotice: {
    title: 'Documents updated',
    body: 'A new version of the following has been published. Please read it:',
    dismiss: 'Dismiss',
  },
} as const;

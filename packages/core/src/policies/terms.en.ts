import type { PolicyDocument } from './types.js';

/**
 * Terms of use, English, version 1: a DRAFT factual description of how the service works and
 * what it expects of its users, written by the delivery team from the requirements and the
 * architecture. It contains no legal clauses: liability, warranties, governing law, disputes and
 * suspension are a marked gap for the legal text (OQ-06, T-086). Sources per section id are in
 * sources.ts; the Arabic text (terms.ar.ts) has the same sections.
 */
export const termsEn: PolicyDocument = {
  version: '1',
  sections: [
    {
      id: 'about',
      heading: 'About these terms',
      blocks: [
        {
          kind: 'paragraph',
          text: [
            'Masareef is a personal expense tracker with a web app and an Android app that share one account. These terms describe how the service works and what it expects of you. How your data is handled is described in the ',
            { link: '/privacy', text: 'privacy policy' },
            '.',
          ],
        },
      ],
    },
    {
      id: 'eligibility',
      heading: 'Who may use Masareef',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Masareef is open to people aged 18 or over, in any country. When you create an account, you confirm that you are 18 or over and that you accept these terms and the privacy policy.',
        },
      ],
    },
    {
      id: 'account',
      heading: 'Your account',
      blocks: [
        {
          kind: 'list',
          items: [
            'An account belongs to one person and holds only that person’s expenses. Accounts cannot be shared, and no other user can see your data.',
            'If you sign up with an email address and a password, you must open the link in the verification email before you can use the account. An account that is not verified within 7 days is deleted.',
            'You can also sign in with Google.',
            'A password must have at least 15 characters. After 5 wrong passwords in a row, signing in to the account is blocked for 15 minutes.',
            'You stay signed in until you sign out, or until 30 days pass without use.',
          ],
        },
      ],
    },
    {
      id: 'use',
      heading: 'Using Masareef',
      blocks: [
        {
          kind: 'list',
          items: [
            'You can add, change and delete your expenses at any time. They are kept on the server and appear both on the web and in the Android app.',
            'In the Android app you can add an expense by voice. The app fills in the fields from what you said and you check them; nothing is saved until you press Save. Speech recognition can make mistakes, so check the amount, category and date before saving.',
          ],
        },
      ],
    },
    {
      id: 'android',
      heading: 'The Android app',
      blocks: [
        {
          kind: 'list',
          items: [
            [
              'The Android app is not distributed through Google Play. Download it only from the ',
              { link: '/download', text: 'Masareef download page' },
              '.',
            ],
            'It needs Android 8.0 or later.',
            'When a newer version is published, the app tells you. A version too old to work with the service asks you to update before you can continue.',
          ],
        },
      ],
    },
    {
      id: 'ending',
      heading: 'Deleting your account',
      blocks: [
        {
          kind: 'paragraph',
          text: [
            'You can delete your account at any time, in Settings or on the ',
            { link: '/delete-account', text: 'account deletion page' },
            '. Deletion is immediate and cannot be undone.',
          ],
        },
      ],
    },
    {
      id: 'changes',
      heading: 'Changes to these terms',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Each version of these terms shows its version number and the date it takes effect. When a new version is published, the app tells you the next time you open it, with a link to the new version.',
        },
      ],
    },
    {
      id: 'contact',
      heading: 'Contact',
      blocks: [
        { kind: 'contact', text: 'Questions about these terms can be sent to the operator at:' },
      ],
    },
    {
      id: 'legal',
      heading: 'Legal terms',
      blocks: [
        {
          kind: 'pending',
          text: "The operator's liability and any warranties, the law that governs these terms and how disputes are resolved, and when the operator may suspend or close an account or the service.",
        },
      ],
    },
  ],
};

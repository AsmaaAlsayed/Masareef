import type { PolicyDocument } from './types.js';

/**
 * Privacy policy, English, version 1: a DRAFT factual description of what Masareef does with data,
 * written by the delivery team from the requirements, the architecture and the ADRs. It is not
 * legal text (OQ-06); the legal text replaces it in T-086. The source of every section is listed
 * in sources.ts under the same section id, for the legal reviewer and the T-086 checklist.
 *
 * The Arabic text (privacy.ar.ts) says the same, section by section, with the same ids.
 */
export const privacyEn: PolicyDocument = {
  version: '1',
  sections: [
    {
      id: 'about',
      heading: 'About this document',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Masareef is a personal expense tracker with a web app and an Android app. You can record what you spend by typing, or by voice in the Android app, and see it in both. The service is run by one person, called the operator below.',
        },
        {
          kind: 'paragraph',
          text: 'This document describes what Masareef stores, why, where, and for how long, as the service is built.',
        },
      ],
    },
    {
      id: 'stored',
      heading: 'What is stored and why',
      blocks: [
        {
          kind: 'paragraph',
          text: 'When you have an account, the following is stored on the Masareef server:',
        },
        {
          kind: 'list',
          items: [
            'Your email address: to sign you in and to send you the verification and password-reset emails.',
            'If you sign in with a password: a one-way hash of the password (Argon2id), never the password itself. If you sign in with Google: your Google account identifier and your email address, and nothing else from Google.',
            'Whether your email address is verified, the date and time you confirmed that you are 18 or over and accepted the terms, and the version of the terms you accepted: as a record of that confirmation.',
            'Your preferred language and default currency: so that your settings are the same on every device.',
            'Your expenses: amount, currency, category, date, the note you write, whether you entered the expense by voice or by hand, and when it was created and last changed. These are what the service is for.',
            'Sign-in sessions: to keep you signed in and to sign you out. They do not contain your IP address or details of your browser or device.',
            'The single-use codes in the links of verification and password-reset emails, until they are used or expire (a verification link expires after 24 hours).',
          ],
        },
        {
          kind: 'paragraph',
          text: 'A note is stored exactly as you type it, whatever it contains.',
        },
      ],
    },
    {
      id: 'security-records',
      heading: 'Short-lived security records',
      blocks: [
        {
          kind: 'list',
          items: [
            'To limit repeated attempts to sign in, sign up or request emails, the service keeps counters identified by a keyed one-way hash of your IP address, email address or account, never by the address itself. A daily clean-up deletes them once the limit period has passed.',
            'When an account is deleted, a keyed one-way hash of its internal identifier is kept for 30 days, so that if the database ever has to be restored from a backup, the account is deleted again.',
          ],
        },
      ],
    },
    {
      id: 'not-stored',
      heading: 'What is never stored',
      blocks: [
        { kind: 'paragraph', text: 'Masareef does not store any of the following:' },
        {
          kind: 'list',
          items: [
            'recordings of your voice, or the text recognised from them;',
            'your name, phone number, date of birth, postal address or location;',
            'your contacts;',
            'device identifiers or advertising identifiers;',
            'payment details.',
          ],
        },
        {
          kind: 'paragraph',
          text: 'Your IP address is not stored with your account, your sessions, the usage statistics or the application logs.',
        },
      ],
    },
    {
      id: 'voice',
      heading: 'Voice entry',
      blocks: [
        {
          kind: 'paragraph',
          text: 'In the Android app you can enter an expense by speaking. Your speech is turned into text on your phone. The audio and the recognised text are never sent to Masareef or to anyone else, and they are not kept on your phone after the entry ends, whether you save it, cancel it or an error occurs.',
        },
        {
          kind: 'paragraph',
          text: 'Nothing is saved until you check the expense and press Save. Only the fields you confirmed are then sent, as for an expense you type.',
        },
      ],
    },
    {
      id: 'statistics',
      heading: 'Anonymous usage statistics',
      blocks: [
        {
          kind: 'paragraph',
          text: 'To learn how Masareef is used, the operator counts two things:',
        },
        {
          kind: 'list',
          items: [
            'From the stored expenses: the number of accounts that saved at least one expense in the last 30 days, and how many expenses were entered by voice and how many by hand in a period. Only these totals are produced, with no email address, account, amount, category, note or date of any expense.',
            'Events sent by the app when you complete sign-up, start a voice entry, reach the voice review screen, save or cancel a voice entry, save an expense entered by hand, or switch language. Each event carries only its name, the platform (web or Android), the app version, the interface language and the day. It is sent without your sign-in cookie or token, and the server only adds 1 to a daily total for that combination: no record of the single event, its time, your IP address or any identifier is kept.',
          ],
        },
        {
          kind: 'paragraph',
          text: 'Events never contain your email address, an account, device or advertising identifier, an IP address, or any amount, currency, category, note, expense date, recognised text or audio. If they cannot be sent, for example because your browser blocks them, the app works as usual.',
        },
        { kind: 'paragraph', text: 'These totals are kept without a time limit.' },
      ],
    },
    {
      id: 'logs',
      heading: 'Technical logs',
      blocks: [
        {
          kind: 'paragraph',
          text: 'To run the service and find faults, each request is recorded in an application log with its time, the path requested, the result, how long it took, the app version, and a reference number that is also shown to you if an error occurs. If the app meets an unexpected error, it sends a technical error report (the error message and its technical trace, the app version, the platform and the screen), which is added to the log.',
        },
        {
          kind: 'paragraph',
          text: 'Logs never contain your email address, password, sign-in token, IP address, amounts or notes, and are kept for at most 30 days.',
        },
        {
          kind: 'paragraph',
          text: 'To look for updates, the Android app sends only its version number and platform. This check is not linked to your account.',
        },
      ],
    },
    {
      id: 'hosting',
      heading: 'Where your data is kept and who processes it',
      blocks: [
        {
          kind: 'list',
          items: [
            'Your account and expense data, and its encrypted backups, are stored by Cloudflare in the European Union: the database and the backup storage are set to the EU jurisdiction, which fixes where the data is stored.',
            "Requests between your device and Masareef pass through Cloudflare's worldwide network and are processed in memory at the data centre nearest to you or to the database; nothing is stored there.",
            "The nightly backup is made by an automated job running on GitHub's servers, which handles the data in memory only and stores it, encrypted, with Cloudflare in the EU.",
            'Verification and password-reset emails are sent through Resend, which receives your email address and the message and keeps sending logs for 30 days. Where Resend stores them will be stated here once it has been confirmed.',
            'If you choose to sign in with Google, Google provides the sign-in.',
            'When you choose a password, the first 5 characters of a one-way hash of it (SHA-1) are sent to the Have I Been Pwned service, to check whether the password has appeared in a data breach. The password itself and its full hash are never sent.',
          ],
        },
        {
          kind: 'paragraph',
          text: "These providers act on the operator's behalf. Your data is not sold or shared with anyone else.",
        },
      ],
    },
    {
      id: 'access',
      heading: 'Who can see your data',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Only you can see your expenses and settings. No other user can see them, accounts cannot be shared, and the app has no administrator role or admin console.',
        },
        {
          kind: 'paragraph',
          text: 'The operator has technical access to the database through the hosting account, which is protected by two-factor authentication. The operator does not read users’ expenses, except where this is needed to fix a fault that has been reported.',
        },
      ],
    },
    {
      id: 'protection',
      heading: 'How your data is protected',
      blocks: [
        {
          kind: 'list',
          items: [
            'All connections use HTTPS.',
            'Stored data is encrypted by the hosting provider, and backups are encrypted before they are stored.',
            "In the Android app, your sign-in token is kept in storage encrypted with a key from the phone's secure key store, and is removed when you sign out.",
          ],
        },
      ],
    },
    {
      id: 'device',
      heading: 'What is kept on your device',
      blocks: [
        {
          kind: 'paragraph',
          text: 'The web app and the Android app keep only the following on your device: your language choice, the versions of these two documents you have seen (to tell you when they change), and, in the Android app, your sign-in token and when you last dismissed an update notice. Your expenses are not stored on the device: they are held in the app’s memory while you use it and cleared when you sign out.',
        },
      ],
    },
    {
      id: 'retention',
      heading: 'How long data is kept',
      blocks: [
        {
          kind: 'list',
          items: [
            'Your account and expenses: until you delete them. An expense you delete is removed at once, and deleting your account removes everything in it.',
            'An account whose email address is never verified: deleted 7 days after it was created.',
            'Sign-in sessions: they end after 30 days without use, or when you sign out.',
            'Application logs: at most 30 days.',
            'Backups: encrypted, made at least once a day and kept for 30 days, so data you delete is gone from the backups within 30 days.',
            'Anonymous usage totals: without a time limit.',
            'Short-lived security records: as described above.',
          ],
        },
      ],
    },
    {
      id: 'deletion',
      heading: 'Deleting your account',
      blocks: [
        {
          kind: 'paragraph',
          text: [
            'You can delete your account and all its expenses at any time: in the app, open Settings, choose Delete account and confirm with your password or by signing in with Google again. If you no longer have the app, use the ',
            { link: '/delete-account', text: 'account deletion page' },
            ' on the website.',
          ],
        },
        {
          kind: 'paragraph',
          text: 'Deletion is immediate and cannot be undone. You are signed out on every device, and your data is removed from the live database within 60 seconds and from the backups within 30 days. You can later sign up again with the same email address; the new account starts empty.',
        },
      ],
    },
    {
      id: 'age',
      heading: 'Who may use Masareef',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Masareef is only for people aged 18 or over. When you sign up you confirm that you are; your date of birth is not asked for or stored.',
        },
      ],
    },
    {
      id: 'changes',
      heading: 'Changes to this policy',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Each version of this policy shows its version number and the date it takes effect. When a new version is published, the app tells you the next time you open it, with a link to the new version.',
        },
      ],
    },
    {
      id: 'contact',
      heading: 'Contact',
      blocks: [
        {
          kind: 'contact',
          text: 'For questions about your data or this policy, write to the operator at:',
        },
      ],
    },
    {
      id: 'legal',
      heading: 'Legal terms',
      blocks: [
        {
          kind: 'pending',
          text: "The legal basis for processing data, your rights under the law that applies to you, and the operator's legal details. Until they are added, this document is a factual description only.",
        },
      ],
    },
  ],
};

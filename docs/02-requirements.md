# Requirements: Masareef (مصاريف)

| | |
|---|---|
| Version | 0.2 (NFR-017 password minimum raised from 8 to 15 on 2026-11-16, change request CR-01, decided by the product owner) |
| Date | 2026-11-16 |
| Status | Draft (awaiting sign-off) |
| Source | docs/01-vision.md; product owner's answers of 2026-11-16 |

Changing this document after sign-off reopens the gate: it must be signed off again before release.

How to read this document:

- Every functional requirement carries a **Source** line. **FACT** means the product owner stated it (in the brief, in the confirmed scope items 1 to 17 of the vision, or in the answers of 2026-11-16). **PROPOSED** means the planner filled it in; the reference (RA-nn) points to the Assumptions table near the end. A requirement can be a fact while some of its numbers or rules are proposed; in that case the Notes say which.
- Signing this document off means accepting the proposals in the Assumptions table as written, unless they are changed first.
- "R1" is the first public release. "PoC" is the voice proof of concept run at the start of the Design phase.

## Glossary

| Term | Meaning |
|---|---|
| Expense | One record of money spent: amount, currency, category, date, optional note |
| Manual entry | Creating an expense by filling in the form by hand |
| Voice entry | Creating an expense by speaking one sentence; the app fills in the fields and the user reviews and confirms |
| Review screen | The screen shown after voice entry with the parsed fields, all editable, and Save and Cancel actions. Nothing is saved before Save is pressed here |
| Utterance | One spoken sentence describing one expense |
| On-device | Processed entirely on the user's phone or inside the user's browser. No audio, and no data derived from audio other than the confirmed expense, is sent over the network |
| PoC | The time-boxed voice proof of concept at the start of Design (vision R-1) |
| Voice test set | The fixed set of recorded utterances with expected amount, category and date used to measure NFR-001 to NFR-003, agreed before implementation |
| Piastre (قرش) | One hundredth of an Egyptian pound. Stored as decimals of a pound (50 piastres = 0.50 EGP) |
| Western digits | The digits 0 1 2 3 4 5 6 7 8 9, as opposed to Arabic-Indic digits ٠ to ٩ |
| APK | The Android application file that users download from the Masareef website and install themselves |
| Download page | The public page on the Masareef website from which the APK is obtained |
| Supported browsers | See NFR-026 |
| Reference phone | The mid-range Android phone named in the test plan and used for timed tests (see RA-20) |
| MAU | Monthly active users: accounts that saved at least one expense in the last 30 days |
| Operator | The product owner, running the service alone. Not a role inside the app |

## Roles

There is exactly one role, the **signed-in end user**, who can see and change only their own account and expenses (FACT: confirmed scope; no sharing between accounts). A visitor who is not signed in can see only the sign-in, sign-up, password-reset, download, privacy-policy and terms pages. There is no administrator role and no admin console in R1.

## Functional requirements

Priority: **Must** (release fails without it), **Should** (important, has a workaround), **Could** (if time allows).

Unless a requirement says otherwise, it applies to both the web app and the Android app, and its acceptance criteria are to be executed on both.

### Accounts

### FR-001 Sign up with email and password
- **Priority:** Must
- **Source:** FACT (scope items 3 and 8; sign-in methods answer 2026-11-16). Password rules and the wording of error messages are PROPOSED (RA-03, RA-05).
- **Story:** As a member of the public, I want to create an account with my email address and a password so that my expenses are kept under my own account.
- **Acceptance criteria:**
  1. Given a visitor on the sign-up screen, when they enter an email address not yet registered, a password that meets NFR-017, tick the age-and-terms confirmation (FR-003) and submit, then an account is created, a verification email is sent (FR-002) and the screen tells them to check their inbox.
  2. Given a visitor enters a password shorter than the minimum in NFR-017 or one on the breached-password list, when they submit, then no account is created and the screen states which rule was not met.
  3. Given a visitor enters a malformed email address (for example `user@` or an address longer than 254 characters), when they submit, then no account is created and the email field shows a validation message.
  4. Given a visitor enters an email address that already has an account, when they submit, then the screen shows the same "check your inbox" message as in criterion 1, no second account is created, and the existing account's password is unchanged.
  5. Given more sign-up attempts from one IP address than NFR-019 allows, when another is submitted, then it is refused with a "try again later" message and no account is created.
- **Notes:** Sign-up is open worldwide; there is no country restriction (FACT). Data collected at sign-up is limited to email address, password and the age-and-terms confirmation. No name, phone number, date of birth or location is requested (data minimisation, FACT as a principle; the field list is PROPOSED, RA-01).

### FR-002 Email verification
- **Priority:** Must
- **Source:** PROPOSED (RA-02). The vision lists "verified sign-up" as the response to risk R-10; the product owner has not confirmed the mechanism.
- **Story:** As the operator, I want email addresses verified so that automated sign-ups and mistyped addresses do not create usable accounts.
- **Acceptance criteria:**
  1. Given a newly created email-and-password account, when the user opens the verification link from the email within 24 hours, then the account becomes verified and the user can sign in.
  2. Given an unverified account, when the user tries to sign in with the correct password, then sign-in is refused, the screen explains that the email must be verified and offers to resend the email.
  3. Given a verification link that is older than 24 hours or has already been used, when it is opened, then the account is not changed and the screen offers to send a new link.
  4. Given more resend requests than NFR-019 allows, when another is made, then no email is sent and a "try again later" message is shown.
  5. Given an account still unverified 7 days after creation, when the daily clean-up runs, then the account is deleted.
- **Notes:** The verification email is sent in the language the sign-up screen was displayed in. Accounts created through Google sign-in (FR-005) do not need this step.

### FR-003 Age and terms confirmation
- **Priority:** Must
- **Source:** FACT that users must be 18 or older and that sign-up is worldwide (answer 2026-11-16). That age is self-declared with a tick box and no date of birth is collected is PROPOSED (RA-04).
- **Story:** As the operator, I want each new user to confirm they are at least 18 and accept the terms so that the service is only offered to adults.
- **Acceptance criteria:**
  1. Given the sign-up screen, when it is displayed, then it shows an unticked confirmation reading, in the current language, that the user is 18 or older and accepts the terms and privacy policy, with links to both documents (FR-039).
  2. Given the confirmation is not ticked, when the visitor submits the sign-up form, then no account is created and the confirmation is marked as required.
  3. Given a person signing in with Google for the first time (FR-005), when Google returns successfully, then the same confirmation is shown before the account is created; if they decline or close it, no account is created and no data from Google is kept.
  4. Given an account is created, when its record is inspected, then it holds the date and time of the confirmation and the version of the terms accepted, and no date of birth.

### FR-004 Sign in with email and password
- **Priority:** Must
- **Source:** FACT (scope item 8; answer 2026-11-16). Lockout numbers are PROPOSED (RA-06).
- **Story:** As a registered user, I want to sign in with my email and password so that I can reach my expenses on any device.
- **Acceptance criteria:**
  1. Given a verified account, when the user enters the correct email and password, then they are signed in and see their expense list.
  2. Given a wrong password or an email with no account, when the user submits, then sign-in is refused with one identical generic message in both cases ("email or password is incorrect") and nothing reveals whether the email is registered.
  3. Given the number of consecutive failed attempts in NFR-019 has been reached for an account, when another attempt is made within the lock period, even with the correct password, then it is refused with a "too many attempts, try again later" message.
  4. Given the user signs in on the web and on Android with the same account, when each loads the expense list, then both show the same expenses.

### FR-005 Sign in with Google
- **Priority:** Must
- **Source:** FACT (answer 2026-11-16). The account-matching rule in criterion 3 is PROPOSED (RA-07).
- **Story:** As a user with a Google account, I want to sign in with Google so that I do not need another password.
- **Acceptance criteria:**
  1. Given a person with no Masareef account, when they choose "Sign in with Google", complete Google's flow and tick the confirmation in FR-003, then an account is created with the email address Google reports and they are signed in.
  2. Given a returning Google user, when they choose "Sign in with Google" and complete Google's flow, then they are signed in to the same account with the same expenses.
  3. Given an existing verified email-and-password account, when its owner signs in with Google using a Google account whose verified email is the same address, then they are signed in to that existing account and no second account is created.
  4. Given the person cancels Google's flow, or Google returns an error or is unreachable, when control returns to Masareef, then they are not signed in, no account is created, and the screen shows a message with the option to retry or use email and password.
  5. Given the Android app installed from the Masareef APK on a device with Google Play services, when the user signs in with Google, then criteria 1 to 4 hold. Given a device without Google Play services, when the sign-in screen is shown, then Google sign-in either works through the browser or is hidden, and email-and-password sign-in remains available.
- **Notes:** Only the email address and Google's stable account identifier are stored. Profile photo, name and contacts are not requested or stored (PROPOSED, RA-01). Phone number and SMS sign-in are not part of R1 (FACT: not selected).

### FR-006 Sign out
- **Priority:** Must
- **Source:** FACT (scope item 8).
- **Story:** As a user, I want to sign out so that someone else using my device cannot see my expenses.
- **Acceptance criteria:**
  1. Given a signed-in user, when they choose Sign out, then they are returned to the sign-in screen and the session is invalidated on the server.
  2. Given a user who has signed out, when the previous session's credentials are replayed against any API endpoint, then the request is rejected as unauthenticated.
  3. Given a user who has signed out on the web, when they press the browser Back button, then no expense data is displayed.
  4. Given a user who has signed out on Android, when the app's local storage is inspected, then it holds no expense data and no session credential for that account.

### FR-007 Password reset
- **Priority:** Must
- **Source:** FACT (scope item 8). Link lifetime and limits are PROPOSED (RA-06).
- **Story:** As a user who has forgotten my password, I want to reset it by email so that I can get back into my account.
- **Acceptance criteria:**
  1. Given a registered email address, when the user requests a reset, then an email with a single-use link is sent and the screen shows "if this address has an account, a reset email has been sent".
  2. Given an email address with no account, when a reset is requested, then the screen shows the identical message and no email is sent.
  3. Given a valid link opened within 60 minutes, when the user sets a new password that meets NFR-017, then the password is changed, every existing session of that account on every device is invalidated, and the user can sign in with the new password and not with the old one.
  4. Given a link that is older than 60 minutes or already used, when it is opened, then the password is not changed and the screen offers to request a new link.
  5. Given more reset requests for one account than NFR-019 allows, when another is made, then no email is sent and the same neutral message is shown.
- **Notes:** An account created only through Google that requests a reset receives an email explaining it signs in with Google; no password is set.

### FR-008 Session expiry
- **Priority:** Must
- **Source:** The engineering standard requires that sessions expire. The durations are PROPOSED (RA-08).
- **Story:** As a user, I want to stay signed in on my own phone without re-entering my password every day, while a forgotten session does not stay open for ever.
- **Acceptance criteria:**
  1. Given a signed-in user who used the app within the last 30 days, when they open it again, then they are still signed in.
  2. Given a session with no activity for more than 30 days, when the app is opened, then the user is taken to the sign-in screen and no expense data is shown.
  3. Given a session expires while the user is filling in an expense form, when they press Save, then they are asked to sign in and, after signing in, the form still holds what they had entered.

### FR-009 Delete account and data
- **Priority:** Must
- **Source:** FACT (scope item 9: in the app and from a web page, kept after the distribution decision of 2026-11-16). Timings are PROPOSED (RA-09).
- **Story:** As a user, I want to delete my account and everything in it so that Masareef no longer holds my data.
- **Acceptance criteria:**
  1. Given a signed-in user in the Android app or the web app, when they open Settings, choose Delete account, read the warning that all expenses will be permanently removed, and confirm by re-entering their password (or re-authenticating with Google), then the account and all of its expenses are deleted, they are signed out everywhere, and a confirmation is shown.
  2. Given a person who no longer has the app installed, when they open the public account-deletion page on the website (linked from the privacy policy and the download page) and sign in, then they can delete the account with the same result as criterion 1.
  3. Given an account has been deleted, when sign-in is attempted with its former credentials, then it fails as for an unknown account; when the same email signs up again, then a new empty account is created.
  4. Given an account has been deleted, when the live database is inspected 60 seconds later, then it contains no row holding that user's email, identifiers or expenses; within 30 days the data is also absent from all backups (NFR-024).
  5. Given the user cancels at the warning, or the re-authentication fails, when the flow ends, then nothing is deleted.
  6. Given the server is unreachable when the user confirms, when the request fails, then the user is told deletion did not happen and to try again, and the account is unchanged.
- **Notes:** Deletion is immediate and cannot be undone; there is no grace period (PROPOSED, RA-09).

### Expenses

### FR-010 Add an expense manually
- **Priority:** Must
- **Source:** FACT (scope items 5 and 10). Field limits are PROPOSED (RA-10).
- **Story:** As a user, I want to type in an expense so that it is recorded when I cannot or do not want to speak.
- **Acceptance criteria:**
  1. Given a signed-in user on the add-expense form, when it opens, then currency is preset to the user's default currency (FR-015), date is preset to today in the device's time zone, category is unselected and note is empty.
  2. Given the user enters amount 50, selects a category and presses Save, when the server confirms, then the expense appears at the top of that day's entries in the list with amount 50.00, the chosen category, today's date and the default currency.
  3. Given the amount is empty, zero, negative, not a number, or greater than 9,999,999.99, when the user presses Save, then nothing is saved and the amount field shows a validation message.
  4. Given an amount with more decimal places than the currency allows (FR-015), for example 10.555 in EGP, when the user presses Save, then nothing is saved and the amount field shows a validation message.
  5. Given no category is selected, when the user presses Save, then nothing is saved and the category field is marked as required.
  6. Given a date later than today or earlier than 2000-01-01, when the user presses Save, then nothing is saved and the date field shows a validation message.
  7. Given a note longer than 200 characters, when the user types, then input beyond 200 characters is not accepted and a counter shows the limit.
  8. Given a note containing HTML or script text such as `<script>alert(1)</script>`, when the expense is saved and displayed anywhere, then the text is shown literally and nothing is executed.
  9. Given the same invalid values are sent directly to the API, bypassing the app, when the request is received, then it is rejected with a validation error and nothing is stored.
- **Notes:** Fields: amount (required), currency (required, one of the list in FR-015), category (required, one of the list in FR-014), date (required, a calendar date with no time of day), note (optional, plain text, up to 200 characters, Arabic and English accepted). Each expense also records whether it was entered manually or by voice (needed for S-12); the user does not see or edit this.

### FR-011 Edit an expense
- **Priority:** Must
- **Source:** FACT (scope item 10). The conflict rule is PROPOSED (RA-11).
- **Story:** As a user, I want to correct an expense so that my records are accurate.
- **Acceptance criteria:**
  1. Given an existing expense, when the user opens it, changes any of amount, currency, category, date or note and presses Save, then the list and the monthly summary show the new values.
  2. Given invalid values as described in FR-010 criteria 3 to 7, when the user presses Save, then nothing is changed and the same validation messages appear.
  3. Given the expense has been deleted on another device, when the user saves an edit, then the edit is not applied, the user is told the expense no longer exists, and it is removed from the list.
  4. Given the same expense is edited on two devices, when both save, then the save the server receives last is the stored version and both devices show it after their next sync (FR-017).
  5. Given the user opens an expense and leaves without pressing Save, when they return to the list, then the expense is unchanged.
- **Notes:** Editing does not change whether the expense counts as manual or voice entry.

### FR-012 Delete an expense
- **Priority:** Must
- **Source:** FACT (scope item 10). The confirmation step is PROPOSED (RA-11).
- **Story:** As a user, I want to remove an expense entered by mistake.
- **Acceptance criteria:**
  1. Given an existing expense, when the user chooses Delete and confirms, then it disappears from the list and from the monthly summary totals.
  2. Given the confirmation prompt, when the user cancels, then the expense is unchanged.
  3. Given the expense was already deleted on another device, when the user deletes it, then the result is the same as a successful deletion and no error is shown.
  4. Given the server is unreachable, when the user confirms deletion, then the expense stays in the list and a message says the deletion did not happen.

### FR-013 Expense list with filters
- **Priority:** Must
- **Source:** FACT (scope item 12). Ordering, default range and paging are PROPOSED (RA-12).
- **Story:** As a user, I want to see my expenses and narrow them by date and category so that I can find what I spent.
- **Acceptance criteria:**
  1. Given a user with expenses, when they open the list, then expenses of the current calendar month are shown, newest date first, and within one date the most recently created first; each row shows amount with currency, category name in the current language, date, and the note if present.
  2. Given the user sets a date range (from and to, both inclusive), when it is applied, then only expenses dated within the range are shown.
  3. Given the user selects one or more categories, when applied, then only expenses in those categories are shown; combined with a date range, both conditions apply.
  4. Given filters that match nothing, or a new account with no expenses, when the list is shown, then an empty-state message is displayed with an action to add an expense (and, for filters, an action to clear them).
  5. Given a "from" date later than the "to" date, when the user applies the range, then it is not applied and a validation message is shown.
  6. Given a user with more than 50 expenses in the selected range, when they scroll, then further expenses load in pages of 50 until all are shown, with none missing or repeated.
  7. Given expenses in more than one currency in the selected range, when the list shows a total, then one total per currency is shown and amounts in different currencies are never added together.

### FR-014 Fixed bilingual categories
- **Priority:** Must
- **Source:** FACT that categories are a fixed built-in list with English and Arabic names and that users cannot define their own (scope item 11). The exact list is PROPOSED (RA-13); the vision gave food, transport, bills, shopping, health, entertainment and other as examples.
- **Story:** As a user, I want to pick a category from a short list in my language so that classifying an expense takes one tap.
- **Acceptance criteria:**
  1. Given the category selector in English, when opened, then it lists exactly: Food and drink, Groceries, Transport, Bills and utilities, Housing, Shopping, Health, Entertainment, Education, Other.
  2. Given the category selector in Arabic, when opened, then it lists the same ten categories in the same order with their Arabic names (طعام ومشروبات، بقالة، مواصلات، فواتير ومرافق، سكن، تسوق، صحة، ترفيه، تعليم، أخرى).
  3. Given an expense saved with a category while the interface was in one language, when the user switches language, then the same expense shows the category's name in the other language.
  4. Given an API request that names a category not in the list, when received, then it is rejected with a validation error.
  5. Given any screen in the app, when inspected, then there is no control to add, rename or remove a category.
- **Notes:** The Arabic names are the planner's draft and must be reviewed by a native Egyptian Arabic speaker (open question OQ-03).

### FR-015 Currencies
- **Priority:** Must
- **Source:** FACT (scope items 7 and 14; currency list from the answer of 2026-11-16: EGP, USD, EUR, SAR, AED, GBP, KWD). Decimal places per currency and the settings behaviour are PROPOSED (RA-14).
- **Story:** As a user, I want each expense recorded in the currency I paid in, with the Egyptian pound as the default, so that my records match what I actually paid.
- **Acceptance criteria:**
  1. Given a new account, when the user opens the add-expense form, then the currency is EGP.
  2. Given the user changes their default currency in Settings to any of the seven listed currencies, when they next open the add-expense form on any device, then that currency is preselected.
  3. Given the add-expense or edit form, when the user opens the currency selector, then it lists exactly EGP, USD, EUR, SAR, AED, GBP and KWD and the user can choose one for this expense without changing their default.
  4. Given an expense in KWD, when the user enters 1.250, then it is accepted and displayed as 1.250; given any other listed currency, when the user enters three decimal places, then it is rejected (FR-010 criterion 4).
  5. Given an API request with a currency code outside the list, when received, then it is rejected with a validation error.
  6. Given expenses in two currencies, when any total is displayed anywhere in the app, then there is one total per currency and no converted or combined figure.
- **Notes:** Amounts are displayed with two decimal places, except KWD with three (ISO 4217 minor units). Changing the default currency does not alter existing expenses. There is no currency conversion and no exchange rate anywhere in R1 (FACT).

### FR-016 Monthly summary
- **Priority:** Must
- **Source:** FACT (scope item 13: total spent, total per category, one simple chart). Chart type and navigation are PROPOSED (RA-15).
- **Story:** As a user, I want to see what I spent in a month and on what so that I know where my money went.
- **Acceptance criteria:**
  1. Given a user with expenses in the current month, when they open the summary, then it shows, for the current calendar month, the total spent and the total per category, and one chart of the per-category totals.
  2. Given known test data (for example 3 expenses in Food and drink totalling 150.00 EGP and 1 in Transport of 40.00 EGP), when the summary is shown, then the total is 190.00 EGP, Food and drink is 150.00 and Transport is 40.00.
  3. Given expenses in more than one currency in the month, when the summary is shown, then the user sees the figures for one currency at a time, starting with their default currency, and can switch to each other currency that has expenses in that month.
  4. Given the user moves to the previous or next month, when the summary reloads, then it shows that month's figures; the user cannot move past the current month.
  5. Given a month with no expenses, when the summary is shown, then an empty-state message appears and no chart with zero or missing values is drawn.
  6. Given the chart, when read with a screen reader or without colour, then the same per-category figures are available as text and categories are not distinguished by colour alone.
  7. Given an expense is added, edited or deleted, when the summary is next opened, then its figures reflect the change.

### FR-017 Synchronisation between web and Android
- **Priority:** Must
- **Source:** FACT (scope item 4). "Without the user refreshing" and the duplicate-prevention rule are PROPOSED (RA-16).
- **Story:** As a user, I want an expense I save on one device to be on my other device so that I have one set of records.
- **Acceptance criteria:**
  1. Given the same account signed in on the web and on Android, both online with the expense list open, when an expense is saved, edited or deleted on one, then the other shows the change within 10 seconds without the user refreshing (NFR-006).
  2. Given a device that was closed or offline while changes were made elsewhere, when the app is next opened online, then the list and summary show the current state.
  3. Given the network drops after the user presses Save and before the app receives the server's confirmation, when the app retries automatically or the user presses Save again, then exactly one expense exists on the server (NFR-007).
  4. Given the server rejects or does not confirm a save, when the attempt ends, then the app does not show the expense as saved and tells the user.
  5. Given two different accounts, when one saves an expense, then it never appears for the other (FR-019).

### FR-018 Behaviour when offline
- **Priority:** Must
- **Source:** FACT that R1 is online-only on Android and that offline entry with later sync is out of scope (Q-05 closed). The specific behaviour is PROPOSED (RA-17).
- **Story:** As a user with a poor connection, I want to be told clearly that I am offline and not lose what I have typed.
- **Acceptance criteria:**
  1. Given the device has no connection, when the user opens the app or the connection is lost while it is open, then a visible message in the current language says the app is offline and that expenses cannot be saved until the connection returns.
  2. Given the user has filled in the add-expense form or is on the voice review screen, when they press Save while offline, then nothing is reported as saved, a message explains why, and the entered values remain on screen.
  3. Given the connection returns while the form from criterion 2 is still open, when the user presses Save, then the expense is saved once.
  4. Given the app is offline, when the user closes it without saving, then the unsaved expense is discarded and is not sent later.

### FR-019 Each user sees only their own data
- **Priority:** Must
- **Source:** FACT (one role; no sharing between accounts). The engineering security standard requires the check on the server for every request.
- **Story:** As a user, I want my spending records to be visible only to me.
- **Acceptance criteria:**
  1. Given user A is signed in, when A requests, edits or deletes an expense by the identifier of an expense that belongs to user B, then the server refuses and returns the same response as for an expense that does not exist; B's expense is unchanged.
  2. Given a request with no session, an expired session or a tampered session credential, when it reaches any endpoint that returns or changes account or expense data, then it is rejected as unauthenticated.
  3. Given user A's list, filters and summary, when produced, then they contain only A's expenses, verified with two accounts holding distinguishable data.
  4. Given every API endpoint in the published interface, when the tester runs the cross-account test suite, then every endpoint has at least one test of criterion 1 or 2 and all pass (NFR-016).

### Language

### FR-020 English and Arabic interface with right-to-left layout
- **Priority:** Must
- **Source:** FACT (scope item 2; S-9).
- **Story:** As an Arabic or English speaker, I want the whole app in my language so that I can use it without guessing.
- **Acceptance criteria:**
  1. Given the interface language is Arabic, when any screen, dialog, validation message, error message, empty state, email sent by the system, or the download, privacy and terms pages is displayed, then all of its text is in Arabic and the layout is right-to-left: text aligned right, navigation and back controls mirrored, lists and forms flowing right to left.
  2. Given the interface language is English, when the same items are displayed, then all text is in English and the layout is left-to-right.
  3. Given a note written in the other language or containing both (for example Arabic interface, note "lunch at Costa مع أحمد"), when shown in the list, then each run of text reads in its natural direction and the row's amount, category and date keep their positions.
  4. Given an error returned by the server, when shown to the user, then it is a translated message in the current language and not a raw code or untranslated English text.
  5. Given the screen inventory in the test plan, when every screen is reviewed in both languages on web and Android, then the count of screens with untranslated text, clipped text or broken right-to-left layout is 0 (NFR-009).
- **Notes:** All user-visible Arabic text is to be reviewed by a native Egyptian Arabic speaker before release (OQ-03).

### FR-021 Language selection and default
- **Priority:** Must
- **Source:** FACT (scope item 15). Where the choice is remembered is PROPOSED (RA-18).
- **Story:** As a user, I want the app to start in my device's language and let me switch at any time.
- **Acceptance criteria:**
  1. Given a first visit with the device or browser language set to Arabic (any regional variant), when the app opens, then the interface is in Arabic.
  2. Given a first visit with the device or browser language set to anything other than Arabic, including languages Masareef does not offer, when the app opens, then the interface is in English.
  3. Given any screen, including sign-in and sign-up before the user has an account, when the user uses the language control, then the interface switches immediately without signing the user out and without losing values typed into an open form.
  4. Given a signed-in user has chosen a language, when they sign in on another device, then the interface uses the chosen language regardless of that device's language.
  5. Given a user has chosen a language while signed out, when they reopen the app on the same device, then that choice is still applied.

### FR-022 Western digits and number and date formats
- **Priority:** Must
- **Source:** FACT (answer 2026-11-16: Western digits 0 to 9 everywhere). Accepting Arabic-Indic digits typed by the user, and the date format, are PROPOSED (RA-19).
- **Story:** As a user of the Arabic interface, I want numbers shown in the digits 0 to 9 so that amounts read the same in both languages.
- **Acceptance criteria:**
  1. Given the interface is in Arabic, when any amount, date, count, chart label, version number or other number is displayed, then it uses Western digits only; no Arabic-Indic digit (٠ to ٩) appears anywhere the app generates text.
  2. Given an amount of one thousand two hundred and thirty-four and a half Egyptian pounds, when displayed in either language, then it reads 1,234.50 with the currency shown as the code EGP in English and as ج.م in Arabic, and the digits are not reordered by the right-to-left layout.
  3. Given a date, when displayed in English, then it reads as in "16 Nov 2026"; when displayed in Arabic, then it reads as in "16 نوفمبر 2026", using the Gregorian calendar and Western digits.
  4. Given a user types an amount with Arabic-Indic digits (for example ٥٠) from an Arabic keyboard, when they leave the field, then it is shown and stored as 50.
  5. Given a note that the user typed containing Arabic-Indic digits, when displayed, then the note is shown exactly as typed (user content is not rewritten).

### Voice entry

Voice requirements are written so that they hold whether or not web voice survives the PoC. FR-023 to FR-032 are stated for the Android app and are Must. FR-033 makes the same behaviour apply on the web **if and only if** the PoC shows on-device recognition in the browser is good enough; otherwise the web app is manual entry only (FACT: answer 2026-11-16).

The accuracy of voice entry as a whole is set by NFR-001 to NFR-003. The individual examples in FR-025 to FR-029 are behaviours the parser must support; they are verified with typed transcripts fed to the parser (deterministic) and, for end-to-end accuracy, with the voice test set.

### FR-023 Voice entry on Android: speak, review, save
- **Priority:** Must
- **Source:** FACT (scope item 6; Android voice is not conditional). The recording time limit and language choice rule are PROPOSED (RA-21).
- **Story:** As a user, I want to say what I spent and have the app fill in the expense so that logging takes seconds.
- **Acceptance criteria:**
  1. Given a signed-in user on Android with microphone permission granted, when they tap the microphone control, then the app shows it is listening and a way to stop or cancel.
  2. Given the app is listening, when the user says one sentence describing one expense in Egyptian Arabic or English and stops speaking (or taps Stop), then the review screen (FR-024) opens with amount, category and date filled in from what was understood.
  3. Given the app is listening, when the user taps Cancel, then listening stops, no review screen opens and nothing is saved.
  4. Given the app is listening and nothing is heard for 10 seconds, or 30 seconds of speech have elapsed, when the limit is reached, then listening stops; if nothing was recognised the user is told nothing was heard and can retry or switch to manual entry.
  5. Given the user is on the add-expense screen, when it is displayed, then manual entry and voice entry are both offered and manual entry works without using the microphone.
  6. Given another app takes the microphone or a phone call starts while listening, when it happens, then listening stops without a crash, nothing is saved and the user can retry.
- **Notes:** Voice understands Egyptian Arabic and English (FACT). The recogniser listens in the current interface language by default and the voice screen has a control to switch between Arabic and English for this entry (PROPOSED, RA-21; the PoC may show a single recogniser handles both, in which case the control is dropped through change control). One utterance creates at most one expense; several expenses in one utterance and voice commands other than adding an expense are out of scope (ASSUMED in the vision, A-12).

### FR-024 Review and confirm before saving
- **Priority:** Must
- **Source:** FACT (scope item 6; S-8).
- **Story:** As a user, I want to see and correct what the app understood before it is saved so that a misheard amount never ends up in my records.
- **Acceptance criteria:**
  1. Given voice recognition has finished, when the review screen opens, then it shows the text that was recognised and the fields amount, currency, category, date and note, each editable, with Save and Cancel actions.
  2. Given the review screen, when the user changes any field and presses Save, then the expense is saved with the values shown on screen at that moment, marked as entered by voice.
  3. Given the review screen, when the user presses Cancel, navigates back, the app is closed or sent to the background and killed, or the session expires, then no expense is saved.
  4. Given any voice entry, when the full path from microphone tap to stored expense is traced, then there is no path on which an expense is stored without the user pressing Save on the review screen (target: 0 occurrences, NFR-008).
  5. Given a field the app could not determine or filled with a default (FR-025 to FR-030), when the review screen opens, then that field is visibly marked as needing attention, and the mark is conveyed to screen readers, not by colour alone.
  6. Given invalid values on the review screen, when the user presses Save, then the validation rules of FR-010 apply and nothing is saved.
- **Notes:** The note field is left empty by voice entry; the user may type one (PROPOSED, RA-22). The recognised text is shown for reference only and is not stored.

### FR-025 Amounts from speech, including piastres
- **Priority:** Must
- **Source:** FACT (scope item 6; piastres answer 2026-11-16: stored as decimals of a pound). The example phrasings are PROPOSED (RA-23) pending the voice test set.
- **Story:** As a user, I want to say amounts the way I normally do, including piastres, halves and quarters.
- **Acceptance criteria:**
  1. Given the transcript "صرفت خمسين جنيه على الغدا" or "spent 50 pounds on lunch", when parsed, then the amount is 50.00.
  2. Given "خمسة جنيه ونص" or "five and a half pounds", when parsed, then the amount is 5.50; given "عشرة جنيه وربع", then 10.25.
  3. Given "خمسة وسبعين قرش" or "75 piastres", when parsed, then the amount is 0.75 and the currency is EGP; given "اتنين جنيه وخمسين قرش", then 2.50.
  4. Given "ألف وميتين وخمسين جنيه" or "one thousand two hundred and fifty pounds", when parsed, then the amount is 1250.00.
  5. Given a transcript in which the recogniser has already written the number as digits, in Western or Arabic-Indic form (for example "٥٠ جنيه"), when parsed, then the amount is the same as for the spoken words.
  6. Given a transcript with no amount ("اشتريت غدا"), when parsed, then the amount field on the review screen is empty and marked as needing attention, and Save is refused until an amount is entered.
  7. Given a transcript with two unrelated amounts ("50 pounds lunch and 20 taxi"), when parsed, then the first amount is used, the amount field is marked as needing attention, and only one expense is offered.
  8. Given a spoken amount above 9,999,999.99 or with more precision than the currency allows, when the user presses Save, then FR-010 validation applies.

### FR-026 Category from speech
- **Priority:** Must
- **Source:** FACT (scope item 6: the app fills in the category). The fallback rule is PROPOSED (RA-24).
- **Story:** As a user, I want the app to pick the category from what I said.
- **Acceptance criteria:**
  1. Given "صرفت خمسين جنيه على الغدا" or "spent 50 pounds on lunch", when parsed, then the category is Food and drink.
  2. Given "تاكسي بتلاتين جنيه" or "30 pounds for a taxi", when parsed, then the category is Transport; given "فاتورة الكهربا ٤٠٠ جنيه" or "electricity bill 400 pounds", then Bills and utilities.
  3. Given an utterance with no word that maps to a category ("صرفت مية جنيه"), when parsed, then the category is set to Other and marked as needing attention.
  4. Given the user corrects the category on the review screen, when they press Save, then the corrected category is stored.
- **Notes:** The word-to-category mapping for both languages is part of the Design and is validated against the voice test set.

### FR-027 Dates from speech, including relative dates
- **Priority:** Must
- **Source:** FACT (relative dates answer 2026-11-16). The exact list of supported expressions and the "no date means today" rule are PROPOSED (RA-25; the latter is vision assumption A-16).
- **Story:** As a user, I want to say "yesterday" and have the right date filled in.
- **Acceptance criteria:**
  1. Given an utterance with no date expression, when parsed, then the date is today in the device's time zone.
  2. Given "امبارح" or "yesterday", when parsed on 16 Nov 2026, then the date is 15 Nov 2026; given "أول امبارح" or "the day before yesterday", then 14 Nov 2026; given "النهارده" or "today", then 16 Nov 2026.
  3. Given "من تلات أيام" or "three days ago", when parsed on 16 Nov 2026, then the date is 13 Nov 2026.
  4. Given "يوم الجمعة اللي فات" or "last Friday", when parsed on Monday 16 Nov 2026, then the date is 13 Nov 2026 (the most recent such weekday before today).
  5. Given "yesterday" spoken on the first day of a month or year, when parsed, then the date is the last day of the previous month or year.
  6. Given a date expression that refers to the future ("بكرة", "tomorrow") or one the app does not support, when parsed, then the date is set to today and marked as needing attention.
- **Notes:** Supported in R1: today, yesterday, the day before yesterday, N days ago for N from 1 to 30, and last <weekday>, each in Egyptian Arabic and English. Other date expressions are handled by criterion 6.

### FR-028 Currency from speech
- **Priority:** Should
- **Source:** PROPOSED (RA-26). "Pounds with no qualifier means EGP" is vision assumption A-16, not yet confirmed.
- **Story:** As a user, I want to say "20 dollars" and have the currency set.
- **Acceptance criteria:**
  1. Given an utterance with no currency word ("صرفت خمسين على الغدا"), when parsed, then the currency is the user's default currency.
  2. Given "جنيه", "pounds" or "قرش" with no qualifier, when parsed, then the currency is EGP; given "جنيه استرليني" or "pounds sterling", then GBP.
  3. Given "دولار"/"dollars", "يورو"/"euros", "ريال"/"riyals", "درهم"/"dirhams", "دينار"/"dinars", when parsed, then the currency is USD, EUR, SAR, AED or KWD respectively.
  4. Given a currency word for a currency outside the list (for example "yen"), when parsed, then the currency is the user's default and the currency field is marked as needing attention.
- **Notes:** Workaround if not delivered: currency is always the user's default on the review screen and the user changes it by hand.

### FR-029 Mixed Arabic and English speech
- **Priority:** Must
- **Source:** FACT (answer 2026-11-16).
- **Story:** As an Egyptian speaker who mixes English words into Arabic, I want the app to understand me as I normally speak.
- **Acceptance criteria:**
  1. Given the transcript "دفعت خمسين جنيه في الـ supermarket", when parsed, then amount is 50.00, category is Groceries and date is today.
  2. Given "جبت lunch بمية وعشرين جنيه امبارح", when parsed, then amount is 120.00, category is Food and drink and date is yesterday.
  3. Given "Uber بخمسة وأربعين جنيه", when parsed, then amount is 45.00 and category is Transport.
  4. Given the voice test set, when measured, then at least 20 of the Egyptian Arabic utterances contain one or more English words and they count toward NFR-001 and NFR-002 like any other utterance.
  5. Given an utterance mostly in a language other than Arabic or English, when parsed, then FR-030 applies and nothing is saved automatically.
- **Notes:** Whether the on-device recogniser can transcribe mixed speech well enough is a PoC question (vision R-1). If it cannot reach the targets, the product owner's decision of 2026-11-16 is to lower the accuracy target through change control, not to send audio off the device.

### FR-030 Unrecognised or partial speech
- **Priority:** Must
- **Source:** FACT that nothing is saved without review; the specific handling is PROPOSED (vision A-16, RA-27).
- **Story:** As a user, when the app does not understand me I want to finish the entry by hand rather than start again.
- **Acceptance criteria:**
  1. Given speech was recognised but no amount, category or date could be extracted, when recognition ends, then the review screen opens with the recognised text shown, amount empty, category Other, date today, each marked as needing attention, and nothing is saved until the user completes the fields and presses Save.
  2. Given nothing at all was recognised (silence, noise), when recognition ends, then no review screen opens; a message offers Retry and Enter manually.
  3. Given the on-device recogniser fails with an error, when it happens, then a translated message is shown, nothing is saved, and manual entry remains available.
  4. Given an utterance containing only an amount ("خمسين جنيه"), when parsed, then amount is 50.00, category is Other and marked, date is today.

### FR-031 Microphone permission and voice availability
- **Priority:** Must
- **Source:** Derived from FACT (voice is optional alongside manual entry; audio is on-device only). The download-consent rule is PROPOSED (RA-28).
- **Story:** As a user, I want to understand why the app asks for my microphone and still be able to use it if I say no.
- **Acceptance criteria:**
  1. Given the user taps the microphone for the first time, when the permission is requested, then the app first explains in the current language that the microphone is used only to fill in an expense and that audio does not leave the device and is not kept; the app does not request the permission at start-up or before the microphone is tapped.
  2. Given the user denies the permission, when they return to the app, then manual entry works and tapping the microphone again explains how to grant the permission in system settings.
  3. Given a device on which on-device recognition for the selected language is not available, when the add-expense screen is shown, then the microphone control is disabled or absent with a short explanation, the app does not fall back to any network speech service, and manual entry works.
  4. Given on-device recognition needs a one-time download of speech data, when the user first taps the microphone, then the app states the download size and asks for confirmation before downloading; if the user declines or the download fails, nothing is downloaded or left half-installed and manual entry works.
  5. Given the user revokes the permission in system settings while the app is installed, when they next tap the microphone, then criterion 2 applies and the app does not crash.

### FR-032 Audio stays on the device and is not kept
- **Priority:** Must
- **Source:** FACT (answer 2026-11-16: on-device only; audio must never leave the phone or browser). That audio is not stored after processing is vision assumption A-13, PROPOSED (RA-29).
- **Story:** As a user, I want to be sure my voice is not sent anywhere or kept.
- **Acceptance criteria:**
  1. Given network traffic from the device is captured during 20 voice entries, when it is analysed, then no request carries audio data or the recognised text, and the only expense-related request is the one sent when the user presses Save, containing the confirmed fields only (NFR-021).
  2. Given the device's network connection is turned off, when the user makes a voice entry on Android, then recognition still completes and the review screen opens with parsed fields (saving then follows FR-018).
  3. Given a voice entry has finished, by Save, Cancel or error, when the app's storage on the device is inspected, then it contains no audio file and no stored transcript.
  4. Given the server database, logs and analytics, when inspected after the test run, then they contain no audio and no recognised text.

### FR-033 Voice entry on the web (conditional on the PoC)
- **Priority:** Should
- **Source:** FACT (answer 2026-11-16: try on-device in the browser; if not good enough, voice is Android-only and the web app is manual entry). The pass criterion for "good enough" is PROPOSED (RA-30).
- **Story:** As a web user, I want the same voice entry in my browser, provided it can be done without my audio leaving the browser.
- **Acceptance criteria:**
  1. Given the PoC result recorded in the architecture document is "web voice ships", and a supported browser in which on-device recognition is available for the selected language, when the user uses the microphone control on the web, then FR-023 to FR-032 hold on the web as written for Android (with the browser's microphone permission in place of the Android one).
  2. Given the PoC result is "web voice ships" and a browser in which on-device recognition is not available, when the add-expense screen is shown, then no microphone control is offered (or it is disabled with an explanation), manual entry works, and no audio is sent to any server, including the browser vendor's.
  3. Given the PoC result is "web voice does not ship", when any web screen is shown in any browser, then there is no microphone control, the web app never requests microphone permission, and the add-expense screen states that voice entry is available in the Android app, with a link to the download page.
  4. Given either PoC result, when web traffic is captured during use of the add-expense screen, then no request carries audio (NFR-021).
- **Notes:** Criterion 3 and 4 must pass in every case, so the web app is releasable whichever way the PoC goes. Browsers' built-in speech recognition commonly sends audio to the vendor's servers by default; using it in that mode is not permitted. Evidence found on 2026-11-16 (secondary sources, to be re-checked in the PoC) suggests on-device recognition in browsers exists only in some browsers and for a limited set of languages in which Arabic was not listed, so the PoC outcome for the web is uncertain. If web voice does not ship, success measure S-4 is measured on Android only.

### FR-034 Record again from the review screen
- **Priority:** Should
- **Source:** PROPOSED (RA-22).
- **Story:** As a user, when the app misheard me badly I want to speak again without going back.
- **Acceptance criteria:**
  1. Given the review screen, when the user taps Record again and speaks, then the fields are replaced with the newly parsed values and nothing has been saved in between.
  2. Given the user taps Record again and then cancels listening, when they return to the review screen, then the previous values, including any hand edits, are still there.
- **Notes:** Workaround if not delivered: Cancel and tap the microphone again.

### Android distribution

The Android app is distributed in R1 as a direct APK download from the Masareef website and is not published on Google Play (FACT: answer 2026-11-16). Google Play policies and the closed-test rule therefore do not apply to R1. See open question OQ-01 on Android developer verification, which affects this channel.

### FR-035 Download page and install guidance
- **Priority:** Must
- **Source:** FACT that users install the app file from the website. The page contents are PROPOSED (RA-31).
- **Story:** As an Android user, I want to get the app from the official website and be guided through installing it.
- **Acceptance criteria:**
  1. Given a visitor who is not signed in, when they open the download page over HTTPS, then it shows, in English or Arabic according to FR-021: a download button for the current APK, the version number, release date, file size, the minimum Android version (8.0), the SHA-256 checksum of the file, and a link to the privacy policy.
  2. Given the page, when read, then it gives step-by-step instructions, in both languages, for allowing installation from the browser used (the "Install unknown apps" permission on Android 8.0 and later), for installing the file, and for what the user should expect from the system's security prompts; and it tells the user to download only from this page.
  3. Given an Android 8.0 device and a device on the latest Android version, when a tester follows the instructions exactly, then the app installs and opens on both.
  4. Given a device running Android older than 8.0, when the visitor opens the page, then the page says the device is not supported and suggests the web app; if the APK is nevertheless installed, the system refuses it.
  5. Given a visitor on a desktop or iOS browser, when they open the page, then it explains the app is for Android, offers the web app, and still shows the download link and checksum.
  6. Given the download fails or is interrupted, when the user opens the partial file, then Android refuses to install it and the page's instructions tell the user to download again.

### FR-036 Signed and verifiable APK
- **Priority:** Must
- **Source:** Derived from FACT (direct APK distribution). The details are PROPOSED (RA-31).
- **Story:** As a user, I want to be able to check that the file I downloaded is the genuine app, and to update without losing anything.
- **Acceptance criteria:**
  1. Given any released APK, when its signature is verified with the standard Android signing tool, then verification succeeds and the signing certificate's SHA-256 fingerprint equals the fingerprint published on the download page.
  2. Given the APK file downloaded from the page, when its SHA-256 checksum is computed, then it equals the checksum shown on the page for that version.
  3. Given version N is installed and the user is signed in, when they install version N+1 from the download page, then it installs as an update over N without uninstalling, and the user is still signed in with their language choice kept.
  4. Given an APK with the same application identifier but signed with a different key, when a user tries to install it over the genuine app, then Android refuses the installation.
  5. Given the APK is inspected, when its contents are scanned, then it contains no signing key, server secret or credential other than public client identifiers (NFR-020).
- **Notes:** The signing key is created once, held outside the source repository, and backed up by the operator; losing it means users cannot update in place. Every release is built and signed by the CI pipeline, not from a laptop (engineering standard).

### FR-037 Update notification
- **Priority:** Must
- **Source:** Derived from FACT (no app store means nothing else tells users about updates). The behaviour is PROPOSED (RA-32).
- **Story:** As a user of the Android app, I want to be told when a new version is available so that I get fixes.
- **Acceptance criteria:**
  1. Given the installed version is older than the latest released version, when the user opens the app online, then a notice in the current language says an update is available, shows the new version number, and offers "Update" (opens the download page in the browser) and "Later".
  2. Given the user chooses Later, when they continue, then the app works normally and the notice is not shown again for 24 hours.
  3. Given the installed version is the latest, when the app opens, then no notice is shown.
  4. Given the version check fails or times out, when the app opens, then no error is shown to the user and the app works normally.
  5. Given any update, when it happens, then the app has not downloaded or installed anything by itself; installation always goes through the user and the system installer.
- **Notes:** The version check sends only the installed version number and platform; it is not linked to the account.

### FR-038 Minimum supported version
- **Priority:** Should
- **Source:** PROPOSED (RA-32).
- **Story:** As the operator, I want to stop versions with a known security flaw from being used, since I cannot update users' phones myself.
- **Acceptance criteria:**
  1. Given the installed version is below the minimum supported version set by the operator, when the user opens the app online, then a blocking screen in the current language explains that this version is no longer supported and offers only "Update" (opens the download page).
  2. Given the installed version is below the minimum, when it calls the API, then requests are refused with a response the app shows as the same message.
  3. Given the installed version is at or above the minimum, when the app opens, then it is not blocked.
- **Notes:** Workaround if not delivered: the update notice of FR-037 only.

### Policies and usage measurement

### FR-039 Privacy policy and terms pages
- **Priority:** Must
- **Source:** FACT (scope item 17; analytics must be disclosed in the privacy policy, answer 2026-11-16). The list of what the policy must state is PROPOSED (RA-33). The legal wording itself is not written by the delivery team (OQ-06).
- **Story:** As a user, I want to read in my language what Masareef does with my data before I sign up.
- **Acceptance criteria:**
  1. Given a visitor who is not signed in, when they open the privacy policy or the terms on the website, then each is available in English and in Arabic with right-to-left layout, at a stable public URL.
  2. Given the sign-up screen, the Settings screen in both apps and the download page, when inspected, then each links to both documents.
  3. Given the privacy policy, when read, then it states at least: what data is stored (as listed under Data below) and why; that voice audio is processed on the device, is never sent to Masareef or anyone else and is not kept; that anonymous usage statistics are collected and what they contain; where the data is hosted; how to delete the account and data (FR-009); that the service is for people aged 18 or over; how long data is kept; and how to contact the operator.
  4. Given the documents change, when a signed-in user next opens the app, then they are shown a notice of the change with a link; each document shows its version and effective date.
  5. Given the interface language is Arabic and a document's Arabic version is missing, when the release checklist is run, then the release is blocked (the page must not fall back silently to English).

### FR-040 Anonymous counts for the success measures
- **Priority:** Must
- **Source:** FACT that anonymous usage analytics are allowed, with counts and events only and no personal or expense content (answer 2026-11-16); S-11 and S-12 were accepted as targets. How the operator obtains the numbers is PROPOSED (RA-34).
- **Story:** As the operator, I want to know how many people are actively using Masareef and how much they use voice, without seeing anyone's data.
- **Acceptance criteria:**
  1. Given the running service, when the operator follows the documented procedure, then they obtain the number of accounts that saved at least one expense in the last 30 days (S-11) as a single number.
  2. Given the running service, when the operator follows the documented procedure, then they obtain, for a chosen period, the number of expenses saved by voice and the number saved manually (S-12).
  3. Given test data of 3 accounts, of which 2 saved expenses in the last 30 days, with 4 voice and 6 manual expenses in total, when the procedure is run, then it reports 2 active accounts and 40% voice.
  4. Given the output of the procedure, when inspected, then it contains only counts: no email address, account identifier, amount, category, note or date of any individual expense.
  5. Given an account is deleted (FR-009), when the counts are next produced, then that account and its expenses are no longer included in live counts.
- **Notes:** There is no admin console in R1; the procedure is an operator task described in the runbook.

### FR-041 Anonymous usage events
- **Priority:** Should
- **Source:** FACT that anonymous analytics are allowed (answer 2026-11-16). The event list and the no-identifier rule are PROPOSED (RA-34).
- **Story:** As the operator, I want to see where people give up (for example, start a voice entry but do not save) so that I know what to improve.
- **Acceptance criteria:**
  1. Given a user performs any of: sign-up completed, voice entry started, voice review shown, voice entry saved, voice entry cancelled, manual entry saved, language switched, when it happens, then one event with that name is recorded with the platform (web or Android), the app version, the interface language and the day.
  2. Given every event recorded during a full end-to-end test run, when the captured events are inspected, then none contains an email address, account identifier, device identifier, advertising identifier, IP address, amount, currency, category, note, date of an expense, recognised text or audio (NFR-022).
  3. Given the analytics service is unreachable or blocked by the user's browser, when the user uses the app, then every feature works and no error is shown.
  4. Given the privacy policy, when read, then it lists these events and what they contain.
- **Notes:** Workaround if not delivered: the counts of FR-040 only.

### FR-042 Opt out of usage events
- **Priority:** Could
- **Source:** PROPOSED (RA-35). The product owner did not ask for an opt-out; see OQ-02 on whether privacy law in some countries makes it, or prior consent, necessary.
- **Story:** As a user, I want to turn off usage statistics.
- **Acceptance criteria:**
  1. Given the Settings screen, when the user turns off "Share anonymous usage statistics", then no further events of FR-041 are sent from that device.
  2. Given the setting is off, when the app is restarted, then it is still off.
  3. Given the setting is off, when the user uses the app, then every feature works as before.

## Non-functional requirements

Each states a number and how it will be measured. The numbers in NFR-001 to NFR-010 are the vision's success measures S-1 to S-10, accepted by the product owner on 2026-11-16 (FACT). All other numbers are PROPOSED by the planner (RA-36 unless another reference is given) and are accepted by signing this document.

| ID | Category | Requirement | How verified |
|---|---|---|---|
| NFR-001 | Voice accuracy (S-1) | On Android, on-device: for at least 80% of Egyptian Arabic utterances in the voice test set, amount, category and date are all correct on the review screen with no user correction. Test set: at least 100 recorded utterances from at least 5 speakers, at least 20 with English words mixed in, at least 10 with piastres or fractions, at least 15 with relative dates. If the PoC shows this cannot be reached on-device, the number is lowered through change control (product owner's decision 2026-11-16); audio is not moved off the device | Automated run of the recorded test set through the released Android build on the reference phone; result recorded per utterance in the test report |
| NFR-002 | Voice accuracy (S-2) | Same test set and conditions: amount correct for at least 90% of Egyptian Arabic utterances. Same change-control rule as NFR-001 | Same run as NFR-001 |
| NFR-003 | Voice accuracy (S-3) | On Android, on-device: all three fields correct for at least 90% of at least 100 recorded English utterances. Same change-control rule | Same method with the English test set |
| NFR-004 | Speed (S-4) | Median time from tapping the microphone to the expense being saved, including review, is 10 seconds or less over at least 20 runs of a scripted utterance, on the reference phone; and on desktop web only if web voice ships (FR-033) | Timed scripted test, stopwatch or instrumented build; all run times listed in the test report |
| NFR-005 | Speed (S-5) | Median time from opening the add-expense form to saved is 20 seconds or less over at least 20 runs entering amount and category, on the reference phone and on desktop web | Same method as NFR-004 |
| NFR-006 | Sync latency (S-6) | With both clients online and the list open, 95% of saves on one platform are visible on the other within 10 seconds, over at least 100 samples in each direction | Automated end-to-end test against staging recording the delay per sample |
| NFR-007 | Sync reliability (S-7) | Of at least 1,000 saves, with the network cut at a random moment in at least 200 of them, 100% of saves the client reported as successful exist on the server exactly once, and 0 saves the client reported as failed exist more than once | Automated test with fault injection; server records compared with the client's log |
| NFR-008 | Voice safety (S-8) | 0 voice-entered expenses stored without the user pressing Save on the review screen | All criteria of FR-024 and FR-030 pass; code path review recorded in the test report |
| NFR-009 | Language completeness (S-9) | 0 screens with untranslated text, clipped text or broken right-to-left layout, across every screen in the test plan's screen inventory, in both languages, on web and Android | Screen-by-screen review with screenshots; automated check that every translation key exists in both languages |
| NFR-010 | Running cost (S-10) | All recurring cost (hosting, database, email, analytics, domain, any other service) is USD 10 per month or less while MAU is 500 or fewer. One-off costs are excluded. A billing alert fires at USD 8 in a month | Cost model in the architecture document at the Design gate using providers' published prices on the day; provider invoices at R1+90d; alert shown to exist |
| NFR-011 | Performance | 95% of API responses complete in under 500 ms, and 99% in under 1,500 ms, measured at the server edge with 25 concurrent simulated users for 10 minutes against a database holding 5,000 accounts and 1,000,000 expenses. The first request after the service has been idle completes within 5 seconds | Load test (for example k6) against staging |
| NFR-012 | Performance | Web: Largest Contentful Paint of the sign-in screen and of the expense list is 2.5 seconds or less on a simulated mid-range phone on a 4G profile. Android: time from tapping the icon to a usable expense list is 3 seconds or less on the reference phone, median of 10 cold starts | Lighthouse mobile run in CI; timed cold starts on the reference phone |
| NFR-013 | Capacity | The service meets NFR-011 with 500 MAU, 5,000 registered accounts, and one account holding 10,000 expenses whose first list page still loads within 1 second at the 95th percentile | Load test data set as described; measured in the NFR-011 run |
| NFR-014 | Availability | The API and the web app are reachable for at least 99.0% of each calendar month (at most about 7.3 hours unavailable), measured from outside | External uptime monitor checking every 5 minutes; monthly figure reviewed at R1+30d and R1+90d |
| NFR-015 | Backup and recovery | The database is backed up at least once every 24 hours; at most 24 hours of data can be lost (recovery point); service can be restored from a backup within 8 hours (recovery time); backups are encrypted and kept 30 days | Restore from backup rehearsed once on staging before release, timed, and recorded in the runbook |
| NFR-016 | Security: authorisation | 100% of API endpoints that return or change account or expense data have an automated test that a different user and an unauthenticated caller are refused; 0 failures | Automated cross-account test suite (FR-019); endpoint list compared with the interface definition |
| NFR-017 | Security: passwords | Minimum 15 characters (raised from 8 on 2026-11-16 by the product owner, CR-01: OWASP guidance for services without multi-factor authentication), at least 64 characters accepted, no composition rules, any printable character including Arabic letters and spaces allowed, rejected if on a list of known breached passwords. Stored only as an Argon2id or bcrypt hash, or held by a maintained identity provider that does the same; 0 passwords in plain text in the database, logs or analytics | Unit and API tests at the boundaries (14, 15, 64 characters; a known breached password); database and log inspection. Re-checked against the OWASP Authentication Cheat Sheet in the Design phase on 2026-11-16 |
| NFR-018 | Security: sessions | A session ends after 30 days without activity; sign-out invalidates it on the server within 5 seconds; a password reset invalidates all sessions of the account within 60 seconds. On the web, session cookies are Secure, HttpOnly and SameSite | API tests with a controllable clock; cookie attribute check |
| NFR-019 | Security: rate limits | Sign-in: after 5 consecutive failures for one account, further attempts are refused for 15 minutes; at most 20 sign-in attempts per IP address per 15 minutes. Sign-up: at most 5 per IP address per hour. Password-reset and verification emails: at most 3 per account per hour. Signed-in API use: at most 120 requests per account per minute. Request body: at most 16 KB. Requests over a limit get a "too many requests" or "too large" response and are not processed | Automated API tests that exceed each limit by one |
| NFR-020 | Security: transport and build | 100% of endpoints and pages are served only over HTTPS with TLS 1.2 or later; HTTP redirects to HTTPS; responses carry HSTS (max-age at least 31,536,000 seconds), a Content-Security-Policy without `unsafe-inline` for scripts, and `X-Content-Type-Options: nosniff`; CORS lists exact origins. 0 High or Critical findings from secret scanning, static analysis, dependency audit and a dynamic scan of the web app, at the release commit. 0 secrets in the repository, the web bundle or the APK | Automated header check in CI; CI security jobs; scan reports attached to the test report |
| NFR-021 | Privacy: audio | 0 bytes of audio and 0 recognised transcripts leave the device or browser; 0 audio files or transcripts remain in app storage after an entry ends; 0 on the server | Network capture through a proxy during 20 voice entries on Android (and on web if FR-033 ships) plus capture of the web add-expense screen in every case; device storage inspection; server database and log inspection |
| NFR-022 | Privacy: analytics | 0 analytics events contain any of the fields excluded in FR-041 criterion 2; the analytics service stores no IP address and sets no cross-site or advertising identifier | Capture of all analytics requests during the full end-to-end run, checked against the documented event schema; provider configuration recorded in the architecture document |
| NFR-023 | Privacy: data minimisation | The personal data stored is limited to the fields listed under Data below; adding a field requires a change to this document. 0 occurrences of email addresses, passwords, session credentials, amounts or notes in application logs. Personal data is encrypted at rest | Data-model review against the Data table; automated scan of logs produced by the end-to-end run for seeded marker values; provider encryption setting recorded |
| NFR-024 | Privacy: retention and deletion | After account deletion: 0 of the user's records in the live database within 60 seconds and in backups within 30 days. Unverified accounts are deleted 7 days after creation. Application logs are kept at most 30 days. Account and expense data is otherwise kept until the user deletes the account (see OQ-05 on inactive accounts) | API and database test for live deletion; backup retention setting shown to be 30 days; clean-up job test with a controllable clock |
| NFR-025 | Accessibility | WCAG 2.2 level AA on every screen of the web app and website pages and, as far as the criteria apply to native apps, every screen of the Android app, in both languages (FACT: answer 2026-11-16). Measured as: 0 violations from an automated axe scan with WCAG 2.2 A and AA rules on every web screen in English and Arabic; every function operable by keyboard alone on the web with a visible focus indicator; every screen and the complete add-by-voice and add-manually journeys completed with a screen reader in English and in Arabic on Android (TalkBack) and on the web (NVDA with Chrome or Firefox, and VoiceOver with Safari); text contrast at least 4.5:1; touch and pointer targets at least 24 by 24 CSS pixels; content usable at 200% text size and at 320 CSS pixels width without horizontal scrolling | axe scan in CI; Android Accessibility Scanner; manual keyboard and screen-reader pass recorded per screen in the test report |
| NFR-026 | Browser and device support | Android app: Android 8.0 (API level 26) and later (FACT). Web app: the current stable version, and the one before it, of Chrome, Firefox, Safari and Edge on desktop, and Chrome on Android and Safari on iOS, at widths from 320 to 1,920 CSS pixels ("current" is FACT; "and the one before it", mobile browsers and the width range are PROPOSED, RA-37). The full end-to-end suite passes on each | End-to-end suite run on Android 8.0 and the latest Android (emulator) plus the reference phone, and on each listed browser; versions recorded in the test report |
| NFR-027 | Android distribution | 100% of released APKs are signed with the one release key and pass signature verification; the published SHA-256 checksum matches the published file. Total download needed before first voice entry (APK plus any speech data) is 150 MB or less (PROPOSED, RA-38; to be revisited after the PoC) | Signature verification and checksum comparison as a CI release step; file sizes recorded per release |
| NFR-028 | Observability | The operator is alerted within 15 minutes when the API or web app is unreachable. Every server error is logged with a correlation identifier that is also shown to the user in the error message, and without personal data. An alert fires when recurring cost reaches 80% of the ceiling in NFR-010 | Induced outage and induced error on staging; alert receipt recorded with timestamps |

## Traceability to the vision's success measures

| Success measure | Served by |
|---|---|
| S-1 Voice parse accuracy, Egyptian Arabic, at least 80% | NFR-001; FR-023, FR-025, FR-026, FR-027, FR-029 |
| S-2 Voice amount accuracy, Egyptian Arabic, at least 90% | NFR-002; FR-025, FR-029 |
| S-3 Voice parse accuracy, English, at least 90% | NFR-003; FR-023, FR-025, FR-026, FR-027 |
| S-4 Voice entry in a median of 10 seconds or less | NFR-004; FR-023, FR-024, FR-034 (FR-033 on web if it ships) |
| S-5 Manual entry in a median of 20 seconds or less | NFR-005; FR-010 |
| S-6 Sync within 10 seconds for 95% | NFR-006; FR-017 |
| S-7 No lost or duplicated saves | NFR-007; FR-017, FR-018 |
| S-8 No silent wrong saves | NFR-008; FR-024, FR-030 |
| S-9 No untranslated or broken right-to-left screens | NFR-009; FR-020, FR-021, FR-022, FR-014 |
| S-10 Running cost of USD 10 per month or less | NFR-010, NFR-028; FR-032 (on-device speech has no per-use fee) |
| S-11 At least 100 active users at R1+90d | FR-040 (measurement); FR-001 to FR-005 and FR-035 (people can get in and get the app) |
| S-12 At least 30% of expenses entered by voice | FR-040 (measurement); FR-010 and FR-024 (entry method recorded); FR-041 |

S-4 on desktop web and S-12 on the web depend on FR-033. If web voice does not ship, S-4 is measured on Android only and S-12 will be lower than it would otherwise be; the target for S-12 should then be reviewed by the product owner through change control.

## Data

What is stored on the server (PROPOSED field list, RA-01, following the data-minimisation decision of 2026-11-16):

| Data | Personal data? | Why it is stored | Kept until |
|---|---|---|---|
| Email address | Yes | Sign-in, verification and password-reset email | Account deletion |
| Password hash (email-and-password accounts) | Yes (credential) | Sign-in | Account deletion |
| Google account identifier (Google sign-in accounts) | Yes | Sign-in | Account deletion |
| Email-verified flag; date and time of the 18+ and terms confirmation; terms version accepted | Yes | Proof of confirmation | Account deletion |
| Preferred language; default currency | Yes (low sensitivity) | User settings across devices | Account deletion |
| Expenses: amount, currency, category, date, note, entry method (manual or voice), created and updated times | Yes: financial records linked to a person; the free-text note may contain anything the user types | The product's purpose | Deleted by the user, or account deletion |
| Session records | Yes | Keeping the user signed in; sign-out | Expiry (NFR-018) or account deletion |
| Application logs: time, endpoint, status, correlation identifier | No personal data by rule (NFR-023) | Operation and fault-finding | 30 days |
| Anonymous usage events and counts (FR-040, FR-041) | No (NFR-022) | Success measures S-11 and S-12 | Not limited |

Not stored anywhere: voice audio, recognised transcripts, name, phone number, date of birth, address, location, contacts, device identifiers, advertising identifiers, payment details.

Who may see it: each user sees only their own data (FR-019). The operator has technical access to the database for running the service and must not read users' expenses except where needed to fix a reported fault; this is to be stated in the privacy policy (PROPOSED, RA-33). No data is shared with or sold to third parties. Service providers that host the data or send email act on the operator's behalf and are named in the architecture document and the privacy policy.

Where it is hosted: not decided. The hosting location is kept flexible and decided in an ADR in the Design phase (FACT: product owner's decision of 2026-11-16 on Law 151/2020).

## Integrations

No client system exists to integrate with (FACT). The third-party services below follow from the requirements; providers are chosen in the Design phase.

| System | Direction | Purpose | Owner | Test access available? |
|---|---|---|---|---|
| Google sign-in (Google's identity service) | Outbound redirect, inbound identity result | FR-005 | Google; the client-side registration must be owned by the product owner | No - the product owner must create or designate the Google developer project (OQ-07) |
| Transactional email service (provider not chosen) | Outbound | Verification and password-reset emails (FR-002, FR-007) | To be chosen in Design | No - chosen in Design |
| Anonymous analytics (provider not chosen; may be built in) | Outbound | FR-041 | To be chosen in Design | No - chosen in Design |
| On-device speech recognition (Android system or bundled; browser if FR-033 ships) | On the device only | FR-023, FR-033 | Device or browser vendor, or a bundled open model; decided by the PoC | Depends on the PoC |
| Website hosting and domain for the web app, download page and policy pages | Outbound (publish) | FR-035, FR-039 | Product owner (OQ-07) | No |

Not integrated: any cloud speech service (excluded by the on-device decision), Google Play, SMS, payment, banks.

## Out of scope

Carried from the vision (confirmed by the product owner unless marked):

- iOS app.
- Importing transactions from banks or SMS; receipt scanning.
- Shared or family budgets and any sharing of data between accounts.
- Budgets, spending limits and alerts; income tracking, balances, savings goals; recurring expenses.
- User-defined categories.
- Export (CSV, PDF) and import from other apps.
- Currency conversion and exchange rates.
- Offline use on Android with later sync.
- Push notifications and reminders.
- Still assumed out, not confirmed (vision A-12): monetisation of any kind, an admin console, voice or interface languages other than Egyptian Arabic and English, several expenses in one utterance, voice commands other than adding an expense, storing voice recordings.

Following from the product owner's answers of 2026-11-16:

- Publication on Google Play, and anything required only by Google Play (Data safety form, closed testing).
- Any cloud or server-side speech recognition, and any browser speech recognition that sends audio to a server.
- Voice entry on the web, if the PoC does not show on-device recognition in the browser to be good enough (FR-033).
- Sign-in by phone number or SMS code.
- Arabic-Indic digits in the interface; currencies other than EGP, USD, EUR, SAR, AED, GBP and KWD.
- Android versions older than 8.0.
- Restricting sign-up by country.

Discovered while writing requirements and proposed as out of R1 (PROPOSED, RA-39):

- Changing the account's email address; changing the password while signed in (password reset covers it); multi-factor authentication (the standard requires it for privileged roles and there are none).
- Sign-in methods other than email and password and Google.
- Age verification beyond self-declaration.
- A self-service download of the user's own data (follows from export being out of scope; see OQ-02 for the legal side).
- Automatic or silent installation of updates.
- Automatic deletion of inactive accounts (OQ-05).
- Dates before 2000-01-01 or in the future; times of day on expenses.
- Voice date expressions beyond those listed in FR-027.
- An installable or offline-capable web app.

## Assumptions

Everything in this table was filled in by the planner. None of it was stated by the product owner. Signing off this document accepts these as written.

| # | Assumption | Affects |
|---|---|---|
| RA-01 | The data stored is exactly the field list under Data; nothing else is collected at sign-up or from Google | FR-001, FR-005, NFR-023 |
| RA-02 | Email-and-password accounts must verify their email before first sign-in; link valid 24 hours; unverified accounts deleted after 7 days | FR-002 |
| RA-03 | Sign-up and password reset never reveal whether an email is registered | FR-001, FR-004, FR-007 |
| RA-04 | "18+" is enforced by a self-declaration tick box; no date of birth is collected and no age check is performed | FR-003 |
| RA-05 | Password rules as in NFR-017 | FR-001, FR-007 |
| RA-06 | Lockout, rate-limit and link-lifetime values as in NFR-019 and FR-007 | FR-004, FR-007 |
| RA-07 | A Google sign-in whose verified email equals that of an existing verified account signs in to that account | FR-005 |
| RA-08 | Sessions last 30 days from last activity on both platforms | FR-008, NFR-018 |
| RA-09 | Account deletion is immediate, irreversible, needs re-authentication; gone from backups within 30 days | FR-009, NFR-024 |
| RA-10 | Field limits: amount above 0 and up to 9,999,999.99; note up to 200 characters; date from 2000-01-01 to today; date has no time of day | FR-010 |
| RA-11 | Concurrent edits: the last save received wins; deleting needs a confirmation | FR-011, FR-012 |
| RA-12 | List defaults to the current month, newest first, pages of 50 | FR-013 |
| RA-13 | The ten categories and their draft Arabic names in FR-014 | FR-014, FR-026 |
| RA-14 | Two decimal places, three for KWD; a default currency per account plus a choice per expense | FR-015 |
| RA-15 | Summary is per calendar month, one currency at a time, with previous and next month navigation; chart type left to Design | FR-016 |
| RA-16 | Sync appears on the other device without the user refreshing; duplicate prevention on retry is a requirement | FR-017 |
| RA-17 | Offline: clear message, typed values kept on screen, nothing queued for later | FR-018 |
| RA-18 | Language choice is stored with the account and on the device | FR-021 |
| RA-19 | Arabic-Indic digits typed into amount fields are accepted and converted; notes are left as typed; dates display as "16 Nov 2026" and "16 نوفمبر 2026"; EGP shows as ج.م in Arabic | FR-022 |
| RA-20 | The reference phone is a mid-range Android phone with 4 GB of memory released in 2021 or later, named in the test plan | NFR-001 to NFR-005, NFR-012 |
| RA-21 | Listening stops after 10 seconds of silence or 30 seconds of speech; recogniser language follows the interface language with a per-entry switch | FR-023 |
| RA-22 | Voice entry leaves the note empty; the transcript is shown but not stored; "Record again" is offered | FR-024, FR-034 |
| RA-23 | The example phrasings for amounts are representative; the agreed voice test set is the authority | FR-025 |
| RA-24 | No category word means Other, marked for attention | FR-026 |
| RA-25 | Supported relative dates are the list in FR-027; no date means today; future or unsupported expressions mean today, marked | FR-027 |
| RA-26 | No currency word means the user's default; unqualified pounds or piastres mean EGP | FR-028 |
| RA-27 | Speech that cannot be parsed opens the review screen for manual completion; silence opens nothing | FR-030 |
| RA-28 | A speech-data download needs the user's confirmation with the size shown | FR-031 |
| RA-29 | Audio and transcripts are not stored anywhere after an entry ends (vision A-13) | FR-032 |
| RA-30 | "Good enough" for web voice means: in at least desktop Chrome, on-device, with no audio leaving the browser, the PoC meets the same accuracy numbers as NFR-001 to NFR-003 (or the numbers they are lowered to) | FR-033 |
| RA-31 | Download page contents; one release key; checksum and certificate fingerprint published | FR-035, FR-036 |
| RA-32 | Update notice on app start, at most once per 24 hours; a minimum supported version can block old versions | FR-037, FR-038 |
| RA-33 | The list of statements the privacy policy must contain; the operator's access to data | FR-039, Data |
| RA-34 | S-11 and S-12 are measured by counts taken from the service's own data by a documented operator procedure; the usage-event list of FR-041; events carry no identifier of any kind | FR-040, FR-041 |
| RA-35 | An opt-out from usage events is a Could | FR-042 |
| RA-36 | All numbers in NFR-011 to NFR-024 and NFR-028: response times, 25 concurrent users, 5,000 accounts, 1,000,000 expenses, 99.0% availability, 24-hour recovery point, 8-hour recovery time, 30-day log and backup retention | NFRs |
| RA-37 | "Current" browsers means the current stable version and the one before it, including Chrome on Android and Safari on iOS, at 320 to 1,920 CSS pixels wide | NFR-026 |
| RA-38 | Total download before first voice entry is 150 MB or less | NFR-027 |
| RA-39 | The "discovered" out-of-scope list above | Out of scope |
| RA-40 | Early load is the vision's A-17 (up to 500 MAU in the first 90 days), still unconfirmed | NFR-010, NFR-011, NFR-013 |

## Open questions

Ordered by importance. Vision question numbers are given where the question is carried over.

| # | Question | Blocks | Owner |
|---|---|---|---|
| OQ-01 | **Android developer verification and direct APK distribution.** According to press reports and Google's Android developer help (found by search on 2026-11-16; the Google page itself could not be opened by the planner, so this is from secondary sources), Google now requires apps installed on certified Android devices, including apps installed from outside Google Play, to be registered by a developer whose identity Google has verified. Reports say enforcement began on 30 September 2026 in Brazil, Indonesia, Singapore and Thailand and will extend to other countries from 2027, with unregistered apps installable only through a more difficult "advanced" route. Because sign-up is worldwide and Egypt will presumably follow, the product owner may need to register as a verified Android developer and register the app, even without using Google Play. Will the product owner do this, under which identity (personal or organisation), and is any fee acceptable? The cost, the identity documents needed and the date it reaches Egypt must be checked on Google's own pages in the Design phase. Sources: https://support.google.com/android-developer-console/answer/16561738 , https://www.androidauthority.com/android-sideloading-changes-timeline-3679204/ , https://thehackernews.com/2026/06/google-sets-sept-30-deadline-for.html | Plan gate (it adds a task and possibly lead time); Release gate (the APK may be hard or impossible for ordinary users to install without it) | Product owner; planner to verify the rules in Design |
| OQ-02 | **Privacy law outside Egypt.** Sign-up is worldwide, so people in the EU, the UK, the Gulf states and elsewhere can register. The product owner did not say how far to go. What the planner checked on 2026-11-16, from law-firm commentary on the European Data Protection Board's guidelines on territorial scope and not from the legal texts: the EU's GDPR can apply to a service run from outside the EU when it is offered to people in the EU; the fact that a website can be reached from the EU is reported not to be enough by itself, and intention to serve people there is what counts, whether or not payment is taken. Whether Masareef, as specified (worldwide sign-up, euro among the currencies, no EU language other than English), would be treated as offered to people in the EU is a legal judgement the planner does not make. If it is, obligations may follow that are not in these requirements, for example consent rules for analytics, a right to obtain a copy of one's data (export is out of scope) and appointing a representative. The requirements as written give every user, wherever they are, deletion, a privacy policy, minimal data and no audio leaving the device. Is that baseline enough for R1, or should legal advice on other countries be obtained together with the Egyptian advice? Sources: https://www.hunton.com/privacy-and-information-security-law/edpb-publishes-final-version-of-guidelines-on-the-gdprs-territorial-scope , https://www.twobirds.com/en/insights/2018/global/where-does-the-gdpr-apply-european-data-protection-board-finally-weighs-in | Release gate (public launch). May change FR-041, FR-042 and add a data-copy requirement, which would reopen this document | Product owner, with legal adviser |
| OQ-03 | (Vision Q-13) CLOSED IN PART 2026-11-16: the product owner chose to start the PoC with synthetic and public audio, with real speakers added before release, and to make the PoC the first build task, with the Design choice made from documented evidence and marked provisional (docs/03-architecture.md, ADR 0002). The PoC and the Design gate are therefore no longer blocked by this question. STILL OPEN: who reviews all Arabic text, and who records or supplies the real-speaker Egyptian Arabic test set of at least 100 utterances from at least 5 speakers, and the English set of at least 100? NFR-001 to NFR-003 are only proven on that set | Testing phase (real-speaker test set needed before it starts); Release gate (Arabic text review) | Product owner |
| OQ-04 | (Vision Q-01) Egypt's Law 151/2020: the product owner decided on 2026-11-16 to treat this as an open risk, build with data minimisation and keep hosting location flexible; legal advice is required before public launch, not before building. Outstanding: does the product need a licence from the Personal Data Protection Centre, may data be hosted outside Egypt, and what does it cost? | Release gate (public launch). The answer may force a hosting change | Product owner, with legal adviser |
| OQ-05 | Should accounts that have not been used for a long time be deleted automatically (for example after 24 months, with a warning email)? Proposed for R1: no; data is kept until the user deletes the account. Data-minimisation principles and the legal advice in OQ-02 and OQ-04 may require a limit | Release gate | Product owner, with legal adviser |
| OQ-06 | Who writes the legal text of the privacy policy and terms in both languages, and who reviews it? The delivery team can build the pages and supply a factual description of what the product does with data (FR-039 criterion 3), but does not write legal terms | Release gate | Product owner |
| OQ-07 | CLOSED IN PART 2026-11-16: the product owner has no accounts yet; every account is new, on free tiers where possible, with a new domain, and all are owned by the product owner (domain, Google project, email-sending account, hosting account, signing key backup). The full list is in docs/03-architecture.md, "Prerequisites the product owner must complete". STILL OPEN: what is the public contact address for privacy requests? | Release gate (contact address) | Product owner |
| OQ-08 | If the PoC shows on-device Egyptian Arabic accuracy is below target, the decision is to lower the target. Is there a floor below which voice in Arabic should not ship at all (for example, below 50% all-fields-correct)? No floor has been set | Design gate | Product owner |
| OQ-09 | (Vision Q-12) What is the motivation and evidence for the product, and is it intended to earn money later? Not asked on 2026-11-16. It does not change R1 scope; it would shape priorities among Should and Could items and how S-11 is read. The vision listed it as needed by the Requirements gate; the planner's view is that sign-off can proceed without it, and the signer should confirm that | Requirements gate (signer to confirm it is not blocking) | Product owner |
| OQ-10 | Is the pass criterion for web voice in RA-30 acceptable (same accuracy as Android, in at least desktop Chrome), or would the product owner ship web voice at a lower accuracy, or English-only on the web? | Design gate | Product owner |
| OQ-11 | Confirm the planner's proposals that most affect what users see: email verification before first use (RA-02), the ten categories (RA-13), "pounds" meaning EGP in speech (RA-26), 30-day sessions (RA-08), and immediate irreversible account deletion (RA-09) | Requirements gate (accepted by signing) | Product owner |

## Sign-off
Recorded with `/software-house:signoff requirements` (name and date are stored in `.software-house/state.json`).

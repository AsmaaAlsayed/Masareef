# Vision: Masareef (مصاريف)

| | |
|---|---|
| Client | Internal (the product owner's own product) |
| Author | planner |
| Date | 2026-11-16 |
| Status | Draft - updated 2026-11-16 with the product owner's answers; Q-01 and Q-12 remain open and Q-13 is closed in part (see Open questions) |

How to read this document: statements marked **[FACT]** were stated by the product owner in the brief or interview. Statements marked **[ASSUMED]** were filled in by the planner and are not confirmed; each one is listed again under Assumptions with a reference (A-nn) and the person who can confirm it. Nothing marked [ASSUMED] should be treated as a client requirement until confirmed.

## Problem

The idea in the product owner's words **[FACT]**:

> "personal expenses tracker in english/arabic with option to let the use to use voice to input the expenses, make it as wep app and for android"

What the product owner has told us **[FACT]**:

- People should be able to track their personal expenses in English or Arabic.
- Typing is not the only way in: the user can say something like "spent 50 pounds on lunch" and the app fills in amount, category and date, which the user reviews and confirms before it is saved ("speak, review, save").
- The same account and the same expenses are available on a web app and an Android app, synchronised through a backend.
- The first target market is Egypt: voice input targets Egyptian Arabic speech plus English, and the default currency is the Egyptian pound (EGP).

What we are inferring about the underlying pain **[ASSUMED, A-01]** - the product owner has not stated why existing tools are inadequate, and no user research has been supplied:

- Logging an expense by typing takes enough effort that people stop doing it, so their records become incomplete and useless.
- Existing expense trackers serve Arabic speakers poorly: Arabic interfaces and right-to-left layout are partial or absent, and voice entry does not handle the Egyptian dialect.

No cost of the problem (time lost, money, number of people affected) has been stated, and none is invented here. See Q-12.

## Users

| User | What they need to get done | How they do it today |
|---|---|---|
| Member of the general public, aged 18 or over, who wants to track personal spending, Arabic-speaking, English-speaking or both. Egypt is the first target market; sign-up is open worldwide **[FACT: general public, anyone can sign up, Egypt first; worldwide and 18+ confirmed 2026-11-16, closing Q-09 and Q-10]** | Record an expense within seconds of spending, by voice or by typing, in their own language; see it on both phone and web **[FACT]**. See where their money went **[ASSUMED, A-07]** | Not stated by the product owner. Presumed: memory, paper notes, a notes app, a spreadsheet, or a general-purpose expense app in English **[ASSUMED, A-01]** |
| Product owner acting as operator **[ASSUMED, A-02]** | Keep the service running at near-zero cost, see whether it is healthy, respond to account and data-deletion requests | Nothing exists yet |

There is one end-user role. No administrator, family-member or accountant role has been requested **[ASSUMED, A-03: single-user accounts only]**.

## Outcome and success measures

What will be true when this works: a person in Egypt can sign up, log an expense by speaking Egyptian Arabic or English and confirming what the app understood, or by typing it, in an interface fully in their language, and find the same expense on the other platform shortly afterwards. The service costs the product owner close to nothing to run at early scale.

**The targets below were proposed by the planner and accepted "as proposed" by the product owner on 2026-11-16 [FACT, closing Q-04].** For S-1 to S-3 the product owner also decided that, if the proof of concept shows the targets cannot be reached with on-device recognition, the accuracy target is lowered through change control rather than moving to a cloud speech service (closing Q-11). There is no product today, so there are no baselines. Because there is no deadline **[FACT]**, dates are relative: "at release" means the first public release (R1), measured during the Testing phase; "R1+90d" means 90 days after R1.

| # | Measure | Today | Target | How it is measured |
|---|---|---|---|---|
| S-1 | Voice parse accuracy, Egyptian Arabic: share of utterances where amount, category and date are all filled in correctly with no user correction | No product | >= 80% at release | Fixed test set of at least 100 recorded Egyptian Arabic utterances from at least 5 speakers, agreed before implementation |
| S-2 | Voice amount accuracy, Egyptian Arabic: share of utterances where the amount is correct | No product | >= 90% at release | Same test set as S-1 |
| S-3 | Voice parse accuracy, English (all three fields correct) | No product | >= 90% at release | Fixed test set of at least 100 recorded English utterances |
| S-4 | Time to log one expense by voice, from tapping the microphone to the expense being saved (including review) | No product | Median <= 10 seconds at release | Timed scripted test, at least 20 runs, on a mid-range Android phone and on desktop web |
| S-5 | Time to log one expense manually, from opening the entry form to saved | No product | Median <= 20 seconds at release | Same method as S-4 |
| S-6 | Cross-device sync latency: expense saved on one platform appears on the other, both online | No product | 95% within 10 seconds at release | Automated end-to-end test, at least 100 samples |
| S-7 | Sync reliability: expenses saved by a client that reach the server without loss or duplication | No product | 100% in a test of at least 1,000 saves including forced network drops, at release | Automated test |
| S-8 | No silent wrong saves: a voice-entered expense is never saved without the user seeing and confirming the parsed fields | No product | 0 occurrences, at release | Test cases in the requirements traceability matrix |
| S-9 | Language completeness: screens with untranslated strings or broken right-to-left layout in Arabic | No product | 0 at release | Screen-by-screen review of every screen in both languages on web and Android |
| S-10 | Running cost (hosting, database, speech and language services, everything recurring) | 0 | <= USD 10 per month while monthly active users are <= 500, checked at R1+90d | Provider invoices. Excludes one-off fees |
| S-11 | Adoption: registered users who logged at least one expense in the last 30 days | 0 | >= 100 at R1+90d | Anonymous product analytics (allowed by the product owner on 2026-11-16: counts and events only, no personal or expense content, disclosed in the privacy policy) |
| S-12 | Voice usage: share of all saved expenses that were entered by voice | 0 | >= 30% at R1+90d | Product analytics |

S-1 to S-9 are release-quality measures the tester can execute. S-10 to S-12 are business outcomes. If voice does not ship on the web (see Scope item 16), S-4 is measured on Android only.

## Scope

**In - first release (R1)**

Confirmed by the product owner **[FACT]**:

1. Web app and Android app.
2. English and Arabic user interface, with right-to-left layout in Arabic.
3. Public sign-up; each user has an account.
4. Expenses synchronised between web and Android through a backend.
5. Manual expense entry.
6. Voice expense entry as an option alongside manual entry, in Egyptian Arabic and English, following "speak, review, save": the app fills in amount, category and date; the user reviews, can correct, and confirms before anything is saved.
7. Default currency EGP, with other currencies selectable.

Proposed by the planner to make a usable first release and **confirmed by the product owner on 2026-11-16 [FACT, closing Q-03]** (formerly assumptions A-05 to A-10):

8. Sign-in, sign-out and password reset. Sign-in methods: email and password, and Google sign-in (confirmed 2026-11-16, closing Q-07; phone number and SMS were not selected).
9. Account deletion that also deletes the user's data, available in the app and from a web page (kept after the decision of 2026-11-16 to distribute outside Google Play).
10. Expense fields: amount, currency, category, date, optional note. Edit and delete an expense.
11. A fixed built-in list of categories with English and Arabic names (for example food, transport, bills, shopping, health, entertainment, other). No user-defined categories in R1.
12. Expense list with filtering by date range and category.
13. A monthly summary: total spent and total per category, with one simple chart.
14. Each expense is stored in the currency it was entered in. No currency conversion; totals are shown per currency.
15. Language can be switched by the user at any time and defaults to the device or browser language.
16. Voice input on Android, and on the web if possible. Decided 2026-11-16: audio is processed on the device only and never leaves the phone or browser; the Design proof of concept tests on-device recognition in the browser, and if it is not good enough voice ships on Android only and the web app is manual entry. Voice understands mixed Arabic and English speech, relative dates, and piastres (stored as decimals of a pound) (closing Q-14).
17. Privacy policy and terms pages in both languages.

**Out - first release**

Confirmed out by the product owner **[FACT]**:

- iOS app.
- Importing transactions from banks or from SMS messages (confirmed 2026-11-16, closing Q-02).
- Shared or family budgets, and any sharing of data between accounts (confirmed 2026-11-16).
- Receipt scanning (photo to expense) (confirmed 2026-11-16).

Proposed out of R1 by the planner. The product owner confirmed on 2026-11-16 that budgets and alerts, income tracking, recurring expenses, custom categories, export, currency conversion, notifications and offline use on Android are out **[FACT, closing Q-03 and Q-05]**; the other items in this list remain **[ASSUMED, A-12]**:

- Budgets, spending limits and alerts.
- Income tracking, account balances, savings goals.
- Recurring or scheduled expenses.
- User-defined categories.
- Export (CSV, PDF) and import from other apps.
- Currency conversion and exchange rates.
- Offline use on Android (entering expenses with no connection and syncing later). R1 is proposed as online-only, showing a clear message when offline. This is the item most likely to be wanted by users in practice, and adding it later affects the architecture, so it needs an answer before the Design phase (Q-05).
- Voice in languages or dialects other than Egyptian Arabic and English; any other UI language.
- Several expenses in one utterance; voice commands other than adding an expense (for example asking "how much did I spend this month").
- Push notifications and reminders.
- Advertising, subscriptions, in-app purchases or any monetisation.
- An admin console.
- Storing voice recordings (see A-13).

Out of R1 following the product owner's answers of 2026-11-16 **[FACT]**:

- Publication on Google Play (the Android app is a direct APK download from the website).
- Any speech service that receives audio off the device, including browser speech recognition that sends audio to the browser vendor.
- Sign-in by phone number or SMS code.
- Arabic-Indic digits in the interface; currencies beyond EGP, USD, EUR, SAR, AED, GBP and KWD.

## Constraints

| Area | Constraint | Source |
|---|---|---|
| Deadline | None | FACT |
| Budget | Minimal cost; prefer free tiers and low running costs. No figure given; a ceiling is proposed in S-10 | FACT (figure is ASSUMED) |
| Platforms | Web and Android. No iOS in R1. Android 8.0 and later; current Chrome, Firefox, Safari and Edge (confirmed 2026-11-16) | FACT |
| Distribution | The Android app is a direct APK download from the website; no Google Play in R1 (confirmed 2026-11-16, closing Q-08) | FACT |
| Accessibility | WCAG 2.2 level AA, with screen readers in both languages (confirmed 2026-11-16) | FACT |
| Languages | English and Arabic UI; Arabic right-to-left. Voice: Egyptian Arabic and English. Western digits (0-9) everywhere, including the Arabic interface (confirmed 2026-11-16, closing Q-15) | FACT |
| Market | Egypt first; sign-up open worldwide to people aged 18 or over (confirmed 2026-11-16). Default currency EGP; selectable currencies EGP, USD, EUR, SAR, AED, GBP, KWD (confirmed 2026-11-16, closing Q-16) | FACT |
| Existing systems | None mentioned; no integrations | FACT |
| Technology and hosting | "You decide." No technology is mandated. The stack and hosting are deliberately not chosen in this document; they will be chosen in the Design phase from evidence checked on the day, with ADRs | FACT that it is delegated; the choice itself is pending (A-14) |
| Voice technology | Speech recognition runs on the device only; audio never leaves the phone or browser (confirmed 2026-11-16, closing Q-06). It should handle Egyptian Arabic at the accuracy in S-1 and S-2; if the proof of concept shows on-device recognition cannot, the accuracy target is lowered through change control, and on-device processing and near-zero cost are kept (confirmed 2026-11-16, closing Q-11). See Risk R-1 | FACT |
| Privacy | Anonymous usage analytics are allowed: counts and events with no personal or expense content, disclosed in the privacy policy (confirmed 2026-11-16) | FACT |
| Compliance | The product owner decided on 2026-11-16 to treat Egypt's Law 151/2020 as an open risk: build with data minimisation, keep hosting location flexible, and obtain legal advice before public launch rather than before building. The items below are the planner's reading and are not legal advice | FACT for the decision; the reading of the law is ASSUMED (A-15) |

Compliance detail - what was checked on 2026-11-16 and how far it can be trusted:

- **Egypt, Personal Data Protection Law No. 151 of 2020.** The product collects personal data of people in Egypt (account identity, spending records, and voice audio at least transiently), so the law is assumed to apply. According to law-firm commentary (Clyde & Co, Kennedys, Baker McKenzie, Chambers; links below), the Executive Regulations were issued in November 2025 with a one-year grace period, which several of those sources put as ending on or about 1 November 2026, that is, before the date of this document. The same commentary reports that controllers and processors need a licence or permit from the Personal Data Protection Centre (PDPC) and that transferring personal data outside Egypt needs a separate PDPC licence. **Not verified against the primary legal text:** the sources are secondary, they disagree on the decree number, and whether and how licensing, fees and any exemptions apply to a small product run by an individual has not been established. This could affect cost, hosting location and whether public launch is permissible at all, so it is raised as Q-01 and Risk R-3. The planner makes no assertion about what the law requires of this project.
- **Google Play: the next two items do not apply to R1.** On 2026-11-16 the product owner chose direct APK download with no Google Play publication. The items are kept for the record in case Play is used later. Account deletion in the app and on the web (Scope item 9) stays regardless.
- **Google Play.** Google's Play Console help states that apps that let users create an account must also let users request deletion of the account and its data, both inside the app and through a web link declared in the Data safety form, and that the Data safety form must be completed. Source: Google Play Console Help, "Understanding Google Play's app-account deletion requirements" (found via search on 2026-11-16; the live policy text must be re-read in the Design phase). Scope item 9 exists because of this.
- **Google Play, new personal developer accounts.** Google's Play Console help states that personal developer accounts created after 13 November 2023 must run a closed test with at least 12 testers opted in continuously for 14 days before applying for production access. Whether this applies depends on what kind of account the product owner has or will create (Q-08). It adds at least two weeks and the need to recruit 12 testers before public release.
- **Microphone and audio.** Recording audio requires the user's permission on Android and in browsers. Decided 2026-11-16: audio is processed on the device only and is never sent to a server or third-party service, so no audio crosses a border. See A-13.
- **Direct APK distribution.** Added 2026-11-16. Press reports and Google's Android developer help (secondary sources; not verified against Google's page) say Google is introducing a requirement that apps installed on certified Android devices, including apps installed outside Google Play, be registered by an identity-verified developer, enforced first in four countries from 30 September 2026 and elsewhere from 2027. Whether and when this affects Masareef is open; see Risk R-12 and open question OQ-01 in docs/02-requirements.md.
- **Other jurisdictions.** Sign-up is open worldwide (confirmed 2026-11-16, closing Q-09). How far other regimes (for example the EU's GDPR) must be addressed was not decided; see open question OQ-02 in docs/02-requirements.md.
- **Age.** Users must be 18 or over (confirmed 2026-11-16, closing Q-10).

Sources consulted on 2026-11-16:

- https://www.clydeco.com/en/insights/2026/01/egypt-regulatory-update-on-data-privacy
- https://www.kennedyslaw.com/en/thought-leadership/article/2026/egypt-s-personal-data-protection-law-the-compliance-countdown-has-begun
- https://connectontech.bakermckenzie.com/egypt-important-data-protection-update/
- https://chambers.com/articles/a-first-look-at-egypt-s-personal-data-protection-executive-regulations
- https://support.google.com/googleplay/android-developer/answer/13327111
- https://support.google.com/googleplay/android-developer/answer/14151465

## Assumptions

All assumptions were made by the planner. "Confirm with" names who can settle each one.

| # | Assumption | Confirm with |
|---|---|---|
| A-01 | The underlying pain is that typing expenses is too slow to sustain and that existing trackers serve Arabic speakers, especially Egyptian-dialect voice users, poorly. How users cope today is presumed, not researched | Product owner |
| A-02 | The product owner operates the service alone; there is no support team | Product owner |
| A-03 | One role only: an end user who sees only their own data. No sharing between accounts | Product owner |
| A-04 | CONFIRMED by the product owner on 2026-11-16 ("accept as proposed"), now facts: all success targets S-1 to S-12, the test-set sizes and the "R1" and "R1+90d" dates | Closed |
| A-05 | (A-05 to A-10 CONFIRMED by the product owner on 2026-11-16 with the feature set; now facts.) R1 includes sign-in, sign-out, password reset and account deletion with data deletion | Product owner |
| A-06 | Expense fields are amount, currency, category, date and an optional note; expenses can be edited and deleted | Product owner |
| A-07 | Users want to see where their money went, so R1 includes a filterable list and a monthly per-category summary with one chart, and nothing more analytical | Product owner |
| A-08 | Categories are a fixed built-in bilingual list in R1 | Product owner |
| A-09 | "Other currencies selectable" means choosing a currency per expense and a default per account, with no conversion; totals are per currency | Product owner |
| A-10 | Language is switchable in-app and defaults to the device or browser language. CORRECTED 2026-11-16: voice is offered on Android; on the web only if on-device recognition in the browser proves good enough in the proof of concept, otherwise the web app is manual entry | Product owner |
| A-11 | CONFIRMED by the product owner on 2026-11-16, now a fact: bank/SMS import, shared/family budgets and receipt scanning are out of R1 | Closed |
| A-12 | Budgets, income, recurring expenses, custom categories, export, currency conversion, offline use on Android and notifications out of R1: CONFIRMED by the product owner on 2026-11-16, now facts. Still assumed: monetisation, an admin console, other voice languages, multi-expense utterances and stored recordings are out of R1 | Product owner (remaining items) |
| A-13 | Voice audio is used only to produce the expense fields and is not stored after processing; only the resulting expense is kept (still assumed). CONFIRMED 2026-11-16, now a fact: audio never leaves the device or browser | Product owner (not storing audio) |
| A-14 | Technology and hosting are chosen by the planner in the Design phase, within the cost ceiling, favouring free tiers | Product owner has delegated this; confirmation of the outcome at the Design gate |
| A-15 | Egypt's Law 151/2020 applies to this product (still assumed; legal advice before public launch). CORRECTED 2026-11-16: the Android app is not distributed through Google Play in R1, so Google Play's policies do not apply to R1 | Product owner, with legal advice for the Egyptian law |
| A-16 | "Pounds" spoken with no qualifier means EGP; a spoken expense with no date means today; an utterance the app cannot parse into at least an amount is shown to the user for manual completion and never saved automatically | Product owner |
| A-17 | Early scale is small: up to 500 monthly active users in the first 90 days, which is what the cost ceiling S-10 is sized for | Product owner |
| A-18 | The product is free to use in R1 with no advertising | Product owner |
| A-19 | CONFIRMED by the product owner on 2026-11-16, now facts: Android 8.0 and later; current Chrome, Firefox, Safari and Edge. Still assumed: mobile browsers are included (see docs/02-requirements.md, NFR-026) | Product owner (mobile browsers) |

## Risks

| # | Risk | Likelihood | Impact | Response |
|---|---|---|---|---|
| R-1 | Speech recognition for Egyptian Arabic is not accurate enough to meet S-1 and S-2. Dialect, code-switching between Arabic and English, spoken numbers and background noise are all hard cases | High | High - voice is the product's distinguishing feature | Run a time-boxed proof of concept at the start of Design comparing on-device candidates (cloud speech is excluded, decided 2026-11-16) on a recorded Egyptian Arabic test set before committing to an architecture, on Android and in the browser. If the targets cannot be reached, the accuracy target is lowered through change control (decided 2026-11-16); if the browser is not good enough, voice ships on Android only. The review step (S-8) limits the harm of errors. Manual entry always works |
| R-2 | Voice processing costs break the minimal-cost constraint. Accurate dialect recognition may only be available from paid services charged per minute or per request, growing with usage | Low (was Medium) | High | Largely removed on 2026-11-16: recognition is on-device only, so there is no per-use speech fee, and accuracy gives way before cost (Q-11 closed). Remaining exposure: the size of any speech data users must download |
| R-3 | Egyptian data-protection licensing or cross-border transfer rules impose cost, delay or hosting restrictions that a minimal-budget individual product cannot meet. The grace period reportedly ended about 1 November 2026 | Medium | High - could block public launch in Egypt | Accepted as an open risk by the product owner on 2026-11-16: proceed with building, obtain legal advice before public launch (Q-01). Design for data minimisation: no audio leaves the device, no stored audio, minimal profile data. Keep hosting location flexible and an explicit ADR |
| R-4 | Scope growth: several common expense-tracker features are neither in nor confirmed out | High | Medium | Q-02 and Q-03 are closed (scope confirmed 2026-11-16). Anything added later goes through change control |
| R-5 | Free tiers change, are withdrawn, or pause idle projects, causing outage or unexpected bills | Medium | Medium | In Design, choose services with a documented exit path, set spending caps and billing alerts, and avoid lock-in for stored data |
| R-6 | Online-only Android app frustrates users on poor mobile connections; expenses cannot be logged at the moment of spending, which is the product's core promise | Medium | Medium | Decide Q-05 before Design. If offline is deferred, design the data model so that offline sync can be added without a rewrite |
| R-7 | Financial data and accounts of the general public make the service a target; a breach or cross-account data leak would be severe for a single-operator product | Low | High | Threat model in Design; per-user data isolation tested explicitly; the security standard applies throughout |
| R-8 | NO LONGER APPLIES TO R1 (2026-11-16: direct APK download, no Google Play). Was: Google Play publication is delayed by the closed-testing requirement (12 testers for 14 days) or by Data safety review. Replaced by R-12 | - | - | Revisit only if Google Play is added later |
| R-9 | Arabic quality is poor: mixed-direction text, digits (Western 0-9 or Arabic-Indic), amounts and dates displayed wrongly, or machine-quality translation | Medium | Medium | Arabic is designed and tested as a first-class language from the walking skeleton onward, not translated at the end. A native Egyptian Arabic speaker reviews all text (Q-13) |
| R-10 | Abuse of public sign-up (automated accounts). The voice part of this risk no longer applies: recognition is on-device, so there is no paid speech processing to consume (2026-11-16) | Medium | Low (was Medium) | Rate limits as non-functional requirements; verified sign-up |
| R-11 | CLOSED 2026-11-16: the product owner accepted S-1 to S-12 as proposed. Was: success targets are unconfirmed, so the team may build to the wrong bar | - | - | None |
| R-12 | Added 2026-11-16. Direct APK distribution: users must allow installation from outside an app store and may see system security warnings, which lowers trust and adoption (S-11); there is no store to deliver updates; and Google's reported developer-verification requirement for apps installed outside Google Play may make installation hard or impossible unless the product owner registers as a verified developer (not verified against Google's own page) | Medium | High - could stop ordinary users installing the Android app | Requirements for a download page with install guidance, a signed and verifiable APK and in-app update notices (docs/02-requirements.md, FR-035 to FR-038). Verify Google's rules and timetable in Design; product owner to decide on developer registration (OQ-01 in docs/02-requirements.md). The web app remains available to everyone |

## Open questions

Ordered by importance. "Needed by" is the phase gate the answer blocks.

| # | Question | Owner | Needed by |
|---|---|---|---|
| Q-01 | Does Egypt's Personal Data Protection Law 151/2020 and its Executive Regulations require this product to hold a PDPC licence, and may personal data (including voice audio) be processed or stored outside Egypt? What does that cost? This needs advice from someone qualified in Egyptian law; the planner has only secondary sources | Product owner (with legal adviser) | OPEN. Timing changed 2026-11-16: the product owner chose to treat this as an open risk and build with data minimisation and flexible hosting location; legal advice is required before public launch (Release gate), not before building |
| Q-02 | CLOSED 2026-11-16: the product owner confirmed bank/SMS import, shared or family budgets, and receipt scanning are out of the first release | Product owner | Answered |
| Q-03 | CLOSED 2026-11-16: the product owner confirmed the proposed first-release feature set (Scope items 8 to 17) and the exclusions (budgets, income tracking, recurring expenses, custom categories, export, currency conversion, notifications, offline use on Android) "as proposed" | Product owner | Answered |
| Q-04 | CLOSED 2026-11-16: the product owner accepted the success targets S-1 to S-12 "as proposed" | Product owner | Answered |
| Q-05 | CLOSED 2026-11-16: no. The product owner confirmed offline use on Android is out of the first release as part of the exclusion list. R-6 still applies: design the data model so offline sync can be added later | Product owner | Answered |
| Q-06 | CLOSED 2026-11-16: audio is processed on-device only and must never leave the phone or browser. On the web, on-device recognition is tried in the proof of concept; if it is not good enough, voice ships on Android only and the web app is manual entry. Anonymous usage analytics are allowed: counts and events with no personal or expense content, disclosed in the privacy policy. Whether audio may ever be stored was not asked; it stays assumed that it is not (A-13) | Product owner | Answered |
| Q-07 | CLOSED 2026-11-16: email and password, and Google sign-in. Phone number with SMS code was not selected | Product owner | Answered |
| Q-08 | CLOSED 2026-11-16: direct APK download from the website; no Google Play in the first release. Google Play policies and the closed-test rule do not apply to R1. Follow-up on Google's developer verification for apps installed outside Google Play is OQ-01 in docs/02-requirements.md | Product owner | Answered |
| Q-09 | CLOSED 2026-11-16: worldwide. How far privacy regimes outside Egypt must be addressed was not decided and is carried as OQ-02 in docs/02-requirements.md | Product owner | Answered |
| Q-10 | CLOSED 2026-11-16: users must be 18 or over | Product owner | Answered |
| Q-11 | CLOSED 2026-11-16: lower the accuracy target. Keep on-device processing and near-zero cost and rely on the review step; the target is lowered through change control, not by moving to cloud speech | Product owner | Answered |
| Q-12 | What is the motivation and evidence for the product: personal need, observed demand, a gap in specific competing apps? Is it intended to earn money later? This shapes priorities and S-11 | Product owner | Requirements gate |
| Q-13 | CLOSED IN PART 2026-11-16: the product owner chose to start the voice proof of concept with synthetic and public audio; real speakers are added before release, and accuracy numbers are less trustworthy until then. The proof of concept is the first build task, not a Design activity (see docs/03-architecture.md). STILL OPEN: who reviews the Arabic text, and who supplies the real-speaker Egyptian Arabic recordings (at least 5 speakers) | Product owner | Open part: before the Testing phase (real-speaker test set) and the Release gate (Arabic text review) |
| Q-14 | CLOSED 2026-11-16: yes to all three - mixed Arabic and English speech, relative dates, and piastres (stored as decimals of a pound) | Product owner | Answered |
| Q-15 | CLOSED 2026-11-16: Western digits (0-9) everywhere, including the Arabic interface | Product owner | Answered |
| Q-16 | CLOSED 2026-11-16: a short list - EGP, USD, EUR, SAR, AED, GBP, KWD | Product owner | Answered |

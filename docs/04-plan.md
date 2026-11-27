# Delivery plan: Masareef (مصاريف)

| | |
|---|---|
| Date | 2026-11-16 |
| Version | 0.1 |
| Source | docs/02-requirements.md v0.2 (signed 2026-11-16), docs/03-architecture.md v0.1 (signed 2026-11-16), docs/adr/0001 to 0010. Updated 2026-11-27 by T-013: requirements v0.3 and architecture v0.2, both awaiting re-sign; ADR 0010 amended; ADR 0012 added; ADR 0007 note |
| Status | Draft. Open questions PQ-01 to PQ-04 below change how some tasks are done; none changes scope |

How to read this document:

- **[FACT]** marks something stated by the product owner or fixed in the signed documents. **[VERIFIED]** marks something the planner checked on 2026-11-16 against the named source. **[ASSUMED]** marks something the planner filled in for this plan; each is listed under "Assumptions made in this plan".
- One task is one pull request on a short-lived branch (`feat/T-046-add-expense-form`). If a task turns out to need more than about 400 changed lines, not counting lockfiles, generated files, migrations snapshots, translation files and lexicon data files, the implementer stops and asks for the task to be split in this plan rather than opening an oversized pull request.
- Every dependency in the task table points to a task with a lower ID. There are therefore no cycles, and working through the table in ID order is always a valid order.
- "P-nn" is a product-owner prerequisite from the architecture document. "OQ-nn" is an open question in the requirements. "PQ-nn" is an open question raised by this plan.

## Milestones

| Milestone | Delivers | Ends with this demonstration | Requirements |
|---|---|---|---|
| M0 Repository and voice proof of concept (decision milestone) | Repository with CI, Renovate and dependency audit; the utterance parser; the voice test-set manifests and synthetic audio; PoC measurements P1 to P10 on the reference phone; the web time-box result; ADR 0011 confirming or superseding ADR 0002. Tasks T-001 to T-012 | The product owner reads the PoC report with per-utterance results, sees a sentence spoken into the reference phone become amount, category and date in the harness, and signs the decision in ADR 0011 | FR-025 to FR-030 (parser level), FR-033 (result), NFR-001 to NFR-004 (PoC estimate), NFR-027 (P5), NFR-020 (CI scans) |
| M1 Walking skeleton on staging | One request from the browser and from the Android shell through the Worker to D1 and back, in English and Arabic, built and deployed to `https://staging.<domain>` by the pipeline, with smoke test, rollback workflow, end-to-end and accessibility harness, and the authentication foundation with password-hashing cost measured. Tasks T-013 to T-022 | Open staging in both languages (Arabic right-to-left); install the staging debug APK from the CI artefact and see the same page; merge a change and watch it deploy; run the rollback workflow | FR-020, FR-021, NFR-009, NFR-014, NFR-020, NFR-023, NFR-026, NFR-028 (foundations) |
| M2 Accounts and data isolation | Sign-up, email verification, sign-in, Google sign-in, sign-out, password reset, session expiry, settings, account deletion, rate limits and lockout, cross-account test suite, draft policy pages. Tasks T-023 to T-041 | On staging, on web and Android: sign up with a real mailbox, verify, sign in, sign in with Google, reset the password, delete the account; the cross-account suite report shows 100% of routes covered | FR-001 to FR-009, FR-019, FR-039 (pages), NFR-016 to NFR-019, NFR-024 |
| M3 Expenses, summary and sync | Manual entry, edit, delete, list with filters, monthly summary with chart, currencies, number and date formats, sync between web and Android, offline behaviour. The product is usable without voice. Tasks T-042 to T-055 | Add an expense on the phone and watch it appear in the browser within 10 seconds; the NFR-006 and NFR-007 automated reports from staging | FR-010 to FR-018, FR-022, NFR-005 to NFR-007, NFR-013 |
| M4 Voice entry on Android | Speech plugin with the engine and model chosen by ADR 0011, consented model download, microphone permission flow, voice screen, review screen, record again, privacy and offline verification, accuracy and timing run on the product build. Tasks T-056 to T-064. **No task here starts before T-012 is done** | On the reference phone in flight mode: speak, review, correct a field, switch the network on, save; the accuracy and timing run output for the synthetic set | FR-023 to FR-032, FR-034, NFR-001 to NFR-004, NFR-008, NFR-021 |
| M5 Android distribution, web voice outcome and measurement | CI-signed APK, download page, update notice, minimum-version gate, the FR-033 web outcome, operator counts, usage events, opt-out. Tasks T-065 to T-073 | Download the staging APK from the staging download page, verify checksum and fingerprint, install it, install the next version over it, see the update notice; run the counts procedure | FR-033, FR-035 to FR-038, FR-040 to FR-042, NFR-022, NFR-027 |
| M6 Operations and release readiness | Alerts, client error reporting, encrypted backups, timed restore and rollback rehearsals, load, performance, accessibility, browser matrix and security scans, production environment (not yet public), Arabic review applied, legal text in place, real-speaker test set received, runbook. Tasks T-074 to T-088 | Production answers its health check and the monitor alerts on an induced outage; restore rehearsal timed under 8 hours; scan and load reports attached; the project is ready for the Testing phase | FR-039 (content), NFR-010 to NFR-015, NFR-020, NFR-023 to NFR-026, NFR-028 |

The template says the first milestone is always a walking skeleton. Here the walking skeleton is M1, and it is the first *delivery* milestone. M0 exists because the product owner decided on 2026-11-16 that the voice proof of concept is the first build work [FACT], and the architecture document names it "milestone M0". M0 produces a decision, not a deployable increment.

### Order of work

1. **T-001 first.** Nothing else starts before the repository and pipeline exist.
2. **Then the PoC track (T-002 to T-012) has first call on the implementer's time.** T-002 to T-007 and T-009 need nothing from the product owner. T-008 needs P-09 and T-010 needs P-10.
3. **M1 runs alongside M0**, not after it: M1 depends only on T-001 and on P-02, P-03 and P-04. Whenever the PoC track is waiting for a prerequisite or for a measurement run, work continues on M1, then M2 and M3. None of M1 to M3 depends on the PoC outcome.
4. **The voice gate.** T-012 (the PoC decision) must be done before any of: every task in M4 (T-056 to T-064), T-068 (web voice outcome), T-072 (usage events, because four of the seven events are voice events) and T-087. "Voice-dependent" in this plan means: depends on which engine and model are adopted, on whether Arabic voice ships, or on whether web voice ships. The utterance parser (T-003 to T-006) is *not* voice-dependent in that sense: it works on typed text, ADR 0003 is not provisional, and the PoC cannot measure P1 to P3 without it, so it is built before the PoC measurement.
5. M5 and M6 follow M3 and M4. T-065 to T-067, T-069 to T-071 and most of M6 do not depend on voice and can be brought forward if M4 is blocked.

## The PoC decision point (T-012)

T-012 is a decision gate owned by the product owner, prepared by the planner from the implementer's measurements. Its outputs are: `docs/adr/0011-...` (status Accepted, either "confirms ADR 0002" or "supersedes ADR 0002"); the PoC result written into the architecture document where FR-033 looks for it; any change requests below; a revised version of this plan if an outcome changes tasks.

**Recording the result edits a signed document.** FR-033 criteria 1 and 3 read the PoC result "recorded in the architecture document". Writing it there makes the design sign-off stale in every outcome, so the design gate is signed again at T-012. This is expected and is not a defect in the documents.

**Needed from the product owner before T-012 can close:** OQ-08 (is there a floor below which Arabic voice does not ship) and OQ-10 (is the web pass criterion RA-30 acceptable). The requirements list both against the Design gate; they were not answered there (architecture D-17).

How this plan behaves for each row of the architecture's outcomes table:

| PoC outcome | Change control at T-012 | Effect on tasks |
|---|---|---|
| A passes P1 to P10 (base model, 56.9 MiB) | ADR 0011 confirms 0002. Design gate re-signed for the recorded result. No requirement changes | M4 as written |
| A fails accuracy, B passes all but P5 (small model, 181.3 MiB) | ADR 0011 confirms 0002 with model B. **CR-02 applied**: NFR-027 limit 150 MB to 250 MB. Requirements and design gates re-signed | M4 as written; T-059 shows the larger size in the consent prompt; T-065 size check uses the new limit |
| A and B fail, C passes and the product owner accepts the Moonshine licence | ADR 0011 supersedes 0002. Stack table changes (sherpa-onnx, two models). Design gate re-signed | Same task IDs. T-057 integrates sherpa-onnx instead of whisper.cpp; T-059 handles one model per language; plugin interface unchanged, so T-056 and T-060 to T-062 are unaffected |
| No candidate reaches P1 to P3 | Best candidate adopted; change request lowers NFR-001 to NFR-003 to the measured values [FACT: standing decision, vision Q-11]. Requirements gate re-signed. If Arabic is below the OQ-08 floor, Arabic voice does not ship: a scope change to FR-023, FR-025 to FR-027 and FR-029 | Above the floor: M4 as written. Below the floor: M4 is re-planned for English-only voice before any M4 task starts; this plan is re-issued |
| Accuracy passes, P4 fails | Tuning (audio context, threads, smaller model) is repeated inside T-010. If still failing: change request on NFR-004, requirements gate re-signed | M4 as written |
| P6 or P9 fails on low-end devices only | Recorded in ADR 0011; no requirement change (FR-031 criterion 3 already covers unsupported devices) | T-057 uses the measured memory and ABI threshold |
| Nothing runs acceptably on the reference phone | Escalation to the product owner: FR-023 is a Must, so this is a scope decision | M4, T-064 and T-087 are suspended. M1 to M3, M5 (except voice events) and M6 continue. No release is possible until the scope decision is made and this plan re-issued |
| Web part: "web voice does not ship" (the planning baseline) | Result recorded in the architecture document | T-068 as written: FR-033 criteria 3 and 4 only. NFR-004 and S-4 are measured on Android only |
| Web part: "web voice ships" | Result recorded; ADR 0011 covers the WebAssembly engine, the isolation headers and the Content-Security-Policy change; design gate re-signed | New tasks T-089 onward are added at T-012 (browser engine behind the same plugin interface, consented model download in the browser, header and policy changes, Google sign-in compatibility, FR-033 criteria 1 and 2 on four engines). T-068 is reduced to criteria 2 and 4. They are not written now because the baseline says they are unlikely to be needed |

## Product-owner prerequisites: what each one blocks

Nothing has been created yet [FACT]. The table is in the order the product owner should act.

| # | Prerequisite | Blocks (first task that cannot be verified without it) | Milestone at risk |
|---|---|---|---|
| P-01 | Dedicated Google account with two-factor authentication | Every other account, so in practice P-02 to P-12 | All |
| PQ-01 | ANSWERED 2026-11-16 by the product owner: public repository on GitHub Free (no fee; source is public; environment secrets and required reviewers are available). Was: decide public or private repository and GitHub plan | Must be decided when P-04 is done; T-013 records it; T-019 and T-065 implement it | M1 |
| P-04 | GitHub account, repository, protected `main`, environments. Also, not listed in the architecture document: push the existing commit, and install the Renovate GitHub App on the repository | **T-001** (the pipeline cannot run and "CI green" cannot be shown without a remote), then everything | M0, M1 |
| P-09 | Azure account (synthetic test audio) and Hugging Face account (models, corpora); read and accept the terms | T-008 | M0 |
| P-10 | Reference phone (RA-20: mid-range, 4 GB, 2021 or later); an Android 8 or 9 device if possible | T-010; later T-064 and T-079; the Testing phase | M0, M4 |
| OQ-08, OQ-10 | Arabic floor; web pass criterion | T-012 | M0, and through it M4 |
| P-03 | Cloudflare account, Workers Paid, payment card, budget alert | T-019 | M1 |
| P-02 | Domain, registered through Cloudflare | T-019 (`staging.<domain>`); later T-024 (email DNS), T-035 (consent screen), T-059 (`dl.<domain>`) | M1 |
| PQ-02 | Confirm the Android application identifier (architecture D-04, proposed `com.masareef.app`) | Preferably before T-021; at the latest before T-065, after which it is permanent | M1, M5 |
| P-06 | Resend account, domain verified (SPF, DKIM, DMARC) | T-024 is built and tested against a fake sender without it; real email on staging, and so the M2 demonstration, needs it | M2 |
| P-05 | Google Cloud project, consent screen, Web client id, Android client id | T-035 (Web client id; needs P-02 and the privacy page from T-023 deployed). T-038 (Android client id; needs the staging key's certificate fingerprint for the staging flavour, and P-08 for production) | M2 |
| P-08 | Android release keystore with two offline copies; `age` key pair for backups. Also needed and not listed in the architecture document: a separate staging keystore | T-065 (release key), T-076 (`age` public key); the staging keystore before T-038 | M2 (staging key), M5, M6 |
| P-11 | Android Developer Console account, identity verification, register the application identifier with the release certificate | No build task. Starts as soon as P-08 exists; must be complete before public release (Release gate). Lead time unknown [architecture ADR 0007] | Release |
| P-07 | HetrixTools account, two monitors | T-084 | M6 |
| P-12 | Public contact address for privacy requests | T-086 | M6 |
| P-13 | Legal advice (Egypt Law 151/2020, other jurisdictions), and who writes the legal text (OQ-06) | T-086; the Release gate | M6, Release |
| P-14 | Native Egyptian Arabic reviewer; at least 5 Egyptian speakers and English speakers for the real voice test set (OQ-03) | T-085 (text and lexicon review), T-087 (recordings); the Testing phase cannot prove NFR-001 to NFR-003 without it | M6, Testing |

**Before T-001 can be closed:** P-01 and P-04 (PQ-01 is answered: public repository on GitHub Free). The implementer can prepare T-001 locally before then, but cannot verify it.

**Before M1 can be completed:** P-01, P-02, P-03, P-04, PQ-01, and the re-sign that T-013 causes. PQ-02 should be answered by then.

**Before M0 can be completed (it runs alongside M1):** P-09, P-10, OQ-08, OQ-10.

## Change control in this plan

"Applied ... awaiting re-sign" below means: written into requirements v0.3 and architecture v0.2 on 2026-11-27 by T-013; the requirements and design gates must be signed again before the change counts as accepted.

| Item | State (first recorded 2026-11-16, updated 2026-11-27) | Handled by |
|---|---|---|
| CR-01 password minimum 15 | Accepted and already in the signed documents [FACT] | T-025 implements 15 as one configuration value. No change-control action |
| Breached-password check fails open (architecture D-07) | Accepted at design sign-off [FACT] | T-025 implements it and tests the outage case. No change-control action |
| CR-03 two short-lived technical records (`rate_limit` and `auth_lockout`; `deletion_ledger`) added to the requirements' Data table | Applied in requirements v0.3 / architecture v0.2 on 2026-11-27, awaiting re-sign (requirements "Data", RA-41; architecture "Data model", `cleanup-expired`) | **T-013**, before T-029 and T-039, which create those tables. NFR-023 says a new stored field needs a requirements change, so those tasks must not merge first |
| CR-04 editorial: the requirements describe the PoC as a Design-phase activity; OQ-08 and OQ-10 name the Design gate; the requirements' status line still says "Draft (awaiting sign-off)"; the architecture's Source line says requirements v0.1 | Applied in requirements v0.3 / architecture v0.2 on 2026-11-27, awaiting re-sign | **T-013**, in the same re-sign |
| CR-05 (new, raised by this plan): GitHub plan and the production approval mechanism, see PQ-01. Decision 2026-11-16: public repository on GitHub Free | Applied in architecture v0.2 on 2026-11-27, awaiting re-sign (stack table, "Secrets", threats T-22 and T-23, "From commit to production", P-04, "Cost model", D-19); new ADR 0012; note added to ADR 0007 (signing-secret location unchanged) | **T-013** |
| CR-07 (new, raised by T-001 on 2026-11-17): typescript-eslint 8.73.0 was published after the stack table was verified; 8.72.2 pulls in minimatch 10.2.6 with a Moderate advisory (GHSA-g3hv-75wg-m249), which makes the osv-scanner step fail. Bump the stack table and the ADR 0010 reason text to 8.73.0 (same TypeScript peer range), then bump `package.json` and the lockfile | Applied in architecture v0.2 on 2026-11-27, awaiting re-sign (stack table; ADR 0010 amendment). The code is already on 8.73.0 per `package-lock.json`. Still to do in code: the `typescript` reason text in `.software-house/deps-allow.json` still names 8.72.2 | **T-013** for the documents; the code bump follows in the T-001 pull request |
| CR-08 (new, from PQ-09, 2026-11-18): FR-025 c7 says "the first amount is used"; the product owner decided that the number next to a currency word wins, as in ADR 0003 step 4, with the amount flagged. Reword c7 to match | Applied in requirements v0.3 on 2026-11-27, awaiting re-sign (FR-025 c7) | **T-013** |
| CR-09 (new, raised by T-014, 2026-11-19): align the architecture stack table and ADR 0010 with what is installed. `@cloudflare/vitest-pool-workers` 0.23.0 is deprecated and pulled in High advisories, so `@cloudflare/vitest-plugin` 1.8.5 replaces it; the plugin accepts Vitest 5, so the reason for holding Vitest at 4.1 no longer stands; add `@vitest/coverage-istanbul` 4.1.12 (no V8 coverage in Workers) and `@cloudflare/workers-types`; hono 4.13.19 and wrangler 4.165.0; npm override of esbuild 0.25.12 under `@esbuild-kit/core-utils` | Applied in architecture v0.2 on 2026-11-27, awaiting re-sign (stack table, "npm overrides"; ADR 0010 amendment: the Vitest hold is withdrawn). Follow-up in code, not a task row: one dependency pull request upgrading Vitest and both coverage packages to 5.x and removing their three `deps-allow.json` entries; until then their reason texts should be updated as ADR 0010's amendment suggests | **T-013** |
| CR-10 (new, raised by T-016, 2026-11-20): record in the architecture: `/config` returns `googleClientId` as `string | null` from an optional, format-checked `GOOGLE_CLIENT_ID`; the typed API client lives in `packages/api-types`; policy versions are a placeholder `0` until T-023; tsx 4.23.15 added for generation; two npm overrides (zod 4.6.7 for `@cloudflare/vitest-plugin`, and TypeScript 6 for openapi-typescript, whose peer range is `^5`); link `apps/api/openapi.json` from "Interfaces" | Applied in architecture v0.2 on 2026-11-27, awaiting re-sign ("Interfaces", `GET /config` row; Components; stack table; "npm overrides"). The placeholder version `0` was not recorded: T-023 replaced it with version 1 from `versions.ts` (CR-13) | **T-013** |
| CR-11 (new, raised by T-017, 2026-11-20): record in the architecture: the Worker serves the web build with `run_worker_first: true` so pages and files carry the NFR-020 headers (every asset request counts as a Worker request); GET and HEAD outside `/api` reach the web build, other methods there get 404; `/api%2F...` counts as an API path; packages added outside the stack table: happy-dom 21.0.4 (jsdom needs Node 22.22+), @testing-library/dom, @types/react and @types/react-dom, @eslint/css; version bumps: react-router 8.5.2, i18next 27.2.2, react-i18next 18.0.3, TanStack Query 5.108.2; TanStack Query retry is off | Applied in architecture v0.2 on 2026-11-27, awaiting re-sign (C5 "Serving the web build"; C1; stack table; "Cost model"; NFR-020 row; "Infrastructure as code") | **T-013** |
| CR-12 (new, raised by T-045, 2026-11-21): record in the architecture: amounts are written number first, then a no-break space, then the label, in both languages; month names live in the interface texts (`date.months`), not a separate table; single-digit days have no leading zero; a lint rule refuses `Intl.NumberFormat`, `Intl.DateTimeFormat` and `toLocale*` in shipped code; calendar date validation is shared in `packages/core/src/calendar.ts` | Applied in architecture v0.2 on 2026-11-27, awaiting re-sign (C1 rules; "Not chosen as libraries") | **T-013** |
| CR-13 (new, raised by T-023, 2026-11-21): record in the architecture: policy documents live as versioned per-language modules in `packages/core/src/policies` (versions are whole-number counters, single source `versions.ts`); the API now depends on `@masareef/core` and takes it from source through a Wrangler alias, which T-019 must repeat in the deployed configuration; the change notice compares versions for equality and records the current versions on a first visit; the release check also blocks drafts and Arabic-Indic digits | Applied in architecture v0.2 on 2026-11-27, awaiting re-sign (C4 "Policy documents"; C5 "Depends on"; C1 change notice; "Infrastructure as code") | **T-013**; T-019 repeats the alias in `infra/wrangler.jsonc` |
| CR-06 (new, raised by this plan): NFR-026 says the full end-to-end suite passes on Safari on iOS; the architecture (D-16) can only offer a manual run of the critical journeys there | Decided by the product owner on 2026-11-27: "WebKit in CI + manual iPhone check", no paid device service. Applied in requirements v0.3 / architecture v0.2 on 2026-11-27, awaiting re-sign (NFR-026, RA-42; architecture NFR-026 row, D-16) | **T-013**; T-080 adds the manual iPhone checklist |
| CR-14 (new, from PQ-11, 2026-11-27): FR-027 accepts "last night" / "امبارح بالليل" (= yesterday) and "a week ago" / "من أسبوع" (= 7 days ago); a bare weekday ("on Friday") stays today, flagged | Decided by the product owner on 2026-11-27 ("Yes, add both"). Requirements applied in v0.3 on 2026-11-27, awaiting re-sign (FR-027 criteria 6 to 8 and Notes). Code not yet changed | **T-013** for the requirement; **T-013a** implements it in the parser, after the re-sign |
| PQ-15 (2026-11-27): FR-021 c1 and c2 state that the first language in the preference list that Masareef offers decides ("first offered language"), the behaviour T-017 built. No change request number: the wording now matches the code, so no task follows | Applied in requirements v0.3 on 2026-11-27, awaiting re-sign (FR-021 Source, c1, c2); architecture v0.2 C1 | **T-013** |
| CR-02 NFR-027 download limit 150 MB to 250 MB | Pending, conditional | **T-012**, only if the PoC adopts the small model |
| PoC result, NDK version and any PoC-driven stack changes into the architecture document | Not yet known | **T-012** |

On 2026-11-27 the scope of T-013 was widened to apply every decided or proposed change request (CR-03 to CR-14, not CR-02) so that one re-sign covers them all.

T-013 and T-012 each make sign-offs stale. If T-012 is ready before T-029 needs T-013, do both in one sitting so the product owner signs once. Otherwise there are two re-signs: one early (T-013) and one at the PoC decision (T-012).

## Open questions raised by this plan

| # | Question | Blocks | Owner |
|---|---|---|---|
| PQ-01 | **ANSWERED 2026-11-16: public repository on GitHub Free.** GitHub plan and repository visibility. The architecture assumes a private repository on GitHub Free with protected `main`, environment secrets, and a required manual approval on the `production` and `release` environments (P-04; Secrets table; "From commit to production" step 4; ADR 0007 decision 2). GitHub's documentation says today: on GitHub Free, environment secrets are available only in public repositories; private repositories need Pro, Team or Enterprise; and required reviewers are available only in public repositories on Free, Pro and Team [VERIFIED 2026-11-16: docs.github.com, Actions, "Deployments and environments"]. Branch protection on a private repository is also believed to need a paid plan; this was not confirmed today and must be checked when the repository is created. So the design as signed cannot be built on a free private repository. Options: (a) a **public** repository on GitHub Free: every feature the architecture uses is available at no cost; the source code, lexicons and test-set text become public (no secret is ever in the repository by rule). (b) a **private** repository on GitHub Pro: adds a recurring fee that counts toward NFR-010 (the cost model has about USD 4 of headroom; the Pro price was not checked today), gives environment secrets and branch protection, but still no required reviewers, so the production approval becomes "the operator starts the production workflow by hand". (c) a private repository on Free: repository-level secrets only, the release key readable by any workflow run, possibly no branch protection. The planner does not recommend (c). | T-001 can start; T-013, T-019, T-065, T-084 need the answer | Product owner |
| PQ-02 | Confirm the Android application identifier (architecture D-04). It is permanent from the first public signed APK | T-021 preferably, T-065 at the latest | Product owner |
| PQ-03 | The staging smoke test must sign in (architecture, "From commit to production" step 3), but sign-up needs a verified email. This plan assumes one fixed smoke-test account per environment, created by a seeding script, whose password is a pipeline secret [ASSUMED]. In production that is a real account that exists only for the smoke test. Is that acceptable? | T-046 (staging), T-084 (production) | Product owner or project lead |
| PQ-04 | Where does test audio live? The synthetic set and the later real-speaker recordings are too large for git and the real recordings are personal data of the speakers. This plan assumes: not in the repository; checksummed in a committed manifest; kept by the product owner and copied to the test machine when needed [ASSUMED]. Real speakers must also consent to this use | T-008, T-087 | Product owner |
| PQ-05 | (raised by T-002, 2026-11-17) **Category codes.** The signed documents name the ten categories but not their stored codes. T-002 chose `food_drink`, `groceries`, `transport`, `bills_utilities`, `housing`, `shopping`, `health`, `entertainment`, `education`, `other`. They become stored and API values in T-042 and are hard to change afterwards | Product owner to confirm before T-042 | Product owner |
| PQ-06 | (raised by T-002, 2026-11-17) **Currency symbols and Arabic separators.** Only EGP has a specified Arabic symbol (ج.م); the other six currencies show their ISO code in both languages. The Arabic decimal separator (٫) and thousands separator (٬) are rejected in amount fields, because FR-022 c4 speaks of digits only | Decide with the Arabic review (T-085); the separator question before T-046 | Product owner |
| PQ-07 | (raised by T-003, 2026-11-17) **Colloquial amounts without a unit word.** "خمسة جنيه وخمسين" (5.50 without the word قرش) is read as two numbers, 5 and 50. Also not supported: "إلا ربع", thirds, "dozen", "five fifty" for 5.50. FR-025 does not require them | Native-speaker review (T-085), or the voice test set in T-007 | Product owner |
| PQ-08 | (raised by T-004, 2026-11-18) **Date expressions the parser flags or misses.** A weekday without "last" ("يوم الجمعة", "on friday") and two disagreeing date expressions give today flagged rather than a guess. Not recognised: filler after من ("من حوالي تلات أيام"), so its number stays an amount candidate; "fifty three days ago" reads as 53 days. "last night" is flagged (no longer correct once T-013a is done: PQ-11 added "last night" and "a week ago" to FR-027 on 2026-11-27). FR-027 does not require the others | Voice test set (T-007) and native-speaker review (T-085) | Product owner |
| PQ-09 | (raised by T-005, 2026-11-18) **Which amount wins when there are two. ANSWERED 2026-11-18 by the product owner: the number next to a currency word wins (ADR 0003 step 4), as T-005 implements; the amount stays flagged. FR-025 c7 wording to be aligned through change control (CR-08, in T-013).** FR-025 c7 says "the first amount is used"; ADR 0003 step 4 says the number next to a currency word wins. T-005 follows the ADR: "50 lunch and 20 pounds taxi" gives 20, with the amount flagged either way. Also: a currency word not next to any number ("عشرين بالدولار") is used but flagged; cents, fils and halalas are not supported; unqualified ريال is SAR although older Egyptian speech uses it for 20 piastres | Product owner to confirm the c7 reading; the rest with the native-speaker review (T-085) | Product owner |
| PQ-10 | (raised by T-006, 2026-11-18) **Category rules the ADR does not cover.** Several categories in one utterance: exact matches win over fuzzy ones; if they disagree, the first said is used and flagged. Fuzzy matching (edit distance 1) also requires the keyword to be five or more letters, so "small" cannot match "mall". Other language: more than half the words in a script other than Arabic or plain a-z Latin flags all four fields. Known misses: "فاتورة الميه" reads ميه as 100 (amount flagged); accented "café" is not matched; fuzzy false matches such as "break" to bread. The keyword lists need the native-speaker review | Voice test set (T-007), native-speaker review (T-085); an ADR note when the PoC decision is recorded (T-012) | Product owner |
| PQ-11 | **ANSWERED 2026-11-27 by the product owner: "Yes, add both".** "Last night" / "امبارح بالليل" means yesterday and "a week ago" / "من أسبوع" means 7 days ago; a bare weekday ("on Friday") stays today, flagged. FR-027 amended in requirements v0.3 (criteria 6 to 8, Notes) as change request CR-14; implemented by T-013a. Was: (raised by T-007a, 2026-11-19) **Extra date expressions.** "last night", "a week ago"/"من أسبوع" and a bare weekday ("on Friday") give today, flagged, as FR-027 and RA-25 require, while the test set expects the date the speaker meant. Supporting them needs a change to FR-027 and a requirements re-sign | Product owner, before T-013 if it is to be included there | Product owner |
| PQ-12 | (raised by T-007a, 2026-11-19) **Category coverage on new sentences.** The typed score is tuned on its own sentences. New sentences miss everyday words (haircut, vet, "filled up the car", mobile data, شحنت الموبايل). Words left out as ambiguous (phone, car, water, subscription) also need a decision: stay Other and flagged, or be given a default category. Thresholds to review: piastres 25/50/75 after other words, the 100-pound flag, "مية ونص" = 100.50 | Native-speaker review (T-085), real-speaker set (P-14) | Product owner |
| PQ-13 | (raised by T-007a, 2026-11-19) **picomatch advisory withdrawn. CLOSED 2026-11-19:** GitHub withdrew GHSA-fc5q-39xc-vjpf on 2026-11-18, and the exception is removed from `audit-exceptions.json` and `osv-scanner.toml` on branch `chore/remove-picomatch-audit-exception`. The audit gate itself stays | Done | Implementer |
| PQ-14 | (raised by T-015, 2026-11-19) **Carry-overs from the API security layers.** T-017/T-020: static assets served directly by Workers Assets bypass this middleware, so pages need the NFR-020 headers another way. T-016: `GET /config` must join `public-routes.ts`. T-022: Better Auth public routes must join that list and be mounted behind these layers; Android needs `Access-Control-Expose-Headers: set-auth-token`. T-027: the web Origin check is still needed for state-changing requests. Choices to record: HEAD follows a public GET; 401 sends `WWW-Authenticate: Bearer`; `Access-Control-Max-Age: 600`; 16 KB is read as 16,384 bytes | Each named task | Implementer, planner |
| PQ-15 | **ANSWERED 2026-11-27 by the product owner: "First offered language".** The first language in the browser's or device's list that Masareef offers decides, as T-017 built; recorded in FR-021 c1 and c2 (requirements v0.3). Was: (raised by T-017, 2026-11-20) **Which browser language decides.** The app takes the first language in the browser list that it offers, so a browser set to French with Arabic second starts in Arabic. FR-021 c2 could be read as "the primary language only", which would give English | Product owner | Product owner |
| PQ-16 | (raised by T-018, 2026-11-21) **Pipeline time and local browsers. Pipeline time CLOSED 2026-11-21: the first full run took 5 minutes, end-to-end suite 2.5 minutes, so no change is needed.** The end-to-end suite (360 tests: 3 engines, 2 widths, English, Arabic and a pseudo-locale) is estimated to add 5 to 8 minutes, likely over the 10-minute target. Options: more workers in CI, the pseudo-locale only at 320 px, fewer placeholder screens, or a separate parallel job. Running Firefox and WebKit locally needs about 519 MiB of Playwright browser builds, not downloaded | Decide after the first CI run; local download only with the product owner approval | Product owner, implementer |
| PQ-17 | (raised by T-013, 2026-11-27) **Safari checks that NFR-026 now relies on.** (a) CR-06 needs a real iPhone with the current iOS for the manual critical-journey check before each release (RA-42). Who supplies it, and is one iPhone enough? (b) Desktop Safari is in NFR-026 too, but the design verifies it only through Playwright's WebKit build in CI, which is not Safari. Is that acceptable, or should the same manual checklist also be run in Safari on a Mac before release? Neither changes R1 scope | T-080; the Testing phase | Product owner |

## Test-first rule for every task

This applies to every task below and is not repeated in each one (standards: testing.md).

- The named tests under "Tests to write first" are written before the code, seen to fail for the right reason, then made to pass. They are the minimum, not the whole set: every acceptance criterion the task claims gets at least one test, plus the empty case, boundaries, invalid input, authorisation failure and the failure of each external dependency the task touches.
- Levels: unit tests for `packages/core` and pure logic; integration tests for the API inside the real Workers runtime with a local D1 database (`@cloudflare/vitest-plugin`, which replaced `@cloudflare/vitest-pool-workers` in T-014, CR-09), not a mocked database; component tests with Testing Library; Playwright end-to-end tests only for the journeys named in a task.
- Mocked: only what the project does not own or cannot run, namely Resend, Google's key endpoint, the Have I Been Pwned range API, the clock and randomness. Each has a failure-mode test (timeout at 3 seconds, error response).
- Coverage: at least 80% line coverage on new code in each pull request, enforced by CI from T-001.
- Every route added to the OpenAPI file gets an entry in the cross-account suite in the same pull request once T-028 exists; CI fails otherwise.
- Every new screen is added to the screen inventory of T-018 in the same pull request, which brings the axe scan and the two-language screenshots with it.
- The pull request description lists, per acceptance criterion, the test that covers it, so the tester can build `docs/traceability.md` without reading the implementation.

## Tasks

Status: `todo`, `doing`, `done`, `blocked`. One task is one pull request. Tasks marked (doc) change documents only and are done by the planner with the product owner.

| ID | Task | Requirements | Depends on | Owner prerequisites | Verified by | Status |
|---|---|---|---|---|---|---|
| **M0** | | | | | | |
| T-001 | Repository, npm workspaces, lint, format, type check, CI pipeline, Renovate, dependency audit, secret scan, static analysis, `deps-allow.json` | NFR-020; enabling work for everything | - | P-01, P-04, PQ-01 | CI green on an empty-change pull request; throwaway branches with a planted fake secret and a known-vulnerable package each fail CI; dependency hook does not flag the six held-back packages | done (merged to `main` 2026-11-17 in AsmaaAlsayed/Masareef#1, merge commit 0c703d6; CI green at 82d9e14. The picomatch advisory GHSA-fc5q-39xc-vjpf is accepted by a time-boxed exception until 2026-12-17. Follow-ups outside this task: Renovate app installation and branch protection on `main`, both product-owner actions) |
| T-002 | `packages/core`: category codes, currency definitions, digit conversion, money conversion | FR-014, FR-015, FR-022 | T-001 | - | Unit tests | done (merged to `main` 2026-11-17 in AsmaaAlsayed/Masareef#2, merge commit c23e100; CI green) |
| T-003 | Parser: normalisation, number grammar, amounts, fractions, piastres | FR-025, NFR-002 | T-002 | - | Unit tests for FR-025 criteria 1 to 5 | done (merged to `main` 2026-11-17 in AsmaaAlsayed/Masareef#3, merge commit 5e9af14; CI green) |
| T-004 | Parser: date expressions | FR-027 | T-003 | - | Unit tests for FR-027 criteria 1 to 6 with injected "today" | done (merged to `main` 2026-11-18 in AsmaaAlsayed/Masareef#4, merge commit 3adac3e; CI green) |
| T-005 | Parser: currency words and amount-to-currency binding | FR-028, FR-025 | T-003 | - | Unit tests for FR-028 criteria 1 to 4, FR-025 criteria 3 and 7 | done (merged to `main` 2026-11-18 in AsmaaAlsayed/Masareef#5, merge commit 687cd90; CI green) |
| T-006 | Parser: category lexicon, mixed speech, `parseUtterance` assembled with attention flags | FR-026, FR-029, FR-030, NFR-008 | T-004, T-005 | - | Unit tests for FR-026 1 to 3, FR-029 1 to 3 and 5, FR-030 1 and 4; import-guard test | done (merged to `main` 2026-11-18 in AsmaaAlsayed/Masareef#6, merge commit 9db4830; CI green) |
| T-007 | Voice test-set manifests (Arabic and English) and parser score on typed transcripts | NFR-001, NFR-002, NFR-003, FR-029 | T-006 | - | Manifest validator passes the NFR-001 mix; typed-transcript score report committed | done (merged to `main` 2026-11-18 in AsmaaAlsayed/Masareef#7, merge commit bb6a103; CI green). Parser-only score on typed transcripts: Arabic all three fields 74.6% (NFR-001 80%), amount 93.7% (NFR-002 90%); English all three fields 64.0% (NFR-003 90%), amount 93.0%. Misses are listed in `poc/voice/reports/typed-transcripts.md`; fixes follow in T-007a |
| T-007a | Parser fixes from the typed-transcript score: missing category keywords (the largest cause), Arabic number forms (ميت, إلا ربع, ألف ونص, مائتي, fused thousands), English "pounds fifty" and "one and a half thousand", a quantity taken as the amount, count times unit price, currency symbols, "last night" and "a week ago". Each fix gets a unit test; the manifests are not edited to fit the parser | FR-025, FR-026, FR-027, FR-028, NFR-001, NFR-002, NFR-003 | T-007 | - | Typed-transcript score re-run and committed; every fixed sentence has a unit test; no manifest sentence changed | done (merged to `main` 2026-11-19 in AsmaaAlsayed/Masareef#8, merge commit b93a242; CI green). Development score, tuned on the same sentences: Arabic all three fields 99.2%, English 96.5%, amount 100% in both. The five remaining misses are dates blocked by FR-027 (see PQ-11), so "last night" and "a week ago" named in this row were not done. A spot check on 30 new sentences outside the test set gave 23/30 all three fields and 30/30 amounts; all seven misses were categories |
| T-008 | Synthetic audio generation and public corpora retrieval for the PoC | NFR-001, NFR-002, NFR-003 | T-007 | P-09, PQ-04 | Generated file count and checksums match the manifest; terms and licences recorded | todo |
| T-009 | PoC harness under `poc/voice`: on-device engine on Android, results file, scoring through the parser | NFR-001 to NFR-004, NFR-021, FR-032 | T-006 | - | Scoring unit tests; harness run on an emulator with candidate A on a 5-utterance sample, network off | todo |
| T-010 | PoC measurement run on the reference phone: candidates and P1 to P10, report | NFR-001 to NFR-004, NFR-021, NFR-027, FR-032 | T-008, T-009 | P-10 | Report with per-utterance results for each candidate, raw result files committed, one command reproduces the scoring | todo |
| T-011 | PoC web part, time-boxed to two working days | FR-033 | T-010 | - | Report section with the measured numbers or the reason the time box ended; result stated as "ships" or "does not ship" | todo |
| T-012 | (doc) PoC decision: ADR 0011, result into the architecture document, change requests, plan revision, re-sign | FR-033, NFR-001 to NFR-004, NFR-027 | T-010, T-011 | OQ-08, OQ-10; product owner decision and sign-off | ADR 0011 Accepted; gates re-signed in `.software-house/state.json`; this plan revised | todo |
| **M1** | | | | | | |
| T-013 | (doc) Change control: CR-03, CR-04, CR-05, CR-06; widened on 2026-11-27 to CR-07 to CR-14 and PQ-15 (not CR-02); re-sign | NFR-023, NFR-026, NFR-020, FR-021, FR-025, FR-027 | - | PQ-01; product owner sign-off | Requirements and architecture updated; both gates re-signed | doing (documents updated 2026-11-27, awaiting re-sign) |
| T-013a | Parser: "last night" and "a week ago" (CR-14) | FR-027, NFR-001, NFR-003 | T-007a, T-013 | Requirements gate re-signed with v0.3 | Unit tests for FR-027 criteria 6 to 8; typed-transcript score re-run and committed with no manifest sentence changed | todo |
| T-014 | API Worker scaffold: Hono, platform adapter, configuration check, request id, structured logger, problem-details errors, health endpoints, D1 with Drizzle | NFR-028, NFR-023, NFR-014 | T-001 | - | Integration tests in the Workers runtime | done (merged to `main` 2026-11-19 in AsmaaAlsayed/Masareef#10, merge commit 959f487; CI green). The Worker bundle build stage is left to T-019 |
| T-015 | Security headers, Content-Security-Policy, CORS, 16 KB body limit, default-deny router | NFR-020, NFR-019, FR-019 | T-014 | - | Integration tests asserting each header, the CORS origin list, 413 at 16 KB plus one byte, 401 on an undeclared route | done (merged to `main` 2026-11-19 in AsmaaAlsayed/Masareef#11, merge commit 2008056; CI green) |
| T-016 | OpenAPI generation, drift check in CI, `packages/api-types`, typed API client, `GET /config` | NFR-016; enabling work for every API task | T-014 | - | CI fails when the committed OpenAPI file differs from the generated one (shown on a throwaway branch) | done (merged to `main` 2026-11-20 in AsmaaAlsayed/Masareef#12, merge commit daf1fb6; CI green). Drift check shown failing locally; in CI it runs as "OpenAPI drift check" after the format check |
| T-017 | Web app scaffold: React, routing, English and Arabic with right-to-left, language default and switch, translation-key and literal-string checks, served by the Worker | FR-020, FR-021, NFR-009 | T-016 | - | Component tests for FR-021 criteria 1, 2, 3, 5; CI key check fails on a missing Arabic key | done (merged to `main` 2026-11-20 in AsmaaAlsayed/Masareef#13, merge commit ca9c1bb; CI green after a Node 26 test-storage fix) |
| T-018 | End-to-end harness: Playwright on three engines, axe scan and two-language screenshots per screen in the inventory | NFR-025, NFR-009, NFR-026, FR-020 | T-017 | - | CI runs the suite on the skeleton page in both languages; a planted contrast fault fails axe on a throwaway branch | done (merged to `main` 2026-11-21 in AsmaaAlsayed/Masareef#14, merge commit 5381ea2; CI green on Chromium, Firefox and WebKit, pipeline 5 minutes). Locally verified on Chromium only (installed Edge, 120 of 120); Firefox and WebKit first run in CI, where the browsers are installed on the runner. Planted contrast and missing-label faults fail the scan |
| T-019 | Infrastructure as code and staging deploy: Wrangler configuration, bootstrap script, deploy on merge, migrations, smoke test | NFR-014, NFR-020, NFR-010 | T-013, T-015, T-017 | P-02, P-03, P-04, PQ-01 | A merge to `main` deploys to `https://staging.<domain>` with no manual step and the smoke test passes | todo |
| T-020 | Rollback workflow and header assertions against staging | NFR-020, NFR-014 | T-019 | - | Rollback rehearsed on staging and timed; header check job green against staging | todo |
| T-021 | Android shell scaffold: Capacitor project, staging flavour, manifest hardening, WebView floor check, CI debug build | NFR-026, FR-020 | T-017, T-019 | PQ-02 | CI artefact installs on an Android 8.0 emulator and the latest emulator and shows the skeleton page from staging in both languages | todo |
| T-022 | Authentication foundation: Better Auth on D1, Argon2id, database sessions, cookie and bearer transport; hashing cost measured on staging | NFR-017, NFR-018, NFR-011 | T-016, T-019 | - | Integration tests; measured CPU milliseconds per hash on staging recorded in the pull request against the 1,000 ms budget | todo |
| **M2** | | | | | | |
| T-023 | Privacy policy and terms pages (draft factual text), versions, change notice, missing-Arabic release check | FR-039, FR-020 | T-017 | - | Component and end-to-end tests for FR-039 criteria 1, 4, 5 | done (2026-11-21, branch `feat/T-023-privacy-terms-pages`). Draft text describes the system as designed; T-086 must re-check every statement against what ships. `npm run release:check-policies` blocks today (draft documents, placeholder contact address) |
| T-024 | Email sending: `EmailSender` interface, Resend implementation, bilingual templates | FR-002, FR-007, FR-020 | T-022 | P-06 for real delivery | Integration tests with a fake sender including timeout; one real email in each language received on staging | todo |
| T-025 | Sign-up API with terms confirmation, password rules and breached-password check | FR-001, FR-003, NFR-017 | T-022, T-024 | - | Integration tests for FR-001 criteria 1 to 4, FR-003 criteria 2 and 4, NFR-017 boundaries | todo |
| T-026 | Email verification and email-and-password sign-in API | FR-002, FR-004 | T-025 | - | Integration tests for FR-002 criteria 1 to 3, FR-004 criteria 1 and 2 | todo |
| T-027 | Sessions: 30-day idle expiry, sign-out, cookie attributes, origin check, bearer transport | FR-006, FR-008, FR-019, NFR-018 | T-026 | - | Integration tests with an injected clock; replay after sign-out refused | todo |
| T-028 | Cross-account test suite and CI check of its coverage against the OpenAPI file | FR-019, NFR-016 | T-016, T-027 | - | CI fails when a route has no suite entry (shown on a throwaway branch); suite green | todo |
| T-029 | Rate-limit middleware: per-IP and per-account limits | NFR-019, FR-001 | T-013, T-027 | - | Integration tests exceeding each limit by one, clock injected across a window | todo |
| T-030 | Sign-in lockout and per-account email limits | NFR-019, FR-002, FR-004, FR-007 | T-029 | - | Integration tests for FR-004 criterion 3, FR-002 criterion 4, FR-007 criterion 5 | todo |
| T-031 | Password reset API | FR-007, NFR-018, NFR-017 | T-024, T-027 | - | Integration tests for FR-007 criteria 1 to 4 and the Google-only account note | todo |
| T-032 | Web screens: sign-up, verify email, sign-in | FR-001, FR-002, FR-003, FR-004, FR-020 | T-018, T-023, T-026 | - | Component tests; end-to-end journey sign-up to first sign-in in both languages | todo |
| T-033 | Web screens: password reset, sign-out | FR-006, FR-007 | T-031, T-032 | - | Component tests; end-to-end reset journey; FR-006 criterion 3 (Back shows no data) | todo |
| T-034 | Google sign-in API: ID-token verification, precheck, terms at creation, account linking | FR-005, FR-003 | T-027 | - | Integration tests with locally signed tokens for FR-005 criteria 1 to 4 and FR-003 criterion 3 | todo |
| T-035 | Google sign-in on the web | FR-005, FR-003 | T-032, T-034 | P-05 (Web client id), P-02 | Component tests with a stubbed Google script; manual sign-in with a real Google account on staging recorded | todo |
| T-036 | `GET` and `PATCH /me`, Settings screen: language and default currency | FR-021, FR-015, FR-039 | T-027, T-032 | - | Integration and component tests for FR-021 criterion 4, FR-015 criterion 2 | todo |
| T-037 | Android authentication: bearer token in Keystore-backed storage, sign-out clears the device | FR-004, FR-006, FR-008 | T-021, T-033 | - | Unit tests of the storage adapter; emulator check of FR-006 criterion 4 | todo |
| T-038 | Google sign-in on Android | FR-005 | T-034, T-037 | P-05 (Android client id), staging keystore | Emulator with Google services: FR-005 criteria 1 to 4; emulator without: button hidden, email sign-in works | todo |
| T-039 | Delete account API with fresh re-authentication and deletion ledger | FR-009, NFR-024 | T-013, T-031, T-034 | - | Integration tests for FR-009 criteria 1, 3, 4 (live database), 5 | todo |
| T-040 | Delete account in Settings (web and Android) and the public account-deletion page | FR-009 | T-035, T-036, T-039 | - | Component tests; end-to-end deletion journey; FR-009 criteria 2, 5, 6 | todo |
| T-041 | Scheduled clean-up jobs | FR-002, NFR-024, NFR-018 | T-030, T-039 | - | Integration tests with an injected clock for FR-002 criterion 5 and each expiry rule | todo |
| **M3** | | | | | | |
| T-042 | Expense table, repository, create (idempotent) and read API, change counter | FR-010, FR-014, FR-015, FR-017, FR-019, NFR-007 | T-002, T-028 | - | Integration tests for FR-010 criteria 2 to 6 and 9, FR-014 criterion 4, FR-015 criteria 4 and 5, repeated create | todo |
| T-043 | Expense update and delete API | FR-011, FR-012, FR-019 | T-042 | - | Integration tests for FR-011 criteria 1 to 4, FR-012 criteria 1 and 3 | todo |
| T-044 | Expense list API: date range, categories, keyset paging, totals per currency | FR-013, NFR-013 | T-042 | - | Integration tests for FR-013 criteria 1 to 3 and 5 to 7 | todo |
| T-045 | Amount and date formatters, direction-safe rendering helpers | FR-022, FR-015, FR-020 | T-002 | - | Unit tests for FR-022 criteria 1 to 3 | done (merged to `main` 2026-11-21 in AsmaaAlsayed/Masareef#15, merge commit 08507d2; CI green) |
| T-046 | Add-expense form | FR-010, FR-014, FR-015, FR-022, NFR-005 | T-036, T-042, T-045 | PQ-03 | Component tests for FR-010 criteria 1 to 8; end-to-end add journey; staging smoke test extended to sign in, create and read | todo |
| T-047 | Expense list screen with filters, paging, totals and empty states | FR-013, FR-020, FR-022, FR-004 | T-044, T-046 | - | Component tests for FR-013 criteria 1 to 7; FR-020 criterion 3; FR-022 criterion 5 | todo |
| T-048 | Edit and delete an expense in the app | FR-011, FR-012 | T-043, T-047 | - | Component tests for FR-011 criteria 1 to 3 and 5, FR-012 criteria 1 to 4 | todo |
| T-049 | Monthly summary API | FR-016, FR-015 | T-042 | - | Integration tests for FR-016 criteria 2, 3, 4, 7 | todo |
| T-050 | Monthly summary screen with accessible chart | FR-016, NFR-025 | T-047, T-049 | - | Component tests for FR-016 criteria 1 to 7; axe scan | todo |
| T-051 | Sync: `GET /sync` and the 5-second change poll | FR-017, NFR-006 | T-048, T-050 | - | Integration test of the counter; two-context end-to-end test for FR-017 criteria 1, 2, 5 | todo |
| T-052 | Save reliability: client-generated id, bounded retry, honest save state | FR-017, NFR-007 | T-046 | - | Component tests with injected network failure for FR-017 criteria 3 and 4 | todo |
| T-053 | Offline behaviour on web and Android | FR-018 | T-021, T-046 | - | Component tests for FR-018 criteria 1 to 4; emulator check in flight mode | todo |
| T-054 | Re-authentication dialog that keeps an open form | FR-008 | T-033, T-046 | - | Component and end-to-end test for FR-008 criterion 3 | todo |
| T-055 | Automated sync latency and save-reliability tests against staging | NFR-006, NFR-007, FR-017 | T-037, T-051, T-052 | - | Run output: at least 100 samples each direction; 1,000 saves with at least 200 cut connections; results stored as CI artefacts | todo |
| **M4** | **all blocked until T-012** | | | | | |
| T-056 | Voice review screen: parsed fields, attention marks, single Save path | FR-024, FR-025, FR-026, FR-030, NFR-008 | T-006, T-012, T-046 | - | Component tests for FR-024 criteria 1 to 6; end-to-end assertion of zero `POST /expenses` before Save | todo |
| T-057 | Speech plugin: interface, adopted engine built with the pinned NDK, availability check | FR-031, FR-023 | T-012, T-021 | - | Plugin unit and instrumented tests; CI builds the native library for both release ABIs | todo |
| T-058 | Speech plugin: recording, end-of-speech rules, recognition, silence gate, cancel, microphone loss | FR-023, FR-030, FR-032 | T-057 | - | Instrumented tests with injected audio for FR-023 criteria 2 to 4 and 6, FR-030 criteria 2 and 3 | todo |
| T-059 | Speech model manifest and consented, checksummed download | FR-031, NFR-027 | T-019, T-057 | P-02 (`dl.<domain>`) | Instrumented tests for FR-031 criterion 4 including failed and corrupted downloads | todo |
| T-060 | Voice entry screen: microphone control, listening state, stop, cancel, language switch, nothing-heard handling | FR-023, FR-030 | T-056, T-058 | - | Component tests against a fake plugin for FR-023 criteria 1, 3, 4, 5; FR-030 criteria 2, 3 | todo |
| T-061 | Microphone permission explanation, denial and revocation handling, unavailable-device state, download consent prompt | FR-031 | T-059, T-060 | - | Component tests for FR-031 criteria 1 to 5; emulator check of denial and revocation | todo |
| T-062 | Record again from the review screen | FR-034 | T-060 | - | Component tests for FR-034 criteria 1 and 2 | todo |
| T-063 | Voice privacy and offline verification on Android | FR-032, NFR-021 | T-061 | - | Scripted run: 20 entries in flight mode, storage inspection, proxy capture, server marker scan; all pass | todo |
| T-064 | Accuracy and timing run of the test set through the staging build | NFR-001 to NFR-004 | T-061 | P-10 | Per-utterance results and timings for the synthetic set on the reference phone, stored as artefacts | todo |
| **M5** | | | | | | |
| T-065 | Android signing and release pipeline: flavours, CI signing, verification, checksum, publication | FR-036, NFR-027, NFR-020 | T-013, T-019, T-021 | P-08, PQ-01, PQ-02 | A staging release produced end to end by the pipeline; verification step output; tampered-fingerprint run fails | todo |
| T-066 | Update-in-place and wrong-key tests | FR-036 | T-037, T-065 | - | Emulator script: FR-036 criteria 3 and 4 | todo |
| T-067 | Download page with install guidance | FR-035, FR-039, FR-020 | T-023, T-065 | - | Component tests for FR-035 criteria 1, 2, 4, 5; manual install on Android 8.0 and latest emulators (criterion 3) | todo |
| T-068 | Web voice outcome (baseline: no web voice, pointer to the Android app) | FR-033, NFR-021 | T-012, T-046, T-067 | - | End-to-end tests for FR-033 criteria 3 and 4 on three engines | todo |
| T-069 | Version endpoint and update notice | FR-037 | T-065 | - | Integration and component tests for FR-037 criteria 1 to 5 | todo |
| T-070 | Minimum supported version gate | FR-038 | T-069 | - | Integration and component tests for FR-038 criteria 1 to 3 | todo |
| T-071 | Operator counts for S-11 and S-12 | FR-040 | T-042 | - | Integration test with the FR-040 criterion 3 data set: 2 active accounts, 40% voice, counts only | todo |
| T-072 | Anonymous usage events | FR-041, NFR-022 | T-029, T-046, T-060 | - | Integration tests of the counter; end-to-end capture of every event checked against the schema | todo |
| T-073 | Opt out of usage events | FR-042 | T-036, T-072 | - | Component tests for FR-042 criteria 1 to 3 | todo |
| **M6** | | | | | | |
| T-074 | Client error reporting and error screens with the correlation id | NFR-028 | T-029, T-032 | - | Integration and component tests; induced error on staging shows an id found in the log | todo |
| T-075 | `ops-watch` job and operator alerts | NFR-028, NFR-011, NFR-014 | T-019, T-024 | P-03 (analytics token), P-06 | Unit tests of threshold logic; induced 5xx burst on staging produces an alert email | todo |
| T-076 | Nightly encrypted backup, 30-day lifecycle, failure notification | NFR-015, NFR-024 | T-019, T-042 | P-08 (`age` key pair) | A scheduled run on staging produces a decryptable dump; lifecycle rule shown | todo |
| T-077 | Restore procedure with deletion-ledger step; rehearsal of both mechanisms on staging | NFR-015, NFR-024, FR-009 | T-039, T-076 | Operator present (holds the private key) | Timed rehearsal recorded; deleted test account absent after restore | todo |
| T-078 | Load test: seed generator, k6 scripts, run on staging | NFR-011, NFR-013 | T-030, T-044, T-049 | - | k6 summary for the NFR-011 profile; first-page timing of the 10,000-expense account; idle-first-request check | todo |
| T-079 | Web performance budget, Lighthouse CI, timing scripts for entry and cold start | NFR-012, NFR-005 | T-047 | P-10 (cold-start timing) | Lighthouse CI green on both screens; bundle budget enforced; timing results recorded | todo |
| T-080 | Browser and device matrix job | NFR-026 | T-018, T-021, T-050 | - | Suite green on Chromium, Firefox, WebKit, Edge, Android 8.0 emulator, latest Android emulator; the manual iPhone checklist of RA-42 written into the test plan, ready for the Testing phase (CR-06) | todo |
| T-081 | Accessibility completion pass | NFR-025 | T-040, T-050, T-061, T-067 | - | axe: 0 violations on every inventory screen in both languages; keyboard, zoom and reflow checklist complete; Accessibility Scanner findings fixed | todo |
| T-082 | Dynamic scan of staging and release-time secret scans of bundle and APK | NFR-020, FR-036 | T-020, T-065 | - | ZAP baseline report with 0 High or Critical; scan step fails on a planted secret (throwaway branch) | todo |
| T-083 | Log and analytics privacy scans | NFR-023, NFR-022 | T-072 | - | Seeded-marker scan of logs from the end-to-end run finds 0 markers; a planted marker is caught | todo |
| T-084 | Production environment, production deploy with approval, uptime monitors, cost alert | NFR-010, NFR-014, NFR-020, NFR-028 | T-013, T-020, T-076 | P-07, P-03, PQ-01, PQ-03 | Production health and smoke test pass; induced staging outage alerts within 15 minutes; budget alert shown | todo |
| T-085 | Apply the native-speaker review to interface text, category names and parser lexicons | FR-014, FR-020, FR-026, NFR-009 | T-081 | P-14 | Reviewer's list closed item by item; parser tests still green; typed-transcript score re-run | todo |
| T-086 | Final privacy policy and terms text, contact address, hosting facts | FR-039 | T-023 | P-12, P-13 (OQ-06) | FR-039 criterion 3 checklist; both languages present; versions raised and change notice seen | todo |
| T-087 | Real-speaker voice test set received, validated and scored | NFR-001, NFR-002, NFR-003, FR-029 | T-064 | P-14, PQ-04 | Manifest validator passes (at least 100 Arabic utterances from at least 5 speakers, the NFR-001 mix; at least 100 English); first scored run recorded | todo |
| T-088 | Runbook | FR-040, NFR-015, NFR-028 | T-065, T-071, T-077, T-084 | - | Each procedure executed once on staging by following the text exactly | todo |

## Task detail

"Acceptance" lists the acceptance criteria of the linked requirements that the task satisfies ("c" means criterion). A criterion split between an API task and a screen task is listed in both.

### M0 Repository and voice proof of concept

### T-001 Repository, CI pipeline, Renovate, dependency audit
- **Goal:** the repository has a remote, a protected `main`, and a pipeline that every later pull request must pass. Starting point [FACT]: one commit on `main` holding only `docs/` and `.software-house/state.json`, no remote. The existing commit is pushed as it is; T-001 itself arrives as the first pull request.
- **Contents:** root `package.json` with npm workspaces (`apps/*`, `packages/*`); `.nvmrc` pinning Node 26.13.1 (the development machine has 22.14.0 and must be upgraded); TypeScript 6.0.3 strict; ESLint 10.15.0 with typescript-eslint 8.72.2; Prettier 3.10.1; Vitest 4.1.12 with coverage; `.gitignore` (dependency folders, build output, `.env`, `.dev.vars`, audio files); `.editorconfig`; pull-request template (what, why, how verified, risk, tests per criterion). GitHub Actions workflow with the stages in the order of the delivery standard: install with `npm ci`, lint and format check, type check, unit tests with coverage (80% on new code), build, integration tests, security (gitleaks v8.30.1, Semgrep 1.185.0, `npm audit --audit-level=high`, osv-scanner v2.7.1), upload artefacts tagged with the commit SHA; actions pinned by version. `renovate.json` copied from the plugin template `templates/renovate.json` without weakening it. `.software-house/deps-allow.json` with exactly the six entries of ADR 0010 (typescript, vitest, @vitest/coverage-v8, com.android.tools.build:gradle, gradle, org.jetbrains.kotlin:kotlin-gradle-plugin), each with its ADR 0010 reason.
- **Acceptance:** NFR-020 (secret scanning, static analysis and dependency audit exist and fail the build on High or Critical). Standards: dependencies rules 5 to 8, delivery "CI pipeline".
- **Tests to write first:** one trivial unit test in a placeholder workspace so the test and coverage stages have something to run and are seen to fail when it is broken. Pipeline checks shown on throwaway branches that are not merged: a planted fake credential fails gitleaks; a dependency with a known High advisory fails the audit job; a lint error and a type error each fail their stage.
- **Touches:** repository root, `.github/workflows/`, `renovate.json`, `.software-house/deps-allow.json`.
- **Notes:** needs P-04 to be verified. The product owner installs the Renovate GitHub App on the repository; "Renovate enabled" is verified by its onboarding or first dependency pull request. Branch protection (green CI and one review, no direct pushes) depends on PQ-01. Pipeline target is under 10 minutes; record the measured time in the pull request. ADR 0010; architecture "Pull-request pipeline".

### T-002 Core lists and conversions
- **Goal:** `packages/core` exports the ten category codes with English and Arabic names in the required order, the seven currency definitions with decimal places and display symbols, Arabic-Indic and Eastern Arabic to Western digit conversion, and conversion between decimal strings and integer minor units.
- **Acceptance:** FR-014 c1, c2 (data); FR-015 c3 (list), c4 (KWD three decimals, others two); FR-022 c4 (conversion function).
- **Tests to write first:** `categories_are_exactly_ten_in_order_en_and_ar`; `currencies_are_exactly_seven`; `to_minor_EGP_50_is_5000`; `to_minor_KWD_1.250_is_1250`; `to_minor_rejects_10.555_EGP`; `to_minor_rejects_zero_negative_and_non_numeric`; `to_minor_rejects_above_9999999.99`; `digits_٥٠_becomes_50`; `from_minor_round_trips`.
- **Touches:** `packages/core`.
- **Notes:** amounts are integers in minor units everywhere; no floating point (architecture, Data model design notes). The Arabic category names are the draft in FR-014 and are reviewed in T-085.

### T-003 Parser: normalisation, numbers and amounts
- **Goal:** text normalisation (ADR 0003 step 1) and the number grammar (step 2) for Egyptian and Standard Arabic number words, English number words, digits in either script, halves, quarters and piastres.
- **Acceptance:** FR-025 c1, c2, c4, c5, and the piastre arithmetic of c3.
- **Tests to write first:** one test per example sentence in FR-025 c1, c2, c3, c4, c5, each in Arabic and in English, plus `attached_prefix_بخمسين_is_50`, `spelling_variants_اتنين_and_اثنين_are_2`, `no_number_returns_none`, `number_above_limit_is_returned_unclamped` (validation is the form's job, FR-025 c8).
- **Touches:** `packages/core/parser`.
- **Notes:** pure functions, no I/O. ADR 0003.

### T-004 Parser: date expressions
- **Goal:** the FR-027 expressions in both languages evaluated against an injected "today"; a number consumed by a date expression cannot become the amount.
- **Acceptance:** FR-027 c1 to c6.
- **Tests to write first:** the examples of FR-027 c2, c3, c4 with today fixed at 2026-11-16; `yesterday_on_first_of_month`; `yesterday_on_first_of_year`; `N_days_ago_for_1_and_30`; `31_days_ago_is_unsupported_and_flagged`; `tomorrow_is_today_and_flagged`; `no_date_is_today_unflagged`; `من_تلات_أيام_number_not_used_as_amount`.
- **Touches:** `packages/core/parser`.

### T-005 Parser: currency words and amount binding
- **Goal:** the currency lexicon of FR-028 and the rule that the number next to a currency word is the amount; piastres imply EGP.
- **Acceptance:** FR-028 c1 to c4; FR-025 c3 (currency EGP), c7 (two amounts: first used, flagged).
- **Tests to write first:** one test per currency pair in FR-028 c3; `pounds_unqualified_is_EGP`; `pounds_sterling_is_GBP`; `no_currency_word_uses_default`; `yen_uses_default_and_flags`; `two_amounts_uses_first_and_flags`; `piastres_only_is_EGP_0.75`.
- **Touches:** `packages/core/parser`.
- **Notes:** FR-028 is a Should, but the amount rule depends on currency words, so it is built here.

### T-006 Parser: categories, mixed speech, assembled result
- **Goal:** the category keyword lexicon in both languages including English keywords in Arabic transliteration, and `parseUtterance(text, { language, defaultCurrency, today })` returning fields and per-field attention flags as specified in the architecture (C4).
- **Acceptance:** FR-026 c1 to c3; FR-029 c1 to c3, c5; FR-030 c1 and c4 (parser output); NFR-008 (the parser cannot reach the API client).
- **Tests to write first:** every example in FR-026 c1 to c3 and FR-029 c1 to c3; `amount_only_gives_Other_flagged_and_today`; `nothing_extractable_flags_all_three`; `other_language_text_flags_all` ; `fuzzy_match_only_for_tokens_of_five_or_more_letters`; `parser_module_does_not_import_api_client_or_storage` (static import check).
- **Touches:** `packages/core/parser`, lexicon data files.
- **Notes:** lexicons are data files so the native-speaker review (T-085) changes data, not code.

### T-007 Voice test-set manifests and typed-transcript score
- **Goal:** two manifest files under `poc/voice`: at least 100 scripted Egyptian Arabic expense sentences with at least 20 containing English words, at least 10 with piastres or fractions and at least 15 with relative dates, and at least 100 English sentences, each with expected amount, category and date. A validator script, and a scoring script that runs the typed sentences through the parser and reports all-fields and amount accuracy.
- **Acceptance:** the test-set composition in NFR-001; FR-029 c4. Parser-only accuracy reported separately from end-to-end accuracy (ADR 0003, Consequences).
- **Tests to write first:** validator tests: `rejects_fewer_than_100`, `rejects_fewer_than_20_mixed`, `rejects_missing_expected_field`, `accepts_valid_manifest`; scoring tests on a three-sentence fixture with one known miss.
- **Touches:** `poc/voice`.
- **Notes:** sentences are written by the team and are drafts until the native-speaker review (P-14). Relative dates are scored against a fixed "today" stored in the manifest. Sentences the parser fails on typed text are fixed in the parser, with a new unit test, before audio is measured.

### T-008 Synthetic audio and public corpora
- **Goal:** a script that generates audio for every manifest sentence with at least two Egyptian Arabic voices (`ar-EG-SalmaNeural`, `ar-EG-ShakirNeural`) and English voices, at varied speed and with added background noise, and retrieves the FLEURS `ar_eg` and MASC samples used for word-error-rate checks. A committed checksum list ties audio files to manifest entries.
- **Acceptance:** architecture "Test data" table.
- **Tests to write first:** unit tests of the generation plan (every sentence times voice times condition is scheduled exactly once) and of the checksum verifier (missing file, wrong checksum), with the speech service mocked.
- **Touches:** `poc/voice/tools`.
- **Notes:** needs P-09. Before generating, read and record the Azure terms for using generated audio as test data and the free allowance (architecture: not yet read). Record the licence of each corpus as downloaded and whether MASC has a usable Egyptian label [ASSUMED in the architecture]. Audio is not committed (PQ-04). Any tool or library used here is looked up at its latest stable version on the day and listed in ADR 0011; PoC tooling is not part of the product.

### T-009 PoC harness
- **Goal:** under `poc/voice`, an Android harness that loads a model with whisper.cpp v1.9.5 built with the NDK, feeds it audio files as 16 kHz mono PCM, and writes per-utterance transcript, recognition time and peak memory to a results file; and a scoring script that passes transcripts through `parseUtterance` and computes P1 to P4.
- **Acceptance:** produces the inputs for PoC measures P1 to P4, P6, P7, P8.
- **Tests to write first:** scoring unit tests (`all_fields_correct_counts_once`, `amount_only_correct_counts_for_P2_not_P1`, `median_and_p90_timing`); a known-answer instrumented test: one short English clip yields a transcript containing the expected number word.
- **Touches:** `poc/voice`.
- **Notes:** the NDK version is looked up on the day (latest stable supported by Android Gradle Plugin 8.13.0), pinned, and reported for ADR 0011; the architecture's stack table does not name one. The harness is measurement code, not product code: it is not shipped and M4 does not reuse it by copy. If the native glue cannot meet the 80% coverage floor, the exception is recorded in ADR 0011 as the standards require. Verified on an emulator, with the network off, before the reference phone is needed.

### T-010 PoC measurement run
- **Goal:** `poc/voice/REPORT.md` with, for each candidate in the architecture's order (A base; B small, stock and the named Egyptian fine-tunes; C only if A and B fail accuracy; D as a recorded data point), the measures P1 to P10 on the reference phone, per-utterance results, and parser-only accuracy beside end-to-end accuracy.
- **Acceptance:** PoC measures P1 to P10 with the pass lines in the architecture, including the "pass with confidence" lines.
- **Tests to write first:** none new for code; the report generator's totals are covered by T-009's scoring tests. The run is reproducible: one documented command regenerates the report tables from the committed raw result files.
- **Touches:** `poc/voice` (results, report).
- **Notes:** needs P-10 and T-008's audio. P7: 20 entries in flight mode. P8: proxy capture during recognition. P9: Android 8.0 emulator, plus the oldest real device if one was supplied. P10: licence and training-data provenance per model. State plainly in the report that the audio is synthetic and the numbers are an upper estimate (architecture D-03). If P4 fails, retune and re-measure inside this task before reporting.

### T-011 PoC web part
- **Goal:** the adopted model built with whisper.cpp's WebAssembly target and run on the same test set in desktop Chrome, measured against the web pass conditions in the architecture; or a recorded stop when two working days are used up.
- **Acceptance:** FR-033 (produces the PoC result that selects between c1 to c2 and c3).
- **Tests to write first:** reuses T-009's scoring; no product tests.
- **Touches:** `poc/voice/web`.
- **Notes:** time-boxed to two working days after the Android result. Anything short of every pass condition records "web voice does not ship". Must include whether Google sign-in still works under the isolation headers.

### T-012 (doc) PoC decision
- **Goal:** the decision described under "The PoC decision point" is made and recorded.
- **Acceptance:** ADR 0011 Accepted, naming engine, model, size, licence, measured P1 to P10, the device capability threshold, the NDK version and any coverage exception; PoC result for FR-033 written into the architecture document; change requests applied as the outcome requires; gates re-signed; this plan revised.
- **Tests to write first:** not applicable (documents).
- **Touches:** `docs/adr/0011-*.md`, `docs/03-architecture.md`, possibly `docs/02-requirements.md`, `docs/04-plan.md`.
- **Notes:** owner: planner drafts, product owner decides. Needs OQ-08 and OQ-10 answered first. No M4 task, nor T-068 or T-072, starts before this is done.

### M1 Walking skeleton on staging

### T-013 (doc) Change control: CR-03, CR-04, CR-05, CR-06
- **Goal:** the signed documents match what will be built before the affected code is written.
- **Acceptance:** requirements Data table lists the rate-limit and lockout counters and the deletion ledger with purpose and retention (CR-03); PoC wording, gate names for OQ-08 and OQ-10, status line and version reference corrected (CR-04); architecture Secrets table, deployment steps, P-04 and cost model reflect the PQ-01 decision (CR-05); NFR-026's verification for Safari on iOS settled (CR-06); both gates re-signed.
- **Tests to write first:** not applicable (documents).
- **Touches:** `docs/02-requirements.md`, `docs/03-architecture.md`, ADR 0007 if the signing-secret location changes.
- **Notes:** blocks T-019, T-029, T-039, T-065, T-084, and T-013a.
- **Progress 2026-11-27:** scope widened to every decided or proposed change request except CR-02, so one re-sign covers them: CR-03 to CR-14 and the PQ-15 wording. Written into requirements v0.3 and architecture v0.2; ADR 0010 amended; ADR 0012 added (public repository; 0011 stays reserved for T-012); a dated note added to ADR 0007 (the signing-secret location did not change). Remaining for "done": the product owner re-signs both gates. Code follow-ups outside this task: `.software-house/deps-allow.json` reason texts (ADR 0010 amendment) and the Vitest 5 upgrade.

### T-013a Parser: "last night" and "a week ago" (CR-14)
- **Goal:** the parser implements FR-027 as amended in requirements v0.3: "امبارح بالليل" / "last night" give yesterday, and "من أسبوع" / "a week ago" give 7 days before today, both without the attention mark; a weekday named without "last" / "اللي فات" ("on Friday", "يوم الجمعة") still gives today with the date marked.
- **Acceptance:** FR-027 c6 (bare weekday stays flagged), c7, c8; c1 to c5 unchanged and still green.
- **Tests to write first:** in `packages/core/src/parser/dates.test.ts`, with an injected "today": `last_night_is_yesterday_in_both_languages` (16 Nov 2026 gives 15 Nov 2026, not flagged); `last_night_on_new_year_is_last_day_of_previous_year` (1 Jan 2027 gives 31 Dec 2026); `a_week_ago_is_seven_days_before_today_in_both_languages` (16 Nov 2026 gives 9 Nov 2026, not flagged); `a_week_ago_crosses_february` (3 Mar 2027 gives 24 Feb 2027); `bare_weekday_stays_today_and_flagged` ("on Friday", "يوم الجمعة"); `two_weeks_ago_stays_today_and_flagged`; and through `parseUtterance`, `new_date_words_leave_amount_and_category_unchanged` (for example "spent 50 pounds on lunch last night" still gives 50.00 and Food and drink, with yesterday's date).
- **Touches:** `packages/core/src/parser` (dates and lexicon), `poc/voice/reports/` (typed-transcript score re-run).
- **Verified by:** unit tests; `npm run voice:score` re-run and the report committed; no manifest sentence edited to fit the parser. Sentences in the test set whose expected date is a bare weekday stay counted as misses, because FR-027 keeps them flagged.
- **Notes:** must not merge before the requirements gate is re-signed with v0.3 (T-013). Not voice-dependent in the sense of the voice gate (the parser works on typed text, as T-003 to T-007a). Task id: "T-013a" follows the T-007a precedent for a follow-up task. It is not numbered T-089, because T-089 onward are reserved for web voice at T-012, and the "a" suffix keeps the rule that every dependency points to a lower id (T-007a and T-013 both come before T-013a).

### T-014 API Worker scaffold
- **Goal:** `apps/api` is a Hono application on the Workers runtime with `routes/`, `services/`, `repositories/` and one `platform.ts` adapter; configuration validated on each start with a clear error naming a missing variable; a request id generated per request and returned as `X-Request-Id`; a JSON logger that accepts only an allow-list of fields; RFC 9457 problem-details errors with a stable `code` and the request id; a catch-all error handler; `GET /api/v1/health/live` and `/health/ready` (a `SELECT 1` on D1 within 2 seconds); Drizzle with the migrations folder; `.dev.vars.example`.
- **Acceptance:** NFR-028 (correlation id on every error, no personal data); NFR-023 (logger allow-list); delivery standard items 2, 11, 12.
- **Tests to write first:** `live_returns_200`; `ready_returns_200_with_database`; `ready_returns_503_when_database_fails`; `missing_required_variable_fails_with_named_error`; `every_response_has_request_id`; `unhandled_error_returns_problem_json_without_stack`; `logger_drops_fields_not_on_allow_list`; `api_responses_are_no_store`.
- **Touches:** `apps/api`.
- **Notes:** architecture C5 and "Observability". Platform specifics only in `platform.ts` (ADR 0004 exit path).

### T-015 Security headers, CORS, body limit, default-deny
- **Goal:** every response carries the headers and Content-Security-Policy listed in the architecture ("Transport and headers"); CORS allows exactly `https://localhost` without credentials; bodies over 16 KB are refused before parsing; routes are denied unless declared, with public routes in one explicit list.
- **Acceptance:** NFR-020 (headers, CSP without `unsafe-inline` for scripts, exact CORS origins); NFR-019 (16 KB); FR-019 c2 (default deny).
- **Tests to write first:** one assertion per header; `csp_has_no_unsafe_inline_for_scripts`; `permissions_policy_denies_microphone`; `cors_allows_only_capacitor_origin`; `cors_refuses_other_origin`; `body_of_16KB_plus_1_returns_413`; `undeclared_route_returns_401_without_session`.
- **Touches:** `apps/api` middleware.
- **Notes:** HTTPS redirect and minimum TLS are Cloudflare settings applied in T-019 and asserted in T-020.

### T-016 OpenAPI, typed client, configuration endpoint
- **Goal:** route schemas with `@hono/zod-openapi` generate `apps/api/openapi.json`, committed; CI fails when it drifts; `packages/api-types` generated with openapi-typescript; a small typed API client used by the web app; `GET /api/v1/config`.
- **Acceptance:** enabling work for NFR-016 (the route inventory) and for every API task; architecture "Interfaces".
- **Tests to write first:** `config_returns_public_values_only`; `openapi_lists_every_registered_route`; drift check shown failing on a throwaway branch.
- **Touches:** `apps/api`, `packages/api-types`, CI lint stage.

### T-017 Web app scaffold in two languages
- **Goal:** `apps/web` is a React single-page app built with Vite and served by the Worker as static assets on the same origin; routes declared; i18next with English and Arabic resources in `packages/core`; `lang` and `dir` set on `<html>`; language defaults from the browser, can be switched on any screen and is remembered on the device; a CI check that every key exists in both languages; a lint rule forbidding literal user-facing strings and physical CSS properties; a skeleton page that shows the release value from `GET /config`.
- **Acceptance:** FR-020 c1, c2 (for the skeleton page); FR-021 c1, c2, c3, c5; NFR-009 (automated key check).
- **Tests to write first:** `arabic_browser_language_starts_in_arabic` (including a regional variant such as `ar-EG`); `french_browser_language_starts_in_english`; `switching_language_sets_dir_rtl_and_lang_ar`; `switching_language_keeps_typed_form_values`; `language_choice_survives_reload_when_signed_out`; `missing_arabic_key_fails_key_check`.
- **Touches:** `apps/web`, `packages/core/i18n`, CI lint stage.
- **Notes:** Arabic is first-class from this task on (vision R-9). System fonts only. Build target as in architecture C1.

### T-018 End-to-end, accessibility and screenshot harness
- **Goal:** Playwright runs against the local stack on Chromium, Firefox and WebKit; a screen inventory file drives, for every listed screen in English and Arabic, an axe scan with WCAG 2.2 A and AA rules and a screenshot; a pseudo-locale run reveals clipped text.
- **Acceptance:** NFR-025 (automated part); NFR-009 (screenshots per screen and language); NFR-026 (three engines); FR-020 c5 (inventory).
- **Tests to write first:** the skeleton page's entry in the inventory in both languages; a planted contrast fault and a planted missing label each fail the scan on a throwaway branch.
- **Touches:** `apps/web/e2e`, CI integration stage.
- **Notes:** every later screen task adds its screen and states (loading, empty, error) to the inventory in the same pull request.

### T-019 Infrastructure as code and staging deploy
- **Goal:** `infra/wrangler.jsonc` declares the Worker, routes, D1 and R2 bindings, cron triggers, variables and Smart Placement for staging; an idempotent `infra/bootstrap.sh` creates what the configuration cannot (D1 database with jurisdiction `eu`, buckets, lifecycle rule, custom domains); on every merge to `main` the pipeline builds once, applies pending migrations, deploys the stored artefact to staging and runs a smoke test.
- **Acceptance:** NFR-014 (no idle pause, atomic deploys); NFR-020 (HTTPS only, minimum TLS 1.2, HTTP redirects to HTTPS); delivery standard items 5 to 7, 9, 10.
- **Tests to write first:** the smoke test script, run first against a local stack and seen to fail when the health endpoint is broken: `ready_is_200`, `skeleton_page_loads_in_both_languages`, `http_redirects_to_https`; a test that the bootstrap script run twice makes no change the second time.
- **Touches:** `infra/`, `.github/workflows/`.
- **Notes:** needs P-02, P-03, P-04 and the PQ-01 decision (where the Cloudflare token lives; answered: an environment secret of the `staging` environment, limited to `main`, architecture v0.2 "Secrets", CR-05). `infra/wrangler.jsonc` must repeat the `assets` settings (`run_worker_first: true`) and the `@masareef/core` alias of `apps/api/wrangler.jsonc` (CR-11, CR-13). The token is scoped to this account's Workers, D1 and R2. Nothing is deployed from a laptop. The smoke test grows in T-046 (sign in, create and read an expense).

### T-020 Rollback workflow and header assertions against staging
- **Goal:** a `rollback` workflow that redeploys the previous Worker version in one action; a job that asserts the NFR-020 headers and the HTTPS redirect against the deployed staging site after every deploy.
- **Acceptance:** NFR-020 ("automated header check in CI"); delivery standard item 8.
- **Tests to write first:** the header assertion script, seen to fail against a local stack with one header removed.
- **Touches:** `.github/workflows/`, `infra/`.
- **Notes:** rehearse the rollback once on staging and record the time taken in the pull request; T-088 puts it in the runbook.

### T-021 Android shell scaffold
- **Goal:** `apps/android` is a Capacitor 8.6.2 project wrapping the web build: `minSdk 26`, `compileSdk` and `targetSdk 36`; `production` and `staging` flavours, with only the staging flavour built in this task; `allowBackup="false"`, no cleartext traffic, WebView debugging off in release, permissions `INTERNET` only for now; a static "update Android System WebView" screen below WebView major version 111; CI builds a debug APK when `apps/android` or `packages/core` changes.
- **Acceptance:** NFR-026 (Android 8.0 and later); FR-020 c1, c2 on Android for the skeleton page.
- **Tests to write first:** unit test of the WebView version check (110 blocked, 111 allowed, unparsable treated as blocked); a manifest test asserting backup off, cleartext off and the permission list; an emulator smoke script: the app opens on API 26 and on the latest API and shows the release value from staging in Arabic and English.
- **Touches:** `apps/android`, CI build stage.
- **Notes:** Android build tools exactly as the Capacitor 8.6.2 template (ADR 0010). `RECORD_AUDIO` is added in T-058, not here. Application identifier per PQ-02. ADR 0001, ADR 0007.

### T-022 Authentication foundation and hashing cost
- **Goal:** Better Auth 1.7.25 mounted at `/api/v1/auth` with the Drizzle schema for `user`, `account`, `session`, `verification` including our extra columns; Argon2id (m=19456 KiB, t=2, p=1) from @noble/hashes through the library's custom hash options; database sessions with the cookie cache off; `__Secure-` cookie on the web and bearer token for Android; a create hook that blanks `ip_address` and `user_agent`. The open integration points of architecture D-09 are exercised and the findings written in the pull request. Hashing CPU time is measured on staging.
- **Acceptance:** NFR-017 (storage as Argon2id); NFR-018 (cookie attributes, server-side sessions); NFR-011 input (architecture D-08).
- **Tests to write first:** `stored_password_has_argon2id_prefix_and_parameters`; `hash_verify_round_trip_with_64_arabic_characters`; `session_row_has_null_ip_and_user_agent`; `user_row_has_empty_name_and_null_image`; `session_cookie_is_secure_httponly_samesite_strict`; `bearer_token_authenticates`.
- **Touches:** `apps/api` (auth, schema, first real migration).
- **Notes:** if measured CPU per hash on staging exceeds 1,000 ms, stop and raise it: the fallback (statically imported WebAssembly Argon2id) needs a new ADR (architecture D-08). If the Google ID-token flow needs a client secret, it is a Worker secret (architecture "Secrets"). Sign-up is not reachable by the public in a useful way until T-025; no production environment exists yet. ADR 0005.

### M2 Accounts and data isolation

### T-023 Privacy policy and terms pages
- **Goal:** public routes `/privacy` and `/terms` in both languages at stable addresses, each showing its version and effective date; `GET /config` exposes the current versions; a signed-in user who last saw an older version gets a notice with a link; a release check fails when either document lacks an Arabic or English version.
- **Acceptance:** FR-039 c1, c4, c5; c2 is completed by the screens that link here (T-032, T-036, T-067); c3 by T-086.
- **Tests to write first:** `privacy_and_terms_render_in_both_languages_with_version_and_date`; `arabic_page_is_rtl`; `notice_shown_when_last_seen_version_is_older`; `no_notice_when_versions_match`; `release_check_fails_when_arabic_document_missing`; `arabic_never_falls_back_to_english`.
- **Touches:** `apps/web`, `packages/core/i18n`, release check script.
- **Notes:** the text here is a clearly marked draft: a factual description of what the product does with data, taken from the requirements' Data table and ADR 0009. It is not legal text (OQ-06). The page must exist on staging before P-05 can be completed.

### T-024 Email sending
- **Goal:** an `EmailSender` interface with a Resend implementation that calls the HTTPS API with `fetch` and a 3-second timeout, and a capturing implementation for tests and local use; fixed bilingual templates for verification, password reset and "this account signs in with Google".
- **Acceptance:** FR-002 note (email in the language of the sign-up screen); FR-007 note; FR-020 c1 (system emails).
- **Tests to write first:** `verification_email_in_arabic_when_language_is_ar`; `templates_contain_only_link_and_language_as_variables`; `send_times_out_after_3_seconds_and_reports_failure`; `provider_error_is_logged_without_the_address`.
- **Touches:** `apps/api/services/email`.
- **Notes:** P-06 is needed only for real delivery on staging.

### T-025 Sign-up API
- **Goal:** `POST /auth/sign-up/email` as specified in the architecture's interface table.
- **Acceptance:** FR-001 c1 to c4; FR-003 c2, c4; NFR-017 (15 minimum, 128 maximum accepted, any Unicode, no composition rules, breached-list rejection).
- **Tests to write first:** `valid_sign_up_creates_unverified_account_and_sends_email`; `password_of_14_refused_and_15_accepted`; `password_of_64_and_128_accepted`; `arabic_passphrase_with_spaces_accepted`; `breached_password_refused_with_password_compromised`; `breach_service_timeout_accepts_password_and_logs_warning` (fails open, accepted at design sign-off); `malformed_email_and_255_characters_refused`; `existing_email_returns_same_body_and_changes_nothing`; `terms_not_accepted_refused`; `account_stores_terms_time_and_version_and_no_birth_date`; `email_stored_lower_cased`.
- **Touches:** `apps/api` auth configuration and hooks.
- **Notes:** only the first 5 hex characters of the SHA-1 go to the breach service. CR-01: minimum 15 is one configuration value.

### T-026 Email verification and sign-in API
- **Goal:** `GET /auth/verify-email`, `POST /auth/send-verification-email`, `POST /auth/sign-in/email`.
- **Acceptance:** FR-002 c1 to c3; FR-004 c1, c2.
- **Tests to write first:** `link_within_24_hours_verifies`; `link_after_24_hours_refused` (injected clock); `link_used_twice_refused`; `unverified_sign_in_returns_email_not_verified`; `wrong_password_and_unknown_email_return_identical_response`; `unknown_email_still_computes_a_hash` (timing guard); `resend_returns_200_for_unknown_email`.
- **Touches:** `apps/api`.

### T-027 Sessions
- **Goal:** 30-day idle expiry pushed forward on use; sign-out deletes the session row; state-changing requests with a foreign `Origin` are rejected; expired, missing and tampered credentials are refused everywhere.
- **Acceptance:** FR-006 c1, c2; FR-008 c1, c2; FR-019 c2; NFR-018.
- **Tests to write first:** `session_valid_at_30_days_minus_one_minute`; `session_refused_at_30_days_plus_one_minute`; `use_extends_expiry`; `sign_out_then_replay_is_401`; `tampered_token_is_401`; `post_with_foreign_origin_refused`; `cookie_attributes_asserted`.
- **Touches:** `apps/api`.

### T-028 Cross-account suite
- **Goal:** a test suite that creates two users with distinguishable data and, for every route in `openapi.json` that returns or changes account or expense data, asserts refusal for the other user and for no, expired and tampered credentials; a CI check that fails when a route has no entry.
- **Acceptance:** FR-019 c4; NFR-016.
- **Tests to write first:** the suite itself for the routes that exist (`/me` arrives in T-036, expenses in T-042 onward); the coverage check shown failing on a throwaway branch that adds a route without an entry.
- **Touches:** `apps/api/test/cross-account`, CI.

### T-029 Rate-limit middleware
- **Goal:** the `rate_limit` table and atomic fixed-window counters keyed by an HMAC of the IP address or user id; rules: sign-in 20 per IP per 15 minutes, sign-up 5 per IP per hour, signed-in API 120 per account per minute, public beacons 60 per IP per minute; `429` with `Retry-After`.
- **Acceptance:** NFR-019 (per-IP and per-account limits); FR-001 c5.
- **Tests to write first:** for each rule, `limit_allows_N_and_refuses_N_plus_1`; `window_rollover_allows_again` (injected clock); `no_raw_ip_in_table`; `refused_request_is_not_processed`.
- **Touches:** `apps/api` middleware, migration.
- **Notes:** must not merge before T-013 (CR-03). Client IP from `CF-Connecting-IP`.

### T-030 Lockout and email limits
- **Goal:** the `auth_lockout` table; 5 consecutive failures for an email lock sign-in for 15 minutes whether or not the email has an account; verification and reset emails limited to 3 per account per hour.
- **Acceptance:** NFR-019; FR-004 c3; FR-002 c4; FR-007 c5.
- **Tests to write first:** `fifth_failure_locks_and_correct_password_refused`; `lock_ends_after_15_minutes`; `success_resets_failure_count`; `unknown_email_gets_lockout_row_too`; `fourth_resend_in_an_hour_sends_nothing`; `fourth_reset_request_sends_nothing_and_returns_neutral_body`.
- **Touches:** `apps/api`, migration.

### T-031 Password reset API
- **Goal:** `POST /auth/request-password-reset` and `POST /auth/reset-password`.
- **Acceptance:** FR-007 c1 to c4 and its note; NFR-018 (reset ends all sessions); NFR-017 on the new password.
- **Tests to write first:** `registered_email_gets_single_use_link_and_neutral_body`; `unknown_email_gets_same_body_and_no_email`; `reset_within_60_minutes_changes_password_and_deletes_all_sessions`; `old_password_no_longer_works`; `link_after_60_minutes_refused`; `link_used_twice_refused`; `new_password_of_14_refused`; `google_only_account_gets_explanatory_email_and_no_password`.
- **Touches:** `apps/api`.

### T-032 Web: sign-up, verify email, sign-in
- **Goal:** the three screens in both languages with validation messages, the unticked age-and-terms confirmation with links to both documents, the "check your inbox" state, resend, and a mapping from every API error `code` to a translated message.
- **Acceptance:** FR-001 c1 to c5 (screen behaviour); FR-002 c2, c3 (offer to resend), c4; FR-003 c1, c2; FR-004 c1 to c3; FR-020 c4; FR-039 c2 (sign-up links).
- **Tests to write first:** `confirmation_is_unticked_and_links_to_terms_and_privacy`; `submit_without_tick_marks_it_required`; `short_password_states_the_rule`; `existing_email_shows_check_inbox`; `unverified_sign_in_offers_resend`; `wrong_credentials_show_generic_message`; `rate_limited_shows_try_again_later`; `every_error_code_has_en_and_ar_message`; end-to-end: sign up, open the captured link, sign in, in Arabic and in English.
- **Touches:** `apps/web`, translations, screen inventory.

### T-033 Web: password reset and sign-out
- **Goal:** request-reset and set-new-password screens; Sign out returns to sign-in and clears the in-memory query cache.
- **Acceptance:** FR-007 c1 to c5 (screens); FR-006 c1, c3.
- **Tests to write first:** `request_shows_neutral_message`; `expired_link_offers_new_request`; `sign_out_returns_to_sign_in`; end-to-end: after sign-out the browser Back button shows no account data; end-to-end reset journey.
- **Touches:** `apps/web`.

### T-034 Google sign-in API
- **Goal:** `POST /auth/google/precheck` and Google through `POST /auth/sign-in/social`: verify signature, issuer, audience, expiry and `email_verified`; create only with terms accepted; link to an existing verified account with the same email; delete an unverified password credential before linking; `503 google_unavailable` when Google's keys cannot be fetched within 3 seconds.
- **Acceptance:** FR-005 c1 to c4 (server); FR-003 c3; FR-005 note (only subject identifier and email stored).
- **Tests to write first (tokens signed with a test key, key endpoint mocked):** `new_google_user_without_terms_returns_terms_required_and_stores_nothing`; `new_google_user_with_terms_creates_account`; `returning_google_user_gets_same_account`; `google_email_matching_verified_account_links_without_second_account`; `unverified_password_credential_removed_on_google_arrival`; `wrong_audience_refused`; `expired_token_refused`; `email_not_verified_refused`; `key_fetch_timeout_returns_503`; `no_google_tokens_or_profile_stored`.
- **Touches:** `apps/api`.

### T-035 Google sign-in on the web
- **Goal:** the Google button on sign-in and sign-up, the confirmation dialog for first-time Google users, and handling of cancel, error and unavailability.
- **Acceptance:** FR-005 c1 to c4 (web); FR-003 c3.
- **Tests to write first (Google script stubbed):** `first_time_google_user_sees_confirmation_before_account_exists`; `declining_confirmation_creates_nothing`; `cancelled_google_flow_shows_retry_and_email_option`; `google_unavailable_shows_translated_message`.
- **Touches:** `apps/web`.
- **Notes:** needs the Web client id (P-05), which needs the domain and the deployed privacy page. One manual sign-in with a real Google account on staging is recorded in the pull request, because the real provider cannot run in CI.

### T-036 Settings and `/me`
- **Goal:** `GET` and `PATCH /me`; a Settings screen with language and default currency, links to both policy documents; the chosen language is stored with the account and applied on the next device.
- **Acceptance:** FR-021 c4; FR-015 c2; FR-039 c2 (Settings links).
- **Tests to write first:** `patch_me_rejects_unknown_language_and_currency`; `patch_me_rejects_unknown_fields`; `language_chosen_on_one_device_applies_on_another`; `default_currency_change_does_not_alter_existing_expenses` (completed in T-046); cross-account entries for both routes.
- **Touches:** `apps/api`, `apps/web`.

### T-037 Android authentication
- **Goal:** on Android the session token from the `set-auth-token` header is kept in Keystore-backed storage and sent as a bearer token; every request carries `X-Client: android/<version>`; sign-out removes the token and all cached data.
- **Acceptance:** FR-004 c4 (same account on Android); FR-006 c4; FR-008 c1, c2 on Android.
- **Tests to write first:** unit tests of the storage adapter against a fake secure store (`token_saved_on_sign_in`, `token_removed_on_sign_out`, `no_token_in_plain_preferences`); emulator script inspecting app storage after sign-out.
- **Touches:** `apps/web` (platform adapter), `apps/android`.

### T-038 Google sign-in on Android
- **Goal:** Google ID token through Credential Manager using @capgo/capacitor-social-login; the button is hidden when Google services are absent.
- **Acceptance:** FR-005 c5.
- **Tests to write first:** `button_hidden_when_plugin_reports_unavailable`; `email_sign_in_still_offered`; emulator runs with and without Google services.
- **Touches:** `apps/web`, `apps/android`.
- **Notes:** the Android client id for the staging flavour is registered with the staging keystore's certificate fingerprint; the production client id waits for P-08.

### T-039 Delete account API
- **Goal:** `POST /auth/delete-user` with fresh proof (the password, or a Google ID token issued within the last 5 minutes); deleting the user row cascades to accounts, sessions, expenses and the sync counter in one transaction; a row is written to `deletion_ledger`.
- **Acceptance:** FR-009 c1 (server), c3, c4 (live database within 60 seconds), c5.
- **Tests to write first:** `wrong_password_deletes_nothing`; `google_token_older_than_5_minutes_refused`; `deletion_removes_every_row_holding_the_user_id_or_email` (checked table by table); `all_sessions_dead_after_deletion`; `sign_in_after_deletion_fails_as_unknown`; `same_email_can_sign_up_again_with_empty_account`; `ledger_row_holds_only_a_keyed_hash`.
- **Touches:** `apps/api`, migration.
- **Notes:** must not merge before T-013 (CR-03). The table-by-table check is extended when the expense table arrives (T-042).

### T-040 Delete account in the apps and on the public page
- **Goal:** Settings, Delete account, warning, re-authentication, confirmation, on web and Android; the public `/delete-account` page for people without the app, linked from the privacy policy.
- **Acceptance:** FR-009 c1, c2, c5, c6.
- **Tests to write first:** `warning_states_all_expenses_are_removed`; `cancel_at_warning_deletes_nothing`; `failed_reauthentication_deletes_nothing`; `server_unreachable_says_deletion_did_not_happen`; end-to-end: delete from the public page, then sign-in fails.
- **Touches:** `apps/web`.

### T-041 Scheduled clean-up jobs
- **Goal:** `cleanup-unverified` (daily 01:00 UTC) and `cleanup-expired` (daily 01:10 UTC) as specified in architecture C5.
- **Acceptance:** FR-002 c5; NFR-024 (unverified accounts after 7 days; ledger rows after 30 days); NFR-018.
- **Tests to write first (injected clock):** `unverified_account_deleted_after_7_days`; `unverified_account_kept_at_6_days_23_hours`; `verified_account_never_deleted`; `google_account_never_deleted_as_unverified`; `expired_sessions_and_used_tokens_removed`; `rate_limit_rows_past_window_removed`; `ledger_rows_older_than_30_days_removed`.
- **Touches:** `apps/api/jobs`, `infra/wrangler.jsonc`.

### M3 Expenses, summary and sync

### T-042 Expense create and read API
- **Goal:** the `expense` and `user_sync` tables with every constraint and index in the architecture's data model; repository functions that take `userId` as the required first argument; `POST /expenses` (201; 200 with the stored row when this user already has that id) and `GET /expenses/{id}`; every create increments the user's `seq` in the same batch and stamps `rev`.
- **Acceptance:** FR-010 c2 to c6, c9; FR-014 c4; FR-015 c4, c5; FR-017 c3 (server side); FR-019 c1; NFR-007 (exactly once).
- **Tests to write first:** `create_returns_201_and_row`; `repeated_create_with_same_id_returns_200_and_one_row_exists`; `repeated_create_with_different_body_does_not_apply_it`; `amount_zero_negative_text_and_over_limit_refused`; `three_decimals_refused_for_EGP_and_accepted_for_KWD`; `unknown_category_and_currency_refused`; `date_tomorrow_and_1999_12_31_refused`; `note_of_201_characters_refused`; `script_text_in_note_stored_literally`; `unknown_field_refused`; `other_users_expense_id_returns_same_404_as_missing`; `entry_method_must_be_manual_or_voice`; `seq_increments_on_create`; cross-account entries.
- **Touches:** `apps/api`, migration, `packages/core` (shared Zod schema).
- **Notes:** "today" for the future-date rule: the server cannot know the device's time zone, so it accepts dates up to the latest calendar date anywhere on Earth (UTC+14) and the client enforces the device's "today" [ASSUMED; listed below]. Extend T-039's table-by-table deletion test to expenses.

### T-043 Expense update and delete API
- **Goal:** `PATCH /expenses/{id}` (last write received wins; `entry_method` not updatable) and `DELETE /expenses/{id}` (204; 404 when absent for this user); both increment `seq`.
- **Acceptance:** FR-011 c1 to c4 (server); FR-012 c1, c3 (server); FR-011 note.
- **Tests to write first:** `patch_changes_only_given_fields`; `patch_with_invalid_values_changes_nothing`; `patch_of_deleted_expense_returns_404`; `two_patches_last_received_is_stored`; `patch_cannot_change_entry_method`; `delete_returns_204_and_row_is_gone`; `delete_of_missing_returns_404`; `patch_and_delete_of_other_users_expense_return_404_and_leave_it_unchanged`; cross-account entries.
- **Touches:** `apps/api`.

### T-044 Expense list API
- **Goal:** `GET /expenses` with inclusive `from` and `to`, comma-separated categories, keyset paging on (`spent_on`, `created_at`, `id`) with `limit` 1 to 50, and `totals` per currency over the whole filtered range.
- **Acceptance:** FR-013 c1 (order), c2, c3, c5, c6, c7 (server); NFR-013 (keyset paging on the covering index).
- **Tests to write first:** `order_is_newest_date_then_most_recently_created`; `range_bounds_are_inclusive`; `category_filter_combines_with_range`; `from_after_to_returns_400`; `empty_range_returns_empty_items_and_no_totals`; `120_expenses_page_through_as_50_50_20_with_none_missing_or_repeated`; `rows_with_identical_date_and_created_time_page_stably`; `totals_one_per_currency_never_combined`; `totals_cover_whole_range_not_the_page`; `limit_0_and_51_refused`; cross-account entry.
- **Touches:** `apps/api`.

### T-045 Formatters
- **Goal:** `packages/core` formatters for amounts (grouping, two decimals, three for KWD, currency code in English and symbol such as ج.م in Arabic) and dates ("16 Nov 2026", "16 نوفمبر 2026") from fixed tables, emitting Western digits only; small React helpers that wrap amounts in `<bdi dir="ltr">` and user text in `<bdi dir="auto">`.
- **Acceptance:** FR-022 c1, c2, c3; FR-015 note (display decimals); FR-020 c3 (helper).
- **Tests to write first:** `1234.5_EGP_formats_as_1,234.50_in_both_languages`; `arabic_output_contains_no_arabic_indic_digit`; `KWD_shows_three_decimals`; `date_formats_en_and_ar_for_every_month`; `EGP_symbol_is_ج.م_in_arabic_and_EGP_in_english`.
- **Touches:** `packages/core`, `apps/web` components.
- **Notes:** no date library and no `Intl` dependence for output, so results cannot differ between WebView versions (architecture, "Not chosen as libraries").

### T-046 Add-expense form
- **Goal:** `/expenses/new`: one screen with a numeric amount field, a one-tap grid of the ten categories, currency preset to the user's default, date preset to the device's today, optional note with a 200-character counter; client validation with the shared schema; Save shows "saved" only after the server confirms.
- **Acceptance:** FR-010 c1 to c8; FR-014 c1, c2, c3, c5; FR-015 c1, c3, c4; FR-022 c4; NFR-005 (form designed for it; measured in T-079).
- **Tests to write first:** `form_opens_with_default_currency_today_no_category_empty_note`; `new_account_currency_is_EGP`; `empty_zero_negative_and_over_limit_amount_show_message_and_do_not_call_api`; `10.555_EGP_refused_and_1.250_KWD_accepted`; `no_category_marked_required`; `future_date_refused`; `note_stops_at_200_with_counter`; `arabic_indic_٥٠_shown_and_sent_as_50`; `category_grid_lists_ten_in_order_in_each_language`; `no_control_to_add_or_rename_a_category`; `choosing_currency_for_one_expense_does_not_change_default`; end-to-end: add an expense and see it first in today's entries.
- **Touches:** `apps/web`, screen inventory, smoke test.
- **Notes:** the staging smoke test is extended here to sign in, create and read an expense, using the seeded smoke account (PQ-03).

### T-047 Expense list screen
- **Goal:** `/expenses`: current month by default, date-range and category filters, pages of 50 on scroll, one total per currency, empty states with actions, notes rendered as literal text in their natural direction.
- **Acceptance:** FR-013 c1 to c7; FR-020 c3; FR-022 c5; FR-010 c8 (display); FR-004 c1 (lands on the list), c4.
- **Tests to write first:** `row_shows_amount_currency_category_in_current_language_date_and_note`; `new_account_shows_empty_state_with_add_action`; `filters_matching_nothing_offer_clear`; `from_after_to_shows_validation`; `scrolling_loads_next_page_once`; `two_currencies_show_two_totals`; `note_with_script_tag_is_text`; `mixed_direction_note_keeps_row_layout` (screenshot in the inventory); `note_with_arabic_indic_digits_shown_as_typed`; `switching_language_changes_category_names`.
- **Touches:** `apps/web`.

### T-048 Edit and delete in the app
- **Goal:** `/expenses/:id` edit form reusing the add form's rules; Delete with a confirmation prompt; correct handling of "deleted elsewhere" and of an unreachable server.
- **Acceptance:** FR-011 c1, c2, c3, c5; FR-012 c1 to c4.
- **Tests to write first:** `edit_saves_changed_fields_and_list_shows_them`; `leaving_without_save_changes_nothing`; `edit_of_deleted_expense_says_no_longer_exists_and_removes_row`; `delete_asks_for_confirmation`; `cancel_keeps_expense`; `delete_404_is_treated_as_success`; `delete_with_server_unreachable_keeps_row_and_says_so`.
- **Touches:** `apps/web`.

### T-049 Monthly summary API
- **Goal:** `GET /summary?month=YYYY-MM` returning, per currency, the total and the total per category; months after the current one refused.
- **Acceptance:** FR-016 c2, c3, c4, c7 (server).
- **Tests to write first:** `known_data_gives_190_150_and_40`; `two_currencies_reported_separately`; `month_with_no_expenses_returns_empty_currencies`; `future_month_refused`; `malformed_month_refused`; `summary_reflects_edit_and_delete`; cross-account entry.
- **Touches:** `apps/api`.

### T-050 Monthly summary screen
- **Goal:** `/summary`: total, per-category totals and one bar chart built from HTML and CSS as a list with text values and patterned bars; one currency at a time starting with the default; previous and next month, never past the current month; empty state.
- **Acceptance:** FR-016 c1 to c7; NFR-025 (chart readable without colour and by screen reader).
- **Tests to write first:** `shows_total_and_per_category_for_current_month`; `currency_switch_lists_only_currencies_with_expenses`; `starts_with_default_currency`; `next_is_disabled_on_current_month`; `empty_month_shows_message_and_no_chart`; `chart_values_are_present_as_text`; `bars_differ_by_pattern_not_colour_only`; axe scan in both languages.
- **Touches:** `apps/web`.

### T-051 Sync
- **Goal:** `GET /sync` returns the user's `seq`; while the list or summary is visible, the app is in the foreground and online, the client asks every 5 seconds and on focus and resume, and refetches the queries on screen when the number changed; polling stops when hidden.
- **Acceptance:** FR-017 c1, c2, c5; NFR-006 (design; measured in T-055).
- **Tests to write first:** `seq_changes_on_create_update_delete`; `seq_of_another_user_is_unaffected`; `poll_refetches_only_when_seq_changed` (fake timers); `no_polling_when_page_hidden`; `resume_checks_at_once`; two-browser-context end-to-end: save, edit and delete in one context appear in the other within 10 seconds without reload.
- **Touches:** `apps/api`, `apps/web`.
- **Notes:** the interval is a configuration value (ADR 0006: drops to 3 seconds if the measured 95th percentile approaches the limit).

### T-052 Save reliability
- **Goal:** the expense UUID is generated before the first attempt and reused on every retry; at most two automatic retries; the interface reports "saved" only after a 200 or 201 and otherwise says the save failed and keeps the values.
- **Acceptance:** FR-017 c3, c4; NFR-007.
- **Tests to write first:** `response_lost_after_server_saved_then_retry_yields_one_expense`; `user_pressing_save_again_reuses_same_id`; `third_failure_shows_message_and_keeps_values`; `rejected_save_is_not_shown_as_saved`; `double_tap_on_save_sends_one_logical_save`.
- **Touches:** `apps/web`.

### T-053 Offline behaviour
- **Goal:** network status from the browser and from @capacitor/network; a visible translated offline message; Save while offline reports nothing saved and keeps the values; saving once works when the connection returns; nothing is queued or persisted.
- **Acceptance:** FR-018 c1 to c4.
- **Tests to write first:** `offline_banner_appears_and_disappears`; `save_while_offline_keeps_values_and_explains`; `save_after_reconnect_saves_once`; `closing_while_offline_leaves_nothing_in_storage`; emulator check in flight mode.
- **Touches:** `apps/web`, `apps/android` (plugin registration).

### T-054 Re-authentication over an open form
- **Goal:** when a request returns `401` on a screen with unsaved input, a sign-in dialog opens over it; after signing in the form still holds its values and the save can be repeated.
- **Acceptance:** FR-008 c3.
- **Tests to write first:** `expired_session_on_save_opens_dialog_and_keeps_values`; `after_sign_in_save_succeeds_once`; `dismissing_dialog_shows_no_account_data`.
- **Touches:** `apps/web`.

### T-055 Sync latency and save-reliability tests against staging
- **Goal:** two automated tests that run on demand against staging: (1) two clients, at least 100 saves in each direction, delay recorded per sample; (2) at least 1,000 saves with the connection cut at a random moment in at least 200, then the client's log compared with the server's rows.
- **Acceptance:** NFR-006; NFR-007; FR-017 c1, c3.
- **Tests to write first:** these are the tests. The comparison logic has its own unit tests: `reports_duplicate`, `reports_loss`, `p95_computed_correctly`.
- **Touches:** `apps/web/e2e/nonfunctional`, a manually started workflow.
- **Notes:** one client is a browser and the other is the staging APK on an emulator (T-021 provides the build), so both directions between web and Android are measured. Results are stored as artefacts for the tester.

### M4 Voice entry on Android

No task in this milestone starts before T-012 is done. Each task below is written for the planning baseline (whisper.cpp, one multilingual model, Arabic and English voice on Android). If ADR 0011 adopts something else, the "Effect on tasks" column under "The PoC decision point" says what changes.

### T-056 Voice review screen
- **Goal:** a review screen that takes recognised text, runs `parseUtterance` and shows the text plus amount, currency, category, date and note, all editable, with fields marked "needs attention" in text as well as visually, and Save and Cancel. The Save handler is the only code path that creates a voice expense (`entryMethod: "voice"`).
- **Acceptance:** FR-024 c1 to c6; FR-025 c6, c8; FR-026 c4; FR-030 c1, c4; NFR-008.
- **Tests to write first:** `shows_transcript_and_parsed_fields`; `edited_values_are_what_is_saved`; `saved_expense_is_marked_voice`; `cancel_back_and_unmount_send_no_request`; `empty_amount_is_marked_and_save_refused`; `attention_mark_has_text_for_screen_readers`; `note_is_empty_by_default`; `invalid_values_follow_add_form_rules`; `transcript_not_written_to_storage_or_log`; end-to-end with a fake plugin: zero `POST /expenses` between microphone tap and Save.
- **Touches:** `apps/web`.
- **Notes:** built against a fake plugin, so it does not wait for the native work. The recognised text lives only in component state (architecture, "Voice entry design").

### T-057 Speech plugin: interface, engine, availability
- **Goal:** the `masareef-speech` Capacitor plugin with the five methods in architecture C3; the engine adopted by ADR 0011 built from source with the pinned NDK for `arm64-v8a` and `armeabi-v7a` (plus `x86_64` in debug); `getAvailability()` returning `ready`, `needs_download` or `unsupported` using the thresholds recorded in ADR 0011.
- **Acceptance:** FR-031 c3 (unsupported devices, no network fallback); FR-023 (foundation).
- **Tests to write first:** `unsupported_without_64_bit_abi`; `unsupported_below_memory_threshold`; `needs_download_when_model_absent`; `ready_when_model_present_and_checksum_matches`; TypeScript contract test that the plugin's event sequence is exactly one terminal event per `start`.
- **Touches:** `apps/android` (plugin, native build), CI Android build.
- **Notes:** the plugin contains no upload code and no network code other than the model download added in T-059.

### T-058 Speech plugin: recording and recognition
- **Goal:** `start`, `stop`, `cancel`: 16 kHz mono PCM held in memory only; end of speech after 1.5 seconds of silence; `no_speech` after 10 seconds with none; hard stop at 30 seconds; the silence gate and hallucinated-phrase check; `mic_busy` on audio-focus loss or a call; the buffer released on every outcome; model loading started at the tap. Adds the `RECORD_AUDIO` permission to the manifest.
- **Acceptance:** FR-023 c2, c3, c4, c6; FR-030 c2, c3; FR-032 c3 (no audio file).
- **Tests to write first (instrumented, audio injected from test clips):** `speech_then_silence_returns_result_text`; `silence_only_returns_no_speech_and_engine_not_run`; `30_seconds_of_speech_stops_and_recognises`; `cancel_returns_cancelled_and_no_result`; `focus_loss_returns_mic_busy_and_no_result`; `engine_failure_returns_engine_error`; `no_file_created_in_app_storage_after_each_outcome`.
- **Touches:** `apps/android` (plugin).
- **Notes:** the audio-injection seam used by these tests and by T-064 exists only in debug and staging builds [ASSUMED; listed below].

### T-059 Speech model manifest and consented download
- **Goal:** `models/models.json` and the model file published to the staging downloads bucket by a pipeline script; `downloadModel()` downloads from `https://dl.<domain>` with no cookie, token or identifier, verifies the SHA-256 compiled into the app, installs atomically, and removes partial or mismatching files; `getAvailability()` reports `downloadBytes`.
- **Acceptance:** FR-031 c4 (plugin side); NFR-027 (size recorded; APK plus model within the limit in force after T-012).
- **Tests to write first:** `download_then_checksum_ok_becomes_ready`; `interrupted_download_leaves_no_file`; `checksum_mismatch_removes_file_and_reports`; `no_space_reports_no_space`; `request_carries_no_cookie_or_identifier`; `availability_reports_size_before_download`.
- **Touches:** `apps/android` (plugin), `infra/` release script.

### T-060 Voice entry screen
- **Goal:** the add-expense screen offers manual entry and a microphone control; tapping it shows a listening state with Stop and Cancel and a per-entry Arabic or English switch defaulting to the interface language; a result opens the review screen (T-056); "nothing heard" and engine errors show a translated message with Retry and Enter manually.
- **Acceptance:** FR-023 c1, c3, c4, c5; FR-030 c2, c3.
- **Tests to write first (fake plugin):** `mic_tap_shows_listening_with_stop_and_cancel`; `result_opens_review_with_parsed_fields`; `cancel_opens_nothing_and_saves_nothing`; `no_speech_offers_retry_and_manual`; `engine_error_shows_translated_message`; `manual_entry_works_without_touching_plugin`; `language_switch_passes_ar_or_en_to_start`.
- **Touches:** `apps/web`.
- **Notes:** if ADR 0011 finds one setting handles both languages, the switch is dropped through change control (FR-023 note).

### T-061 Microphone permission, availability and download consent
- **Goal:** before the first permission request, an explanation that the microphone is used only to fill in an expense and that audio does not leave the device and is not kept; guidance to system settings after denial or revocation; the disabled or absent microphone with a short explanation on unsupported devices; the download prompt stating the size and asking for confirmation.
- **Acceptance:** FR-031 c1 to c5.
- **Tests to write first:** `permission_not_requested_at_startup`; `explanation_shown_before_first_request`; `denied_keeps_manual_entry_and_explains_settings`; `revoked_permission_behaves_as_denied_without_crash`; `unsupported_device_disables_mic_with_explanation`; `download_prompt_states_size_and_declining_downloads_nothing`; `failed_download_leaves_manual_entry_working`; emulator check of denial and revocation.
- **Touches:** `apps/web`, `apps/android`.

### T-062 Record again
- **Goal:** a Record again action on the review screen that replaces the fields with newly parsed values, and restores the previous values, including hand edits, when listening is cancelled.
- **Acceptance:** FR-034 c1, c2 (Should).
- **Tests to write first:** `record_again_replaces_fields_and_nothing_saved_between`; `cancel_during_record_again_restores_previous_values_and_edits`.
- **Touches:** `apps/web`.

### T-063 Voice privacy and offline verification
- **Goal:** repeatable evidence for the audio rules on the staging build: 20 voice entries in flight mode reach the review screen; app storage holds no audio file and no transcript after Save, Cancel and error; a proxy capture over 20 entries shows no request carrying audio or recognised text and exactly one expense request per Save; the server database and logs contain no seeded transcript marker.
- **Acceptance:** FR-032 c1 to c4; NFR-021 (Android part).
- **Tests to write first:** `error_report_schema_has_no_free_text_field`; `event_schema_has_no_free_text_field`; the capture-analysis script's unit tests (`flags_request_with_audio_content_type`, `flags_body_containing_marker`, `passes_clean_capture`); then the scripted run itself.
- **Touches:** `apps/android` test scripts, `apps/web/e2e/nonfunctional`.
- **Notes:** the procedure is written so the tester can repeat it on the release candidate.

### T-064 Accuracy and timing run on the product build
- **Goal:** a script that plays the test-set audio through the staging build's real voice path on the reference phone and records, per utterance, the fields shown on the review screen and the time from microphone tap to review; and a timed script for the NFR-004 journey.
- **Acceptance:** NFR-001 to NFR-003 (measurement on the synthetic set; proof needs T-087); NFR-004.
- **Tests to write first:** reuses T-007's scoring tests; `run_resumes_after_interruption_without_double_counting`.
- **Touches:** `apps/android` test scripts, `poc/voice` scoring.
- **Notes:** needs P-10. A drop against T-010's numbers on the same audio is a defect to investigate before M4 is called done.

### M5 Android distribution, web voice outcome and measurement

### T-065 Android signing and release pipeline
- **Goal:** `production` and `staging` flavours each signed with its own key using signature schemes v2 and v3; a release job that, on a version tag, builds, signs, runs `apksigner verify`, compares the certificate SHA-256 with a constant in the repository, computes the file's SHA-256, uploads `masareef-<version>.apk` to the downloads bucket and updates `releases.json`; `versionCode` rises on every release; the job fails if APK plus model exceed the NFR-027 limit in force.
- **Acceptance:** FR-036 c1, c2, c5 (key not in the APK or repository); NFR-027; NFR-020.
- **Tests to write first:** unit tests of the release script: `fingerprint_mismatch_fails_before_upload`; `checksum_written_matches_file`; `releases_json_gains_one_entry_with_version_date_size_sha256`; `version_code_must_increase`; `size_over_limit_fails`. A staging release run end to end.
- **Touches:** `apps/android`, `infra/` release scripts, `.github/workflows/`.
- **Notes:** needs P-08 and the PQ-01 decision on where the keystore secret lives and how the job is approved (answered: an environment secret of the `release` environment, `v*` tags only, the operator as required reviewer; architecture v0.2 "Secrets", ADR 0007 note of 2026-11-27, CR-05). The application identifier is confirmed first (PQ-02) and is permanent afterwards. No release is built or signed on a laptop. ADR 0007.

### T-066 Update-in-place and wrong-key tests
- **Goal:** an emulator script that installs staging version N, signs in, sets Arabic, installs N+1 over it and checks the session and language are kept; and that an APK with the same identifier signed by a different key is refused.
- **Acceptance:** FR-036 c3, c4.
- **Tests to write first:** the script is the test; it is first seen to fail when N+1 is deliberately built with a lower `versionCode`.
- **Touches:** `apps/android` test scripts.

### T-067 Download page
- **Goal:** public `/download` in both languages: download button, version, release date, size, minimum Android version 8.0, the file's SHA-256 from `releases.json`, the certificate fingerprint from the repository constant, step-by-step install instructions including "Install unknown apps" and what the system prompts look like, "download only from this page", the unsupported-device note, the desktop and iOS variant offering the web app, links to the privacy policy, the terms and the account-deletion page.
- **Acceptance:** FR-035 c1, c2, c4 (page part), c5, c6 (instructions); FR-039 c2; FR-009 c2 (link); FR-036 c1, c2 (published values).
- **Tests to write first:** `page_shows_version_date_size_min_android_checksum_and_fingerprint`; `fingerprint_comes_from_repository_constant_not_bucket`; `desktop_user_agent_sees_android_only_note_web_app_offer_and_link`; `page_is_public_and_bilingual`; `releases_json_unreachable_still_shows_instructions_and_link`; manual install following the text exactly on Android 8.0 and latest emulators (c3), recorded in the pull request.
- **Touches:** `apps/web`.
- **Notes:** Android version detection in the browser is best-effort (ADR 0007); the minimum version is always stated in text.

### T-068 Web voice outcome
- **Goal (baseline "web voice does not ship"):** the web add-expense screen has no microphone control, states that voice entry is available in the Android app and links to the download page; the web app never requests the microphone; `Permissions-Policy: microphone=()` is sent on every page.
- **Acceptance:** FR-033 c3, c4; NFR-021 (web part).
- **Tests to write first:** `web_add_screen_has_no_mic_control_and_links_to_download`; `android_build_still_shows_mic_control`; end-to-end on three engines: `getUserMedia` is refused by policy; captured traffic on the add-expense screen carries no audio content.
- **Touches:** `apps/web`.
- **Notes:** if ADR 0011 records "web voice ships", this task is reduced to criteria 2 and 4 and tasks T-089 onward are added at T-012.

### T-069 Version endpoint and update notice
- **Goal:** `GET /app-version` returning `latest`, `minimum` and `downloadUrl` from configuration; on start the Android app asks, without cookie or token, and shows a notice with Update (opens the download page in the browser) and Later (quiet for 24 hours); failures are silent.
- **Acceptance:** FR-037 c1 to c5.
- **Tests to write first:** `older_version_shows_notice_with_new_version_number`; `later_hides_notice_for_24_hours` (injected clock); `latest_version_shows_nothing`; `check_timeout_shows_nothing_and_app_works`; `request_carries_no_cookie_or_token`; `app_contains_no_install_packages_permission` (manifest test).
- **Touches:** `apps/api`, `apps/web`.
- **Notes:** `ANDROID_LATEST_VERSION` is raised by a reviewed configuration change only after the APK is published (architecture, "Android releases").

### T-070 Minimum supported version gate
- **Goal:** requests with `X-Client: android/<version>` below `ANDROID_MIN_VERSION` get `426 client_too_old`; the app shows a blocking screen with only Update.
- **Acceptance:** FR-038 c1 to c3 (Should).
- **Tests to write first:** `below_minimum_gets_426_on_every_api_route`; `at_minimum_is_served`; `web_client_is_never_blocked`; `blocking_screen_offers_only_update`; `426_mid_session_shows_blocking_screen`.
- **Touches:** `apps/api` middleware, `apps/web`.

### T-071 Operator counts for S-11 and S-12
- **Goal:** two read-only SQL statements in `infra/ops/` with a wrapper command: accounts with at least one expense created in the last 30 days; counts of expenses by entry method for a period.
- **Acceptance:** FR-040 c1 to c5.
- **Tests to write first:** `three_accounts_two_active_reports_2`; `four_voice_six_manual_reports_40_percent`; `output_contains_only_counts`; `deleted_account_is_not_counted`; `period_bounds_are_inclusive`.
- **Touches:** `infra/ops`, `apps/api` test fixtures.
- **Notes:** the procedure text goes into the runbook in T-088.

### T-072 Anonymous usage events
- **Goal:** the `event_count` table; `POST /events` validating four values against fixed lists and incrementing one counter row, answering 204 always; the client sends the seven events of FR-041 without cookie or token, fire-and-forget; the privacy page lists them.
- **Acceptance:** FR-041 c1 to c4 (Should); NFR-022.
- **Tests to write first:** `valid_event_increments_one_row_keyed_by_day_name_platform_version_language`; `invalid_name_returns_204_and_stores_nothing`; `rate_limited_returns_204_and_stores_nothing`; `request_has_no_cookie_or_authorization_header`; `endpoint_unreachable_shows_no_error_and_feature_works`; `each_of_the_seven_events_fires_once_at_its_trigger`; `payload_schema_rejects_any_extra_field`; `no_ip_or_identifier_in_event_count`.
- **Touches:** `apps/api`, migration, `apps/web`.
- **Notes:** after T-012 because four events are voice events. ADR 0008.

### T-073 Opt out of usage events
- **Goal:** a "Share anonymous usage statistics" switch in Settings, stored on the device; when off, no event is sent.
- **Acceptance:** FR-042 c1 to c3 (Could).
- **Tests to write first:** `off_sends_no_events`; `off_survives_restart`; `features_work_with_setting_off`.
- **Touches:** `apps/web`.
- **Notes:** the only Could requirement. It is planned, small, and the first task to defer if the product owner wants to shorten the release; deferring it needs no change to other tasks. OQ-02 may make it mandatory.

### M6 Operations and release readiness

### T-074 Client error reporting and error screens
- **Goal:** `POST /client-errors` (message, stack, release, platform, route template; at most 4 KB; 204 always; logged); a global error boundary and an unhandled-rejection handler in the client that report and show a translated error screen with the request id where one exists.
- **Acceptance:** NFR-028 (correlation id shown to the user and in the log, no personal data); delivery standard item 15.
- **Tests to write first:** `payload_over_4KB_is_dropped_with_204`; `payload_schema_has_only_the_five_fields`; `route_is_reported_as_template_not_raw_path`; `server_error_screen_shows_request_id_from_response`; `reporter_failure_is_silent`.
- **Touches:** `apps/api`, `apps/web`.

### T-075 `ops-watch` and operator alerts
- **Goal:** the cron job every 10 minutes that reads the Worker's request metrics and emails the operator when 5xx responses exceed 2% of at least 50 requests, when the 95th-percentile duration exceeds 500 ms for two consecutive windows, or when more than 5 email sends failed; each alert links to its runbook section.
- **Acceptance:** NFR-028; alerts for NFR-011 and NFR-014; delivery standard item 14.
- **Tests to write first (metrics source and sender faked):** `below_50_requests_never_alerts`; `2_percent_boundary`; `latency_needs_two_consecutive_windows`; `email_failures_over_5_alert`; `metrics_source_timeout_is_logged_and_does_not_throw`; `no_duplicate_alert_within_one_incident`.
- **Touches:** `apps/api/jobs`.
- **Notes:** needs the read-only analytics token (P-03) and the sender (P-06).

### T-076 Nightly encrypted backup
- **Goal:** a scheduled workflow at 01:30 UTC that exports the database, compresses it, encrypts it with `age` to the public key in the repository, uploads it to the private backups bucket and verifies the upload; a 30-day lifecycle rule in the bootstrap script; a failed run notifies the operator.
- **Acceptance:** NFR-015 (daily, encrypted, kept 30 days); NFR-024 (backups expire in 30 days).
- **Tests to write first:** script unit tests with tools stubbed: `upload_is_verified_by_size_and_checksum`; `any_step_failing_fails_the_job`; `plaintext_dump_is_removed_from_runner`. On staging: a dump produced by the job decrypts with the operator's key and loads into a local SQLite file.
- **Touches:** `infra/backup`, `.github/workflows/`.
- **Notes:** the export duration with the load-test data set is measured in T-078; over 5 seconds, the dump becomes weekly (architecture, "Backups and restore").

### T-077 Restore procedure and rehearsal
- **Goal:** a restore script for each mechanism (Time Travel; encrypted dump) including the step that deletes every restored user whose keyed hash is in the deletion ledger exported just before the restore; one timed rehearsal of each on staging.
- **Acceptance:** NFR-015 (restore within 8 hours, rehearsed and timed); NFR-024 and FR-009 c4 (a deleted account does not come back).
- **Tests to write first:** `ledger_step_deletes_restored_user_whose_hash_is_listed`; `ledger_step_leaves_other_users_untouched`; integration test against a local database: create a user, back up, delete the user, restore, run the ledger step, the user is absent.
- **Touches:** `infra/backup`.
- **Notes:** the operator must take part: only the operator holds the `age` private key.

### T-078 Load test
- **Goal:** a seed generator for 5,000 accounts and 1,000,000 expenses including one account with 10,000; k6 scripts for the NFR-011 profile (25 virtual users, 10 minutes, a realistic mix including sign-in and the sync poll); a first-request-after-30-minutes-idle check; one run on staging with the summary stored.
- **Acceptance:** NFR-011; NFR-013.
- **Tests to write first:** seed generator unit tests (`counts_are_exact`, `one_account_has_10000`, `output_is_deterministic_for_a_seed`); k6 thresholds written before the run: p95 under 500 ms, p99 under 1,500 ms, first page of the large account p95 under 1 second.
- **Touches:** `infra/load`.
- **Notes:** after seeding, time one database export on staging and record it (it decides whether the nightly dump of T-076 stays nightly). Rate limits apply to the run: virtual users are distinct accounts, and the per-IP sign-in limit needs an agreed approach on staging that does not weaken production configuration. If thresholds fail, the findings go to the planner: architecture D-08 and D-10 name the likely causes.

### T-079 Performance budgets and timing scripts
- **Goal:** Lighthouse CI on the sign-in screen and the expense list with the mobile 4G profile and a 2.5-second Largest Contentful Paint assertion; a 200 KB compressed initial JavaScript budget enforced in CI; route-level code splitting; scripts for the timed manual-entry journey on desktop web and for 10 cold starts on the reference phone.
- **Acceptance:** NFR-012; NFR-005 (timed runs available to the tester).
- **Tests to write first:** the budget check, seen to fail on a throwaway branch that imports a large module into the sign-in route; `median_of_runs_computed_correctly`.
- **Touches:** CI, `apps/web`, test scripts.

### T-080 Browser and device matrix
- **Goal:** a workflow that runs the full end-to-end suite on Chromium, Firefox, WebKit and Edge, on an Android 8.0 emulator and the latest Android emulator through the WebView, at 320 and 1,920 CSS pixels wide.
- **Acceptance:** NFR-026 (automated part).
- **Tests to write first:** none new; the workflow runs the existing suite. A viewport test `no_horizontal_scroll_at_320` is added for every inventory screen.
- **Touches:** `.github/workflows/`, `apps/web/e2e`.
- **Notes:** Safari on iOS cannot be automated here (architecture D-16); what is required there depends on CR-06. The run on the reference phone is the tester's.

### T-081 Accessibility completion pass
- **Goal:** every inventory screen in both languages has zero axe violations; a per-screen checklist for keyboard operation with visible focus, 200% text size, 320-pixel reflow, 4.5:1 contrast and target size is completed and its failures fixed; Android Accessibility Scanner findings fixed.
- **Acceptance:** NFR-025 (everything that can be done before the tester's screen-reader passes).
- **Tests to write first:** a keyboard-only end-to-end test for each of the two entry journeys (add manually; voice review with a fake plugin); `focus_is_visible_on_every_interactive_element`; `focus_returns_to_trigger_after_dialog_closes`.
- **Touches:** `apps/web`.
- **Notes:** the screen-reader passes with TalkBack, NVDA and VoiceOver in both languages belong to the Testing phase.

### T-082 Dynamic scan and release-time secret scans
- **Goal:** a workflow that runs the OWASP ZAP 2.17.0 baseline scan against staging and stores the report; release steps that scan the built web bundle and the unpacked APK for secrets and fail the release on a finding.
- **Acceptance:** NFR-020 (0 High or Critical; 0 secrets in bundle or APK); FR-036 c5.
- **Tests to write first:** the bundle and APK scan steps seen to fail on a throwaway branch with a planted fake key.
- **Touches:** `.github/workflows/`.

### T-083 Log and analytics privacy scans
- **Goal:** the end-to-end run seeds marker values (an email, a password, a token, an amount, a note, a transcript marker) and a script scans the logs produced by the run and the captured `/events` requests for them.
- **Acceptance:** NFR-023 (0 personal values in logs); NFR-022 (events match the schema).
- **Tests to write first:** `scanner_finds_planted_marker`; `scanner_passes_clean_log`; `captured_events_match_schema_exactly`.
- **Touches:** `apps/web/e2e/nonfunctional`, `apps/api` test utilities.

### T-084 Production environment
- **Goal:** production resources created by the bootstrap script (database and backups bucket in jurisdiction `eu`, downloads bucket at `dl.<domain>`); the production deploy job with the approval mechanism decided in PQ-01, recording the Time Travel bookmark, applying migrations, deploying the same artefact that passed staging and running the production smoke test; the two uptime monitors; the Cloudflare budget alert at USD 2.00 of usage-based spend shown to exist.
- **Acceptance:** NFR-010 (alert); NFR-014 (external monitor); NFR-020 (HTTPS and TLS settings in production); NFR-028 (alert within 15 minutes).
- **Tests to write first:** the production smoke test (the staging one, parameterised); header assertions against production; an induced outage on staging with the alert's arrival time recorded.
- **Touches:** `infra/`, `.github/workflows/`.
- **Notes:** needs P-07. The approval mechanism decided in PQ-01: the `production` environment, `main` only, the operator as required reviewer, "prevent self-review" off (architecture v0.2, CR-05). Production exists but is not announced; public launch is the Release gate and also needs P-11, P-13 and the tester's verdict.

### T-085 Apply the native-speaker review
- **Goal:** the reviewer's corrections to all Arabic interface text, emails, category names and the parser's Arabic lexicons are applied.
- **Acceptance:** FR-014 note; FR-020 note; FR-026 note; NFR-009.
- **Tests to write first:** a parser unit test for every lexicon word the reviewer adds or corrects; the typed-transcript score (T-007) re-run and compared.
- **Touches:** `packages/core/i18n`, lexicon data files.
- **Notes:** needs P-14. A change to a category's Arabic name in FR-014 c2 is a requirements change and goes through change control.

### T-086 Final policy text
- **Goal:** the legal text supplied through OQ-06 is placed in both languages; the facts it must state are checked against the product as built; the contact address is in place; document versions are raised so existing users see the change notice.
- **Acceptance:** FR-039 c3; FR-041 c4.
- **Tests to write first:** a checklist test that each FR-039 c3 statement has a marked section in both language files; `version_bump_triggers_notice`.
- **Touches:** policy content files.
- **Notes:** needs P-12 and P-13. The delivery team does not write legal terms. If legal advice changes scope (OQ-02, OQ-04, OQ-05), that is a change request.

### T-087 Real-speaker test set
- **Goal:** the recordings supplied through P-14 are checked against the manifest rules and scored once through T-064's run, so the Testing phase starts with a valid set.
- **Acceptance:** NFR-001 (at least 100 Arabic utterances from at least 5 speakers with the required mix), NFR-003 (at least 100 English); FR-029 c4.
- **Tests to write first:** validator extensions: `rejects_fewer_than_5_speakers`; `rejects_audio_without_manifest_entry`.
- **Touches:** `poc/voice` manifests and tools.
- **Notes:** recordings are personal data of the speakers: storage and consent per PQ-04. If the first real-speaker score is below the NFR targets, the product owner's standing decision applies (lower the target through change control) and the requirements gate is re-signed.

### T-088 Runbook
- **Goal:** `docs/08-runbook.md` covering deploy, rollback (web, API, database, Android), configuration and secrets, backups and both restore procedures with the ledger step, signing-key custody, loss and theft, the FR-040 counts procedure, raising `ANDROID_LATEST_VERSION` and `ANDROID_MIN_VERSION`, each alert and its response, the monthly re-check of Google's developer-verification dates, the 90-day HetrixTools login, and contacts.
- **Acceptance:** FR-040 c1, c2 (documented procedure); NFR-015 (rehearsal recorded); delivery standard item 17.
- **Tests to write first:** not applicable (document). Each procedure is executed once on staging by following the text exactly, and corrected where it did not work.
- **Touches:** `docs/08-runbook.md`.

## Coverage check

Every Must requirement appears in at least one task. Should and Could requirements are all covered; none is deferred.

| Requirement | Priority | Tasks |
|---|---|---|
| FR-001 Sign up with email and password | Must | T-025, T-029, T-032 |
| FR-002 Email verification | Must | T-024, T-026, T-030, T-032, T-041 |
| FR-003 Age and terms confirmation | Must | T-025, T-032, T-034, T-035 |
| FR-004 Sign in with email and password | Must | T-026, T-030, T-032, T-037, T-047 |
| FR-005 Sign in with Google | Must | T-034, T-035, T-038 |
| FR-006 Sign out | Must | T-027, T-033, T-037 |
| FR-007 Password reset | Must | T-024, T-030, T-031, T-033 |
| FR-008 Session expiry | Must | T-027, T-037, T-054 |
| FR-009 Delete account and data | Must | T-039, T-040, T-067, T-077 |
| FR-010 Add an expense manually | Must | T-042, T-046, T-047 |
| FR-011 Edit an expense | Must | T-043, T-048 |
| FR-012 Delete an expense | Must | T-043, T-048 |
| FR-013 Expense list with filters | Must | T-044, T-047 |
| FR-014 Fixed bilingual categories | Must | T-002, T-042, T-046, T-085 |
| FR-015 Currencies | Must | T-002, T-036, T-042, T-045, T-046, T-049 |
| FR-016 Monthly summary | Must | T-049, T-050 |
| FR-017 Synchronisation between web and Android | Must | T-042, T-051, T-052, T-055 |
| FR-018 Behaviour when offline | Must | T-053 |
| FR-019 Each user sees only their own data | Must | T-015, T-027, T-028, T-042, T-043 |
| FR-020 English and Arabic interface, right-to-left | Must | T-017, T-018, T-021, T-023, T-024, T-032, T-045, T-047, T-067, T-085 |
| FR-021 Language selection and default | Must | T-017, T-036 |
| FR-022 Western digits, number and date formats | Must | T-002, T-045, T-046, T-047 |
| FR-023 Voice entry on Android | Must | T-057, T-058, T-060 |
| FR-024 Review and confirm before saving | Must | T-056 |
| FR-025 Amounts from speech | Must | T-003, T-005, T-056 |
| FR-026 Category from speech | Must | T-006, T-056, T-085 |
| FR-027 Dates from speech | Must | T-004, T-013a |
| FR-028 Currency from speech | Should | T-005 |
| FR-029 Mixed Arabic and English speech | Must | T-006, T-007, T-087 |
| FR-030 Unrecognised or partial speech | Must | T-006, T-056, T-058, T-060 |
| FR-031 Microphone permission and voice availability | Must | T-057, T-059, T-061 |
| FR-032 Audio stays on the device | Must | T-009, T-010, T-058, T-063 |
| FR-033 Voice entry on the web (conditional) | Should | T-011, T-012, T-068 (criteria 3 and 4 in the baseline; T-089 onward if web voice ships) |
| FR-034 Record again | Should | T-062 |
| FR-035 Download page and install guidance | Must | T-067 |
| FR-036 Signed and verifiable APK | Must | T-065, T-066, T-067, T-082 |
| FR-037 Update notification | Must | T-069 |
| FR-038 Minimum supported version | Should | T-070 |
| FR-039 Privacy policy and terms pages | Must | T-023, T-032, T-036, T-067, T-086 |
| FR-040 Anonymous counts for the success measures | Must | T-071, T-088 |
| FR-041 Anonymous usage events | Should | T-072, T-086 |
| FR-042 Opt out of usage events | Could | T-073 |
| NFR-001 Voice accuracy, Arabic, all fields | - | T-007, T-008, T-009, T-010, T-012, T-064, T-087 |
| NFR-002 Voice accuracy, Arabic, amount | - | T-003, T-007, T-010, T-012, T-064, T-087 |
| NFR-003 Voice accuracy, English | - | T-007, T-010, T-012, T-064, T-087 |
| NFR-004 Voice entry speed | - | T-009, T-010, T-012, T-064 |
| NFR-005 Manual entry speed | - | T-046, T-079 |
| NFR-006 Sync latency | - | T-051, T-055 |
| NFR-007 Sync reliability | - | T-042, T-052, T-055 |
| NFR-008 Voice safety | - | T-006, T-056 |
| NFR-009 Language completeness | - | T-017, T-018, T-085 |
| NFR-010 Running cost | - | T-019, T-084 (PQ-01 adds no fee: Actions are free in a public repository, CR-05) |
| NFR-011 API performance | - | T-022, T-075, T-078 |
| NFR-012 Web and Android start performance | - | T-079 |
| NFR-013 Capacity | - | T-044, T-078 |
| NFR-014 Availability | - | T-014, T-019, T-020, T-075, T-084 |
| NFR-015 Backup and recovery | - | T-076, T-077, T-088 |
| NFR-016 Authorisation tests | - | T-016, T-028 |
| NFR-017 Passwords | - | T-022, T-025, T-031 |
| NFR-018 Sessions | - | T-022, T-027, T-031, T-041 |
| NFR-019 Rate limits | - | T-015, T-029, T-030 |
| NFR-020 Transport and build security | - | T-001, T-015, T-019, T-020, T-065, T-082, T-084 |
| NFR-021 Audio privacy | - | T-009, T-010, T-063, T-068 |
| NFR-022 Analytics privacy | - | T-072, T-083 |
| NFR-023 Data minimisation | - | T-013, T-014, T-083 |
| NFR-024 Retention and deletion | - | T-039, T-041, T-076, T-077 |
| NFR-025 Accessibility | - | T-018, T-050, T-081 |
| NFR-026 Browser and device support | - | T-013, T-018, T-021, T-080 |
| NFR-027 Android distribution | - | T-010, T-012, T-059, T-065 |
| NFR-028 Observability | - | T-014, T-074, T-075, T-084, T-088 |

Counts: 90 tasks (T-001 to T-088, plus T-007a and T-013a; corrected 2026-11-27, the earlier figure of 88 predated T-007a); 36 of 36 Must functional requirements covered; 5 of 5 Should and 1 of 1 Could covered; 28 of 28 non-functional requirements covered.

What a task cannot prove by itself, and who does: NFR-001 to NFR-003 are proven only on the real-speaker set by the tester (T-087 supplies it); the screen-reader passes of NFR-025, the screen-by-screen review of NFR-009 and the reference-phone runs of NFR-004, NFR-005 and NFR-012 are executed in the Testing phase with the scripts these tasks provide; NFR-010 and NFR-014 are confirmed from invoices and monitor figures at R1+30d and R1+90d.

## Assumptions made in this plan

Filled in by the planner; none was stated by the product owner.

| # | Assumption | Affects | Who confirms |
|---|---|---|---|
| PA-01 | M0 and M1 run side by side after T-001; "PoC first" means it has first call on the implementer's time and gates all voice work, not that the walking skeleton waits for it | Order of work | Project lead |
| PA-02 | The parser (T-003 to T-006) is built before the PoC measurement because P1 to P3 are defined through it, and is not treated as voice-dependent | M0 | Project lead |
| PA-03 | One fixed smoke-test account per environment, seeded by script, password held as a pipeline secret (PQ-03) | T-046, T-084 | Product owner or project lead |
| PA-04 | Test audio is kept outside the repository with committed checksums (PQ-04) | T-008, T-087 | Product owner |
| PA-05 | The server accepts an expense date up to the latest calendar date anywhere on Earth; the client enforces the device's "today". FR-010 c6 says "later than today" and c9 says the API rejects the same invalid values, but the API cannot know the device's time zone | T-042 | Project lead; the tester should know when writing the FR-010 c9 test |
| PA-06 | An audio-injection seam exists in debug and staging builds only, so recognition can be tested with recorded clips; the production flavour does not contain it. NFR-001's verification says "through the released Android build": the tester decides whether the staging flavour of the same commit satisfies that or an acoustic playback run on the production APK is needed | T-058, T-064 | Tester |
| PA-07 | A separate staging keystore is created along with P-08, and the Renovate GitHub App is installed along with P-04; neither is listed in the architecture's prerequisites | T-001, T-038, T-065 | Product owner |
| PA-08 | The draft policy text in T-023 is good enough for Google's consent screen (P-05) until the legal text arrives | T-023, T-035 | Product owner |


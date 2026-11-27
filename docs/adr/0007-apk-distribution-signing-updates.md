# ADR 0007: APK distribution, signing, updates and Android developer verification

- **Status:** Proposed (accepted at Design sign-off)
- **Date:** 2026-11-16
- **Relates to:** FR-035, FR-036, FR-037, FR-038, NFR-020, NFR-027; vision R-12; requirements OQ-01

## Context
The Android app is a direct APK download from the Masareef website, with no Google Play publication in R1 [FACT]. Without a store, nothing signs, hosts, verifies or updates the app for us, and users must trust a file from a website.

Google's Android developer verification, read on Google's own pages on 2026-11-16 (the requirements' OQ-01 had only secondary sources):
- Google "requires all apps to be registered by verified developers for users to install them on certified Android devices", on Android 7 and later, delivered through Google Play services (developer.android.com/developer-verification/guides and its FAQ).
- **Timetable:** from 30 September 2026 the protections are live in Brazil, Indonesia, Singapore and Thailand, and only for installs from seven participating stores (Google Play, HONOR App Market, OPPO App Market, Galaxy Store, Palm Store, V-Appstore, GetApps). The FAQ (updated 2026-07-15) states: "if users sideload your app directly, these new verification requirements won't apply to your app yet." Google will "expand these protections globally for all apps on certified Android devices in 2027". No month and no country list for 2027 is published. (One Google help page lists three of the four countries; the developer site lists four.)
- **So for Egypt today:** a directly downloaded APK is not affected. At an unannounced date in 2027 it will be.
- **After enforcement, an unregistered app** can be installed or updated only through ADB or the "advanced flow": enable developer mode, confirm no one is coaching you, restart and re-authenticate, wait one day, confirm with biometrics or PIN, then accept a warning on each install. That is not a path for ordinary users.
- **Registering when distributing only outside Google Play:** create an Android Developer Console account; a "full distribution" account costs USD 25 once and requires identity verification (an organisation also needs a D-U-N-S number, which can take up to 28 days); then register the package name with the SHA-256 fingerprint of the signing certificate and, for existing package names, upload an APK signed with that key containing a supplied snippet. A free "limited distribution" account needs no identity document but reaches at most 20 devices. A lost signing key cannot be registered.
- Not established today: which identity documents Google accepts from an individual in Egypt, how long verification takes, which payment methods work from Egypt, and whether the developer's legal name is shown to users.

## Decision
1. **Hosting:** APK files live in a public R2 bucket at `https://dl.<domain>/android/masareef-<version>.apk`, with `releases.json` beside them. The download page is part of the web app, served by the Worker, and shows version, date, size, minimum Android version, the file's SHA-256 and the signing certificate's SHA-256 fingerprint. The fingerprint is a constant in the repository, not read from the bucket.
2. **Signing:** one release key, generated once by the product owner on a trusted machine, never stored in the repository or on a development machine. The pipeline's copy is a secret in a protected GitHub environment that requires manual approval; two offline encrypted copies are held by the product owner. APKs are signed with signature schemes v2 and v3. Only the CI release job builds and signs releases; it then runs `apksigner verify`, compares the certificate fingerprint with the repository constant, computes the checksum and publishes.
3. **Updates:** the app asks `GET /api/v1/app-version` at start, sending only platform and installed version, with no cookie or token. A newer `latest` shows a dismissible notice (at most once per 24 hours) whose "Update" opens the download page in the browser; a version below `minimum` gets a blocking screen and the API answers `426`. The app never downloads or installs an APK itself.
4. **Developer verification:** the product owner registers a full distribution Android Developer Console account and registers `<applicationId>` with the release certificate, starting as soon as the key exists and finishing before public release. The limited distribution account may be used for the beta with up to 20 devices.
5. **Two flavours:** `production` and `staging` (application id suffix `.staging`, its own key, staging API) are built from the same commit by the same pipeline.

## Alternatives considered
| Option | For | Against |
|---|---|---|
| **Direct APK from our own page, CI-signed, in-app update notice, registered with Google (chosen)** | Meets the product owner's decision; no store rules or review; full control; USD 25 once | Users must allow "install unknown apps" and see system warnings; no automatic updates; key custody is entirely ours; depends on Google's verification programme and its unpublished 2027 date |
| Do not register; rely on the advanced flow | No identity documents, no fee | After enforcement, installing needs developer mode and a one-day wait: ordinary users will not manage it, defeating S-11 |
| Limited distribution account only | Free, no identity document | 20 devices at most; suitable for testing only |
| Publish on Google Play as well | Automatic updates, familiar install, automatic registration | Excluded for R1 by the product owner; brings Play policies and the 12-tester closed test |
| An alternative store (for example F-Droid or a vendor store) | Some update support | F-Droid requires open-source builds by them; vendor stores each add an account and review; none removes the registration requirement |
| In-app self-update (download and launch the installer) | Fewer steps for the user | Needs the install-packages permission and download code that would be a target; FR-037 criterion 5 forbids the app downloading or installing by itself |
| Sign on the maintainer's machine | Simple | Forbidden by the engineering standard; puts the key on a general-purpose computer |
| Host the APK as a Worker static asset | One place | Static assets are limited to 25 MiB per file; the bucket has no such limit and costs nothing |

## Consequences
- The application id and the signing key are permanent from the first public APK. Losing the key means users cannot update in place and the package cannot be re-registered; the only recovery is a new application id and asking users to reinstall. The runbook covers custody, loss and theft.
- "Build once, promote the same artefact" holds for the Worker and web build but not for the APK, which must contain its API address. This exception is accepted here; both flavours come from one pipeline run on one commit.
- Rollback of the Android app is forward-only (architecture document, "Rollback").
- The download page cannot reliably read the Android version from modern browsers (they report a reduced user agent); it states the minimum version in text and relies on Android refusing the install below API 26 (FR-035 criterion 4). Detection is best-effort.
- Google sign-in on Android needs the release certificate's fingerprint registered in the Google Cloud project as well.
- To watch: Google's announcement of the 2027 dates and countries (re-check monthly and before release); the open items listed in Context, which the product owner learns when creating the account; OQ-01 stays open until the product owner decides individual or organisation and completes registration.

## Sources (read on 2026-11-16)
- https://developer.android.com/developer-verification ; /developer-verification/guides ; /guides/android-developer-console ; /guides/faq
- https://support.google.com/android-developer-console/answer/16561738
- https://android-developers.googleblog.com/2026/03/android-developer-verification.html
- https://developers.cloudflare.com/workers/platform/limits/

## Note 2026-11-27 (CR-05)

Added by change control; the decision above is unchanged. Decision 2 assumed "a protected GitHub environment that requires manual approval". On 2026-11-16 the product owner chose a **public** repository on GitHub Free (PQ-01; ADR 0012). On GitHub Free, environment secrets and required reviewers are available only in public repositories [VERIFIED 2026-11-27: docs.github.com, Actions, "Deployments and environments"], so decision 2 can be built as written at no cost. The signing secret's location does not change. Settings that follow: the `release` environment accepts only `v*` tags; the operator is its required reviewer; "prevent self-review" stays off, because the operator is also the one who pushes the tag; pull requests, including from forks, never reach the environment (architecture "Secrets", threat T-22). A separate staging keystore lives in the `staging` environment (plan PA-07).

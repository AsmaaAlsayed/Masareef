# ADR 0001: One TypeScript codebase for web and Android - React with Capacitor

- **Status:** Proposed (accepted at Design sign-off)
- **Date:** 2026-11-16
- **Relates to:** FR-020, FR-021, FR-022, FR-023, FR-031, FR-035, FR-036, NFR-005, NFR-009, NFR-012, NFR-025, NFR-026

## Context
Masareef must ship as a web app and as an Android app (Android 8.0 and later) with the same screens in English and in Arabic with right-to-left layout, to WCAG 2.2 AA on both, including screen readers in both languages. The Android app is a directly downloaded APK. It needs one native capability the web lacks: on-device speech recognition (ADR 0002).

The product owner's answer of 2026-11-16: the maintainer is one person working with AI assistance, with no technology preference; favour few moving parts and one language where the evidence supports it.

Forces:
- Two separate user interfaces double the work for every screen, every translation and every accessibility check, for one maintainer.
- The web app must load fast on a phone (NFR-012: Largest Contentful Paint of 2.5 seconds on a 4G profile) and work with NVDA and VoiceOver, which favours ordinary HTML.
- The Android app must start in 3 seconds on a mid-range phone (NFR-012) and be usable with TalkBack.
- Whatever is chosen must allow a native speech plugin.

Checked on 2026-11-16: Capacitor 8.6.2 is the current release (`npm view @capacitor/core version`); it supports Android API 24 and later and requires a WebView at Chrome 60 or later (capacitorjs.com/docs/android); its Android template targets API 36.

## Decision
Build one React single-page application in TypeScript and ship it twice: served as a website, and bundled into an Android app with Capacitor 8, which shows the same code in the system WebView. Native needs are met by Capacitor plugins, including one plugin written for this project for speech (ADR 0002).

## Alternatives considered
| Option | For | Against |
|---|---|---|
| **React SPA + Capacitor (chosen)** | One codebase, one language, one set of translations and tests; the web app is ordinary HTML, so web accessibility and load time are the easy case; TalkBack reads WebView content as web content; plugins give access to any native API | Runs in a WebView: start-up and scrolling are slower than native (must be measured against NFR-012); behaviour depends on the device's WebView version, which is frozen at Chrome 138 or older on Android 8 and 9; a native plugin must still be written for speech |
| Flutter (Dart) for web and Android | One codebase; strong right-to-left support; good Android performance | A second language (Dart) next to the TypeScript API; Flutter's web output draws to a canvas with a separate accessibility tree, which is the hard case for WCAG with NVDA and VoiceOver; the web download is several megabytes before first paint, a risk for NFR-012 |
| React Native (Expo) with React Native for Web | One language; native widgets on Android | The web side is the secondary target of that ecosystem; more build machinery (native modules, Metro, a web bundler); web accessibility needs care component by component |
| Native Android (Kotlin, Compose) plus a separate web app | Best Android performance and the most direct speech integration | Two codebases and two languages: every screen, string and accessibility fix done twice by one maintainer |
| Kotlin or Compose Multiplatform for web and Android | One language | Its web target renders to canvas with the same accessibility problem as Flutter and is the least mature of the options |
| Web app only, installed as a progressive web app | Smallest effort | The requirements call for an Android app distributed as an APK; on-device speech for Arabic is not available to web pages (ADR 0002) |

## Consequences
- Easier: every screen, translation, validation rule and the utterance parser are written and tested once. The accessibility work is mostly standard web practice.
- Harder: native build tooling (Gradle, the NDK for the speech engine) is still needed in the repository and in CI, although it is touched rarely.
- To watch:
  - Android cold start against the 3-second limit, measured on the reference phone from the walking skeleton onward.
  - WebView versions: the app checks the WebView major version at start and asks the user to update Android System WebView below Chrome 111; the end-to-end suite runs on an Android 8.0 emulator.
  - The Android build tools are those of the Capacitor 8.6.2 template, which are below the latest releases (ADR 0010).
  - If the WebView proves too slow on the reference phone, the fallback is to rewrite the Android shell natively while keeping the API, the parser logic (ported) and the web app; this would be a new ADR.

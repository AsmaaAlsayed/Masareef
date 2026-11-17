# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Dependency audit gate with time-boxed, expiring exceptions (`audit-exceptions.json`, `osv-scanner.toml`); first exception: picomatch GHSA-fc5q-39xc-vjpf until 2026-12-17 (T-001, NFR-020).
- Repository tooling: npm workspaces, TypeScript (strict), ESLint, Prettier and Vitest with a coverage threshold (T-001).
- Pull-request pipeline with secret scanning, static analysis and dependency audits that fail the build (T-001, NFR-020).
- Renovate configuration for weekly grouped updates and immediate security updates (T-001).
- `packages/core`: the ten bilingual categories, the seven currencies with their decimal places and display symbols, Arabic-Indic and Eastern Arabic to Western digit conversion, and exact conversion between decimal strings and integer minor units (T-002, FR-014, FR-015, FR-022).
- Utterance parser, first part: transcript normalisation and the number grammar for Egyptian and Standard Arabic and English number words, digits in either script, halves, quarters and piastres, giving exact amounts (T-003, FR-025, NFR-002).
- Utterance parser, dates: today, yesterday, the day before yesterday, N days ago (1 to 30) and last <weekday> in Egyptian Arabic and English, counted back from an injected calendar date; future, unsupported or conflicting date expressions give today marked for attention, and a number inside a date expression is never taken as the amount (T-004, FR-027).
- Utterance parser, currency and amount choice: currency words for the seven supported currencies in Egyptian Arabic and English (unqualified pounds and piastres are EGP, sterling is GBP), with halves, quarters and duals for every currency ("خمسة دولار ونص", "دولارين"); the user's default currency when no currency word is said; a currency outside the list gives the default marked for attention; the amount next to a currency word is used, and two or more amounts mark the amount for attention (T-005, FR-028, FR-025).
- Utterance parser, categories and assembled result: a reviewable category keyword list for the nine categories other than Other, in Egyptian Arabic and English, with English words and brand names also in Arabic script ("supermarket" and "سوبر ماركت", "uber" and "اوبر"); words of five or more letters also match at one spelling edit; no category word gives Other marked for attention, and two different categories give the first said, marked. `parseUtterance(text, { language, defaultCurrency, today })` returns amount, currency, category, date, a per-field attention mark and the text; when nothing is understood, amount, category and date are all marked, and an utterance mostly in another language gives empty fields with every field marked. The parser returns data only, and a test fails if its source imports anything outside the parser or names a network or storage API (T-006, FR-026, FR-029, FR-030, NFR-008).

### Removed

- The placeholder workspace that gave the pipeline something to run before `packages/core` existed (T-002).

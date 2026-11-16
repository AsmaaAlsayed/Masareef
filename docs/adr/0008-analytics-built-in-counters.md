# ADR 0008: Usage measurement - built-in anonymous counters, no analytics provider

- **Status:** Proposed (accepted at Design sign-off)
- **Date:** 2026-11-16
- **Relates to:** FR-040, FR-041, FR-042, NFR-022, NFR-023, NFR-010, NFR-028; vision S-11, S-12

## Context
The product owner allowed anonymous usage analytics: counts and events only, no personal or expense content, disclosed in the privacy policy [FACT]. Two success measures depend on it: active accounts in the last 30 days (S-11) and the share of expenses entered by voice (S-12). FR-041 lists seven events, each recorded with platform, app version, interface language and day, and forbids any account, device or advertising identifier, IP address or expense content. NFR-022 adds that the analytics service stores no IP address and sets no cross-site identifier. The app must work when analytics is blocked. Cost must stay inside USD 10 per month, and every additional processor has to be named in the privacy policy and assessed under Egypt's Law 151/2020 (vision R-3).

The same reasoning applies to error tracking, which the engineering standard requires.

## Decision
Measure usage inside our own service.
- **S-11 and S-12 (FR-040):** two read-only SQL statements over the expenses table, run by the operator with Wrangler as a runbook procedure, each returning counts only.
- **Events (FR-041):** the client sends `POST /api/v1/events` with `{ name, platform, appVersion, language }`, without cookie or token. The Worker validates the four values against fixed lists and increments one row of `event_count`, keyed by UTC day, name, platform, version and language. No per-event row, timestamp, IP address or identifier is stored. The call is fire-and-forget; any failure is ignored by the client.
- **Opt-out (FR-042, Could):** a device-level setting that stops the client sending events.
- **Error tracking:** server exceptions go to the structured log with the release; clients post unhandled errors to `POST /api/v1/client-errors` (message, stack, release, platform, route template; no free user text), which is logged. No hosted error tracker.

## Alternatives considered
| Option | For | Against |
|---|---|---|
| **Own counters in D1 (chosen)** | Anonymous by construction: there is nothing stored that could identify anyone; no new provider, cost, cookie or script; data in the same jurisdiction as everything else; a few dozen lines of code | No funnels per user, no dashboards: the operator reads a table; we maintain it |
| Hosted privacy-focused analytics (Plausible, Fathom and similar) | Dashboards; designed without cookies | A paid plan that would consume most of the budget (prices not checked today because the option fails on the next points too); a third-party script on every page, loosening the Content-Security-Policy; another processor; built for page views, not app events inside a WebView |
| Product analytics suites (PostHog, Firebase/Google Analytics, Mixpanel) | Funnels, retention, free tiers | Built around a per-user or per-device identifier, which FR-041 forbids; SDK weight; data sent to another company and region; Firebase adds an advertising-identifier risk on Android |
| Self-hosted analytics (Umami, Matomo) | Our data | Needs a server and database to run, against ADR 0004 |
| Cloudflare's analytics products | Already in the account | Page-level web analytics does not cover app events; the event store keeps individual data points with a limited retention, where we need long-lived counts |
| Hosted error tracker (for example Sentry) | Grouping, alerts, source maps | Another processor receiving stack traces and, by default, IP addresses; free plans change; the log plus `ops-watch` is enough at this size. Can be added later through a new ADR |

## Consequences
- Easier: NFR-022 is verified by reading one table and one request schema. The privacy policy can state exactly what is counted.
- Harder: questions such as "how many people who started a voice entry saved it" are answered only as ratios of daily totals, not per person. That is the intended limit.
- The events endpoint is public and could be inflated by a script. It is rate-limited per IP (the IP is used transiently as a keyed hash and not stored with the count), values are restricted to fixed lists, and the numbers are treated as indicative. S-11 and S-12, the measures that matter, come from real expense rows and cannot be inflated this way.
- Counts from FR-040 exclude deleted accounts automatically, because their rows are gone (FR-040 criterion 5). Event counts are not tied to accounts and are kept.
- Whether analytics needs consent or an opt-out in some countries is open (OQ-02); the opt-out design costs little and is ready.

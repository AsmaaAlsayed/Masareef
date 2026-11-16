# ADR 0004: Backend, database and hosting - Cloudflare Workers, D1 and R2

- **Status:** Proposed (accepted at Design sign-off)
- **Date:** 2026-11-16
- **Relates to:** FR-006, FR-009, FR-017, FR-019, NFR-010, NFR-011, NFR-013, NFR-014, NFR-015, NFR-018, NFR-019, NFR-020, NFR-023, NFR-024, NFR-028; vision R-5

## Context
The service needs an API, a relational store for accounts and expenses, static hosting for the web app and pages, file hosting for the APK and speech model, scheduled jobs and backups, for at most USD 10 per month at 500 monthly active users (NFR-010), run by one person with no on-call team and no existing accounts. Free tiers that pause idle projects or disappear are a named risk (vision R-5). The first request after idle must complete within 5 seconds (NFR-011). Backups must be daily, encrypted and kept 30 days (NFR-015).

Several requirements cannot be met by a typical hosted backend-as-a-service used straight from the client and so push toward our own small API: sign-out must invalidate the session on the server within 5 seconds (NFR-018, FR-006 criterion 2); web sessions must be HttpOnly cookies (NFR-018); lockout after exactly 5 failures for 15 minutes and specific per-IP and per-account limits (NFR-019); passwords stored with Argon2id or bcrypt (NFR-017).

Checked on 2026-11-16 (Cloudflare documentation):
- Workers Free: 100,000 requests per day, 10 ms CPU per request. Workers Paid: USD 5 per month minimum, 10 million requests and 30 million CPU-ms included, CPU limit 30 seconds by default. Static asset requests are free. Memory 128 MB per isolate.
- D1 on the paid plan: 25 billion rows read and 50 million rows written per month and 5 GB included; Time Travel restores to any minute of the last 30 days (7 days on the free plan) at no charge; data encrypted at rest with AES-256; jurisdictions `eu` and `us` selectable at creation; no location in the Middle East or Africa.
- R2: 10 GB, 1 million write and 10 million read operations free per month; no egress charge.

## Decision
Run one Cloudflare Worker (Workers Paid plan) that serves the API, written with Hono, and the web build as static assets on the same origin; store data in one D1 database per environment, accessed through Drizzle; keep the APK, the speech model and encrypted database dumps in R2. Use nothing else from the platform: no Durable Objects, key-value store, queues or containers. All platform access goes through one adapter module so the same API code runs on Node with a SQLite file.

## Alternatives considered
| Option | For | Against |
|---|---|---|
| **Cloudflare Workers Paid + D1 + R2 (chosen)** | USD 5 flat with allowances 20 or more times the expected use; no idle pause and no cold-start seconds; no operating system to patch; database history for 30 days built in; web, API, files and cron in one account and one deploy tool; data leaves as a plain SQL dump | Not free; the database has one primary location, none in Egypt or the region; SQLite has fewer features than PostgreSQL; a runtime that is not Node, so libraries must be compatible; one vendor for almost everything |
| Cloudflare Workers Free | USD 0 | 10 ms CPU per request cannot hash a password to OWASP's minimum; database history only 7 days, short of NFR-015's 30 |
| Supabase (hosted PostgreSQL, auth, realtime) free plan | Auth, database and realtime in one; PostgreSQL | Not re-priced today; from the planner's prior knowledge the free plan pauses idle projects and has no backups, and the paid plan costs more than the whole budget. Independently of price: its client-side sessions are tokens that stay valid after sign-out until they expire and are held in browser storage, and its lockout rules are not configurable to NFR-019, so an API of our own would be needed anyway |
| Firebase (Authentication and Firestore) | Generous free allowance; realtime sync built in | Passwords are hashed with Firebase's own scrypt variant, not Argon2id or bcrypt (NFR-017); a document database with a proprietary query and export model, the opposite of an easy exit; sign-in limits are not ours to set |
| One small virtual server (Node, PostgreSQL or SQLite, reverse proxy) | About USD 4 to 6; any country, including an Egyptian host; no platform limits | One maintainer becomes responsible for operating-system patches, TLS, the database, backups, monitoring and recovery, with no redundancy; availability rests on a single machine |
| Container platform with a free allowance plus a hosted PostgreSQL free tier | Familiar stack | Free container tiers stop idle services, risking the 5-second first-request limit; free database tiers keep hours, not 30 days, of history; two more providers |

## Consequences
- Easier: deploy and rollback are one command each; staging and production are the same code with different bindings; there is no capacity to plan at this scale.
- Harder: everything must run in the Workers runtime. Notably, WebAssembly cannot be compiled at run time there, which shaped the password-hashing choice (ADR 0005).
- The engineering standard's "container image scan" step does not apply: there are no images. The other pipeline security checks apply unchanged. Infrastructure as code is the Wrangler configuration file plus an idempotent bootstrap script of Wrangler commands rather than Terraform, to avoid keeping a state file.
- **Exit path, kept working on purpose:** Hono, Drizzle and Better Auth all run on Node; D1 is SQLite. Moving means: export the database to SQL, load it into a SQLite file (or PostgreSQL after a dialect migration), run the same API on Node 26 on a small server, and point DNS at it. Rules that keep this true: no Cloudflare-only service beyond D1, R2 and cron; platform calls only inside `platform.ts`; R2 accessed through its S3-compatible interface in scripts.
- To watch: latency from Egypt to a European database (measured by the load test from the walking skeleton; Smart Placement enabled); a running database export blocks other requests (nightly dump duration measured; see the architecture document); the announced change to Workers Logs pricing on 2026-12-01; the hosting location question (ADR 0009).

## Sources (read on 2026-11-16)
- https://developers.cloudflare.com/workers/platform/pricing/ ; https://developers.cloudflare.com/workers/platform/limits/
- https://developers.cloudflare.com/d1/reference/time-travel/ ; /d1/configuration/data-location/ ; /d1/reference/data-security/ ; /d1/best-practices/import-export-data/
- https://developers.cloudflare.com/r2/pricing/ ; /r2/reference/data-location/

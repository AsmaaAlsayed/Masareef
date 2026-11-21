# Masareef

A voice-first personal expense tracker: a web app, an Android app and an API in one repository. The product documents are in [`docs/`](docs/); start with [`docs/01-vision.md`](docs/01-vision.md) and [`docs/03-architecture.md`](docs/03-architecture.md).

## Prerequisites

- Node.js 26.13.1, the version in [`.nvmrc`](.nvmrc) (`nvm use` or `fnm use` picks it up). npm ships with Node.
- Git.

## Setup

```sh
npm ci
```

## Everyday commands

| Command                    | What it does                                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------------- |
| `npm run lint`             | ESLint with type-aware rules; warnings fail                                                       |
| `npm run format:check`     | Prettier check (`npm run format` rewrites files)                                                  |
| `npm run openapi:check`    | Fails when `apps/api/openapi.json` or the generated client types differ from the routes           |
| `npm run i18n:check`       | Fails when an interface text is missing or empty in English or Arabic, or has Arabic-Indic digits |
| `npm run openapi:generate` | Rewrites `apps/api/openapi.json` and `packages/api-types/src/schema.ts` from the routes           |
| `npm run typecheck`        | TypeScript in strict mode, no output                                                              |
| `npm test`                 | Unit tests with coverage; fails under 80% line coverage                                           |
| `npm run build`            | Builds every workspace that has a `build` script                                                  |
| `npm run test:integration` | API tests in the Workers runtime with a local D1 database, with coverage (fails under 80% lines)  |
| `npm run e2e`              | End-to-end, axe and pseudo-locale tests on the local stack (needs `npm run build`; see below)     |
| `npm run audit`            | `npm audit --audit-level=high`                                                                    |
| `npm run voice:validate`   | Validates the voice test-set manifests                                                            |
| `npm run voice:score`      | Writes the parser-only score on typed transcripts                                                 |

Run all of them before opening a pull request; the pipeline runs the same commands.

## Layout

```
apps/        applications; android is added by a later task
  api/       the API: a Hono application on Cloudflare Workers with a D1 database; it also
             serves the web build
  web/       the web app: a React single-page app built with Vite, in English and Arabic
packages/    shared packages
  api-types/ types generated from apps/api/openapi.json (src/schema.ts, committed) and a
             small typed fetch client for the API
  core/      pure TypeScript used by the web app and the API: the category and currency
             lists, digit conversion, money conversion to and from minor units, the
             interface texts in both languages (src/i18n) and the utterance parser
             (src/parser; its word lists are in src/parser/lexicon)
poc/
  voice/     voice proof of concept: the test-set manifests, their validator, and the
             parser-only score on typed transcripts (see poc/voice/README.md)
docs/        vision, requirements, architecture, plan and decision records
.github/     pipeline and pull-request template
```

## Web app

```sh
npm run build --workspace @masareef/web    # apps/web/dist, which the Worker serves
cp apps/api/.dev.vars.example apps/api/.dev.vars
npm run dev --workspace @masareef/api      # http://localhost:8787: the web app and the API
```

The Worker runs first for every request (`run_worker_first` in `apps/api/wrangler.jsonc`), so pages and files carry the same security headers and Content-Security-Policy as the API. A GET or HEAD outside `/api` is handed to the static-assets binding, which answers client-side routes such as `/expenses/new` with `index.html`; any `/api` path, known or not, goes through the API's access control and is never answered with `index.html`. For fast reloads while editing, run `npm run dev --workspace @masareef/web` (Vite on port 5173, `/api` proxied to port 8787); the Vite server does not send the production headers.

All interface text is in `packages/core/src/i18n` (`en.ts` is the key list; `ar.ts` must match it) and is shown with `t()` from react-i18next. Lint refuses literal text in components and in user-visible attributes, physical CSS properties (`margin-left`, `text-align: left`) in style sheets and inline styles, and `dangerouslySetInnerHTML`. The first visit uses the browser's preferred languages (any `ar` variant gives Arabic, anything else English); the language control in the header switches in place and stores the choice under `masareef.language` in the device's local storage, the only thing the web app stores. System fonts only.

## End-to-end, accessibility and screenshots

```sh
npm run build                     # the harness serves this build; it builds nothing itself
npx playwright install chromium firefox webkit   # once per Playwright version (downloads browsers)
npm run e2e                       # every engine at 320 and 1,920 CSS pixels
npm run e2e:chromium              # one engine (also e2e:firefox, e2e:webkit)
npm run e2e -- --project=webkit-320 --grep "home"   # any Playwright option after --
```

Playwright ([`apps/web/e2e/playwright.config.ts`](apps/web/e2e/playwright.config.ts)) starts the API Worker with `wrangler dev --local` on `http://127.0.0.1:8790`, serving `apps/web/dist` with `RELEASE=e2e-local`, its own local database under `apps/api/.wrangler/e2e` and Wrangler's telemetry off; it needs no Cloudflare account and stops the server when the run ends. It is not part of `npm test`.

[`apps/web/e2e/screens.ts`](apps/web/e2e/screens.ts) is the screen inventory: each screen's id, path and states (for example `loading` and `error`, produced by answering an API path in the test). **A pull request that adds or changes a screen adds its entry and its loading, empty and error states there.** For every entry, state, language (`en`, `ar`, chosen through the browser language) and project, `screens.spec.ts` checks `lang` and `dir`, runs axe with the WCAG 2.2 A and AA tags (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`) and saves a full-page screenshot. `pseudo-locale.spec.ts` repeats each entry with every English text lengthened by 40%, accented and bracketed (`[Šîĝñ îñ ~~~]`), and fails on text that is clipped or spills out of its box, or that is not from the translations. `harness.spec.ts` proves the scan still fails on a planted contrast fault and an unlabelled control, and that clipped text is detected.

Output goes to `apps/web/e2e/output/` (ignored by git): the HTML report in `report/`, traces of failures in `test-results/` and screenshots in `screenshots/`, named `<screen>--<state>--<language>--<engine>-<width>.png`. The pipeline uploads that folder as the `e2e-<commit>` artefact.

## API

```sh
cp apps/api/.dev.vars.example apps/api/.dev.vars
npm run dev --workspace @masareef/api
```

This runs the Worker locally with a local D1 database and needs no Cloudflare account. Try `http://localhost:8787/api/v1/health/ready`. Code goes `routes/` to `services/` to `repositories/`; anything specific to Cloudflare stays in `src/platform.ts`. After a schema change, `npm run db:generate --workspace @masareef/api` writes the migration to `apps/api/migrations`.

Every route needs a session unless it is listed in `apps/api/src/public-routes.ts`. Until sign-in exists (T-022) no request can have a session, so only the listed endpoints answer: the two health endpoints and `GET /api/v1/config`. A new route therefore needs either a session or a deliberate entry in that list. The order of the security layers is explained in `apps/api/src/app.ts`.

Every route is registered with `createRouter().openapi(createRoute(...), handler)` from `apps/api/src/openapi.ts`, which validates its input (a failure is `400 validation_failed` with the field names) and puts it in the OpenAPI description. After changing a route, run `npm run openapi:generate` and commit `apps/api/openapi.json` and `packages/api-types/src/schema.ts`. A route added any other way, for example `app.get(...)`, fails the route inventory test and the generator, and the pipeline fails when either committed file is out of date.

`GET /api/v1/config` returns `{ googleClientId, termsVersion, privacyVersion, release }`. `googleClientId` comes from the optional variable `GOOGLE_CLIENT_ID` (see `.dev.vars.example`) and is `null` when it is not set; the policy versions are in `apps/api/src/policies.ts`.

## Pipeline

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every pull request and on `main`: install from the lockfile, lint, format check and the OpenAPI drift check, type check, unit tests with coverage, build, integration tests, end-to-end tests (Playwright and axe, report and screenshots uploaded), security (gitleaks, Semgrep, `npm audit`, osv-scanner), then upload of the build output named after the commit SHA. Any failing stage stops the run.

Dependency updates are raised by Renovate ([`renovate.json`](renovate.json)). A dependency deliberately held below its latest version needs a decision record in `docs/adr/` and an entry in `.software-house/deps-allow.json`.

## Contributing

One task per pull request, on a short-lived branch named `feat/T-000-short-name` or `fix/D-000-short-name`, with [Conventional Commits](https://www.conventionalcommits.org/). Never commit secrets, `.env` or `.dev.vars` files.

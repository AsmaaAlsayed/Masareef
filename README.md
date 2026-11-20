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

| Command                    | What it does                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------------ |
| `npm run lint`             | ESLint with type-aware rules; warnings fail                                                      |
| `npm run format:check`     | Prettier check (`npm run format` rewrites files)                                                 |
| `npm run openapi:check`    | Fails when `apps/api/openapi.json` or the generated client types differ from the routes          |
| `npm run openapi:generate` | Rewrites `apps/api/openapi.json` and `packages/api-types/src/schema.ts` from the routes          |
| `npm run typecheck`        | TypeScript in strict mode, no output                                                             |
| `npm test`                 | Unit tests with coverage; fails under 80% line coverage                                          |
| `npm run build`            | Builds every workspace that has a `build` script                                                 |
| `npm run test:integration` | API tests in the Workers runtime with a local D1 database, with coverage (fails under 80% lines) |
| `npm run audit`            | `npm audit --audit-level=high`                                                                   |
| `npm run voice:validate`   | Validates the voice test-set manifests                                                           |
| `npm run voice:score`      | Writes the parser-only score on typed transcripts                                                |

Run all of them before opening a pull request; the pipeline runs the same commands.

## Layout

```
apps/        applications; web and android are added by later tasks
  api/       the API: a Hono application on Cloudflare Workers with a D1 database
packages/    shared packages
  api-types/ types generated from apps/api/openapi.json (src/schema.ts, committed) and a
             small typed fetch client for the API
  core/      pure TypeScript used by the web app and the API: the category and currency
             lists, digit conversion, money conversion to and from minor units, and the
             utterance parser (src/parser; its word lists are in src/parser/lexicon)
poc/
  voice/     voice proof of concept: the test-set manifests, their validator, and the
             parser-only score on typed transcripts (see poc/voice/README.md)
docs/        vision, requirements, architecture, plan and decision records
.github/     pipeline and pull-request template
```

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

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every pull request and on `main`: install from the lockfile, lint, format check and the OpenAPI drift check, type check, unit tests with coverage, build, integration tests, security (gitleaks, Semgrep, `npm audit`, osv-scanner), then upload of the build output named after the commit SHA. Any failing stage stops the run.

Dependency updates are raised by Renovate ([`renovate.json`](renovate.json)). A dependency deliberately held below its latest version needs a decision record in `docs/adr/` and an entry in `.software-house/deps-allow.json`.

## Contributing

One task per pull request, on a short-lived branch named `feat/T-000-short-name` or `fix/D-000-short-name`, with [Conventional Commits](https://www.conventionalcommits.org/). Never commit secrets, `.env` or `.dev.vars` files.

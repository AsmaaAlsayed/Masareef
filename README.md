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

| Command                    | What it does                                            |
| -------------------------- | ------------------------------------------------------- |
| `npm run lint`             | ESLint with type-aware rules; warnings fail             |
| `npm run format:check`     | Prettier check (`npm run format` rewrites files)        |
| `npm run typecheck`        | TypeScript in strict mode, no output                    |
| `npm test`                 | Unit tests with coverage; fails under 80% line coverage |
| `npm run build`            | Builds every workspace that has a `build` script        |
| `npm run test:integration` | Runs every workspace's `test:integration` script        |
| `npm run audit`            | `npm audit --audit-level=high`                          |

Run all of them before opening a pull request; the pipeline runs the same commands.

## Layout

```
apps/        applications (web, android, api), added by later tasks
packages/    shared packages
docs/        vision, requirements, architecture, plan and decision records
.github/     pipeline and pull-request template
```

## Pipeline

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every pull request and on `main`: install from the lockfile, lint and format check, type check, unit tests with coverage, build, integration tests, security (gitleaks, Semgrep, `npm audit`, osv-scanner), then upload of the build output named after the commit SHA. Any failing stage stops the run.

Dependency updates are raised by Renovate ([`renovate.json`](renovate.json)). A dependency deliberately held below its latest version needs a decision record in `docs/adr/` and an entry in `.software-house/deps-allow.json`.

## Contributing

One task per pull request, on a short-lived branch named `feat/T-000-short-name` or `fix/D-000-short-name`, with [Conventional Commits](https://www.conventionalcommits.org/). Never commit secrets, `.env` or `.dev.vars` files.

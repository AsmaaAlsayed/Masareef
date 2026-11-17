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

### Removed

- The placeholder workspace that gave the pipeline something to run before `packages/core` existed (T-002).

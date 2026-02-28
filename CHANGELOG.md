# Changelog

All notable changes to this project are documented in this file.

## [v1.1.0] - 2026-02-28

### Added

- Selector contract registry for critical scraping scopes (`countries`, `leagues`, `seasons`, `match-list`, `match-detail`).
- Deterministic selector fallback resolver with probe diagnostics payloads.
- Selector health CLI command: `npm run health:selectors`.
- Smoke reliability subsystem:
  - Fixture matrix
  - Traversal runner
  - Artifact persistence and retention
  - CLI command `npm run smoke:reliability`
- CI workflow `.github/workflows/reliability-smoke.yml` with `workflow_dispatch` and scheduled execution.

### Changed

- Smoke live runs now require schema validation to pass before reporting overall success.
- README updated to reflect current scripts, reliability workflows, and artifact paths.

### Fixed

- Stabilized live smoke fixture selection using verified country/league slugs.
- Added league URL fallback for smoke traversal when live league discovery returns no entries.
- Normalized smoke schema payload entries so required fields are always present for validator compatibility.

## [v1.0.0] - 2026-02-28

### Added

- Migration to Flashscore USA (`https://www.flashscoreusa.com`) for extraction flow.
- Compatibility validation command: `npm run validate:schema`.
- Match ID resilience improvements (`g_<sport>_` parsing with URL `mid` fallback).

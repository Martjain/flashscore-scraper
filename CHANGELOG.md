# Changelog

All notable changes to this project are documented in this file.

## [v1.4.0] - 2026-03-01

### Added

- Alert signal quality controls for reliability failures:
  - Signature-based deduplication policy evaluation with cooldown windows
  - Source-aware suppression and post-cooldown emission summaries
  - Dedupe audit rollups persisted in smoke and selector-health artifacts
- Reliability trend summary subsystem:
  - History loader for smoke + selector-health artifacts with lookback filtering
  - Deterministic fixture/region aggregation with grouped counts and failure rates
  - Operator command `npm run trend:reliability` with validated `--lookback-hours`
  - Trend artifact persistence under `.planning/artifacts/reliability-trends/` (`latest` + timestamped history)
- CI reliability workflow trend integration:
  - Generates trend summaries on every workflow run
  - Uploads dedicated reliability trend artifact bundle

### Changed

- README updated with trend command usage, contract fields, diagnostics interpretation, and CI artifact behavior.
- Reliability workflow now uploads both smoke artifacts and reliability trend artifacts with `if: always()`.

### Fixed

- Aggregation key handling now preserves deterministic fixture/region sorting in sparse-history scenarios.

## [v1.2.0] - 2026-02-28

### Added

- Failed-fixture rerun mode for reliability smoke:
  - `--rerun-failed` to rerun only failed fixtures from latest smoke artifact
  - `--artifact <path>` override for custom artifact selection
- Reliability failure alerting for smoke and selector-health commands via webhook payloads with stable schema.
- Deterministic rotating regional smoke matrix:
  - `--matrix-mode default|extended`
  - `--rotation-key <token>`
  - Scheduled CI weekly extended mode using ISO-week rotation keys
- Selection provenance metadata in smoke artifacts (`selection.mode`, `rotationKey`, `selectedRegion`, `fixtureIds`).

### Changed

- README expanded with rerun workflow, alerting configuration, matrix controls, and dispatch input docs.
- Reliability smoke workflow dispatch now supports rerun and matrix/rotation inputs while keeping default/manual runs bounded.

### Fixed

- Rerun orchestration now executes full failed-fixture sets without sample truncation.
- Null rotation key handling in matrix normalization to preserve default dry-run reliability behavior.

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

---
phase: 03-end-to-end-smoke-automation
plan: "01"
subsystem: testing
tags: [smoke, reliability, playwright, diagnostics]
requires:
  - phase: 02-02
    provides: selector-health-cli-and-diagnostics-patterns
provides:
  - representative fixture smoke matrix for extraction-path checks
  - smoke runner that validates country-league-season-match traversal
  - machine-readable smoke artifact persistence with history retention
affects: [03-02-schema-ci-gate, ci-reliability-monitoring]
tech-stack:
  added: []
  patterns: [artifact-first-smoke-exit, fixture-matrix-smoke-traversal]
key-files:
  created:
    - src/reliability/smoke/fixture-matrix.js
    - src/reliability/smoke/run-smoke-suite.js
    - src/reliability/smoke/reporting.js
    - scripts/smoke-reliability.mjs
  modified:
    - src/cli/arguments/index.js
key-decisions:
  - "Reuse production scraper services in smoke checks to avoid selector drift between runtime and smoke validation"
  - "Always persist smoke latest+history artifact before process exit to preserve diagnostics on failures"
  - "Support bounded runtime controls (sample, max-matches, timeout, fixture filter) for CI-safe execution"
patterns-established:
  - "Smoke fixture results always include status, failedStage, error, durationMs, and discovery counters"
  - "Dry-run mode validates fixture selection and artifact output without browser/network dependencies"
requirements-completed:
  - RELY-03
  - RELY-05
duration: 1 min
completed: 2026-02-28
---

# Phase 3 Plan 1: Reliability Smoke Runner Summary

**A representative fixture smoke runner now exercises country -> league -> season -> match traversal and writes deterministic per-fixture JSON diagnostics artifacts.**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-28T05:18:10Z
- **Completed:** 2026-02-28T05:18:54Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- Added a bounded fixture matrix with stable fixture IDs and traversal hints for representative smoke coverage.
- Implemented a smoke runner that reuses `getListOfCountries`, `getListOfLeagues`, `getListOfSeasons`, `getMatchLinks`, and `getMatchData` in one path-validation flow.
- Added smoke artifact persistence (`latest.json` + timestamped history with pruning) and a CLI entrypoint with runtime-budget flags.

## Task Commits

1. **Task 1: Define representative fixture matrix and traversal contract** - `8156faa` (feat)
2. **Task 2: Implement per-fixture diagnostics and artifact writer** - `7cc7dee` (feat)
3. **Task 3: Expose local smoke CLI entrypoint with bounded runtime flags** - `3ec09ef` (feat)

## Files Created/Modified
- `src/reliability/smoke/fixture-matrix.js` - Defines representative fixtures and deterministic fixture selection logic.
- `src/reliability/smoke/run-smoke-suite.js` - Executes real extraction traversal with per-stage pass/fail diagnostics.
- `src/reliability/smoke/reporting.js` - Writes machine-readable smoke artifacts and prunes history retention.
- `scripts/smoke-reliability.mjs` - Provides runnable smoke CLI with dry-run support and failure exit semantics.
- `src/cli/arguments/index.js` - Adds parser for smoke runtime flags.

## Decisions Made
- Keep smoke logic coupled to production scraper services so smoke failures represent real runtime regressions.
- Treat artifact persistence as mandatory regardless of pass/fail to make CI debugging reproducible.
- Expose fixture filtering and strict runtime bounds in CLI to keep regular smoke runs budget-safe.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan `03-02` can add schema gate enforcement and CI workflow wiring on top of the new smoke CLI.
- Artifact output path and fixture result schema are stable for CI upload and automated inspection.

## Self-Check
- ✅ `node --check src/reliability/smoke/fixture-matrix.js src/reliability/smoke/run-smoke-suite.js src/reliability/smoke/reporting.js scripts/smoke-reliability.mjs` passed.
- ✅ `node scripts/smoke-reliability.mjs --dry-run --sample 1` passed.
- ✅ `.planning/artifacts/smoke/latest.json` generated.
- ✅ `node -e "const fs=require('fs');const p='.planning/artifacts/smoke/latest.json';const r=JSON.parse(fs.readFileSync(p,'utf8'));if(!Array.isArray(r.fixtures))process.exit(1);"` passed.

---
*Phase: 03-end-to-end-smoke-automation*
*Completed: 2026-02-28*

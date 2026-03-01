---
phase: 09-generic-selector-workflow-and-fallback-hardening
plan: "01"
subsystem: reliability
tags: [selector-health, cli, scraping, diagnostics]
requires: []
provides:
  - generic selector-health target mode with representative path selection
  - strict selector-health CLI guardrails for generic vs sample/all flows
  - target mode and seed metadata propagation into selector-health reports
affects: [selector-health-operations, phase-09-verification]
tech-stack:
  added: []
  patterns: [deterministic-representative-selection, strict-cli-option-validation, explicit-target-mode-reporting]
key-files:
  created: []
  modified:
    - src/cli/arguments/index.js
    - scripts/health-selectors.mjs
    - src/selector-health/health-check/runSelectorHealthCheck.js
    - src/selector-health/health-check/reporting.js
key-decisions:
  - "Set selector-health default sample to all discovered targets and treat generic mode as an explicit representative-path mode"
  - "Use deterministic hashed selectionSeed per scope level in generic mode to keep representative probing reproducible per run"
  - "Surface target mode (`any`/`sample`/`all`) in run payloads and operator summaries"
patterns-established:
  - "Selector-health argument parser rejects unknown flags and incompatible `--pick-any` + `--sample` combinations"
  - "Selector-health summary output describes generic mode explicitly instead of overloading sample labels"
requirements-completed:
  - SCRP-01
  - RELY-01
  - RELY-02
duration: 12 min
completed: 2026-03-01
---

# Phase 9 Plan 1: Generic Selector Health Mode and Representative Target Selection Summary

**Selector-health now supports an explicit generic mode that probes one deterministic representative path per scope while preserving fallback behavior and clear operator metadata.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-01T18:34:00Z
- **Completed:** 2026-03-01T18:46:00Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Added `--generic` / `--pick-any` selector-health CLI support with strict unknown-option handling and guardrails against ambiguous `--sample` combinations.
- Implemented deterministic representative target selection across league/season/match discovery chains using `selectionSeed` and scope-level hashing.
- Added `targetMode` and generic-mode summary output so operators can distinguish generic, sample, and all-target runs.

## Task Commits

1. **Task 1-3 (consolidated): Generic mode CLI, representative target selection, and reporting** - `e5bc36d` (feat)

## Files Created/Modified
- `src/cli/arguments/index.js` - Adds generic flag aliases, sample parsing for `all/*`, strict unknown-option errors, and incompatible-flag guardrails.
- `scripts/health-selectors.mjs` - Updates help text/default behavior and propagates generic mode metadata (`targetMode`) through failure and success payloads.
- `src/selector-health/health-check/runSelectorHealthCheck.js` - Adds deterministic representative target selection across scopes with fallback-safe target building.
- `src/selector-health/health-check/reporting.js` - Prints explicit generic target mode summaries for operator troubleshooting.

## Decisions Made
- Consolidated plan tasks into one commit because the workspace already had integrated wave-1 edits spanning the same files.
- Kept selection deterministic per run by hashing scope label + list length against `selectionSeed`.
- Preserved static fallback targets when discovery does not yield representative entities.

## Deviations from Plan

None - plan objectives were implemented as specified; commit granularity was consolidated due existing local integrated edits.

## Issues Encountered
- Runtime country/league/season checks required browser execution outside sandbox for full verification.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Generic selector mode is ready for fallback hardening validation in country/league/season services.
- Operator output and run artifacts now expose enough metadata to triage scope-level selector regressions quickly.

## Validation Evidence
- ✅ `node --check src/cli/arguments/index.js scripts/health-selectors.mjs src/selector-health/health-check/runSelectorHealthCheck.js src/selector-health/health-check/reporting.js` passed.
- ✅ `npm run health:selectors -- --dry-run --scope countries --scope leagues --scope seasons --generic` passed.
- ✅ `npm run health:selectors -- --scope countries --generic --quiet` passed.
- ✅ `npm run health:selectors -- --scope leagues --generic --quiet` passed.
- ✅ `npm run health:selectors -- --scope seasons --generic --quiet` passed.

---
*Phase: 09-generic-selector-workflow-and-fallback-hardening*
*Completed: 2026-03-01*

## Self-Check
All checks passed.

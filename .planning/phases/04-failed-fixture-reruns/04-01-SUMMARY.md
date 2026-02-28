---
phase: 04-failed-fixture-reruns
plan: "01"
subsystem: testing
tags: [smoke, rerun, artifacts, cli]
requires:
  - phase: 03-02
    provides: smoke-artifact-and-schema-gated-smoke-foundation
provides:
  - artifact parser for failed-fixture rerun selection
  - rerun CLI contract with explicit flag validation
  - canonical fixture-id helper for rerun candidate validation
affects: [04-02-rerun-orchestration, smoke-incident-recovery]
tech-stack:
  added: []
  patterns: [artifact-preflight-validation, deterministic-failed-fixture-selection]
key-files:
  created:
    - src/reliability/smoke/rerun-fixtures.js
  modified:
    - src/cli/arguments/index.js
    - src/reliability/smoke/fixture-matrix.js
key-decisions:
  - "Rerun candidate selection must come only from artifact fixtures[] fail entries, not from synthetic issues[] entries"
  - "CLI rejects ambiguous rerun combinations (--rerun-failed with --fixture) to keep operator intent explicit"
patterns-established:
  - "Rerun preflight returns structured diagnostics with selected, ignored, and invalid fixture identifiers"
  - "Canonical matrix fixture IDs are exported for validation of artifact-derived candidates"
requirements-completed:
  - RELY-07
duration: 1 min
completed: 2026-02-28
---

# Phase 4 Plan 1: Failed Fixture Selection Foundation Summary

**Failed-fixture rerun preflight is now deterministic, validating artifact input and returning explicit fixture selection diagnostics before execution starts.**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-28T19:48:51Z
- **Completed:** 2026-02-28T19:49:42Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Added a dedicated rerun artifact helper that validates artifact path, file readability, JSON parsing, and required `fixtures[]` structure.
- Implemented failed-fixture selection that excludes pass statuses, de-duplicates IDs, ignores synthetic pseudo-failures, and reports invalid/unknown entries.
- Extended smoke CLI argument parsing with `--rerun-failed` and `--artifact`, plus explicit validation to prevent ambiguous rerun invocation.

## Task Commits

1. **Task 1: Add artifact-driven rerun fixture selector helpers** - `a2ec251` (feat)
2. **Task 2: Extend smoke argument parsing with rerun flags** - `7551d3f` (feat)
3. **Task 3: Expose fixture identity helper(s) for rerun validation** - `ce62010` (feat)

## Files Created/Modified
- `src/reliability/smoke/rerun-fixtures.js` - Loads/validates smoke artifacts and derives failed fixture rerun candidates with diagnostics.
- `src/cli/arguments/index.js` - Adds rerun flags and validation rules for explicit rerun mode behavior.
- `src/reliability/smoke/fixture-matrix.js` - Exports canonical fixture IDs used to validate rerun candidates.

## Decisions Made
- Treat missing/invalid artifact conditions as structured preflight failures instead of implicit fallbacks.
- Keep rerun selection logic isolated from script orchestration so preflight behavior is testable and reusable.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan `04-02` can now inject rerun preflight output into smoke execution flow.
- Rerun preflight diagnostics are available to support operator-facing fallback messaging.

## Self-Check
- ✅ `node --check src/reliability/smoke/rerun-fixtures.js src/reliability/smoke/fixture-matrix.js src/cli/arguments/index.js` passed.
- ✅ `node -e "import('./src/reliability/smoke/rerun-fixtures.js').then(m=>{if(!m)process.exit(1);}).catch(()=>process.exit(1));"` passed.
- ✅ `node -e "import('./src/cli/arguments/index.js').then(m=>{const o=m.parseSmokeReliabilityArguments(['--rerun-failed']);if(!o.rerunFailed)process.exit(1);}).catch(()=>process.exit(1));"` passed.

---
*Phase: 04-failed-fixture-reruns*
*Completed: 2026-02-28*

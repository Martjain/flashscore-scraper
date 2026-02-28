---
phase: 06-rotating-regional-matrix
plan: "01"
subsystem: reliability
tags: [smoke, matrix, rotation, cli]
requires:
  - phase: 05-02
    provides: end-of-run-smoke-alert-integration-and-ci-ops-surface
provides:
  - deterministic region-aware fixture selector with extended rotation mode
  - smoke CLI parsing for matrix mode and rotation key controls
  - smoke run output selection provenance for reproducible reruns
affects: [06-02-scheduled-extended-coverage, phase-06-verification]
tech-stack:
  added: []
  patterns: [deterministic-region-rotation-selection, selection-provenance-artifact-block]
key-files:
  created: []
  modified:
    - src/reliability/smoke/fixture-matrix.js
    - src/cli/arguments/index.js
    - src/reliability/smoke/run-smoke-suite.js
key-decisions:
  - "Extended selection is deterministic via stable rotation-key hashing into ordered region slots"
  - "Explicit fixture targeting always overrides matrix mode to preserve existing operator precedence"
  - "Smoke results expose a dedicated selection block (mode, rotation key, region token, fixture IDs, reason)"
patterns-established:
  - "Selector helpers return fixtures plus selection metadata so runners can persist provenance without duplicating logic"
  - "CLI matrix controls validate strictly and fail fast on unsupported values"
requirements-completed:
  - RELY-09
duration: 2 min
completed: 2026-02-28
---

# Phase 6 Plan 1: Deterministic Regional Selection Foundation Summary

**Smoke reliability selection now supports deterministic region rotation with strict matrix-mode CLI controls and artifact-ready selection provenance metadata.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-28T21:09:12Z
- **Completed:** 2026-02-28T21:10:57Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Added region metadata to the smoke fixture matrix and implemented deterministic extended-mode region rotation keyed by a rotation token.
- Extended smoke argument parsing with validated `--matrix-mode` and `--rotation-key`, plus environment-backed defaults.
- Wired selection metadata into `runSmokeSuite` output so artifacts include reproducible fixture/region provenance.

## Task Commits

1. **Task 1: Add region metadata and deterministic rotation helpers to smoke matrix** - `986d0dd` (feat)
2. **Task 2: Parse matrix-mode and rotation inputs with strict argument compatibility** - `56fcf82` (feat)
3. **Task 3: Apply region-aware selection in runner and persist selection provenance** - `d6d0743` (feat)

## Files Created/Modified
- `src/reliability/smoke/fixture-matrix.js` - Adds region IDs, deterministic extended selection, and structured selection metadata.
- `src/cli/arguments/index.js` - Adds strict smoke matrix option parsing with env-default support.
- `src/reliability/smoke/run-smoke-suite.js` - Applies matrix selection policy and persists `selection` provenance in run output.

## Decisions Made
- Keep default-mode and explicit fixture selection behavior backward-compatible and bounded.
- Use an ordered-region rotation slot derived from a stable hash of `rotationKey` for deterministic regional sampling.
- Keep selection metadata as a first-class result block to simplify scheduled debugging and rerun reproducibility.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Wave 2 can now thread matrix/rotation controls through entrypoint and CI schedule wiring without changing local defaults.
- Selection metadata contract is available for workflow and README documentation.

## Validation Evidence
- ✅ `node --check src/reliability/smoke/fixture-matrix.js src/cli/arguments/index.js src/reliability/smoke/run-smoke-suite.js` passed.
- ✅ `node -e "import('./src/reliability/smoke/fixture-matrix.js').then(({selectSmokeFixtures})=>{const one=selectSmokeFixtures({sample:2,matrixMode:'extended',rotationKey:'2026-W09'}).map((f)=>f.fixtureId).join(',');const two=selectSmokeFixtures({sample:2,matrixMode:'extended',rotationKey:'2026-W09'}).map((f)=>f.fixtureId).join(',');if(one!==two)process.exit(1);}).catch(()=>process.exit(1));"` passed.
- ✅ `node -e "import('./src/reliability/smoke/run-smoke-suite.js').then(async ({runSmokeSuite})=>{const r=await runSmokeSuite({dryRun:true,sample:2,matrixMode:'extended',rotationKey:'2026-W09'});if(!r.selection||!r.selection.rotationKey||!Array.isArray(r.selection.fixtureIds))process.exit(1);}).catch(()=>process.exit(1));"` passed.

---
*Phase: 06-rotating-regional-matrix*
*Completed: 2026-02-28*

## Self-Check
All checks passed.

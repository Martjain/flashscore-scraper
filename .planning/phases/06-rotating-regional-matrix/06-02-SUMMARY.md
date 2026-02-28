---
phase: 06-rotating-regional-matrix
plan: "02"
subsystem: reliability
tags: [smoke, ci, workflow, matrix, rotation]
requires:
  - phase: 06-01
    provides: deterministic-region-selection-and-selection-provenance-contract
provides:
  - smoke entrypoint forwarding of matrix mode and rotation key controls
  - scheduled CI extended regional rotation with ISO-week deterministic keys
  - operator documentation for extended mode reproducibility and artifact provenance
affects: [phase-06-verification, reliability-operations-runbook]
tech-stack:
  added: []
  patterns: [schedule-only-extended-default, env-driven-matrix-selection-controls]
key-files:
  created: []
  modified:
    - scripts/smoke-reliability.mjs
    - .github/workflows/reliability-smoke.yml
    - README.md
    - src/reliability/smoke/fixture-matrix.js
key-decisions:
  - "Scheduled workflow sets extended mode + ISO week rotation key while dispatch/manual defaults remain bounded"
  - "Matrix and rotation controls flow through env + CLI consistently to keep schedule and local behavior reproducible"
  - "Run summaries explicitly print selection provenance for quick operator triage"
patterns-established:
  - "Schedule path drives coverage expansion via env defaults rather than hardcoded script behavior"
  - "Smoke artifacts and console output expose consistent deterministic selection provenance"
requirements-completed:
  - RELY-09
duration: 2 min
completed: 2026-02-28
---

# Phase 6 Plan 2: Scheduled Extended Matrix Integration Summary

**Scheduled reliability smoke now runs deterministic extended regional rotation while manual/default smoke behavior stays bounded and artifact metadata remains reproducible.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-28T21:12:33Z
- **Completed:** 2026-02-28T21:14:15Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Updated smoke entrypoint orchestration to forward matrix mode and rotation key options and print selection provenance in non-quiet output.
- Updated CI reliability workflow so scheduled runs force extended mode with deterministic ISO-week rotation while workflow dispatch remains bounded by default.
- Expanded README guidance with default vs extended mode controls, reproducibility knobs, and selection metadata contract details.

## Task Commits

1. **Task 1: Thread matrix mode and rotation controls through smoke entrypoint** - `79b7f1a` (feat)
2. **Task 2: Enable scheduled extended matrix coverage with deterministic rotation keying** - `22d6806` (feat)
3. **Task 3: Document extended regional mode and artifact reproducibility contract** - `2c95db4` (docs)

## Files Created/Modified
- `scripts/smoke-reliability.mjs` - Forwards matrix settings, preserves exit semantics, and prints selection metadata for operators.
- `.github/workflows/reliability-smoke.yml` - Adds matrix mode/rotation controls and schedule-specific extended-mode env wiring.
- `README.md` - Documents bounded default mode, extended deterministic rotation mode, and selection artifact fields.
- `src/reliability/smoke/fixture-matrix.js` - Includes null-safe normalization fix discovered during verification.

## Decisions Made
- Keep extended mode opt-in for manual runs and enforce it only on scheduled coverage runs.
- Use ISO-week token (`%G-W%V`) as schedule rotation key to keep weekly regional coverage deterministic.
- Keep selection provenance visible in both artifact JSON and non-quiet console output for direct run triage.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Null rotation key caused default dry-run runner failure**
- **Found during:** Verification checks after Task 3
- **Issue:** `rotationKey=null` reached normalization logic that called `.toString()` on `null`, producing `RESULT: fail` in default dry-run.
- **Fix:** Made matrix mode/rotation normalization null-safe in fixture-matrix selectors.
- **Files modified:** `src/reliability/smoke/fixture-matrix.js`
- **Verification:** Re-ran full Plan 06-02 verification suite (dry-run default + extended + artifact assertion + grep checks).
- **Committed in:** `3b8b4ac`

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Correctness fix only, no scope expansion; restored expected bounded default execution behavior.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 6 implementation is complete and ready for phase-goal verification.
- Scheduled CI can now expand regional coverage deterministically while local/manual runs stay fast and bounded.

## Validation Evidence
- ✅ `node --check scripts/smoke-reliability.mjs` passed.
- ✅ `RELEVANT=1 npm run smoke:reliability -- --dry-run --sample 2 --quiet` passed (`RESULT: pass`).
- ✅ `RELIABILITY_SMOKE_MATRIX_MODE=extended RELIABILITY_SMOKE_ROTATION_KEY=2026-W09 npm run smoke:reliability -- --dry-run --sample 2 --report /tmp/smoke-extended-phase6.json --quiet` passed (`RESULT: pass`).
- ✅ `node -e "const fs=require('fs');const r=JSON.parse(fs.readFileSync('/tmp/smoke-extended-phase6.json','utf8'));if(!r.selection||r.selection.mode!=='extended'||!Array.isArray(r.selection.fixtureIds))process.exit(1);"` passed.
- ✅ `rg -n "RELIABILITY_SMOKE_MATRIX_MODE|RELIABILITY_SMOKE_ROTATION_KEY|extended|rotation|selection" .github/workflows/reliability-smoke.yml README.md scripts/smoke-reliability.mjs` passed.

---
*Phase: 06-rotating-regional-matrix*
*Completed: 2026-02-28*

## Self-Check
All checks passed.

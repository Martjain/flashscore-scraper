---
phase: 04-failed-fixture-reruns
plan: "02"
subsystem: ci
tags: [smoke, rerun, ci, github-actions]
requires:
  - phase: 04-01
    provides: artifact-rerun-selector-and-rerun-cli-contract
provides:
  - rerun-failed orchestration path in smoke runner script
  - CI-safe rerun preflight failure handling with manual fallback guidance
  - documented local and workflow-dispatch rerun operations
affects: [phase-04-verification, reliability-incident-recovery]
tech-stack:
  added: []
  patterns: [rerun-preflight-before-browser, artifact-backed-rerun-dispatch]
key-files:
  created: []
  modified:
    - scripts/smoke-reliability.mjs
    - README.md
    - .github/workflows/reliability-smoke.yml
key-decisions:
  - "Rerun mode executes with mode metadata set to `rerun-failed` while preserving the existing smoke artifact contract"
  - "Rerun preflight failures always persist a fail artifact and include operator remediation guidance"
  - "Workflow dispatch routes rerun and fixture modes as mutually exclusive to avoid ambiguous selection intent"
patterns-established:
  - "Smoke orchestration resolves rerun fixture IDs before browser launch and passes filtered IDs through existing runner flow"
  - "Preflight failure artifacts include rerun diagnostics and explicit fallback command guidance"
requirements-completed:
  - RELY-07
duration: 1 min
completed: 2026-02-28
---

# Phase 4 Plan 2: Rerun Orchestration and Ops Surface Summary

**Smoke reliability now supports artifact-driven failed-fixture reruns end-to-end, including CI-safe preflight failures and workflow dispatch controls for operators.**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-28T19:55:15Z
- **Completed:** 2026-02-28T19:55:46Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Wired `--rerun-failed` orchestration into `scripts/smoke-reliability.mjs`, resolving failed fixture IDs from artifact preflight before running `runSmokeSuite`.
- Added explicit rerun preflight error paths (missing artifact, invalid payload, no rerunnable failures) with manual `--fixture` fallback guidance and non-zero exits.
- Updated README and GitHub workflow dispatch inputs for routine operator rerun usage with optional artifact override.

## Task Commits

1. **Task 1: Inject rerun-failed selection into smoke script orchestration** - `a38b130` (feat)
2. **Task 2: Add CI-safe rerun error handling and fallback guidance** - `7f63be2` (fix)
3. **Task 3: Document rerun mode and expose workflow-dispatch controls** - `68c1021` (docs)

## Files Created/Modified
- `scripts/smoke-reliability.mjs` - Integrates rerun selection, mode metadata, preflight failure handling, and fallback diagnostics.
- `README.md` - Documents rerun commands, artifact override usage, and failure/fallback expectations.
- `.github/workflows/reliability-smoke.yml` - Adds `rerun_failed` and `artifact` workflow dispatch inputs and routing logic.

## Decisions Made
- Keep rerun flow on top of the existing smoke execution/reporting pipeline to preserve artifact schema and CI semantics.
- Fail rerun preflight immediately with remediation guidance instead of silently falling back to default fixture sample.
- In rerun mode, ensure all failed fixture IDs from artifact selection are executed (not truncated by sample defaults).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Rerun selection could be truncated by sample defaults**
- **Found during:** Task 1 (rerun orchestration wiring)
- **Issue:** `runSmokeSuite` applies sample bounds when `fixtureIds` are provided, which could skip some failed artifact fixtures.
- **Fix:** In rerun mode, script now raises execution sample size to include the full selected failed fixture set.
- **Files modified:** `scripts/smoke-reliability.mjs`
- **Verification:** `npm run smoke:reliability -- --dry-run --rerun-failed` executed selected rerun fixture IDs without truncation.
- **Committed in:** `a38b130`

---

**Total deviations:** 1 auto-fixed (1 Rule 1 bug)
**Impact on plan:** Fix was required for correctness of failed-only rerun semantics and did not change scope.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 4 implementation is complete and ready for phase-level verification.
- Requirement `RELY-07` behavior is wired, documented, and operational for local + workflow dispatch runs.

## Self-Check
- ✅ `node --check scripts/smoke-reliability.mjs` passed.
- ✅ `npm run smoke:reliability -- --dry-run --rerun-failed` passed with a valid failed-fixture artifact.
- ✅ `npm run smoke:reliability -- --dry-run --rerun-failed --artifact /tmp/non-existent-smoke-artifact.json` returned non-zero with fallback guidance.
- ✅ `test -f .planning/artifacts/smoke/latest.json` passed.
- ✅ `rg -n "rerun|--rerun-failed|--artifact" README.md .github/workflows/reliability-smoke.yml scripts/smoke-reliability.mjs` passed.

---
*Phase: 04-failed-fixture-reruns*
*Completed: 2026-02-28*

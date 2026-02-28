---
phase: 02-selector-health-contracts
plan: "01"
subsystem: scraper
tags: [selector-health, fallback, diagnostics, playwright]
requires: []
provides:
  - immutable selector contract registry for critical scraping scopes
  - deterministic selector resolver with fallback index telemetry
  - contract-driven selector resolution across critical scraper services
affects: [02-02-health-check-command, phase-03-smoke-automation]
tech-stack:
  added: []
  patterns: [selector-contract-registry, deterministic-fallback-resolution]
key-files:
  created:
    - src/selector-health/contracts/keys.js
    - src/selector-health/contracts/index.js
    - src/selector-health/probe/resolveSelector.js
    - src/selector-health/probe/collectProbeDiagnostics.js
  modified:
    - src/scraper/services/countries/index.js
    - src/scraper/services/leagues/index.js
    - src/scraper/services/seasons/index.js
    - src/scraper/services/matches/index.js
key-decisions:
  - "Use a shared contract registry with max-two-fallback chains to keep selector drift handling deterministic"
  - "Attach selector diagnostics as non-enumerable properties so runtime telemetry is available without schema regressions"
  - "Reuse one resolver path for both production scraping and future health-check probing"
patterns-established:
  - "Critical selectors resolved through contracts, never hardcoded arrays per service"
  - "Fallback usage always includes matched selector index telemetry"
requirements-completed:
  - RELY-01
  - RELY-02
duration: 12 min
completed: 2026-02-28
---

# Phase 2 Plan 1: Selector Contract Foundation Summary

**Selector contracts, deterministic fallback resolution, and diagnostics wiring are now centralized across critical discovery and match extraction services.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-02-28T04:27:58Z
- **Completed:** 2026-02-28T04:39:43Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments
- Added a single immutable contract registry for countries, leagues, seasons, match-list, and match-detail selector surfaces.
- Implemented deterministic selector resolution with explicit primary/fallback index and structured miss diagnostics.
- Rewired countries/leagues/seasons/matches services to consume contracts while preserving existing extraction outputs.

## Task Commits

1. **Task 1: Create critical selector contract registry and key catalog** - `7552df8` (feat)
2. **Task 2: Implement shared selector resolver with deterministic fallback telemetry** - `6a506d3` (feat)
3. **Task 3: Wire contract resolver into critical scraper services** - `cd6a0f8` (feat)

## Files Created/Modified
- `src/selector-health/contracts/keys.js` - Canonical scope and contract-key constants for critical selector coverage.
- `src/selector-health/contracts/index.js` - Immutable selector contracts with intent metadata and lookup helpers.
- `src/selector-health/probe/resolveSelector.js` - Ordered selector resolver that tracks matched selector index and failure reason.
- `src/selector-health/probe/collectProbeDiagnostics.js` - Structured diagnostics and probe outcome helpers.
- `src/scraper/services/countries/index.js` - Contract-driven country selector resolution with diagnostics attachment.
- `src/scraper/services/leagues/index.js` - Contract-driven league selector resolution scoped by country slug.
- `src/scraper/services/seasons/index.js` - Contract-driven season archive selector resolution.
- `src/scraper/services/matches/index.js` - Contract-driven match-list/detail selector resolution with telemetry hooks.

## Decisions Made
- Preserve public scraper service signatures; telemetry is attached as non-enumerable metadata.
- Keep fallback chains capped at three ordered candidates (primary + two fallbacks).
- Standardize selector resolution through one utility so health-check and runtime scraping use identical logic.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Critical selector contracts and resolver primitives are ready for health-check command orchestration.
- Phase `02-02` can now build strict/default pass-fail behavior and report retention on top of shared resolver outputs.

## Self-Check
- ✅ `node --check src/selector-health/contracts/keys.js src/selector-health/contracts/index.js` passed.
- ✅ `node --check src/selector-health/probe/resolveSelector.js src/selector-health/probe/collectProbeDiagnostics.js` passed.
- ✅ `node --check src/scraper/services/countries/index.js src/scraper/services/leagues/index.js src/scraper/services/seasons/index.js src/scraper/services/matches/index.js` passed.

---
*Phase: 02-selector-health-contracts*
*Completed: 2026-02-28*

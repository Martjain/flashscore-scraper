---
phase: 09-generic-selector-workflow-and-fallback-hardening
plan: "02"
subsystem: scraping
tags: [selector-contracts, countries, leagues, seasons, fallbacks]
requires:
  - phase: 09-01
    provides: generic selector-health mode and representative-path metadata
provides:
  - broadened country discovery from contract + soccer-link fallback sources
  - league/season extraction with resilient fallback selector passes
  - tightened league selector contract specificity with preserved resilience
affects: [selector-health-coverage, generic-discovery-chain, phase-09-verification]
tech-stack:
  added: []
  patterns: [primary-then-fallback-extraction, route-segment-filtered-discovery, contract-specificity-with-resilience]
key-files:
  created: []
  modified:
    - src/scraper/services/countries/index.js
    - src/scraper/services/leagues/index.js
    - src/scraper/services/seasons/index.js
    - src/selector-health/contracts/index.js
key-decisions:
  - "Country discovery merges strict contract extraction with broad `/soccer/` fallback anchors, deduped by slug"
  - "League and season services keep generic route-segment filtering and add fallback selector passes only when primary extraction is empty"
  - "League selector contract now prioritizes `leftMenu__href` anchors to reduce false positives from non-league links"
patterns-established:
  - "Discovery services return selector diagnostics while remaining resilient to menu/container layout drift"
  - "Fallback collection is additive and filtered by path semantics instead of page-specific entity lists"
requirements-completed:
  - SCRP-01
  - RELY-01
  - RELY-02
duration: 14 min
completed: 2026-03-01
---

# Phase 9 Plan 2: Generic Discovery Fallback Hardening Summary

**Country, league, and season discovery now maintain broad generic coverage under layout drift by combining contract selectors with filtered fallback collection and tightened league contract anchors.**

## Performance

- **Duration:** 14 min
- **Started:** 2026-03-01T18:46:00Z
- **Completed:** 2026-03-01T19:00:00Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Expanded country discovery to merge contract results with broad `/soccer/` anchor fallback while enforcing country-level route filtering.
- Added fallback extraction paths for leagues and seasons when primary selector output is empty, preserving generic filtering semantics.
- Tightened league selector contract candidates to league-specific left-menu anchors and validated representative extraction behavior.

## Task Commits

1. **Task 1-3 (consolidated): Countries/leagues/seasons fallback hardening + contract refinement** - `7fa8353` (fix)

## Files Created/Modified
- `src/scraper/services/countries/index.js` - Merges primary and fallback anchor sources, deduplicates countries by slug, and preserves diagnostics attachment.
- `src/scraper/services/leagues/index.js` - Adds primary-first then fallback selector passes while keeping strict country route filtering.
- `src/scraper/services/seasons/index.js` - Merges primary and fallback season anchors with sport/country/league filtering safeguards.
- `src/selector-health/contracts/index.js` - Narrows league contract selectors to league-specific anchor patterns.

## Decisions Made
- Consolidated plan tasks into one commit because the workspace already had integrated wave-2 edits spanning all hardening files.
- Kept fallback logic constrained by route-segment filtering to avoid widening extraction to unrelated entities.
- Retained existing diagnostics behavior so selector-health analysis continues to capture contract/fallback behavior consistently.

## Deviations from Plan

None - plan objectives were implemented as specified; commit granularity was consolidated due existing local integrated edits.

## Issues Encountered
- End-to-end Playwright runtime chain command required elevated permissions outside the sandbox because Chromium launch was blocked in sandbox mode.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Generic selector health workflows can now rely on broader country/league/season entity discovery under UI variation.
- Phase-level verification can validate SCRP-01/RELY-01/RELY-02 against both selector-health and discovery-service artifacts.

## Validation Evidence
- ✅ `node --check src/scraper/services/countries/index.js src/scraper/services/leagues/index.js src/scraper/services/seasons/index.js src/selector-health/contracts/index.js` passed.
- ✅ `npm run health:selectors -- --scope leagues --sample 2 --quiet` passed.
- ✅ `node --input-type=module -e "...getListOfCountries/getListOfLeagues/getListOfSeasons runtime chain..."` passed (elevated run).

---
*Phase: 09-generic-selector-workflow-and-fallback-hardening*
*Completed: 2026-03-01*

## Self-Check
All checks passed.

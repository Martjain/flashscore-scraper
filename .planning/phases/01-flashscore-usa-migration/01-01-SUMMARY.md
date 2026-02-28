---
phase: 01-flashscore-usa-migration
plan: "01"
subsystem: scraper
tags: [flashscoreusa, playwright, selectors, scraping]
requires: []
provides:
  - flashscoreusa.com domain routing across CLI and scraper services
  - resilient country/league/season discovery selectors for USA pages
  - hardened match link/detail extraction with defensive URL/id handling
affects: [01-02-schema-validation, output-writers]
tech-stack:
  added: []
  patterns: [selector-fallbacks, defensive-match-parsing]
key-files:
  created: []
  modified:
    - src/constants/index.js
    - src/cli/prompts/index.js
    - src/scraper/services/countries/index.js
    - src/scraper/services/leagues/index.js
    - src/scraper/services/seasons/index.js
    - src/scraper/services/matches/index.js
key-decisions:
  - "Use https://www.flashscoreusa.com as the canonical origin and build league URLs from normalized path segments"
  - "Resolve discovery data from /football routes with fallback selectors rather than rigid DOM chains"
  - "Treat missing match URL/mid as non-fatal and return stable empty payloads"
patterns-established:
  - "Country/league/season extraction from href path segments to keep id/url contracts stable"
  - "Match IDs parsed from generic g_<sport>_ prefixes plus URL mid fallback"
requirements-completed:
  - CORE-01
  - SCRP-01
  - SCRP-02
duration: 11 min
completed: 2026-02-28
---

# Phase 1 Plan 1: USA Domain and Selector Migration Summary

**Flashscore USA routing and selector migration with resilient discovery and hardened match extraction across core scraping services.**

## Performance

- **Duration:** 11 min
- **Started:** 2026-02-28T03:18:35Z
- **Completed:** 2026-02-28T03:29:23Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- Switched runtime domain routing to `https://www.flashscoreusa.com` and normalized direct league URL composition.
- Reworked countries/leagues/seasons discovery to use USA-compatible selectors and path-derived identifiers.
- Hardened match extraction for missing URL/mid edge cases and validated discovery-to-match-link flow via targeted smoke execution.

## Task Commits

1. **Task 1: Switch base domain and harden route composition** - `096c60e` (feat)
2. **Task 2: Update discovery selectors for countries, leagues, and seasons** - `97ab6cd` (feat)
3. **Task 3: Update match selectors and protect stats URL flow** - `224c244` (fix)
4. **Deviation fix: runtime selector regression from smoke test** - `a607675` (fix)

## Files Created/Modified
- `src/constants/index.js` - Migrated base domain to Flashscore USA.
- `src/cli/prompts/index.js` - Added normalized league URL builder for direct CLI flow.
- `src/scraper/services/countries/index.js` - Country discovery from `/football/` with fallback link extraction.
- `src/scraper/services/leagues/index.js` - Country-scoped league extraction and Playwright-safe evaluate argument passing.
- `src/scraper/services/seasons/index.js` - Archive-season extraction with fallback selectors.
- `src/scraper/services/matches/index.js` - Defensive match ID/url parsing and fallback match payload behavior.

## Decisions Made
- Used `/football/` as country discovery entrypoint because homepage does not expose country links.
- Kept service return contracts stable while deriving IDs from URL slugs where needed.
- Added defensive fallback payloads to keep batch runs alive on malformed match entries.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Country discovery opened wrong route**
- **Found during:** Task 3 verification smoke run
- **Issue:** Opening homepage returned only top-level football links, causing country lookup failures.
- **Fix:** Switched country discovery entrypoint to `${BASE_URL}/football/`.
- **Files modified:** `src/scraper/services/countries/index.js`
- **Verification:** Targeted smoke run resolved country list and selected USA successfully.
- **Committed in:** `a607675`

**2. [Rule 1 - Bug] League extraction evaluate call exceeded Playwright argument limit**
- **Found during:** Task 3 verification smoke run
- **Issue:** `page.evaluate` was called with two positional arguments.
- **Fix:** Passed `countrySlug` and `selectors` as a single object argument.
- **Files modified:** `src/scraper/services/leagues/index.js`
- **Verification:** Discovery chain smoke run completed countries → leagues → seasons.
- **Committed in:** `a607675`

**3. [Rule 1 - Bug] Match ID parsing assumed hardcoded `g_1_` prefix**
- **Found during:** Task 3 verification smoke run
- **Issue:** USA match rows use sport-specific prefixes such as `g_5_`, causing missing IDs.
- **Fix:** Parsed IDs using generic `g_<number>_` prefix regex.
- **Files modified:** `src/scraper/services/matches/index.js`
- **Verification:** NFL results extraction returned 335 links with valid IDs.
- **Committed in:** `a607675`

---

**Total deviations:** 3 auto-fixed (3 Rule 1 bugs)
**Impact on plan:** All fixes were correctness-critical and directly improved runtime stability without scope creep.

## Issues Encountered
- Initial full smoke run used unsupported `country=england` for flashscoreusa country list and exposed discovery-route assumptions.
- Long-running full scrape was intentionally terminated after flow validation to avoid unnecessary full dataset processing during plan verification.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Core domain/selector migration is complete and runtime discovery flow is validated.
- Ready for Plan `01-02` (schema compatibility validator and documentation wiring).

## Self-Check
- ✅ `node --check` passed for all migrated files.
- ✅ `rg -n "flashscoreusa.com" src/` confirms USA domain usage.
- ✅ Targeted smoke run reached country/league/season flow and extracted NFL match links.

---
*Phase: 01-flashscore-usa-migration*
*Completed: 2026-02-28*

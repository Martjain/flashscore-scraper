# Phase 1: Flashscore USA Migration - Context

**Gathered:** 2026-02-28
**Status:** Ready for planning
**Source:** User request + brownfield codebase map

<domain>
## Phase Boundary

Migrate the scraper from `https://www.flashscore.com` to `https://www.flashscoreusa.com` and update selector logic so country/league/season and match extraction work reliably on the USA site. Preserve current CLI behavior and output schema.

</domain>

<decisions>
## Implementation Decisions

### Locked Decisions
- Use `https://www.flashscoreusa.com` as the scraping base domain.
- Update selectors based on the USA website DOM.
- Keep output data structure backward compatible (`matchId`, `stage`, `date`, `status`, `home`, `away`, `result`, `information`, `statistics`).
- Keep current CLI argument contract and runtime flow.

### Claude's Discretion
- Exact selector strategy (single selector vs selector fallback arrays).
- Whether to add lightweight validation/smoke scripts to guard compatibility.
- Small internal refactors that improve resilience without changing public behavior.

</decisions>

<specifics>
## Specific Ideas

- Base URL is currently defined at `src/constants/index.js` and must change.
- Discovery selectors live in:
  - `src/scraper/services/countries/index.js`
  - `src/scraper/services/leagues/index.js`
  - `src/scraper/services/seasons/index.js`
- Match selectors live in `src/scraper/services/matches/index.js`.
- URL composition for direct league links is in `src/cli/prompts/index.js`.

</specifics>

<deferred>
## Deferred Ideas

- Full architecture rewrite of scraping modules.
- Multi-sport support.
- Major CLI UX redesign.

</deferred>

---

*Phase: 01-flashscore-usa-migration*
*Context gathered: 2026-02-28 via user request*

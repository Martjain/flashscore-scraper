# FlashscoreScraping

## What This Is

FlashscoreScraping is a Node.js CLI scraper that collects football match data from Flashscore pages using Playwright. It guides users through country/league/season selection (or accepts CLI args) and exports structured match data to JSON or CSV files. The current milestone focuses on migrating to Flashscore USA while preserving current behavior and output compatibility.

## Core Value

Users can reliably extract structured league match results and statistics from Flashscore pages into reusable local data files.

## Requirements

### Validated

- ✓ User can run a CLI flow to select file type, country, league, and season — existing
- ✓ User can scrape fixtures and results lists, then fetch per-match summary and statistics — existing
- ✓ User can export data as JSON, JSON array, or CSV in `src/data` — existing

### Active

- [ ] Scraper uses `https://www.flashscoreusa.com` as the base domain across the scraping flow
- [ ] DOM selectors and navigation logic are updated so country/league/season and match scraping work on the USA site
- [ ] Existing output shape (match metadata, information, statistics, file formats) remains backward compatible

### Out of Scope

- Multi-sport expansion beyond the current football flow — outside this migration scope
- Rewriting the scraper into a different runtime/framework — unnecessary for this targeted reliability migration

## Context

- Brownfield JavaScript project using Node.js + Playwright, documented in `.planning/codebase/*.md`.
- No official Flashscore API is used; extraction depends on page structure and selectors.
- Existing architecture is a monolithic CLI orchestrator with dedicated scraper service modules.
- Current request is to migrate domain and selectors to `flashscoreusa.com` because it is more reliable for scraping.

## Constraints

- **Tech Stack**: Keep ESM Node.js + Playwright implementation — avoid disruptive stack changes.
- **Compatibility**: Preserve current CLI arguments and output file formats — existing usage scripts must continue to work.
- **Data Integrity**: Maintain existing match object schema — downstream consumers rely on current fields.
- **Execution Model**: Keep concurrency and save-interval behavior — large scrape jobs depend on this performance profile.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use `https://www.flashscoreusa.com` as the canonical base domain | User reports higher reliability for the target workload | — Pending |
| Preserve current CLI UX and output schema during migration | Minimize breaking changes while improving scrape reliability | — Pending |

---
*Last updated: 2026-02-28 after initialization*

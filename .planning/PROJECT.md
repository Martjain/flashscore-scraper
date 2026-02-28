# FlashscoreScraping

## What This Is

FlashscoreScraping is a Node.js + Playwright CLI that scrapes soccer match data from Flashscore USA and exports structured outputs (JSON, JSON-array, CSV). It provides guided country/league/season selection and supports direct CLI arguments for scripted runs.

## Core Value

Users can reliably extract structured league match results and statistics into reusable local data files with stable schema contracts.

## Current State

- **Shipped milestone:** v1.0 Flashscore USA Migration (2026-02-28)
- **Runtime routing:** discovery and league flows use Flashscore USA soccer routes (`/soccer/...`)
- **Compatibility guardrail:** `npm run validate:schema` validates output shape after scraper changes
- **Known quality status:** season-selector cross-competition bug fixed and validated

## Requirements

### Validated

- ✓ **CORE-01**: Scraper uses `https://www.flashscoreusa.com` as base domain
- ✓ **SCRP-01**: Country/league/season discovery works on Flashscore USA soccer pages
- ✓ **SCRP-02**: Match listing and detail extraction (including statistics payload) works on USA pages
- ✓ **DATA-01**: JSON/JSON-array/CSV contract remains compatible for existing consumers

### Active

- [ ] **RELY-01**: Add selector health checks and fallback drift detection
- [ ] **RELY-02**: Add automated end-to-end smoke checks for representative leagues

### Out of Scope

- Multi-sport expansion beyond current soccer scope
- Rewriting scraper runtime/framework
- CLI redesign unrelated to reliability and compatibility goals

## Next Milestone Goals

1. Build proactive selector health checks so upstream DOM changes are detected early.
2. Add repeatable smoke tests that verify country→league→season→match flow and schema output.

## Context

- Codebase size: ~1200 LOC (`src/` + `scripts/` JavaScript modules)
- Architecture: CLI orchestration + service modules (`countries`, `leagues`, `seasons`, `matches`) + file writers
- Data integrity strategy: schema compatibility script + defensive writer normalization
- Planning artifacts: v1.0 roadmap and requirements archived under `.planning/milestones/`

## Constraints

- Keep ESM Node.js + Playwright stack
- Preserve CLI argument contract and output formats
- Keep match data object contract stable for downstream consumers
- Maintain concurrency/save-interval execution model

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use `https://www.flashscoreusa.com` as canonical origin | Better reliability and accessible soccer structure for target flow | ✓ Adopted in v1.0 |
| Use `/soccer/` routes (not `/football/`) on flashscoreusa | `/football/` maps to American football, while soccer competition data lives under `/soccer/` | ✓ Corrected and validated in v1.0 |
| Add schema validation command to workflow | Catch downstream contract drift early when selectors evolve | ✓ `validate:schema` shipped in v1.0 |
| Restrict season extraction to league archive selectors | Prevent global competition links from polluting season lists | ✓ Fixed with debug verification in v1.0 |

---
*Last updated: 2026-02-28 after v1.0 milestone completion*

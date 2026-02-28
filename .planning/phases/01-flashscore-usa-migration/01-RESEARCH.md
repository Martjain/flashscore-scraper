# Phase 1 Research: Flashscore USA Migration

**Date:** 2026-02-28
**Phase:** 1 - Flashscore USA Migration

## Objective

Identify the minimum safe migration approach for moving from `flashscore.com` to `flashscoreusa.com` while preserving scraper output compatibility.

## Findings

1. Domain binding is centralized but URL usage is distributed:
- `BASE_URL` in `src/constants/index.js`
- League season URL composition in `src/cli/prompts/index.js`
- Service-level navigation in `src/scraper/services/*`

2. Current selectors are brittle and deeply tied to specific DOM paths:
- Country/league extraction uses strict `#category-left-menu` selectors.
- Match extraction relies on tightly-coupled class selectors and positional text extraction.

3. Data output compatibility is currently implicit (no automated schema checks).
- Writers in `src/files/json/index.js` and `src/files/csv/index.js` assume extractor shape stability.

## Migration Guidance

- Switch base domain first, then update selectors in focused modules.
- Prefer selector fallback strategy for key DOM targets to reduce breakage risk.
- Add light automated checks for output shape compatibility to prevent silent schema drift.

## Validation Architecture

- Static validation:
  - `node --check` for modified source files.
  - `rg` checks to confirm domain migration and selector updates.
- Runtime smoke validation:
  - Run a limited scrape against one known league/season on USA domain.
  - Validate output keys for at least one match entry.
- Output compatibility checks:
  - Verify JSON/CSV writers still receive and persist expected keys.

## Risks

- USA site DOM may diverge unexpectedly by route (country menu vs match details).
- Overly strict selector replacements can still be fragile without fallback handling.

## Recommendation

Plan in two waves:
1. Domain + selector implementation.
2. Verification hardening (smoke checks + schema compatibility checks).

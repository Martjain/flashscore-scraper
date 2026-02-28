# Roadmap: FlashscoreScraping

## Overview

This roadmap delivers a focused brownfield migration so the scraper runs on Flashscore USA with updated selectors while preserving the existing CLI contract and output schema.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Flashscore USA Migration** - Switch base domain and update selectors for stable scraping compatibility

## Phase Details

### Phase 1: Flashscore USA Migration
**Goal**: Scraper reliably runs against Flashscore USA pages and returns backward-compatible output data.
**Depends on**: Nothing (first phase)
**Requirements**: [CORE-01, SCRP-01, SCRP-02, DATA-01]
**Success Criteria** (what must be TRUE):
  1. Running the CLI targets `https://www.flashscoreusa.com` across country/league/season/match scraping flow.
  2. Country, league, and season selection returns valid options from the USA site.
  3. Match links, summary data, and statistics are extracted successfully from the USA site.
  4. JSON, JSON-array, and CSV output structure remains compatible with existing fields.
**Plans**: TBD

Plans:
- [x] 01-01: Update base URL and discovery/match selectors for Flashscore USA DOM
- [x] 01-02: Validate extraction flow and preserve output schema compatibility

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 1.1 → 2 → 2.1 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Flashscore USA Migration | 2/2 | Complete | 2026-02-28 |

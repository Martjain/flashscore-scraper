# Roadmap: FlashscoreScraping

## Overview

Roadmap is milestone-oriented. Shipped milestone details are archived to keep this file focused on current and next execution phases.

## Milestones

- ✅ **v1.0 Flashscore USA Migration** - shipped 2026-02-28 ([archive](.planning/milestones/v1.0-ROADMAP.md))
- 📋 **v1.1 Reliability Hardening** - requirements and roadmap defined

## Proposed Roadmap

**2 phases** | **6 requirements mapped** | All covered ✓

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 2 | Selector Health Contracts | Detect selector drift early and provide actionable fallback diagnostics | RELY-01, RELY-02 | 4 |
| 3 | End-to-End Smoke Automation | Continuously verify extraction flow and schema contract in CI | RELY-03, RELY-04, RELY-05, RELY-06 | 5 |

## Phase Details

### Phase 2: Selector Health Contracts

**Goal:** Build an explicit selector contract + health-check mechanism so DOM drift is detected before full scraping runs.

**Requirements:** RELY-01, RELY-02

**Success criteria:**
1. A selector contract registry exists for critical country, league, season, and match extraction surfaces.
2. A health-check command runs probes for all critical selectors and exits non-zero on contract failures.
3. Fallback selectors are attempted in deterministic order and fallback usage is tracked.
4. Diagnostics output identifies failing selector keys and associated page context.

### Phase 3: End-to-End Smoke Automation

**Goal:** Automate representative extraction-path verification and enforce schema compatibility via local and CI smoke runs.

**Requirements:** RELY-03, RELY-04, RELY-05, RELY-06

**Success criteria:**
1. Smoke runner verifies country -> league -> season -> match extraction for a representative fixture matrix.
2. Smoke workflow includes `npm run validate:schema` as a required pass gate.
3. Smoke outputs a machine-readable artifact with per-fixture status and failure details.
4. CI workflow supports both manual dispatch and scheduled execution.
5. Default smoke runtime remains within an agreed budget suitable for routine CI use.

## Phases

<details>
<summary>✅ v1.0 Flashscore USA Migration (Phase 1) - SHIPPED 2026-02-28</summary>

- [x] Phase 1: Flashscore USA Migration (2/2 plans)
  - [x] 01-01: Update base URL and discovery/match selectors for Flashscore USA DOM
  - [x] 01-02: Validate extraction flow and preserve output schema compatibility

</details>

### 📋 v1.1 Reliability Hardening (In Progress)

- [x] Phase 2: Selector Health Contracts (2/2 plans) - completed 2026-02-28
  - [x] 02-01: Implement selector contract registry and fallback map
  - [x] 02-02: Implement health-check command with drift diagnostics artifact

- [ ] Phase 3: End-to-End Smoke Automation
  - [ ] 03-01: Build representative fixture smoke runner
  - [ ] 03-02: Integrate schema gate and CI schedule/manual workflow

## Progress

| Milestone | Status | Phases Complete | Shipped |
|-----------|--------|-----------------|---------|
| v1.0 Flashscore USA Migration | Complete | 1/1 | 2026-02-28 |
| v1.1 Reliability Hardening | In Progress | 1/2 | - |

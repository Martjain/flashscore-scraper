# Roadmap: FlashscoreScraping

## Overview

Roadmap is milestone-oriented. Shipped milestone details are archived to keep this file focused on current and next execution phases.

## Milestones

- ✅ **v1.0 Flashscore USA Migration** - shipped 2026-02-28 ([archive](.planning/milestones/v1.0-ROADMAP.md))
- ✅ **v1.1 Reliability Hardening** - shipped 2026-02-28 ([archive](.planning/milestones/v1.1-ROADMAP.md))
- 📋 **v1.2 Reliability Operations** - requirements and roadmap defined

## Proposed Roadmap

**3 phases** | **3 requirements mapped** | All covered ✓

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 4 | Failed Fixture Reruns | Complete    | 2026-02-28 | 4 |
| 5 | Reliability Failure Alerts | Send actionable chat/webhook alerts for smoke and selector-health failures | RELY-08 | 4 |
| 6 | Rotating Regional Matrix | Expand smoke coverage by region on schedule while preserving fast default CI smoke | RELY-09 | 4 |

## Phase Details

### Phase 4: Failed Fixture Reruns

**Goal:** Add artifact-driven failed-only rerun support so operators can recover quickly after partial smoke failures.

**Requirements:** RELY-07

**Success criteria:**
1. User can invoke smoke rerun mode that selects failed fixtures from `.planning/artifacts/smoke/latest.json`.
2. Rerun command ignores passed fixtures and executes only unresolved failures.
3. Rerun mode surfaces clear error when artifact is missing/invalid and provides manual fallback guidance.
4. Rerun results produce standard smoke artifact output and CI-compatible pass/fail exit codes.

### Phase 5: Reliability Failure Alerts

**Goal:** Add proactive failure notifications with enough context to triage without opening full logs.

**Requirements:** RELY-08

**Success criteria:**
1. Smoke and selector-health failures can trigger webhook notifications when configured.
2. Alert payload includes run ID, failure source, failed stage/scope, and affected fixture identifiers.
3. Success runs do not emit noisy routine alerts by default.
4. Alert send failures do not mask underlying smoke/health command exit status.

### Phase 6: Rotating Regional Matrix

**Goal:** Expand reliability coverage with deterministic regional rotation while keeping routine smoke runtime bounded.

**Requirements:** RELY-09

**Success criteria:**
1. Smoke fixture matrix supports region metadata and deterministic rotation selection.
2. Scheduled workflows can run extended regional coverage mode without changing default smoke mode behavior.
3. Default smoke command retains current bounded runtime profile for routine CI and local checks.
4. Extended run artifacts identify selected region/fixtures for reproducible debugging.

## Phases

<details>
<summary>✅ v1.0 Flashscore USA Migration (Phase 1) - SHIPPED 2026-02-28</summary>

- [x] Phase 1: Flashscore USA Migration (2/2 plans)
  - [x] 01-01: Update base URL and discovery/match selectors for Flashscore USA DOM
  - [x] 01-02: Validate extraction flow and preserve output schema compatibility

</details>

<details>
<summary>✅ v1.1 Reliability Hardening (Phases 2-3) - SHIPPED 2026-02-28</summary>

- [x] Phase 2: Selector Health Contracts (2/2 plans)
  - [x] 02-01: Implement selector contract registry and fallback map
  - [x] 02-02: Implement health-check command with drift diagnostics artifact

- [x] Phase 3: End-to-End Smoke Automation (2/2 plans)
  - [x] 03-01: Build representative fixture smoke runner
  - [x] 03-02: Integrate schema gate and CI schedule/manual workflow

</details>

### 📋 v1.2 Reliability Operations (Planned)

- [x] Phase 4: Failed Fixture Reruns (2/2 plans) (completed 2026-02-28)
  - [x] 04-01: Implement failed-fixture artifact parsing and rerun selection mode
  - [x] 04-02: Wire rerun mode into smoke command + CI-safe error handling

- [ ] Phase 5: Reliability Failure Alerts (1/2 plans)
  - [x] 05-01: Implement webhook alert publisher and normalized failure payload builder
  - [ ] 05-02: Integrate alert triggers into smoke + selector-health workflows

- [ ] Phase 6: Rotating Regional Matrix (0/2 plans)
  - [ ] 06-01: Extend fixture matrix with region metadata and deterministic rotation selector
  - [ ] 06-02: Add scheduled extended-matrix workflow mode with bounded default runtime

## Progress

| Milestone | Status | Phases Complete | Shipped |
|-----------|--------|-----------------|---------|
| v1.0 Flashscore USA Migration | Complete | 1/1 | 2026-02-28 |
| v1.1 Reliability Hardening | Complete | 2/2 | 2026-02-28 |
| v1.2 Reliability Operations | In Progress | 1/3 | - |

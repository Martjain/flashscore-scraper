# Roadmap: FlashscoreScraping

## Overview

Roadmap is milestone-oriented. Shipped milestone details are archived to keep this file focused on current and next execution phases.

## Milestones

- ✅ **v1.0 Flashscore USA Migration** - shipped 2026-02-28 ([archive](.planning/milestones/v1.0-ROADMAP.md))
- ✅ **v1.1 Reliability Hardening** - shipped 2026-02-28 ([archive](.planning/milestones/v1.1-ROADMAP.md))
- ✅ **v1.2 Reliability Operations** - shipped 2026-02-28 ([archive](.planning/milestones/v1.2-ROADMAP.md))
- 🚧 **v1.3 Reliability Signal Quality** - phases 7-8 (in progress)

## Proposed Roadmap

**2 phases** | **2 requirements mapped** | All covered ✓

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 7 | Alert Signal Controls | Add deduplication/cooldown controls so repeated identical failures do not flood operators | RELY-10 | 4 |
| 8 | 1/2 | In Progress|  | 4 |

## Phase Details

### Phase 7: Alert Signal Controls

**Goal:** Add deduplication/cooldown controls so repeated identical failures do not flood operators.

**Requirements:** RELY-10

**Success criteria:**
1. Operator can configure deduplication/cooldown behavior for alert emission.
2. Repeated identical failures inside the cooldown window are suppressed instead of emitting duplicate alerts.
3. First-occurrence failures and post-window failures still emit actionable alerts.
4. Dedupe decisions are visible in artifacts/log context for auditability.

### Phase 8: Reliability Trend Summaries

**Goal:** Provide trend summaries by fixture/region so operators can spot persistent degradation quickly.

**Requirements:** RELY-11

**Success criteria:**
1. Operator can generate trend summaries over a selectable lookback window from persisted reliability artifacts.
2. Summary output reports grouped failure counts/rates by fixture and by region.
3. Missing/partial history is handled gracefully with explicit diagnostics.
4. Trend summary output is reusable in CI artifacts and local operator workflows.

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

<details>
<summary>✅ v1.2 Reliability Operations (Phases 4-6) - SHIPPED 2026-02-28</summary>

- [x] Phase 4: Failed Fixture Reruns (2/2 plans)
  - [x] 04-01: Implement failed-fixture artifact parsing and rerun selection mode
  - [x] 04-02: Wire rerun mode into smoke command + CI-safe error handling

- [x] Phase 5: Reliability Failure Alerts (2/2 plans)
  - [x] 05-01: Implement webhook alert publisher and normalized failure payload builder
  - [x] 05-02: Integrate alert triggers into smoke + selector-health workflows

- [x] Phase 6: Rotating Regional Matrix (2/2 plans)
  - [x] 06-01: Extend fixture matrix with region metadata and deterministic rotation selector
  - [x] 06-02: Add scheduled extended-matrix workflow mode with bounded default runtime

</details>

### 🚧 v1.3 Reliability Signal Quality (In Progress)

- [x] Phase 7: Alert Signal Controls (2/2 plans)
  - [x] 07-01: Implement alert signature normalization and cooldown policy evaluation
  - [x] 07-02: Wire dedupe decisions into notifier flow and diagnostics artifacts

- [ ] Phase 8: Reliability Trend Summaries (1/2 plans)
  - [x] 08-01: Build trend aggregation from historical smoke/selector-health artifacts
  - [ ] 08-02: Expose trend summary output contract and operator-facing command/reporting

## Progress

| Milestone | Status | Phases Complete | Shipped |
|-----------|--------|-----------------|---------|
| v1.0 Flashscore USA Migration | Complete | 1/1 | 2026-02-28 |
| v1.1 Reliability Hardening | Complete | 2/2 | 2026-02-28 |
| v1.2 Reliability Operations | Complete | 3/3 | 2026-02-28 |
| v1.3 Reliability Signal Quality | In Progress | 1/2 | - |

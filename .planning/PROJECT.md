# FlashscoreScraping

## What This Is

FlashscoreScraping is a Node.js + Playwright CLI for extracting soccer match data from Flashscore USA into reusable JSON/CSV outputs, with reliability guardrails (selector health probes, smoke automation, schema gates, failed-fixture reruns, and failure alerts).

## Core Value

Users can reliably extract structured league match results and statistics into reusable local data files with stable schema contracts.

## Current Milestone: v1.3 Reliability Signal Quality

**Goal:** Improve reliability signal quality so operators receive fewer duplicate alerts and can quickly spot degradation trends.

**Target features:**
- Alert deduplication/cooldown policies for repeated failures (`RELY-10`)
- Failure trend summaries by fixture and region over time (`RELY-11`)
- Milestone-scoped roadmap that keeps current CLI/runtime contracts stable

## Current State

- **Shipped milestones:**
  - v1.0 Flashscore USA Migration (2026-02-28)
  - v1.1 Reliability Hardening (2026-02-28)
  - v1.2 Reliability Operations (2026-02-28)
- **Key commands and workflows:**
  - `npm run validate:schema`
  - `npm run health:selectors`
  - `npm run smoke:reliability`
  - CI workflow: `.github/workflows/reliability-smoke.yml`

## Requirements

### Validated

- ✓ **CORE-01**: Scraper uses `https://www.flashscoreusa.com` as base domain — v1.0
- ✓ **SCRP-01**: Country/league/season discovery works on Flashscore USA soccer pages — v1.0
- ✓ **SCRP-02**: Match listing and detail extraction (including statistics payload) works on USA pages — v1.0
- ✓ **DATA-01**: JSON/JSON-array/CSV contract remains compatible for existing consumers — v1.0
- ✓ **RELY-01**: Selector health-check command validates critical selectors — v1.1
- ✓ **RELY-02**: Selector drift diagnostics identify failed contracts and fallback usage — v1.1
- ✓ **RELY-03**: Automated smoke suite verifies representative extraction flow — v1.1
- ✓ **RELY-04**: Smoke workflow requires schema compatibility validation — v1.1
- ✓ **RELY-05**: Smoke emits machine-readable per-fixture diagnostics artifact — v1.1
- ✓ **RELY-06**: Reliability smoke runs in CI on manual and scheduled triggers — v1.1
- ✓ **RELY-07**: Failed-fixture rerun mode from latest smoke artifact — v1.2
- ✓ **RELY-08**: Failure alerts with actionable run context — v1.2
- ✓ **RELY-09**: Rotating extended regional smoke matrix for scheduled coverage — v1.2

### Active

- [ ] **RELY-10**: Operator can configure alert deduplication/cooldown policies to suppress repeated notifications for the same failure signature.
- [ ] **RELY-11**: Operator can generate failure trend summaries by fixture and region across a selectable lookback window.

### Out of Scope

- Multi-sport expansion beyond current soccer scope
- Framework rewrite away from Node.js + Playwright
- Full web dashboard productization in this milestone
- Autonomous selector self-healing without explicit review

## Context

- Architecture: CLI orchestration + service modules (`countries`, `leagues`, `seasons`, `matches`) + reliability modules
- Reliability artifacts: `.planning/artifacts/selector-health/`, `.planning/artifacts/smoke/`
- Operational emphasis: schema compatibility, selector drift detection, failure recovery, proactive alerts, deterministic coverage rotation, and signal quality controls

## Constraints

- Keep ESM Node.js + Playwright stack
- Preserve CLI argument contract and output formats
- Keep output schema stable for downstream consumers
- Keep default smoke runtime bounded for routine CI execution

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use `https://www.flashscoreusa.com` as canonical origin | Better reliability and accessible soccer structure for target flow | ✓ Adopted in v1.0 |
| Use `/soccer/` routes for competition discovery | `/football/` maps to American football, not soccer competitions | ✓ Adopted in v1.0 |
| Keep `validate:schema` as required compatibility guardrail | Catch output contract drift early | ✓ Adopted in v1.0 |
| Centralize selector contracts with deterministic fallback telemetry | Improve drift detection and diagnostics consistency | ✓ Adopted in v1.1 |
| Enforce schema validation as required live-smoke gate | Prevent false-positive smoke passes on contract drift | ✓ Adopted in v1.1 |
| Use one smoke command for local and CI | Avoid behavior drift across environments | ✓ Adopted in v1.1 |
| Keep v1.2 focused on operational reliability (rerun/alerting/matrix) | Increase signal and recovery speed without architecture churn | ✓ Adopted in v1.2 |
| Keep v1.3 focused on signal quality (dedupe + trend visibility) | Reduce alert fatigue and expose failure patterns before adding new reliability surfaces | — Pending |

---
*Last updated: 2026-02-28 after v1.3 milestone kickoff*

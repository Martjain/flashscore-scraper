# FlashscoreScraping

## What This Is

FlashscoreScraping is a Node.js + Playwright CLI for extracting soccer match data from Flashscore USA into reusable JSON/CSV outputs, with reliability guardrails (selector health probes, smoke automation, schema gates).

## Core Value

Users can reliably extract structured league match results and statistics into reusable local data files with stable schema contracts.

## Current State

- **Shipped milestones:**
  - v1.0 Flashscore USA Migration (2026-02-28)
  - v1.1 Reliability Hardening (2026-02-28)
- **Reliability guardrails in place:**
  - `npm run validate:schema`
  - `npm run health:selectors`
  - `npm run smoke:reliability`
  - CI workflow: `.github/workflows/reliability-smoke.yml`

## Current Milestone: v1.2 Reliability Operations

**Goal:** Extend reliability tooling so failures are faster to triage, alerts are proactive, and smoke coverage rotates across regions without bloating default CI runtime.

**Target features:**
- Rerun smoke checks for only failed fixtures from prior run artifacts.
- Add chat/webhook alerting for selector-health and smoke failures.
- Add rotating extended smoke matrix by region while keeping the default fast suite.

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

### Active

- [ ] **RELY-07**: User can rerun smoke checks for failed fixtures only, using the most recent smoke artifact without manually listing fixture IDs.
- [ ] **RELY-08**: User can receive chat/webhook alerts for reliability failures with actionable context (run ID, failed stage, fixture IDs).
- [ ] **RELY-09**: User can run a rotating extended smoke matrix by region on schedule while default smoke remains runtime-bounded for routine CI.

### Out of Scope

- Multi-sport expansion beyond current soccer scope
- Framework rewrite away from Node.js + Playwright
- UI/dashboard productization in the short term
- Autonomous selector self-healing without explicit review

## Context

- Architecture: CLI orchestration + service modules (`countries`, `leagues`, `seasons`, `matches`) + reliability modules
- Reliability artifacts: `.planning/artifacts/selector-health/`, `.planning/artifacts/smoke/`
- Primary workflows: extraction run, selector health preflight, smoke reliability in local + CI
- New milestone scope is additive on top of the existing smoke/health pipeline (no rewrite)

## Constraints

- Keep ESM Node.js + Playwright stack
- Preserve CLI argument contract and output formats
- Keep output schema stable for downstream consumers
- Keep smoke runtime bounded for routine CI execution

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use `https://www.flashscoreusa.com` as canonical origin | Better reliability and accessible soccer structure for target flow | ✓ Adopted in v1.0 |
| Use `/soccer/` routes for competition discovery | `/football/` maps to American football, not soccer competitions | ✓ Adopted in v1.0 |
| Keep `validate:schema` as required compatibility guardrail | Catch output contract drift early | ✓ Adopted in v1.0 |
| Centralize selector contracts with deterministic fallback telemetry | Improve drift detection and diagnostics consistency | ✓ Adopted in v1.1 |
| Enforce schema validation as required live-smoke gate | Prevent false-positive smoke passes on contract drift | ✓ Adopted in v1.1 |
| Use one smoke command for local and CI | Avoid behavior drift across environments | ✓ Adopted in v1.1 |
| Keep v1.2 focused on operational reliability (rerun/alerting/matrix) | Increase signal and recovery speed without architecture churn | — Pending |

---
*Last updated: 2026-02-28 after v1.2 milestone initialization*

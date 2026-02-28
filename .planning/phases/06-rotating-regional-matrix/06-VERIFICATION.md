---
phase: 06-rotating-regional-matrix
verified: 2026-02-28T21:16:02Z
status: passed
score: 4/4 must-haves verified
---

# Phase 6: Rotating Regional Matrix Verification Report

**Phase Goal:** Expand reliability coverage with deterministic regional rotation while keeping routine smoke runtime bounded.
**Verified:** 2026-02-28T21:16:02Z
**Status:** passed

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Smoke fixture matrix supports region metadata and deterministic rotation selection. | ✓ VERIFIED | `src/reliability/smoke/fixture-matrix.js` now includes `regionId` entries and deterministic `selectSmokeFixtureSelection`; repeated extended selections with identical key produced identical fixture IDs and region token. |
| 2 | Scheduled workflows can run extended regional coverage mode without changing default smoke mode behavior. | ✓ VERIFIED | `.github/workflows/reliability-smoke.yml` sets `RELIABILITY_SMOKE_MATRIX_MODE=extended` only for `schedule` path while `workflow_dispatch` defaults `matrix_mode` to `default`. |
| 3 | Default smoke command retains bounded runtime profile for routine CI and local checks. | ✓ VERIFIED | `npm run smoke:reliability -- --dry-run --sample 2 --quiet` returned `RESULT: pass` and `runSmokeSuite({dryRun:true,sample:2})` confirmed `selection.mode === 'default'` with 2 fixtures. |
| 4 | Extended run artifacts identify selected region/fixtures for reproducible debugging. | ✓ VERIFIED | Extended dry-run artifact `/tmp/smoke-extended-phase6.json` includes `selection.mode`, `selection.rotationKey`, `selection.selectedRegion`, `selection.regionToken`, and `selection.fixtureIds`. |

**Score:** 4/4 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/reliability/smoke/fixture-matrix.js` | Region-aware matrix + deterministic extended selector | ✓ EXISTS + SUBSTANTIVE | Adds region tags, stable rotation slot computation, and structured selection metadata output. |
| `src/cli/arguments/index.js` | Valid matrix mode / rotation key argument parsing | ✓ EXISTS + SUBSTANTIVE | Supports `--matrix-mode`, `--rotation-key`, and env defaults with strict validation. |
| `src/reliability/smoke/run-smoke-suite.js` | Selection integration + provenance metadata in run results | ✓ EXISTS + SUBSTANTIVE | Routes mode/key into selector and persists `selection` metadata block in suite result. |
| `scripts/smoke-reliability.mjs` | Entrypoint wiring + operator-visible selection details | ✓ EXISTS + SUBSTANTIVE | Forwards matrix options and prints selection provenance in non-quiet output. |
| `.github/workflows/reliability-smoke.yml` | Scheduled extended mode and deterministic rotation keying | ✓ EXISTS + SUBSTANTIVE | Schedule path exports extended mode + ISO-week key; manual dispatch remains opt-in. |
| `README.md` | Operator docs for default/extended behavior and reproducibility contract | ✓ EXISTS + SUBSTANTIVE | Documents matrix controls, schedule behavior, and artifact `selection` fields. |

**Artifacts:** 6/6 verified

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| CLI/env matrix controls | suite selection policy | `parseSmokeReliabilityArguments` -> `runSmokeSuite` options | ✓ WIRED | Script passes `matrixMode` and `rotationKey` through to selection layer. |
| rotation key input | deterministic region token + fixtures | `selectSmokeFixtureSelection` stable slot hash + ordered region selection | ✓ WIRED | Same key yields identical region token and fixture IDs across repeated calls. |
| schedule trigger | extended matrix execution | workflow `schedule` branch exports mode/key env consumed by parser | ✓ WIRED | Scheduled CI runs opt into extended coverage without modifying script defaults. |
| suite selection outcome | persisted smoke artifact provenance | `runSmokeSuite` result `selection` block -> report persistence | ✓ WIRED | Extended report includes region token and fixture ID list used for run. |

**Wiring:** 4/4 connections verified

## Requirements Coverage

| Requirement | Status | Blocking Issue |
|-------------|--------|----------------|
| RELY-09: User can execute a rotating extended smoke matrix grouped by region on scheduled runs while keeping default smoke runtime bounded for routine CI. | ✓ SATISFIED | - |

**Coverage:** 1/1 requirements satisfied

## Anti-Patterns Found

None found in phase-modified files (`TODO/FIXME/XXX/HACK/placeholder` scan clean).

## Human Verification Required

None — all phase success criteria are executable CLI/workflow/artifact behaviors verified programmatically.

## Gaps Summary

**No gaps found.** Phase goal achieved. Ready to proceed.

## Verification Metadata

**Verification approach:** Goal-backward using Phase 6 roadmap success criteria
**Must-haves source:** ROADMAP.md success criteria + plan objectives/summaries
**Automated checks:** 9 passed, 0 failed
**Human checks required:** 0
**Total verification time:** 6 min

---
*Verified: 2026-02-28T21:16:02Z*
*Verifier: Codex*

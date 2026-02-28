# Project Research Summary

**Project:** FlashscoreScraping
**Domain:** Operational reliability expansion for scraping guardrails
**Researched:** 2026-02-28
**Confidence:** MEDIUM

## Executive Summary

This milestone should extend the existing reliability pipeline rather than introduce new infrastructure. Current smoke and selector-health artifacts already provide the data needed for failed-fixture reruns and actionable webhook alerts.

The recommended implementation order is: add artifact-driven reruns first, then alerting, then rotating extended regional coverage. This sequence reduces operational recovery time quickly while preserving default CI runtime bounds.

## Key Findings

### Recommended Stack

Keep current Node.js + Playwright + GitHub Actions stack. Add small internal modules for rerun selection and webhook transport instead of bringing in large new dependencies.

**Core technologies:**
- Node.js 20 runtime for CLI + CI scripts.
- Playwright for smoke execution and extraction checks.
- GitHub Actions for manual/scheduled reliability orchestration.

### Expected Features

**Must have (table stakes):**
- Failed-fixture rerun mode from latest smoke artifact.
- Failure-only webhook alerts with actionable context.
- Rotating extended regional matrix for scheduled runs.

**Should have (competitive):**
- Consistent failure payload format across smoke and selector-health alerts.

**Defer (v2+):**
- Alert deduplication/escalation policies and reliability dashboarding.

### Architecture Approach

Use one reliability runner with explicit modes and shared artifact contracts. Persisted report files remain the source of truth for rerun and alert modules. Extended coverage should be opt-in by schedule, not default.

**Major components:**
1. Failed-rerun selector (artifact parser + fixture ID extraction).
2. Alert formatter/publisher for smoke and selector-health failures.
3. Rotating matrix selector that chooses region subsets deterministically.

### Critical Pitfalls

1. Rerun logic can silently miss intended fixtures if artifact schema is not validated.
2. Noisy alerts reduce operational usefulness and should be failure-only by default.
3. Extended matrix can bloat routine CI runtime if not isolated from default runs.

## Implications for Roadmap

### Phase 4: Failed Fixture Reruns
**Rationale:** Immediate MTTR reduction with minimal system changes.
**Delivers:** Artifact-driven failed fixture selection + rerun execution path.
**Addresses:** RELY-07.

### Phase 5: Reliability Alerting
**Rationale:** Proactive failure visibility after rerun workflow exists.
**Delivers:** Webhook alert integration with normalized payloads.
**Addresses:** RELY-08.

### Phase 6: Rotating Regional Matrix
**Rationale:** Expand coverage once recovery and alerting controls are in place.
**Delivers:** Region-tagged fixtures and scheduled rotation mode.
**Addresses:** RELY-09.

### Phase Ordering Rationale

- Rerun capability lowers recovery cost before adding additional monitoring pressure.
- Alerts become more actionable once rerun path exists.
- Regional coverage expansion is safest after operational controls are established.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Existing stack already supports required capabilities |
| Features | MEDIUM | Behavior is clear; final alert payload details need implementation decisions |
| Architecture | MEDIUM | Integration points are known; rotation strategy details need tuning |
| Pitfalls | MEDIUM | Risk patterns are evident from current artifact/CI shape |

**Overall confidence:** MEDIUM

## Sources

### Primary
- `.planning/PROJECT.md`
- `scripts/smoke-reliability.mjs`
- `src/reliability/smoke/run-smoke-suite.js`
- `.planning/artifacts/smoke/latest.json`
- `.planning/artifacts/selector-health/latest.json`
- `.github/workflows/reliability-smoke.yml`

---
*Research completed: 2026-02-28*
*Ready for roadmap: yes*

---
phase: 05-reliability-failure-alerts
plan: "01"
subsystem: reliability
tags: [alerts, webhook, smoke, selector-health]
requires:
  - phase: 04-02
    provides: rerun-capable-smoke-orchestration-and-ci-ops-surface
provides:
  - shared failure alert enablement policy with CI-only default
  - normalized fixed-schema payload builder for smoke and selector-health
  - non-blocking webhook publisher with timeout and structured diagnostics
affects: [05-02-alert-integration, reliability-operations-triage]
tech-stack:
  added: []
  patterns: [end-of-run-failure-alert-contract, warning-only-webhook-delivery]
key-files:
  created:
    - src/reliability/alerts/config.js
    - src/reliability/alerts/payload.js
    - src/reliability/alerts/publisher.js
  modified:
    - src/reliability/alerts/index.js
key-decisions:
  - "Alerting remains failure-only and CI-only by default, with explicit local override through RELIABILITY_ALERT_ALLOW_LOCAL"
  - "Payload contract uses one versioned schema with normalized source/stage/scope and deterministic sorted identifiers"
  - "Webhook delivery returns structured status and never throws so caller exit semantics remain authoritative"
patterns-established:
  - "Callers gate sends with shouldSendFailureAlert before payload build and network I/O"
  - "Payload builders encode empty identifier sets explicitly with a machine-readable reason field"
requirements-completed:
  - RELY-08
duration: 2 min
completed: 2026-02-28
---

# Phase 5 Plan 1: Shared Failure Alert Foundation Summary

**A shared reliability alert module now provides deterministic enablement gates, fixed-schema payload normalization, and non-blocking webhook publishing for both smoke and selector-health flows.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-28T20:33:32Z
- **Completed:** 2026-02-28T20:36:03Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Added `shouldSendFailureAlert` with machine-readable reasons for disabled states (non-fail run, missing webhook, CI-only default, global disable).
- Implemented `buildFailureAlertPayload` with one versioned schema across smoke and selector-health, including normalized context and deterministic identifiers.
- Added `publishFailureAlert` and `sendFailureAlert` integration facade that return warning-ready diagnostics without throwing.

## Task Commits

1. **Task 1: Define alert enablement and CI-only default policy** - `6f213cd` (feat)
2. **Task 2: Build normalized fixed-schema failure payload contract** - `8c9facd` (feat)
3. **Task 3: Add non-blocking webhook publisher with timeout and send diagnostics** - `2151bbe` (feat)

## Files Created/Modified
- `src/reliability/alerts/config.js` - Encodes failure-only, CI-by-default gating logic and alert env key constants.
- `src/reliability/alerts/payload.js` - Builds normalized, versioned alert payloads for smoke and selector-health failures.
- `src/reliability/alerts/publisher.js` - Sends webhook payloads with timeout and structured non-throwing delivery results.
- `src/reliability/alerts/index.js` - Exposes stable public alerting API including the `sendFailureAlert` facade.

## Decisions Made
- Keep alert enablement policy centralized so command scripts can evaluate gate status before building payload/network side effects.
- Include full identifier lists when available and an explicit reason when no fixture/scope identifiers exist.
- Keep publisher behavior single-attempt and timeout-bounded for this phase; no retry/cooldown logic added.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan `05-02` can now wire end-of-run smoke and selector-health failure alert triggers with a single shared API.
- CI workflow and README updates can rely on existing env-key contract and payload semantics from this plan.

## Validation Evidence
- ✅ `node --check src/reliability/alerts/config.js src/reliability/alerts/payload.js src/reliability/alerts/publisher.js src/reliability/alerts/index.js` passed.
- ✅ `node -e 'import("./src/reliability/alerts/payload.js").then(({buildFailureAlertPayload})=>{const p=buildFailureAlertPayload({source:"smoke",result:{runId:"smoke-1",result:"fail",issues:[{fixtureId:"a",failedStage:"matches",error:"timeout"}],summary:{failedFixtures:1,totalFixtures:1},fixtures:[{fixtureId:"a",status:"fail",failedStage:"matches",error:"timeout"}]},metadata:{artifactPath:".planning/artifacts/smoke/latest.json"}});if(!p||p.source!=="smoke"||!p.runId||!Array.isArray(p.affectedIdentifiers))process.exit(1);}).catch(()=>process.exit(1));'` passed.
- ✅ `node -e 'import("./src/reliability/alerts/config.js").then(({shouldSendFailureAlert})=>{const ciFail=shouldSendFailureAlert({runResult:"fail",env:{CI:"true",RELIABILITY_ALERT_WEBHOOK_URL:"https://example.test"}});const ciPass=shouldSendFailureAlert({runResult:"pass",env:{CI:"true",RELIABILITY_ALERT_WEBHOOK_URL:"https://example.test"}});if(!ciFail.enabled||ciPass.enabled)process.exit(1);}).catch(()=>process.exit(1));'` passed.

---
*Phase: 05-reliability-failure-alerts*
*Completed: 2026-02-28*

## Self-Check
All checks passed.

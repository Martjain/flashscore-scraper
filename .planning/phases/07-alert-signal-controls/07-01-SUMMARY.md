---
phase: 07-alert-signal-controls
plan: "01"
subsystem: reliability
tags: [alerts, dedupe, cooldown, reliability]
requires:
  - phase: 06-02
    provides: failure-alert-delivery-foundation-for-smoke-and-selector-health
provides:
  - configurable dedupe policy resolution with global and source-level cooldown controls
  - deterministic signature normalization and sliding-window cooldown evaluator
  - reusable pre-send dedupe API for alerting integrations
affects: [07-02-alert-integration-and-audit-surfaces, phase-07-verification]
tech-stack:
  added: []
  patterns: [diagnostic-policy-fallbacks, deterministic-alert-signatures, sliding-cooldown-dedupe-state]
key-files:
  created:
    - src/reliability/alerts/dedupe-policy.js
    - src/reliability/alerts/dedupe-state.js
  modified:
    - src/reliability/alerts/config.js
    - src/reliability/alerts/index.js
key-decisions:
  - "Malformed dedupe policy inputs fall back to last-known-valid values while emitting machine-readable diagnostics"
  - "Alert signatures include source/environment/workflow context so operational context shifts create independent dedupe keys"
  - "Cooldown windows slide from the latest suppressed duplicate and carry suppression summaries into the next emit decision"
patterns-established:
  - "Policy resolvers should return effective values plus explicit per-key diagnostics instead of silently disabling features"
  - "Alert dedupe state tracks firstSeen/lastSeen/cooldownUntil/suppressedCount and suppression window boundaries per signature"
requirements-completed:
  - RELY-10
duration: 2 min
completed: 2026-02-28
---

# Phase 7 Plan 1: Alert Dedupe Engine Summary

**Alerting now has configurable dedupe policy resolution, deterministic signature construction, and a reusable emit/suppress decision API backed by sliding cooldown state.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-28T23:45:27Z
- **Completed:** 2026-02-28T23:47:51Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Added global + per-source dedupe policy controls (`smoke`, `selector_health`) with duration parsing and non-fatal invalid-input fallback diagnostics.
- Implemented normalized error-class handling, deterministic signature keys, and sliding cooldown evaluation across first, suppressed, and post-expiry events.
- Exposed `evaluateFailureAlertEmission` and supporting dedupe-state exports so scripts can consume a single audit-ready decision API.

## Task Commits

1. **Task 1: Add operator policy resolution for dedupe/cooldown controls** - `ec83540` (feat)
2. **Task 2: Implement normalized signature construction and sliding-window cooldown evaluation** - `2ac6217` (feat)
3. **Task 3: Expose dedupe decision API from alert module for script integration** - `33369c4` (feat)

## Files Created/Modified
- `src/reliability/alerts/config.js` - Adds dedupe env controls, policy resolution, duration parsing integration, and diagnostic fallback behavior.
- `src/reliability/alerts/dedupe-policy.js` - Adds duration parsing, error normalization, signature generation, and cooldown decision evaluation.
- `src/reliability/alerts/dedupe-state.js` - Adds per-signature dedupe state storage and stateful cooldown decision application.
- `src/reliability/alerts/index.js` - Adds `evaluateFailureAlertEmission` API and exports dedupe policy/state helpers.

## Decisions Made
- Keep dedupe enabled by default with a conservative 15-minute cooldown unless explicitly overridden.
- Treat malformed booleans/durations as recoverable configuration problems and reuse last-known-valid values.
- Encode source/environment/workflow into signatures to avoid cross-context suppression collisions.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 07-02 can now apply dedupe decisions directly in send flow and expose suppression evidence in logs/artifacts.
- Payload and script integration can reuse the decision metadata contract without duplicating dedupe logic.

## Validation Evidence
- ✅ `node --check src/reliability/alerts/config.js src/reliability/alerts/dedupe-policy.js src/reliability/alerts/dedupe-state.js src/reliability/alerts/index.js` passed.
- ✅ `node -e "import('./src/reliability/alerts/dedupe-policy.js').then(({buildAlertSignature,normalizeAlertErrorClass})=>{const a=normalizeAlertErrorClass('Timeout at 2026-02-28T12:33:44Z id=FIX-1234 #99');const b=normalizeAlertErrorClass('Timeout at 2026-03-01T09:00:00Z id=FIX-8888 #01');if(a!==b)process.exit(1);const key=buildAlertSignature({fixtureId:'argentina-liga-profesional',checkType:'smoke:matches',errorClass:a,region:'sa'});if(!key||!key.includes('argentina-liga-profesional'))process.exit(1);}).catch(()=>process.exit(1));"` passed.
- ✅ `node -e "import('./src/reliability/alerts/index.js').then(({evaluateFailureAlertEmission})=>{const base={source:'smoke',event:{fixtureId:'argentina-liga-profesional',checkType:'smoke:matches',error:'timeout id=123',region:'sa'},env:{CI:'true'}};const first=evaluateFailureAlertEmission(base);const second=evaluateFailureAlertEmission(base);if(first.decision!=='emit'||second.decision!=='suppress')process.exit(1);}).catch(()=>process.exit(1));"` passed.

---
*Phase: 07-alert-signal-controls*
*Completed: 2026-02-28*

## Self-Check
All checks passed.

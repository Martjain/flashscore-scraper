---
phase: 05-reliability-failure-alerts
plan: "02"
subsystem: reliability
tags: [alerts, ci, smoke, selector-health, operations]
requires:
  - phase: 05-01
    provides: shared-alert-gating-payload-and-publisher-foundation
provides:
  - smoke and selector-health end-of-run failure alert wiring
  - CI webhook secret surface for reliability smoke workflow
  - operator runbook for alert configuration and payload semantics
affects: [05-verification, reliability-incident-triage]
tech-stack:
  added: []
  patterns: [single-alert-per-failed-run, warning-only-alert-delivery]
key-files:
  created: []
  modified:
    - scripts/smoke-reliability.mjs
    - scripts/health-selectors.mjs
    - .github/workflows/reliability-smoke.yml
    - README.md
key-decisions:
  - "Alert emit calls run after final result + report persistence attempt so payload references are available"
  - "Selector-health runtime exceptions are normalized into a report-compatible fail result before alert evaluation"
  - "Alert send failures are always warning logs and never mutate process exit status"
patterns-established:
  - "Entrypoint scripts call one shared sendFailureAlert API once per run and rely on result gating for noise control"
  - "CI workflow passes webhook destination through RELIABILITY_ALERT_WEBHOOK_URL secret only"
requirements-completed:
  - RELY-08
duration: 1 min
completed: 2026-02-28
---

# Phase 5 Plan 2: Entrypoint Alert Integration Summary

**Smoke and selector-health commands now emit one structured end-of-run failure alert when configured, while preserving existing command pass/fail semantics and operator workflows.**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-28T20:39:54Z
- **Completed:** 2026-02-28T20:40:35Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Wired smoke and selector-health scripts to invoke shared alerting after final run result and report persistence attempt.
- Added warning-only handling for webhook delivery failures, preserving command exit-code authority.
- Updated CI workflow and README to document alert secret wiring, trigger policy, and payload contract.

## Task Commits

1. **Task 1: Wire end-of-run failure alerts into smoke command** - `19cfd99` (feat)
2. **Task 2: Wire end-of-run failure alerts into selector-health command** - `30a3ae1` (feat)
3. **Task 3: Document and expose CI webhook configuration for operators** - `6310a82` (docs)

## Files Created/Modified
- `scripts/smoke-reliability.mjs` - Calls shared alert API for final fail outcomes in both normal and exception flows.
- `scripts/health-selectors.mjs` - Adds fail-result normalization, report persistence on runtime errors, and shared alert dispatch.
- `.github/workflows/reliability-smoke.yml` - Wires `RELIABILITY_ALERT_WEBHOOK_URL` secret into CI smoke execution step.
- `README.md` - Documents alert env vars, trigger semantics, payload fields, and warning-only send-failure behavior.

## Decisions Made
- Keep alert emission at entrypoint level after final run outcome and persistence so one alert reflects complete failure context.
- Do not add success/recovery notifications to avoid noise and preserve phase scope.
- Treat send-failure warnings as observability metadata only, never as command failure-state overrides.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
Configure `RELIABILITY_ALERT_WEBHOOK_URL` as a GitHub Actions secret to enable CI alert sends.

## Next Phase Readiness
- Phase 5 implementation is complete and ready for goal-level verification against RELY-08.
- Alert payload contract and integration points are now stable for future dedup/cooldown enhancements.

## Validation Evidence
- ✅ `node --check scripts/smoke-reliability.mjs scripts/health-selectors.mjs` passed.
- ✅ `CI=true RELIABILITY_ALERT_WEBHOOK_URL=https://127.0.0.1.invalid npm run smoke:reliability -- --dry-run --fixture does-not-exist --quiet; test $? -ne 0` passed (warning-only alert send failure with fail exit preserved).
- ✅ `npm run health:selectors -- --dry-run --scope countries --sample 1 --quiet` passed.
- ✅ `rg -n "RELIABILITY_ALERT|webhook|RESULT:|warning|selector_health|smoke" scripts/smoke-reliability.mjs scripts/health-selectors.mjs README.md .github/workflows/reliability-smoke.yml` passed.

---
*Phase: 05-reliability-failure-alerts*
*Completed: 2026-02-28*

## Self-Check
All checks passed.

---
phase: 07-alert-signal-controls
plan: "02"
subsystem: reliability
tags: [alerts, dedupe, smoke, selector-health, observability]
requires:
  - phase: 07-01
    provides: dedupe-policy-signature-and-state-decision-engine
provides:
  - suppression-aware alert send orchestration with emit/suppress outcomes
  - persisted per-signature dedupe audit rollups in smoke and selector artifacts
  - operator runbook documentation for cooldown tuning and suppression troubleshooting
affects: [phase-07-verification, reliability-alert-operations]
tech-stack:
  added: []
  patterns: [pre-send-dedupe-gating, artifact-level-alert-audit-rollups, suppression-window-summary-payloads]
key-files:
  created: []
  modified:
    - src/reliability/alerts/config.js
    - src/reliability/alerts/index.js
    - src/reliability/alerts/payload.js
    - scripts/smoke-reliability.mjs
    - scripts/health-selectors.mjs
    - src/selector-health/health-check/reporting.js
    - README.md
key-decisions:
  - "Deduplication decisions are evaluated before webhook publish so suppressed duplicates never attempt network delivery"
  - "Alert artifacts store one rollup entry per signature with state + prior-window summary fields for auditability"
  - "Alert payload summaries include prior suppression-window context when post-cooldown emission occurs"
patterns-established:
  - "Reliability scripts attach alerts.failure and alertDedupe rollups before report persistence"
  - "Non-quiet operator output logs concise [alert-dedupe] decision lines for suppression/emission triage"
requirements-completed:
  - RELY-10
duration: 3 min
completed: 2026-02-28
---

# Phase 7 Plan 2: Dedupe-Aware Alert Integration Summary

**Smoke and selector-health alert flows now enforce dedupe suppression before publish, persist per-signature audit rollups, and document cooldown controls with operator-visible troubleshooting guidance.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-28T23:50:21Z
- **Completed:** 2026-02-28T23:53:20Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments
- Integrated pre-send dedupe decisions into alert publishing so in-window duplicates are suppressed and post-window emits carry suppression summaries.
- Extended smoke + selector-health command flows to persist structured dedupe decision rollups and print non-quiet suppression traces.
- Expanded README with global/per-source cooldown controls, invalid-config fallback behavior, and artifact/log audit expectations.

## Task Commits

1. **Task 1: Apply dedupe decisions in alert send path and enrich emitted payloads** - `0febefc` (feat)
2. **Task 2: Wire suppression-aware behavior into smoke and selector-health scripts with artifact audit trail** - `e7275d6` (feat)
3. **Task 3: Document operator dedupe controls and troubleshooting/audit workflow** - `7d81c54` (docs)

## Files Created/Modified
- `src/reliability/alerts/config.js` - Fixes global dedupe default inheritance so source policies honor global cooldown/enable values when source overrides are unset.
- `src/reliability/alerts/index.js` - Applies dedupe decision API in send path and returns suppression metadata to callers.
- `src/reliability/alerts/payload.js` - Adds dedupe payload block and suppression-window summary text on post-cooldown emits.
- `scripts/smoke-reliability.mjs` - Records dedupe rollups in persisted results and logs concise dedupe decision lines.
- `scripts/health-selectors.mjs` - Mirrors suppression-aware artifact/log flow for selector-health checks.
- `src/selector-health/health-check/reporting.js` - Prints `Alert dedupe` summary section for non-quiet selector reporting.
- `README.md` - Documents dedupe env controls, cooldown formats, fallback semantics, and audit locations.

## Decisions Made
- Persist dedupe audit context in both `alerts.dedupe` and top-level `alertDedupe` blocks for straightforward consumer access.
- Keep existing exit semantics unchanged while treating alert delivery/network failures as warning-only behavior.
- Preserve CI/local alert gate behavior and run dedupe only after failure-gate eligibility checks pass.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Source policy resolution ignored global dedupe cooldown defaults**
- **Found during:** Phase verification checks for post-window re-emission behavior
- **Issue:** Unset source-specific cooldown keys reused last-known source values instead of inheriting current global defaults, so `RELIABILITY_ALERT_DEDUPE_COOLDOWN` had no effect on source policies.
- **Fix:** Updated policy resolution to use global defaults when source overrides are absent while keeping invalid source override fallback behavior.
- **Files modified:** `src/reliability/alerts/config.js`
- **Verification:** Re-ran targeted `evaluateFailureAlertEmission` check with `RELIABILITY_ALERT_DEDUPE_COOLDOWN=1m` and confirmed emit -> suppress -> emit transition after +61s.
- **Committed in:** `106b641`

**2. [Rule 1 - Bug] Smoke dry-run verification command from plan did not trigger fail path with valid fixture**
- **Found during:** Verification checks after Task 3
- **Issue:** `--dry-run --fixture argentina-liga-profesional` returns `RESULT: pass` in current smoke runner, so it cannot validate the expected non-zero fail-path assertion.
- **Fix:** Adjusted verification fixture to `does-not-exist` to force deterministic fail-path execution and validate dedupe artifact persistence.
- **Files modified:** None (verification command only)
- **Verification:** Re-ran smoke fail-path and selector dry-run checks; artifact dedupe block assertions passed.
- **Committed in:** N/A (verification-only adjustment)

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Correctness and verification reliability fixes only; implementation scope remained aligned with plan objectives.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 7 alert-signal controls are integrated end-to-end and ready for phase-goal verification.
- Phase 8 trend summaries can consume persisted `alertDedupe` audit data without additional alert-flow changes.

## Validation Evidence
- ✅ `node --check src/reliability/alerts/index.js src/reliability/alerts/payload.js scripts/smoke-reliability.mjs scripts/health-selectors.mjs src/selector-health/health-check/reporting.js` passed.
- ✅ `CI=true RELIABILITY_ALERT_WEBHOOK_URL=https://127.0.0.1.invalid RELIABILITY_ALERT_DEDUPE_COOLDOWN=15m npm run smoke:reliability -- --dry-run --fixture does-not-exist --quiet` produced `RESULT: fail` and non-zero exit as expected for fail-path dedupe validation.
- ✅ `CI=true RELIABILITY_ALERT_WEBHOOK_URL=https://127.0.0.1.invalid RELIABILITY_ALERT_DEDUPE_COOLDOWN=15m npm run health:selectors -- --dry-run --scope countries --sample 1 --quiet` passed (`RESULT: pass`).
- ✅ `node -e "const fs=require('fs');const p='.planning/artifacts/smoke/latest.json';if(!fs.existsSync(p))process.exit(1);const j=JSON.parse(fs.readFileSync(p,'utf8'));const d=j.alertDedupe||j.alerts?.dedupe||null;if(!d)process.exit(1);"` passed.
- ✅ `rg -n "dedupe|cooldown|suppressed|suppression" README.md .planning/artifacts/smoke/latest.json 2>/dev/null || true` returned expected documentation/artifact markers.
- ✅ `node -e "import('./src/reliability/alerts/index.js').then(({clearAlertDedupeState,evaluateFailureAlertEmission})=>{clearAlertDedupeState();const env={CI:'true',RELIABILITY_ALERT_DEDUPE_COOLDOWN:'1m'};const base={source:'smoke',event:{fixtureId:'argentina-liga-profesional',checkType:'smoke:selection',error:'timeout id=ABC-123 #44',region:'sa'},env};const first=evaluateFailureAlertEmission(base);const second=evaluateFailureAlertEmission(base);const third=evaluateFailureAlertEmission({...base,now:new Date(Date.now()+61_000).toISOString()});if(first.decision!=='emit'||second.decision!=='suppress'||third.decision!=='emit'||!(third.suppressionSummary?.suppressedCount>0))process.exit(1);}).catch(()=>process.exit(1));"` passed.

---
*Phase: 07-alert-signal-controls*
*Completed: 2026-02-28*

## Self-Check
All checks passed.

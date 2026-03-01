---
phase: 08-reliability-trend-summaries
plan: "01"
subsystem: reliability
tags: [trends, artifacts, diagnostics, aggregation]
requires:
  - phase: 07-02
    provides: persisted-smoke-and-selector-health-artifacts-with-dedupe-signatures
provides:
  - lookback-bounded loader for smoke and selector-health history with explicit diagnostics
  - signature parser and identity normalization for fixture/region trend grouping
  - stable trend aggregation API contract for downstream CLI/reporting flows
affects: [08-02-trend-command-and-artifacts, phase-08-verification]
tech-stack:
  added: []
  patterns: [lookback-window-history-loading, deterministic-group-aggregation, schema-stable-summary-contracts]
key-files:
  created:
    - src/reliability/trends/history-loader.js
    - src/reliability/trends/signature-parser.js
    - src/reliability/trends/aggregation.js
    - src/reliability/trends/index.js
  modified:
    - src/reliability/trends/aggregation.js
key-decisions:
  - "History loading validates required top-level keys and emits structured diagnostics instead of silently dropping malformed artifacts"
  - "Smoke fixture region grouping prefers signature-derived regions, then fixture-matrix metadata, then global fallback"
  - "Trend summary API always returns stable top-level keys so downstream command/reporting consumers remain schema-safe"
patterns-established:
  - "Reliability trend modules separate source loading, identity normalization, and aggregation concerns"
  - "Aggregations sort deterministically by failureRate then failureCount then key name"
requirements-completed:
  - RELY-11
duration: 1 min
completed: 2026-03-01
---

# Phase 8 Plan 1: Trend Aggregation Foundation Summary

**Reliability trend foundations now transform persisted smoke and selector-health artifacts into deterministic fixture/region summaries with explicit partial-history diagnostics.**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-01T00:22:45Z
- **Completed:** 2026-03-01T00:24:07Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Added a bounded artifact-history loader that scans smoke and selector-health directories, enforces lookback windows, and records diagnostics for malformed/missing inputs.
- Implemented reliability signature parsing plus identity normalization to produce stable fixture/region/source keys.
- Built fixture/region aggregation and exported a schema-stable `buildReliabilityTrendSummary` API contract with totals, grouped metrics, source coverage, and diagnostics.

## Task Commits

1. **Task 1: Add bounded artifact-history loader with lookback and source diagnostics** - `764ad7f` (feat)
2. **Task 2: Normalize reliability events and aggregate fixture/region trend metrics** - `51be270` (feat)
3. **Task 3: Expose trend summary contract API for downstream command/reporting flows** - `80bc84b` (feat)

## Files Created/Modified
- `src/reliability/trends/history-loader.js` - Loads smoke/selector history with lookback filtering, required-key validation, and diagnostics.
- `src/reliability/trends/signature-parser.js` - Parses reliability signature tokens and resolves stable fixture/region/source identities.
- `src/reliability/trends/aggregation.js` - Converts run history into grouped fixture/region metrics with failure counts and rates.
- `src/reliability/trends/index.js` - Exposes stable top-level trend summary API and re-exports trend primitives.

## Decisions Made
- Use artifact `completedAt` timestamps first and file `mtime` only as fallback to keep window inclusion deterministic.
- Dedupe source runs by `{source}:{runId}` and keep the newest artifact entry to avoid double-counting `latest.json` + history files.
- Preserve stable output keys (`window`, `totals`, `byFixture`, `byRegion`, `sourceCoverage`, `diagnostics`) even with sparse history.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Region aggregation key overwrite caused unstable sorting**
- **Found during:** Task 3 verification (`buildReliabilityTrendSummary` integration check)
- **Issue:** Region aggregation entries overwrote their `region` key to `undefined`, causing sort-time runtime errors.
- **Fix:** Added key-specific object construction and fallback key normalization so both fixture/region aggregations always sort deterministically.
- **Files modified:** `src/reliability/trends/aggregation.js`
- **Verification:** Re-ran contract check and verified grouped fixture/region totals are generated without runtime errors.
- **Committed in:** `80bc84b`

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** No scope expansion; fix was required for correctness and stable API output.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 08-02 can consume `buildReliabilityTrendSummary` directly from CLI/reporting layers.
- Aggregation now exposes deterministic grouped metrics and source diagnostics needed for CI artifact publishing and operator troubleshooting.

## Validation Evidence
- ✅ `node --check src/reliability/trends/history-loader.js src/reliability/trends/signature-parser.js src/reliability/trends/aggregation.js src/reliability/trends/index.js` passed.
- ✅ `node -e "import('./src/reliability/trends/index.js').then(async ({buildReliabilityTrendSummary})=>{const summary=await buildReliabilityTrendSummary({lookbackHours:168});if(!summary||!summary.window||!summary.diagnostics||!Array.isArray(summary.byFixture)||!Array.isArray(summary.byRegion))process.exit(1);}).catch(()=>process.exit(1));"` passed.
- ✅ `node -e "import('./src/reliability/trends/signature-parser.js').then(({parseReliabilitySignature})=>{const parsed=parseReliabilitySignature('source:smoke|env:ci|workflow:dry-run|fixture:argentina-liga-profesional|check:smoke:selection|error:no_matching_fixtures|region:sa');if(parsed.fixture!=='argentina-liga-profesional'||parsed.region!=='sa')process.exit(1);}).catch(()=>process.exit(1));"` passed.

---
*Phase: 08-reliability-trend-summaries*
*Completed: 2026-03-01*

## Self-Check
All checks passed.

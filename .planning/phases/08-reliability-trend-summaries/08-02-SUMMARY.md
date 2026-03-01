---
phase: 08-reliability-trend-summaries
plan: "02"
subsystem: reliability
tags: [trends, cli, ci, artifacts, reporting]
requires:
  - phase: 08-01
    provides: trend-history-loader-signature-parser-and-aggregation-api
provides:
  - operator-facing reliability trend command with validated lookback/options
  - persisted reliability-trends latest/history artifacts with retention
  - CI generation and upload of trend artifacts plus operator documentation
affects: [phase-08-verification, reliability-operations-workflow]
tech-stack:
  added: []
  patterns: [cli-option-validation, artifact-latest-plus-history-retention, always-uploaded-ci-observability-artifacts]
key-files:
  created:
    - scripts/reliability-trends.mjs
    - src/reliability/trends/reporting.js
  modified:
    - src/cli/arguments/index.js
    - .github/workflows/reliability-smoke.yml
    - package.json
    - README.md
key-decisions:
  - "Trend command persists output by default to .planning/artifacts/reliability-trends/latest.json with timestamped history snapshots"
  - "CI trend generation runs with if: always() so artifacts are available even when smoke checks fail"
  - "Trend contract documentation is command-first and mirrors machine-readable artifact keys exactly"
patterns-established:
  - "Reliability scripts print concise non-quiet summary sections and always end with RESULT status"
  - "Trend diagnostics are treated as explicit operator signals rather than hard failures for partial history"
requirements-completed:
  - RELY-11
duration: 1 min
completed: 2026-03-01
---

# Phase 8 Plan 2: Operator Trend Command and Artifact Contract Summary

**Operators can now generate lookback-bounded reliability trend summaries via one command, persist reusable artifacts, and retrieve the same trend outputs from CI uploads.**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-01T00:27:21Z
- **Completed:** 2026-03-01T00:28:36Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- Added `trend:reliability` command support with strict `--lookback-hours` validation plus source/report path overrides.
- Added reliability trend artifact persistence (`latest.json` + timestamped history + retention pruning) under `.planning/artifacts/reliability-trends/`.
- Integrated trend generation/upload into CI and documented usage, output contract fields, and diagnostics troubleshooting for operators.

## Task Commits

1. **Task 1: Add reliability trend command with validated lookback and output options** - `c5867ad` (feat)
2. **Task 2: Persist trend summary artifacts and integrate CI generation/upload flow** - `6907cc3` (feat)
3. **Task 3: Document trend output contract and troubleshooting workflow** - `a08fea1` (docs)

## Files Created/Modified
- `scripts/reliability-trends.mjs` - Operator CLI for trend generation, summary output, and RESULT signaling.
- `src/cli/arguments/index.js` - Adds strict trend CLI argument parsing and validation.
- `src/reliability/trends/reporting.js` - Persists latest/history artifacts and prunes retained history files.
- `.github/workflows/reliability-smoke.yml` - Runs trend generation after smoke checks and uploads trend artifacts with `if: always()`.
- `package.json` - Adds `trend:reliability` npm script entrypoint.
- `README.md` - Documents command usage, output contract, diagnostics guidance, and CI artifact flow.

## Decisions Made
- Default trend persistence path stays inside `.planning/artifacts/reliability-trends/` to align with existing reliability artifact conventions.
- Trend command keeps pass/fail semantics focused on runtime correctness, while partial/missing-history conditions are surfaced in diagnostics.
- CI uploads trend artifacts in a dedicated bundle (`reliability-trend-artifacts`) so operators can fetch trend context independently of smoke files.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 08 verification can validate RELY-11 end-to-end using command outputs and uploaded CI artifacts.
- Reliability operations now have both immediate CLI output and persisted trend history for longitudinal troubleshooting.

## Validation Evidence
- ✅ `node --check scripts/reliability-trends.mjs src/cli/arguments/index.js src/reliability/trends/reporting.js` passed.
- ✅ `node scripts/reliability-trends.mjs --lookback-hours 168 --report /tmp/reliability-trends-phase8.json --quiet` passed with artifact output.
- ✅ `node -e "const fs=require('fs');const p='/tmp/reliability-trends-phase8.json';if(!fs.existsSync(p))process.exit(1);const j=JSON.parse(fs.readFileSync(p,'utf8'));if(!j.window||!j.totals||!Array.isArray(j.byFixture)||!Array.isArray(j.byRegion)||!j.diagnostics)process.exit(1);"` passed.
- ✅ `rg -n "reliability-trends|trend:reliability|lookback" .github/workflows/reliability-smoke.yml README.md package.json scripts/reliability-trends.mjs` returned expected command/workflow/docs references.

---
*Phase: 08-reliability-trend-summaries*
*Completed: 2026-03-01*

## Self-Check
All checks passed.

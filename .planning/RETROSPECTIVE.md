# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.1 — Reliability Hardening

**Shipped:** 2026-02-28
**Phases:** 2 | **Plans:** 4 | **Sessions:** 1

### What Was Built
- Selector contract registry with deterministic fallback diagnostics.
- Selector health command with strict/default pass semantics and retained JSON reports.
- End-to-end smoke runner validating country -> league -> season -> match traversal.
- Required schema-gated smoke outcome and CI workflow with manual + weekly triggers.

### What Worked
- Wave-based execution made phase dependencies explicit (03-02 cleanly built on 03-01 outputs).
- Artifact-first reporting provided clear triage context for both failures and successful runs.
- Shared local/CI smoke command prevented execution drift across environments.

### What Was Inefficient
- Milestone audit artifact was not generated before archival, reducing formal pre-flight assurance.
- Initial smoke fixture assumptions (`usa` slug and league discovery) required live verification and rework.

### Patterns Established
- Reliability checks should always persist machine-readable artifacts before process exit.
- Live smoke pass should be impossible without explicit schema validation success.
- Representative fixtures should be validated against current discovery behavior, not static assumptions.

### Key Lessons
1. Health-check and smoke checks must share underlying scraper primitives to avoid false confidence.
2. Deterministic fallback telemetry dramatically reduces debugging time when upstream DOM structures shift.

### Cost Observations
- Model mix: 0% opus, 100% sonnet, 0% haiku
- Sessions: 1
- Notable: Most cost came from live browser verification and fixture normalization, not core code generation.

---

## Milestone: v1.0 — Flashscore USA Migration

**Shipped:** 2026-02-28
**Phases:** 1 | **Plans:** 2 | **Sessions:** 1

### What Was Built
- Flashscore USA migration of CLI and scraper routing for core discovery/match flows.
- Selector and extraction hardening across countries, leagues, seasons, and matches.
- Schema compatibility tooling (`validate:schema`) and defensive writer handling.

### What Worked
- Wave-based plan execution with fast runtime smoke checks exposed real regressions early.
- Focused debug workflow with persisted evidence file reduced re-investigation overhead.

### What Was Inefficient
- Initial `/football/` assumption on flashscoreusa caused avoidable rework.
- Broad season fallback selectors introduced noisy data and required a second debug cycle.

### Patterns Established
- Always validate target sport route semantics (`/soccer/` vs `/football/`) before selector migration.
- Keep schema compatibility checks as a required post-change guardrail.
- Prefer archive-scoped selectors over global anchor fallbacks for hierarchical lists.

### Key Lessons
1. Domain migration is not enough; route taxonomy must be confirmed with live DOM evidence before implementation.
2. Generic fallback selectors should always be bounded by context filters (sport/country/league) to avoid cross-competition leakage.

### Cost Observations
- Model mix: 0% opus, 100% sonnet, 0% haiku
- Sessions: 1
- Notable: Most cost came from runtime verification and DOM inspection, not coding.

---

## Milestone: v1.2 — Reliability Operations

**Shipped:** 2026-02-28
**Phases:** 3 | **Plans:** 6 | **Sessions:** 1

### What Was Built
- Artifact-driven failed-fixture rerun mode and rerun-specific CI dispatch controls.
- Shared webhook failure-alert module with normalized payload contract.
- End-of-run alert integration for smoke and selector-health commands.
- Deterministic regional matrix rotation for scheduled extended smoke coverage.

### What Worked
- Layered rollout (foundation -> orchestration) kept each reliability feature testable in isolation.
- Reusing existing smoke/report pipelines prevented contract drift during feature additions.
- Deterministic rotation and selection provenance improved reproducibility of CI investigations.

### What Was Inefficient
- Milestone audit artifact was again skipped before archive completion.
- The summary extractor did not populate one-liners, requiring manual accomplishment curation.

### Patterns Established
- Reliability feature additions should preserve exit-code authority while treating notification failures as warnings.
- Selection/rerun modes should persist machine-readable provenance for operator replay.
- Scheduled extended coverage can remain deterministic via ISO-week keyed rotation.

### Key Lessons
1. Operational reliability work benefits from strict preflight checks and explicit operator fallback guidance.
2. Shared alert contracts across command entrypoints reduce drift and simplify downstream tooling.

### Cost Observations
- Model mix: 0% opus, 100% sonnet, 0% haiku
- Sessions: 1
- Notable: Most effort was spent on integration hardening and deterministic behavior guarantees.

---

## Milestone: v1.3 — Reliability Signal Quality

**Shipped:** 2026-03-01
**Phases:** 2 | **Plans:** 4 | **Sessions:** 1

### What Was Built
- Signature-based alert dedupe policies with cooldown-aware suppression and post-window emission summaries.
- Alert dedupe audit rollups in smoke and selector-health artifacts.
- Trend data pipeline (history loading, signature parsing, fixture/region aggregation) over persisted reliability artifacts.
- Operator trend command with lookback controls and persisted local/CI trend artifacts.

### What Worked
- Wave execution across phases 7 and 8 preserved clear dependency ordering and minimal rework.
- Reusing artifact-first reliability patterns made trend reporting integration straightforward.
- CI integration with always-uploaded trend artifacts increased observability without changing smoke pass/fail semantics.

### What Was Inefficient
- Milestone audit artifact was still missing before archival, leaving readiness validation manual.
- Some GSD CLI summary extraction/update helpers did not align with current markdown layout and required manual corrections.

### Patterns Established
- Reliability enhancements should always include machine-readable audit surfaces in artifacts.
- Trend analytics should keep stable contract keys (`window`, `totals`, `byFixture`, `byRegion`, `diagnostics`) even with sparse history.
- Alert signal quality changes should prioritize suppression transparency over hidden heuristics.

### Key Lessons
1. Signal quality work is most effective when suppression behavior and trend evidence share the same artifact lineage.
2. Milestone archival remains smoother when audit artifacts are generated before completion steps.

### Cost Observations
- Model mix: 0% opus, 100% sonnet, 0% haiku
- Sessions: 1
- Notable: Most effort was concentrated in reliability reporting integration and planning artifact normalization.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | 1 | 1 | Established runtime-first verification and persisted debug session tracking |
| v1.1 | 1 | 2 | Added reliability guardrail stack (selector health + smoke + CI schema gate) |
| v1.2 | 1 | 3 | Added reliability operations tooling (rerun recovery, alerting, rotating regional coverage) |
| v1.3 | 1 | 2 | Improved signal quality with alert dedupe controls and trend-summary observability |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | Runtime smoke + schema checks | Targeted (flow and contract) | 1 (`scripts/validate-flashscore-schema.mjs`) |
| v1.1 | Selector health + live smoke + CI schedule | Reliability baseline across critical path | 2 (`scripts/health-selectors.mjs`, `scripts/smoke-reliability.mjs`) |
| v1.2 | Failed-fixture rerun + alert integration + regional rotation checks | Operational reliability coverage and incident response paths | 1 (`src/reliability/smoke/rerun-fixtures.js`) |
| v1.3 | Dedupe policy checks + trend contract validation + CI trend artifact checks | Signal-quality coverage across suppression and historical trend visibility | 2 (`scripts/reliability-trends.mjs`, `src/reliability/trends/reporting.js`) |

### Top Lessons (Verified Across Milestones)

1. Route-level assumptions need runtime confirmation before selector implementation.
2. Selector breadth must be bounded to page context to prevent mixed-domain/mixed-league contamination.
3. Reliability tooling should produce deterministic artifacts and share runtime code paths with production extraction.
4. Milestone audit artifacts should be generated before archival to reduce manual completion adjustments.

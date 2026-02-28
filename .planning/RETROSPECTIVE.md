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

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | 1 | 1 | Established runtime-first verification and persisted debug session tracking |
| v1.1 | 1 | 2 | Added reliability guardrail stack (selector health + smoke + CI schema gate) |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | Runtime smoke + schema checks | Targeted (flow and contract) | 1 (`scripts/validate-flashscore-schema.mjs`) |
| v1.1 | Selector health + live smoke + CI schedule | Reliability baseline across critical path | 2 (`scripts/health-selectors.mjs`, `scripts/smoke-reliability.mjs`) |

### Top Lessons (Verified Across Milestones)

1. Route-level assumptions need runtime confirmation before selector implementation.
2. Selector breadth must be bounded to page context to prevent mixed-domain/mixed-league contamination.
3. Reliability tooling should produce deterministic artifacts and share runtime code paths with production extraction.

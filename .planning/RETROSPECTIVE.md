# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

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

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | Runtime smoke + schema checks | Targeted (flow and contract) | 1 (`scripts/validate-flashscore-schema.mjs`) |

### Top Lessons (Verified Across Milestones)

1. Route-level assumptions need runtime confirmation before selector implementation.
2. Selector breadth must be bounded to page context to prevent mixed-domain/mixed-league contamination.

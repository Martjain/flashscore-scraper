# Milestones

## v1.1 Reliability Hardening (Shipped: 2026-02-28)

**Phases completed:** 2 phases, 4 plans, 6 tasks
**Execution stats:** 23 commits, 32 files changed, +3311/-242 lines, ~88 minutes execution window

**Key accomplishments:**
- Centralized critical selector contracts and deterministic fallback resolution across discovery and match extraction services.
- Added selector health command with strict/default behavior and retained diagnostics artifacts.
- Built representative fixture smoke runner that validates country -> league -> season -> match traversal.
- Enforced schema compatibility as a required smoke pass gate with machine-readable schema diagnostics.
- Added CI reliability workflow with both manual dispatch and weekly schedule execution.
- Published operational runbook updates and changelog for reliability workflows.

### Known Gaps

- No dedicated milestone audit file (`.planning/v1.1-MILESTONE-AUDIT.md`) was created before archival. Milestone accepted as shipped based on full phase verification reports and passing live smoke/schema validation.

---

## v1.0 Flashscore USA Migration (Shipped: 2026-02-28)

**Phases completed:** 1 phase, 2 plans, 6 tasks
**Execution stats:** 17 commits, 24 files changed, +1400/-93 lines, ~38 minutes active execution window

**Key accomplishments:**
- Migrated base routing and scraping services to Flashscore USA.
- Corrected sport routing to soccer paths (`/soccer/...`) for target competitions.
- Hardened country/league/season/match extraction with resilient selector strategy.
- Added schema compatibility validator (`npm run validate:schema`) and workflow docs.
- Added defensive JSON/CSV writer handling for nullable extraction edge cases.
- Diagnosed and fixed Liga MX season pollution by restricting season extraction to league archive nodes.

### Known Gaps

- No dedicated milestone audit file (`v1.0-MILESTONE-AUDIT.md`) was run before archival; milestone accepted as shipped debt-free based on completed phase verification and successful runtime smoke checks.

---

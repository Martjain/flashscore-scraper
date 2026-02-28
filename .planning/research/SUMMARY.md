# Project Research Summary

**Project:** FlashscoreScraping
**Domain:** Reliability hardening for browser-driven sports scraping
**Researched:** 2026-02-28
**Confidence:** HIGH

## Executive Summary

Research confirms this milestone should stay within the existing Node.js + Playwright architecture and add a dedicated reliability layer rather than redesign scraper internals. The highest-leverage pattern is an explicit selector contract registry plus proactive health probes, followed by deterministic end-to-end smoke checks that also enforce schema compatibility.

For this project, reliability quality is primarily about early drift detection and clear diagnostics. Official Playwright guidance supports resilient locators, auto-waiting, retries, and artifact-based debugging, which map directly to the milestone goals. GitHub Actions scheduled/manual triggers provide a practical way to detect breakage before users report it.

Key risks are silent selector drift, flaky smoke fixtures, and overly broad CI coverage that becomes too slow to trust. Mitigation is to keep the default smoke matrix representative and fast, then run broader checks on a schedule.

## Key Findings

### Recommended Stack

Use current runtime dependencies and add only one core dev dependency for test orchestration.

**Core technologies:**
- **Node.js >=18:** Runtime for existing CLI/scripts - already aligned with project.
- **playwright@^1.56.1:** Existing browser automation foundation - continue for selectors and extraction.
- **@playwright/test@^1.56.1:** Structured smoke runner with retries, traces, projects, and reporters.

### Expected Features

**Must have (table stakes):**
- Selector contract health checks with fallback drift detection.
- End-to-end smoke matrix for representative country/league/season paths.
- Schema compatibility check (`validate:schema`) as a required smoke gate.

**Should have (competitive):**
- Structured drift diagnostics artifact for CI triage.
- Scheduled reliability workflow plus manual trigger.

**Defer (v2+):**
- Broad regional rotation and alert integrations.

### Architecture Approach

Implement a focused reliability layer (`selectors`, `health-check`, `diagnostics`) that wraps existing `countries/leagues/seasons/matches` services. Keep smoke orchestration in `scripts/smoke` so reliability checks are deterministic and CI-friendly without coupling to interactive CLI prompts.

**Major components:**
1. Selector contract registry - defines critical selectors and fallback order.
2. Probe runner + diagnostics writer - detects and reports drift early.
3. Smoke matrix runner + schema gate - verifies full extraction path and output contract.

### Critical Pitfalls

1. **Silent selector drift** - prevent with explicit selector contracts + probe failures.
2. **Flaky smoke runs** - prevent with deterministic fixtures, web-first assertions, bounded retries.
3. **Overly broad smoke suite** - prevent with representative default matrix and scheduled extended checks.
4. **Schema validation disconnected from smoke** - prevent by making schema check required in smoke pipeline.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 2: Selector Health Contracts
**Rationale:** Drift detection must exist before smoke automation can produce reliable signal.
**Delivers:** Selector contract registry, probe command, diagnostics artifact.
**Addresses:** REQs for health checks and fallback monitoring.
**Avoids:** Silent drift and weak failure visibility.

### Phase 3: End-to-End Smoke Automation
**Rationale:** Once health contracts exist, add deterministic smoke coverage and CI scheduling.
**Delivers:** Representative fixture matrix, schema gate integration, scheduled/manual CI workflow.
**Uses:** `@playwright/test`, retries, reporters, workflow triggers.
**Implements:** Reliability verification loop from selectors to data contract.

### Phase Ordering Rationale

- Selector governance is prerequisite for meaningful smoke stability.
- Schema validation belongs in the same smoke loop to prevent false confidence.
- Fast representative smoke should ship before any expanded coverage.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3:** CI artifact retention and runtime budget tuning may need small iteration based on first runs.

Phases with standard patterns (skip research-phase):
- **Phase 2:** Selector contracts/probing follow well-established Playwright patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified against official Playwright + GitHub Actions docs |
| Features | HIGH | Directly aligned with known scraper reliability patterns |
| Architecture | HIGH | Incremental changes over existing codebase, low structural risk |
| Pitfalls | HIGH | Common failure modes observed in browser automation pipelines |

**Overall confidence:** HIGH

### Gaps to Address

- Confirm representative league fixture set with stable historical seasons during planning.
- Decide CI runtime budget target (for example under 10 minutes) before final smoke matrix size.

## Sources

### Primary (HIGH confidence)
- https://playwright.dev/docs/best-practices - resilient locators and maintainable suites
- https://playwright.dev/docs/auto-waiting - actionability/auto-wait behavior
- https://playwright.dev/docs/test-retries - retry semantics and trace-on-retry
- https://playwright.dev/docs/test-reporters - diagnostics/reporting options
- https://playwright.dev/docs/test-projects - matrix organization strategy
- https://playwright.dev/docs/test-timeouts - timeout controls for determinism
- https://docs.github.com/en/actions/reference/events-that-trigger-workflows - scheduled and manual triggers

### Secondary (MEDIUM confidence)
- Existing repository patterns and current v1.0 outputs (`PROJECT.md`, `ROADMAP.md`, scripts)

### Tertiary (LOW confidence)
- None

---
*Research completed: 2026-02-28*
*Ready for roadmap: yes*

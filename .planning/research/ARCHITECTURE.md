# Architecture Research

**Domain:** Reliability architecture for browser-based sports data scraping
**Researched:** 2026-02-28
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CLI / Script Entry Layer                 │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────┐  ┌───────────────┐  ┌─────────────────┐ │
│  │ src/index.js  │  │ scripts/smoke │  │ scripts/health  │ │
│  └───────┬───────┘  └───────┬───────┘  └────────┬────────┘ │
│          │                  │                   │          │
├──────────┴──────────────────┴───────────────────┴──────────┤
│                   Scraper Service Layer                     │
├─────────────────────────────────────────────────────────────┤
│ countries  ->  leagues  ->  seasons  ->  matches           │
│                    + selector contract registry             │
├─────────────────────────────────────────────────────────────┤
│                 Reliability/Artifact Layer                  │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ probe logs  │  │ smoke report │  │ schema validation │  │
│  └─────────────┘  └──────────────┘  └───────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Selector contract registry | Define critical selectors and fallback order | JS object map keyed by feature area and selector purpose |
| Health probe runner | Execute lightweight page probes against contract selectors | Dedicated script invoking Playwright and collecting selector outcomes |
| Smoke matrix runner | Validate end-to-end paths across representative leagues/seasons | Playwright test suite or deterministic script matrix |
| Schema gate | Ensure extracted output keeps contract-compatible fields | Existing `validate:schema` script integrated into smoke pipeline |
| Reliability reporter | Emit machine-readable result artifacts for CI triage | JSON output + summary table in CI logs |

## Recommended Project Structure

```
src/
├── scraper/
│   ├── services/                  # existing extraction services
│   └── reliability/               # new reliability utilities
│       ├── selectors.js           # selector contract + fallback map
│       ├── health-check.js        # probe orchestration
│       └── diagnostics.js         # drift report formatting
├── cli/
│   └── arguments/                 # add reliability command flags
└── files/                         # existing output writers

scripts/
├── smoke/
│   ├── matrix.mjs                 # representative league matrix runner
│   └── fixtures.mjs               # stable targets for smoke
└── validate-flashscore-schema.mjs # existing schema guardrail

.github/workflows/
└── reliability-smoke.yml          # scheduled + manual smoke workflow
```

### Structure Rationale

- **`src/scraper/reliability/`:** Keeps selector/health logic near extraction domain instead of spreading ad hoc checks across services.
- **`scripts/smoke/`:** Allows fast CI execution without coupling smoke orchestration to interactive CLI flow.
- **`.github/workflows/`:** Centralizes proactive monitoring and artifact retention.

## Architectural Patterns

### Pattern 1: Selector Contract Registry

**What:** Central map of critical selectors with ordered fallback candidates.
**When to use:** Any extraction surface where DOM churn is expected.
**Trade-offs:** More upfront maintenance, but far faster updates when breakage occurs.

**Example:**
```javascript
export const selectorContracts = {
  leagueList: [".sportName a[href*='/soccer/']", "a.event__name"],
  seasonList: [".archive a", ".tournamentHeader__country a"],
};
```

### Pattern 2: Probe-Then-Scrape Gate

**What:** Run lightweight selector probes before full scrape/smoke matrix.
**When to use:** CI and scheduled health jobs.
**Trade-offs:** Adds extra step, but prevents wasting time on full runs when critical selectors are already broken.

**Example:**
```javascript
const probeResult = await runSelectorHealthChecks(page, selectorContracts);
if (!probeResult.ok) process.exitCode = 1;
```

### Pattern 3: Deterministic Smoke Fixtures

**What:** Fixed set of representative country/league/season targets.
**When to use:** Continuous smoke coverage with stable runtime.
**Trade-offs:** May miss edge leagues unless rotated periodically.

## Data Flow

### Request Flow

```
[CI schedule/manual]
    ↓
[Health command] -> [Selector probe] -> [Report JSON]
    ↓
[Smoke runner] -> [Scraper services] -> [Output file]
    ↓
[Schema validation] -> [Pass/fail + artifact upload]
```

### State Management

```
[Fixture definitions]
    ↓
[Smoke tasks] <-> [Retry policy] -> [Result collector] -> [Report artifact]
```

### Key Data Flows

1. **Selector drift flow:** Contract registry -> probe execution -> failure diagnostics artifact.
2. **End-to-end verification flow:** smoke matrix -> extracted output -> schema validator -> CI status.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1-3 representative leagues | Single smoke job, sequential flow is fine |
| 4-12 leagues | Use controlled concurrency (`p-limit`) and per-fixture timeout controls |
| 12+ leagues | Split smoke matrix by region/timezone and aggregate reports |

### Scaling Priorities

1. **First bottleneck:** Browser startup/runtime cost per fixture -> reduce with shared browser context and bounded concurrency.
2. **Second bottleneck:** Flaky upstream page latency -> retries with diagnostics and per-step timeouts.

## Anti-Patterns

### Anti-Pattern 1: Selector Definitions Scattered Across Services

**What people do:** Hardcode locators inline in each function without central contract tracking.
**Why it's wrong:** Drift fixes require broad code search and increase inconsistency risk.
**Do this instead:** Maintain one selector contract file with owner comments and fallback order.

### Anti-Pattern 2: Monolithic "mega-smoke" script

**What people do:** One giant script doing setup, probing, extraction, validation, reporting.
**Why it's wrong:** Hard to debug, weak reuse, and brittle change surface.
**Do this instead:** Separate probe, smoke, and reporting modules with small interfaces.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Flashscore USA website | Playwright browser navigation + selector probes | Respect throttling and avoid unbounded parallel requests |
| GitHub Actions | Scheduled/manual workflow invocation | Keep artifacts for failure triage and trend visibility |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `reliability` -> `services/*` | direct module calls | Probe helpers should reuse existing page lifecycle conventions |
| `scripts/smoke` -> `validate:schema` | process invocation | Fail smoke if schema compatibility check fails |

## Sources

- https://playwright.dev/docs/best-practices - selector strategy and suite design
- https://playwright.dev/docs/auto-waiting - stable action behavior expectations
- https://playwright.dev/docs/test-projects - project/matrix structuring for coverage
- https://playwright.dev/docs/test-timeouts - timeout boundaries for deterministic CI
- https://docs.github.com/en/actions/reference/events-that-trigger-workflows - trigger patterns for scheduled/manual smoke

---
*Architecture research for: scraper reliability hardening*
*Researched: 2026-02-28*

# Feature Research

**Domain:** Scraper reliability hardening for Flashscore soccer data extraction
**Researched:** 2026-02-28
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these means the scraper is not trustworthy.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Selector contract health check command | Scraper users expect early warning when upstream DOM changes | MEDIUM | Probe each critical selector and report pass/fail before full scraping |
| Fallback selector mapping for critical fields | Data extraction tools are expected to survive minor DOM drift | MEDIUM | Maintain primary/fallback selector list per extraction target |
| End-to-end smoke flow (country -> league -> season -> match) | Users expect full flow to stay operational after refactors | MEDIUM | Validate representative leagues, not exhaustive global coverage each run |
| Schema contract validation in smoke | Existing consumers expect stable output shape | LOW | Reuse `npm run validate:schema` in smoke pipeline |

### Differentiators (Competitive Advantage)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Selector drift diagnostics artifact | Reduces MTTR by showing exactly which selector failed and where | MEDIUM | Emit structured JSON report for CI and debugging |
| Scheduled CI smoke with trend visibility | Detects breakage before users run scraper manually | MEDIUM | Daily run + manual trigger provides proactive coverage |
| Targeted rerun mode for failed league/match paths | Faster debugging cycle and lower CI cost | LOW | Re-run only failing path from previous report |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Exhaustive smoke across all countries/leagues on every push | Feels "most complete" | Slow, flaky, expensive, and blocks delivery velocity | Representative matrix in default suite + scheduled extended suite |
| Screenshot-based visual regression as primary reliability gate | Feels like broad safety net | Catches layout changes but misses extraction contract failures | Selector + schema contract checks tied to scraper behavior |
| Fully automatic selector self-healing | Promises zero-maintenance scraping | Silent incorrect matches can corrupt data quality | Deterministic fallback map with explicit alerts and review |

## Feature Dependencies

```
Selector Contract Registry
    └──requires──> Selector Probe Runner
                       └──requires──> Drift Report Formatter

Smoke Matrix Runner
    └──requires──> Representative Fixture Definitions
                       └──requires──> Stable CLI Invocation Wrapper

Schema Validation Gate ──enhances──> Smoke Matrix Runner

Exhaustive Suite (anti-feature) ──conflicts──> Fast CI Feedback
```

### Dependency Notes

- **Selector contract registry requires probe runner:** Contracts are only useful if continuously checked.
- **Smoke runner requires fixture definitions:** Deterministic league/season targets prevent flaky "random" failures.
- **Schema validation enhances smoke runner:** Flow can pass navigation while still breaking downstream data shape.
- **Exhaustive suite conflicts with fast feedback:** Runtime inflation weakens CI usefulness for day-to-day changes.

## MVP Definition

### Launch With (v1.1)

- [ ] Selector health check command for critical discovery + extraction selectors - essential drift detection
- [ ] Fallback selector mapping for core fields (league links, season links, match listing, match detail sections) - essential resilience
- [ ] Smoke matrix covering representative leagues/seasons with schema validation - essential end-to-end safety
- [ ] CI workflow trigger (manual + scheduled) with pass/fail artifact output - essential proactive monitoring

### Add After Validation (v1.1.x)

- [ ] Targeted rerun command for failed smoke paths - add when failure volume justifies faster triage
- [ ] Lightweight historical drift trend report - add when recurring failures need pattern analysis

### Future Consideration (v2+)

- [ ] Broader league rotation strategy by region - defer until baseline smoke proves stable
- [ ] Alert routing integrations (Slack/Discord/webhook) - defer until team process needs automated notifications

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Selector health checks | HIGH | MEDIUM | P1 |
| Fallback selector map | HIGH | MEDIUM | P1 |
| End-to-end smoke matrix | HIGH | MEDIUM | P1 |
| Schema validation in smoke | HIGH | LOW | P1 |
| Scheduled CI smoke | MEDIUM | MEDIUM | P2 |
| Targeted rerun mode | MEDIUM | LOW | P2 |
| Drift trend analytics | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Competitor A | Competitor B | Our Approach |
|---------|--------------|--------------|--------------|
| Selector resiliency | Ad hoc selector updates after breakage | Heavy XPath with manual patching | Explicit contract + fallback map + health command |
| Smoke validation | Basic one-path script | No automated smoke | Multi-path representative smoke with schema gate |
| Drift diagnostics | Console logs only | No artifact output | Structured report artifact for CI triage |

## Sources

- https://playwright.dev/docs/best-practices - resilient locator and maintenance patterns
- https://playwright.dev/docs/auto-waiting - stable interaction behavior for smoke checks
- https://playwright.dev/docs/test-retries - failure recovery and flake mitigation in CI
- https://docs.github.com/en/actions/reference/events-that-trigger-workflows - schedule + manual triggers for monitoring

---
*Feature research for: scraper reliability hardening*
*Researched: 2026-02-28*

# Stack Research

**Domain:** Scraper reliability hardening (selector drift detection + smoke testing)
**Researched:** 2026-02-28
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Node.js | >=18 | Runtime for CLI and automation scripts | Existing project baseline; stable async/process APIs for scraper and CI scripts |
| playwright | ^1.56.1 (current repo) | Browser automation for selectors, navigation, and extraction flow | Existing production dependency; built-in auto-wait behavior reduces flaky interactions |
| @playwright/test | ^1.56.1 | Deterministic smoke test runner with retries, projects, trace/reporting | Standard way to run repeatable Playwright smoke suites in CI/local with diagnostics |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| p-limit | ^7.2.0 (current repo) | Bound concurrent league/match smoke tasks | Use when smoke matrix expands and unbounded parallelism starts failing intermittently |
| jsonexport | ^3.2.0 (current repo) | Keep CSV conversion path under smoke validation | Use to ensure output writer contract remains stable while selectors change |
| ajv | ^8.x (optional add) | Validate selector-health report schema and probe payloads | Use if selector checks produce persisted JSON artifacts consumed by CI tooling |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| GitHub Actions scheduled workflow | Run smoke checks daily and on-demand | Use cron + manual dispatch to detect drift before user-reported failures |
| Playwright trace + HTML report | Failure diagnostics for flaky selectors and navigation | Set `trace: "on-first-retry"` for cost-effective debugging |

## Installation

```bash
# Core (already present)
npm install playwright

# Supporting (optional)
npm install ajv

# Dev dependencies
npm install -D @playwright/test
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| @playwright/test smoke suites | Plain Node scripts with manual try/catch + exit codes | Acceptable only for tiny one-off checks; weak diagnostics and retry control |
| Scheduled GitHub Actions | Local cron jobs | Use local cron only for single-machine private workflows without CI requirements |
| Health checks from domain-oriented selectors | Visual-diff screenshot monitoring | Use visual-diff only when UI layout regressions matter; poor fit for data extraction contracts |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Deep brittle CSS chains and nth-child selectors | Minor DOM nesting changes cause false failures | Stable semantic/data-driven locator strategy with explicit fallback map |
| Fixed sleeps (`waitForTimeout`) as readiness strategy | Produces flaky tests and slow runs under variable network | Web-first assertions, locator waits, and bounded retries |
| Full-league exhaustive smoke on every run | Runtime/cost blow up and noisy failures | Representative league matrix plus rotating extended suite |

## Stack Patterns by Variant

**If CI drift detection is the priority:**
- Use `@playwright/test` with retries, traces, and deterministic fixture inputs.
- Because CI needs reproducible failures and machine-readable reports.

**If local selector debugging is the priority:**
- Use headed Playwright runs with trace viewer and verbose selector diagnostics.
- Because rapid inspection of failing locators is faster than rerunning broad suites.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| playwright@1.56.1 | @playwright/test@1.56.x | Keep major/minor aligned to avoid protocol/fixture mismatch risk |
| Node.js >=18 | playwright@1.56.x | Meets Playwright runtime baseline and ESM usage in this repo |
| p-limit@7.2.0 | Node.js >=18 | Existing runtime already satisfies requirement |

## Sources

- https://playwright.dev/docs/best-practices - locator strategy and resilient test guidance
- https://playwright.dev/docs/auto-waiting - actionability and auto-wait behavior
- https://playwright.dev/docs/test-retries - retry semantics and trace-on-retry workflows
- https://playwright.dev/docs/test-reporters - CI-friendly reporters and diagnostics
- https://docs.github.com/en/actions/reference/events-that-trigger-workflows - scheduled/manual workflow triggers

---
*Stack research for: scraper reliability hardening*
*Researched: 2026-02-28*

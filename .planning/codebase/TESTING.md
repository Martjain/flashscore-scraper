# Testing Patterns

**Analysis Date:** 2026-02-28

## Test Framework

**Runner:**
- No test runner configured in `package.json`
- No `jest`, `vitest`, or Playwright test config files detected

**Assertion Library:**
- None configured

**Current Run Commands:**
```bash
npm run start    # Runs scraper CLI, not tests
```

## Test File Organization

**Location:**
- No `tests/` directory found
- No `*.test.js` or `*.spec.js` files found

**Implication:**
- Verification is currently manual via CLI execution and output inspection

## Existing Verification Style (Observed)

**Manual checks in runtime flow:**
- CLI argument validation in `src/cli/arguments/index.js`
- Runtime progress/logging for visibility in `src/index.js`
- Defensive selector waits in `src/scraper/index.js`

**Error-path behavior:**
- Top-level catch logs friendly errors and ensures browser cleanup in `finally`

## Suggested Initial Test Layout

```text
src/
  cli/
    arguments/
      index.js
      index.test.js
  files/
    json/
      index.js
      index.test.js
    csv/
      index.js
      index.test.js
  scraper/
    services/
      matches/
        index.js
        index.test.js
```

## High-Value First Tests

- `parseArguments()` should reject `league` without `country`.
- `parseArguments()` should map file types (`json`, `json-array`, `csv`) correctly.
- `generateFileName()` should normalize strings to lowercase underscore format.
- `buildStatsUrl()` should convert match URL to summary stats URL reliably.
- JSON/CSV writers should create directories recursively and write expected content shape.

## Mocking Strategy (Recommended)

- Mock Playwright `context.newPage()` and page methods for scraper unit tests.
- Mock `fs` operations for file writer tests.
- Avoid real network calls to Flashscore in unit tests.

## Coverage Status

**Current:**
- Automated coverage: none
- CI gating: none

**Risk:**
- DOM selector regressions and URL-shape changes can ship undetected.

---

*Testing analysis: 2026-02-28*
*Update when test patterns change*

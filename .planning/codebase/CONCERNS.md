# Codebase Concerns

**Analysis Date:** 2026-02-28

## Tech Debt

**Selector-coupled scraper logic (`src/scraper/services/*`):**
- Issue: Heavy reliance on brittle CSS selectors and positional access in page DOM.
- Why: Fast extraction implementation against current Flashscore markup.
- Impact: Small upstream markup changes can silently return partial/incorrect data.
- Fix approach: Centralize selector constants, add structural assertions, and add contract-style tests with HTML fixtures.

**Single orchestration file (`src/index.js`):**
- Issue: End-to-end flow (args, prompts, scraping, retry, writing) is concentrated in one file.
- Why: Simplifies initial CLI implementation.
- Impact: Harder to test and evolve error paths independently.
- Fix approach: Split into orchestrator services (`collectMatchLinks`, `collectMatchData`, `persistResults`).

## Known Bugs / Failure Modes

**Missing URL handling in match extraction (`src/scraper/services/matches/index.js`):**
- Symptoms: `getMatchData()` can fail if a match row has no anchor href.
- Trigger: `url` null from `getMatchLinks()` output.
- Workaround: None currently.
- Root cause: `buildStatsUrl()` returns null but caller still attempts `page.goto(statsLink)`.

**Weak numeric argument validation (`src/cli/arguments/index.js`):**
- Symptoms: `concurrency`/`saveInterval` can become `NaN`, zero, or negative.
- Trigger: Invalid numeric CLI values (`concurrency=abc`, `saveInterval=0`).
- Workaround: User retries with corrected arguments.
- Root cause: Number parsing without range checks.

## Security Considerations

**Unbounded browser scraping target:**
- Risk: Tool executes real browser sessions against third-party pages with minimal guardrails.
- Current mitigation: None besides selector timeouts.
- Recommendations: Add domain allowlist checks and explicit URL validation before `page.goto`.

**Output path inside source tree (`src/data`):**
- Risk: Generated data may be unintentionally committed or mixed with source code.
- Current mitigation: Directory creation only.
- Recommendations: Move output to configurable runtime directory and enforce `.gitignore` patterns.

## Performance Bottlenecks

**Per-match page navigation overhead (`src/scraper/services/matches/index.js`):**
- Problem: Each match opens a page, reads summary, then navigates to stats page.
- Cause: Two-step page process for every match record.
- Improvement path: Reduce navigation hops or batch extraction where feasible.

**No adaptive throttling (`src/index.js`):**
- Problem: Concurrency is fixed; no dynamic backoff on failures/rate limits.
- Cause: Static `p-limit` configuration and simple linear retry delay.
- Improvement path: Add exponential backoff with jitter and reduced concurrency after repeated failures.

## Fragile Areas

**`waitForSelectorSafe()` silent catch (`src/scraper/index.js`):**
- Why fragile: Timeout errors are swallowed; callers may continue with incomplete pages.
- Common failures: Partial objects with missing fields and no explicit failure signal.
- Safe modification: Return selector status map and require callers to validate critical selectors.
- Test coverage: None.

**Stage extraction by fixed index (`src/scraper/services/matches/index.js`):**
- Why fragile: `querySelectorAll(...)[2]` assumes fixed DOM ordering.
- Common failures: Wrong stage text when layout changes.
- Safe modification: Match by semantic label or fallback parsing strategy.
- Test coverage: None.

## Dependencies at Risk

**`jsonexport` callback-based API (`src/files/csv/index.js`):**
- Risk: Callback flow complicates deterministic completion and error propagation.
- Impact: Harder to reason about write lifecycle in future refactors.
- Migration plan: Move to promise-based conversion or wrap callback in explicit promise handling.

## Test Coverage Gaps

**Critical runtime paths untested:**
- What is not tested: Argument parser, URL building, selector extraction, writer behavior.
- Risk: Regressions during refactors or Flashscore DOM shifts.
- Priority: High.
- Difficulty to test: Medium (requires Playwright/page mocks and fixture HTML).

---

*Concerns audit: 2026-02-28*
*Update as issues are fixed or new ones discovered*

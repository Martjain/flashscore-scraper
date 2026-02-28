# Architecture

**Analysis Date:** 2026-02-28

## Pattern Overview

**Overall:** Monolithic CLI scraper with layered service modules.

**Key Characteristics:**
- Single runtime entrypoint (`src/index.js`)
- Browser-driven scraping over static HTTP API integration
- In-memory aggregation then periodic filesystem persistence
- Minimal abstraction boundaries through `index.js` modules per folder

## Layers

**CLI Orchestration Layer:**
- Purpose: Parse arguments, prompt user choices, run full scrape workflow
- Contains: `src/index.js`, `src/cli/arguments/index.js`, `src/cli/prompts/*`
- Depends on: Scraper services, file writers, UX helpers
- Used by: Node process invocation (`npm run start`)

**Scraper Service Layer:**
- Purpose: Navigate Flashscore pages and extract structured data
- Contains: `src/scraper/index.js`, `src/scraper/services/*`
- Depends on: Playwright context/page APIs, shared selectors/timeouts
- Used by: CLI orchestration layer

**Persistence Layer:**
- Purpose: Convert and write scraped results to disk
- Contains: `src/files/handle/index.js`, `src/files/json/index.js`, `src/files/csv/index.js`
- Depends on: Node filesystem APIs and `jsonexport`
- Used by: CLI orchestration layer for checkpoint and final save

**Presentation Helpers:**
- Purpose: Terminal UX status (loader/progress)
- Contains: `src/cli/loader/index.js`, `src/cli/progressbar/index.js`
- Depends on: third-party CLI libraries
- Used by: CLI orchestration and prompt modules

## Data Flow

**CLI scrape execution:**
1. User runs `npm run start` (optionally with `key=value` args).
2. `parseArguments()` validates/normalizes primitive options.
3. Browser/context is created via Playwright in `src/index.js`.
4. Prompt subsystem resolves file type, country, league/season.
5. `getMatchLinks()` fetches fixtures and results URLs.
6. Match links are processed with `p-limit` concurrency using `getMatchData()`.
7. Results are accumulated in memory keyed by match id.
8. Every `saveInterval`, `writeDataToFile()` checkpoint writes to disk.
9. Final output is written once all tasks complete.

**State Management:**
- Stateless between runs.
- In-run state is an in-memory object (`matchData`) and progress counter.

## Key Abstractions

**Scraper Service Functions:**
- Purpose: Isolate per-resource extraction (countries, leagues, seasons, matches)
- Examples: `getListOfCountries`, `getListOfLeagues`, `getListOfSeasons`, `getMatchData`
- Pattern: Pure async function wrappers around page navigation/evaluation

**Output Strategy by File Type:**
- Purpose: Route output writing by configured format
- Example: `writeDataToFile()` switch in `src/files/handle/index.js`
- Pattern: Dispatcher + format-specific writer modules

## Entry Points

**Main entrypoint:**
- Location: `src/index.js`
- Trigger: `npm run start`
- Responsibilities: End-to-end control flow, retries, concurrency, lifecycle cleanup

## Error Handling

**Strategy:** Catch-all top-level try/catch/finally in `src/index.js`.

**Patterns:**
- Local retry wrapper `withRetry()` for per-match scraping failures.
- Prompt/argument modules throw `Error` for invalid user input.
- Scraper helper `waitForSelectorSafe()` intentionally swallows selector timeouts.
- Browser/context cleanup is attempted in `finally` regardless of failures.

## Cross-Cutting Concerns

**Logging:**
- Console output with status emojis and chalk coloring.

**Validation:**
- Manual CLI argument checks only (no schema library).

**Concurrency Control:**
- `p-limit` controls number of simultaneous `getMatchData()` operations.

---

*Architecture analysis: 2026-02-28*
*Update when major patterns change*

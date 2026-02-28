# Coding Conventions

**Analysis Date:** 2026-02-28

## Naming Patterns

**Files:**
- Folder-per-module with `index.js` exports (example: `src/files/json/index.js`)
- Lowercase directory names, mostly noun-based (`countries`, `matches`, `loader`)

**Functions:**
- `camelCase` for functions (`parseArguments`, `getMatchData`, `writeDataToFile`)
- Async functions use standard `async` without naming prefixes
- Helper naming is descriptive (`waitForSelectorSafe`, `buildStatsUrl`)

**Variables:**
- `camelCase` for local state (`matchLinksResults`, `processedCount`)
- Uppercase constants for module-level immutable selectors (`MATCH_SELECTOR`, `TIMEOUT`)

## Code Style

**Formatting:**
- Double quotes for imports/strings
- Semicolons consistently present
- 2-space indentation
- Trailing commas used in multiline objects/arrays

**Linting/Formatting Tooling:**
- No ESLint or Prettier config files detected
- Style appears maintained by manual consistency

## Import Organization

**Order pattern observed:**
1. External dependencies (`playwright`, `p-limit`, `chalk`, etc.)
2. Internal imports grouped by subsystem
3. Relative imports (typically `../../` chains)

**Grouping:**
- Blank lines separate logical import groups
- No path aliases detected; all imports are relative paths

## Error Handling

**Patterns:**
- Fail-fast `throw Error(...)` in validation paths (e.g., `src/cli/arguments/index.js`)
- Top-level `try/catch/finally` in `src/index.js`
- Retry wrapper for transient scrape failures (`withRetry`)

**Caveats:**
- `waitForSelectorSafe()` suppresses selector timeout errors and returns partial success
- Error types are generic `Error`; no custom error classes in use

## Logging

**Framework:**
- Console logging with chalk formatting

**Patterns:**
- `console.info` for progress/success
- `console.warn` for retry notices
- `console.error` for terminal failures

## Comments

**Current usage:**
- Minimal inline commentary; code is mostly self-describing
- No JSDoc/TSDoc conventions detected
- No explicit TODO comment convention found

## Function Design

**Patterns:**
- Small-to-medium pure helpers where possible (`generateFileName`, `findCountry`)
- Side effects centralized in orchestration/writer functions
- Data transformation functions often colocated with service logic

## Module Design

**Exports:**
- Named exports only
- Per-folder `index.js` files act as module entry points

**Boundary style:**
- Domain-specific modules under `src/scraper/services/*`
- IO concerns split into dedicated writer modules under `src/files/*`

## Recommended Contribution Guardrails

- Keep new modules aligned with the `index.js` per directory pattern.
- Follow double-quote + semicolon style used across `src/`.
- Keep scraper selectors centralized within service modules.
- Route new output types through `src/files/handle/index.js` instead of branching in `src/index.js`.

---

*Convention analysis: 2026-02-28*
*Update when patterns change*

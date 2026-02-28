# Technology Stack

**Analysis Date:** 2026-02-28

## Languages

**Primary:**
- JavaScript (ES Modules) - All application logic in `src/`

**Secondary:**
- Markdown - User and project docs in `README.md` and `.codex/`

## Runtime

**Environment:**
- Node.js >= 18 (documented in `README.md`)
- Browser automation runtime via Playwright Chromium in `src/index.js`

**Package Manager:**
- npm (lockfile present: `package-lock.json`)
- Script entrypoint: `npm run start` -> `node src/index.js`

## Frameworks

**Core:**
- Playwright `^1.56.1` - Browser automation and page scraping
- Inquirer `^12.10.0` - Interactive CLI prompts

**CLI/UX:**
- Chalk `^5.6.2` - Colored terminal output
- cli-progress `^3.12.0` - Progress bar for match scraping
- cli-loading-animation `^1.0.6` - Loading animation while fetching options

**Data/Execution Utilities:**
- p-limit `^7.2.0` - Concurrency control for per-match scraping tasks
- jsonexport `^3.2.0` - JSON to CSV conversion

## Key Dependencies

**Critical:**
- `playwright` - Core scraping engine and DOM navigation
- `p-limit` - Controls parallelism in `src/index.js`
- `inquirer` - Required for interactive country/league/season selection
- `jsonexport` - Required for CSV output path in `src/files/csv/index.js`

**Infrastructure:**
- Node built-ins (`fs`, `path`, `URL`) for filesystem output and URL handling

## Configuration

**Environment:**
- No `.env`-based configuration detected
- Runtime options are passed via CLI arguments in `src/cli/arguments/index.js`
  - `country`, `league`, `fileType`, `concurrency`, `saveInterval`, `headless`

**Build/Tooling:**
- No transpilation step; source executes directly in Node ESM mode (`"type": "module"` in `package.json`)
- No lint, format, or test scripts currently defined

## Platform Requirements

**Development:**
- Any OS that supports Node.js 18+ and Playwright browser dependencies
- Chromium installation required (`npx playwright install-deps chromium` in README)

**Production/Execution:**
- Intended as a local or automation CLI process, not a hosted server
- Writes output files to `./src/data`

---

*Stack analysis: 2026-02-28*
*Update after major dependency changes*

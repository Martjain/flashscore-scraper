# Codebase Structure

**Analysis Date:** 2026-02-28

## Directory Layout

```text
FlashscoreScraping/
├── .codex/                    # GSD skills, workflows, templates, and agent definitions
├── .github/                   # Repository media assets (logo/demo gif)
├── node_modules/              # Installed npm dependencies
├── src/                       # Application source code
│   ├── cli/                   # Argument parsing, prompts, loader, progress bar
│   ├── constants/             # Shared constants (URLs, output path, file types)
│   ├── files/                 # Output serialization and file writing
│   └── scraper/               # Playwright helpers and scraping services
├── package.json               # Project manifest and runtime deps
├── package-lock.json          # Locked dependency graph
├── README.md                  # User-facing documentation
└── LICENSE                    # License text
```

## Directory Purposes

**`src/cli/`:**
- Purpose: User interaction and runtime options
- Contains: argument parser, interactive prompts, loader/progress utilities
- Key files: `src/cli/arguments/index.js`, `src/cli/prompts/index.js`
- Subdirectories: `prompts/` (`countries`, `leagues`, `season`, `fileType`)

**`src/scraper/`:**
- Purpose: Flashscore navigation and extraction logic
- Contains: browser/page helpers and service modules by domain
- Key files: `src/scraper/index.js`, `src/scraper/services/matches/index.js`
- Subdirectories: `services/` (`countries`, `leagues`, `seasons`, `matches`)

**`src/files/`:**
- Purpose: Persist scraped data in JSON or CSV
- Contains: dispatcher and format-specific writers
- Key files: `src/files/handle/index.js`, `src/files/json/index.js`, `src/files/csv/index.js`

**`src/constants/`:**
- Purpose: Single source for base URL, timeout, output path, and file type definitions
- Key file: `src/constants/index.js`

## Key File Locations

**Entry Points:**
- `src/index.js` - Main CLI orchestration flow

**Configuration:**
- `package.json` - Dependencies and start script
- `README.md` - Runtime prerequisites and usage examples

**Core Logic:**
- `src/scraper/services/matches/index.js` - Match list and match details extraction
- `src/cli/prompts/index.js` - Selection flow and output filename generation
- `src/files/handle/index.js` - Output writer dispatch

**Testing:**
- No test directory or test files detected

**Documentation:**
- `README.md` - Project overview and usage
- `.codex/` - GSD workflow/reference docs

## Naming Conventions

**Files:**
- `index.js` module entrypoint pattern is used consistently
- Lowercase directory names by responsibility (`cli`, `scraper`, `files`)

**Directories:**
- Domain grouping under `src/`
- Service subdomains under `src/scraper/services/`

**Special Patterns:**
- One export-focused `index.js` per folder
- Deep relative import paths rather than alias imports

## Where to Add New Code

**New scraper capability:**
- Implementation: `src/scraper/services/<domain>/index.js`
- Shared browser helpers: `src/scraper/index.js`

**New CLI option or prompt step:**
- Argument parsing: `src/cli/arguments/index.js`
- Interactive prompt: `src/cli/prompts/<topic>/index.js`

**New output format:**
- Writer module: `src/files/<format>/index.js`
- Routing logic update: `src/files/handle/index.js`
- File type constant: `src/constants/index.js`

## Special Directories

**`node_modules/`:**
- Purpose: Installed dependencies
- Source: `npm install`
- Committed: No

**`.codex/`:**
- Purpose: Codex/GSD operational docs and templates
- Source: Maintained with project tooling
- Committed: Yes

---

*Structure analysis: 2026-02-28*
*Update when directory structure changes*

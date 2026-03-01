---
phase: 09-generic-selector-workflow-and-fallback-hardening
verified: "2026-03-01T19:00:00Z"
status: passed
score: 9/9 must-haves verified
---

# Phase 09: generic-selector-workflow-and-fallback-hardening — Verification

**Phase Goal:** Add a generic selector health workflow and harden discovery fallbacks so one selector fix applies across countries/leagues/seasons.
**Verified:** 2026-03-01T19:00:00Z
**Status:** passed

## Goal Achievement

### Observable Truths
| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Operators can run a generic selector workflow that validates representative country/league/season paths using shared selectors | ✓ VERIFIED | `npm run health:selectors -- --dry-run --scope countries --scope leagues --scope seasons --generic` passed and run summary prints generic target mode |
| 2 | Selector health CLI clearly distinguishes generic mode from sample/all modes and prevents ambiguous flag combinations | ✓ VERIFIED | `parseSelectorHealthArguments` now supports `--generic/--pick-any`, rejects `--pick-any` with `--sample`, and rejects unknown options |
| 3 | Generic mode preserves deterministic fallback discovery so selectors can be repaired at scope level | ✓ VERIFIED | `runSelectorHealthCheck` includes deterministic `selectionSeed` hashing and static fallback targets when representative discovery is sparse |

**Score:** 3/3 truths verified

### Required Artifacts
| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/cli/arguments/index.js` | Parses `--generic` / `--pick-any` with compatible combinations | ✓ EXISTS + SUBSTANTIVE | Adds generic aliases, sample=`all/*` parsing, explicit incompatibility guard, and unknown option rejection |
| `scripts/health-selectors.mjs` | Documents generic mode and carries target mode metadata | ✓ EXISTS + SUBSTANTIVE | Help text documents generic mode; failure/success payloads include `targetMode` semantics |
| `src/selector-health/health-check/runSelectorHealthCheck.js` | Representative scope target selection and target mode propagation | ✓ EXISTS + SUBSTANTIVE | Adds deterministic representative selection chain (country→league→season→match), fallback behavior, `targetMode`, and `selectionSeed` metadata |
| `src/selector-health/health-check/reporting.js` | Generic-mode summary output for operators | ✓ EXISTS + SUBSTANTIVE | Summary output prints `Target mode: generic (representative discovered path)` when `targetMode=any` |
| `src/scraper/services/countries/index.js` | Merge primary country selector and broad soccer fallback | ✓ EXISTS + SUBSTANTIVE | Merges primary + fallback candidate selector results, dedupes by country slug |
| `src/scraper/services/leagues/index.js` | Generic league parsing with fallback passes | ✓ EXISTS + SUBSTANTIVE | Uses primary selector first, then fallback selector passes when no leagues discovered |
| `src/scraper/services/seasons/index.js` | Generic season parsing with fallback collection | ✓ EXISTS + SUBSTANTIVE | Merges primary + fallback season links while preserving sport/country/league filtering |
| `src/selector-health/contracts/index.js` | League selector contract narrowed to league-specific anchors | ✓ EXISTS + SUBSTANTIVE | League contract selectors now target `leftMenu__href` patterns |

**Artifacts:** 8/8 verified

### Key Link Verification
| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| CLI flags | run selector-health options contract | `parseSelectorHealthArguments` + script wiring | ✓ WIRED | `scripts/health-selectors.mjs` passes `pickAny`/`sample`/`scopes` into `runSelectorHealthCheck` |
| Target mode + representative selection | scope probe target builder | `buildScopeTargets` with `pickAny` and `selectionSeed` | ✓ WIRED | Representative targets are chosen per scope and routed through existing probe execution |
| Run metadata | operator troubleshooting summary | `targetMode` in result + reporting formatter | ✓ WIRED | Reporting distinguishes generic mode from sample/all outputs |
| Country discovery output | league target discovery | `getCountries` -> `getLeagues`/`getCountryLeagueUrls` | ✓ WIRED | League probing and representative selection depend on country discovery results |
| League discovery output | season archive discovery | `getListOfLeagues` -> `getListOfSeasons` | ✓ WIRED | Season scope and representative selection flow through league results |
| Selector contract specificity + service fallbacks | resilient discovery under layout drift | narrowed contract + fallback selector passes | ✓ WIRED | League/seasons still return targets when primary selectors are empty |

**Wiring:** 6/6 connections verified

## Requirements Coverage
| Requirement | Status | Blocking Issue |
|-------------|--------|----------------|
| SCRP-01 | ✓ SATISFIED | - |
| RELY-01 | ✓ SATISFIED | - |
| RELY-02 | ✓ SATISFIED | - |

**Coverage:** 3/3 requirements satisfied

## Anti-Patterns Found
None.

## Human Verification Required
None — all phase must-haves were validated with automated syntax and runtime checks (including elevated runtime chain verification).

## Gaps Summary
**No gaps found.** Phase goal achieved. Ready to proceed.

## Verification Metadata

**Verification approach:** Goal-backward (ROADMAP goal + plan must_haves)
**Must-haves source:** 09-01-PLAN.md and 09-02-PLAN.md frontmatter
**Automated checks:** 8 passed, 0 failed
**Human checks required:** 0
**Total verification time:** 9 min

---
*Verified: 2026-03-01T19:00:00Z*
*Verifier: Codex*

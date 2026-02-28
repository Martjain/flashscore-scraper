# Phase 2: Selector Health Contracts - Research

**Researched:** 2026-02-28
**Domain:** Selector contract reliability and drift diagnostics for Playwright scraping
**Confidence:** HIGH

## User Constraints

### Locked Decisions (from CONTEXT.md)
- Primary command: `npm run health:selectors`.
- Modes: default and `--strict`; CI must call strict mode explicitly.
- Default behavior: fail on any critical selector break, warn on non-critical issues.
- Strict behavior: any fallback usage is treated as failure.
- Exit codes: `0` for warnings-only run, `1` for critical or strict-mode failure.
- Output: human-readable summary by default; optional JSON via `--report <path>`.
- Machine-readable summary line required in console: `RESULT: pass|fail`.
- Supports: `--scope <area>` (multi), `--sample <n>` per scope, `--quiet`, `--fail-fast`, `--dry-run`.
- Command help must include concrete local and CI examples.
- Critical launch scope: countries, leagues, seasons, match list, match detail.
- Fallback policy: deterministic ordered candidates, max two fallbacks per key, fail when no candidate matches for critical key.
- Default mode allows fallback with warning; strict mode fails on fallback.
- Report includes selector index matched (primary/fallback).
- Diagnostics include scope, contract key, attempted selectors, failing URL/page context, concise error reason.
- JSON report includes run metadata, per-scope checks, per-contract outcome, fallback usage, and failure details.
- Report retention: write `latest.json` plus timestamped history; keep last 30 history files.

### Claude's Discretion
- CLI parsing wiring and module boundaries.
- Internal selector key naming conventions.
- Human-readable table formatting.

### Deferred Ideas
- None.

## Summary

Phase 2 should introduce a dedicated selector-health subsystem instead of scattering resilience logic across scraper services. The system should define explicit contract keys and fallback candidates, then reuse one deterministic resolver in both regular scraping code and preflight health checks.

The implementation should separate concerns into: contract registry (source of truth), selector resolution/probing utilities, and health-check command/reporting. This keeps future DOM updates localized and makes failures actionable before long scrape runs.

**Primary recommendation:** Implement `src/selector-health/` as the reliability layer, wire scraper services to consume it, and expose a strict preflight CLI with deterministic diagnostics artifacts.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js built-ins (`fs`, `path`) | Runtime | Report writing and retention pruning | Already in project and sufficient for artifact management |
| Playwright | ^1.56.1 | Selector probing on live pages | Existing scraper runtime and browser context |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Existing scraper services (`src/scraper/services/*`) | Existing | Contract consumption in extraction flow | For deterministic fallback behavior in production scraping |
| Existing CLI argument parser (`src/cli/arguments/index.js`) | Existing | Mode/scope/sample flag parsing | To avoid introducing a second CLI framework |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native argument parsing | Commander/Yargs | Not needed yet; adds dependency surface for a narrow command |
| In-process health path only | Standalone script only | Script-only loses direct reuse of contract/resolver logic in services |

## Architecture Patterns

### Pattern 1: Contract Registry + Deterministic Resolver
**What:** Define selector candidates per contract key, then resolve in order (`primary`, `fallback[0]`, `fallback[1]`).
**When to use:** All critical selector reads in discovery/match services and health probes.

### Pattern 2: Probe/Run Separation
**What:** One function probes a key and returns structured outcome; another orchestrates all scopes and computes pass/fail.
**When to use:** Health-check command execution and report generation.

### Pattern 3: Diagnostics-First Failures
**What:** Failures return machine-readable context (`scope`, `key`, `selectorsTried`, `url`, `reason`) rather than plain strings.
**When to use:** Any contract miss, timeout, or fallback condition.

### Anti-Patterns To Avoid
- Per-service ad hoc fallback logic with duplicated selector arrays.
- Randomized or implicit fallback ordering.
- Silent fallback usage without reporting.
- “first error only” output that hides multi-key drift state.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Browser probing | Custom HTTP+DOM parser stack | Existing Playwright context/page APIs | Keeps behavior consistent with real scraping runtime |
| Report retention | External DB/cache | File-based retention in `.planning/artifacts/selector-health/` | Simpler, deterministic, and enough for phase scope |

## Common Pitfalls

- Selector chain exceeds two fallbacks and starts matching wrong nodes.
- Health check probes different URLs than extractor paths, causing false confidence.
- Strict mode and default mode share same exit logic (strict must fail on any fallback).
- JSON report and console summary diverge (must keep a single computed run result object).

## Validation Architecture

- Static checks:
  - `node --check src/selector-health/contracts/index.js src/selector-health/probe/resolveSelector.js src/selector-health/health-check/runSelectorHealthCheck.js`
  - `node --check src/scraper/services/countries/index.js src/scraper/services/leagues/index.js src/scraper/services/seasons/index.js src/scraper/services/matches/index.js`
- CLI behavior checks:
  - `npm run health:selectors -- --dry-run --scope countries --sample 1`
  - `npm run health:selectors -- --strict --scope match-list --sample 1`
- Reporting checks:
  - `npm run health:selectors -- --report .planning/artifacts/selector-health/manual-check.json --scope leagues --sample 1`
  - Verify `latest.json` points to latest run and history count prunes to 30.


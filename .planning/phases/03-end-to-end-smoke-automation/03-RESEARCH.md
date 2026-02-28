# Phase 3: End-to-End Smoke Automation - Research

**Researched:** 2026-02-28
**Domain:** End-to-end reliability smoke automation for Flashscore extraction flows
**Confidence:** HIGH

## User Constraints

### Locked Decisions (from roadmap + requirements)
- Phase goal is to automate representative extraction-path verification and enforce schema compatibility through local and CI smoke runs.
- Smoke flow must verify the path `country -> league -> season -> match` for representative fixtures.
- `npm run validate:schema` must be a required pass gate in the smoke workflow.
- Smoke run must emit a machine-readable artifact with per-fixture status and failure details.
- CI must support both manual dispatch and scheduled execution.
- Runtime should remain suitable for routine CI use (bounded fixture matrix and sample controls).

### Claude's Discretion
- Exact smoke module boundaries and where to place orchestration code.
- Fixture matrix representation and selection strategy.
- Artifact schema details, as long as per-fixture pass/fail and failure diagnostics are preserved.
- CI cadence and timeout values.

### Deferred Ideas
- Failed-fixture-only reruns (`RELY-07`), alerting (`RELY-08`), and rotating extended matrix (`RELY-09`).

## Summary

Phase 3 should add a dedicated smoke workflow that exercises the same production scraping pipeline, not a separate synthetic parser. The best structure is: (1) fixture matrix definition, (2) smoke runner that performs path traversal and extraction checks, (3) artifact writer with deterministic JSON output, and (4) a wrapper that enforces schema validation and CI-friendly exit semantics.

The current codebase already has usable primitives for this work: service-level extraction functions, schema validator script (`scripts/validate-flashscore-schema.mjs`), and selector-health patterns for report persistence. Reusing these patterns keeps behavior aligned with existing commands and avoids introducing brittle duplicate logic.

**Primary recommendation:** Build a `src/reliability/smoke/` subsystem and a `scripts/smoke-reliability.mjs` entrypoint, then wire a GitHub Actions workflow that runs smoke + schema gate on schedule and manual dispatch.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Playwright | ^1.56.1 | Drive browser-backed traversal and extraction checks | Already used by runtime scraper and selector-health command |
| Node.js (`fs`, `path`, `child_process`) | Runtime | Artifact writing and schema-gate process execution | Sufficient for deterministic local/CI scripting without extra deps |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Existing scraper services (`src/scraper/services/*`) | Existing | Country/league/season/match path verification | Use directly to validate real extraction path behavior |
| Existing schema validator (`scripts/validate-flashscore-schema.mjs`) | Existing | Contract drift gate | Must run as required smoke step |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Browser-backed smoke | Mocked unit-only smoke | Faster but cannot catch real DOM/selector breakages |
| JSON artifact only | Console logs only | Loses CI artifact introspection and per-fixture traceability |

## Architecture Patterns

### Pattern 1: Fixture Matrix + Runner Separation
**What:** Keep fixture definitions in a static matrix module and consume them from a runner.
**When to use:** All smoke runs (local and CI) to keep scope stable and auditable.

### Pattern 2: Path-Step Checkpoints
**What:** Record outcome at each step (`countries`, `leagues`, `seasons`, `matches`, `schema`) per fixture.
**When to use:** For actionable diagnostics and precise failure classification.

### Pattern 3: Artifact-First Exit Semantics
**What:** Always write a JSON artifact before process exit, then derive exit code from aggregate status.
**When to use:** CI and local debugging to avoid losing failure data on non-zero exits.

### Anti-Patterns To Avoid
- Reimplementing scraping selectors inside smoke logic instead of reusing service modules.
- Running schema validation as optional/non-blocking.
- Using an unbounded fixture matrix that makes CI duration unpredictable.
- Producing only aggregate pass/fail without per-fixture detail.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Data contract checking | Custom duplicate schema logic in smoke runner | `npm run validate:schema` | Single schema source avoids drift between validators |
| Browser orchestration | Separate HTTP+DOM parser stack | Existing Playwright runtime + scraper services | Consistent behavior with real extraction pipeline |
| CI result persistence | Ad-hoc text parsing from logs | JSON artifact file | Machine-readable and durable for workflow diagnostics |

## Common Pitfalls

- Fixture URLs or slugs become stale and create false failures.
- Smoke run passes extraction but fails to run schema gate before returning success.
- Artifact write happens only on success path, hiding failure diagnostics.
- CI schedule runs too frequently and exceeds acceptable runtime budget.
- Local and CI commands diverge (flags/paths differ), causing environment-specific regressions.

## Validation Architecture

- Static checks:
  - `node --check src/reliability/smoke/fixtures.js src/reliability/smoke/runSmokeSuite.js src/reliability/smoke/reporting.js scripts/smoke-reliability.mjs`
- Smoke dry-run checks:
  - `npm run smoke:reliability -- --dry-run --sample 1`
- End-to-end smoke checks:
  - `npm run smoke:reliability -- --sample 1 --max-matches 1`
- Schema-gate checks:
  - Smoke command exits non-zero if embedded `npm run validate:schema` fails.
- Artifact checks:
  - `test -f .planning/artifacts/smoke/latest.json`
  - `node -e "const fs=require('fs'); const p='.planning/artifacts/smoke/latest.json'; const r=JSON.parse(fs.readFileSync(p,'utf8')); if(!Array.isArray(r.fixtures)) process.exit(1);"`

# Phase 4: Failed Fixture Reruns - Research

**Researched:** 2026-02-28
**Domain:** Artifact-driven failed-fixture smoke reruns
**Confidence:** HIGH

## User Constraints

### Locked Decisions (from roadmap + requirements)
- Rerun mode must read failed fixtures from `.planning/artifacts/smoke/latest.json`.
- Rerun mode must ignore fixtures that already passed.
- Rerun mode must fail clearly when artifact data is missing or invalid and provide manual fallback guidance.
- Rerun runs must keep standard smoke artifact output and CI-compatible exit code behavior.
- Scope is Phase 4 only (`RELY-07`), without adding alerting (`RELY-08`) or region rotation (`RELY-09`).

### Claude's Discretion
- Exact module boundary for artifact parsing/selection helpers.
- CLI flag names and combination rules for rerun behavior.
- Whether unknown fixture IDs from artifacts are ignored or treated as hard failures.
- How rerun metadata is represented in report payload while preserving compatibility.

### Deferred Ideas
- Sending notifications when rerun mode fails or succeeds.
- Automatic retries/backoff for transient fixture failures.
- Region-aware rerun prioritization.

## Summary

The existing smoke command already has all required execution/reporting primitives: fixture filtering (`fixtureIds`), deterministic artifact persistence, and CI-safe pass/fail exit semantics. Phase 4 should add a thin rerun-selection layer that loads the latest smoke artifact, extracts failed fixture IDs, validates they are rerunnable, and injects them into the current smoke flow.

The safest path is to isolate artifact handling in a dedicated helper module and keep `scripts/smoke-reliability.mjs` as orchestration. This avoids mixing file I/O/parsing logic into the runner and makes error handling testable. Missing/invalid artifacts should produce explicit operator guidance with a manual `--fixture` fallback command.

**Primary recommendation:** Implement a `rerun-fixtures` helper, extend smoke CLI arguments with rerun flags, then wire rerun mode in `scripts/smoke-reliability.mjs` so all existing reporting and exit logic remains unchanged.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js `fs/promises` + `path` | Runtime | Read/validate smoke artifact JSON | Already used in reporting and script orchestration |
| Existing smoke modules | Existing | Fixture selection, runner execution, artifact writing | Keeps rerun mode behavior aligned with normal smoke runs |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `src/cli/arguments/index.js` parser | Existing | Add rerun flags and option validation | Required for user-facing rerun command |
| `src/reliability/smoke/fixture-matrix.js` | Existing | Validate rerun fixture IDs against known matrix fixtures | Prevents malformed artifact IDs from causing ambiguous behavior |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Reuse latest artifact JSON | Keep separate failed-fixture cache file | More state to maintain and higher drift risk |
| Dedicated rerun helper module | Inline parsing in script | Faster initially but harder to test and evolve |

## Architecture Patterns

### Pattern 1: Artifact Reader + Selector Separation
**What:** Parse artifact file in one function and derive rerun fixture IDs in another.
**When to use:** All rerun mode execution paths.

### Pattern 2: Strict Input Validation + Actionable Fallback
**What:** Validate JSON shape, `fixtures[]` presence, and failed fixture availability; emit clear remediation command when invalid.
**When to use:** Missing artifact, bad JSON, empty failed set, or non-rerunnable IDs.

### Pattern 3: Mode Injection, Not Runner Forking
**What:** Keep one smoke runner path and inject `fixtureIds`/mode metadata from rerun resolver.
**When to use:** Preserve artifact schema and exit semantics across standard and rerun modes.

### Anti-Patterns To Avoid
- Duplicating smoke execution logic for reruns.
- Treating `issues[]` synthetic entries (`run`, `schema-gate`) as fixture rerun IDs.
- Failing silently when artifact is missing or has no failed fixtures.
- Changing existing report/output contracts in a way that breaks CI consumers.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Fixture execution filtering | New custom selector pipeline | Existing `fixtureIds` support in smoke runner | Already supports targeted fixtures |
| Report persistence | Separate rerun artifact writer | Existing `persistSmokeReport` flow | Preserves standard output guarantees |
| Exit code policy | Custom rerun-only exit matrix | Existing smoke pass/fail result semantics | Keeps CI behavior consistent |

## Common Pitfalls

- Artifact exists but contains only schema-gate failure and no fixture failures.
- Artifact fixture IDs no longer match matrix IDs after future fixture-set updates.
- Operator expects rerun mode to auto-fallback to full sample silently (should not).
- Invalid JSON parse errors without guidance make rerun mode unusable in incident response.

## Validation Architecture

- Static checks:
  - `node --check src/reliability/smoke/rerun-fixtures.js src/cli/arguments/index.js scripts/smoke-reliability.mjs`
- Selection-path checks (no browser):
  - `node scripts/smoke-reliability.mjs --dry-run --rerun-failed`
  - `node scripts/smoke-reliability.mjs --dry-run --rerun-failed --artifact .planning/artifacts/smoke/latest.json`
- Error-path checks:
  - `node scripts/smoke-reliability.mjs --dry-run --rerun-failed --artifact /tmp/missing-smoke-artifact.json` returns non-zero with fallback guidance.
- Output/exit checks:
  - `test -f .planning/artifacts/smoke/latest.json`
  - `node -e "const fs=require('fs');const r=JSON.parse(fs.readFileSync('.planning/artifacts/smoke/latest.json','utf8'));if(!r||!r.summary||!r.mode)process.exit(1);"`

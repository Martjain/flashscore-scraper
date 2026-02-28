# Phase 6: Rotating Regional Matrix - Research

**Researched:** 2026-02-28
**Domain:** Deterministic regional rotation for smoke reliability coverage
**Confidence:** HIGH

## User Constraints

### Locked Decisions (from roadmap + requirements)
- Phase must satisfy `RELY-09` only.
- Smoke fixture matrix must carry region metadata and support deterministic rotation selection.
- Scheduled runs must support extended regional coverage mode.
- Default smoke mode for routine CI/local runs must keep current bounded runtime behavior.
- Extended runs must leave reproducible artifact metadata identifying selected region and fixtures.

### Claude's Discretion
- Exact region taxonomy and fixture-to-region mapping model in the matrix.
- Rotation key derivation strategy (date-based, explicit key, or both), as long as it is deterministic.
- CLI/env surface for enabling extended mode and passing rotation key.
- Where rotation metadata is stored in output payload (`options`, top-level selection block, or both).

### Deferred Ideas
- Region health trend dashboards and historical aggregation.
- Automatic adaptive weighting based on prior failures.
- Full global matrix execution on every routine run.

## Summary

The current smoke implementation has a fixed 3-fixture matrix and deterministic default selection (`slice(0, sample)`), which already keeps routine runtime bounded. Phase 6 should extend selection logic without breaking this default path by introducing an explicit matrix mode split: bounded default mode remains unchanged, and an extended mode opts into deterministic region rotation.

The best fit for this codebase is to keep rotation logic close to `fixture-matrix.js` and keep `run-smoke-suite.js` as the orchestrator that records final selection metadata. The existing report writer already persists arbitrary JSON fields, so reproducibility data can be emitted by enriching the smoke result payload (selected region token, rotation key, selected fixture IDs) and letting current artifact persistence capture it unchanged.

**Primary recommendation:** Add region metadata + deterministic rotation helpers in `fixture-matrix.js`, thread mode/rotation options through CLI + smoke runner, and enable extended mode only in scheduled workflow paths.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Existing Node.js ESM smoke modules | Current repo runtime | Keep rotation behavior inside current reliability stack | Avoids dependency churn and preserves existing command ergonomics |
| `src/reliability/smoke/fixture-matrix.js` | Existing | Source of truth for fixture metadata + selection policies | Centralized fixture control already exists here |
| `src/reliability/smoke/run-smoke-suite.js` | Existing | Applies selection and returns report payload | Natural place to attach reproducibility metadata |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `src/cli/arguments/index.js` | Existing | Parse mode/rotation options and enforce safe combinations | For user-triggered or workflow-triggered extended mode |
| `.github/workflows/reliability-smoke.yml` | Existing | Schedule-specific extended mode activation | Keep default/manual mode unchanged |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Deterministic rotation by explicit key/hash | Random selection each run | Higher short-term variance and poor reproducibility |
| Region metadata in matrix entries | Separate sidecar mapping file | Extra indirection and drift risk |
| Mode-based opt-in (`default` vs `extended`) | Always-on extended selection | Violates bounded default runtime requirement |

## Architecture Patterns

### Pattern 1: Mode-Gated Selection Policy
**What:** Keep existing bounded default policy intact, with extended logic enabled only when `matrixMode=extended`.
**When to use:** Every smoke invocation path.

### Pattern 2: Deterministic Region Windowing
**What:** Derive a stable rotation slot from a key and map it to a region subset, then select fixtures from that region deterministically.
**When to use:** Extended runs and scheduled workflows.

### Pattern 3: Selection Provenance in Artifacts
**What:** Persist rotation key, selected region token(s), and final fixture IDs in smoke report metadata for replay/debug.
**When to use:** All extended runs; optionally include no-op metadata in default runs for schema consistency.

### Anti-Patterns To Avoid
- Replacing default bounded selection with always-extended behavior.
- Using non-deterministic randomness for scheduled coverage.
- Storing rotation context only in logs but not artifacts.
- Spreading selection logic across script + runner + workflow without one authoritative selector.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Rotation persistence system | New DB/cache for region history | Deterministic key-based selection | Requirement asks reproducibility, not historical statefulness |
| Workflow-only selector | Bash-only fixture picking in YAML | Selector logic in JS modules | Keeps behavior testable and reusable locally |
| Separate artifact pipeline | New artifact writer | Existing smoke report persistence | Preserves established artifact and CI conventions |

## Common Pitfalls

- Treating fixture ID filters (`--fixture`) and extended rotation as independent without precedence rules.
- Changing default sample semantics in the process of adding extended mode.
- Rotation key drift between workflow and script causing non-reproducible fixture sets.
- Failing to include selected-region metadata in rerun/debug artifacts.

## Validation Architecture

- Static checks:
  - `node --check src/reliability/smoke/fixture-matrix.js src/reliability/smoke/run-smoke-suite.js src/cli/arguments/index.js scripts/smoke-reliability.mjs`
- Deterministic selector checks:
  - `node -e "import('./src/reliability/smoke/fixture-matrix.js').then(({selectSmokeFixtures})=>{const a=selectSmokeFixtures({sample:2,matrixMode:'extended',rotationKey:'2026-W09'}).map((x)=>x.fixtureId).join(',');const b=selectSmokeFixtures({sample:2,matrixMode:'extended',rotationKey:'2026-W09'}).map((x)=>x.fixtureId).join(',');if(a!==b)process.exit(1);}).catch(()=>process.exit(1));"`
- Runtime behavior checks:
  - `npm run smoke:reliability -- --dry-run --sample 2 --quiet`
  - `RELIABILITY_SMOKE_MATRIX_MODE=extended RELIABILITY_SMOKE_ROTATION_KEY=2026-W09 npm run smoke:reliability -- --dry-run --sample 2 --quiet --report /tmp/smoke-extended.json`
- Artifact provenance checks:
  - `node -e "const fs=require('fs');const p='/tmp/smoke-extended.json';const r=JSON.parse(fs.readFileSync(p,'utf8'));if(!r.selection||!r.selection.rotationKey||!Array.isArray(r.selection.fixtureIds))process.exit(1);"`

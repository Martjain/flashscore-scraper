# Phase 2: Selector Health Contracts - Context

**Gathered:** 2026-02-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Build selector health contracts for the existing country -> league -> season -> match extraction path, run health checks before full scraping, and emit drift/fallback diagnostics. This phase does not add new extraction capabilities or broaden product scope.

</domain>

<decisions>
## Implementation Decisions

### Command Surface
- Primary command: `npm run health:selectors`.
- Modes: default and `--strict`; CI must call strict mode explicitly.
- Default behavior: fail on any critical selector break, warn on non-critical issues.
- Strict behavior: any fallback usage is treated as failure.
- Exit codes: `0` for warnings-only run, `1` for critical or strict-mode failure.
- Output: human-readable summary by default; optional JSON via `--report <path>`.
- Machine-readable summary line required in console: `RESULT: pass|fail`.
- Supports: `--scope <area>` (multi), `--sample <n>` per scope, `--quiet`, `--fail-fast`, `--dry-run`.
- Command help must include concrete local and CI examples.

### Coverage Scope
- Critical launch scope is the end-to-end discovery and extraction path only:
  - countries
  - leagues
  - seasons
  - match list
  - match detail
- Critical checks must block release confidence when broken.
- Non-critical selectors can be checked as informational warnings but cannot mask critical failures.

### Fallback Policy
- Each selector contract has ordered primary -> fallback candidates.
- Fallback chain is deterministic and capped (max two fallbacks per contract key) to prevent loose matching.
- If no candidate matches for a critical contract, check fails.
- Default mode allows fallback usage with warning; strict mode fails on fallback usage.
- Report must include which selector index matched (primary or fallback).

### Diagnostics Output
- Console summary includes: mode, scopes checked, critical pass/fail counts, warning count, fallback usage count, total duration, and final `RESULT` line.
- Failure details include: scope, contract key, attempted selectors in order, failing URL/page context, and concise error reason.
- JSON report schema includes run metadata (`run_id`, timestamps, mode, strict flag), per-scope checks, per-contract outcome, fallback usage, and failure details.

### Report Retention
- Default JSON report path when omitted: `.planning/artifacts/selector-health/latest.json`.
- Also write timestamped history file per run in same directory.
- Command auto-creates report directories.
- Retention policy: keep latest pointer plus last 30 timestamped reports; prune older files automatically.

### Claude's Discretion
- Exact CLI argument parser wiring and internal module boundaries.
- Exact naming of selector contract keys if semantics stay clear.
- Exact formatting of human-readable table layout.

</decisions>

<specifics>
## Specific Ideas

- Keep reliability signal strong in CI by making strict mode explicit and deterministic.
- Keep local developer loop fast with scope targeting, sampling, dry-run, and optional fail-fast.

</specifics>

<deferred>
## Deferred Ideas

- None - discussion stayed within phase scope.

</deferred>

---

*Phase: 02-selector-health-contracts*
*Context gathered: 2026-02-28*

# Architecture Research

**Domain:** Reliability operations architecture for browser scraping pipelines
**Researched:** 2026-02-28
**Confidence:** MEDIUM

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Trigger Layer                           │
├─────────────────────────────────────────────────────────────┤
│  local CLI  │  workflow_dispatch  │  scheduled cron        │
└─────────────┬─────────────────────┬─────────────────────────┘
              │                     │
┌─────────────▼─────────────────────▼─────────────────────────┐
│                 Reliability Runner Layer                    │
├─────────────────────────────────────────────────────────────┤
│ smoke command │ selector health command │ shared arg parser │
└─────────────┬─────────────────────┬─────────────────────────┘
              │                     │
┌─────────────▼─────────────────────▼─────────────────────────┐
│                  Artifact + Alert Layer                     │
├─────────────────────────────────────────────────────────────┤
│ smoke latest/history │ selector latest/history │ webhooks   │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Smoke runner | Execute fixture traversal and collect pass/fail details | `scripts/smoke-reliability.mjs` + `src/reliability/smoke/*` |
| Rerun selector | Derive failed fixture IDs and invoke targeted rerun path | New helper reading `.planning/artifacts/smoke/latest.json` |
| Alert publisher | Send normalized failure payload to chat/webhook endpoint | New notifier module using Node `fetch` |
| Matrix rotator | Choose extended fixture subset per schedule/region | New fixture metadata + deterministic selection function |

## Recommended Project Structure

```
src/
├── reliability/
│   ├── smoke/
│   │   ├── fixture-matrix.js        # default + extended matrix and rotation
│   │   ├── rerun-selection.js       # failed fixture extraction helpers
│   │   └── run-smoke-suite.js       # execution + summary
│   └── alerts/
│       ├── format-alert.js          # normalized payload builder
│       └── send-webhook.js          # transport with timeout/retry guard
scripts/
├── smoke-reliability.mjs            # add rerun/rotation/alert flags
└── health-selectors.mjs             # optional alert hook
```

## Architectural Patterns

### Pattern 1: Artifact-Driven Recovery

**What:** Derive retry scope from persisted machine-readable run artifacts.
**When to use:** Partial smoke failures where many fixtures already passed.
**Trade-offs:** Requires stable artifact schema; avoids manual fixture selection mistakes.

### Pattern 2: Single Runner, Multiple Modes

**What:** Keep one smoke entry point with explicit mode flags (`default`, `rerun-failed`, `extended-rotation`).
**When to use:** Reliability workflows sharing setup/reporting logic.
**Trade-offs:** Option parser grows, but avoids duplicated runner code.

### Pattern 3: Failures-Only Notification

**What:** Publish alerts only when runs fail or drift is detected.
**When to use:** Operational alert channels where noise must stay low.
**Trade-offs:** Less visibility into healthy runs; significantly better signal-to-noise ratio.

## Data Flow

1. Trigger runs smoke or selector-health command.
2. Runner writes latest + history artifacts.
3. Failure summary is normalized from artifact fields (`runId`, `issues`, fixture IDs).
4. Alert module publishes payload to configured webhook.
5. Operator reruns only failed fixtures when needed.

## Integration Points

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Smoke runner -> smoke artifact | File write | Existing behavior; must keep schema stable |
| Smoke artifact -> rerun selector | File read/parse | Validate artifact freshness and shape |
| Runner/health -> alert module | In-process function call | Keep payload contract minimal and explicit |
| CI workflow -> smoke script | CLI flags | Add flags for rotation and rerun mode |

## Sources

- `scripts/smoke-reliability.mjs`
- `src/reliability/smoke/run-smoke-suite.js`
- `.planning/artifacts/smoke/latest.json`
- `.planning/artifacts/selector-health/latest.json`
- `.github/workflows/reliability-smoke.yml`

---
*Architecture research for: FlashscoreScraping v1.2 reliability operations*
*Researched: 2026-02-28*

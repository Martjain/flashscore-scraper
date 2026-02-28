# Phase 5: Reliability Failure Alerts - Research

**Researched:** 2026-02-28
**Domain:** Reliability failure notification orchestration for smoke and selector-health runs
**Confidence:** HIGH

## User Constraints

### Locked Decisions (from CONTEXT.md)
- Send failure alerts at end-of-run.
- Emit one alert per failing run.
- Keep smoke and selector-health alerts separate by run/source.
- Do not send recovery alerts on subsequent success runs by default.
- Alert delivery failures must be logged as warnings and must not mask underlying command exit status.
- Emit alerts only after the final failure set is known.
- Default behavior is CI-only alerting.
- Any qualifying failure alerts (no severity threshold in this phase).
- Payload contract is structured JSON with fixed keys and includes required fields plus a one-line human summary.
- Include full failed fixture/scope identifiers, artifact/log references when available, normalized failure code/source enums, UTC ISO-8601 timestamps, and payload schema version.
- Keep stage/scope as separate fields; sort fixture IDs deterministically.
- When fixture IDs are unavailable, include an explicit empty fixtures list plus scope-reason field.

### Claude's Discretion
- Exact payload key naming and nesting details.
- Internal module boundaries for alert config, payload building, and delivery.
- Timeout/retry defaults for webhook delivery, as long as delivery failure remains non-blocking.

### Deferred Ideas
- Alert deduplication/cooldown policy (RELY-10).
- Multi-channel escalation routing.

## Summary

The current codebase already produces stable per-run result objects for both reliability entrypoints:
`scripts/smoke-reliability.mjs` and `scripts/health-selectors.mjs`. Each command computes a final run result, persists artifacts, prints summary output, and sets exit codes based on pass/fail outcomes. This makes Phase 5 a notification integration layer, not a rework of reliability execution.

The safest architecture is a shared alert module under `src/reliability/alerts/` that receives normalized run outcomes from each command, builds a fixed-schema payload, and attempts webhook delivery in a non-blocking way. Command exit semantics must remain authoritative; alert-send errors are logging concerns only. Because both smoke and selector-health commands already have deterministic "end-of-run" points, they can emit exactly one failure alert per run.

**Primary recommendation:** Add a shared `buildFailureAlertPayload` + `publishFailureAlert` module, then wire it into smoke and selector-health scripts only after final result determination and report persistence, guarded by CI-only-default configuration.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js built-in `fetch` + `AbortController` | Node 20 runtime | Webhook POST with timeout control | No new dependency and sufficient for JSON webhook delivery |
| Existing reliability result artifacts (`runId`, `result`, `issues`, per-fixture/per-scope data) | Existing | Source of alert payload fields | Keeps payload grounded in current command outputs |
| Existing script orchestrators (`scripts/smoke-reliability.mjs`, `scripts/health-selectors.mjs`) | Existing | End-of-run trigger points and exit-code ownership | Supports one alert per failing run without changing execution core |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `node:process` env inspection | Runtime | CI-only default gating + webhook configuration | Always, before attempting webhook delivery |
| Existing report paths under `.planning/artifacts/*` | Existing | Include artifact/log references in payload | When report persistence succeeds |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Built-in `fetch` | `axios` / `node-fetch` | Adds dependency footprint without additional required capability |
| Shared alert module | Separate per-script alert implementations | Faster initially but duplicates payload contract logic and risks drift |
| Environment-based config | CLI flags for webhook config | More explicit per run, but higher operator overhead and drift from CI defaults |

## Architecture Patterns

### Pattern 1: Result-to-Envelope Normalization
**What:** Convert smoke and selector-health result shapes into one normalized alert input schema (`source`, `runId`, `stage/scope`, fixture/scope identifiers, artifact reference).
**When to use:** Every alert-producing path, including command-level failures.

### Pattern 2: Fixed Payload Contract With Versioning
**What:** Emit structured JSON with deterministic keys, normalized enum fields, UTC timestamps, and `payloadVersion`.
**When to use:** All outgoing webhook notifications.

### Pattern 3: Non-Blocking Delivery Wrapper
**What:** Return structured send outcome (`sent`, `statusCode`, `error`) from webhook publisher and log warning on failure, never throw fatal errors back into command exit flow.
**When to use:** Every call site from smoke/selector-health scripts.

### Pattern 4: End-of-Run Triggering
**What:** Send only after final result composition (including schema gate for smoke), and only for failing runs.
**When to use:** Main success/failure execution paths where final pass/fail is known.

### Anti-Patterns To Avoid
- Sending alerts before run completion (partial failure lists violate locked decisions).
- Emitting success/recovery alerts by default.
- Letting webhook failures alter `process.exitCode` for smoke/selector-health outcomes.
- Divergent payload shapes between smoke and selector-health sources.
- Truncating fixture IDs in alert payload when full list is available.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dual alert schemas per command | Two independent payload contracts | Single shared payload builder | Prevents source-specific drift and checker failures |
| Retry policy engine | Full backoff/circuit-breaker framework | Single-attempt send with timeout + warning log | Meets phase scope without dedup/escalation expansion |
| New alert storage system | Separate alerts database/files | Existing run artifacts + payload references | Keeps phase focused on notifications, not persistence architecture |

## Common Pitfalls

- Missing run IDs in command-level failure paths unless fallback payload mapping is explicit.
- Inconsistent failure-source naming (`selector-health` vs `selector_health`) causing integration confusion.
- Empty fixture lists represented as missing field instead of explicit empty array + reason.
- Alert module throwing exceptions that override command failure semantics.
- Local developer runs spamming webhook channels if CI-only gating is not defaulted.

## Validation Architecture

- Static checks:
  - `node --check src/reliability/alerts/*.js scripts/smoke-reliability.mjs scripts/health-selectors.mjs`
- Payload contract checks:
  - `node -e "import('./src/reliability/alerts/payload.js').then(({buildFailureAlertPayload})=>{const p=buildFailureAlertPayload({source:'smoke',result:{runId:'r1',result:'fail',issues:[{fixtureId:'a',failedStage:'matches',error:'boom'}],summary:{failedFixtures:1,totalFixtures:1},fixtures:[{fixtureId:'a',status:'fail',failedStage:'matches',error:'boom'}]},metadata:{artifactPath:'.planning/artifacts/smoke/latest.json'}});if(!p||p.source!=='smoke'||!Array.isArray(p.affectedIdentifiers))process.exit(1);}).catch(()=>process.exit(1));"`
- CI-only gating checks:
  - `node -e "import('./src/reliability/alerts/config.js').then(({shouldSendFailureAlert})=>{const yes=shouldSendFailureAlert({runResult:'fail',env:{CI:'true',RELIABILITY_ALERT_WEBHOOK_URL:'https://example.test'}});const no=shouldSendFailureAlert({runResult:'pass',env:{CI:'true',RELIABILITY_ALERT_WEBHOOK_URL:'https://example.test'}});if(!yes.enabled||no.enabled)process.exit(1);}).catch(()=>process.exit(1));"`
- Non-blocking delivery behavior checks:
  - `npm run smoke:reliability -- --dry-run --sample 1` (with/without webhook env vars; verify command result remains authoritative)
  - `npm run health:selectors -- --dry-run --scope countries --sample 1` (same exit behavior expectation)

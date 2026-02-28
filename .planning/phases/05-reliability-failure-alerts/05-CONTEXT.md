# Phase 5: Reliability Failure Alerts - Context

**Gathered:** 2026-02-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Add proactive failure notifications for `smoke` and `selector-health` runs via webhook/chat integrations, including enough normalized context for fast triage without opening full logs. This phase does not add dedup/cooldown policy or multi-channel escalation routing.

</domain>

<decisions>
## Implementation Decisions

### Trigger Timing and Granularity
- Send alerts at end-of-run for failing runs.
- Emit one alert per failing run.
- Keep `smoke` and `selector-health` failures as separate alerts (no cross-run grouping).
- Do not emit recovery alerts on the next success by default.
- If alert delivery fails, always log a warning without masking the underlying command failure status.
- Alert emission waits until the final failure set is known.
- Alerting defaults to CI runs only (not local/dev runs).
- Any qualifying failure triggers an alert (no severity threshold in this phase).

### Payload Detail and Field Formatting
- Payload includes required fields plus a one-line human summary.
- Include full affected fixture/scope identifiers in payload (no top-N truncation).
- Include artifact/log reference fields when available.
- Include a normalized machine-friendly failure code.
- Canonical contract is a structured JSON object with fixed keys.
- Source uses normalized enum values (e.g., `smoke`, `selector_health`).
- Timestamps use UTC ISO-8601 format.
- Include both human-readable message text and structured fields.
- Keep stage and scope as separate structured fields.
- Sort fixture identifiers deterministically.
- When fixture IDs are unavailable, include an explicit empty fixtures list plus a scope-reason field.
- Include a payload schema version field.

### Claude's Discretion
- Exact key names and payload nesting details, as long as they preserve the fixed-schema and normalized-contract decisions above.

</decisions>

<specifics>
## Specific Ideas

No specific product/UI references were requested; preference is low-noise, high-triage-value alerting with stable machine-readable payloads.

</specifics>

<deferred>
## Deferred Ideas

- Alert deduplication/cooldown policy (tracked as RELY-10, out of Phase 5 scope).
- Multi-channel escalation routing (explicitly out of v1.2 scope).

</deferred>

---

*Phase: 05-reliability-failure-alerts*
*Context gathered: 2026-02-28*

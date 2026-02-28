# Phase 7: Alert Signal Controls - Context

**Gathered:** 2026-02-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Add deduplication and cooldown controls for reliability alerts so repeated identical failures inside a configured window are suppressed, while first-occurrence and post-window failures still emit actionable alerts with audit visibility.

</domain>

<decisions>
## Implementation Decisions

### Alert identity rules
- Alert signature key is `fixture + check type + normalized error class + region`.
- Error normalization strips variable tokens such as timestamps, IDs, and numeric fragments before signature comparison.
- Workflow/environment/region context changes create new signatures.
- The first emitted alert after cooldown includes suppressed count and suppression window summary.

### Cooldown semantics
- Cooldown uses a sliding window from the most recent suppressed duplicate.
- Only signature changes reset cooldown.
- The first occurrence at or after expiry emits an alert and opens a new cooldown window.
- No interim alerts are sent during cooldown; suppressed events are summarized on the next emitted alert.

### Operator control surface
- Policy model is global defaults with optional per-workflow overrides.
- Cooldown configuration uses duration strings (for example `15m`, `1h`).
- If config is missing, dedupe remains enabled with conservative default cooldown.
- Invalid config emits a diagnostic error and falls back to last-known-valid/effective defaults.

### Audit visibility for suppressed alerts
- Suppression evidence is written to both runtime logs and persisted diagnostics artifacts.
- Each dedupe decision record contains signature key, first-seen, last-seen, suppressed-count, cooldown-until, and suppression reason.
- Artifacts roll up one entry per signature per run (aggregated counts).
- Emitted post-cooldown alerts include a compact suppression summary.

### Claude's Discretion
- Exact naming format for normalized signature fields in diagnostics output.
- Final wording/layout of suppression summary text in emitted alerts and logs.

</decisions>

<specifics>
## Specific Ideas

No specific external references were requested; focus is deterministic dedupe behavior with clear operator auditability.

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope.

</deferred>

---

*Phase: 07-alert-signal-controls*
*Context gathered: 2026-02-28*

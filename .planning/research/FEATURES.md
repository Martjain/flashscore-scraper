# Feature Research

**Domain:** Operational reliability for scheduled scraper verification
**Researched:** 2026-02-28
**Confidence:** MEDIUM

## Feature Landscape

### Table Stakes (Users Expect These)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Failed-fixture rerun mode | Reliability users expect fast recovery after partial smoke failures | MEDIUM | Read latest smoke artifact and rerun only failed fixture IDs |
| Alerting on failures | Teams expect proactive signal instead of discovering failures manually | MEDIUM | Emit webhook payloads for smoke and selector-health failures |
| Rotating regional matrix | Coverage should grow beyond a single static fixture set | MEDIUM | Add deterministic rotation key (region/date) to fixture selection |

### Differentiators (Competitive Advantage)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Actionable failure alerts | Reduces mean time to triage by linking exactly what failed | LOW | Include run ID, failing stage, and quick rerun command |
| Runtime-bounded default plus extended rotation | Balances fast feedback with broader regression detection | MEDIUM | Keep default small sample and schedule deeper matrix separately |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Alert on every successful run | Feels like full observability | Creates noisy channels and desensitizes responders | Notify on failures only (optionally summarize successes daily) |
| Exhaustive global matrix per commit | Maximizes confidence | Runtime and flake risk become unmanageable | Rotating extended matrix on schedule + targeted reruns |

## Feature Dependencies

```
Failed-fixture rerun
    └──requires──> machine-readable smoke artifact
                           └──requires──> stable fixture IDs

Alerting
    └──requires──> normalized failure summary

Regional rotation
    └──requires──> fixture metadata (region)
                           └──enhances──> smoke suite coverage
```

### Dependency Notes

- **Rerun requires artifact contract:** without stable `issues` + `fixtureId` fields, rerun selection is brittle.
- **Alerting requires failure normalization:** both smoke and selector-health should map to a shared summary payload.
- **Regional rotation requires matrix metadata:** fixture entries need region tags and deterministic rotation inputs.

## MVP Definition

### Launch With (v1.2)

- [ ] Failed-only rerun mode from latest smoke artifact
- [ ] Failure alerting webhook integration with actionable payload
- [ ] Rotating regional matrix mode for scheduled smoke runs

### Add After Validation (v1.2.x)

- [ ] Retry policy by failure type (timeouts vs selector drift)
- [ ] Alert deduplication or cooldown windows

### Future Consideration (v2+)

- [ ] Multi-channel escalation routing policies
- [ ] Historical reliability trend dashboards

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Failed-only rerun mode | HIGH | MEDIUM | P1 |
| Failure webhooks | HIGH | MEDIUM | P1 |
| Rotating regional matrix | HIGH | MEDIUM | P1 |
| Alert deduplication | MEDIUM | MEDIUM | P2 |

## Sources

- Current requirements backlog in `.planning/PROJECT.md`
- Current smoke and selector-health report structures
- Existing CI execution flow in `.github/workflows/reliability-smoke.yml`

---
*Feature research for: FlashscoreScraping v1.2 reliability operations*
*Researched: 2026-02-28*

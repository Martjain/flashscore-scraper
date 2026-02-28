# Pitfalls Research

**Domain:** Reliability operations for scheduled scraper smoke checks
**Researched:** 2026-02-28
**Confidence:** MEDIUM

## Critical Pitfalls

### Pitfall 1: Rerun mode targets wrong fixtures

**What goes wrong:** Failed-only reruns execute incorrect IDs or empty sets due to artifact parsing drift.

**Why it happens:** Rerun logic assumes artifact structure without validation.

**How to avoid:** Validate `latest.json` shape and fallback to explicit `--fixture` override on invalid artifacts.

**Warning signs:** Rerun reports "no_matching_fixtures" after known failures.

**Phase to address:** Phase 4

---

### Pitfall 2: Alert noise overwhelms response channels

**What goes wrong:** Teams ignore notifications due to frequent low-value messages.

**Why it happens:** Alerts emit for successes, retries, and transient non-actionable events.

**How to avoid:** Notify failures only with concise actionable payload and optional cooldown.

**Warning signs:** Multiple identical alerts per run or repeated non-actionable pings.

**Phase to address:** Phase 5

---

### Pitfall 3: Extended matrix destabilizes default CI runtime

**What goes wrong:** Regular CI checks become slow/flaky after adding more regions.

**Why it happens:** Extended coverage runs on every trigger instead of bounded schedule.

**How to avoid:** Separate default representative matrix from rotating extended mode.

**Warning signs:** Median smoke runtime increases sharply for routine runs.

**Phase to address:** Phase 6

---

### Pitfall 4: Missing failure context in alert payload

**What goes wrong:** Alerts announce failure without enough data to triage quickly.

**Why it happens:** Payload excludes run ID, failed stage, or fixture IDs.

**How to avoid:** Enforce payload contract including run metadata and top failing fixtures.

**Warning signs:** Engineers open raw logs to discover basic failure details.

**Phase to address:** Phase 5

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Parsing artifacts inline inside scripts | Fast implementation | Duplicate parsing and drift bugs | Never for shared reliability workflows |
| Hardcoding rotation calendar in CI YAML | Easy rollout | Hard to test and evolve region logic | Short-term only, replace with code-based selector |

## "Looks Done But Isn't" Checklist

- [ ] **Rerun mode:** verifies artifact schema before selecting failed fixtures.
- [ ] **Alerting:** includes run ID, result, failure stage, and failing fixture IDs.
- [ ] **Rotation:** keeps default smoke runtime budget unchanged.
- [ ] **CI:** documents trigger intent for default vs extended runs.

## Sources

- Existing smoke/selector artifacts and runner code
- Existing reliability workflow design and retention behavior

---
*Pitfalls research for: FlashscoreScraping v1.2 reliability operations*
*Researched: 2026-02-28*

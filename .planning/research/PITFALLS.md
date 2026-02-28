# Pitfalls Research

**Domain:** Reliability hardening for Playwright-based scraper pipelines
**Researched:** 2026-02-28
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Silent selector drift masked by partial extraction

**What goes wrong:**
Scrape command still runs, but key sections (league links, season links, statistics blocks) return empty or degraded data.

**Why it happens:**
Selectors are treated as implementation detail instead of explicit contract; drift is detected only after user-facing breakage.

**How to avoid:**
Define selector contracts with health probes and fail early when critical selectors break.

**Warning signs:**
Unexpected empty arrays, frequent fallback usage spikes, or sudden drop in fields populated per match.

**Phase to address:**
Phase 2 (selector health checks and fallback monitoring)

---

### Pitfall 2: Flaky smoke tests caused by fixed sleeps and unstable targets

**What goes wrong:**
Smoke suite alternates pass/fail without code changes, reducing trust in CI.

**Why it happens:**
Tests rely on timing guesses (`waitForTimeout`) and volatile fixtures instead of deterministic targets plus web-first assertions.

**How to avoid:**
Use deterministic fixture matrix, explicit assertions, bounded retries, and trace capture on retry.

**Warning signs:**
Same test failing in different steps, high rerun pass rate, or failures concentrated around navigation timing.

**Phase to address:**
Phase 3 (automated end-to-end smoke coverage)

---

### Pitfall 3: Over-broad smoke matrix that blocks delivery velocity

**What goes wrong:**
CI becomes too slow/noisy, and reliability checks are bypassed by contributors.

**Why it happens:**
Attempting exhaustive league/country coverage on every PR instead of right-sized representative checks.

**How to avoid:**
Split fast representative smoke from extended scheduled runs and enforce strict runtime budget.

**Warning signs:**
Pipeline duration keeps growing, frequent CI queue congestion, and contributors skipping local validation.

**Phase to address:**
Phase 3 (smoke suite design and CI rollout)

---

### Pitfall 4: Schema compatibility verified outside smoke path

**What goes wrong:**
Navigation/extraction smoke passes while downstream consumers still break due to shape drift.

**Why it happens:**
Schema checks are run manually or separately, not as a required gate in reliability workflow.

**How to avoid:**
Integrate `validate:schema` into smoke command and CI workflow as a required pass condition.

**Warning signs:**
Smoke green but consumer parser errors, or schema command infrequently run in practice.

**Phase to address:**
Phase 3 (smoke + schema integration)

---

### Pitfall 5: Weak diagnostics on failure

**What goes wrong:**
Breakages are reported as generic "scrape failed" errors with no selector/page context.

**Why it happens:**
No structured output artifact, traces, or failure metadata capture in scripts.

**How to avoid:**
Emit machine-readable drift/smoke reports and store Playwright traces for retries/failures.

**Warning signs:**
Long triage sessions, repeated manual reproduction, and inconsistent fix quality.

**Phase to address:**
Phase 2 and Phase 3

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Inline selector fixes in service files only | Quick hotfix | Selector governance decays; repeated drift bugs | Emergency patch only, followed by contract update |
| One giant smoke script | Faster initial implementation | Hard debugging and poor extensibility | Never for milestone reliability foundation |
| Global retry count without per-step policy | Fewer immediate reds | Masks real defects and inflates runtime | Temporary during flaky-environment incident |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Playwright + CI | Running headed mode by default in CI | Use headless defaults, collect traces/videos only on failure/retry |
| Smoke + schema validator | Treating schema as optional post-check | Chain schema validation as required smoke step |
| Reliability reports + CI artifacts | Printing only console logs | Write JSON artifacts and upload from workflow |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Unbounded concurrency for fixture matrix | Browser crashes, timeout spikes, unstable CI | Limit parallelism with `p-limit` and fixture queueing | Usually at 5+ concurrent browser contexts |
| Always-on deep tracing/screenshots | Large artifact storage and slow runs | Use `trace: on-first-retry` and capture media selectively | Any daily scheduled smoke with multiple fixtures |
| Re-running full suite for single fixture failure | Long feedback loops | Add targeted rerun mode and fail-fast per fixture group | Noticeable once suite exceeds ~10 minutes |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Committing session/cookie artifacts from debug runs | Credential leakage or unauthorized reuse | Store debug artifacts in ignored temp paths and sanitize uploads |
| Logging full page HTML with dynamic IDs/tokens | Sensitive data exposure in CI logs | Redact logs and capture focused selector diagnostics |
| Aggressive request rates during probes | IP throttling/temporary blocks | Enforce polite rate limits and bounded retries |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Health check output is too technical | Users cannot act on failures | Include plain-language failure reason + suggested next step |
| Smoke command hides fixture progress | Users think process is hung | Show progress per fixture with elapsed time |
| Failure result not tied to requirement contract | Hard to assess release readiness | Map failures to REQ IDs in reports/summary |

## "Looks Done But Isn't" Checklist

- [ ] **Selector health checks:** Often missing fallback coverage - verify each critical selector has ordered fallback candidates.
- [ ] **Smoke matrix:** Often missing schema validation - verify `validate:schema` executes in same workflow.
- [ ] **CI integration:** Often missing scheduled trigger - verify daily cron and manual dispatch both exist.
- [ ] **Diagnostics:** Often missing machine-readable artifact - verify JSON report is created and uploaded.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Silent selector drift | MEDIUM | Run health checks, identify failing contract entries, patch selector map, rerun targeted smoke |
| Flaky smoke instability | MEDIUM | Analyze trace, replace sleeps with assertions, tighten fixture determinism, tune retry policy |
| Oversized smoke suite | LOW | Split into fast representative and extended scheduled suites; enforce runtime budget |
| Missing diagnostics | LOW | Add structured report writer + CI artifact upload and rerun failing fixture |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Silent selector drift | Phase 2 | Health command fails when any critical selector contract breaks |
| Flaky smoke behavior | Phase 3 | Repeated runs are stable under same fixtures with low rerun variance |
| Oversized smoke suite | Phase 3 | Default CI runtime remains within agreed budget |
| Schema check disconnected | Phase 3 | Smoke fails whenever schema validator fails |
| Weak diagnostics | Phase 2/3 | Failure artifacts contain selector/fixture-level detail |

## Sources

- https://playwright.dev/docs/best-practices
- https://playwright.dev/docs/auto-waiting
- https://playwright.dev/docs/test-retries
- https://playwright.dev/docs/test-timeouts
- https://playwright.dev/docs/test-reporters

---
*Pitfalls research for: scraper reliability hardening*
*Researched: 2026-02-28*

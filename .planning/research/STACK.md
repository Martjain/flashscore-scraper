# Stack Research

**Domain:** Reliability operations for Flashscore scraping (rerun + alerting + rotating matrix)
**Researched:** 2026-02-28
**Confidence:** MEDIUM

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Node.js | 20.x CI / ESM runtime | CLI and automation orchestration | Already used by project and CI workflow |
| Playwright | ^1.56.1 | Browser-driven extraction and smoke checks | Existing coverage and diagnostics pipeline depend on it |
| GitHub Actions | v4 actions ecosystem | Scheduled/manual reliability orchestration | Existing workflow already runs smoke and uploads artifacts |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `p-limit` | ^7.2.0 | Bound expanded matrix concurrency | Use when rotating matrix size increases total fixture count |
| `chalk` | ^5.6.2 | Clear CLI failure summaries for alerts/reruns | Use for compact, actionable operator output |
| Native `fetch` (Node 20) | built-in | Post webhook notifications | Use for Slack/Teams/Discord webhooks without extra dependency |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `.planning/artifacts/smoke/latest.json` | Source for failed-fixture reruns | Already contains `issues` and per-fixture statuses |
| `.planning/artifacts/selector-health/latest.json` | Alert payload source for selector drift | Includes run metadata and failure counters |
| `actions/upload-artifact@v4` | Persist reports for debugging | Keep and link run IDs in alerts |

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Native `fetch` webhook sender | `axios`/`node-fetch` | Only add if auth/signing complexity grows |
| One smoke command with modes | Separate scripts per mode | Consider if command complexity becomes unmaintainable |
| Matrix rotation in app code | Large static YAML matrix in workflow | Use YAML-only if rotation logic must be entirely CI-driven |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Hardcoded failed fixture IDs in CI | Breaks rerun automation and stale quickly | Parse latest smoke artifact and derive failures dynamically |
| Alert messages without context | Creates noisy, non-actionable incidents | Include run ID, failed stage, fixture IDs, and artifact path |
| Running full extended matrix on every trigger | High runtime/flakiness and slower feedback | Keep fast default matrix; schedule rotating extended runs |

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `playwright@^1.56.1` | Node.js 20 | Matches current workflow install/setup |
| `actions/setup-node@v4` | npm cache + Node 20 | Existing workflow already aligned |

## Sources

- Existing project runtime and scripts (`package.json`, `scripts/smoke-reliability.mjs`)
- Existing artifact formats (`.planning/artifacts/smoke/latest.json`, `.planning/artifacts/selector-health/latest.json`)
- Existing CI workflow (`.github/workflows/reliability-smoke.yml`)

---
*Stack research for: FlashscoreScraping v1.2 reliability operations*
*Researched: 2026-02-28*

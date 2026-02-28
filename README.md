# FlashscoreScraping

Playwright-based scraping and reliability tooling for extracting soccer match data from `flashscoreusa.com` with stable schema and CI smoke coverage.

## Fork Notice

This repository is a fork of the original project:
`https://github.com/gustavofariaa/FlashscoreScraping`

This fork maintains its own roadmap and reliability hardening changes.

## What This Repository Includes

- Interactive/main scraper flow (`npm run start`) for country -> league -> season selection.
- JSON schema validator (`npm run validate:schema`) for output compatibility checks.
- Selector health contracts and probes (`npm run health:selectors`) for early DOM drift detection.
- End-to-end reliability smoke runner (`npm run smoke:reliability`) with required schema gating.
- CI reliability workflow (`.github/workflows/reliability-smoke.yml`) with manual + scheduled execution.

## Requirements

- Node.js 18+
- npm
- Playwright Chromium

## Installation

```bash
git clone https://github.com/Martjain/flashscore-scraper.git
cd FlashscoreScraping
npm install
npx playwright install --with-deps chromium
```

## NPM Scripts

| Script | Purpose |
|---|---|
| `npm run start` | Run main scraping CLI |
| `npm run validate:schema -- <file>` | Validate output JSON contract |
| `npm run health:selectors -- [flags]` | Probe selector contracts and emit diagnostics |
| `npm run smoke:reliability -- [flags]` | Run bounded traversal smoke with required schema gate |

## Main Scraper Usage

Run interactive mode:

```bash
npm run start
```

Run with direct arguments:

```bash
npm run start country=argentina league=liga-profesional fileType=json-array
```

Supported argument keys:

- `country`
- `league`
- `fileType` (`json`, `json-array`, `csv`)
- `concurrency`
- `saveInterval`
- `headless` (`true`/`false`)

## Schema Validation

Validate a generated data file:

```bash
npm run validate:schema -- src/data/example.array.json
```

Optional sample size:

```bash
npm run validate:schema -- src/data/example.array.json --sample 10
```

## Selector Health Check

Run contract probes for selected scopes:

```bash
npm run health:selectors -- --scope countries --scope leagues --sample 1
```

Strict mode (fails on fallback selector usage):

```bash
npm run health:selectors -- --strict --scope match-list --scope match-detail --sample 1 --fail-fast
```

Artifacts:

- `.planning/artifacts/selector-health/latest.json`
- Timestamped history files under `.planning/artifacts/selector-health/`

## Reliability Smoke Automation

Run bounded end-to-end smoke (country -> league -> season -> match):

```bash
npm run smoke:reliability -- --sample 2 --max-matches 1
```

Matrix mode controls (default remains bounded):

```bash
# Default bounded selection (same behavior as prior releases)
npm run smoke:reliability -- --sample 2 --matrix-mode default

# Extended deterministic regional rotation
npm run smoke:reliability -- --sample 2 --matrix-mode extended --rotation-key 2026-W09
```

Environment-backed controls (used by CI schedule path):

```bash
RELIABILITY_SMOKE_MATRIX_MODE=extended RELIABILITY_SMOKE_ROTATION_KEY=2026-W09 npm run smoke:reliability -- --sample 2
```

Dry run (no browser/network):

```bash
npm run smoke:reliability -- --dry-run --sample 1
```

Target a specific fixture:

```bash
npm run smoke:reliability -- --sample 1 --max-matches 1 --fixture argentina-liga-profesional --timeout-ms 120000
```

Rerun only failed fixtures from the latest artifact:

```bash
npm run smoke:reliability -- --dry-run --rerun-failed
```

Rerun with a specific artifact path:

```bash
npm run smoke:reliability -- --dry-run --rerun-failed --artifact /tmp/smoke-run.json
```

### Smoke Guarantees

- For live runs, `validate:schema` is a required gate before `RESULT: pass`.
- A machine-readable artifact is always written before exit.
- Exit code is non-zero for traversal failures or schema-gate failures.
- Rerun preflight failures (missing/invalid artifact or no rerunnable failed fixtures) exit non-zero and print manual `--fixture` fallback guidance.
- Alert delivery failures are warning-only and never override smoke/selector-health pass/fail exit status.

Smoke artifacts:

- `.planning/artifacts/smoke/latest.json`
- `.planning/artifacts/smoke/schema-input-latest.json`
- Timestamped history files under `.planning/artifacts/smoke/`

Extended artifacts include a `selection` block with deterministic provenance:

- `selection.mode` / `selection.requestedMode`
- `selection.rotationKey`
- `selection.selectedRegion` + `selection.regionToken`
- `selection.fixtureIds` + `selection.reason`

## Failure Alerts

Smoke and selector-health commands can emit one webhook alert per failing run after final result and report persistence.

### Environment Variables

| Variable | Purpose | Default |
|---|---|---|
| `RELIABILITY_ALERT_WEBHOOK_URL` | Webhook destination for failure alerts | unset (alerts disabled) |
| `RELIABILITY_ALERT_ENABLED` | Global enable/disable override (`false` disables even in CI) | enabled when other gates pass |
| `RELIABILITY_ALERT_ALLOW_LOCAL` | Allow alert sends outside CI for local testing (`true`) | disabled (CI-only default) |

### Trigger Behavior

- Alerts are sent only when final command `RESULT` is `fail`.
- Success runs do not emit routine success/recovery alerts.
- At most one alert is emitted per failing smoke run and per failing selector-health run.
- Webhook/network failures produce warning logs only.

### Payload Contract

Alert payloads are structured JSON with stable keys, including:

- `payloadVersion`, `eventType`, `source` (`smoke` or `selector_health`)
- `runId`, `summary`, `failureCode`
- `timestamps.startedAt|completedAt|emittedAt` (UTC ISO-8601)
- `context.stage`, `context.scope`, `context.mode`
- `affectedIdentifiers` (deterministic sorted list) plus `affectedIdentifiersReason` when empty
- `references.artifactPath|historyPath|logUrl` (when available)

## CI Reliability Workflow

Workflow file: `.github/workflows/reliability-smoke.yml`

Triggers:

- `workflow_dispatch`
- Weekly `schedule`

The job installs dependencies + Playwright Chromium, runs `npm run smoke:reliability`, and uploads smoke artifacts for both pass/fail runs.
Scheduled executions automatically set:

- `RELIABILITY_SMOKE_MATRIX_MODE=extended`
- `RELIABILITY_SMOKE_ROTATION_KEY=$(date -u +%G-W%V)` (ISO week token)

`workflow_dispatch` remains bounded by default (`matrix_mode=default`) unless operators explicitly choose extended mode and/or provide a custom rotation key.
When `RELIABILITY_ALERT_WEBHOOK_URL` is configured as a repository secret, CI smoke failures can emit webhook alerts.

`workflow_dispatch` inputs also support:

- `rerun_failed=true` to run rerun mode from artifact failures.
- `artifact=<path>` to override the artifact path used by rerun mode.
- `matrix_mode=default|extended` to control selection strategy.
- `rotation_key=<token>` to force deterministic extended selection.

## Output Shape

Main output and schema-gate payloads follow this structure per match:

```json
{
  "matchId": "YNiVIdYA",
  "stage": "ROUND 8",
  "date": "02:45 PM, February 28, 2026",
  "status": "",
  "home": { "name": "Boca Juniors", "image": "..." },
  "away": { "name": "Gimnasia Mendoza", "image": "..." },
  "result": {
    "home": null,
    "away": null,
    "regulationTime": null,
    "penalties": null
  },
  "information": [{ "category": "Venue", "value": "..." }],
  "statistics": [{ "category": "Ball Possession", "homeValue": "57%", "awayValue": "43%" }]
}
```

## License

UNLICENSED

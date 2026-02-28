<h1 align="center">
  <img src=".github/Logo.svg" alt="FlashscoreScraping logo" width="120" />
</h1>

# FlashscoreScraping

Playwright-based scraping and reliability tooling for extracting soccer match data from `flashscoreusa.com` with stable schema and CI smoke coverage.

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
git clone https://github.com/gustavofariaa/FlashscoreScraping.git
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

Dry run (no browser/network):

```bash
npm run smoke:reliability -- --dry-run --sample 1
```

Target a specific fixture:

```bash
npm run smoke:reliability -- --sample 1 --max-matches 1 --fixture argentina-liga-profesional --timeout-ms 120000
```

### Smoke Guarantees

- For live runs, `validate:schema` is a required gate before `RESULT: pass`.
- A machine-readable artifact is always written before exit.
- Exit code is non-zero for traversal failures or schema-gate failures.

Smoke artifacts:

- `.planning/artifacts/smoke/latest.json`
- `.planning/artifacts/smoke/schema-input-latest.json`
- Timestamped history files under `.planning/artifacts/smoke/`

## CI Reliability Workflow

Workflow file: `.github/workflows/reliability-smoke.yml`

Triggers:

- `workflow_dispatch`
- Weekly `schedule`

The job installs dependencies + Playwright Chromium, runs `npm run smoke:reliability`, and uploads smoke artifacts for both pass/fail runs.

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

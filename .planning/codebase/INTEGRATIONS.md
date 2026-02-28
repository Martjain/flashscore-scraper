# External Integrations

**Analysis Date:** 2026-02-28

## APIs & External Services

**Primary External Service:**
- Flashscore Web Application (`https://www.flashscore.com`) - Source of all scraped match metadata and statistics
  - Integration method: Playwright-driven browser navigation and DOM extraction
  - Auth: None implemented (public pages)
  - Usage points:
    - Country list: `src/scraper/services/countries/index.js`
    - League list: `src/scraper/services/leagues/index.js`
    - Season list: `src/scraper/services/seasons/index.js`
    - Match and stats pages: `src/scraper/services/matches/index.js`

**External API SDKs:**
- No REST/GraphQL SDK clients detected beyond browser automation

## Data Storage

**Databases:**
- None detected

**File Storage:**
- Local filesystem writes only
  - Base path: `OUTPUT_PATH` in `src/constants/index.js` (`./src/data`)
  - JSON writer: `src/files/json/index.js`
  - CSV writer: `src/files/csv/index.js`

**Caching:**
- No dedicated cache service (Redis/Memcached) detected

## Authentication & Identity

**Auth Provider:**
- None

**OAuth Integrations:**
- None

## Monitoring & Observability

**Error Tracking:**
- None (no Sentry/Datadog/New Relic integration detected)

**Analytics:**
- None

**Logs:**
- Console-based logs only (`console.info`, `console.warn`, `console.error`)

## CI/CD & Deployment

**Hosting:**
- No deployment target configured (CLI tool)

**CI Pipeline:**
- No GitHub Actions workflows found under `.github/workflows/`

## Environment Configuration

**Development:**
- Configuration via CLI flags only
- No required environment variables detected

**Staging/Production:**
- No environment split documented

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## Integration Reliability Notes

- Selectors are tightly coupled to Flashscore DOM classes and `data-testid` markers in `src/scraper/services/matches/index.js`.
- Any upstream markup change can break scraping flows without code changes.
- No backoff policy tied to remote rate limits beyond local retry wrapper in `src/index.js`.

---

*Integration audit: 2026-02-28*
*Update when adding/removing external services*

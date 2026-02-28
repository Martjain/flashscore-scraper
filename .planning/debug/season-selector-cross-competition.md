---
status: awaiting_human_verify
trigger: "$gsd-debug i ran npm run start and season shows other data > flashscore-scraping@1.4.0 start > node src/index.js ... Select a country: Mexico ... Select a league: Liga MX ... Select a league season: Africa Cup of Nations / Archive / Asian Cup / Betway Premiership ..."
created: 2026-02-28T03:37:00Z
updated: 2026-02-28T03:42:00Z
---

## Current Focus

hypothesis: season selector is pulling global soccer anchors instead of archive-season anchors
test: run Mexico -> Liga MX reproduction and inspect `/soccer/mexico/liga-mx/archive/` DOM
expecting: archive-only selector should return Liga MX historical seasons only
next_action: have user verify interactive CLI season list now shows Liga MX seasons only

## Symptoms

expected: after selecting Mexico and Liga MX, season prompt shows Liga MX season history only
actual: season prompt showed unrelated competitions (Africa Cup of Nations, Asian Cup, Betway Premiership, etc.)
errors: none (logic/data bug)
reproduction: run `npm run start` -> choose `Mexico` -> `Liga MX` -> inspect season prompt
started: after soccer-route migration and selector fallback broadening

## Eliminated

- hypothesis: countries/leagues route domain is incorrect
  evidence: Mexico and Liga MX resolve correctly under `/soccer/`; only season options are polluted
  timestamp: 2026-02-28T03:39:00Z

## Evidence

- timestamp: 2026-02-28T03:38:00Z
  checked: service-level reproduction using `getListOfSeasons` for `https://www.flashscoreusa.com/soccer/mexico/liga-mx/`
  found: season list contained unrelated competitions and tabs (91 entries)
  implication: selector scope is too broad

- timestamp: 2026-02-28T03:40:00Z
  checked: DOM inspection of `https://www.flashscoreusa.com/soccer/mexico/liga-mx/archive/`
  found: archive seasons are under `.archiveLatte__season a`; generic `a[href*='/soccer/']` includes global menus
  implication: need archive-only selectors + league-path filter

- timestamp: 2026-02-28T03:42:00Z
  checked: post-fix reproduction
  found: season list now 25 entries, starting `Liga MX 2025/2026`, `Liga MX 2024/2025`, etc.
  implication: root cause fixed

## Resolution

root_cause: `getListOfSeasons` used broad fallback selectors including `a[href*='/soccer/']`, causing global navigation/competition links to be treated as seasons
fix: restricted season extraction to archive selectors (`.archiveLatte__season > a`, `div.archive__season > a`, `.archive__row .archive__season a`) and filtered hrefs to match selected sport/country/league slug
verification: automated reproduction now returns only Liga MX season history (25 entries); no unrelated competitions appear in service output
files_changed:
  - src/scraper/services/seasons/index.js

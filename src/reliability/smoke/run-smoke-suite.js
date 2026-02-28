import { getListOfCountries } from "../../scraper/services/countries/index.js";
import { getListOfLeagues } from "../../scraper/services/leagues/index.js";
import { getListOfSeasons } from "../../scraper/services/seasons/index.js";
import {
  getMatchData,
  getMatchLinks,
} from "../../scraper/services/matches/index.js";
import {
  DEFAULT_FIXTURE_TIMEOUT_MS,
  DEFAULT_MAX_MATCHES,
  DEFAULT_SMOKE_SAMPLE,
  selectSmokeFixtures,
} from "./fixture-matrix.js";

const normalizePositiveInteger = (value, fallback) =>
  Number.isInteger(value) && value > 0 ? value : fallback;

const normalizeSlug = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");

const getLeagueSlug = (leagueUrl) => {
  if (!leagueUrl) return null;

  try {
    const segments = new URL(leagueUrl).pathname.split("/").filter(Boolean);
    return segments[2] ?? null;
  } catch {
    return null;
  }
};

const withTimeout = async (promiseFactory, timeoutMs, message) => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  try {
    return await Promise.race([promiseFactory(), timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
};

const createFixtureFailure = ({
  fixture,
  startedAt,
  counters,
  failedStage,
  error,
  diagnostics = {},
}) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  return {
    fixtureId: fixture.fixtureId,
    fixtureLabel: fixture.label,
    status: "fail",
    failedStage,
    error: errorMessage,
    durationMs: Date.now() - startedAt,
    counters,
    diagnostics,
    matchChecks: [],
  };
};

const createFixturePass = ({
  fixture,
  startedAt,
  counters,
  diagnostics,
  matchChecks,
}) => ({
  fixtureId: fixture.fixtureId,
  fixtureLabel: fixture.label,
  status: "pass",
  failedStage: null,
  error: null,
  durationMs: Date.now() - startedAt,
  counters,
  diagnostics,
  matchChecks,
});

const findCountry = (countries, countryId) =>
  countries.find((country) => normalizeSlug(country?.id) === normalizeSlug(countryId)) ??
  null;

const findLeague = (leagues, leagueSlugHint) => {
  const normalizedHint = normalizeSlug(leagueSlugHint);
  if (!normalizedHint) return leagues[0] ?? null;

  const exact = leagues.find(
    (league) => normalizeSlug(getLeagueSlug(league?.url)) === normalizedHint
  );
  return exact ?? leagues[0] ?? null;
};

const findSeason = (seasons, seasonHint) => {
  const normalizedHint = normalizeSlug(seasonHint);
  if (!normalizedHint) return seasons[0] ?? null;

  const exact = seasons.find((season) =>
    normalizeSlug(`${season?.name ?? ""} ${season?.url ?? ""}`).includes(
      normalizedHint
    )
  );
  return exact ?? seasons[0] ?? null;
};

const collectMatchChecks = async ({ context, matchLinks, maxMatches }) => {
  const selected = matchLinks.slice(0, maxMatches);
  const checks = [];

  for (const matchLink of selected) {
    try {
      const data = await getMatchData(context, matchLink);
      const matchId = data?.matchId ?? matchLink?.id ?? null;
      const hasCoreData = Boolean(data?.home?.name || data?.away?.name);

      checks.push({
        matchId,
        status: hasCoreData ? "pass" : "fail",
        reason: hasCoreData ? null : "empty_team_payload",
      });
    } catch (error) {
      checks.push({
        matchId: matchLink?.id ?? null,
        status: "fail",
        reason: error instanceof Error ? error.message : "match_data_error",
      });
    }
  }

  return checks;
};

const runFixtureSmoke = async ({ context, fixture, maxMatches, timeoutMs }) => {
  const startedAt = Date.now();
  const counters = {
    countriesDiscovered: 0,
    leaguesDiscovered: 0,
    seasonsDiscovered: 0,
    matchesDiscovered: 0,
    matchesChecked: 0,
  };
  const diagnostics = {};

  try {
    const countries = await withTimeout(
      () => getListOfCountries(context),
      timeoutMs,
      `countries timeout for fixture ${fixture.fixtureId}`
    );
    counters.countriesDiscovered = Array.isArray(countries) ? countries.length : 0;
    diagnostics.countries = countries?.selectorDiagnostics ?? [];

    if (!Array.isArray(countries) || countries.length === 0) {
      return createFixtureFailure({
        fixture,
        startedAt,
        counters,
        failedStage: "countries",
        error: "no_countries_found",
        diagnostics,
      });
    }

    const selectedCountry = findCountry(countries, fixture.countryId);
    if (!selectedCountry) {
      return createFixtureFailure({
        fixture,
        startedAt,
        counters,
        failedStage: "countries",
        error: `country_not_found:${fixture.countryId}`,
        diagnostics,
      });
    }

    const leagues = await withTimeout(
      () => getListOfLeagues(context, selectedCountry.id),
      timeoutMs,
      `leagues timeout for fixture ${fixture.fixtureId}`
    );
    counters.leaguesDiscovered = Array.isArray(leagues) ? leagues.length : 0;
    diagnostics.leagues = leagues?.selectorDiagnostics ?? [];

    if (!Array.isArray(leagues) || leagues.length === 0) {
      return createFixtureFailure({
        fixture,
        startedAt,
        counters,
        failedStage: "leagues",
        error: `no_leagues_found:${selectedCountry.id}`,
        diagnostics,
      });
    }

    const selectedLeague = findLeague(leagues, fixture.leagueSlugHint);
    if (!selectedLeague?.url) {
      return createFixtureFailure({
        fixture,
        startedAt,
        counters,
        failedStage: "leagues",
        error: "league_url_missing",
        diagnostics,
      });
    }

    const seasons = await withTimeout(
      () => getListOfSeasons(context, selectedLeague.url),
      timeoutMs,
      `seasons timeout for fixture ${fixture.fixtureId}`
    );
    counters.seasonsDiscovered = Array.isArray(seasons) ? seasons.length : 0;
    diagnostics.seasons = seasons?.selectorDiagnostics ?? [];

    if (!Array.isArray(seasons) || seasons.length === 0) {
      return createFixtureFailure({
        fixture,
        startedAt,
        counters,
        failedStage: "seasons",
        error: `no_seasons_found:${selectedLeague.url}`,
        diagnostics,
      });
    }

    const selectedSeason = findSeason(seasons, fixture.seasonHint);
    if (!selectedSeason?.url) {
      return createFixtureFailure({
        fixture,
        startedAt,
        counters,
        failedStage: "seasons",
        error: "season_url_missing",
        diagnostics,
      });
    }

    const resultMatches = await withTimeout(
      () => getMatchLinks(context, selectedSeason.url, "results"),
      timeoutMs,
      `results timeout for fixture ${fixture.fixtureId}`
    );
    const upcomingMatches = await withTimeout(
      () => getMatchLinks(context, selectedSeason.url, "fixtures"),
      timeoutMs,
      `fixtures timeout for fixture ${fixture.fixtureId}`
    );
    const matchLinks = [...(upcomingMatches ?? []), ...(resultMatches ?? [])];
    counters.matchesDiscovered = matchLinks.length;
    diagnostics.matches = matchLinks?.selectorDiagnostics ?? [];

    if (!Array.isArray(matchLinks) || matchLinks.length === 0) {
      return createFixtureFailure({
        fixture,
        startedAt,
        counters,
        failedStage: "matches",
        error: `no_matches_found:${selectedSeason.url}`,
        diagnostics,
      });
    }

    const matchChecks = await collectMatchChecks({
      context,
      matchLinks,
      maxMatches,
    });
    counters.matchesChecked = matchChecks.length;

    const failedMatch = matchChecks.find((check) => check.status === "fail");
    if (failedMatch) {
      return createFixtureFailure({
        fixture,
        startedAt,
        counters,
        failedStage: "match-data",
        error: failedMatch.reason,
        diagnostics,
      });
    }

    return createFixturePass({
      fixture,
      startedAt,
      counters,
      diagnostics,
      matchChecks,
    });
  } catch (error) {
    return createFixtureFailure({
      fixture,
      startedAt,
      counters,
      failedStage: "runner",
      error,
      diagnostics,
    });
  }
};

const runFixtureDryRun = (fixture) => ({
  fixtureId: fixture.fixtureId,
  fixtureLabel: fixture.label,
  status: "pass",
  failedStage: null,
  error: null,
  durationMs: 0,
  counters: {
    countriesDiscovered: 0,
    leaguesDiscovered: 0,
    seasonsDiscovered: 0,
    matchesDiscovered: 0,
    matchesChecked: 0,
  },
  diagnostics: {
    dryRun: true,
  },
  matchChecks: [],
});

const buildSummary = (fixtures, durationMs) => {
  const passedFixtures = fixtures.filter((fixture) => fixture.status === "pass").length;
  const failedFixtures = fixtures.length - passedFixtures;

  return {
    totalFixtures: fixtures.length,
    passedFixtures,
    failedFixtures,
    durationMs,
    result: failedFixtures === 0 ? "pass" : "fail",
  };
};

const buildIssues = (fixtures) =>
  fixtures
    .filter((fixture) => fixture.status === "fail")
    .map((fixture) => ({
      fixtureId: fixture.fixtureId,
      failedStage: fixture.failedStage,
      error: fixture.error,
    }));

export const runSmokeSuite = async (options = {}) => {
  const sample = normalizePositiveInteger(options.sample, DEFAULT_SMOKE_SAMPLE);
  const maxMatches = normalizePositiveInteger(
    options.maxMatches,
    DEFAULT_MAX_MATCHES
  );
  const timeoutMs = normalizePositiveInteger(
    options.timeoutMs,
    DEFAULT_FIXTURE_TIMEOUT_MS
  );
  const dryRun = Boolean(options.dryRun);
  const fixtureIds = Array.isArray(options.fixtureIds) ? options.fixtureIds : [];
  const fixtures = selectSmokeFixtures({ sample, fixtureIds });

  const startedAtEpoch = Date.now();
  const startedAt = new Date(startedAtEpoch).toISOString();
  const runId = `smoke-${startedAtEpoch}`;

  const fixtureResults = [];
  if (fixtures.length === 0) {
    fixtureResults.push({
      fixtureId: "selection",
      fixtureLabel: "Fixture selection",
      status: "fail",
      failedStage: "selection",
      error: "no_matching_fixtures",
      durationMs: 0,
      counters: {
        countriesDiscovered: 0,
        leaguesDiscovered: 0,
        seasonsDiscovered: 0,
        matchesDiscovered: 0,
        matchesChecked: 0,
      },
      diagnostics: {
        requestedFixtureIds: fixtureIds,
      },
      matchChecks: [],
    });
  } else {
    for (const fixture of fixtures) {
      if (dryRun) {
        fixtureResults.push(runFixtureDryRun(fixture));
        continue;
      }

      fixtureResults.push(
        await runFixtureSmoke({
          context: options.context,
          fixture,
          maxMatches,
          timeoutMs,
        })
      );
    }
  }

  const completedAt = new Date().toISOString();
  const durationMs = Date.now() - startedAtEpoch;
  const summary = buildSummary(fixtureResults, durationMs);
  const issues = buildIssues(fixtureResults);

  return {
    runId,
    startedAt,
    completedAt,
    durationMs,
    result: summary.result,
    mode: dryRun ? "dry-run" : "live",
    options: {
      sample,
      maxMatches,
      timeoutMs,
      fixtureIds,
      dryRun,
    },
    summary,
    fixtures: fixtureResults,
    issues,
    schemaGate: null,
  };
};


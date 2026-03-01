import { BASE_URL, TIMEOUT } from "../../constants/index.js";
import { getListOfCountries } from "../../scraper/services/countries/index.js";
import { getListOfLeagues } from "../../scraper/services/leagues/index.js";
import { getListOfSeasons } from "../../scraper/services/seasons/index.js";
import { getMatchLinks } from "../../scraper/services/matches/index.js";
import {
  SELECTOR_HEALTH_SCOPES,
  listCriticalSelectorContracts,
} from "../contracts/index.js";
import { resolveSelector } from "../probe/resolveSelector.js";
import { collectProbeDiagnostics } from "../probe/collectProbeDiagnostics.js";

const DEFAULT_SCOPE_ORDER = Object.freeze([
  SELECTOR_HEALTH_SCOPES.COUNTRIES,
  SELECTOR_HEALTH_SCOPES.LEAGUES,
  SELECTOR_HEALTH_SCOPES.SEASONS,
  SELECTOR_HEALTH_SCOPES.MATCH_LIST,
  SELECTOR_HEALTH_SCOPES.MATCH_DETAIL,
]);
const STATIC_DRY_RUN_URLS = Object.freeze({
  [SELECTOR_HEALTH_SCOPES.COUNTRIES]: `${BASE_URL}/soccer/`,
  [SELECTOR_HEALTH_SCOPES.LEAGUES]: `${BASE_URL}/soccer/usa/`,
  [SELECTOR_HEALTH_SCOPES.SEASONS]: `${BASE_URL}/soccer/usa/mls/archive`,
  [SELECTOR_HEALTH_SCOPES.MATCH_LIST]: `${BASE_URL}/soccer/usa/mls/results`,
  [SELECTOR_HEALTH_SCOPES.MATCH_DETAIL]: `${BASE_URL}/match/demo/`,
});
const MATCH_DETAIL_SEED_LEAGUE_URL = `${BASE_URL}/soccer/usa/mls`;

const CONTRACT_BY_SCOPE = new Map(
  listCriticalSelectorContracts().map((contract) => [contract.scope, contract])
);

const uniqueByUrl = (targets) => {
  const seen = new Set();
  return targets.filter((target) => {
    if (!target.url || seen.has(target.url)) return false;
    seen.add(target.url);
    return true;
  });
};

const hasSampleLimit = (sample) => Number.isInteger(sample) && sample > 0;

const normalizeSample = (sample) => (hasSampleLimit(sample) ? sample : null);

const normalizeSelectionSeed = (seed) => {
  const parsed = Number(seed);
  if (Number.isInteger(parsed) && parsed >= 0) return parsed;
  return Date.now();
};

const getSelectionIndex = (size, label, selectionSeed) => {
  if (!Number.isInteger(size) || size <= 0) return -1;
  const source = `${label}:${size}`;
  let hash = selectionSeed >>> 0;

  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 33 + source.charCodeAt(index)) >>> 0;
  }

  return hash % size;
};

const pickAnyValue = (values, label, selectionSeed) => {
  if (!Array.isArray(values) || values.length === 0) return null;
  const index = getSelectionIndex(values.length, label, selectionSeed);
  if (index < 0) return null;
  return values[index] ?? null;
};

const normalizeScopes = (scopes) => {
  const requested = Array.isArray(scopes) && scopes.length ? scopes : DEFAULT_SCOPE_ORDER;
  return requested.filter((scope) => CONTRACT_BY_SCOPE.has(scope));
};

const getStaticTargets = (scope, contract) => {
  const url = STATIC_DRY_RUN_URLS[scope];
  if (!url) return [];

  return [{ scope, contract, url, source: "static-fallback" }];
};

const initializeScopeMetrics = (scope) => ({
  scope,
  checks: [],
  criticalFailures: 0,
  warnings: 0,
  fallbackUsages: 0,
  result: "pass",
});

const initializeRunMetrics = () => ({
  checks: 0,
  criticalFailures: 0,
  warnings: 0,
  fallbackUsages: 0,
});

const getRunId = () => `selector-health-${Date.now()}`;

const safeErrorReason = (error) =>
  error instanceof Error && error.message
    ? `probe_exception:${error.message}`
    : "probe_exception";

const getCountries = async (context) => {
  const countries = await getListOfCountries(context);
  return Array.isArray(countries)
    ? countries.filter((country) => country?.id).map((country) => country.id)
    : [];
};

const getCountryLeagueUrls = async (context, countryId) => {
  const list = await getListOfLeagues(context, countryId);
  if (!Array.isArray(list)) return [];

  return list
    .filter((league) => league?.url)
    .map((league) => league.url.replace(/\/+$/, ""));
};

const getLeagueSeasonUrls = async (context, leagueUrl) => {
  const list = await getListOfSeasons(context, leagueUrl);
  if (!Array.isArray(list)) return [];

  return list
    .filter((season) => season?.url)
    .map((season) => season.url.replace(/\/+$/, ""));
};

const getSeasonMatchUrls = async (context, seasonUrl) => {
  const list = await getMatchLinks(context, seasonUrl, "results");
  if (!Array.isArray(list)) return [];

  return list.filter((match) => match?.url).map((match) => match.url);
};

const getLeagues = async (context, countryIds, sample) => {
  const leagues = [];
  const limited = hasSampleLimit(sample);

  for (const countryId of countryIds) {
    if (limited && leagues.length >= sample) break;
    const list = await getListOfLeagues(context, countryId);
    if (!Array.isArray(list)) continue;

    for (const league of list) {
      if (!league?.url) continue;
      leagues.push(league.url.replace(/\/+$/, ""));
      if (limited && leagues.length >= sample) break;
    }
  }

  return leagues;
};

const getSeasons = async (context, leagueUrls, sample) => {
  const seasons = [];
  const limited = hasSampleLimit(sample);

  for (const leagueUrl of leagueUrls) {
    if (limited && seasons.length >= sample) break;
    const list = await getListOfSeasons(context, leagueUrl);
    if (!Array.isArray(list)) continue;

    for (const season of list) {
      if (!season?.url) continue;
      seasons.push(season.url.replace(/\/+$/, ""));
      if (limited && seasons.length >= sample) break;
    }
  }

  return seasons;
};

const getMatchUrls = async (context, seasonUrls, sample) => {
  const matches = [];
  const limited = hasSampleLimit(sample);

  for (const seasonUrl of seasonUrls) {
    if (limited && matches.length >= sample) break;
    const list = await getMatchLinks(context, seasonUrl, "results");
    if (!Array.isArray(list)) continue;

    for (const match of list) {
      if (!match?.url) continue;
      matches.push(match.url);
      if (limited && matches.length >= sample) break;
    }
  }

  return matches;
};

const getSeedMatchUrls = async (context, sample) => {
  try {
    const list = await getMatchLinks(context, MATCH_DETAIL_SEED_LEAGUE_URL, "results");
    if (!Array.isArray(list)) return [];

    const urls = list
      .filter((match) => match?.url)
      .map((match) => match.url);
    return hasSampleLimit(sample) ? urls.slice(0, sample) : urls;
  } catch {
    return [];
  }
};

const buildScopeTargets = async ({
  context,
  scope,
  sample,
  dryRun,
  pickAny,
  selectionSeed,
}) => {
  const contract = CONTRACT_BY_SCOPE.get(scope);
  if (!contract) return [];

  if (dryRun) {
    const dryRunUrl = STATIC_DRY_RUN_URLS[scope];
    return dryRunUrl
      ? [{ scope, contract, url: dryRunUrl, dryRun: true, source: "static" }]
      : [];
  }

  if (!context) return [];

  if (scope === SELECTOR_HEALTH_SCOPES.COUNTRIES) {
    return [{ scope, contract, url: `${BASE_URL}/soccer/`, source: "countries-root" }];
  }

  const countryIds = await getCountries(context);
  if (scope === SELECTOR_HEALTH_SCOPES.LEAGUES) {
    if (pickAny) {
      const representativeCountryId = pickAnyValue(
        countryIds,
        "representative-country",
        selectionSeed
      );
      if (!representativeCountryId) {
        return getStaticTargets(scope, contract);
      }

      return [
        {
          scope,
          contract,
          url: `${BASE_URL}/soccer/${representativeCountryId}/`,
          source: "country-discovery:any",
        },
      ];
    }

    const selectedCountryIds = hasSampleLimit(sample)
      ? countryIds.slice(0, sample)
      : countryIds;
    const targets = uniqueByUrl(
      selectedCountryIds.map((countryId) => ({
        scope,
        contract,
        url: `${BASE_URL}/soccer/${countryId}/`,
        source: "country-discovery",
      }))
    );
    return targets.length > 0 ? targets : getStaticTargets(scope, contract);
  }

  let leagues = [];
  if (pickAny) {
    const representativeCountryId = pickAnyValue(
      countryIds,
      "representative-country",
      selectionSeed
    );
    if (representativeCountryId) {
      leagues = await getCountryLeagueUrls(context, representativeCountryId);
    }
  } else {
    leagues = await getLeagues(context, countryIds, sample);
  }

  if (scope === SELECTOR_HEALTH_SCOPES.SEASONS) {
    if (pickAny) {
      const representativeLeagueUrl = pickAnyValue(
        leagues,
        "representative-league",
        selectionSeed
      );
      if (!representativeLeagueUrl) {
        return getStaticTargets(scope, contract);
      }

      return [
        {
          scope,
          contract,
          url: `${representativeLeagueUrl}/archive`,
          source: "league-discovery:any",
        },
      ];
    }

    const targets = uniqueByUrl(
      leagues.map((leagueUrl) => ({
        scope,
        contract,
        url: `${leagueUrl}/archive`,
        source: "league-discovery",
      }))
    );
    return targets.length > 0 ? targets : getStaticTargets(scope, contract);
  }

  let seasons = [];
  if (pickAny) {
    const representativeLeagueUrl = pickAnyValue(
      leagues,
      "representative-league",
      selectionSeed
    );
    if (representativeLeagueUrl) {
      seasons = await getLeagueSeasonUrls(context, representativeLeagueUrl);
    }
  } else {
    seasons = await getSeasons(context, leagues, sample);
  }

  if (scope === SELECTOR_HEALTH_SCOPES.MATCH_LIST) {
    if (pickAny) {
      const representativeSeasonUrl = pickAnyValue(
        seasons,
        "representative-season",
        selectionSeed
      );
      if (!representativeSeasonUrl) {
        return getStaticTargets(scope, contract);
      }

      return [
        {
          scope,
          contract,
          url: `${representativeSeasonUrl}/results`,
          source: "season-discovery:any",
        },
      ];
    }

    const targets = uniqueByUrl(
      seasons.map((seasonUrl) => ({
        scope,
        contract,
        url: `${seasonUrl}/results`,
        source: "season-discovery",
      }))
    );
    return targets.length > 0 ? targets : getStaticTargets(scope, contract);
  }

  let matches = [];
  if (pickAny) {
    const representativeSeasonUrl = pickAnyValue(
      seasons,
      "representative-season",
      selectionSeed
    );
    if (representativeSeasonUrl) {
      matches = await getSeasonMatchUrls(context, representativeSeasonUrl);
    }
  } else {
    matches = await getMatchUrls(context, seasons, sample);
  }

  if (matches.length === 0) {
    matches = await getSeedMatchUrls(context, pickAny ? 1 : sample);
  }
  if (scope === SELECTOR_HEALTH_SCOPES.MATCH_DETAIL) {
    if (pickAny) {
      const representativeMatchUrl = pickAnyValue(
        matches,
        "representative-match",
        selectionSeed
      );
      if (!representativeMatchUrl) {
        return getStaticTargets(scope, contract);
      }

      return [
        {
          scope,
          contract,
          url: representativeMatchUrl,
          source: "match-discovery:any",
        },
      ];
    }

    const targets = uniqueByUrl(
      matches.map((matchUrl) => ({
        scope,
        contract,
        url: matchUrl,
        source: "match-discovery",
      }))
    );
    return targets.length > 0 ? targets : getStaticTargets(scope, contract);
  }

  return [];
};

const buildProbeCheck = ({ strict, resolution, target, durationMs }) => {
  const diagnostics = collectProbeDiagnostics(resolution, { url: target.url });
  const criticalFailure = !resolution.ok;
  const fallbackUsage = Boolean(resolution.ok && resolution.fallbackUsed);
  const failed = criticalFailure || (strict && fallbackUsage);

  return {
    scope: target.scope,
    contractKey: target.contract.key,
    url: target.url,
    source: target.source,
    status: failed ? "fail" : fallbackUsage ? "warning" : "pass",
    criticalFailure,
    fallbackUsage,
    warning: fallbackUsage && !strict,
    matchedSelector: resolution.matchedSelector,
    matchedSelectorIndex: resolution.matchedSelectorIndex,
    selectorsTried: resolution.selectorsTried,
    errorReason: resolution.errorReason,
    durationMs,
    diagnostics,
  };
};

const probeTarget = async ({ context, target, strict }) => {
  const startedAt = Date.now();
  let page;

  try {
    page = await context.newPage();
    await page.goto(target.url, { waitUntil: "domcontentloaded" });

    const resolution = await resolveSelector(page, target.contract, {
      timeoutMs: TIMEOUT,
    });

    return buildProbeCheck({
      strict,
      resolution,
      target,
      durationMs: Date.now() - startedAt,
    });
  } catch (error) {
    const failedResolution = {
      ok: false,
      scope: target.scope,
      contractKey: target.contract.key,
      selectorsTried: [...target.contract.selectors],
      matchedSelector: null,
      matchedSelectorIndex: null,
      pageUrl: target.url,
      errorReason: safeErrorReason(error),
      fallbackUsed: false,
      fallbackCount: 0,
    };

    return buildProbeCheck({
      strict,
      resolution: failedResolution,
      target,
      durationMs: Date.now() - startedAt,
    });
  } finally {
    await page?.close();
  }
};

const buildMissingTargetCheck = (scope, contract) => ({
  scope,
  contractKey: contract.key,
  url: null,
  source: "discovery",
  status: "fail",
  criticalFailure: true,
  fallbackUsage: false,
  warning: false,
  matchedSelector: null,
  matchedSelectorIndex: null,
  selectorsTried: [...contract.selectors],
  errorReason: "no_probe_targets",
  durationMs: 0,
  diagnostics: {
    scope,
    contractKey: contract.key,
    selectorsTried: [...contract.selectors],
    matchedSelector: null,
    matchedSelectorIndex: null,
    fallbackUsed: false,
    fallbackCount: 0,
    url: null,
    errorReason: "no_probe_targets",
  },
});

const buildDryRunCheck = (scope, contract, url) => ({
  scope,
  contractKey: contract.key,
  url,
  source: "dry-run",
  status: "skipped",
  criticalFailure: false,
  fallbackUsage: false,
  warning: false,
  matchedSelector: null,
  matchedSelectorIndex: null,
  selectorsTried: [...contract.selectors],
  errorReason: null,
  durationMs: 0,
  diagnostics: {
    scope,
    contractKey: contract.key,
    selectorsTried: [...contract.selectors],
    matchedSelector: null,
    matchedSelectorIndex: null,
    fallbackUsed: false,
    fallbackCount: 0,
    url,
    errorReason: null,
  },
});

const updateMetrics = (runMetrics, scopeMetrics, check) => {
  if (check.status === "skipped") return;

  runMetrics.checks += 1;

  if (check.criticalFailure) {
    runMetrics.criticalFailures += 1;
    scopeMetrics.criticalFailures += 1;
  }

  if (check.fallbackUsage) {
    runMetrics.fallbackUsages += 1;
    scopeMetrics.fallbackUsages += 1;
  }

  if (check.warning) {
    runMetrics.warnings += 1;
    scopeMetrics.warnings += 1;
  }

  if (check.status === "fail") {
    scopeMetrics.result = "fail";
  }
};

export const runSelectorHealthCheck = async (options = {}) => {
  const startedAt = new Date();
  const strict = Boolean(options.strict);
  const failFast = Boolean(options.failFast);
  const dryRun = Boolean(options.dryRun);
  const pickAny = Boolean(options.pickAny);
  const selectionSeed = normalizeSelectionSeed(options.selectionSeed);
  const sample = normalizeSample(options.sample);
  const scopes = normalizeScopes(options.scopes);
  const runMetrics = initializeRunMetrics();
  const scopeResults = [];
  let halt = false;

  const limited = hasSampleLimit(sample);

  for (const scope of scopes) {
    if (halt) break;

    const contract = CONTRACT_BY_SCOPE.get(scope);
    if (!contract) continue;

    const scopeMetrics = initializeScopeMetrics(scope);
    const targets = await buildScopeTargets({
      context: options.context,
      scope,
      sample,
      dryRun,
      pickAny,
      selectionSeed,
    });

    if (targets.length === 0) {
      const check = dryRun
        ? buildDryRunCheck(scope, contract, STATIC_DRY_RUN_URLS[scope] ?? null)
        : buildMissingTargetCheck(scope, contract);
      scopeMetrics.checks.push(check);
      updateMetrics(runMetrics, scopeMetrics, check);
      scopeResults.push(scopeMetrics);

      if (!dryRun && failFast) {
        halt = true;
      }
      continue;
    }

    const targetsToProbe = limited ? targets.slice(0, sample) : targets;
    for (const target of targetsToProbe) {
      if (dryRun) {
        const check = buildDryRunCheck(scope, contract, target.url);
        scopeMetrics.checks.push(check);
        continue;
      }

      const check = await probeTarget({
        context: options.context,
        target,
        strict,
      });

      scopeMetrics.checks.push(check);
      updateMetrics(runMetrics, scopeMetrics, check);

      if (check.status === "fail" && failFast) {
        halt = true;
        break;
      }
    }

    scopeResults.push(scopeMetrics);
  }

  const durationMs = Date.now() - startedAt.getTime();
  const targetMode = pickAny ? "any" : limited ? "sample" : "all";
  const result = dryRun
    ? "pass"
    : runMetrics.criticalFailures > 0 || (strict && runMetrics.fallbackUsages > 0)
      ? "fail"
      : "pass";

  return {
    runId: getRunId(),
    startedAt: startedAt.toISOString(),
    completedAt: new Date().toISOString(),
    durationMs,
    mode: strict ? "strict" : "default",
    strict,
    failFast,
    dryRun,
    sample,
    targetMode,
    selectionSeed: pickAny ? selectionSeed : null,
    scopes,
    checks: runMetrics.checks,
    criticalFailures: runMetrics.criticalFailures,
    warnings: runMetrics.warnings,
    fallbackUsages: runMetrics.fallbackUsages,
    result,
    scopeResults,
  };
};

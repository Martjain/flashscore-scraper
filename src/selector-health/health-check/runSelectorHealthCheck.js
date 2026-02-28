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

const DEFAULT_SAMPLE_SIZE = 1;
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

const normalizeSample = (sample) =>
  Number.isInteger(sample) && sample > 0 ? sample : DEFAULT_SAMPLE_SIZE;

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

const getLeagues = async (context, countryIds, sample) => {
  const leagues = [];

  for (const countryId of countryIds) {
    if (leagues.length >= sample) break;
    const list = await getListOfLeagues(context, countryId);
    if (!Array.isArray(list)) continue;

    for (const league of list) {
      if (!league?.url) continue;
      leagues.push(league.url.replace(/\/+$/, ""));
      if (leagues.length >= sample) break;
    }
  }

  return leagues;
};

const getSeasons = async (context, leagueUrls, sample) => {
  const seasons = [];

  for (const leagueUrl of leagueUrls) {
    if (seasons.length >= sample) break;
    const list = await getListOfSeasons(context, leagueUrl);
    if (!Array.isArray(list)) continue;

    for (const season of list) {
      if (!season?.url) continue;
      seasons.push(season.url.replace(/\/+$/, ""));
      if (seasons.length >= sample) break;
    }
  }

  return seasons;
};

const getMatchUrls = async (context, seasonUrls, sample) => {
  const matches = [];

  for (const seasonUrl of seasonUrls) {
    if (matches.length >= sample) break;
    const list = await getMatchLinks(context, seasonUrl, "results");
    if (!Array.isArray(list)) continue;

    for (const match of list) {
      if (!match?.url) continue;
      matches.push(match.url);
      if (matches.length >= sample) break;
    }
  }

  return matches;
};

const getSeedMatchUrls = async (context, sample) => {
  try {
    const list = await getMatchLinks(context, MATCH_DETAIL_SEED_LEAGUE_URL, "results");
    if (!Array.isArray(list)) return [];

    return list
      .filter((match) => match?.url)
      .map((match) => match.url)
      .slice(0, sample);
  } catch {
    return [];
  }
};

const buildScopeTargets = async ({ context, scope, sample, dryRun }) => {
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
    const targets = uniqueByUrl(
      countryIds.slice(0, sample).map((countryId) => ({
        scope,
        contract,
        url: `${BASE_URL}/soccer/${countryId}/`,
        source: "country-discovery",
      }))
    );
    return targets.length > 0 ? targets : getStaticTargets(scope, contract);
  }

  const leagues = await getLeagues(context, countryIds, sample);
  if (scope === SELECTOR_HEALTH_SCOPES.SEASONS) {
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

  const seasons = await getSeasons(context, leagues, sample);
  if (scope === SELECTOR_HEALTH_SCOPES.MATCH_LIST) {
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

  let matches = await getMatchUrls(context, seasons, sample);
  if (matches.length === 0) {
    matches = await getSeedMatchUrls(context, sample);
  }
  if (scope === SELECTOR_HEALTH_SCOPES.MATCH_DETAIL) {
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
  const sample = normalizeSample(options.sample);
  const scopes = normalizeScopes(options.scopes);
  const runMetrics = initializeRunMetrics();
  const scopeResults = [];
  let halt = false;

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

    for (const target of targets.slice(0, sample)) {
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
    scopes,
    checks: runMetrics.checks,
    criticalFailures: runMetrics.criticalFailures,
    warnings: runMetrics.warnings,
    fallbackUsages: runMetrics.fallbackUsages,
    result,
    scopeResults,
  };
};

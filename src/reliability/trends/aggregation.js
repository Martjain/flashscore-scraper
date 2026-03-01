import { getFixtureById } from "../smoke/fixture-matrix.js";
import { parseReliabilitySignature, resolveReliabilityIdentity } from "./signature-parser.js";

const DEFAULT_REGION_KEY = "global";

const normalizeKey = (value, fallback) => {
  const normalized = value
    ?.toString()
    ?.trim()
    ?.toLowerCase()
    ?.replace(/[^a-z0-9:_-]+/g, "-")
    ?.replace(/-+/g, "-")
    ?.replace(/^-|-$/g, "");
  return normalized || fallback;
};

const toRate = (failedRuns, runs) => (runs > 0 ? Number((failedRuns / runs).toFixed(4)) : 0);

const buildSourceCoverage = (runs = []) => {
  const coverage = {
    smoke: { runs: 0, failedRuns: 0 },
    selector_health: { runs: 0, failedRuns: 0 },
  };

  runs.forEach((run) => {
    if (!coverage[run.source]) {
      coverage[run.source] = { runs: 0, failedRuns: 0 };
    }
    coverage[run.source].runs += 1;
    if (run.result === "fail") coverage[run.source].failedRuns += 1;
  });

  return coverage;
};

const buildSignatureRegionLookup = (run = {}) => {
  const entries =
    run?.payload?.alertDedupe?.entries ||
    run?.payload?.alerts?.dedupe?.entries ||
    [];

  const regionByFixture = new Map();
  entries.forEach((entry) => {
    const signature = parseReliabilitySignature(entry?.signatureKey || "");
    const fixture = normalizeKey(signature.fixture, "");
    const region = normalizeKey(signature.region, "");
    if (!fixture || !region) return;
    if (!regionByFixture.has(fixture)) {
      regionByFixture.set(fixture, region);
    }
  });

  return regionByFixture;
};

const resolveSmokeRegion = ({ fixtureId, run, regionByFixture }) => {
  const normalizedFixture = normalizeKey(fixtureId, "unknown-fixture");
  if (regionByFixture.has(normalizedFixture)) {
    return regionByFixture.get(normalizedFixture);
  }

  const fixture = getFixtureById(normalizedFixture);
  if (fixture?.regionId) {
    return normalizeKey(fixture.regionId, DEFAULT_REGION_KEY);
  }

  return normalizeKey(run?.payload?.selection?.selectedRegion, DEFAULT_REGION_KEY);
};

const extractSmokeEvents = (run = {}, diagnostics = {}) => {
  const fixtures = Array.isArray(run?.payload?.fixtures) ? run.payload.fixtures : [];
  const issues = Array.isArray(run?.payload?.issues) ? run.payload.issues : [];
  const issueFailureCountByFixture = new Map();
  const syntheticIssueEvents = [];
  const regionByFixture = buildSignatureRegionLookup(run);

  issues.forEach((issue) => {
    const fixtureId = normalizeKey(issue?.fixtureId, "");
    if (!fixtureId || fixtureId === "run" || fixtureId === "schema-gate") {
      syntheticIssueEvents.push({
        fixture: "run",
        region: DEFAULT_REGION_KEY,
        failed: true,
        failureCount: 1,
      });
      return;
    }

    issueFailureCountByFixture.set(
      fixtureId,
      (issueFailureCountByFixture.get(fixtureId) || 0) + 1
    );
  });

  const fixtureEvents = fixtures.map((fixture) => {
    const fixtureId = normalizeKey(fixture?.fixtureId, "unknown-fixture");
    const normalized = resolveReliabilityIdentity({
      fixture: fixtureId,
      region: resolveSmokeRegion({
        fixtureId,
        run,
        regionByFixture,
      }),
      source: run.source,
    });
    const failed = fixture?.status === "fail";
    const failureCount = failed
      ? Math.max(issueFailureCountByFixture.get(fixtureId) || 0, 1)
      : 0;

    return {
      fixture: normalized.fixture,
      region: normalized.region,
      failed,
      failureCount,
    };
  });

  if (fixtures.length === 0 && syntheticIssueEvents.length > 0) {
    return syntheticIssueEvents;
  }

  if (fixtures.length === 0 && run.result === "fail") {
    diagnostics.uncategorizedFailures = (diagnostics.uncategorizedFailures || 0) + 1;
    return [
      {
        fixture: "run",
        region: DEFAULT_REGION_KEY,
        failed: true,
        failureCount: 1,
      },
    ];
  }

  return fixtureEvents;
};

const extractSelectorEvents = (run = {}, diagnostics = {}) => {
  const scopeResults = Array.isArray(run?.payload?.scopeResults)
    ? run.payload.scopeResults
    : [];
  const checks = scopeResults.flatMap((scopeResult) =>
    Array.isArray(scopeResult?.checks) ? scopeResult.checks : []
  );

  if (checks.length === 0) {
    const scopes = Array.isArray(run?.payload?.scopes) ? run.payload.scopes : [];
    if (scopes.length === 0) {
      diagnostics.uncategorizedRuns = (diagnostics.uncategorizedRuns || 0) + 1;
      return [
        {
          fixture: "selector:run",
          region: DEFAULT_REGION_KEY,
          failed: run.result === "fail",
          failureCount: run.result === "fail" ? 1 : 0,
        },
      ];
    }

    return scopes.map((scope) => ({
      fixture: normalizeKey(`selector:${scope}`, "selector:unknown"),
      region: DEFAULT_REGION_KEY,
      failed: false,
      failureCount: 0,
    }));
  }

  return checks.map((check) => {
    const scope = normalizeKey(check?.scope, "scope");
    const contract = normalizeKey(check?.contractKey, "check");
    const failed = check?.status === "fail";
    return {
      fixture: normalizeKey(`selector:${scope}:${contract}`, "selector:unknown"),
      region: DEFAULT_REGION_KEY,
      failed,
      failureCount: failed ? 1 : 0,
    };
  });
};

const extractRunEvents = (run = {}, diagnostics = {}) => {
  const baseEvent = {
    source: run.source,
    runId: run.runId,
    completedAt: run.completedAt,
  };

  const entries =
    run.source === "smoke"
      ? extractSmokeEvents(run, diagnostics)
      : extractSelectorEvents(run, diagnostics);

  return entries.map((entry) => ({
    ...baseEvent,
    ...entry,
  }));
};

const aggregateByKey = (events = [], keyName = "fixture") => {
  const fallbackKey = keyName === "fixture" ? "unknown-fixture" : "unknown-region";
  const map = new Map();

  events.forEach((event) => {
    const key = normalizeKey(event[keyName], fallbackKey);
    const current = map.get(key) || {
      [keyName]: key,
      runs: 0,
      failedRuns: 0,
      failureCount: 0,
      sources: new Set(),
      ...(keyName === "fixture" ? { region: event.region } : {}),
    };

    current.runs += 1;
    if (event.failed) current.failedRuns += 1;
    current.failureCount += Number(event.failureCount || 0);
    current.sources.add(event.source);
    if (keyName === "fixture") {
      current.region = current.region || event.region || DEFAULT_REGION_KEY;
    }

    map.set(key, current);
  });

  return [...map.values()]
    .map((entry) => ({
      ...entry,
      failureRate: toRate(entry.failedRuns, entry.runs),
      sources: [...entry.sources].sort((left, right) => left.localeCompare(right)),
    }))
    .sort((left, right) => {
      if (right.failureRate !== left.failureRate) {
        return right.failureRate - left.failureRate;
      }
      if (right.failureCount !== left.failureCount) {
        return right.failureCount - left.failureCount;
      }
      return left[keyName].toString().localeCompare(right[keyName].toString());
    });
};

export const aggregateReliabilityTrendData = (history = {}) => {
  const runs = Array.isArray(history?.runs) ? history.runs : [];
  const diagnostics = {
    uncategorizedFailures: 0,
    uncategorizedRuns: 0,
  };

  const events = runs.flatMap((run) => extractRunEvents(run, diagnostics));
  const byFixture = aggregateByKey(events, "fixture");
  const byRegion = aggregateByKey(events, "region");

  const totals = {
    runs: runs.length,
    failedRuns: runs.filter((run) => run.result === "fail").length,
    failureRate: toRate(
      runs.filter((run) => run.result === "fail").length,
      runs.length
    ),
    observations: events.length,
    failedObservations: events.filter((event) => event.failed).length,
    failureCount: events.reduce(
      (sum, event) => sum + Number(event.failureCount || 0),
      0
    ),
  };

  return {
    window: history?.window || null,
    totals,
    byFixture,
    byRegion,
    sourceCoverage: buildSourceCoverage(runs),
    diagnostics: {
      ...history?.diagnostics,
      ...diagnostics,
    },
  };
};

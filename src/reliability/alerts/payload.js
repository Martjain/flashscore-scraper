const PAYLOAD_VERSION = "1.0";
const SOURCE_SMOKE = "smoke";
const SOURCE_SELECTOR_HEALTH = "selector_health";

const asTrimmedString = (value) =>
  typeof value === "string" ? value.trim() : "";

const normalizeSource = (source) => {
  const normalized = asTrimmedString(source).toLowerCase();
  if (normalized === SOURCE_SMOKE) return SOURCE_SMOKE;
  if (normalized === SOURCE_SELECTOR_HEALTH) return SOURCE_SELECTOR_HEALTH;
  return "unknown";
};

const toIsoUtc = (value, fallback = new Date().toISOString()) => {
  if (!value) return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed.toISOString();
};

const sortUnique = (values = []) =>
  [...new Set(values.filter((value) => typeof value === "string" && value.trim()))].sort(
    (left, right) => left.localeCompare(right)
  );

const toFailureCodeToken = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "unknown";

const listSmokeFailedFixtureIds = (result = {}) => {
  const fixtureIds = (result.fixtures || [])
    .filter((fixture) => fixture?.status === "fail")
    .map((fixture) => asTrimmedString(fixture?.fixtureId));

  const issueFixtureIds = (result.issues || [])
    .map((issue) => asTrimmedString(issue?.fixtureId))
    .filter(
      (fixtureId) =>
        fixtureId && fixtureId !== "run" && fixtureId !== "schema-gate"
    );

  return sortUnique([...fixtureIds, ...issueFixtureIds]);
};

const summarizeSmoke = (result = {}) => {
  const failedFixtures = Number(result.summary?.failedFixtures || 0);
  const totalFixtures = Number(result.summary?.totalFixtures || 0);
  const runId = asTrimmedString(result.runId) || "unknown-run";
  return `Smoke reliability failed (${failedFixtures}/${totalFixtures} fixtures failed) [${runId}]`;
};

const summarizeSelectorHealth = (result = {}, failedChecks = []) => {
  const runId = asTrimmedString(result.runId) || "unknown-run";
  const failedScopes = sortUnique(failedChecks.map((check) => check.scope));
  return `Selector health failed (${failedChecks.length} checks across ${failedScopes.length} scopes) [${runId}]`;
};

const buildSmokeContext = (result = {}) => {
  const failedStages = sortUnique(
    (result.issues || []).map((issue) => asTrimmedString(issue?.failedStage))
  );
  const stage =
    failedStages.length === 0
      ? "unknown"
      : failedStages.length === 1
        ? failedStages[0]
        : "multiple";

  return {
    stage,
    scope: asTrimmedString(result.mode) || "fixture-matrix",
    mode: asTrimmedString(result.mode) || null,
    dryRun: Boolean(result.options?.dryRun),
  };
};

const buildSelectorHealthContext = (result = {}, failedChecks = []) => {
  const failedScopes = sortUnique(failedChecks.map((check) => check.scope));
  return {
    stage: "selector-probe",
    scope:
      failedScopes.length === 0
        ? "unknown"
        : failedScopes.length === 1
          ? failedScopes[0]
          : "multiple",
    mode: asTrimmedString(result.mode) || null,
    dryRun: Boolean(result.dryRun),
  };
};

const buildSmokeFailureCode = (result = {}) => {
  const primaryIssue = (result.issues || [])[0] || null;
  const explicitCode = asTrimmedString(primaryIssue?.code);
  const stage = asTrimmedString(primaryIssue?.failedStage) || "run";
  const token = explicitCode || `smoke_${stage}`;
  return toFailureCodeToken(token);
};

const buildSelectorFailureCode = (failedChecks = []) => {
  const primaryReason = asTrimmedString(failedChecks[0]?.errorReason);
  return toFailureCodeToken(`selector_health_${primaryReason || "failure"}`);
};

const buildReferences = (metadata = {}) => ({
  artifactPath: asTrimmedString(metadata.artifactPath) || null,
  historyPath: asTrimmedString(metadata.historyPath) || null,
  logUrl: asTrimmedString(metadata.logUrl) || null,
});

const buildSmokePayload = (result = {}, metadata = {}) => {
  const affectedIdentifiers = listSmokeFailedFixtureIds(result);
  const reason =
    affectedIdentifiers.length === 0
      ? "no_fixture_identifiers_available"
      : null;

  return {
    summary: summarizeSmoke(result),
    failureCode: buildSmokeFailureCode(result),
    context: buildSmokeContext(result),
    affectedIdentifiers,
    affectedIdentifiersReason: reason,
    metrics: {
      totalFixtures: Number(result.summary?.totalFixtures || 0),
      failedFixtures: Number(result.summary?.failedFixtures || 0),
      passedFixtures: Number(result.summary?.passedFixtures || 0),
      schemaGateStatus: asTrimmedString(result.schemaGate?.status) || null,
    },
    diagnostics: {
      issueCount: Array.isArray(result.issues) ? result.issues.length : 0,
      firstIssue: result.issues?.[0]
        ? {
            fixtureId: result.issues[0].fixtureId || null,
            failedStage: result.issues[0].failedStage || null,
            error: result.issues[0].error || null,
          }
        : null,
      rerunMode: Boolean(result.options?.rerunFailed),
      reportPath: asTrimmedString(metadata.artifactPath) || null,
    },
  };
};

const collectSelectorFailedChecks = (result = {}) =>
  (result.scopeResults || []).flatMap((scopeResult) =>
    (scopeResult.checks || []).filter((check) => check.status === "fail")
  );

const listSelectorAffectedIdentifiers = (failedChecks = []) =>
  sortUnique(
    failedChecks.map((check) =>
      [asTrimmedString(check.scope), asTrimmedString(check.contractKey)]
        .filter(Boolean)
        .join(":")
    )
  );

const buildSelectorPayload = (result = {}, metadata = {}) => {
  const failedChecks = collectSelectorFailedChecks(result);
  const affectedIdentifiers = listSelectorAffectedIdentifiers(failedChecks);
  const reason =
    affectedIdentifiers.length === 0
      ? "no_scope_identifiers_available"
      : null;

  return {
    summary: summarizeSelectorHealth(result, failedChecks),
    failureCode: buildSelectorFailureCode(failedChecks),
    context: buildSelectorHealthContext(result, failedChecks),
    affectedIdentifiers,
    affectedIdentifiersReason: reason,
    metrics: {
      checks: Number(result.checks || 0),
      criticalFailures: Number(result.criticalFailures || 0),
      warnings: Number(result.warnings || 0),
      fallbackUsages: Number(result.fallbackUsages || 0),
    },
    diagnostics: {
      failedCheckCount: failedChecks.length,
      failedScopes: sortUnique(failedChecks.map((check) => check.scope)),
      firstFailedCheck: failedChecks[0]
        ? {
            scope: failedChecks[0].scope || null,
            contractKey: failedChecks[0].contractKey || null,
            errorReason: failedChecks[0].errorReason || null,
          }
        : null,
      reportPath: asTrimmedString(metadata.artifactPath) || null,
    },
  };
};

const buildGenericPayload = (result = {}) => ({
  summary: `Reliability failure detected [${asTrimmedString(result.runId) || "unknown-run"}]`,
  failureCode: "unknown_failure",
  context: {
    stage: "unknown",
    scope: "unknown",
    mode: null,
    dryRun: false,
  },
  affectedIdentifiers: [],
  affectedIdentifiersReason: "unknown_source",
  metrics: {},
  diagnostics: {},
});

const buildSuppressionSummaryText = (dedupe = null) => {
  const count = Number(dedupe?.suppressionSummary?.suppressedCount || 0);
  if (count <= 0) return null;

  const firstSuppressedAt = asTrimmedString(
    dedupe?.suppressionSummary?.firstSuppressedAt
  );
  const lastSuppressedAt = asTrimmedString(
    dedupe?.suppressionSummary?.lastSuppressedAt
  );
  const cooldownUntil = asTrimmedString(dedupe?.suppressionSummary?.cooldownUntil);
  const boundaries = [firstSuppressedAt, lastSuppressedAt, cooldownUntil]
    .filter(Boolean)
    .join(" -> ");

  return boundaries
    ? `${count} duplicates suppressed (${boundaries})`
    : `${count} duplicates suppressed in prior cooldown window`;
};

export const buildFailureAlertPayload = ({
  source,
  result = {},
  metadata = {},
  dedupe = null,
} = {}) => {
  const normalizedSource = normalizeSource(source);
  const completedAt = toIsoUtc(result.completedAt);
  const startedAt = toIsoUtc(result.startedAt, completedAt);
  const emittedAt = new Date().toISOString();
  const runId = asTrimmedString(result.runId) || `reliability-${Date.now()}`;

  const sourcePayload =
    normalizedSource === SOURCE_SMOKE
      ? buildSmokePayload(result, metadata)
      : normalizedSource === SOURCE_SELECTOR_HEALTH
        ? buildSelectorPayload(result, metadata)
        : buildGenericPayload(result);
  const suppressionSummaryText = buildSuppressionSummaryText(dedupe);
  const summary = suppressionSummaryText
    ? `${sourcePayload.summary} | ${suppressionSummaryText}`
    : sourcePayload.summary;

  return {
    payloadVersion: PAYLOAD_VERSION,
    eventType: "reliability_failure",
    source: normalizedSource,
    runId,
    result: "fail",
    summary,
    failureCode: sourcePayload.failureCode,
    timestamps: {
      startedAt,
      completedAt,
      emittedAt,
    },
    context: sourcePayload.context,
    affectedIdentifiers: sourcePayload.affectedIdentifiers,
    affectedIdentifiersReason: sourcePayload.affectedIdentifiersReason,
    metrics: sourcePayload.metrics,
    references: buildReferences(metadata),
    diagnostics: sourcePayload.diagnostics,
    dedupe: dedupe
      ? {
          decision: dedupe.decision || null,
          reason: dedupe.reason || null,
          signatureKey: dedupe.signatureKey || null,
          cooldownMs: Number(dedupe.policy?.effective?.cooldownMs || 0) || null,
          state: dedupe.state || null,
          suppressionSummary: dedupe.suppressionSummary || null,
        }
      : null,
  };
};

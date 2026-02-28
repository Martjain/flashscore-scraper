const normalizeErrorReason = (errorReason) => errorReason || "unknown_error";

export const collectProbeDiagnostics = (resolution, extra = {}) => ({
  scope: resolution?.scope ?? extra.scope ?? null,
  contractKey: resolution?.contractKey ?? extra.contractKey ?? null,
  selectorsTried: [...(resolution?.selectorsTried ?? extra.selectorsTried ?? [])],
  matchedSelector: resolution?.matchedSelector ?? null,
  matchedSelectorIndex: Number.isInteger(resolution?.matchedSelectorIndex)
    ? resolution.matchedSelectorIndex
    : null,
  fallbackUsed: Boolean(resolution?.fallbackUsed),
  fallbackCount: Number.isInteger(resolution?.fallbackCount)
    ? resolution.fallbackCount
    : 0,
  url: resolution?.pageUrl ?? extra.url ?? null,
  errorReason: resolution?.ok ? null : normalizeErrorReason(resolution?.errorReason),
});

export const buildProbeOutcome = (resolution, options = {}) => {
  const strict = Boolean(options.strict);
  const diagnostics = collectProbeDiagnostics(resolution, options.extra);
  const criticalFailure = !resolution?.ok;
  const fallbackUsage = Boolean(resolution?.ok && resolution?.fallbackUsed);
  const warnings = fallbackUsage && !strict ? 1 : 0;

  return {
    result: criticalFailure || (strict && fallbackUsage) ? "fail" : "pass",
    criticalFailure,
    fallbackUsage,
    warnings,
    diagnostics,
  };
};

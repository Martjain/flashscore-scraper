import {
  DEFAULT_SELECTOR_HEALTH_REPORT_PATH,
  pruneSelectorHealthHistory,
  writeSelectorHealthReports,
} from "./retention.js";

const formatDurationMs = (durationMs) => {
  if (!Number.isFinite(durationMs)) return "0ms";
  if (durationMs < 1000) return `${Math.max(0, Math.round(durationMs))}ms`;
  return `${(durationMs / 1000).toFixed(1)}s`;
};

const getFailedChecks = (scopeResults = []) =>
  scopeResults.flatMap((scopeResult) =>
    (scopeResult.checks || []).filter((check) => check.status === "fail")
  );

export const printSelectorHealthSummary = (result, options = {}) => {
  const quiet = Boolean(options.quiet);

  if (!quiet) {
    console.info("Selector Health Check");
    console.info(`Mode: ${result.mode}`);
    console.info(`Scopes: ${result.scopes.join(", ")}`);
    console.info(`Sample per scope: ${result.sample}`);
    console.info(`Critical failures: ${result.criticalFailures}`);
    console.info(`Warnings: ${result.warnings}`);
    console.info(`Fallback usages: ${result.fallbackUsages}`);
    console.info(`Duration: ${formatDurationMs(result.durationMs)}`);

    const failedChecks = getFailedChecks(result.scopeResults);
    if (failedChecks.length > 0) {
      console.info("\nFailures:");
      failedChecks.forEach((check) => {
        console.info(
          `- ${check.scope} (${check.contractKey}) at ${check.url ?? "n/a"} -> ${check.errorReason ?? "failure"}`
        );
      });
    }
  }

  console.info(`RESULT: ${result.result}`);
};

export const persistSelectorHealthReport = async (result, options = {}) => {
  const reportPath = options.reportPath || DEFAULT_SELECTOR_HEALTH_REPORT_PATH;
  const keepHistory = Number.isInteger(options.keepHistory)
    ? options.keepHistory
    : 30;
  const { latestPath, historyPath } = await writeSelectorHealthReports(
    result,
    reportPath
  );
  const { removed } = await pruneSelectorHealthHistory(reportPath, keepHistory);

  return {
    latestPath,
    historyPath,
    prunedHistoryFiles: removed,
  };
};

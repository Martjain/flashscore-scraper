import fs from "node:fs/promises";
import path from "node:path";
import {
  parseReliabilityTrendArguments,
  DEFAULT_RELIABILITY_TREND_LOOKBACK_HOURS,
} from "../src/cli/arguments/index.js";
import { buildReliabilityTrendSummary } from "../src/reliability/trends/index.js";

const HELP_TEXT = `
Usage:
  node scripts/reliability-trends.mjs [options]
  npm run trend:reliability -- [options]

Options:
  --lookback-hours <n>      Lookback window in hours (default: 168)
  --smoke-dir <path>        Override smoke artifact directory
  --selector-health-dir <path> Override selector-health artifact directory
  --report <path>           Optional JSON report output path
  --quiet                   Print only RESULT line
  --help, -h                Show this help
`.trim();

const formatPercent = (value) => `${(Number(value || 0) * 100).toFixed(1)}%`;

const printTopGroups = (title, groups, keyField) => {
  console.info(`\n${title}`);
  if (!Array.isArray(groups) || groups.length === 0) {
    console.info("- none");
    return;
  }

  groups.slice(0, 10).forEach((entry) => {
    console.info(
      `- ${entry[keyField]} | runs=${entry.runs} failed=${entry.failedRuns} failures=${entry.failureCount} rate=${formatPercent(entry.failureRate)}`
    );
  });
};

const maybeWriteReport = async (summary, reportPath) => {
  if (!reportPath) return null;

  const absolutePath = path.resolve(reportPath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(
    absolutePath,
    `${JSON.stringify(summary, null, 2)}\n`,
    "utf8"
  );
  return absolutePath;
};

const run = async () => {
  let options;
  try {
    options = parseReliabilityTrendArguments();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
    return;
  }

  if (options.help) {
    console.info(HELP_TEXT);
    return;
  }

  const startedAt = new Date().toISOString();
  const summary = await buildReliabilityTrendSummary({
    lookbackHours: options.lookbackHours,
    smokeHistoryDir: options.smokeDir,
    selectorHistoryDir: options.selectorHealthDir,
  });
  const completedAt = new Date().toISOString();

  const output = {
    runId: `reliability-trends-${Date.now()}`,
    startedAt,
    completedAt,
    result: "pass",
    options: {
      lookbackHours: options.lookbackHours,
      smokeDir: options.smokeDir,
      selectorHealthDir: options.selectorHealthDir,
      report: options.report,
    },
    ...summary,
  };

  const reportPath = await maybeWriteReport(output, options.report);

  if (!options.quiet) {
    console.info("Reliability Trend Summary");
    console.info(
      `Window: ${output.window.start} -> ${output.window.end} (${output.window.lookbackHours}h)`
    );
    console.info(
      `Runs: ${output.totals.failedRuns}/${output.totals.runs} failed (${formatPercent(output.totals.failureRate)})`
    );
    console.info(
      `Observations: ${output.totals.failedObservations}/${output.totals.observations} failed | failures=${output.totals.failureCount}`
    );
    printTopGroups("By Fixture (top 10)", output.byFixture, "fixture");
    printTopGroups("By Region (top 10)", output.byRegion, "region");
    console.info(
      `\nDiagnostics: loaded=${output.diagnostics.filesLoaded} considered=${output.diagnostics.filesConsidered} parseFailures=${output.diagnostics.parseFailures.length} missingFields=${output.diagnostics.missingRequiredFields.length} skippedOutsideWindow=${output.diagnostics.skippedOutsideWindow.length}`
    );
    if (reportPath) {
      console.info(`Report: ${reportPath}`);
    }
  }

  console.info("RESULT: pass");
};

run().catch((error) => {
  const message =
    error instanceof Error ? error.message : "unknown_reliability_trend_error";
  console.error(`ERROR: ${message}`);
  console.info("RESULT: fail");
  process.exitCode = 1;
});


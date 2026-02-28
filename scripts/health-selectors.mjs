import { chromium } from "playwright";
import { parseSelectorHealthArguments } from "../src/cli/arguments/index.js";
import { sendFailureAlert } from "../src/reliability/alerts/index.js";
import { runSelectorHealthCheck } from "../src/selector-health/health-check/runSelectorHealthCheck.js";
import {
  persistSelectorHealthReport,
  printSelectorHealthSummary,
} from "../src/selector-health/health-check/reporting.js";

const HELP_TEXT = `
Usage:
  npm run health:selectors -- [options]

Options:
  --scope <name>      Scope to probe (repeatable): countries, leagues, seasons, match-list, match-detail
  --sample <n>        Probe sample size per scope (default: 1)
  --strict            Fail when fallback selectors are used
  --fail-fast         Stop after first failing check
  --dry-run           Resolve planned probes without opening browser pages
  --report <path>     Override JSON report path (default: .planning/artifacts/selector-health/latest.json)
  --quiet             Print only RESULT line
  --help, -h          Show this help
`.trim();

const DEFAULT_SCOPES = Object.freeze([
  "countries",
  "leagues",
  "seasons",
  "match-list",
  "match-detail",
]);

const buildSelectorRunnerFailure = (error, options = {}) => {
  const message = error instanceof Error ? error.message : "unknown_runner_error";
  const now = new Date().toISOString();
  const scopes =
    Array.isArray(options.scopes) && options.scopes.length > 0
      ? options.scopes
      : [...DEFAULT_SCOPES];
  const mode = options.strict ? "strict" : "default";

  return {
    runId: `selector-health-${Date.now()}`,
    startedAt: now,
    completedAt: now,
    durationMs: 0,
    mode,
    strict: Boolean(options.strict),
    failFast: Boolean(options.failFast),
    dryRun: Boolean(options.dryRun),
    sample: Number.isInteger(options.sample) && options.sample > 0 ? options.sample : 1,
    scopes,
    checks: 1,
    criticalFailures: 1,
    warnings: 0,
    fallbackUsages: 0,
    result: "fail",
    scopeResults: [
      {
        scope: "runner",
        checks: [
          {
            scope: "runner",
            contractKey: "runner",
            url: null,
            source: "runtime",
            status: "fail",
            criticalFailure: true,
            fallbackUsage: false,
            warning: false,
            matchedSelector: null,
            matchedSelectorIndex: null,
            selectorsTried: [],
            errorReason: message,
            durationMs: 0,
            diagnostics: {
              scope: "runner",
              contractKey: "runner",
              selectorsTried: [],
              matchedSelector: null,
              matchedSelectorIndex: null,
              fallbackUsed: false,
              fallbackCount: 0,
              url: null,
              errorReason: message,
            },
          },
        ],
        criticalFailures: 1,
        warnings: 0,
        fallbackUsages: 0,
        result: "fail",
      },
    ],
  };
};

const emitSelectorFailureAlert = async (result, report = null) => {
  try {
    const alertResult = await sendFailureAlert({
      source: "selector_health",
      result,
      metadata: {
        artifactPath: report?.latestPath || null,
        historyPath: report?.historyPath || null,
      },
    });

    if (alertResult.skipped || alertResult.sent) {
      return;
    }

    console.warn(
      [
        "WARNING: selector-health failure alert delivery failed",
        `reason=${alertResult.error || "unknown"}`,
        `status=${alertResult.statusCode ?? "n/a"}`,
        `durationMs=${alertResult.durationMs ?? 0}`,
      ].join(" | ")
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "unknown_alert_error";
    console.warn(
      `WARNING: selector-health failure alert delivery failed | reason=${message}`
    );
  }
};

const run = async () => {
  let browser;
  let context;
  let options = {
    scopes: [...DEFAULT_SCOPES],
    sample: 1,
    strict: false,
    failFast: false,
    dryRun: false,
    quiet: false,
    report: null,
    help: false,
  };

  try {
    options = parseSelectorHealthArguments();
    if (options.help) {
      console.info(HELP_TEXT);
      return;
    }

    if (!options.dryRun) {
      browser = await chromium.launch({ headless: true });
      context = await browser.newContext();
    }

    const result = await runSelectorHealthCheck({
      context,
      scopes: options.scopes,
      sample: options.sample,
      strict: options.strict,
      failFast: options.failFast,
      dryRun: options.dryRun,
    });
    const reportArtifacts = await persistSelectorHealthReport(result, {
      reportPath: options.report,
      keepHistory: 30,
    });
    const enrichedResult = {
      ...result,
      report: reportArtifacts,
    };
    await emitSelectorFailureAlert(enrichedResult, reportArtifacts);

    if (!options.quiet) {
      console.info(`Report: ${reportArtifacts.latestPath}`);
    }
    printSelectorHealthSummary(enrichedResult, { quiet: options.quiet });
    process.exitCode = enrichedResult.result === "pass" ? 0 : 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`Selector health-check failed: ${message}`);

    const failureResult = buildSelectorRunnerFailure(error, options);
    let reportArtifacts = null;
    try {
      reportArtifacts = await persistSelectorHealthReport(failureResult, {
        reportPath: options.report,
        keepHistory: 30,
      });
      if (!options.quiet) {
        console.info(`Report: ${reportArtifacts.latestPath}`);
      }
    } catch (reportError) {
      const reportMessage =
        reportError instanceof Error ? reportError.message : "unknown_report_error";
      console.error(`Selector health reporting failed: ${reportMessage}`);
    }

    await emitSelectorFailureAlert(failureResult, reportArtifacts);
    printSelectorHealthSummary(failureResult, { quiet: options.quiet });
    process.exitCode = 1;
  } finally {
    await context?.close();
    await browser?.close();
  }
};

run();

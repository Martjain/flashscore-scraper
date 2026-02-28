import { chromium } from "playwright";
import { parseSmokeReliabilityArguments } from "../src/cli/arguments/index.js";
import { persistSmokeReport } from "../src/reliability/smoke/reporting.js";
import { runSmokeSuite } from "../src/reliability/smoke/run-smoke-suite.js";

const HELP_TEXT = `
Usage:
  node scripts/smoke-reliability.mjs [options]
  npm run smoke:reliability -- [options]

Options:
  --sample <n>        Number of fixtures to run (default: 3)
  --max-matches <n>   Max matches checked per fixture (default: 1)
  --fixture <id>      Restrict to fixture id(s), repeatable or comma-separated
  --timeout-ms <n>    Per-fixture timeout in milliseconds (default: 90000)
  --dry-run           Skip browser work and validate selection + artifact flow
  --report <path>     Override JSON report path (default: .planning/artifacts/smoke/latest.json)
  --quiet             Print only compact result lines
  --help, -h          Show this help
`.trim();

const printRunSummary = (result, options = {}) => {
  const quiet = Boolean(options.quiet);

  if (!quiet) {
    console.info("Reliability Smoke");
    console.info(`Run ID: ${result.runId}`);
    console.info(`Mode: ${result.mode}`);
    console.info(
      `Fixtures: ${result.summary.passedFixtures}/${result.summary.totalFixtures} passed`
    );
    console.info(`Duration: ${result.summary.durationMs}ms`);
    console.info(
      `Schema gate: ${result.schemaGate?.status ?? "not-run"}`
    );

    result.fixtures.forEach((fixture) => {
      const statusLabel = fixture.status === "pass" ? "PASS" : "FAIL";
      const reason = fixture.error ? ` (${fixture.error})` : "";
      console.info(`- ${statusLabel} ${fixture.fixtureId}${reason}`);
    });
  }

  console.info(`RESULT: ${result.result}`);
};

const buildRunnerFailure = (error, options = {}) => {
  const message = error instanceof Error ? error.message : "unknown_runner_error";
  const now = new Date().toISOString();
  return {
    runId: `smoke-${Date.now()}`,
    startedAt: now,
    completedAt: now,
    durationMs: 0,
    result: "fail",
    mode: options.dryRun ? "dry-run" : "live",
    options: {
      sample: options.sample,
      maxMatches: options.maxMatches,
      timeoutMs: options.timeoutMs,
      fixtureIds: options.fixtureIds,
      dryRun: options.dryRun,
    },
    summary: {
      totalFixtures: 0,
      passedFixtures: 0,
      failedFixtures: 1,
      durationMs: 0,
      result: "fail",
    },
    fixtures: [],
    issues: [
      {
        fixtureId: "run",
        failedStage: "runner",
        error: message,
      },
    ],
    schemaGate: null,
  };
};

const run = async () => {
  let browser;
  let context;

  const options = parseSmokeReliabilityArguments();
  if (options.help) {
    console.info(HELP_TEXT);
    return;
  }

  try {
    if (!options.dryRun) {
      browser = await chromium.launch({ headless: true });
      context = await browser.newContext();
    }

    const result = await runSmokeSuite({
      context,
      sample: options.sample,
      maxMatches: options.maxMatches,
      timeoutMs: options.timeoutMs,
      fixtureIds: options.fixtureIds,
      dryRun: options.dryRun,
    });

    const report = await persistSmokeReport(result, {
      reportPath: options.report,
      keepHistory: 30,
    });
    const enrichedResult = {
      ...result,
      report,
    };

    if (!options.quiet) {
      console.info(`Report: ${report.latestPath}`);
    }
    printRunSummary(enrichedResult, { quiet: options.quiet });
    process.exitCode = enrichedResult.result === "pass" ? 0 : 1;
  } catch (error) {
    const failureResult = buildRunnerFailure(error, options);
    try {
      const report = await persistSmokeReport(failureResult, {
        reportPath: options.report,
        keepHistory: 30,
      });
      if (!options.quiet) {
        console.info(`Report: ${report.latestPath}`);
      }
    } catch (reportError) {
      const message =
        reportError instanceof Error ? reportError.message : "unknown_report_error";
      console.error(`Smoke reporting failed: ${message}`);
    }

    printRunSummary(failureResult, { quiet: options.quiet });
    process.exitCode = 1;
  } finally {
    await context?.close();
    await browser?.close();
  }
};

run();


import { chromium } from "playwright";
import { parseSelectorHealthArguments } from "../src/cli/arguments/index.js";
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

const run = async () => {
  let browser;
  let context;

  try {
    const options = parseSelectorHealthArguments();
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

    if (!options.quiet) {
      console.info(`Report: ${reportArtifacts.latestPath}`);
    }
    printSelectorHealthSummary(enrichedResult, { quiet: options.quiet });
    process.exitCode = enrichedResult.result === "pass" ? 0 : 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`Selector health-check failed: ${message}`);
    console.info("RESULT: fail");
    process.exitCode = 1;
  } finally {
    await context?.close();
    await browser?.close();
  }
};

run();

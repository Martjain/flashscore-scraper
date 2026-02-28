import { chromium } from "playwright";
import { parseSelectorHealthArguments } from "../src/cli/arguments/index.js";
import { sendFailureAlert } from "../src/reliability/alerts/index.js";
import { runSelectorHealthCheck } from "../src/selector-health/health-check/runSelectorHealthCheck.js";
import {
  DEFAULT_SELECTOR_HEALTH_REPORT_PATH,
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

const buildAlertDedupeEntry = (alertResult = null) => {
  const signatureKey = alertResult?.dedupe?.signatureKey;
  if (!signatureKey) return null;

  return {
    signatureKey,
    decision: alertResult?.dedupe?.decision || null,
    reason: alertResult?.dedupe?.reason || null,
    firstSeen: alertResult?.dedupe?.state?.firstSeen || null,
    lastSeen: alertResult?.dedupe?.state?.lastSeen || null,
    cooldownUntil: alertResult?.dedupe?.state?.cooldownUntil || null,
    suppressedCount: Number(alertResult?.dedupe?.state?.suppressedCount || 0),
    firstSuppressedAt: alertResult?.dedupe?.state?.firstSuppressedAt || null,
    lastSuppressedAt: alertResult?.dedupe?.state?.lastSuppressedAt || null,
    priorSuppressedCount: Number(
      alertResult?.dedupe?.suppressionSummary?.suppressedCount || 0
    ),
    priorFirstSuppressedAt:
      alertResult?.dedupe?.suppressionSummary?.firstSuppressedAt || null,
    priorLastSuppressedAt:
      alertResult?.dedupe?.suppressionSummary?.lastSuppressedAt || null,
    priorCooldownUntil:
      alertResult?.dedupe?.suppressionSummary?.cooldownUntil || null,
  };
};

const attachAlertAudit = (result, alertResult = null) => {
  const entry = buildAlertDedupeEntry(alertResult);
  const entries = entry ? [entry] : [];
  const bySignature = entry ? { [entry.signatureKey]: entry } : {};
  const gate = alertResult?.gate || null;

  return {
    ...result,
    alerts: {
      failure: alertResult
        ? {
            attempted: Boolean(alertResult.attempted),
            sent: Boolean(alertResult.sent),
            skipped: Boolean(alertResult.skipped),
            suppressed: Boolean(alertResult.suppressed),
            gateReason: gate?.reason || null,
            dedupeReason: alertResult?.dedupe?.reason || null,
            statusCode: alertResult?.statusCode ?? null,
            error: alertResult?.error || null,
          }
        : null,
      dedupe: {
        entries,
        bySignature,
      },
    },
    alertDedupe: {
      entries,
      bySignature,
      updatedAt: new Date().toISOString(),
    },
  };
};

const logDedupeDecision = (alertResult, options = {}) => {
  if (options.quiet || !alertResult?.dedupe?.signatureKey) return;

  const entry = buildAlertDedupeEntry(alertResult);
  if (!entry) return;

  if (entry.decision === "suppress") {
    console.info(
      [
        "[alert-dedupe] suppressed",
        `signature=${entry.signatureKey}`,
        `reason=${entry.reason || "within_cooldown"}`,
        `suppressedCount=${entry.suppressedCount}`,
        `cooldownUntil=${entry.cooldownUntil || "n/a"}`,
      ].join(" | ")
    );
    return;
  }

  if (entry.decision === "emit" && entry.priorSuppressedCount > 0) {
    console.info(
      [
        "[alert-dedupe] emitted_after_cooldown",
        `signature=${entry.signatureKey}`,
        `priorSuppressed=${entry.priorSuppressedCount}`,
        `windowEnd=${entry.priorCooldownUntil || "n/a"}`,
      ].join(" | ")
    );
  }
};

const emitSelectorFailureAlert = async (result, options = {}) => {
  try {
    const alertResult = await sendFailureAlert({
      source: "selector_health",
      result,
      metadata: {
        artifactPath: options.artifactPath || null,
        historyPath: null,
      },
    });
    logDedupeDecision(alertResult, options);

    if (alertResult.skipped || alertResult.sent) {
      return alertResult;
    }

    if (!alertResult.suppressed) {
      console.warn(
        [
          "WARNING: selector-health failure alert delivery failed",
          `reason=${alertResult.error || "unknown"}`,
          `status=${alertResult.statusCode ?? "n/a"}`,
          `durationMs=${alertResult.durationMs ?? 0}`,
        ].join(" | ")
      );
    }

    return alertResult;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "unknown_alert_error";
    console.warn(
      `WARNING: selector-health failure alert delivery failed | reason=${message}`
    );
    return {
      attempted: false,
      sent: false,
      skipped: false,
      suppressed: false,
      gate: null,
      dedupe: null,
      statusCode: null,
      durationMs: 0,
      error: message,
    };
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
    const alertResult = await emitSelectorFailureAlert(result, {
      quiet: options.quiet,
      artifactPath: options.report || DEFAULT_SELECTOR_HEALTH_REPORT_PATH,
    });
    const resultWithAlertAudit = attachAlertAudit(result, alertResult);
    const reportArtifacts = await persistSelectorHealthReport(resultWithAlertAudit, {
      reportPath: options.report,
      keepHistory: 30,
    });
    const enrichedResult = {
      ...resultWithAlertAudit,
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

    const failureResult = buildSelectorRunnerFailure(error, options);
    const alertResult = await emitSelectorFailureAlert(failureResult, {
      quiet: options.quiet,
      artifactPath: options.report || DEFAULT_SELECTOR_HEALTH_REPORT_PATH,
    });
    const failureWithAlertAudit = attachAlertAudit(failureResult, alertResult);
    let reportArtifacts = null;
    try {
      reportArtifacts = await persistSelectorHealthReport(failureWithAlertAudit, {
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
    printSelectorHealthSummary(failureWithAlertAudit, { quiet: options.quiet });
    process.exitCode = 1;
  } finally {
    await context?.close();
    await browser?.close();
  }
};

run();

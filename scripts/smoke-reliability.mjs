import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium } from "playwright";
import { parseSmokeReliabilityArguments } from "../src/cli/arguments/index.js";
import { persistSmokeReport } from "../src/reliability/smoke/reporting.js";
import {
  buildSmokeSchemaPayload,
  runSmokeSuite,
} from "../src/reliability/smoke/run-smoke-suite.js";
import { getSmokeFixtureIds } from "../src/reliability/smoke/fixture-matrix.js";
import {
  DEFAULT_RERUN_ARTIFACT_PATH,
  resolveFailedFixtureIdsFromArtifact,
} from "../src/reliability/smoke/rerun-fixtures.js";

const DEFAULT_SCHEMA_INPUT_PATH =
  ".planning/artifacts/smoke/schema-input-latest.json";

const HELP_TEXT = `
Usage:
  node scripts/smoke-reliability.mjs [options]
  npm run smoke:reliability -- [options]

Options:
  --sample <n>        Number of fixtures to run (default: 3)
  --max-matches <n>   Max matches checked per fixture (default: 1)
  --fixture <id>      Restrict to fixture id(s), repeatable or comma-separated
  --rerun-failed      Rerun only failed fixtures from smoke artifact
  --artifact <path>   Smoke artifact path for rerun mode (default: .planning/artifacts/smoke/latest.json)
  --timeout-ms <n>    Per-fixture timeout in milliseconds (default: 90000)
  --dry-run           Skip browser work and validate selection + artifact flow
  --report <path>     Override JSON report path (default: .planning/artifacts/smoke/latest.json)
  --quiet             Print only compact result lines
  --help, -h          Show this help
`.trim();

class RerunPreflightError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "RerunPreflightError";
    this.code = code;
    this.details = details;
  }
}

const buildManualFallbackCommand = (fixtureIds = []) => {
  const fallbackFixtureId = fixtureIds[0] || "argentina-liga-profesional";
  return `npm run smoke:reliability -- --sample 1 --fixture ${fallbackFixtureId}`;
};

const resolveExecutionContext = async (options = {}) => {
  if (!options.rerunFailed) {
    return {
      mode: options.dryRun ? "dry-run" : "live",
      fixtureIds: options.fixtureIds,
      artifactPath: null,
      rerun: null,
    };
  }

  const knownFixtureIds = getSmokeFixtureIds();
  const fallbackCommand = buildManualFallbackCommand(knownFixtureIds);
  const selection = await resolveFailedFixtureIdsFromArtifact({
    artifactPath: options.artifact || DEFAULT_RERUN_ARTIFACT_PATH,
    knownFixtureIds,
  });

  if (!selection.ok) {
    throw new RerunPreflightError(
      selection.error?.code || "artifact_preflight_failed",
      `Rerun preflight failed: ${selection.error?.message || "invalid smoke artifact input."}`,
      {
        artifactPath: selection.artifactPath,
        diagnostics: selection.diagnostics,
        cause: selection.error,
        fallbackCommand,
      }
    );
  }

  if (selection.fixtureIds.length === 0) {
    const invalidCount = selection.diagnostics?.invalidFixtureIds?.length || 0;
    const ignoredCount = selection.diagnostics?.ignoredFixtureIds?.length || 0;
    throw new RerunPreflightError(
      "no_rerunnable_failures",
      `Rerun preflight failed: no rerunnable failed fixtures found in ${selection.artifactPath} (invalid: ${invalidCount}, ignored: ${ignoredCount}).`,
      {
        artifactPath: selection.artifactPath,
        diagnostics: selection.diagnostics,
        fallbackCommand,
      }
    );
  }

  return {
    mode: "rerun-failed",
    fixtureIds: selection.fixtureIds,
    artifactPath: selection.artifactPath,
    rerun: {
      artifactPath: selection.artifactPath,
      selectedFixtureIds: selection.fixtureIds,
      diagnostics: selection.diagnostics,
    },
  };
};

const applyExecutionContext = (result, options = {}, executionContext = {}) => ({
  ...result,
  mode: executionContext.mode || result.mode,
  options: {
    ...result.options,
    rerunFailed: Boolean(options.rerunFailed),
    artifact: executionContext.artifactPath || options.artifact || null,
  },
  rerun: executionContext.rerun || null,
});

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
  const isRerunPreflight = error instanceof RerunPreflightError;
  const preflightDetails = isRerunPreflight ? error.details || {} : {};
  const now = new Date().toISOString();
  return {
    runId: `smoke-${Date.now()}`,
    startedAt: now,
    completedAt: now,
    durationMs: 0,
    result: "fail",
    mode: options.executionMode || (options.dryRun ? "dry-run" : "live"),
    options: {
      sample: options.sample,
      maxMatches: options.maxMatches,
      timeoutMs: options.timeoutMs,
      fixtureIds: options.fixtureIds,
      dryRun: options.dryRun,
      rerunFailed: Boolean(options.rerunFailed),
      artifact: options.artifact || null,
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
        failedStage: isRerunPreflight ? "rerun-preflight" : "runner",
        error: message,
        code: isRerunPreflight ? error.code : null,
        diagnostics: preflightDetails.diagnostics || null,
        remediation: preflightDetails.fallbackCommand || null,
      },
    ],
    rerun: options.rerun || null,
    schemaGate: {
      status: "fail",
      error: message,
      command: "runner",
      inputPath: null,
      diagnostics:
        preflightDetails.cause?.reason ||
        preflightDetails.diagnostics ||
        null,
    },
  };
};

const writeSchemaInputPayload = async (schemaPayload, filePath) => {
  const absolutePath = path.resolve(filePath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(`${absolutePath}`, `${JSON.stringify(schemaPayload, null, 2)}\n`);
  return absolutePath;
};

const runProcess = (command, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => {
      resolve({
        code,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
      });
    });
  });

const evaluateSchemaGate = async (result, options = {}) => {
  if (options.dryRun) {
    return {
      status: "skipped",
      error: null,
      command: null,
      inputPath: null,
      diagnostics: "dry_run",
    };
  }

  const schemaPayload = buildSmokeSchemaPayload(result);
  const payloadSize = Object.keys(schemaPayload).length;
  if (payloadSize === 0) {
    return {
      status: "fail",
      error: "no_schema_candidates",
      command: "npm run validate:schema",
      inputPath: null,
      diagnostics: "No match payloads were collected for schema validation.",
    };
  }

  const inputPath = await writeSchemaInputPayload(
    schemaPayload,
    options.schemaInputPath || DEFAULT_SCHEMA_INPUT_PATH
  );
  const command = "npm run validate:schema --";
  const response = await runProcess("npm", [
    "run",
    "validate:schema",
    "--",
    inputPath,
  ]);

  if (response.code === 0) {
    return {
      status: "pass",
      error: null,
      command,
      inputPath,
      diagnostics: response.stdout || "schema_validation_passed",
    };
  }

  return {
    status: "fail",
    error: `schema_validation_failed:${response.code}`,
    command,
    inputPath,
    diagnostics: response.stderr || response.stdout || "schema_validation_failed",
  };
};

const mergeSchemaGate = (result, schemaGate) => {
  const schemaFailed = schemaGate.status === "fail";
  const runFailed = result.summary.failedFixtures > 0;
  const finalResult = runFailed || schemaFailed ? "fail" : "pass";
  const issues = [...(result.issues ?? [])];

  if (schemaFailed) {
    issues.push({
      fixtureId: "schema-gate",
      failedStage: "schema",
      error: schemaGate.error ?? "schema_validation_failed",
    });
  }

  return {
    ...result,
    result: finalResult,
    summary: {
      ...result.summary,
      result: finalResult,
      schemaGateStatus: schemaGate.status,
    },
    issues,
    schemaGate,
  };
};

const run = async () => {
  let browser;
  let context;

  const options = parseSmokeReliabilityArguments();
  let executionContext = {
    mode: options.dryRun ? "dry-run" : "live",
    fixtureIds: options.fixtureIds,
    artifactPath: options.artifact || null,
    rerun: null,
  };

  if (options.help) {
    console.info(HELP_TEXT);
    return;
  }

  try {
    executionContext = await resolveExecutionContext(options);

    if (!options.dryRun) {
      browser = await chromium.launch({ headless: true });
      context = await browser.newContext();
    }

    const executionSample =
      executionContext.mode === "rerun-failed"
        ? Math.max(options.sample, executionContext.fixtureIds.length)
        : options.sample;

    const result = await runSmokeSuite({
      context,
      sample: executionSample,
      maxMatches: options.maxMatches,
      timeoutMs: options.timeoutMs,
      fixtureIds: executionContext.fixtureIds,
      dryRun: options.dryRun,
    });
    const contextualResult = applyExecutionContext(
      result,
      options,
      executionContext
    );
    const schemaGate = await evaluateSchemaGate(contextualResult, {
      dryRun: options.dryRun,
    });
    const finalResult = mergeSchemaGate(contextualResult, schemaGate);

    const report = await persistSmokeReport(finalResult, {
      reportPath: options.report,
      keepHistory: 30,
    });
    const enrichedResult = {
      ...finalResult,
      report,
    };

    if (!options.quiet) {
      console.info(`Report: ${report.latestPath}`);
    }
    printRunSummary(enrichedResult, { quiet: options.quiet });
    process.exitCode = enrichedResult.result === "pass" ? 0 : 1;
  } catch (error) {
    if (error instanceof RerunPreflightError && !options.quiet) {
      console.error(error.message);
      if (error.details?.artifactPath) {
        console.error(`Artifact: ${error.details.artifactPath}`);
      }
      if (error.details?.fallbackCommand) {
        console.error(`Manual fallback: ${error.details.fallbackCommand}`);
      }
    }

    const failureResult = buildRunnerFailure(error, {
      ...options,
      executionMode: options.rerunFailed
        ? "rerun-failed"
        : executionContext.mode,
      fixtureIds: executionContext.fixtureIds || options.fixtureIds,
      rerun:
        executionContext.rerun ||
        (error instanceof RerunPreflightError
          ? {
              artifactPath:
                error.details?.artifactPath ||
                options.artifact ||
                DEFAULT_RERUN_ARTIFACT_PATH,
              selectedFixtureIds: [],
              diagnostics: error.details?.diagnostics || null,
            }
          : null),
    });
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

import { FileTypes } from "../../constants/index.js";
import { CRITICAL_SELECTOR_SCOPE_ORDER } from "../../selector-health/contracts/keys.js";

export const parseArguments = () => {
  const args = process.argv.slice(2);
  const options = {
    country: null,
    league: null,
    fileType: null,
    concurrency: 10,
    saveInterval: 10,
    headless: true,
  };

  args.forEach((arg) => {
    if (arg.startsWith("country=")) options.country = arg.split("=")[1];
    if (arg.startsWith("league=")) options.league = arg.split("=")[1];
    if (arg.startsWith("fileType=")) options.fileType = arg.split("=")[1];
    if (arg.startsWith("concurrency="))
      options.concurrency = Number(arg.split("=")[1]);
    if (arg.startsWith("saveInterval="))
      options.saveInterval = Number(arg.split("=")[1]);
    if (arg.startsWith("headless="))
      options.headless = arg.split("=")[1] !== "false";
    if (arg === "--no-headless") options.headless = false;
    if (arg === "--headless") options.headless = true;
  });

  if (options.fileType) {
    const userInput = options.fileType;
    const matchedType = Object.values(FileTypes).find(
      (type) => type.argument === userInput
    );

    if (!matchedType) {
      const acceptedTypes = Object.values(FileTypes)
        .map((type) => `"${type.argument}"`)
        .join(", ");
      throw Error(
        `❌ Invalid fileType: "${userInput}"\n` +
          `Accepted file types are: ${acceptedTypes}`
      );
    }

    options.fileType = matchedType;
  }

  if (options.league && !options.country) {
    throw Error(
      `❌ Missing required argument: country=<country-name>\n` +
        `You provided a league "${options.league}" but did not specify a country\n` +
        `Usage example: country=<country-name> league=<league-name>`
    );
  }

  return options;
};

const SUPPORTED_SELECTOR_HEALTH_SCOPES = Object.freeze([
  ...CRITICAL_SELECTOR_SCOPE_ORDER,
]);
const DEFAULT_SMOKE_SAMPLE = 3;
const DEFAULT_SMOKE_MAX_MATCHES = 1;
const DEFAULT_SMOKE_TIMEOUT_MS = 90000;
const DEFAULT_SMOKE_MATRIX_MODE = "default";
const SUPPORTED_SMOKE_MATRIX_MODES = Object.freeze([
  DEFAULT_SMOKE_MATRIX_MODE,
  "extended",
]);

const parseOptionValue = (args, index, flagName) => {
  const arg = args[index];
  if (arg.startsWith(`${flagName}=`)) {
    return arg.slice(`${flagName}=`.length);
  }

  if (arg === flagName) {
    const nextArg = args[index + 1];
    if (!nextArg || nextArg.startsWith("--")) {
      throw Error(`❌ Missing value for ${flagName}`);
    }
    return nextArg;
  }

  return null;
};

const parsePositiveInteger = (value, flagName) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw Error(`❌ Invalid ${flagName}: "${value}" (expected positive integer)`);
  }
  return parsed;
};

const parseBooleanFlag = (arg, flagName) =>
  arg === flagName || arg.startsWith(`${flagName}=`);

const parseSmokeMatrixMode = (value, sourceLabel) => {
  const normalized = value?.toString().trim().toLowerCase();
  if (!normalized) return DEFAULT_SMOKE_MATRIX_MODE;
  if (!SUPPORTED_SMOKE_MATRIX_MODES.includes(normalized)) {
    throw Error(
      `❌ Invalid ${sourceLabel}: "${value}"\n` +
        `Accepted values are: ${SUPPORTED_SMOKE_MATRIX_MODES.join(", ")}`
    );
  }
  return normalized;
};

export const parseSelectorHealthArguments = (rawArgs = process.argv.slice(2)) => {
  const options = {
    scopes: [...SUPPORTED_SELECTOR_HEALTH_SCOPES],
    sample: 1,
    strict: false,
    failFast: false,
    dryRun: false,
    quiet: false,
    report: null,
    help: false,
  };
  const scopes = [];

  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];

    if (arg === "--strict") options.strict = true;
    if (arg === "--fail-fast") options.failFast = true;
    if (arg === "--dry-run") options.dryRun = true;
    if (arg === "--quiet") options.quiet = true;
    if (arg === "--help" || arg === "-h") options.help = true;

    if (arg === "--scope" || arg.startsWith("--scope=")) {
      const value = parseOptionValue(rawArgs, index, "--scope");
      value
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean)
        .forEach((scope) => scopes.push(scope));
      if (arg === "--scope") index += 1;
    }

    if (arg === "--sample" || arg.startsWith("--sample=")) {
      const value = parseOptionValue(rawArgs, index, "--sample");
      options.sample = parsePositiveInteger(value, "--sample");
      if (arg === "--sample") index += 1;
    }

    if (arg === "--report" || arg.startsWith("--report=")) {
      options.report = parseOptionValue(rawArgs, index, "--report");
      if (arg === "--report") index += 1;
    }
  }

  if (scopes.length > 0) {
    const invalidScopes = scopes.filter(
      (scope) => !SUPPORTED_SELECTOR_HEALTH_SCOPES.includes(scope)
    );

    if (invalidScopes.length > 0) {
      throw Error(
        `❌ Invalid scope(s): ${invalidScopes.join(", ")}\n` +
          `Accepted scopes are: ${SUPPORTED_SELECTOR_HEALTH_SCOPES.join(", ")}`
      );
    }

    options.scopes = Array.from(new Set(scopes));
  }

  return options;
};

export const parseSmokeReliabilityArguments = (
  rawArgs = process.argv.slice(2),
  env = process.env
) => {
  const envMatrixMode = env.RELIABILITY_SMOKE_MATRIX_MODE;
  const envRotationKey = env.RELIABILITY_SMOKE_ROTATION_KEY;
  const options = {
    sample: DEFAULT_SMOKE_SAMPLE,
    maxMatches: DEFAULT_SMOKE_MAX_MATCHES,
    timeoutMs: DEFAULT_SMOKE_TIMEOUT_MS,
    fixtureIds: [],
    rerunFailed: false,
    artifact: null,
    matrixMode: parseSmokeMatrixMode(envMatrixMode, "RELIABILITY_SMOKE_MATRIX_MODE"),
    rotationKey: envRotationKey?.toString().trim() || null,
    dryRun: false,
    quiet: false,
    report: null,
    help: false,
  };
  const fixtureIds = [];

  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];

    if (parseBooleanFlag(arg, "--dry-run")) options.dryRun = true;
    if (parseBooleanFlag(arg, "--quiet")) options.quiet = true;
    if (parseBooleanFlag(arg, "--rerun-failed")) options.rerunFailed = true;
    if (arg === "--help" || arg === "-h") options.help = true;

    if (arg === "--sample" || arg.startsWith("--sample=")) {
      const value = parseOptionValue(rawArgs, index, "--sample");
      options.sample = parsePositiveInteger(value, "--sample");
      if (arg === "--sample") index += 1;
    }

    if (arg === "--max-matches" || arg.startsWith("--max-matches=")) {
      const value = parseOptionValue(rawArgs, index, "--max-matches");
      options.maxMatches = parsePositiveInteger(value, "--max-matches");
      if (arg === "--max-matches") index += 1;
    }

    if (arg === "--timeout-ms" || arg.startsWith("--timeout-ms=")) {
      const value = parseOptionValue(rawArgs, index, "--timeout-ms");
      options.timeoutMs = parsePositiveInteger(value, "--timeout-ms");
      if (arg === "--timeout-ms") index += 1;
    }

    if (arg === "--fixture" || arg.startsWith("--fixture=")) {
      const value = parseOptionValue(rawArgs, index, "--fixture");
      value
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean)
        .forEach((fixtureId) => fixtureIds.push(fixtureId));
      if (arg === "--fixture") index += 1;
    }

    if (arg === "--report" || arg.startsWith("--report=")) {
      options.report = parseOptionValue(rawArgs, index, "--report");
      if (arg === "--report") index += 1;
    }

    if (arg === "--artifact" || arg.startsWith("--artifact=")) {
      const value = parseOptionValue(rawArgs, index, "--artifact");
      const normalized = value?.trim();
      if (!normalized) {
        throw Error("❌ Invalid --artifact value: expected non-empty file path");
      }
      options.artifact = normalized;
      if (arg === "--artifact") index += 1;
    }

    if (arg === "--matrix-mode" || arg.startsWith("--matrix-mode=")) {
      const value = parseOptionValue(rawArgs, index, "--matrix-mode");
      options.matrixMode = parseSmokeMatrixMode(value, "--matrix-mode");
      if (arg === "--matrix-mode") index += 1;
    }

    if (arg === "--rotation-key" || arg.startsWith("--rotation-key=")) {
      const value = parseOptionValue(rawArgs, index, "--rotation-key");
      const normalized = value?.trim();
      if (!normalized) {
        throw Error("❌ Invalid --rotation-key value: expected non-empty string");
      }
      options.rotationKey = normalized;
      if (arg === "--rotation-key") index += 1;
    }
  }

  if (fixtureIds.length > 0) {
    options.fixtureIds = Array.from(new Set(fixtureIds));
  }

  if (options.artifact && !options.rerunFailed) {
    throw Error("❌ --artifact requires --rerun-failed");
  }

  if (options.rerunFailed && options.fixtureIds.length > 0) {
    throw Error("❌ --rerun-failed cannot be combined with --fixture");
  }

  return options;
};

export const DEFAULT_RELIABILITY_TREND_LOOKBACK_HOURS = 7 * 24;

const parseNonEmptyPath = (value, flagName) => {
  const normalized = value?.toString().trim();
  if (!normalized) {
    throw Error(`❌ Invalid ${flagName}: expected non-empty file system path`);
  }
  return normalized;
};

export const parseReliabilityTrendArguments = (
  rawArgs = process.argv.slice(2)
) => {
  const options = {
    lookbackHours: DEFAULT_RELIABILITY_TREND_LOOKBACK_HOURS,
    smokeDir: null,
    selectorHealthDir: null,
    report: null,
    quiet: false,
    help: false,
  };

  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];

    if (parseBooleanFlag(arg, "--quiet")) options.quiet = true;
    if (arg === "--help" || arg === "-h") options.help = true;

    if (arg === "--lookback-hours" || arg.startsWith("--lookback-hours=")) {
      const value = parseOptionValue(rawArgs, index, "--lookback-hours");
      options.lookbackHours = parsePositiveInteger(value, "--lookback-hours");
      if (arg === "--lookback-hours") index += 1;
    }

    if (arg === "--smoke-dir" || arg.startsWith("--smoke-dir=")) {
      const value = parseOptionValue(rawArgs, index, "--smoke-dir");
      options.smokeDir = parseNonEmptyPath(value, "--smoke-dir");
      if (arg === "--smoke-dir") index += 1;
    }

    if (
      arg === "--selector-health-dir" ||
      arg.startsWith("--selector-health-dir=")
    ) {
      const value = parseOptionValue(rawArgs, index, "--selector-health-dir");
      options.selectorHealthDir = parseNonEmptyPath(
        value,
        "--selector-health-dir"
      );
      if (arg === "--selector-health-dir") index += 1;
    }

    if (arg === "--report" || arg.startsWith("--report=")) {
      const value = parseOptionValue(rawArgs, index, "--report");
      options.report = parseNonEmptyPath(value, "--report");
      if (arg === "--report") index += 1;
    }
  }

  return options;
};

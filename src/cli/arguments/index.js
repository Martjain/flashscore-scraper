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
  rawArgs = process.argv.slice(2)
) => {
  const options = {
    sample: DEFAULT_SMOKE_SAMPLE,
    maxMatches: DEFAULT_SMOKE_MAX_MATCHES,
    timeoutMs: DEFAULT_SMOKE_TIMEOUT_MS,
    fixtureIds: [],
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
  }

  if (fixtureIds.length > 0) {
    options.fixtureIds = Array.from(new Set(fixtureIds));
  }

  return options;
};

import fs from "fs";
import path from "path";

const REQUIRED_TOP_LEVEL_FIELDS = [
  "matchId",
  "stage",
  "date",
  "status",
  "home",
  "away",
  "result",
  "information",
  "statistics",
];

const REQUIRED_TEAM_FIELDS = ["name", "image"];
const REQUIRED_RESULT_FIELDS = ["home", "away", "regulationTime", "penalties"];
const REQUIRED_INFORMATION_FIELDS = ["category", "value"];
const REQUIRED_STATISTICS_FIELDS = ["category", "homeValue", "awayValue"];
const DEFAULT_SAMPLE_SIZE = 5;

const args = process.argv.slice(2);
const inputPath = args[0];

if (!inputPath || inputPath.startsWith("-")) {
  printUsageAndExit();
}

const sampleSize = parseSampleSize(args.slice(1));
const absolutePath = path.resolve(process.cwd(), inputPath);

if (!fs.existsSync(absolutePath)) {
  fail(`Input file not found: ${absolutePath}`);
}

let raw;
try {
  raw = fs.readFileSync(absolutePath, "utf-8");
} catch (error) {
  fail(`Failed to read file: ${absolutePath}`);
}

let parsed;
try {
  parsed = JSON.parse(raw);
} catch (error) {
  fail(`Invalid JSON: ${error.message}`);
}

const { entries, variant } = normalizeEntries(parsed);
if (entries.length === 0) {
  fail("No match entries found in JSON payload");
}

const inspectedEntries = entries.slice(0, sampleSize);
const validationErrors = [];

inspectedEntries.forEach((entry, index) => {
  const entryLabel = `entry ${index + 1} (matchId=${entry.matchId ?? "unknown"})`;

  REQUIRED_TOP_LEVEL_FIELDS.forEach((field) => {
    if (!hasOwn(entry, field)) {
      validationErrors.push(`${entryLabel}: missing top-level field '${field}'`);
    }
  });

  if (!isObject(entry.home)) {
    validationErrors.push(`${entryLabel}: field 'home' must be an object`);
  } else {
    REQUIRED_TEAM_FIELDS.forEach((field) => {
      if (!hasOwn(entry.home, field)) {
        validationErrors.push(`${entryLabel}: missing home.${field}`);
      }
    });
  }

  if (!isObject(entry.away)) {
    validationErrors.push(`${entryLabel}: field 'away' must be an object`);
  } else {
    REQUIRED_TEAM_FIELDS.forEach((field) => {
      if (!hasOwn(entry.away, field)) {
        validationErrors.push(`${entryLabel}: missing away.${field}`);
      }
    });
  }

  if (!isObject(entry.result)) {
    validationErrors.push(`${entryLabel}: field 'result' must be an object`);
  } else {
    REQUIRED_RESULT_FIELDS.forEach((field) => {
      if (!hasOwn(entry.result, field)) {
        validationErrors.push(`${entryLabel}: missing result.${field}`);
      }
    });
  }

  if (!Array.isArray(entry.information)) {
    validationErrors.push(`${entryLabel}: field 'information' must be an array`);
  } else {
    entry.information.forEach((item, itemIndex) => {
      if (!isObject(item)) {
        validationErrors.push(
          `${entryLabel}: information[${itemIndex}] must be an object`
        );
        return;
      }

      REQUIRED_INFORMATION_FIELDS.forEach((field) => {
        if (!hasOwn(item, field)) {
          validationErrors.push(
            `${entryLabel}: missing information[${itemIndex}].${field}`
          );
        }
      });
    });
  }

  if (!Array.isArray(entry.statistics)) {
    validationErrors.push(`${entryLabel}: field 'statistics' must be an array`);
  } else {
    entry.statistics.forEach((item, itemIndex) => {
      if (!isObject(item)) {
        validationErrors.push(
          `${entryLabel}: statistics[${itemIndex}] must be an object`
        );
        return;
      }

      REQUIRED_STATISTICS_FIELDS.forEach((field) => {
        if (!hasOwn(item, field)) {
          validationErrors.push(
            `${entryLabel}: missing statistics[${itemIndex}].${field}`
          );
        }
      });
    });
  }
});

if (validationErrors.length > 0) {
  console.error("\nSchema validation failed.");
  validationErrors.forEach((error) => {
    console.error(`- ${error}`);
  });
  process.exit(1);
}

console.info(
  `Schema validation passed: ${inspectedEntries.length}/${entries.length} ${variant} entries checked from ${inputPath}`
);

function normalizeEntries(payload) {
  if (Array.isArray(payload)) {
    return {
      variant: "array",
      entries: payload.map((item, index) => {
        if (isObject(item)) return item;
        return { matchId: `index-${index}` };
      }),
    };
  }

  if (isObject(payload)) {
    return {
      variant: "object-map",
      entries: Object.entries(payload).map(([matchId, value]) => {
        const base = isObject(value) ? value : {};
        return {
          matchId,
          ...base,
        };
      }),
    };
  }

  fail("Expected top-level JSON object or array");
}

function parseSampleSize(flags) {
  const sampleFlagIndex = flags.findIndex((flag) => flag === "--sample");
  const inlineFlag = flags.find((flag) => flag.startsWith("--sample="));

  let rawValue = null;
  if (sampleFlagIndex !== -1) {
    rawValue = flags[sampleFlagIndex + 1];
  } else if (inlineFlag) {
    rawValue = inlineFlag.split("=")[1];
  }

  if (!rawValue) return DEFAULT_SAMPLE_SIZE;

  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    fail(`Invalid --sample value: ${rawValue}`);
  }

  return parsed;
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function fail(message) {
  console.error(`\n${message}`);
  process.exit(1);
}

function printUsageAndExit() {
  console.info("Usage: node scripts/validate-flashscore-schema.mjs <path-to-output.json> [--sample N]");
  process.exit(1);
}

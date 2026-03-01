import fs from "node:fs/promises";
import path from "node:path";

export const DEFAULT_TREND_LOOKBACK_HOURS = 7 * 24;
export const DEFAULT_SMOKE_HISTORY_DIR = ".planning/artifacts/smoke";
export const DEFAULT_SELECTOR_HEALTH_HISTORY_DIR =
  ".planning/artifacts/selector-health";

const SOURCE_CONFIG = Object.freeze([
  {
    source: "smoke",
    directory: DEFAULT_SMOKE_HISTORY_DIR,
    requiredKeys: ["runId", "completedAt", "result", "fixtures", "issues"],
  },
  {
    source: "selector_health",
    directory: DEFAULT_SELECTOR_HEALTH_HISTORY_DIR,
    requiredKeys: ["runId", "completedAt", "result", "scopeResults"],
  },
]);

const resolveLookbackHours = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_TREND_LOOKBACK_HOURS;
  return parsed;
};

const toIso = (value, fallback = null) => {
  if (!value) return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed.toISOString();
};

const toEpochMs = (value, fallback = null) => {
  if (!value) return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed.getTime();
};

const resolveCompletedAt = (payload, stat) => {
  const completedAt =
    toIso(payload?.completedAt) ||
    toIso(payload?.summary?.completedAt) ||
    toIso(payload?.startedAt);

  if (completedAt) {
    return {
      completedAt,
      completedAtMs: toEpochMs(completedAt),
      usedFallback: false,
    };
  }

  const fallbackIso = stat?.mtime ? new Date(stat.mtime).toISOString() : null;
  return {
    completedAt: fallbackIso,
    completedAtMs: toEpochMs(fallbackIso),
    usedFallback: true,
  };
};

const hasRequiredKeys = (payload = {}, requiredKeys = []) =>
  requiredKeys.filter((key) => !(key in payload));

const normalizeArtifactEntry = ({
  source,
  filePath,
  payload,
  completedAt,
  completedAtMs,
  usedTimestampFallback,
}) => ({
  source,
  filePath,
  runId: payload?.runId || path.basename(filePath, path.extname(filePath)),
  startedAt: toIso(payload?.startedAt),
  completedAt,
  completedAtMs,
  usedTimestampFallback,
  result: payload?.result === "fail" ? "fail" : "pass",
  payload,
});

const readSourceHistory = async ({
  source,
  directory,
  requiredKeys,
  windowStartMs,
  nowMs,
  diagnostics,
}) => {
  let files;
  try {
    files = await fs.readdir(directory, { withFileTypes: true });
  } catch {
    diagnostics.missingDirectories.push({ source, directory });
    return [];
  }

  const jsonFiles = files
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => path.join(directory, entry.name))
    .sort((left, right) => left.localeCompare(right));

  const results = [];
  for (const filePath of jsonFiles) {
    diagnostics.filesConsidered += 1;
    diagnostics.pathsConsidered.push({ source, filePath });

    let raw;
    let stat;
    try {
      [raw, stat] = await Promise.all([
        fs.readFile(filePath, "utf8"),
        fs.stat(filePath),
      ]);
    } catch (error) {
      diagnostics.parseFailures.push({
        source,
        filePath,
        reason:
          error instanceof Error ? error.message : "artifact_read_failed",
      });
      continue;
    }

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch (error) {
      diagnostics.parseFailures.push({
        source,
        filePath,
        reason: error instanceof Error ? error.message : "artifact_json_parse_failed",
      });
      continue;
    }

    const missingKeys = hasRequiredKeys(payload, requiredKeys);
    if (missingKeys.length > 0) {
      diagnostics.missingRequiredFields.push({
        source,
        filePath,
        missing: missingKeys,
      });
      continue;
    }

    const { completedAt, completedAtMs, usedFallback } = resolveCompletedAt(
      payload,
      stat
    );
    if (!completedAtMs || completedAtMs > nowMs || completedAtMs < windowStartMs) {
      diagnostics.skippedOutsideWindow.push({
        source,
        filePath,
        completedAt: completedAt || null,
      });
      continue;
    }

    results.push(
      normalizeArtifactEntry({
        source,
        filePath,
        payload,
        completedAt,
        completedAtMs,
        usedTimestampFallback: usedFallback,
      })
    );
  }

  return results;
};

const dedupeRuns = (runs, diagnostics) => {
  const byKey = new Map();

  runs.forEach((run) => {
    const key = `${run.source}:${run.runId}`;
    const existing = byKey.get(key);

    if (!existing || run.completedAtMs > existing.completedAtMs) {
      if (existing) {
        diagnostics.duplicatesSkipped.push({
          source: existing.source,
          runId: existing.runId,
          droppedFile: existing.filePath,
          keptFile: run.filePath,
        });
      }
      byKey.set(key, run);
      return;
    }

    diagnostics.duplicatesSkipped.push({
      source: run.source,
      runId: run.runId,
      droppedFile: run.filePath,
      keptFile: existing.filePath,
    });
  });

  return [...byKey.values()].sort((left, right) => left.completedAtMs - right.completedAtMs);
};

export const loadReliabilityTrendHistory = async (options = {}) => {
  const now = options.now || new Date();
  const nowMs = now instanceof Date ? now.getTime() : new Date(now).getTime();
  const lookbackHours = resolveLookbackHours(options.lookbackHours);
  const lookbackMs = lookbackHours * 60 * 60 * 1000;
  const windowStartMs = nowMs - lookbackMs;

  const directories = {
    smoke: options.smokeHistoryDir || DEFAULT_SMOKE_HISTORY_DIR,
    selector_health:
      options.selectorHistoryDir || DEFAULT_SELECTOR_HEALTH_HISTORY_DIR,
  };

  const diagnostics = {
    filesConsidered: 0,
    filesLoaded: 0,
    pathsConsidered: [],
    skippedOutsideWindow: [],
    parseFailures: [],
    missingDirectories: [],
    missingRequiredFields: [],
    duplicatesSkipped: [],
  };

  const loadedRuns = await Promise.all(
    SOURCE_CONFIG.map((entry) =>
      readSourceHistory({
        source: entry.source,
        directory: directories[entry.source],
        requiredKeys: entry.requiredKeys,
        windowStartMs,
        nowMs,
        diagnostics,
      })
    )
  );

  const dedupedRuns = dedupeRuns(loadedRuns.flat(), diagnostics);
  diagnostics.filesLoaded = dedupedRuns.length;

  return {
    window: {
      lookbackHours,
      start: new Date(windowStartMs).toISOString(),
      end: new Date(nowMs).toISOString(),
    },
    directories,
    runs: dedupedRuns,
    diagnostics,
  };
};


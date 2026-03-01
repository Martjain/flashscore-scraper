import fs from "node:fs/promises";
import path from "node:path";

export const DEFAULT_RELIABILITY_TREND_REPORT_PATH =
  ".planning/artifacts/reliability-trends/latest.json";

const HISTORY_FILE_PREFIX = "reliability-trends-";

const toHistoryTimestamp = (date = new Date()) =>
  date.toISOString().replace(/[:.]/g, "-");

const resolveReportPaths = (
  reportPath = DEFAULT_RELIABILITY_TREND_REPORT_PATH
) => {
  const latestPath = path.resolve(reportPath);
  const directory = path.dirname(latestPath);
  const historyPath = path.join(
    directory,
    `${HISTORY_FILE_PREFIX}${toHistoryTimestamp()}.json`
  );

  return { directory, latestPath, historyPath };
};

export const writeReliabilityTrendReports = async (
  report,
  reportPath = DEFAULT_RELIABILITY_TREND_REPORT_PATH
) => {
  const { directory, latestPath, historyPath } = resolveReportPaths(reportPath);
  const payload = `${JSON.stringify(report, null, 2)}\n`;

  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(historyPath, payload, "utf8");
  await fs.writeFile(latestPath, payload, "utf8");

  return { latestPath, historyPath };
};

export const pruneReliabilityTrendHistory = async (
  reportPath = DEFAULT_RELIABILITY_TREND_REPORT_PATH,
  keepCount = 30
) => {
  const { directory } = resolveReportPaths(reportPath);
  const safeKeepCount = Number.isInteger(keepCount) && keepCount > 0 ? keepCount : 30;

  let files;
  try {
    files = await fs.readdir(directory);
  } catch {
    return { removed: [] };
  }

  const historyFiles = files
    .filter(
      (file) =>
        file.startsWith(HISTORY_FILE_PREFIX) &&
        file.endsWith(".json") &&
        file !== "latest.json"
    )
    .sort()
    .reverse();

  const filesToRemove = historyFiles.slice(safeKeepCount);
  await Promise.all(
    filesToRemove.map((file) => fs.rm(path.join(directory, file), { force: true }))
  );

  return { removed: filesToRemove };
};

export const persistReliabilityTrendReport = async (report, options = {}) => {
  const reportPath = options.reportPath || DEFAULT_RELIABILITY_TREND_REPORT_PATH;
  const keepHistory = Number.isInteger(options.keepHistory)
    ? options.keepHistory
    : 30;

  const { latestPath, historyPath } = await writeReliabilityTrendReports(
    report,
    reportPath
  );
  const { removed } = await pruneReliabilityTrendHistory(reportPath, keepHistory);

  return {
    latestPath,
    historyPath,
    prunedHistoryFiles: removed,
  };
};


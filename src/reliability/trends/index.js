import {
  DEFAULT_SELECTOR_HEALTH_HISTORY_DIR,
  DEFAULT_SMOKE_HISTORY_DIR,
  DEFAULT_TREND_LOOKBACK_HOURS,
  loadReliabilityTrendHistory,
} from "./history-loader.js";
import { aggregateReliabilityTrendData } from "./aggregation.js";

export {
  DEFAULT_SELECTOR_HEALTH_HISTORY_DIR,
  DEFAULT_SMOKE_HISTORY_DIR,
  DEFAULT_TREND_LOOKBACK_HOURS,
} from "./history-loader.js";
export {
  parseReliabilitySignature,
  resolveReliabilityIdentity,
} from "./signature-parser.js";
export { aggregateReliabilityTrendData } from "./aggregation.js";

const withStableContract = (summary = {}) => ({
  window: summary?.window || {
    lookbackHours: DEFAULT_TREND_LOOKBACK_HOURS,
    start: null,
    end: null,
  },
  totals: summary?.totals || {
    runs: 0,
    failedRuns: 0,
    failureRate: 0,
    observations: 0,
    failedObservations: 0,
    failureCount: 0,
  },
  byFixture: Array.isArray(summary?.byFixture) ? summary.byFixture : [],
  byRegion: Array.isArray(summary?.byRegion) ? summary.byRegion : [],
  sourceCoverage: summary?.sourceCoverage || {
    smoke: { runs: 0, failedRuns: 0 },
    selector_health: { runs: 0, failedRuns: 0 },
  },
  diagnostics: summary?.diagnostics || {
    filesConsidered: 0,
    filesLoaded: 0,
    pathsConsidered: [],
    skippedOutsideWindow: [],
    parseFailures: [],
    missingDirectories: [],
    missingRequiredFields: [],
    duplicatesSkipped: [],
    uncategorizedFailures: 0,
    uncategorizedRuns: 0,
  },
});

export const buildReliabilityTrendSummary = async (options = {}) => {
  const history = await loadReliabilityTrendHistory({
    lookbackHours: options.lookbackHours,
    now: options.now,
    smokeHistoryDir: options.smokeHistoryDir,
    selectorHistoryDir: options.selectorHistoryDir,
  });
  const summary = aggregateReliabilityTrendData(history);

  return withStableContract(summary);
};


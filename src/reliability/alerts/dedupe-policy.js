const DURATION_PATTERN = /^(\d+)\s*(ms|s|m|h|d)$/i;
const ISO_TS_PATTERN = /\b\d{4}-\d{2}-\d{2}t\d{2}:\d{2}:\d{2}(?:\.\d+)?z?\b/gi;
const UUID_PATTERN =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi;
const KEYED_ID_PATTERN =
  /\b(id|trace|request|req|job|run|match|fixture|token)[=:][a-z0-9._:-]+\b/gi;
const NUMBER_PATTERN = /\b\d+\b/g;
const HASH_NUMBER_PATTERN = /#\d+/g;

const DURATION_MULTIPLIERS = Object.freeze({
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
});

export const DEFAULT_ALERT_DEDUPE_COOLDOWN_MS = 15 * 60 * 1000;

export const formatAlertDurationMs = (durationMs) => {
  if (!Number.isInteger(durationMs) || durationMs <= 0) return null;
  if (durationMs % (60 * 60 * 1000) === 0) return `${durationMs / (60 * 60 * 1000)}h`;
  if (durationMs % (60 * 1000) === 0) return `${durationMs / (60 * 1000)}m`;
  if (durationMs % 1000 === 0) return `${durationMs / 1000}s`;
  return `${durationMs}ms`;
};

export const parseAlertDurationMs = (value, options = {}) => {
  const rawValue = value?.toString?.().trim?.() ?? "";
  const minMs = Number.isInteger(options.minMs) && options.minMs > 0 ? options.minMs : 1000;

  if (!rawValue) {
    return {
      ok: false,
      error: "missing_duration",
      rawValue,
    };
  }

  if (/^\d+$/.test(rawValue)) {
    const parsedNumber = Number(rawValue);
    if (!Number.isFinite(parsedNumber) || parsedNumber < minMs) {
      return {
        ok: false,
        error: "duration_below_minimum",
        rawValue,
      };
    }
    return {
      ok: true,
      valueMs: parsedNumber,
      normalized: `${parsedNumber}ms`,
      rawValue,
    };
  }

  const match = rawValue.match(DURATION_PATTERN);
  if (!match) {
    return {
      ok: false,
      error: "invalid_duration_format",
      rawValue,
    };
  }

  const valuePart = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multiplier = DURATION_MULTIPLIERS[unit];

  if (!Number.isFinite(valuePart) || valuePart <= 0 || !multiplier) {
    return {
      ok: false,
      error: "invalid_duration_value",
      rawValue,
    };
  }

  const valueMs = valuePart * multiplier;
  if (!Number.isFinite(valueMs) || valueMs < minMs) {
    return {
      ok: false,
      error: "duration_below_minimum",
      rawValue,
    };
  }

  return {
    ok: true,
    valueMs,
    normalized: `${valuePart}${unit}`,
    rawValue,
  };
};

const normalizeSignaturePart = (value = "") => {
  const normalized = value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9:_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return normalized || "unknown";
};

const toEpochMs = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  if (value instanceof Date) {
    const epoch = value.getTime();
    if (Number.isFinite(epoch)) return epoch;
  }
  return Date.now();
};

const toIsoTimestamp = (value) => new Date(toEpochMs(value)).toISOString();

const parseStateTimestamp = (value) => {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const safeInteger = (value, fallback = 0) =>
  Number.isInteger(value) && value >= 0 ? value : fallback;

export const normalizeAlertErrorClass = (value = "") => {
  const normalized = value
    .toString()
    .trim()
    .toLowerCase()
    .replace(ISO_TS_PATTERN, "<ts>")
    .replace(UUID_PATTERN, "<id>")
    .replace(KEYED_ID_PATTERN, "$1=<id>")
    .replace(HASH_NUMBER_PATTERN, "#<num>")
    .replace(NUMBER_PATTERN, "<num>")
    .replace(/[^a-z0-9<>\s:_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalized || "unknown_error";
};

export const buildAlertSignature = ({
  fixtureId,
  checkType,
  errorClass,
  region,
  source,
  environment,
  workflow,
} = {}) => {
  const normalizedFixture = normalizeSignaturePart(fixtureId);
  const normalizedCheckType = normalizeSignaturePart(checkType);
  const normalizedError = normalizeSignaturePart(
    normalizeAlertErrorClass(errorClass)
  );
  const normalizedRegion = normalizeSignaturePart(region);
  const normalizedSource = normalizeSignaturePart(source || "unknown");
  const normalizedEnvironment = normalizeSignaturePart(environment || "unknown");
  const normalizedWorkflow = normalizeSignaturePart(workflow || "default");

  return [
    `source:${normalizedSource}`,
    `env:${normalizedEnvironment}`,
    `workflow:${normalizedWorkflow}`,
    `fixture:${normalizedFixture}`,
    `check:${normalizedCheckType}`,
    `error:${normalizedError}`,
    `region:${normalizedRegion}`,
  ].join("|");
};

const buildBaseState = ({ nowMs, cooldownMs }) => {
  const nowIso = toIsoTimestamp(nowMs);
  const cooldownUntilIso = toIsoTimestamp(nowMs + cooldownMs);
  return {
    firstSeen: nowIso,
    lastSeen: nowIso,
    cooldownUntil: cooldownUntilIso,
    suppressedCount: 0,
    firstSuppressedAt: null,
    lastSuppressedAt: null,
  };
};

export const evaluateAlertCooldown = ({
  signatureKey,
  currentState = null,
  cooldownMs = DEFAULT_ALERT_DEDUPE_COOLDOWN_MS,
  now = Date.now(),
} = {}) => {
  const safeCooldownMs =
    Number.isInteger(cooldownMs) && cooldownMs > 0
      ? cooldownMs
      : DEFAULT_ALERT_DEDUPE_COOLDOWN_MS;
  const nowMs = toEpochMs(now);
  const nowIso = toIsoTimestamp(nowMs);

  const baseState = buildBaseState({
    nowMs,
    cooldownMs: safeCooldownMs,
  });

  if (!currentState) {
    return {
      signatureKey,
      decision: "emit",
      reason: "first_occurrence",
      cooldownMs: safeCooldownMs,
      now: nowIso,
      suppressionSummary: null,
      nextState: baseState,
    };
  }

  const cooldownUntilMs = parseStateTimestamp(currentState.cooldownUntil);
  const firstSeen = currentState.firstSeen || baseState.firstSeen;
  const lastSeen = nowIso;
  const suppressedCount = safeInteger(currentState.suppressedCount, 0);
  const firstSuppressedAt = currentState.firstSuppressedAt || null;
  const lastSuppressedAt = currentState.lastSuppressedAt || null;

  if (cooldownUntilMs !== null && nowMs < cooldownUntilMs) {
    const nextSuppressedCount = suppressedCount + 1;
    const nextState = {
      firstSeen,
      lastSeen,
      cooldownUntil: toIsoTimestamp(nowMs + safeCooldownMs),
      suppressedCount: nextSuppressedCount,
      firstSuppressedAt: firstSuppressedAt || nowIso,
      lastSuppressedAt: nowIso,
    };
    return {
      signatureKey,
      decision: "suppress",
      reason: "within_cooldown",
      cooldownMs: safeCooldownMs,
      now: nowIso,
      suppressionSummary: {
        suppressedCount: nextSuppressedCount,
        firstSuppressedAt: nextState.firstSuppressedAt,
        lastSuppressedAt: nextState.lastSuppressedAt,
        cooldownUntil: nextState.cooldownUntil,
      },
      nextState,
    };
  }

  const hadSuppressionWindow = suppressedCount > 0;
  const nextState = buildBaseState({
    nowMs,
    cooldownMs: safeCooldownMs,
  });

  return {
    signatureKey,
    decision: "emit",
    reason: hadSuppressionWindow
      ? "cooldown_expired_after_suppressions"
      : "cooldown_expired",
    cooldownMs: safeCooldownMs,
    now: nowIso,
    suppressionSummary: hadSuppressionWindow
      ? {
          suppressedCount,
          firstSuppressedAt: firstSuppressedAt || currentState.lastSeen || null,
          lastSuppressedAt: lastSuppressedAt || currentState.lastSeen || null,
          cooldownUntil: currentState.cooldownUntil || null,
        }
      : null,
    nextState: {
      ...nextState,
      firstSeen,
    },
  };
};

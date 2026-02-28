const DURATION_PATTERN = /^(\d+)\s*(ms|s|m|h|d)$/i;

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

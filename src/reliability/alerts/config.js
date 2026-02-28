import {
  DEFAULT_ALERT_DEDUPE_COOLDOWN_MS,
  formatAlertDurationMs,
  parseAlertDurationMs,
} from "./dedupe-policy.js";

const ALERT_WEBHOOK_ENV_KEY = "RELIABILITY_ALERT_WEBHOOK_URL";
const ALERT_ALLOW_LOCAL_ENV_KEY = "RELIABILITY_ALERT_ALLOW_LOCAL";
const ALERT_ENABLED_ENV_KEY = "RELIABILITY_ALERT_ENABLED";
const ALERT_DEDUPE_ENABLED_ENV_KEY = "RELIABILITY_ALERT_DEDUPE_ENABLED";
const ALERT_DEDUPE_COOLDOWN_ENV_KEY = "RELIABILITY_ALERT_DEDUPE_COOLDOWN";
const ALERT_DEDUPE_SMOKE_ENABLED_ENV_KEY = "RELIABILITY_ALERT_DEDUPE_SMOKE_ENABLED";
const ALERT_DEDUPE_SMOKE_COOLDOWN_ENV_KEY = "RELIABILITY_ALERT_DEDUPE_SMOKE_COOLDOWN";
const ALERT_DEDUPE_SELECTOR_ENABLED_ENV_KEY =
  "RELIABILITY_ALERT_DEDUPE_SELECTOR_HEALTH_ENABLED";
const ALERT_DEDUPE_SELECTOR_COOLDOWN_ENV_KEY =
  "RELIABILITY_ALERT_DEDUPE_SELECTOR_HEALTH_COOLDOWN";

const TRUTHY_VALUES = new Set(["1", "true", "yes", "on"]);
const FALSY_VALUES = new Set(["0", "false", "no", "off"]);
const DEFAULT_ALERT_SOURCES = Object.freeze(["smoke", "selector_health"]);

const readEnvValue = (env = {}, key) => {
  const value = env?.[key];
  return typeof value === "string" ? value.trim() : "";
};

const readBooleanEnv = (env = {}, key) => {
  const normalized = readEnvValue(env, key).toLowerCase();
  if (!normalized) return null;
  if (TRUTHY_VALUES.has(normalized)) return true;
  if (FALSY_VALUES.has(normalized)) return false;
  return null;
};

const normalizeRunResult = (runResult) =>
  typeof runResult === "string" ? runResult.trim().toLowerCase() : "";

const normalizeWebhookUrl = (value = "") => value.trim();
const normalizeSource = (value = "") =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const createDefaultPolicySlice = () => ({
  enabled: true,
  cooldownMs: DEFAULT_ALERT_DEDUPE_COOLDOWN_MS,
  cooldown: formatAlertDurationMs(DEFAULT_ALERT_DEDUPE_COOLDOWN_MS),
});

const createDefaultDedupePolicy = () => ({
  global: createDefaultPolicySlice(),
  sources: {
    smoke: createDefaultPolicySlice(),
    selector_health: createDefaultPolicySlice(),
  },
});

const cloneDedupePolicy = (policy = createDefaultDedupePolicy()) => ({
  global: { ...policy.global },
  sources: {
    smoke: { ...policy.sources.smoke },
    selector_health: { ...policy.sources.selector_health },
  },
});

let lastKnownValidDedupePolicy = createDefaultDedupePolicy();

const parseOptionalBooleanWithFallback = ({
  env = process.env,
  key,
  defaultValue,
  invalidFallbackValue,
  diagnostics,
  scope,
}) => {
  const raw = readEnvValue(env, key);
  const parsed = readBooleanEnv(env, key);
  if (!raw) {
    diagnostics.push({
      key,
      scope,
      status: "default",
      raw: null,
      resolved: defaultValue,
      reason: "env_not_set",
    });
    return defaultValue;
  }

  if (parsed === null) {
    diagnostics.push({
      key,
      scope,
      status: "fallback_last_known",
      raw,
      resolved: invalidFallbackValue,
      reason: "invalid_boolean",
    });
    return invalidFallbackValue;
  }

  diagnostics.push({
    key,
    scope,
    status: "parsed",
    raw,
    resolved: parsed,
    reason: null,
  });
  return parsed;
};

const parseOptionalDurationWithFallback = ({
  env = process.env,
  key,
  defaultValueMs,
  invalidFallbackValueMs,
  diagnostics,
  scope,
}) => {
  const raw = readEnvValue(env, key);
  if (!raw) {
    diagnostics.push({
      key,
      scope,
      status: "default",
      raw: null,
      resolvedMs: defaultValueMs,
      resolved: formatAlertDurationMs(defaultValueMs),
      reason: "env_not_set",
    });
    return defaultValueMs;
  }

  const parsed = parseAlertDurationMs(raw);
  if (!parsed.ok) {
    diagnostics.push({
      key,
      scope,
      status: "fallback_last_known",
      raw,
      resolvedMs: invalidFallbackValueMs,
      resolved: formatAlertDurationMs(invalidFallbackValueMs),
      reason: parsed.error,
    });
    return invalidFallbackValueMs;
  }

  diagnostics.push({
    key,
    scope,
    status: "parsed",
    raw,
    resolvedMs: parsed.valueMs,
    resolved: parsed.normalized,
    reason: null,
  });
  return parsed.valueMs;
};

const sourcePolicyKeyMap = Object.freeze({
  smoke: {
    enabled: ALERT_DEDUPE_SMOKE_ENABLED_ENV_KEY,
    cooldown: ALERT_DEDUPE_SMOKE_COOLDOWN_ENV_KEY,
  },
  selector_health: {
    enabled: ALERT_DEDUPE_SELECTOR_ENABLED_ENV_KEY,
    cooldown: ALERT_DEDUPE_SELECTOR_COOLDOWN_ENV_KEY,
  },
});

export const resolveAlertDedupePolicy = ({
  source,
  env = process.env,
} = {}) => {
  const normalizedSource = normalizeSource(source);
  const effectiveSource = DEFAULT_ALERT_SOURCES.includes(normalizedSource)
    ? normalizedSource
    : "unknown";

  const diagnostics = [];
  const defaultPolicy = createDefaultDedupePolicy();
  const fallbackPolicy = cloneDedupePolicy(lastKnownValidDedupePolicy);
  const resolvedPolicy = createDefaultDedupePolicy();

  resolvedPolicy.global.enabled = parseOptionalBooleanWithFallback({
    env,
    key: ALERT_DEDUPE_ENABLED_ENV_KEY,
    defaultValue: defaultPolicy.global.enabled,
    invalidFallbackValue: fallbackPolicy.global.enabled,
    diagnostics,
    scope: "global",
  });
  resolvedPolicy.global.cooldownMs = parseOptionalDurationWithFallback({
    env,
    key: ALERT_DEDUPE_COOLDOWN_ENV_KEY,
    defaultValueMs: defaultPolicy.global.cooldownMs,
    invalidFallbackValueMs: fallbackPolicy.global.cooldownMs,
    diagnostics,
    scope: "global",
  });
  resolvedPolicy.global.cooldown = formatAlertDurationMs(resolvedPolicy.global.cooldownMs);

  DEFAULT_ALERT_SOURCES.forEach((entrySource) => {
    const keys = sourcePolicyKeyMap[entrySource];
    const sourceFallback = fallbackPolicy.sources[entrySource];
    const sourcePolicy = {
      enabled: parseOptionalBooleanWithFallback({
        env,
        key: keys.enabled,
        defaultValue: resolvedPolicy.global.enabled,
        invalidFallbackValue: sourceFallback.enabled,
        diagnostics,
        scope: entrySource,
      }),
      cooldownMs: parseOptionalDurationWithFallback({
        env,
        key: keys.cooldown,
        defaultValueMs: resolvedPolicy.global.cooldownMs,
        invalidFallbackValueMs: sourceFallback.cooldownMs,
        diagnostics,
        scope: entrySource,
      }),
      cooldown: null,
    };

    sourcePolicy.enabled = sourcePolicy.enabled ?? resolvedPolicy.global.enabled;
    sourcePolicy.cooldownMs = sourcePolicy.cooldownMs ?? resolvedPolicy.global.cooldownMs;
    sourcePolicy.cooldown = formatAlertDurationMs(sourcePolicy.cooldownMs);
    resolvedPolicy.sources[entrySource] = sourcePolicy;
  });

  lastKnownValidDedupePolicy = cloneDedupePolicy(resolvedPolicy);

  const effectivePolicy =
    effectiveSource === "unknown"
      ? resolvedPolicy.global
      : resolvedPolicy.sources[effectiveSource];

  return {
    source: effectiveSource,
    effective: {
      enabled: effectivePolicy.enabled,
      cooldownMs: effectivePolicy.cooldownMs,
      cooldown: effectivePolicy.cooldown,
    },
    global: { ...resolvedPolicy.global },
    sources: {
      smoke: { ...resolvedPolicy.sources.smoke },
      selector_health: { ...resolvedPolicy.sources.selector_health },
    },
    diagnostics,
  };
};

export const shouldSendFailureAlert = ({
  runResult,
  env = process.env,
  requireCi = true,
} = {}) => {
  const normalizedRunResult = normalizeRunResult(runResult);
  if (normalizedRunResult !== "fail") {
    return {
      enabled: false,
      reason: "run_not_failed",
      webhookUrl: null,
      source: "result",
    };
  }

  const alertsEnabled = readBooleanEnv(env, ALERT_ENABLED_ENV_KEY);
  if (alertsEnabled === false) {
    return {
      enabled: false,
      reason: "alerts_disabled",
      webhookUrl: null,
      source: ALERT_ENABLED_ENV_KEY,
    };
  }

  const webhookUrl = normalizeWebhookUrl(readEnvValue(env, ALERT_WEBHOOK_ENV_KEY));
  if (!webhookUrl) {
    return {
      enabled: false,
      reason: "missing_webhook_url",
      webhookUrl: null,
      source: ALERT_WEBHOOK_ENV_KEY,
    };
  }

  const isCi = readBooleanEnv(env, "CI") === true;
  const allowLocal = readBooleanEnv(env, ALERT_ALLOW_LOCAL_ENV_KEY) === true;

  if (requireCi && !isCi && !allowLocal) {
    return {
      enabled: false,
      reason: "ci_only_default",
      webhookUrl: null,
      source: "CI",
    };
  }

  return {
    enabled: true,
    reason: "enabled",
    webhookUrl,
    source: isCi ? "CI" : ALERT_ALLOW_LOCAL_ENV_KEY,
  };
};

export const alertConfigKeys = Object.freeze({
  ALERT_WEBHOOK_ENV_KEY,
  ALERT_ALLOW_LOCAL_ENV_KEY,
  ALERT_ENABLED_ENV_KEY,
  ALERT_DEDUPE_ENABLED_ENV_KEY,
  ALERT_DEDUPE_COOLDOWN_ENV_KEY,
  ALERT_DEDUPE_SMOKE_ENABLED_ENV_KEY,
  ALERT_DEDUPE_SMOKE_COOLDOWN_ENV_KEY,
  ALERT_DEDUPE_SELECTOR_ENABLED_ENV_KEY,
  ALERT_DEDUPE_SELECTOR_COOLDOWN_ENV_KEY,
});

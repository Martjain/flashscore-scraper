const ALERT_WEBHOOK_ENV_KEY = "RELIABILITY_ALERT_WEBHOOK_URL";
const ALERT_ALLOW_LOCAL_ENV_KEY = "RELIABILITY_ALERT_ALLOW_LOCAL";
const ALERT_ENABLED_ENV_KEY = "RELIABILITY_ALERT_ENABLED";

const TRUTHY_VALUES = new Set(["1", "true", "yes", "on"]);
const FALSY_VALUES = new Set(["0", "false", "no", "off"]);

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
});

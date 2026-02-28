import {
  alertConfigKeys,
  resolveAlertDedupePolicy,
  shouldSendFailureAlert,
} from "./config.js";
import {
  buildAlertSignature,
  normalizeAlertErrorClass,
} from "./dedupe-policy.js";
import {
  evaluateAndStoreAlertDedupe,
  getAlertDedupeState,
} from "./dedupe-state.js";
import { buildFailureAlertPayload } from "./payload.js";
import { alertPublisherDefaults, publishFailureAlert } from "./publisher.js";

export { alertConfigKeys, shouldSendFailureAlert } from "./config.js";
export { resolveAlertDedupePolicy } from "./config.js";
export { buildFailureAlertPayload } from "./payload.js";
export { alertPublisherDefaults, publishFailureAlert } from "./publisher.js";
export { buildAlertSignature, normalizeAlertErrorClass } from "./dedupe-policy.js";
export {
  clearAlertDedupeState,
  evaluateAndStoreAlertDedupe,
  getAlertDedupeState,
  setAlertDedupeState,
  snapshotAlertDedupeState,
} from "./dedupe-state.js";

const asTrimmedString = (value) =>
  typeof value === "string" ? value.trim() : "";

const firstFailedFixtureId = (result = {}) =>
  (result.fixtures || []).find((fixture) => fixture?.status === "fail")?.fixtureId ||
  (result.issues || []).find((issue) => issue?.fixtureId && issue.fixtureId !== "run")
    ?.fixtureId ||
  null;

const firstFailureStage = (result = {}) =>
  (result.issues || []).find((issue) => issue?.failedStage)?.failedStage ||
  "run";

const firstSelectorFailure = (result = {}) =>
  (result.scopeResults || [])
    .flatMap((scopeResult) => scopeResult.checks || [])
    .find((check) => check?.status === "fail") || null;

const deriveAlertEventDefaults = ({ source, event = {}, result = {}, env = process.env }) => {
  const normalizedSource = asTrimmedString(source).toLowerCase() || "unknown";
  const fallbackSelectorFailure = firstSelectorFailure(result);
  const fixtureId =
    asTrimmedString(event.fixtureId) ||
    firstFailedFixtureId(result) ||
    "run";
  const checkType =
    asTrimmedString(event.checkType) ||
    (normalizedSource === "smoke"
      ? `smoke:${firstFailureStage(result)}`
      : normalizedSource === "selector_health"
        ? `selector_health:${asTrimmedString(fallbackSelectorFailure?.contractKey) || "check"}`
        : "unknown:check");
  const errorClass =
    asTrimmedString(event.errorClass || event.error) ||
    asTrimmedString(fallbackSelectorFailure?.errorReason) ||
    asTrimmedString(result.issues?.[0]?.error) ||
    "unknown_error";
  const region =
    asTrimmedString(event.region) ||
    asTrimmedString(result.selection?.selectedRegion) ||
    "global";
  const workflow =
    asTrimmedString(event.workflow) ||
    asTrimmedString(result.mode) ||
    "default";
  const environment =
    asTrimmedString(event.environment) ||
    (env?.CI ? "ci" : "local");

  return {
    source: normalizedSource,
    fixtureId,
    checkType,
    errorClass,
    region,
    workflow,
    environment,
  };
};

export const evaluateFailureAlertEmission = ({
  source,
  event = {},
  result = {},
  env = process.env,
  now = Date.now(),
} = {}) => {
  const policy = resolveAlertDedupePolicy({
    source,
    env,
  });
  const signatureInput = deriveAlertEventDefaults({
    source,
    event,
    result,
    env,
  });
  const normalizedErrorClass = normalizeAlertErrorClass(signatureInput.errorClass);
  const signatureKey = buildAlertSignature({
    fixtureId: signatureInput.fixtureId,
    checkType: signatureInput.checkType,
    errorClass: normalizedErrorClass,
    region: signatureInput.region,
    source: signatureInput.source,
    workflow: signatureInput.workflow,
    environment: signatureInput.environment,
  });

  if (!policy.effective.enabled) {
    return {
      decision: "emit",
      reason: "dedupe_disabled",
      signatureKey,
      policy,
      suppressionSummary: null,
      state: getAlertDedupeState(signatureKey),
      metadata: {
        fixtureId: signatureInput.fixtureId,
        checkType: signatureInput.checkType,
        normalizedErrorClass,
        region: signatureInput.region,
        workflow: signatureInput.workflow,
        environment: signatureInput.environment,
      },
    };
  }

  const dedupe = evaluateAndStoreAlertDedupe({
    signatureKey,
    cooldownMs: policy.effective.cooldownMs,
    now,
  });

  return {
    decision: dedupe.decision,
    reason: dedupe.reason,
    signatureKey: dedupe.signatureKey,
    policy,
    suppressionSummary: dedupe.suppressionSummary,
    state: dedupe.state,
    metadata: {
      fixtureId: signatureInput.fixtureId,
      checkType: signatureInput.checkType,
      normalizedErrorClass,
      region: signatureInput.region,
      workflow: signatureInput.workflow,
      environment: signatureInput.environment,
    },
  };
};

export const sendFailureAlert = async ({
  source,
  result,
  metadata = {},
  env = process.env,
  timeoutMs = alertPublisherDefaults.timeoutMs,
  fetchImpl = globalThis.fetch,
} = {}) => {
  const gate = shouldSendFailureAlert({
    runResult: result?.result,
    env,
  });

  if (!gate.enabled) {
    return {
      attempted: false,
      sent: false,
      skipped: true,
      gate,
      payload: null,
      statusCode: null,
      error: null,
      durationMs: 0,
    };
  }

  const payload = buildFailureAlertPayload({
    source,
    result,
    metadata,
  });
  const publishResult = await publishFailureAlert({
    payload,
    webhookUrl: gate.webhookUrl,
    timeoutMs,
    fetchImpl,
  });

  return {
    ...publishResult,
    attempted: true,
    skipped: false,
    gate,
    payload,
  };
};

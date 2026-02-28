import { alertConfigKeys, shouldSendFailureAlert } from "./config.js";
import { buildFailureAlertPayload } from "./payload.js";
import { alertPublisherDefaults, publishFailureAlert } from "./publisher.js";

export { alertConfigKeys, shouldSendFailureAlert } from "./config.js";
export { buildFailureAlertPayload } from "./payload.js";
export { alertPublisherDefaults, publishFailureAlert } from "./publisher.js";

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

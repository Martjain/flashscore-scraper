const DEFAULT_ALERT_TIMEOUT_MS = 5000;
const MAX_ERROR_BODY_CHARS = 500;

const trimToLimit = (value = "", limit = MAX_ERROR_BODY_CHARS) =>
  value.length <= limit ? value : `${value.slice(0, limit)}...`;

const parseTimeoutMs = (timeoutMs) =>
  Number.isInteger(timeoutMs) && timeoutMs > 0
    ? timeoutMs
    : DEFAULT_ALERT_TIMEOUT_MS;

export const publishFailureAlert = async ({
  payload,
  webhookUrl,
  timeoutMs = DEFAULT_ALERT_TIMEOUT_MS,
  fetchImpl = globalThis.fetch,
} = {}) => {
  const startedAt = Date.now();
  const safeTimeoutMs = parseTimeoutMs(timeoutMs);

  if (!webhookUrl) {
    return {
      attempted: false,
      sent: false,
      statusCode: null,
      error: "missing_webhook_url",
      durationMs: 0,
    };
  }

  if (typeof fetchImpl !== "function") {
    return {
      attempted: false,
      sent: false,
      statusCode: null,
      error: "fetch_unavailable",
      durationMs: 0,
    };
  }

  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), safeTimeoutMs);

  try {
    const response = await fetchImpl(webhookUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload ?? {}),
      signal: abortController.signal,
    });
    const durationMs = Date.now() - startedAt;

    if (response.ok) {
      return {
        attempted: true,
        sent: true,
        statusCode: response.status,
        error: null,
        durationMs,
      };
    }

    const responseBody = trimToLimit(await response.text().catch(() => ""));
    return {
      attempted: true,
      sent: false,
      statusCode: response.status,
      error: `http_${response.status}`,
      durationMs,
      responseBody,
    };
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    const isTimeout =
      error?.name === "AbortError" || durationMs >= safeTimeoutMs;
    const errorMessage =
      error instanceof Error ? error.message : "publish_failed";

    return {
      attempted: true,
      sent: false,
      statusCode: null,
      error: isTimeout ? "timeout" : "network_error",
      errorMessage,
      durationMs,
    };
  } finally {
    clearTimeout(timeoutId);
  }
};

export const alertPublisherDefaults = Object.freeze({
  timeoutMs: DEFAULT_ALERT_TIMEOUT_MS,
});

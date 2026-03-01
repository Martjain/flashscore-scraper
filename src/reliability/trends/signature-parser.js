const DEFAULT_FIXTURE_KEY = "unknown-fixture";
const DEFAULT_REGION_KEY = "global";

const normalizeToken = (value, fallback) => {
  const normalized = value
    ?.toString()
    ?.trim()
    ?.toLowerCase()
    ?.replace(/[^a-z0-9:_-]+/g, "-")
    ?.replace(/-+/g, "-")
    ?.replace(/^-|-$/g, "");

  return normalized || fallback;
};

const toObjectEntries = (value = "") =>
  value
    .split("|")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => {
      const separatorIndex = segment.indexOf(":");
      if (separatorIndex <= 0) return null;

      const key = normalizeToken(segment.slice(0, separatorIndex), "");
      const tokenValue = normalizeToken(segment.slice(separatorIndex + 1), "");
      if (!key || !tokenValue) return null;

      return [key, tokenValue];
    })
    .filter(Boolean);

export const parseReliabilitySignature = (signature = "") => {
  const raw = typeof signature === "string" ? signature : "";
  const entries = Object.fromEntries(toObjectEntries(raw));

  return {
    raw,
    entries,
    source: entries.source || "unknown",
    environment: entries.env || "unknown",
    workflow: entries.workflow || "default",
    fixture: entries.fixture || DEFAULT_FIXTURE_KEY,
    check: entries.check || "unknown-check",
    errorClass: entries.error || "unknown-error",
    region: entries.region || DEFAULT_REGION_KEY,
  };
};

export const resolveReliabilityIdentity = ({
  signature = "",
  fixture = null,
  region = null,
  source = null,
} = {}) => {
  const parsed = parseReliabilitySignature(signature);

  return {
    fixture: normalizeToken(fixture || parsed.fixture, DEFAULT_FIXTURE_KEY),
    region: normalizeToken(region || parsed.region, DEFAULT_REGION_KEY),
    source: normalizeToken(source || parsed.source, "unknown"),
    check: parsed.check,
    errorClass: parsed.errorClass,
  };
};


import {
  DEFAULT_ALERT_DEDUPE_COOLDOWN_MS,
  evaluateAlertCooldown,
} from "./dedupe-policy.js";

const dedupeStateBySignature = new Map();

const cloneState = (state = {}) => ({
  firstSeen: state.firstSeen || null,
  lastSeen: state.lastSeen || null,
  cooldownUntil: state.cooldownUntil || null,
  suppressedCount:
    Number.isInteger(state.suppressedCount) && state.suppressedCount >= 0
      ? state.suppressedCount
      : 0,
  firstSuppressedAt: state.firstSuppressedAt || null,
  lastSuppressedAt: state.lastSuppressedAt || null,
});

export const getAlertDedupeState = (signatureKey) => {
  if (!signatureKey || !dedupeStateBySignature.has(signatureKey)) return null;
  return cloneState(dedupeStateBySignature.get(signatureKey));
};

export const setAlertDedupeState = (signatureKey, state) => {
  if (!signatureKey || !state) return null;
  const normalized = cloneState(state);
  dedupeStateBySignature.set(signatureKey, normalized);
  return cloneState(normalized);
};

export const evaluateAndStoreAlertDedupe = ({
  signatureKey,
  cooldownMs = DEFAULT_ALERT_DEDUPE_COOLDOWN_MS,
  now = Date.now(),
} = {}) => {
  const currentState = getAlertDedupeState(signatureKey);
  const decision = evaluateAlertCooldown({
    signatureKey,
    currentState,
    cooldownMs,
    now,
  });
  setAlertDedupeState(signatureKey, decision.nextState);

  return {
    ...decision,
    state: getAlertDedupeState(signatureKey),
  };
};

export const snapshotAlertDedupeState = () =>
  Array.from(dedupeStateBySignature.entries()).map(([signatureKey, state]) => ({
    signatureKey,
    ...cloneState(state),
  }));

export const clearAlertDedupeState = () => {
  dedupeStateBySignature.clear();
};

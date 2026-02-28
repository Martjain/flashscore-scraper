const DEFAULT_SELECTOR_TIMEOUT_MS = 1200;

const safePageUrl = (page) => {
  try {
    return page.url();
  } catch {
    return null;
  }
};

const countMatches = async (page, selector) => {
  try {
    return await page.$$eval(selector, (elements) => elements.length);
  } catch {
    return 0;
  }
};

const waitForCandidate = async (page, selector, timeoutMs) => {
  if (timeoutMs <= 0) {
    return;
  }

  try {
    await page.waitForSelector(selector, {
      timeout: timeoutMs,
      state: "attached",
    });
  } catch {
    // Intentionally ignored so deterministic fallback logic can continue.
  }
};

export const resolveSelector = async (page, contract, options = {}) => {
  const timeoutMs = Number.isFinite(options.timeoutMs)
    ? Math.max(0, Number(options.timeoutMs))
    : DEFAULT_SELECTOR_TIMEOUT_MS;
  const selectors = Array.isArray(options.selectors) && options.selectors.length
    ? options.selectors
    : contract.selectors;
  const selectorsTried = [];

  for (let selectorIndex = 0; selectorIndex < selectors.length; selectorIndex += 1) {
    const selector = selectors[selectorIndex];
    selectorsTried.push(selector);

    await waitForCandidate(page, selector, timeoutMs);
    const matchedCount = await countMatches(page, selector);

    if (matchedCount > 0) {
      return {
        ok: true,
        scope: contract.scope,
        contractKey: contract.key,
        selectorsTried,
        matchedSelector: selector,
        matchedSelectorIndex: selectorIndex,
        matchedCount,
        fallbackUsed: selectorIndex > 0,
        fallbackCount: selectorIndex,
        attemptedCount: selectorsTried.length,
        pageUrl: safePageUrl(page),
        errorReason: null,
      };
    }
  }

  return {
    ok: false,
    scope: contract.scope,
    contractKey: contract.key,
    selectorsTried,
    matchedSelector: null,
    matchedSelectorIndex: null,
    matchedCount: 0,
    fallbackUsed: false,
    fallbackCount: 0,
    attemptedCount: selectorsTried.length,
    pageUrl: safePageUrl(page),
    errorReason: "selector_not_found",
  };
};

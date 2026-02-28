import {
  CRITICAL_SELECTOR_KEYS,
  SELECTOR_CONTRACT_KEYS,
  SELECTOR_HEALTH_SCOPES,
} from "./keys.js";

const deepFreeze = (value) => {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }

  Object.freeze(value);
  Object.values(value).forEach((child) => deepFreeze(child));
  return value;
};

const createContract = ({ key, scope, intent, selectors }) => {
  if (!Array.isArray(selectors) || selectors.length === 0) {
    throw new Error(`Selector contract "${key}" requires at least one selector.`);
  }

  if (selectors.length > 3) {
    throw new Error(`Selector contract "${key}" exceeds fallback limit (max 3).`);
  }

  return deepFreeze({
    key,
    scope,
    intent: {
      route: intent.route,
      page: intent.page,
      description: intent.description,
    },
    selectors: [...selectors],
  });
};

const CRITICAL_SELECTOR_CONTRACTS = deepFreeze([
  createContract({
    key: SELECTOR_CONTRACT_KEYS.COUNTRIES,
    scope: SELECTOR_HEALTH_SCOPES.COUNTRIES,
    intent: {
      route: "/soccer/",
      page: "country discovery left navigation",
      description: "Discover available countries before league selection.",
    },
    selectors: [
      "#category-left-menu a[href*='/soccer/']",
      "[class*='lmenu'] a[href*='/soccer/']",
      "[data-testid*='left'] a[href*='/soccer/']",
    ],
  }),
  createContract({
    key: SELECTOR_CONTRACT_KEYS.LEAGUES,
    scope: SELECTOR_HEALTH_SCOPES.LEAGUES,
    intent: {
      route: "/soccer/{country}/",
      page: "country page league navigation",
      description: "Discover leagues for a selected country slug.",
    },
    selectors: [
      "#category-left-menu a[href*='/soccer/']",
      "[class*='lmenu'] a[href*='/soccer/']",
      "[data-testid*='left'] a[href*='/soccer/']",
    ],
  }),
  createContract({
    key: SELECTOR_CONTRACT_KEYS.SEASONS,
    scope: SELECTOR_HEALTH_SCOPES.SEASONS,
    intent: {
      route: "/soccer/{country}/{league}/archive",
      page: "league archive season picker",
      description: "Discover season links for a selected league page.",
    },
    selectors: [
      ".archiveLatte__season > a.archiveLatte__text--clickable",
      ".archiveLatte__season > a",
      "div.archive__season > a",
    ],
  }),
  createContract({
    key: SELECTOR_CONTRACT_KEYS.MATCH_LIST,
    scope: SELECTOR_HEALTH_SCOPES.MATCH_LIST,
    intent: {
      route: "/soccer/{country}/{league}-{season}/{results|fixtures}",
      page: "season results or fixtures match list",
      description: "Locate match rows on season result and fixture pages.",
    },
    selectors: [
      ".event__match.event__match--static.event__match--twoLine",
      ".event__match[id^='g_']",
      "[data-testid='wcl-event']",
    ],
  }),
  createContract({
    key: SELECTOR_CONTRACT_KEYS.MATCH_DETAIL,
    scope: SELECTOR_HEALTH_SCOPES.MATCH_DETAIL,
    intent: {
      route: "/match/{match-id}/",
      page: "match detail summary page",
      description: "Ensure match detail payload fields can be extracted.",
    },
    selectors: [
      ".duelParticipant__startTime",
      ".fixedHeaderDuel__detailStatus",
      "div[data-testid='wcl-summaryMatchInformation'] > div",
    ],
  }),
]);

const CONTRACTS_BY_KEY = new Map(
  CRITICAL_SELECTOR_CONTRACTS.map((contract) => [contract.key, contract])
);

export const listCriticalSelectorContracts = () => CRITICAL_SELECTOR_CONTRACTS;

export const getCriticalSelectorContract = (contractKey) => {
  const contract = CONTRACTS_BY_KEY.get(contractKey);
  if (!contract) {
    throw new Error(`Unknown selector contract key: ${contractKey}`);
  }

  return contract;
};

export const getCriticalSelectorContractsByScope = (scope) =>
  CRITICAL_SELECTOR_CONTRACTS.filter((contract) => contract.scope === scope);

export const isCriticalSelectorKey = (contractKey) =>
  CRITICAL_SELECTOR_KEYS.includes(contractKey);

export {
  SELECTOR_CONTRACT_KEYS,
  SELECTOR_HEALTH_SCOPES,
  CRITICAL_SELECTOR_KEYS,
} from "./keys.js";

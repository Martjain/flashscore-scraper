import { BASE_URL, TIMEOUT } from "../../../constants/index.js";
import { openPageAndNavigate } from "../../index.js";
import {
  SELECTOR_CONTRACT_KEYS,
  getCriticalSelectorContract,
} from "../../../selector-health/contracts/index.js";
import { resolveSelector } from "../../../selector-health/probe/resolveSelector.js";
import { collectProbeDiagnostics } from "../../../selector-health/probe/collectProbeDiagnostics.js";

const LEAGUES_CONTRACT = getCriticalSelectorContract(
  SELECTOR_CONTRACT_KEYS.LEAGUES
);

const attachSelectorDiagnostics = (value, diagnostics) => {
  Object.defineProperty(value, "selectorDiagnostics", {
    value: diagnostics,
    enumerable: false,
    configurable: true,
    writable: false,
  });
  return value;
};

export const getListOfLeagues = async (context, countryId) => {
  const countrySlug = normalizeCountrySlug(countryId);
  const page = await openPageAndNavigate(
    context,
    `${BASE_URL}/soccer/${countrySlug}/`
  );
  const resolution = await resolveSelector(page, LEAGUES_CONTRACT, {
    timeoutMs: TIMEOUT,
  });
  const diagnostics = [collectProbeDiagnostics(resolution)];

  if (!resolution.ok) {
    await page.close();
    return attachSelectorDiagnostics([], diagnostics);
  }

  const listOfLeagues = await page.evaluate(({ countrySlug, selector }) => {
    const toSegments = (href) => {
      try {
        return new URL(href, window.location.origin).pathname
          .split("/")
          .filter(Boolean);
      } catch {
        return [];
      }
    };

    const candidates = Array.from(document.querySelectorAll(selector));
    const uniqueLeagues = new Map();

    candidates.forEach((element) => {
      const segments = toSegments(element.href);
      if (segments[0] !== "soccer" || segments[1] !== countrySlug) return;
      if (segments.length < 3) return;

      const leagueSlug = segments[2];
      const name = element.textContent?.trim().replace(/\s+/g, " ");
      if (!leagueSlug || !name) return;

      const url = `${window.location.origin}/soccer/${countrySlug}/${leagueSlug}/`;
      uniqueLeagues.set(url, { name, url });
    });

    return Array.from(uniqueLeagues.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, { countrySlug, selector: resolution.matchedSelector });

  await page.close();
  return attachSelectorDiagnostics(listOfLeagues, diagnostics);
};

const normalizeCountrySlug = (countryId = "") =>
  countryId
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");

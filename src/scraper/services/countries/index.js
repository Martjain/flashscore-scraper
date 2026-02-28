import { BASE_URL, TIMEOUT } from "../../../constants/index.js";
import { openPageAndNavigate } from "../../index.js";
import {
  SELECTOR_CONTRACT_KEYS,
  getCriticalSelectorContract,
} from "../../../selector-health/contracts/index.js";
import { resolveSelector } from "../../../selector-health/probe/resolveSelector.js";
import { collectProbeDiagnostics } from "../../../selector-health/probe/collectProbeDiagnostics.js";

const COUNTRY_CONTRACT = getCriticalSelectorContract(
  SELECTOR_CONTRACT_KEYS.COUNTRIES
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

export const getListOfCountries = async (context) => {
  const page = await openPageAndNavigate(context, `${BASE_URL}/soccer/`);
  const resolution = await resolveSelector(page, COUNTRY_CONTRACT, {
    timeoutMs: TIMEOUT,
  });
  const diagnostics = [collectProbeDiagnostics(resolution)];

  if (!resolution.ok) {
    await page.close();
    return attachSelectorDiagnostics([], diagnostics);
  }

  const listOfCountries = await page.evaluate((selector) => {
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
    const uniqueCountries = new Map();

    candidates.forEach((element) => {
      const segments = toSegments(element.href);
      if (segments[0] !== "soccer" || segments.length !== 2) return;

      const name = element.textContent?.trim().replace(/\s+/g, " ");
      const countrySlug = segments[1];
      if (!name || !countrySlug) return;

      uniqueCountries.set(countrySlug, {
        name,
        id: countrySlug,
        url: `${window.location.origin}/soccer/${countrySlug}/`,
      });
    });

    return Array.from(uniqueCountries.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, resolution.matchedSelector);

  await page.close();
  return attachSelectorDiagnostics(listOfCountries, diagnostics);
};

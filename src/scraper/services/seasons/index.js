import { TIMEOUT } from "../../../constants/index.js";
import { openPageAndNavigate } from "../../index.js";
import {
  SELECTOR_CONTRACT_KEYS,
  getCriticalSelectorContract,
} from "../../../selector-health/contracts/index.js";
import { resolveSelector } from "../../../selector-health/probe/resolveSelector.js";
import { collectProbeDiagnostics } from "../../../selector-health/probe/collectProbeDiagnostics.js";

const SEASONS_CONTRACT = getCriticalSelectorContract(
  SELECTOR_CONTRACT_KEYS.SEASONS
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

export const getListOfSeasons = async (context, leagueUrl) => {
  const normalizedLeagueUrl = leagueUrl?.replace(/\/+$/, "");
  const page = await openPageAndNavigate(context, `${normalizedLeagueUrl}/archive`);
  const resolution = await resolveSelector(page, SEASONS_CONTRACT, {
    timeoutMs: TIMEOUT,
  });
  const diagnostics = [collectProbeDiagnostics(resolution)];

  if (!resolution.ok) {
    await page.close();
    return attachSelectorDiagnostics([], diagnostics);
  }

  const listOfLeagueSeasons = await page.evaluate(({ selector, leagueUrl }) => {
    const toSegments = (href) => {
      try {
        return new URL(href, window.location.origin).pathname
          .split("/")
          .filter(Boolean);
      } catch {
        return [];
      }
    };

    const leagueSegments = toSegments(leagueUrl);
    const sport = leagueSegments[0];
    const countrySlug = leagueSegments[1];
    const leagueSlug = leagueSegments[2];

    const candidates = Array.from(document.querySelectorAll(selector));
    const uniqueSeasons = new Map();

    candidates.forEach((element) => {
      const name = element.textContent?.trim().replace(/\s+/g, " ");
      const segments = toSegments(element.href);
      if (!name || !element.href || segments.length < 3) return;
      if (sport && segments[0] !== sport) return;
      if (countrySlug && segments[1] !== countrySlug) return;

      const seasonLeagueSlug = segments[2];
      if (
        leagueSlug &&
        seasonLeagueSlug &&
        seasonLeagueSlug !== leagueSlug &&
        !seasonLeagueSlug.startsWith(`${leagueSlug}-`)
      ) {
        return;
      }

      uniqueSeasons.set(element.href, { name, url: element.href });
    });

    return Array.from(uniqueSeasons.values());
  }, { selector: resolution.matchedSelector, leagueUrl: normalizedLeagueUrl });

  await page.close();
  return attachSelectorDiagnostics(listOfLeagueSeasons, diagnostics);
};

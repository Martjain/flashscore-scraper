import { TIMEOUT } from "../../../constants/index.js";
import { openPageAndNavigate, waitForSelectorSafe } from "../../index.js";

export const getListOfSeasons = async (context, leagueUrl) => {
  const normalizedLeagueUrl = leagueUrl?.replace(/\/+$/, "");
  const page = await openPageAndNavigate(context, `${normalizedLeagueUrl}/archive`);

  const selectors = [
    "div.archive__season > a",
    "[data-testid*='season'] a[href*='/soccer/']",
    ".archive a[href*='/soccer/']",
    "a[href*='/soccer/']",
  ];
  await waitForSelectorSafe(page, selectors, TIMEOUT);

  const listOfLeagueSeasons = await page.evaluate((selectors) => {
    const toSegments = (href) => {
      try {
        return new URL(href, window.location.origin).pathname
          .split("/")
          .filter(Boolean);
      } catch {
        return [];
      }
    };

    const candidates = selectors.flatMap((selector) =>
      Array.from(document.querySelectorAll(selector))
    );
    const uniqueSeasons = new Map();

    candidates.forEach((element) => {
      const name = element.textContent?.trim().replace(/\s+/g, " ");
      const segments = toSegments(element.href);
      if (!name || segments[0] !== "soccer" || segments.length < 3) return;

      uniqueSeasons.set(element.href, { name, url: element.href });
    });

    return Array.from(uniqueSeasons.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, selectors);

  await page.close();
  return listOfLeagueSeasons;
};

import { TIMEOUT } from "../../../constants/index.js";
import { openPageAndNavigate, waitForSelectorSafe } from "../../index.js";

export const getListOfSeasons = async (context, leagueUrl) => {
  const normalizedLeagueUrl = leagueUrl?.replace(/\/+$/, "");
  const page = await openPageAndNavigate(context, `${normalizedLeagueUrl}/archive`);

  const selectors = [
    ".archiveLatte__season > a.archiveLatte__text--clickable",
    ".archiveLatte__season > a",
    "div.archive__season > a",
    ".archive__row .archive__season a",
  ];
  await waitForSelectorSafe(page, selectors, TIMEOUT);

  const listOfLeagueSeasons = await page.evaluate(({ selectors, leagueUrl }) => {
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

    const candidates = selectors.flatMap((selector) =>
      Array.from(document.querySelectorAll(selector))
    );
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
  }, { selectors, leagueUrl: normalizedLeagueUrl });

  await page.close();
  return listOfLeagueSeasons;
};

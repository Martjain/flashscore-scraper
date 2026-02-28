import { BASE_URL, TIMEOUT } from "../../../constants/index.js";
import { openPageAndNavigate, waitForSelectorSafe } from "../../index.js";

export const getListOfLeagues = async (context, countryId) => {
  const countrySlug = normalizeCountrySlug(countryId);
  const page = await openPageAndNavigate(
    context,
    `${BASE_URL}/football/${countrySlug}/`
  );

  const selectors = [
    `#category-left-menu a[href*='/football/${countrySlug}/']`,
    `[class*='lmenu'] a[href*='/football/${countrySlug}/']`,
    `[data-testid*='left'] a[href*='/football/${countrySlug}/']`,
    `a[href*='/football/${countrySlug}/']`,
  ];
  await waitForSelectorSafe(page, selectors, TIMEOUT);

  const listOfLeagues = await page.evaluate((countrySlug, selectors) => {
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
    const uniqueLeagues = new Map();

    candidates.forEach((element) => {
      const segments = toSegments(element.href);
      if (segments[0] !== "football" || segments[1] !== countrySlug) return;
      if (segments.length < 3) return;

      const leagueSlug = segments[2];
      const name = element.textContent?.trim().replace(/\s+/g, " ");
      if (!leagueSlug || !name) return;

      const url = `${window.location.origin}/football/${countrySlug}/${leagueSlug}/`;
      uniqueLeagues.set(url, { name, url });
    });

    return Array.from(uniqueLeagues.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, countrySlug, selectors);

  await page.close();
  return listOfLeagues;
};

const normalizeCountrySlug = (countryId = "") =>
  countryId
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");

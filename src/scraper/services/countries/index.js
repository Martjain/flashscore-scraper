import { BASE_URL, TIMEOUT } from "../../../constants/index.js";
import { openPageAndNavigate, waitForSelectorSafe } from "../../index.js";

const COUNTRY_SELECTORS = [
  "#category-left-menu a[href*='/football/']",
  "[class*='lmenu'] a[href*='/football/']",
  "[data-testid*='left'] a[href*='/football/']",
  "a[href*='/football/']",
];

export const getListOfCountries = async (context) => {
  const page = await openPageAndNavigate(context, `${BASE_URL}/football/`);
  await waitForSelectorSafe(page, COUNTRY_SELECTORS, TIMEOUT);

  const listOfCountries = await page.evaluate((selectors) => {
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
    const uniqueCountries = new Map();

    candidates.forEach((element) => {
      const segments = toSegments(element.href);
      if (segments[0] !== "football" || segments.length !== 2) return;

      const name = element.textContent?.trim().replace(/\s+/g, " ");
      const countrySlug = segments[1];
      if (!name || !countrySlug) return;

      uniqueCountries.set(countrySlug, {
        name,
        id: countrySlug,
        url: `${window.location.origin}/football/${countrySlug}/`,
      });
    });

    return Array.from(uniqueCountries.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, COUNTRY_SELECTORS);

  await page.close();
  return listOfCountries;
};

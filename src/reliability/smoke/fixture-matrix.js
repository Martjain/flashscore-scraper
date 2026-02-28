import { BASE_URL } from "../../constants/index.js";

export const DEFAULT_SMOKE_SAMPLE = 3;
export const DEFAULT_MAX_MATCHES = 1;
export const DEFAULT_FIXTURE_TIMEOUT_MS = 90000;

const SMOKE_FIXTURES = Object.freeze([
  {
    fixtureId: "argentina-liga-profesional",
    label: "Argentina Liga Profesional",
    countryId: "argentina",
    leagueSlugHint: "liga-profesional",
    seasonHint: "2026",
    matchHint: "recent-results",
  },
  {
    fixtureId: "australia-a-league",
    label: "Australia A-League",
    countryId: "australia",
    leagueSlugHint: "a-league",
    seasonHint: "2025",
    matchHint: "recent-results",
  },
  {
    fixtureId: "austria-bundesliga",
    label: "Austria Bundesliga",
    countryId: "austria",
    leagueSlugHint: "bundesliga",
    seasonHint: "2025",
    matchHint: "recent-results",
  },
]);

const normalizePositiveInteger = (value, fallback) =>
  Number.isInteger(value) && value > 0 ? value : fallback;

const normalizeFixtureId = (value = "") => value.toString().trim().toLowerCase();

export const getSmokeFixtureMatrix = () => SMOKE_FIXTURES.map((fixture) => ({ ...fixture }));

export const getSmokeFixtureIds = () =>
  getSmokeFixtureMatrix().map((fixture) => normalizeFixtureId(fixture.fixtureId));

export const getFixtureById = (fixtureId) =>
  getSmokeFixtureMatrix().find(
    (fixture) => fixture.fixtureId === normalizeFixtureId(fixtureId)
  ) ?? null;

export const selectSmokeFixtures = ({ sample, fixtureIds = [] } = {}) => {
  const matrix = getSmokeFixtureMatrix();
  const safeSample = normalizePositiveInteger(sample, DEFAULT_SMOKE_SAMPLE);

  if (!Array.isArray(fixtureIds) || fixtureIds.length === 0) {
    return matrix.slice(0, safeSample);
  }

  const selected = fixtureIds
    .map((fixtureId) => getFixtureById(fixtureId))
    .filter(Boolean);

  return selected.slice(0, safeSample);
};

export const buildLeagueUrl = (countryId, leagueSlug) =>
  `${BASE_URL}/soccer/${countryId}/${leagueSlug}/`;

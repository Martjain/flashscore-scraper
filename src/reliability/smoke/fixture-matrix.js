import { BASE_URL } from "../../constants/index.js";

export const DEFAULT_SMOKE_SAMPLE = 3;
export const DEFAULT_MAX_MATCHES = 1;
export const DEFAULT_FIXTURE_TIMEOUT_MS = 90000;
export const DEFAULT_SMOKE_MATRIX_MODE = "default";

const DEFAULT_ROTATION_KEY = "default";
const SUPPORTED_MATRIX_MODES = Object.freeze(["default", "extended"]);

const SMOKE_FIXTURES = Object.freeze([
  {
    fixtureId: "argentina-liga-profesional",
    label: "Argentina Liga Profesional",
    regionId: "americas",
    countryId: "argentina",
    leagueSlugHint: "liga-profesional",
    seasonHint: "2026",
    matchHint: "recent-results",
  },
  {
    fixtureId: "australia-a-league",
    label: "Australia A-League",
    regionId: "apac",
    countryId: "australia",
    leagueSlugHint: "a-league",
    seasonHint: "2025",
    matchHint: "recent-results",
  },
  {
    fixtureId: "austria-bundesliga",
    label: "Austria Bundesliga",
    regionId: "europe",
    countryId: "austria",
    leagueSlugHint: "bundesliga",
    seasonHint: "2025",
    matchHint: "recent-results",
  },
]);

const normalizePositiveInteger = (value, fallback) =>
  Number.isInteger(value) && value > 0 ? value : fallback;

const normalizeFixtureId = (value = "") => value.toString().trim().toLowerCase();
const normalizeMatrixMode = (value = DEFAULT_SMOKE_MATRIX_MODE) => {
  const normalized = value.toString().trim().toLowerCase();
  if (SUPPORTED_MATRIX_MODES.includes(normalized)) {
    return normalized;
  }
  return DEFAULT_SMOKE_MATRIX_MODE;
};
const normalizeRotationKey = (value = DEFAULT_ROTATION_KEY) => {
  const normalized = value.toString().trim();
  return normalized || DEFAULT_ROTATION_KEY;
};

const computeStableSlot = (input, modulo) => {
  if (!Number.isInteger(modulo) || modulo <= 0) return 0;

  const value = input.toString();
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash % modulo;
};

const buildRegionIndex = (matrix) => {
  const regionMap = new Map();
  for (const fixture of matrix) {
    const regionId = fixture.regionId || "global";
    if (!regionMap.has(regionId)) {
      regionMap.set(regionId, []);
    }
    regionMap.get(regionId).push(fixture);
  }
  return regionMap;
};

export const getSmokeFixtureMatrix = () => SMOKE_FIXTURES.map((fixture) => ({ ...fixture }));

export const getSmokeFixtureIds = () =>
  getSmokeFixtureMatrix().map((fixture) => normalizeFixtureId(fixture.fixtureId));

export const getFixtureById = (fixtureId) =>
  getSmokeFixtureMatrix().find(
    (fixture) => fixture.fixtureId === normalizeFixtureId(fixtureId)
  ) ?? null;

export const selectSmokeFixtureSelection = ({
  sample,
  fixtureIds = [],
  matrixMode = DEFAULT_SMOKE_MATRIX_MODE,
  rotationKey = DEFAULT_ROTATION_KEY,
} = {}) => {
  const matrix = getSmokeFixtureMatrix();
  const safeSample = normalizePositiveInteger(sample, DEFAULT_SMOKE_SAMPLE);
  const requestedMode = normalizeMatrixMode(matrixMode);
  const normalizedRotationKey = normalizeRotationKey(rotationKey);

  if (Array.isArray(fixtureIds) && fixtureIds.length > 0) {
    const selected = fixtureIds
      .map((fixtureId) => getFixtureById(fixtureId))
      .filter(Boolean)
      .slice(0, safeSample);
    return {
      fixtures: selected,
      selection: {
        mode: "default",
        requestedMode,
        rotationKey: normalizedRotationKey,
        selectedRegion: null,
        regionToken: null,
        fixtureIds: selected.map((fixture) => fixture.fixtureId),
        reason: "explicit_fixture_filter",
      },
    };
  }

  if (requestedMode !== "extended") {
    const selected = matrix.slice(0, safeSample);
    return {
      fixtures: selected,
      selection: {
        mode: "default",
        requestedMode,
        rotationKey: normalizedRotationKey,
        selectedRegion: null,
        regionToken: null,
        fixtureIds: selected.map((fixture) => fixture.fixtureId),
        reason: "default_bounded_sample",
      },
    };
  }

  const regionMap = buildRegionIndex(matrix);
  const regionIds = [...regionMap.keys()];
  const slot = computeStableSlot(normalizedRotationKey, regionIds.length);
  const rotatedRegions = [...regionIds.slice(slot), ...regionIds.slice(0, slot)];
  const orderedFixtures = rotatedRegions.flatMap((regionId) => regionMap.get(regionId));
  const selected = orderedFixtures.slice(0, safeSample);
  const selectedRegion = rotatedRegions[0] ?? null;
  return {
    fixtures: selected,
    selection: {
      mode: "extended",
      requestedMode,
      rotationKey: normalizedRotationKey,
      selectedRegion,
      regionToken:
        selectedRegion && regionIds.length > 0
          ? `${selectedRegion}:${slot + 1}/${regionIds.length}`
          : null,
      fixtureIds: selected.map((fixture) => fixture.fixtureId),
      reason: selected.length > 0 ? "extended_region_rotation" : "no_matching_fixtures",
    },
  };
};

export const selectSmokeFixtures = (options = {}) =>
  selectSmokeFixtureSelection(options).fixtures;

export const buildLeagueUrl = (countryId, leagueSlug) =>
  `${BASE_URL}/soccer/${countryId}/${leagueSlug}/`;

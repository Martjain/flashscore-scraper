import fs from "node:fs/promises";
import path from "node:path";

export const DEFAULT_RERUN_ARTIFACT_PATH = ".planning/artifacts/smoke/latest.json";

const SYNTHETIC_FAILURE_IDS = new Set(["run", "schema-gate", "selection"]);

const normalizeFixtureId = (value = "") => value.toString().trim().toLowerCase();

const buildFailure = (artifactPath, code, message, details = {}) => ({
  ok: false,
  artifactPath,
  fixtureIds: [],
  diagnostics: {
    selectedFixtureIds: [],
    ignoredFixtureIds: [],
    invalidFixtureIds: [],
    ignoredIssueIds: [],
  },
  error: {
    code,
    message,
    ...details,
  },
});

const parseArtifactFile = async (artifactPath) => {
  const resolvedPath = path.resolve(artifactPath || DEFAULT_RERUN_ARTIFACT_PATH);

  if (!artifactPath || !artifactPath.toString().trim()) {
    return buildFailure(
      resolvedPath,
      "artifact_path_missing",
      "Artifact path cannot be empty."
    );
  }

  let raw;
  try {
    raw = await fs.readFile(resolvedPath, "utf8");
  } catch (error) {
    const isNotFound = error?.code === "ENOENT";
    return buildFailure(
      resolvedPath,
      isNotFound ? "artifact_not_found" : "artifact_read_error",
      isNotFound
        ? `Smoke artifact was not found at ${resolvedPath}.`
        : `Unable to read smoke artifact at ${resolvedPath}.`,
      {
        reason: error instanceof Error ? error.message : "unknown_read_error",
      }
    );
  }

  let artifact;
  try {
    artifact = JSON.parse(raw);
  } catch (error) {
    return buildFailure(
      resolvedPath,
      "artifact_invalid_json",
      `Smoke artifact at ${resolvedPath} is not valid JSON.`,
      {
        reason: error instanceof Error ? error.message : "invalid_json",
      }
    );
  }

  if (!artifact || typeof artifact !== "object") {
    return buildFailure(
      resolvedPath,
      "artifact_invalid_shape",
      "Smoke artifact payload must be an object."
    );
  }

  if (!Array.isArray(artifact.fixtures)) {
    return buildFailure(
      resolvedPath,
      "artifact_invalid_shape",
      "Smoke artifact payload must include a fixtures array."
    );
  }

  return {
    ok: true,
    artifactPath: resolvedPath,
    artifact,
  };
};

const buildKnownFixtureSet = (knownFixtureIds = []) =>
  new Set(
    (Array.isArray(knownFixtureIds) ? knownFixtureIds : [])
      .map((fixtureId) => normalizeFixtureId(fixtureId))
      .filter(Boolean)
  );

export const resolveFailedFixtureIdsFromArtifact = async ({
  artifactPath = DEFAULT_RERUN_ARTIFACT_PATH,
  knownFixtureIds = [],
} = {}) => {
  const artifactResult = await parseArtifactFile(artifactPath);
  if (!artifactResult.ok) return artifactResult;

  const { artifact, artifactPath: resolvedPath } = artifactResult;
  const knownFixtureSet = buildKnownFixtureSet(knownFixtureIds);
  const selectedFixtureIds = [];
  const selectedSet = new Set();
  const ignoredFixtureIds = [];
  const invalidFixtureIds = [];
  const ignoredIssueIds = [];

  artifact.fixtures.forEach((fixture, index) => {
    if (!fixture || typeof fixture !== "object") {
      invalidFixtureIds.push({
        fixtureId: null,
        reason: "fixture_entry_invalid",
        index,
      });
      return;
    }

    const fixtureId = normalizeFixtureId(fixture.fixtureId);
    const status = normalizeFixtureId(fixture.status);

    if (!fixtureId) {
      invalidFixtureIds.push({
        fixtureId: null,
        reason: "fixture_id_missing",
        index,
      });
      return;
    }

    if (!status) {
      invalidFixtureIds.push({
        fixtureId,
        reason: "status_missing",
        index,
      });
      return;
    }

    if (SYNTHETIC_FAILURE_IDS.has(fixtureId)) {
      ignoredFixtureIds.push({
        fixtureId,
        reason: "synthetic_failure_id",
      });
      return;
    }

    if (status !== "fail") {
      ignoredFixtureIds.push({
        fixtureId,
        reason: `status_${status}`,
      });
      return;
    }

    if (knownFixtureSet.size > 0 && !knownFixtureSet.has(fixtureId)) {
      invalidFixtureIds.push({
        fixtureId,
        reason: "unknown_fixture_id",
      });
      return;
    }

    if (!selectedSet.has(fixtureId)) {
      selectedFixtureIds.push(fixtureId);
      selectedSet.add(fixtureId);
      return;
    }

    ignoredFixtureIds.push({
      fixtureId,
      reason: "duplicate_fixture_id",
    });
  });

  (Array.isArray(artifact.issues) ? artifact.issues : []).forEach((issue) => {
    const issueId = normalizeFixtureId(issue?.fixtureId);
    if (!issueId) return;

    if (SYNTHETIC_FAILURE_IDS.has(issueId)) {
      ignoredIssueIds.push(issueId);
    }
  });

  return {
    ok: true,
    artifactPath: resolvedPath,
    fixtureIds: selectedFixtureIds,
    diagnostics: {
      selectedFixtureIds,
      ignoredFixtureIds,
      invalidFixtureIds,
      ignoredIssueIds,
      totalFixtures: artifact.fixtures.length,
      failedFixturesSelected: selectedFixtureIds.length,
    },
    error: null,
  };
};

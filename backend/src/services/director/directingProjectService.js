import crypto from "node:crypto";

const DIRECTING_PROJECT_MIN_WEEKS = 4;
const DIRECTING_PROJECT_MAX_WEEKS = 8;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const ensureScriptProductionDefaults = (script) => {
  if (!script.id) {
    script.id = crypto.randomUUID();
  }

  if (!script.status) {
    script.status = "AVAILABLE";
  }

  if (typeof script.assignedDirectorId === "undefined") {
    script.assignedDirectorId = null;
  }

  if (typeof script.assignedDirectorName === "undefined") {
    script.assignedDirectorName = null;
  }

  if (typeof script.directingProjectId === "undefined") {
    script.directingProjectId = null;
  }

  return script;
};

export const ensureScriptsProductionDefaults = (scripts = []) =>
  scripts.map(ensureScriptProductionDefaults);

const getProjectDuration = (director) => {
  const leadership = Number(director.leadership || 50);
  const reliability = Number(director.reliability || 50);
  const averageExecution = (leadership + reliability) / 2;

  if (averageExecution >= 85) return DIRECTING_PROJECT_MIN_WEEKS;
  if (averageExecution >= 70) return 5;
  if (averageExecution >= 55) return 6;

  return DIRECTING_PROJECT_MAX_WEEKS;
};

export const calculateProjectedMovieQuality = ({
  script,
  director,
  qualityPenalty = 0,
}) => {
  const scriptQuality = Number(script?.quality || 50);
  const directorCreativity = Number(director?.creativity || 50);
  const directorLeadership = Number(director?.leadership || 50);
  const directorReputation = Number(director?.reputation || 50);

  return clamp(
    Math.round(
      scriptQuality * 0.5 +
        directorCreativity * 0.25 +
        directorLeadership * 0.15 +
        directorReputation * 0.1 -
        Number(qualityPenalty || 0)
    ),
    1,
    100
  );
};

export const createDirectingProject = ({ director, script, currentWeek }) => {
  const projectId = crypto.randomUUID();
  const startWeek = Number(currentWeek || 1);
  const completionWeek = startWeek + getProjectDuration(director);
  const genre = script.genres?.[0] || "Drama";

  return {
    id: projectId,
    directorId: director.id,
    directorName: director.name,
    scriptId: script.id,
    scriptTitle: script.title,
    scriptQuality: script.quality,
    movieName: script.title,
    genre,
    startWeek,
    completionWeek,
    progress: 0,
    qualityPenalty: 0,
    replacementRequired: false,
    status: "DIRECTING",
  };
};

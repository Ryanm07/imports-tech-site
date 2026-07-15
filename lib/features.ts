export function projectsEnabled() {
  return process.env.PROJECTS_ENABLED === "true";
}

export function introEnabled(value = process.env.INTRO_ENABLED) {
  return value !== "false";
}

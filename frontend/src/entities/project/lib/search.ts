import type { Project } from '../model/types';

// Free-text search over already-loaded (backend-scoped) projects. Empty query returns
// no results so callers only show matches while the user is actively typing.
export function searchProjects(projects: Project[], query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return [];
  }

  return projects.filter((project) => [
    project.name,
    project.description,
    project.address,
    project.status,
    project.priority,
  ].some((value) => value.toLowerCase().includes(normalizedQuery)));
}

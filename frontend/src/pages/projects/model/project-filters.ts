import type { Project, ProjectPriority, ProjectStatus } from '../../../entities/project';

export type FilterOption = {
  value: string;
  label: string;
};

export type ProjectFilterValues = {
  search: string;
  status: string;
  priority: string;
  client: string;
  team: string;
};

export const statusOptions: Array<{ value: ProjectStatus; label: string }> = [
  { value: 'pending', label: 'Pending' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'partially completed', label: 'Partially completed' },
  { value: 'completed', label: 'Completed' },
];

export const priorityOptions: Array<{ value: ProjectPriority; label: string }> = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export function filterProjects(
  projects: Project[],
  filters: ProjectFilterValues,
  canFilterByClient: boolean,
  canFilterByTeam: boolean,
) {
  const normalizedSearch = filters.search.trim().toLowerCase();

  return projects.filter((project) => {
    const matchesSearch = !normalizedSearch || [
      project.name,
      project.address,
      project.description,
    ].some((value) => value.toLowerCase().includes(normalizedSearch));
    const matchesStatus = !filters.status || project.status === filters.status;
    const matchesPriority = !filters.priority || project.priority === filters.priority;
    const matchesClient = !canFilterByClient || !filters.client || String(project.client) === filters.client;
    const matchesTeam = !canFilterByTeam || !filters.team || project.assigned_team.includes(Number(filters.team));

    return matchesSearch && matchesStatus && matchesPriority && matchesClient && matchesTeam;
  });
}

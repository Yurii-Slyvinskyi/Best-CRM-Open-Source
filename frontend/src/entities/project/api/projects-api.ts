import { apiClient } from '../../../shared/api';
import type { Project, ProjectFormPayload, ProjectStatus } from '../model/types';

export function getProjects(): Promise<Project[]> {
  return apiClient<Project[]>('/api/projects/');
}

export function getProject(projectId: string | number): Promise<Project> {
  return apiClient<Project>(`/api/projects/${projectId}/`);
}

export function createProject(payload: ProjectFormPayload): Promise<Project> {
  return apiClient<Project>('/api/projects/', {
    method: 'POST',
    body: payload,
  });
}

export function updateProject(projectId: string | number, payload: ProjectFormPayload): Promise<Project> {
  return apiClient<Project>(`/api/projects/${projectId}/`, {
    method: 'PATCH',
    body: payload,
  });
}

export function updateProjectStatus(projectId: string | number, status: ProjectStatus): Promise<Project> {
  return apiClient<Project>(`/api/projects/${projectId}/`, {
    method: 'PATCH',
    body: { status },
  });
}

export function uploadProjectBlueprint(projectId: string | number, file: File): Promise<Project> {
  const formData = new FormData();
  formData.append('blueprint', file);

  return apiClient<Project>(`/api/projects/${projectId}/`, {
    method: 'PATCH',
    body: formData,
  });
}

export function deleteProjectBlueprint(projectId: string | number): Promise<void> {
  return apiClient<void>(`/api/projects/${projectId}/blueprint/`, {
    method: 'DELETE',
  });
}

export function deleteProject(projectId: string | number): Promise<void> {
  return apiClient<void>(`/api/projects/${projectId}/`, {
    method: 'DELETE',
  });
}

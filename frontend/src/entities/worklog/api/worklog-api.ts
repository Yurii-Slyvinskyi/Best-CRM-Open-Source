import { apiClient } from '../../../shared/api';
import type { Worklog, WorklogPayload, WorklogUpdatePayload } from '../model/types';

export function getWorklogs(): Promise<Worklog[]> {
  return apiClient<Worklog[]>('/api/worklogs/');
}

export function getWorklogsByProject(projectId: string | number): Promise<Worklog[]> {
  return apiClient<Worklog[]>(`/api/worklogs/?project=${encodeURIComponent(projectId)}`);
}

export function getWorklog(worklogId: string | number): Promise<Worklog> {
  return apiClient<Worklog>(`/api/worklogs/${worklogId}/`);
}

export function createWorklog(payload: WorklogPayload): Promise<Worklog> {
  return apiClient<Worklog>('/api/worklogs/', {
    method: 'POST',
    body: payload,
  });
}

export function updateWorklog(
  worklogId: string | number,
  payload: WorklogUpdatePayload,
): Promise<Worklog> {
  return apiClient<Worklog>(`/api/worklogs/${worklogId}/`, {
    method: 'PATCH',
    body: payload,
  });
}

export function deleteWorklog(worklogId: string | number): Promise<void> {
  return apiClient<void>(`/api/worklogs/${worklogId}/`, {
    method: 'DELETE',
  });
}

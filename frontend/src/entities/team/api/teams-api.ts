import { apiClient } from '../../../shared/api';
import type { Team, TeamPayload, TeamUpdatePayload } from '../model/types';

export function getTeams(): Promise<Team[]> {
  return apiClient<Team[]>('/api/teams/');
}

export function getTeam(teamId: string | number): Promise<Team> {
  return apiClient<Team>(`/api/teams/${teamId}/`);
}

export function createTeam(payload: TeamPayload): Promise<Team> {
  return apiClient<Team>('/api/teams/', {
    method: 'POST',
    body: payload,
  });
}

export function updateTeam(teamId: string | number, payload: TeamUpdatePayload): Promise<Team> {
  return apiClient<Team>(`/api/teams/${teamId}/`, {
    method: 'PATCH',
    body: payload,
  });
}

export function deleteTeam(teamId: string | number): Promise<void> {
  return apiClient<void>(`/api/teams/${teamId}/`, {
    method: 'DELETE',
  });
}

import { apiClient } from '../../../shared/api';
import type { AuthProfile, LoginCredentials, LoginResponse, LogoutPayload } from '../model/types';

export function loginUser(credentials: LoginCredentials) {
  return apiClient<LoginResponse>('/api/users/login/', {
    method: 'POST',
    body: credentials,
    auth: false,
  });
}

export function getAuthProfile() {
  return apiClient<AuthProfile>('/api/users/profile/');
}

export function logoutUser(payload: LogoutPayload) {
  return apiClient('/api/users/logout/', {
    method: 'POST',
    body: payload,
  });
}

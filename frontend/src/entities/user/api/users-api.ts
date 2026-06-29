import { apiClient } from '../../../shared/api';
import type {
  RegisteredUser,
  RegisterUserPayload,
  UpdateUserPayload,
  UserProfile,
  UserProfileUpdatePayload,
} from '../model/types';

export function getCurrentUserProfile(): Promise<UserProfile> {
  return apiClient<UserProfile>('/api/users/profile/');
}

export function updateCurrentUserProfile(payload: UserProfileUpdatePayload): Promise<UserProfile> {
  return apiClient<UserProfile>('/api/users/profile/', {
    method: 'PATCH',
    body: payload,
  });
}

export function getUsers(): Promise<UserProfile[]> {
  return apiClient<UserProfile[]>('/api/users/list/');
}

export function registerUser(payload: RegisterUserPayload): Promise<RegisteredUser> {
  return apiClient<RegisteredUser>('/api/users/register/', {
    method: 'POST',
    body: payload,
  });
}

export function updateUser(
  userId: string | number,
  payload: UpdateUserPayload,
): Promise<UserProfile> {
  return apiClient<UserProfile>(`/api/users/manage/${userId}/`, {
    method: 'PATCH',
    body: payload,
  });
}

export function deleteUser(userId: string | number): Promise<void> {
  return apiClient<void>(`/api/users/manage/${userId}/`, {
    method: 'DELETE',
  });
}

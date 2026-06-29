import type { UserProfile } from '../../user';

export type LoginCredentials = {
  username: string;
  password: string;
};

export type LoginResponse = {
  access: string;
  refresh: string;
};

export type LogoutPayload = {
  refresh: string;
};

export type AuthProfile = UserProfile;

import { API_BASE_URL } from '../../../shared/api';

export function resolveMediaUrl(value: string | null) {
  if (!value) {
    return null;
  }

  const mediaPath = value.trim();

  if (!mediaPath) {
    return null;
  }

  if (/^https?:\/\//i.test(mediaPath)) {
    return mediaPath;
  }

  return `${API_BASE_URL.replace(/\/$/, '')}/${mediaPath.replace(/^\//, '')}`;
}

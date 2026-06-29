import { ApiError } from './api-client';

// Extracts a human-friendly message from an unknown error thrown by the API client.
// Prefers a field-level message from `ApiError.details` (e.g. DRF validation errors),
// then the ApiError message, and finally a caller-provided or generic fallback.
export function getApiErrorMessage(err: unknown, fallback = 'Something went wrong') {
  if (err instanceof ApiError) {
    if (err.details && typeof err.details === 'object') {
      const entries = Object.entries(err.details);
      const firstError = entries.find(([, value]) => value);

      if (firstError) {
        const [field, value] = firstError;

        if (Array.isArray(value)) {
          return `${field}: ${value.join(' ')}`;
        }

        if (typeof value === 'string') {
          return `${field}: ${value}`;
        }
      }
    }

    return err.message;
  }

  return fallback;
}

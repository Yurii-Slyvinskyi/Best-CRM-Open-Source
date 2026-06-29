import { describe, expect, it } from 'vitest';
import { ApiError } from './api-client';
import { getApiErrorMessage } from './get-api-error-message';

describe('getApiErrorMessage', () => {
  it('returns the ApiError message when details do not contain field errors', () => {
    const error = new ApiError('Unable to save record.', 400, null);

    expect(getApiErrorMessage(error)).toBe('Unable to save record.');
  });

  it('formats DRF array field errors from details', () => {
    const error = new ApiError('Validation failed.', 400, {
      amount: ['Must be positive.', 'Must be less than 1000.'],
    });

    expect(getApiErrorMessage(error)).toBe('amount: Must be positive. Must be less than 1000.');
  });

  it('formats string field errors from details', () => {
    const error = new ApiError('Validation failed.', 400, {
      detail: 'Invalid credentials.',
    });

    expect(getApiErrorMessage(error)).toBe('detail: Invalid credentials.');
  });

  it('falls back to the ApiError message for unsupported detail shapes', () => {
    const error = new ApiError('Validation failed.', 400, {
      non_field_errors: { message: 'Unsupported shape.' },
    });

    expect(getApiErrorMessage(error)).toBe('Validation failed.');
  });

  it('returns the fallback for unknown errors', () => {
    expect(getApiErrorMessage(new Error('Unknown'), 'Please try again.')).toBe('Please try again.');
  });
});

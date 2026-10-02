import { describe, expect, it } from 'vitest';
import { createApiError, isApiError } from '../errors.ts';

describe('API Errors Module', () => {
  describe('createApiError message fallback chain', () => {
    it('uses detail when present', () => {
      const err = createApiError({
        status: 400,
        title: 'Bad Request',
        detail: 'Description cannot be empty',
      });
      expect(err.message).toBe('Description cannot be empty');
      expect(err.stack).toBeDefined();
    });

    it('falls back to title when detail is omitted', () => {
      const err = createApiError({ status: 404, title: 'Transaction not found' });
      expect(err.message).toBe('Transaction not found');
    });

    it('falls back to generic status message when detail and title are omitted', () => {
      const err = createApiError({ status: 500 });
      expect(err.message).toBe('API request failed with status 500');
    });
  });

  describe('isApiError type guard', () => {
    it('returns true for objects adhering to ApiError contract', () => {
      const err = createApiError({ status: 401, title: 'Unauthorized' });
      expect(isApiError(err)).toBe(true);
    });

    it('returns false for generic errors and primitives', () => {
      expect(isApiError(new Error('Generic failure'))).toBe(false);
      expect(isApiError({ name: 'Error', status: 500 })).toBe(false);
      expect(isApiError({ name: 'ApiError', status: 'not-a-number' })).toBe(false);
      expect(isApiError(null)).toBe(false);
      expect(isApiError(undefined)).toBe(false);
      expect(isApiError('error')).toBe(false);
      expect(isApiError(500)).toBe(false);
    });
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getStorageItem, removeStorageItem, setStorageItem } from '../storage.ts';

describe('Storage Utility Module', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('getStorageItem', () => {
    it('returns the stored string value when present in localStorage', () => {
      localStorage.setItem('test_key', 'test_value');
      expect(getStorageItem('test_key')).toBe('test_value');
    });

    it('returns null when the key does not exist', () => {
      expect(getStorageItem('non_existent')).toBeNull();
    });

    it('catches localStorage exceptions, logs a warning, and returns null', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new DOMException('Access denied', 'SecurityError');
      });

      const result = getStorageItem('restricted_key');

      expect(result).toBeNull();
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to read "restricted_key" from localStorage'),
        expect.any(DOMException),
      );
    });
  });

  describe('setStorageItem', () => {
    it('stores the key-value pair and returns true on success', () => {
      const success = setStorageItem('sample_key', 'sample_val');

      expect(success).toBe(true);
      expect(localStorage.getItem('sample_key')).toBe('sample_val');
    });

    it('catches localStorage exceptions, logs a warning, and returns false', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('Quota exceeded', 'QuotaExceededError');
      });

      const success = setStorageItem('fail_key', 'large_payload');

      expect(success).toBe(false);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to write "fail_key" to localStorage'),
        expect.any(DOMException),
      );
    });
  });

  describe('removeStorageItem', () => {
    it('removes the specified key from localStorage', () => {
      localStorage.setItem('key_to_delete', 'value');
      removeStorageItem('key_to_delete');
      expect(localStorage.getItem('key_to_delete')).toBeNull();
    });

    it('catches localStorage exceptions and logs a warning', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new DOMException('Access denied', 'SecurityError');
      });

      removeStorageItem('restricted_key');

      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to remove "restricted_key" from localStorage'),
        expect.any(DOMException),
      );
    });
  });
});

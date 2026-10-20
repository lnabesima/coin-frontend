/**
 * Safely retrieves a string value from localStorage, guarding against
 * security restrictions, sandboxed iframes, or disabled storage environments.
 */
export function getStorageItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (err) {
    console.warn(`[storage] Failed to read "${key}" from localStorage:`, err);
    return null;
  }
}

/**
 * Safely persists a string value to localStorage, guarding against
 * storage quotas or restricted environment errors.
 *
 * @returns true if the item was successfully written; false otherwise.
 */
export function setStorageItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    console.warn(`[storage] Failed to write "${key}" to localStorage:`, err);
    return false;
  }
}

/**
 * Safely removes an item from localStorage.
 */
export function removeStorageItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.warn(`[storage] Failed to remove "${key}" from localStorage:`, err);
  }
}

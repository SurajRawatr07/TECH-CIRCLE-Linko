/**
 * Linko Client Storage Adapter
 * Centralized, safe wrapper around window.localStorage with error handling and serialization.
 */

const STORAGE_PREFIX = 'lp_';

export const storageAdapter = {
  getItem<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + key);
      if (raw === null || raw === undefined) return defaultValue;
      return JSON.parse(raw) as T;
    } catch (err) {
      console.warn(`[storageAdapter] Failed to parse key "${key}":`, err);
      return defaultValue;
    }
  },

  setItem<T>(key: string, value: T): boolean {
    if (typeof window === 'undefined') return false;
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.warn(`[storageAdapter] Failed to write key "${key}":`, err);
      return false;
    }
  },

  removeItem(key: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(STORAGE_PREFIX + key);
    } catch (err) {
      console.warn(`[storageAdapter] Failed to remove key "${key}":`, err);
    }
  },

  clearAllLinkoKeys(): void {
    if (typeof window === 'undefined') return;
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith(STORAGE_PREFIX) || k.startsWith('linkpulse_') || k.startsWith('linko_'))) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (err) {
      console.warn('[storageAdapter] Failed to clear keys:', err);
    }
  },

  clearAllLinkPulseKeys(): void {
    this.clearAllLinkoKeys();
  },
};

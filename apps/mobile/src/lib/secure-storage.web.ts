/**
 * expo-secure-store has no web implementation; fall back to localStorage.
 * Web is a development convenience here — the real web client is apps/web.
 */
export const secureStorage = {
  get: async (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set: async (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch {}
  },
  remove: async (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch {}
  },
};


/**
 * Safe storage utilities to prevent errors when localStorage/sessionStorage is unavailable
 */

export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      // Ignore
    }
  },
  removeItem: (key: string): void => {
    try {
      window.localStorage.removeItem(key);
    } catch (e) {
      // Ignore
    }
  }
};

export const safeSessionStorage = {
  getItem: (key: string): string | null => {
    try {
      return window.sessionStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      window.sessionStorage.setItem(key, value);
    } catch (e) {
      // Ignore
    }
  },
  removeItem: (key: string): void => {
    try {
      window.sessionStorage.removeItem(key);
    } catch (e) {
      // Ignore
    }
  }
};

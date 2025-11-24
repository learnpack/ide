import { sanitizeForLocalStorage } from "../utils/piiSanitizer";

export const LocalStorage = {
  get: (key: string, asJson = true) => {
    if (!localStorage) {
      return null;
    }
    const value = localStorage.getItem(key);

    if (!value) {
      return null;
    }
    const parsed = asJson ? JSON.parse(value) : value;
    return parsed;
  },
  set: (key: string, value: any) => {
    if (localStorage) {
      // Sanitize PII before storing
      const sanitized = typeof value === 'object' && value !== null
        ? sanitizeForLocalStorage(key, value)
        : value;
      localStorage.setItem(key, JSON.stringify(sanitized));
    }
  },
  remove: (key: string) => {
    localStorage.removeItem(key);
  },
  clear: () => {
    localStorage.clear();
  },
  getEditorTabs: (slug: string) => {
    return LocalStorage.get(`editorTabs_${slug}`) || [];
  },
  setEditorTabs: (slug: string, tabs: any) => {
    LocalStorage.set(`editorTabs_${slug}`, tabs);
  },
};

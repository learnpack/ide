export const LocalStorage = {
    get: (key: string) => {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
    },
    set: (key: string, value: any) => {
        localStorage.setItem(key, JSON.stringify(value));
    },
    remove: (key: string) => {
        localStorage.removeItem(key);
    },
    clear: () => {
        localStorage.clear();
    }
};

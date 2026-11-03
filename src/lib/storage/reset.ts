const APP_STORAGE_PREFIX = "ap:";

export function isAppStorageKey(key: string): boolean {
  return key.startsWith(APP_STORAGE_PREFIX);
}

export function clearAllData(): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && isAppStorageKey(key)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
}

export type ThemePreference = "auto" | "light" | "dark";

export const THEME_STORAGE_KEY = "ap:theme";

export function loadThemePreference(): ThemePreference {
  const raw = localStorage.getItem(THEME_STORAGE_KEY);
  return raw === "light" || raw === "dark" ? raw : "auto";
}

export function saveThemePreference(preference: ThemePreference): void {
  if (preference === "auto") {
    localStorage.removeItem(THEME_STORAGE_KEY);
  } else {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  }
  applyThemePreference(preference);
}

/** Reflects the preference onto <html> so CSS (keyed off data-theme) picks it up immediately. */
export function applyThemePreference(preference: ThemePreference): void {
  if (preference === "auto") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", preference);
  }
}

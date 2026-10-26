import type { BirthData } from "@/lib/types";

export const BIRTH_DATA_STORAGE_KEY = "ap:birthData";

export function parseBirthData(raw: string | null): BirthData | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && (parsed as { version?: unknown }).version === 1) {
      return parsed as BirthData;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveBirthData(data: BirthData): void {
  localStorage.setItem(BIRTH_DATA_STORAGE_KEY, JSON.stringify(data));
}

export function loadBirthData(): BirthData | null {
  return parseBirthData(localStorage.getItem(BIRTH_DATA_STORAGE_KEY));
}

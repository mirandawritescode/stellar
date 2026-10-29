import type { DailyReading } from "@/lib/types";

function readingStorageKey(date: string): string {
  return `ap:reading:${date}`;
}

export function parseCachedReading(raw: string | null): DailyReading | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof (parsed as { date?: unknown }).date === "string"
    ) {
      return parsed as DailyReading;
    }
    return null;
  } catch {
    return null;
  }
}

export function loadCachedReading(date: string): DailyReading | null {
  return parseCachedReading(localStorage.getItem(readingStorageKey(date)));
}

export function saveCachedReading(reading: DailyReading): void {
  localStorage.setItem(readingStorageKey(reading.date), JSON.stringify(reading));
}

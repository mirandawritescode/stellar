import type { ApproxWindow, TimeAccuracy } from "@/lib/types";

const MIN_BIRTH_DATE = "1900-01-01";

export const TIME_WINDOWS: { key: ApproxWindow; label: string; range: string }[] = [
  { key: "morning", label: "Morning", range: "06:00–12:00" },
  { key: "afternoon", label: "Afternoon", range: "12:00–18:00" },
  { key: "evening", label: "Evening", range: "18:00–00:00" },
  { key: "night", label: "Night", range: "00:00–06:00" },
];

export function isValidBirthDate(date: string, today: string): boolean {
  if (!date) return false;
  return date >= MIN_BIRTH_DATE && date <= today;
}

export function isBirthTimeComplete(
  timeAccuracy: TimeAccuracy,
  time: string | undefined,
  approxWindow: ApproxWindow | undefined,
): boolean {
  if (timeAccuracy === "exact") return Boolean(time);
  if (timeAccuracy === "approximate") return Boolean(approxWindow);
  return true;
}

export function formatBirthTime(
  timeAccuracy: TimeAccuracy,
  time: string | undefined,
  approxWindow: ApproxWindow | undefined,
): string {
  if (timeAccuracy === "exact") return `Exact: ${time ?? ""}`;
  if (timeAccuracy === "approximate") {
    const window = TIME_WINDOWS.find((w) => w.key === approxWindow);
    return `Roughly: ${window ? `${window.label} (${window.range})` : ""}`;
  }
  return "Unknown";
}

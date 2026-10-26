import type { ApproxWindow, TimeAccuracy } from "@/lib/types";

const MIN_BIRTH_DATE = "1900-01-01";

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

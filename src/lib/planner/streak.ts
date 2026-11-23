import type { Task } from "@/lib/types";

function offsetDate(dateStr: string, offsetDays: number): string {
  const date = new Date(`${dateStr}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

/**
 * Consecutive days, ending today, with at least one task completed. If
 * nothing's been completed yet today, counts from yesterday instead -- an
 * unfinished day shouldn't read as a broken streak before it's even over.
 */
export function completionStreak(tasks: Task[], today: string): number {
  const completedDates = new Set(
    tasks.filter((t) => t.done && t.completedAt).map((t) => t.completedAt!.slice(0, 10)),
  );

  let cursor = completedDates.has(today) ? today : offsetDate(today, -1);
  let streak = 0;
  while (completedDates.has(cursor)) {
    streak += 1;
    cursor = offsetDate(cursor, -1);
  }
  return streak;
}

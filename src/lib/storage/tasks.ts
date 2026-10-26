import type { Task } from "@/lib/types";

export const TASKS_STORAGE_KEY = "ap:tasks";

const RECENT_COMPLETED_DAYS = 7;
const COMPLETED_RETENTION_DAYS = 30;

function daysBetween(dateStr: string, today: string): number {
  const date = new Date(`${dateStr}T00:00:00Z`);
  const todayDate = new Date(`${today}T00:00:00Z`);
  return Math.floor((todayDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

function compareOpenTasks(a: Task, b: Task): number {
  if (a.dueDate && b.dueDate) {
    if (a.dueDate !== b.dueDate) return a.dueDate < b.dueDate ? -1 : 1;
  } else if (a.dueDate && !b.dueDate) {
    return -1;
  } else if (!a.dueDate && b.dueDate) {
    return 1;
  }
  return a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0;
}

export function sortTasksForDisplay(tasks: Task[], today: string): Task[] {
  const open = tasks.filter((t) => !t.done).sort(compareOpenTasks);

  const recentlyCompleted = tasks
    .filter(
      (t) =>
        t.done &&
        t.completedAt &&
        daysBetween(t.completedAt.slice(0, 10), today) <= RECENT_COMPLETED_DAYS,
    )
    .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));

  return [...open, ...recentlyCompleted];
}

export function pruneOldCompletedTasks(tasks: Task[], today: string): Task[] {
  return tasks.filter((t) => {
    if (!t.done || !t.completedAt) return true;
    return daysBetween(t.completedAt.slice(0, 10), today) <= COMPLETED_RETENTION_DAYS;
  });
}

export function saveTasks(tasks: Task[]): void {
  localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
}

export function loadTasks(today: string): Task[] {
  const raw = localStorage.getItem(TASKS_STORAGE_KEY);
  const tasks: Task[] = raw ? (JSON.parse(raw) as Task[]) : [];
  const pruned = pruneOldCompletedTasks(tasks, today);
  if (pruned.length !== tasks.length) {
    saveTasks(pruned);
  }
  return pruned;
}

import type { BirthData, Task } from "@/lib/types";

const DEMO_NAME = "Jordan";

/** A real, verified birth chart (Sun in Gemini, Moon in Pisces, Libra rising) used throughout development. */
export function buildDemoBirthData(): BirthData {
  return {
    version: 1,
    name: DEMO_NAME,
    date: "1990-06-15",
    timeAccuracy: "exact",
    time: "14:30",
    place: {
      name: "San Francisco, California, United States",
      lat: 37.7749,
      lon: -122.4194,
      timeZone: "America/Los_Angeles",
    },
  };
}

function offsetDate(today: string, offsetDays: number): string {
  const date = new Date(`${today}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

/**
 * A handful of tasks spanning every category and due-date bucket (overdue,
 * due today, due soon, due later, no date, completed) so a fresh visitor's
 * first Today page has real variety in Best/Caution/All instead of an empty
 * list. Due dates are relative to `today` so the demo never goes stale.
 */
export function buildDemoTasks(today: string): Task[] {
  const createdAt = `${offsetDate(today, -9)}T09:00:00.000Z`;

  return [
    {
      id: "demo-1",
      title: "File the insurance claim",
      category: "admin",
      dueDate: offsetDate(today, -5),
      done: false,
      createdAt,
    },
    {
      id: "demo-2",
      title: "Call the dentist back",
      category: "communication",
      dueDate: today,
      done: false,
      createdAt,
    },
    {
      id: "demo-3",
      title: "Text the book club",
      category: "social",
      dueDate: offsetDate(today, 2),
      done: false,
      createdAt,
    },
    {
      id: "demo-4",
      title: "Sketch new logo concepts",
      category: "creative",
      dueDate: offsetDate(today, 3),
      done: false,
      createdAt,
    },
    {
      id: "demo-5",
      title: "Plan next quarter's budget",
      category: "money",
      dueDate: offsetDate(today, 10),
      done: false,
      createdAt,
    },
    { id: "demo-6", title: "Deep-clean the garage", category: "action", done: false, createdAt },
    { id: "demo-7", title: "Water the plants", category: "selfcare", done: false, createdAt },
    {
      id: "demo-8",
      title: "Reply to the group chat",
      category: "social",
      done: true,
      createdAt,
      completedAt: `${offsetDate(today, -1)}T18:00:00.000Z`,
    },
  ];
}

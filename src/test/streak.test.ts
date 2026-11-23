import { describe, it, expect } from "vitest";
import { completionStreak } from "@/lib/planner/streak";
import type { Task } from "@/lib/types";

const TODAY = "2026-11-23";

function doneTask(id: string, completedAt: string): Task {
  return {
    id,
    title: "Task",
    category: "focus",
    done: true,
    createdAt: "2026-11-01T00:00:00.000Z",
    completedAt,
  };
}

describe("completionStreak", () => {
  it("is 0 with no completed tasks", () => {
    expect(completionStreak([], TODAY)).toBe(0);
  });

  it("is 0 when the last completion was two or more days ago", () => {
    const tasks = [doneTask("a", "2026-11-21T10:00:00.000Z")];
    expect(completionStreak(tasks, TODAY)).toBe(0);
  });

  it("counts consecutive days ending today", () => {
    const tasks = [
      doneTask("a", "2026-11-23T09:00:00.000Z"),
      doneTask("b", "2026-11-22T09:00:00.000Z"),
      doneTask("c", "2026-11-21T09:00:00.000Z"),
    ];
    expect(completionStreak(tasks, TODAY)).toBe(3);
  });

  it("counts from yesterday when nothing is done yet today", () => {
    const tasks = [doneTask("a", "2026-11-22T09:00:00.000Z"), doneTask("b", "2026-11-21T09:00:00.000Z")];
    expect(completionStreak(tasks, TODAY)).toBe(2);
  });

  it("stops at the first gap", () => {
    const tasks = [
      doneTask("a", "2026-11-23T09:00:00.000Z"),
      doneTask("b", "2026-11-22T09:00:00.000Z"),
      doneTask("c", "2026-11-19T09:00:00.000Z"), // gap before this one
    ];
    expect(completionStreak(tasks, TODAY)).toBe(2);
  });

  it("counts multiple completions on the same day once", () => {
    const tasks = [doneTask("a", "2026-11-23T09:00:00.000Z"), doneTask("b", "2026-11-23T14:00:00.000Z")];
    expect(completionStreak(tasks, TODAY)).toBe(1);
  });

  it("ignores open tasks", () => {
    const tasks: Task[] = [
      { id: "a", title: "Open", category: "focus", done: false, createdAt: "2026-11-01T00:00:00.000Z" },
    ];
    expect(completionStreak(tasks, TODAY)).toBe(0);
  });
});

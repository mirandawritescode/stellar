import { describe, it, expect } from "vitest";
import { sortTasksForDisplay, pruneOldCompletedTasks } from "@/lib/storage/tasks";
import type { Task } from "@/lib/types";

const TODAY = "2026-10-26";

function task(overrides: Partial<Task>): Task {
  return {
    id: "id",
    title: "Task",
    category: "focus",
    done: false,
    createdAt: "2026-10-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("sortTasksForDisplay", () => {
  it("sorts open tasks by due date, soonest first", () => {
    const soon = task({ id: "soon", dueDate: "2026-10-27" });
    const later = task({ id: "later", dueDate: "2026-11-05" });
    const result = sortTasksForDisplay([later, soon], TODAY);
    expect(result.map((t) => t.id)).toEqual(["soon", "later"]);
  });

  it("puts open tasks with no due date after open tasks with a due date", () => {
    const noDue = task({ id: "no-due" });
    const withDue = task({ id: "with-due", dueDate: "2026-12-01" });
    const result = sortTasksForDisplay([noDue, withDue], TODAY);
    expect(result.map((t) => t.id)).toEqual(["with-due", "no-due"]);
  });

  it("breaks ties on the same due date by oldest createdAt first", () => {
    const newer = task({ id: "newer", dueDate: "2026-11-01", createdAt: "2026-10-10T00:00:00.000Z" });
    const older = task({ id: "older", dueDate: "2026-11-01", createdAt: "2026-10-01T00:00:00.000Z" });
    const result = sortTasksForDisplay([newer, older], TODAY);
    expect(result.map((t) => t.id)).toEqual(["older", "newer"]);
  });

  it("places completed tasks after all open tasks", () => {
    const open = task({ id: "open" });
    const completed = task({
      id: "completed",
      done: true,
      completedAt: "2026-10-25T00:00:00.000Z",
    });
    const result = sortTasksForDisplay([completed, open], TODAY);
    expect(result.map((t) => t.id)).toEqual(["open", "completed"]);
  });

  it("includes completed tasks finished within the last 7 days", () => {
    const completed = task({
      id: "completed",
      done: true,
      completedAt: "2026-10-20T00:00:00.000Z", // 6 days before TODAY
    });
    const result = sortTasksForDisplay([completed], TODAY);
    expect(result.map((t) => t.id)).toEqual(["completed"]);
  });

  it("excludes completed tasks finished more than 7 days ago", () => {
    const completed = task({
      id: "completed",
      done: true,
      completedAt: "2026-10-01T00:00:00.000Z", // 25 days before TODAY
    });
    const result = sortTasksForDisplay([completed], TODAY);
    expect(result).toEqual([]);
  });
});

describe("pruneOldCompletedTasks", () => {
  it("removes completed tasks older than 30 days", () => {
    const stale = task({
      id: "stale",
      done: true,
      completedAt: "2026-09-01T00:00:00.000Z", // 55 days before TODAY
    });
    expect(pruneOldCompletedTasks([stale], TODAY)).toEqual([]);
  });

  it("keeps completed tasks within 30 days", () => {
    const recent = task({
      id: "recent",
      done: true,
      completedAt: "2026-10-10T00:00:00.000Z", // 16 days before TODAY
    });
    expect(pruneOldCompletedTasks([recent], TODAY)).toEqual([recent]);
  });

  it("keeps open tasks regardless of age", () => {
    const old = task({ id: "old", createdAt: "2020-01-01T00:00:00.000Z" });
    expect(pruneOldCompletedTasks([old], TODAY)).toEqual([old]);
  });
});

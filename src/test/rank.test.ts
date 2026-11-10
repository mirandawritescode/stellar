import { describe, it, expect } from "vitest";
import { rankTasks } from "@/lib/planner/rank";
import type { DayThemes, Task } from "@/lib/types";

const TODAY = "2026-11-02"; // a Monday

const EMPTY_THEMES: DayThemes = {
  date: TODAY,
  themes: [],
  caution: [],
  moonPhase: "waxing",
};

function task(overrides: Partial<Task>): Task {
  return {
    id: "id",
    title: "Task",
    category: "focus",
    done: false,
    createdAt: "2026-11-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("rankTasks — factor 1: overdue", () => {
  it("scores +5 and names the day it was due", () => {
    const t = task({ id: "a", dueDate: "2026-10-30" }); // Friday
    const [ranked] = rankTasks([t], EMPTY_THEMES, TODAY);
    expect(ranked.score).toBe(5);
    expect(ranked.reason).toBe("Overdue since Fri");
  });
});

describe("rankTasks — factor 2: due today", () => {
  it("scores +4 with reason 'Due today'", () => {
    const t = task({ id: "a", dueDate: TODAY });
    const [ranked] = rankTasks([t], EMPTY_THEMES, TODAY);
    expect(ranked.score).toBe(4);
    expect(ranked.reason).toBe("Due today");
  });
});

describe("rankTasks — factor 3: due in the next 3 days", () => {
  it("scores +2 for a task due in 2 days", () => {
    const t = task({ id: "a", dueDate: "2026-11-04" }); // Wednesday, 2 days out
    const [ranked] = rankTasks([t], EMPTY_THEMES, TODAY);
    expect(ranked.score).toBe(2);
    expect(ranked.reason).toBe("Due Wed");
  });

  it("does not apply to a task due in 4 days", () => {
    const t = task({ id: "a", dueDate: "2026-11-06" });
    const [ranked] = rankTasks([t], EMPTY_THEMES, TODAY);
    expect(ranked.score).toBe(0);
  });
});

describe("rankTasks — factor 4: category matches a day theme", () => {
  it("adds the theme's strength times 2, with a plain-language reason", () => {
    const day: DayThemes = {
      date: TODAY,
      themes: [{ theme: "communication", strength: 3, reasons: ["Mercury trine your Sun"] }],
      caution: [],
      moonPhase: "waxing",
    };
    const t = task({ id: "a", category: "communication" });
    const [ranked] = rankTasks([t], day, TODAY);
    expect(ranked.score).toBe(6);
    expect(ranked.reason).toBe("Calls & messages is favored today");
  });
});

describe("rankTasks — factor 5: category is in caution", () => {
  it("scores -1 but still includes the task", () => {
    const day: DayThemes = {
      date: TODAY,
      themes: [],
      caution: [{ theme: "social", reasons: ["Venus square your Saturn"] }],
      moonPhase: "waxing",
    };
    const t = task({ id: "a", category: "social" });
    const [ranked] = rankTasks([t], day, TODAY);
    expect(ranked.score).toBe(-1);
    expect(ranked.reason).toBe("Go gently on Social today");
  });

  it("drops the caution factor entirely when the same category is also a top theme", () => {
    // Different planets can make the same category both a top theme and a
    // caution at once; once it's favored today, it's just favored -- no
    // separate "tougher aspect" factor and no -1.
    const day: DayThemes = {
      date: TODAY,
      themes: [{ theme: "social", strength: 2, reasons: ["Venus trine your Sun"] }],
      caution: [{ theme: "social", reasons: ["Saturn square your Moon"] }],
      moonPhase: "waxing",
    };
    const t = task({ id: "a", category: "social" });
    const [ranked] = rankTasks([t], day, TODAY);
    expect(ranked.score).toBe(4); // +4 (strength 2 x 2) only
    expect(ranked.factors).toEqual([{ points: 4, reason: "Social is favored today" }]);
  });
});

describe("rankTasks — factor 6: stale (created more than 7 days ago)", () => {
  it("scores +1 for a task created 13 days ago", () => {
    const t = task({ id: "a", createdAt: "2026-10-20T00:00:00.000Z" });
    const [ranked] = rankTasks([t], EMPTY_THEMES, TODAY);
    expect(ranked.score).toBe(1);
  });

  it("does not apply to a task created yesterday", () => {
    const t = task({ id: "a", createdAt: "2026-11-01T00:00:00.000Z" });
    const [ranked] = rankTasks([t], EMPTY_THEMES, TODAY);
    expect(ranked.score).toBe(0);
  });
});

describe("rankTasks — ties", () => {
  it("breaks a tie by earlier due date first", () => {
    const sooner = task({ id: "sooner", dueDate: "2026-11-04" });
    const later = task({ id: "later", dueDate: "2026-11-05" });
    // both get the same +2 "due soon" factor, so due date must break the tie
    const ranked = rankTasks([later, sooner], EMPTY_THEMES, TODAY);
    expect(ranked.map((r) => r.task.id)).toEqual(["sooner", "later"]);
  });

  it("falls back to oldest createdAt when scores and due dates both tie", () => {
    const newer = task({ id: "newer", createdAt: "2026-10-30T00:00:00.000Z" });
    const older = task({ id: "older", createdAt: "2026-10-25T00:00:00.000Z" });
    const ranked = rankTasks([newer, older], EMPTY_THEMES, TODAY);
    expect(ranked.map((r) => r.task.id)).toEqual(["older", "newer"]);
  });
});

describe("rankTasks — empty list", () => {
  it("returns an empty array", () => {
    expect(rankTasks([], EMPTY_THEMES, TODAY)).toEqual([]);
  });
});

describe("rankTasks — other behavior", () => {
  it("excludes completed tasks", () => {
    const t = task({ id: "a", done: true, dueDate: "2026-10-30" });
    expect(rankTasks([t], EMPTY_THEMES, TODAY)).toEqual([]);
  });

  it("only gives a reason to the top 3 ranked tasks", () => {
    const tasks = [
      task({ id: "1", dueDate: "2026-10-25" }), // most overdue-ish, but same +5 factor as others
      task({ id: "2", dueDate: "2026-10-26" }),
      task({ id: "3", dueDate: "2026-10-27" }),
      task({ id: "4", dueDate: "2026-10-28" }),
    ];
    const ranked = rankTasks(tasks, EMPTY_THEMES, TODAY);
    expect(ranked).toHaveLength(4);
    expect(ranked.slice(0, 3).every((r) => typeof r.reason === "string")).toBe(true);
    expect(ranked[3].reason).toBeUndefined();
  });

  it("combines multiple factors into one score", () => {
    const day: DayThemes = {
      date: TODAY,
      themes: [{ theme: "communication", strength: 2, reasons: ["Mercury trine your Sun"] }],
      caution: [],
      moonPhase: "waxing",
    };
    const t = task({
      id: "a",
      category: "communication",
      dueDate: TODAY,
      createdAt: "2026-10-20T00:00:00.000Z", // stale
    });
    const [ranked] = rankTasks([t], day, TODAY);
    // +4 (due today) + 4 (theme strength 2 x 2) + 1 (stale) = 9
    expect(ranked.score).toBe(9);
  });

  it("does not apply overdue/due-today/due-soon factors to a task with no due date", () => {
    const t = task({ id: "a" });
    const [ranked] = rankTasks([t], EMPTY_THEMES, TODAY);
    expect(ranked.score).toBe(0);
    expect(ranked.reason).toBeUndefined();
  });

  it("picks the reason by highest points, not by factor priority order", () => {
    // due-soon (+2, priority 2) vs. a strength-3 theme match (+6, priority 3):
    // the theme match is worth more, so it must win the reason even though
    // it's a lower-priority factor type.
    const day: DayThemes = {
      date: TODAY,
      themes: [{ theme: "creative", strength: 3, reasons: ["Venus trine your Moon"] }],
      caution: [],
      moonPhase: "waxing",
    };
    const t = task({ id: "a", category: "creative", dueDate: "2026-11-04" });
    const [ranked] = rankTasks([t], day, TODAY);
    expect(ranked.score).toBe(8); // 2 (due soon) + 6 (strength 3 x 2)
    expect(ranked.reason).toBe("Creative is favored today");
  });

  it("exposes every scoring factor, strongest first, for the full breakdown", () => {
    const day: DayThemes = {
      date: TODAY,
      themes: [{ theme: "communication", strength: 2, reasons: ["Mercury trine your Sun"] }],
      caution: [],
      moonPhase: "waxing",
    };
    const t = task({
      id: "a",
      category: "communication",
      dueDate: TODAY,
      createdAt: "2026-10-20T00:00:00.000Z", // stale
    });
    const [ranked] = rankTasks([t], day, TODAY);
    expect(ranked.factors).toEqual([
      { points: 4, reason: "Due today", kind: "due" },
      { points: 4, reason: "Calls & messages is favored today" },
      { points: 1, reason: "It's been sitting a while" },
    ]);
  });

  it("still exposes factors for a task beyond the top 3, even though reason is hidden", () => {
    const tasks = [
      task({ id: "1", dueDate: "2026-10-25" }),
      task({ id: "2", dueDate: "2026-10-26" }),
      task({ id: "3", dueDate: "2026-10-27" }),
      task({ id: "4", dueDate: "2026-10-28" }),
    ];
    const ranked = rankTasks(tasks, EMPTY_THEMES, TODAY);
    expect(ranked[3].reason).toBeUndefined();
    expect(ranked[3].factors).toEqual([{ points: 5, reason: "Overdue since Wed", kind: "due" }]);
  });
});

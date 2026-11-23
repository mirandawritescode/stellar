import { describe, it, expect } from "vitest";
import { buildDemoBirthData, buildDemoTasks } from "@/lib/demo";

const TODAY = "2026-11-23";

describe("buildDemoBirthData", () => {
  it("returns a complete, valid birth profile", () => {
    const data = buildDemoBirthData();
    expect(data.version).toBe(1);
    expect(data.name).toBe("Jordan");
    expect(data.timeAccuracy).toBe("exact");
    expect(data.time).toBe("14:30");
    expect(data.place.timeZone).toBe("America/Los_Angeles");
  });
});

describe("buildDemoTasks", () => {
  it("spans every due-date bucket relative to today", () => {
    const tasks = buildDemoTasks(TODAY);
    const byId = Object.fromEntries(tasks.map((t) => [t.id, t]));
    expect(byId["demo-1"].dueDate).toBe("2026-11-18"); // overdue
    expect(byId["demo-2"].dueDate).toBe(TODAY); // due today
    expect(byId["demo-3"].dueDate).toBe("2026-11-25"); // due soon
    expect(byId["demo-5"].dueDate).toBe("2026-12-03"); // due later
    expect(byId["demo-6"].dueDate).toBeUndefined(); // no date
  });

  it("includes one already-completed task", () => {
    const tasks = buildDemoTasks(TODAY);
    const done = tasks.filter((t) => t.done);
    expect(done).toHaveLength(1);
    expect(done[0].completedAt).toBe("2026-11-22T18:00:00.000Z");
  });

  it("covers all eight task categories exactly once", () => {
    const tasks = buildDemoTasks(TODAY);
    const categories = tasks.map((t) => t.category).sort();
    expect(categories).toEqual(
      ["action", "admin", "communication", "creative", "money", "selfcare", "social", "social"].sort(),
    );
  });
});

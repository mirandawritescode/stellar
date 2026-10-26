import { describe, it, expect } from "vitest";
import { isActiveRoute, TABS } from "@/lib/nav";

describe("isActiveRoute", () => {
  it("matches the root route only when the pathname is exactly /", () => {
    expect(isActiveRoute("/", "/")).toBe(true);
    expect(isActiveRoute("/tasks", "/")).toBe(false);
  });

  it("matches a non-root tab exactly", () => {
    expect(isActiveRoute("/tasks", "/tasks")).toBe(true);
  });

  it("matches a non-root tab's sub-routes as a prefix", () => {
    expect(isActiveRoute("/tasks/123", "/tasks")).toBe(true);
  });

  it("does not match an unrelated route", () => {
    expect(isActiveRoute("/chart", "/tasks")).toBe(false);
  });

  it("does not match a route that merely shares a prefix string", () => {
    expect(isActiveRoute("/tasksmanager", "/tasks")).toBe(false);
  });
});

describe("TABS", () => {
  it("lists Today, Tasks, Chart, Settings in that order", () => {
    expect(TABS.map((t) => t.label)).toEqual(["Today", "Tasks", "Chart", "Settings"]);
  });
});

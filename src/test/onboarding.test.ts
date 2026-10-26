import { describe, it, expect } from "vitest";
import { isValidBirthDate, isBirthTimeComplete, formatBirthTime } from "@/lib/onboarding";

describe("isValidBirthDate", () => {
  const today = "2026-10-26";

  it("rejects an empty date", () => {
    expect(isValidBirthDate("", today)).toBe(false);
  });

  it("rejects a date before 1900-01-01", () => {
    expect(isValidBirthDate("1899-12-31", today)).toBe(false);
  });

  it("rejects a date after today", () => {
    expect(isValidBirthDate("2026-10-27", today)).toBe(false);
  });

  it("accepts the minimum boundary date", () => {
    expect(isValidBirthDate("1900-01-01", today)).toBe(true);
  });

  it("accepts today itself", () => {
    expect(isValidBirthDate(today, today)).toBe(true);
  });

  it("accepts an ordinary date in range", () => {
    expect(isValidBirthDate("1990-06-15", today)).toBe(true);
  });
});

describe("isBirthTimeComplete", () => {
  it("is incomplete when exact is chosen but no time is set", () => {
    expect(isBirthTimeComplete("exact", undefined, undefined)).toBe(false);
  });

  it("is complete when exact is chosen and a time is set", () => {
    expect(isBirthTimeComplete("exact", "14:30", undefined)).toBe(true);
  });

  it("is incomplete when approximate is chosen but no window is set", () => {
    expect(isBirthTimeComplete("approximate", undefined, undefined)).toBe(false);
  });

  it("is complete when approximate is chosen and a window is set", () => {
    expect(isBirthTimeComplete("approximate", undefined, "morning")).toBe(true);
  });

  it("is always complete when unknown is chosen", () => {
    expect(isBirthTimeComplete("unknown", undefined, undefined)).toBe(true);
  });
});

describe("formatBirthTime", () => {
  it("formats an exact time", () => {
    expect(formatBirthTime("exact", "14:30", undefined)).toBe("Exact: 14:30");
  });

  it("formats an approximate window with its range", () => {
    expect(formatBirthTime("approximate", undefined, "morning")).toBe(
      "Roughly: Morning (06:00–12:00)",
    );
  });

  it("formats unknown", () => {
    expect(formatBirthTime("unknown", undefined, undefined)).toBe("Unknown");
  });
});

import { describe, it, expect } from "vitest";
import { parseCachedReading } from "@/lib/storage/reading";
import type { DailyReading } from "@/lib/types";

const VALID: DailyReading = {
  date: "2026-10-29",
  title: "Today's Quick Guide",
  reading: "A good day for conversations.",
  tip: "Send that email first.",
  themes: ["communication"],
  source: "fallback",
};

describe("parseCachedReading", () => {
  it("returns null for null input", () => {
    expect(parseCachedReading(null)).toBeNull();
  });

  it("returns null for invalid JSON", () => {
    expect(parseCachedReading("not json")).toBeNull();
  });

  it("returns null when date is missing", () => {
    const withoutDate: Record<string, unknown> = { ...VALID };
    delete withoutDate.date;
    expect(parseCachedReading(JSON.stringify(withoutDate))).toBeNull();
  });

  it("returns the parsed reading for a valid record", () => {
    expect(parseCachedReading(JSON.stringify(VALID))).toEqual(VALID);
  });
});

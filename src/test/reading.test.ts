import { describe, it, expect } from "vitest";
import { buildFallbackReading, buildReadingPrompt, parseReadingResponse } from "@/lib/reading";
import type { DayThemes } from "@/lib/types";

const SAMPLE_THEMES: DayThemes = {
  date: "2026-10-29",
  themes: [
    { theme: "communication", strength: 3, reasons: ["Mercury trine your Sun"] },
    { theme: "admin", strength: 2, reasons: ["Waning moon"] },
  ],
  caution: [{ theme: "money", reasons: ["Venus is retrograde."] }],
  moonPhase: "waning",
};

describe("buildFallbackReading", () => {
  it("builds a reading grounded in the day's top themes", () => {
    const reading = buildFallbackReading(SAMPLE_THEMES);
    expect(reading.source).toBe("fallback");
    expect(reading.date).toBe("2026-10-29");
    expect(reading.reading.toLowerCase()).toContain("calls & messages".toLowerCase());
    expect(reading.reading.toLowerCase()).toContain("admin & errands".toLowerCase());
    expect(reading.themes).toEqual(["communication", "admin"]);
  });

  it("mentions caution themes when present", () => {
    const reading = buildFallbackReading(SAMPLE_THEMES);
    expect(reading.reading.toLowerCase()).toContain("money");
  });

  it("still produces a reading with no caution themes", () => {
    const noCaution: DayThemes = { ...SAMPLE_THEMES, caution: [] };
    const reading = buildFallbackReading(noCaution);
    expect(reading.reading.length).toBeGreaterThan(0);
  });

  it("handles a single theme gracefully", () => {
    const oneTheme: DayThemes = {
      ...SAMPLE_THEMES,
      themes: [{ theme: "focus", strength: 1, reasons: [] }],
    };
    const reading = buildFallbackReading(oneTheme);
    expect(reading.reading.toLowerCase()).toContain("focus work".toLowerCase());
  });
});

describe("buildReadingPrompt", () => {
  it("includes the natal facts, transits, and day themes in the user message", () => {
    const { system, user } = buildReadingPrompt({
      natal: { sun: "Leo", moon: "Gemini", rising: "Aquarius" },
      transits: {
        aspects: [{ a: "Mercury", b: "Sun", type: "trine", orb: 1.2 }],
        moonPhase: "waning",
        retrogradePlanets: ["Mercury"],
      },
      dayThemes: SAMPLE_THEMES,
      missing: [],
    });

    expect(system).toContain("Return JSON only");
    expect(system).toContain("never mention houses or the rising sign");

    const parsed = JSON.parse(user);
    expect(parsed.natal).toEqual({ sun: "Leo", moon: "Gemini", rising: "Aquarius" });
    expect(parsed.themes).toEqual(SAMPLE_THEMES.themes);
    expect(parsed.caution).toEqual([{ theme: "money", reasons: ["Venus is retrograde."] }]);
    expect(parsed.missing).toEqual([]);
  });

  it("flags missing birth time and omits rising when not provided", () => {
    const { user } = buildReadingPrompt({
      natal: { sun: "Leo", moon: "Gemini" },
      transits: { aspects: [], moonPhase: "new", retrogradePlanets: [] },
      dayThemes: SAMPLE_THEMES,
      missing: ["birthTime"],
    });
    const parsed = JSON.parse(user);
    expect(parsed.natal.rising).toBeUndefined();
    expect(parsed.missing).toEqual(["birthTime"]);
  });
});

describe("parseReadingResponse", () => {
  it("accepts a well-formed response", () => {
    const raw = JSON.stringify({
      title: "Clear Signals Today",
      reading: "A good day for conversations and follow-through.",
      tip: "Send that email first thing.",
      themes: ["communication", "admin"],
    });
    const result = parseReadingResponse(raw, "2026-10-29");
    expect(result).toEqual({
      date: "2026-10-29",
      title: "Clear Signals Today",
      reading: "A good day for conversations and follow-through.",
      tip: "Send that email first thing.",
      themes: ["communication", "admin"],
      source: "ai",
    });
  });

  it("rejects invalid JSON", () => {
    expect(parseReadingResponse("not json", "2026-10-29")).toBeNull();
  });

  it("rejects a response missing required fields", () => {
    const raw = JSON.stringify({ title: "Only a title" });
    expect(parseReadingResponse(raw, "2026-10-29")).toBeNull();
  });

  it("filters out invalid theme names rather than failing outright", () => {
    const raw = JSON.stringify({
      title: "Title",
      reading: "Reading text.",
      tip: "Tip text.",
      themes: ["communication", "not-a-real-theme"],
    });
    const result = parseReadingResponse(raw, "2026-10-29");
    expect(result?.themes).toEqual(["communication"]);
  });
});

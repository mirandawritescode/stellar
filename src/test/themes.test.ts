import { describe, it, expect } from "vitest";
import { computeDayThemes } from "@/lib/astro/themes";
import type { Transits } from "@/lib/astro/transits";
import type { Aspect, Theme } from "@/lib/types";

function makeTransits(overrides: Partial<Transits>): Transits {
  return {
    date: "2026-10-26",
    aspects: [],
    moonPhase: "waxing",
    retrogradePlanets: [],
    ...overrides,
  };
}

function strengthOf(themes: { theme: Theme; strength: number }[], theme: Theme): number {
  return themes.find((t) => t.theme === theme)?.strength ?? 0;
}

describe("computeDayThemes — rule 1: harmonious aspect boosts its planet's themes", () => {
  it("boosts Mercury's themes by 1 on a sextile to a non-Sun/Moon natal planet", () => {
    const aspect: Aspect = { a: "Mercury", b: "Mars", type: "sextile", orb: 1 };
    const result = computeDayThemes(makeTransits({ aspects: [aspect] }));
    expect(strengthOf(result.themes, "communication")).toBeGreaterThanOrEqual(1);
    expect(strengthOf(result.themes, "admin")).toBeGreaterThanOrEqual(1);
    const communication = result.themes.find((t) => t.theme === "communication");
    expect(communication?.reasons.some((r) => r.includes("Mercury") && r.includes("sextile"))).toBe(true);
  });
});

describe("computeDayThemes — rule 2: conjunction boosts and flags intense", () => {
  it("boosts the planet's themes and notes intensity in the reason", () => {
    const aspect: Aspect = { a: "Venus", b: "Mars", type: "conjunction", orb: 1 };
    const result = computeDayThemes(makeTransits({ aspects: [aspect] }));
    expect(strengthOf(result.themes, "social")).toBeGreaterThanOrEqual(1);
    const social = result.themes.find((t) => t.theme === "social");
    expect(social?.reasons.some((r) => r.toLowerCase().includes("intense"))).toBe(true);
  });
});

describe("computeDayThemes — rule 3: challenging aspect goes into caution, not strength", () => {
  it("adds the planet's themes to caution without boosting strength", () => {
    const aspect: Aspect = { a: "Mercury", b: "Mars", type: "square", orb: 1 };
    const result = computeDayThemes(makeTransits({ aspects: [aspect] }));
    expect(result.caution).toContain("communication");
    expect(result.caution).toContain("admin");
    // squared to a non-Sun/Moon planet contributes no strength of its own
    const fromMoonPhaseOnly = computeDayThemes(makeTransits({}));
    expect(strengthOf(result.themes, "communication")).toBe(strengthOf(fromMoonPhaseOnly.themes, "communication"));
  });
});

describe("computeDayThemes — rule 4: aspects to the natal Sun or Moon count double", () => {
  it("doubles the strength when the natal planet is the Sun", () => {
    const toSun: Aspect = { a: "Mercury", b: "Sun", type: "sextile", orb: 1 };
    const toMars: Aspect = { a: "Mercury", b: "Mars", type: "sextile", orb: 1 };
    const resultSun = computeDayThemes(makeTransits({ aspects: [toSun] }));
    const resultMars = computeDayThemes(makeTransits({ aspects: [toMars] }));
    expect(strengthOf(resultSun.themes, "admin")).toBe(strengthOf(resultMars.themes, "admin") + 1);
  });

  it("doubles the strength when the natal planet is the Moon", () => {
    const toMoon: Aspect = { a: "Mercury", b: "Moon", type: "sextile", orb: 1 };
    const toMars: Aspect = { a: "Mercury", b: "Mars", type: "sextile", orb: 1 };
    const resultMoon = computeDayThemes(makeTransits({ aspects: [toMoon] }));
    const resultMars = computeDayThemes(makeTransits({ aspects: [toMars] }));
    expect(strengthOf(resultMoon.themes, "admin")).toBe(strengthOf(resultMars.themes, "admin") + 1);
  });
});

describe("computeDayThemes — rule 5: moon phase boosts one theme", () => {
  it("new moon boosts focus", () => {
    const result = computeDayThemes(makeTransits({ moonPhase: "new" }));
    expect(strengthOf(result.themes, "focus")).toBeGreaterThanOrEqual(1);
  });

  it("waxing moon boosts action", () => {
    const result = computeDayThemes(makeTransits({ moonPhase: "waxing" }));
    expect(strengthOf(result.themes, "action")).toBeGreaterThanOrEqual(1);
  });

  it("full moon boosts social", () => {
    const result = computeDayThemes(makeTransits({ moonPhase: "full" }));
    expect(strengthOf(result.themes, "social")).toBeGreaterThanOrEqual(1);
  });

  it("waning moon boosts admin", () => {
    const result = computeDayThemes(makeTransits({ moonPhase: "waning" }));
    expect(strengthOf(result.themes, "admin")).toBeGreaterThanOrEqual(1);
  });
});

describe("computeDayThemes — rule 6: Mercury retrograde", () => {
  it("boosts admin and puts communication into caution", () => {
    const result = computeDayThemes(makeTransits({ retrogradePlanets: ["Mercury"] }));
    expect(result.caution).toContain("communication");
    const withoutRx = computeDayThemes(makeTransits({}));
    expect(strengthOf(result.themes, "admin")).toBe(strengthOf(withoutRx.themes, "admin") + 1);
  });
});

describe("computeDayThemes — rule 7: Venus retrograde", () => {
  it("puts money into caution", () => {
    const result = computeDayThemes(makeTransits({ retrogradePlanets: ["Venus"] }));
    expect(result.caution).toContain("money");
  });
});

describe("computeDayThemes — rule 8: Mars retrograde", () => {
  it("puts action into caution and boosts selfcare", () => {
    // moonPhase "new" boosts focus, same as the no-aspect fallback, so this
    // doesn't add a 4th competing theme that could crowd selfcare out of the
    // top-3 cap (rule 10) via a strength tie.
    const result = computeDayThemes(makeTransits({ retrogradePlanets: ["Mars"], moonPhase: "new" }));
    expect(result.caution).toContain("action");
    const selfcare = result.themes.find((t) => t.theme === "selfcare");
    expect(selfcare?.reasons.some((r) => r.includes("retrograde"))).toBe(true);
  });
});

describe("computeDayThemes — rule 9: fallback when there are no notable aspects", () => {
  it("defaults to focus and admin when there are no aspects at all", () => {
    const result = computeDayThemes(makeTransits({ aspects: [] }));
    const focus = result.themes.find((t) => t.theme === "focus");
    const admin = result.themes.find((t) => t.theme === "admin");
    expect(focus?.reasons.some((r) => r.includes("quiet day"))).toBe(true);
    expect(admin?.reasons.some((r) => r.includes("quiet day"))).toBe(true);
  });

  it("does not fire once an aspect has already produced a theme", () => {
    const aspect: Aspect = { a: "Mercury", b: "Mars", type: "sextile", orb: 1 };
    const result = computeDayThemes(makeTransits({ aspects: [aspect] }));
    const admin = result.themes.find((t) => t.theme === "admin");
    expect(admin?.reasons.some((r) => r.includes("quiet day"))).toBe(false);
  });
});

describe("computeDayThemes — rule 10: cap strength at 3 and keep only the top 3 themes", () => {
  it("caps a theme's strength at 3 even after many boosts", () => {
    const aspects: Aspect[] = [
      { a: "Mercury", b: "Sun", type: "sextile", orb: 1 },
      { a: "Mercury", b: "Moon", type: "sextile", orb: 1 },
      { a: "Mercury", b: "Mars", type: "sextile", orb: 1 },
    ];
    const result = computeDayThemes(makeTransits({ aspects }));
    expect(strengthOf(result.themes, "admin")).toBeLessThanOrEqual(3);
  });

  it("keeps at most the top 3 themes", () => {
    const aspects: Aspect[] = [
      { a: "Mercury", b: "Mars", type: "sextile", orb: 1 }, // communication, admin
      { a: "Venus", b: "Mars", type: "sextile", orb: 1 }, // social, creative, money
      { a: "Uranus", b: "Mars", type: "sextile", orb: 1 }, // creative
    ];
    const result = computeDayThemes(makeTransits({ aspects }));
    expect(result.themes.length).toBeLessThanOrEqual(3);
  });
});

describe("computeDayThemes — planet to theme mapping", () => {
  it("maps each transiting planet to its documented themes", () => {
    const cases: [Aspect["a"], Theme[]][] = [
      ["Sun", ["focus"]],
      ["Moon", ["selfcare"]],
      ["Mercury", ["communication", "admin"]],
      ["Venus", ["social", "creative", "money"]],
      ["Mars", ["action", "focus"]],
      ["Jupiter", ["money", "social"]],
      ["Saturn", ["admin", "focus"]],
      ["Uranus", ["creative"]],
      ["Neptune", ["creative", "selfcare"]],
      ["Pluto", ["focus"]],
    ];

    for (const [planet, themes] of cases) {
      const aspect: Aspect = { a: planet, b: "Jupiter", type: "trine", orb: 1 };
      const result = computeDayThemes(makeTransits({ aspects: [aspect] }));
      for (const theme of themes) {
        expect(strengthOf(result.themes, theme)).toBeGreaterThanOrEqual(1);
      }
    }
  });
});

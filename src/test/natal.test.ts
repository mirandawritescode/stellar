import { describe, it, expect } from "vitest";
import { computeNatalChart, computeAspects, effectiveTime, pickAltSign } from "@/lib/astro/natal";
import type { PlanetPosition } from "@/lib/types";
import { OBAMA_BIRTH_DATA, OBAMA_EXPECTED } from "./fixtures/obama";
import { DIANA_BIRTH_DATA, DIANA_EXPECTED } from "./fixtures/diana";

function degreeCloseTo(actual: number, expected: number) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1);
}

describe("computeNatalChart — fixtures", () => {
  it("matches Obama's verified Sun, Moon and Ascendant", () => {
    const chart = computeNatalChart(OBAMA_BIRTH_DATA);
    const sun = chart.planets.find((p) => p.planet === "Sun")!;
    const moon = chart.planets.find((p) => p.planet === "Moon")!;

    expect(sun.sign).toBe(OBAMA_EXPECTED.sun.sign);
    degreeCloseTo(sun.degreeInSign, OBAMA_EXPECTED.sun.degreeInSign);
    expect(sun.house).toBe(OBAMA_EXPECTED.sun.house);

    expect(moon.sign).toBe(OBAMA_EXPECTED.moon.sign);
    degreeCloseTo(moon.degreeInSign, OBAMA_EXPECTED.moon.degreeInSign);
    expect(moon.house).toBe(OBAMA_EXPECTED.moon.house);

    expect(chart.ascendant?.sign).toBe(OBAMA_EXPECTED.ascendant.sign);
    degreeCloseTo(chart.ascendant!.degreeInSign, OBAMA_EXPECTED.ascendant.degreeInSign);
    expect(chart.ascendant?.estimated).toBe(false);
  });

  it("matches Diana's verified Sun, Moon and Ascendant", () => {
    const chart = computeNatalChart(DIANA_BIRTH_DATA);
    const sun = chart.planets.find((p) => p.planet === "Sun")!;
    const moon = chart.planets.find((p) => p.planet === "Moon")!;

    expect(sun.sign).toBe(DIANA_EXPECTED.sun.sign);
    degreeCloseTo(sun.degreeInSign, DIANA_EXPECTED.sun.degreeInSign);

    expect(moon.sign).toBe(DIANA_EXPECTED.moon.sign);
    degreeCloseTo(moon.degreeInSign, DIANA_EXPECTED.moon.degreeInSign);

    expect(chart.ascendant?.sign).toBe(DIANA_EXPECTED.ascendant.sign);
    degreeCloseTo(chart.ascendant!.degreeInSign, DIANA_EXPECTED.ascendant.degreeInSign);
  });

  it("includes all 10 planets", () => {
    const chart = computeNatalChart(OBAMA_BIRTH_DATA);
    expect(chart.planets.map((p) => p.planet).sort()).toEqual(
      [
        "Sun",
        "Moon",
        "Mercury",
        "Venus",
        "Mars",
        "Jupiter",
        "Saturn",
        "Uranus",
        "Neptune",
        "Pluto",
      ].sort(),
    );
  });
});

describe("computeNatalChart — time accuracy rules", () => {
  it("computes houses and a non-estimated ascendant for exact time", () => {
    const chart = computeNatalChart(OBAMA_BIRTH_DATA);
    expect(chart.ascendant?.estimated).toBe(false);
    expect(chart.planets.every((p) => typeof p.house === "number")).toBe(true);
  });

  it("computes houses and an estimated ascendant for approximate time", () => {
    const chart = computeNatalChart({
      ...OBAMA_BIRTH_DATA,
      timeAccuracy: "approximate",
      time: undefined,
      approxWindow: "evening",
    });
    expect(chart.ascendant).toBeDefined();
    expect(chart.ascendant?.estimated).toBe(true);
    expect(chart.planets.every((p) => typeof p.house === "number")).toBe(true);
  });

  it("omits houses and the ascendant for unknown time", () => {
    const chart = computeNatalChart({
      ...OBAMA_BIRTH_DATA,
      timeAccuracy: "unknown",
      time: undefined,
    });
    expect(chart.ascendant).toBeUndefined();
    expect(chart.planets.every((p) => p.house === undefined)).toBe(true);
  });
});

describe("effectiveTime", () => {
  it("uses the given time for exact", () => {
    expect(effectiveTime("exact", "14:30", undefined)).toEqual({ hour: 14, minute: 30 });
  });

  it("uses the window midpoint for approximate", () => {
    expect(effectiveTime("approximate", undefined, "evening")).toEqual({ hour: 21, minute: 0 });
  });

  it("uses noon for unknown", () => {
    expect(effectiveTime("unknown", undefined, undefined)).toEqual({ hour: 12, minute: 0 });
  });
});

describe("pickAltSign", () => {
  it("returns the end sign when signs differ", () => {
    expect(pickAltSign("Aries", "Taurus")).toBe("Taurus");
  });

  it("returns undefined when signs match", () => {
    expect(pickAltSign("Leo", "Leo")).toBeUndefined();
  });
});

describe("computeAspects", () => {
  it("finds a conjunction within orb", () => {
    const planets: PlanetPosition[] = [
      { planet: "Sun", longitude: 10, sign: "Aries", degreeInSign: 10, retrograde: false },
      { planet: "Mercury", longitude: 14, sign: "Aries", degreeInSign: 14, retrograde: false },
    ];
    expect(computeAspects(planets)).toEqual([
      { a: "Sun", b: "Mercury", type: "conjunction", orb: 4 },
    ]);
  });

  it("uses an 8 degree orb when Sun or Moon is involved", () => {
    const planets: PlanetPosition[] = [
      { planet: "Sun", longitude: 0, sign: "Aries", degreeInSign: 0, retrograde: false },
      { planet: "Mercury", longitude: 7, sign: "Aries", degreeInSign: 7, retrograde: false },
    ];
    expect(computeAspects(planets)).toEqual([
      { a: "Sun", b: "Mercury", type: "conjunction", orb: 7 },
    ]);
  });

  it("uses a 6 degree orb when neither body is Sun or Moon", () => {
    const planets: PlanetPosition[] = [
      { planet: "Venus", longitude: 0, sign: "Aries", degreeInSign: 0, retrograde: false },
      { planet: "Mercury", longitude: 7, sign: "Aries", degreeInSign: 7, retrograde: false },
    ];
    expect(computeAspects(planets)).toEqual([]);
  });

  it("finds no aspect outside any orb", () => {
    const planets: PlanetPosition[] = [
      { planet: "Sun", longitude: 0, sign: "Aries", degreeInSign: 0, retrograde: false },
      { planet: "Mercury", longitude: 40, sign: "Taurus", degreeInSign: 10, retrograde: false },
    ];
    expect(computeAspects(planets)).toEqual([]);
  });
});

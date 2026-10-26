import { describe, it, expect } from "vitest";
import { computeTransits, computeTransitAspects, moonPhaseFromAngle } from "@/lib/astro/transits";
import { computeNatalChart } from "@/lib/astro/natal";
import type { BirthData, PlanetPosition } from "@/lib/types";

describe("moonPhaseFromAngle", () => {
  it("is new just after 0 degrees", () => {
    expect(moonPhaseFromAngle(0)).toBe("new");
    expect(moonPhaseFromAngle(44)).toBe("new");
  });

  it("is waxing from 45 up to 180 degrees", () => {
    expect(moonPhaseFromAngle(45)).toBe("waxing");
    expect(moonPhaseFromAngle(100)).toBe("waxing");
    expect(moonPhaseFromAngle(179)).toBe("waxing");
  });

  it("is full from 180 up to 225 degrees", () => {
    expect(moonPhaseFromAngle(180)).toBe("full");
    expect(moonPhaseFromAngle(224)).toBe("full");
  });

  it("is waning from 225 up to 360 degrees", () => {
    expect(moonPhaseFromAngle(225)).toBe("waning");
    expect(moonPhaseFromAngle(359)).toBe("waning");
  });

  it("normalizes negative and over-360 angles", () => {
    expect(moonPhaseFromAngle(-10)).toBe(moonPhaseFromAngle(350));
    expect(moonPhaseFromAngle(370)).toBe(moonPhaseFromAngle(10));
  });
});

describe("computeTransitAspects", () => {
  it("uses the transiting planet's own orb, not the natal planet's", () => {
    const transiting: PlanetPosition[] = [
      { planet: "Moon", longitude: 4, sign: "Aries", degreeInSign: 4, retrograde: false },
    ];
    const natal: PlanetPosition[] = [
      { planet: "Saturn", longitude: 0, sign: "Aries", degreeInSign: 0, retrograde: false },
    ];
    // 4 degree gap: within the Moon's 4 degree transit orb
    expect(computeTransitAspects(transiting, natal)).toEqual([
      { a: "Moon", b: "Saturn", type: "conjunction", orb: 4 },
    ]);
  });

  it("excludes an aspect outside the transiting planet's orb", () => {
    const transiting: PlanetPosition[] = [
      { planet: "Saturn", longitude: 2.5, sign: "Aries", degreeInSign: 2.5, retrograde: false },
    ];
    const natal: PlanetPosition[] = [
      { planet: "Moon", longitude: 0, sign: "Aries", degreeInSign: 0, retrograde: false },
    ];
    // 2.5 degree gap: outside Saturn's 2 degree transit orb, even though it'd be
    // within the Moon's 4 degree orb -- confirms orb is keyed off the transiting side.
    expect(computeTransitAspects(transiting, natal)).toEqual([]);
  });

  it("checks every transiting planet against every natal planet", () => {
    const transiting: PlanetPosition[] = [
      { planet: "Sun", longitude: 0, sign: "Aries", degreeInSign: 0, retrograde: false },
      { planet: "Mars", longitude: 90, sign: "Cancer", degreeInSign: 0, retrograde: false },
    ];
    const natal: PlanetPosition[] = [
      { planet: "Venus", longitude: 0, sign: "Aries", degreeInSign: 0, retrograde: false },
    ];
    const aspects = computeTransitAspects(transiting, natal);
    expect(aspects).toContainEqual({ a: "Sun", b: "Venus", type: "conjunction", orb: 0 });
    expect(aspects).toContainEqual({ a: "Mars", b: "Venus", type: "square", orb: 0 });
  });
});

describe("computeTransits", () => {
  it("agrees with a natal chart computed for the exact same moment", () => {
    // Reykjavik is UTC+0 year-round (no DST), so its local clock always
    // matches UTC. Deriving the reference birth data from localNoon's own
    // UTC getters (rather than a hardcoded string) keeps this test correct
    // regardless of the machine's own system time zone.
    const localNoon = new Date(2026, 9, 26, 12, 0, 0);
    const pad = (n: number) => String(n).padStart(2, "0");
    const referenceBirthData: BirthData = {
      version: 1,
      date: `${localNoon.getUTCFullYear()}-${pad(localNoon.getUTCMonth() + 1)}-${pad(localNoon.getUTCDate())}`,
      timeAccuracy: "exact",
      time: `${pad(localNoon.getUTCHours())}:${pad(localNoon.getUTCMinutes())}`,
      place: { name: "Reykjavik", lat: 64.1466, lon: -21.9426, timeZone: "Atlantic/Reykjavik" },
    };

    const natalChart = computeNatalChart(referenceBirthData);
    const transits = computeTransits(natalChart, localNoon);

    for (const planet of natalChart.planets.map((p) => p.planet)) {
      const selfAspect = transits.aspects.find((a) => a.a === planet && a.b === planet);
      expect(selfAspect?.type).toBe("conjunction");
      expect(selfAspect?.orb ?? 1).toBeLessThan(0.01);
    }

    for (const retrogradePlanet of ["Mercury", "Venus", "Mars"] as const) {
      const natalPlanet = natalChart.planets.find((p) => p.planet === retrogradePlanet);
      expect(transits.retrogradePlanets.includes(retrogradePlanet)).toBe(natalPlanet?.retrograde);
    }
  });

  it("reports today's local calendar date", () => {
    const localNoon = new Date(2026, 9, 26, 12, 0, 0);
    const natalChart = computeNatalChart({
      version: 1,
      date: "1990-06-15",
      timeAccuracy: "unknown",
      place: { name: "Reykjavik", lat: 64.1466, lon: -21.9426, timeZone: "Atlantic/Reykjavik" },
    });
    const transits = computeTransits(natalChart, localNoon);
    expect(transits.date).toBe("2026-10-26");
  });
});

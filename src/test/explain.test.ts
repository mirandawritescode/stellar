import { describe, it, expect } from "vitest";
import { explainCaution, explainGoodTheme, findDrivingPlanet, shortThemeReason } from "@/lib/astro/explain";

describe("findDrivingPlanet", () => {
  it("picks the planet from an aspect-based reason", () => {
    expect(findDrivingPlanet(["Mercury trine your Jupiter"])).toBe("Mercury");
  });

  it("skips a non-planet reason (moon phase) to find a planet-based one", () => {
    expect(
      findDrivingPlanet(["Waning moon: a good day to clear the decks.", "Mercury is retrograde."]),
    ).toBe("Mercury");
  });

  it("falls back to the Moon when nothing is planet-prefixed", () => {
    expect(findDrivingPlanet(["Waning moon: a good day to clear the decks."])).toBe("Moon");
  });

  it("falls back to the Moon for an empty reasons list", () => {
    expect(findDrivingPlanet([])).toBe("Moon");
  });
});

describe("explainGoodTheme", () => {
  it("builds a planet label, saying, and because-clause for the theme", () => {
    const result = explainGoodTheme({ theme: "admin", reasons: ["Mercury trine your Jupiter"] });
    expect(result).toEqual({
      theme: "admin",
      planetLabel: "Mercury",
      saying: "speak up",
      because: "it's a good day to review and tidy up",
    });
  });

  it("uses 'The Sun'/'The Moon' with an article, unlike other planets", () => {
    expect(explainGoodTheme({ theme: "focus", reasons: ["Sun trine your Jupiter"] }).planetLabel).toBe(
      "The Sun",
    );
    expect(explainGoodTheme({ theme: "selfcare", reasons: [] }).planetLabel).toBe("The Moon");
  });
});

describe("explainCaution", () => {
  it("builds a caution explanation using the caution because-clause", () => {
    const result = explainCaution({ theme: "money", reasons: ["Venus square your Saturn", "Venus is retrograde."] });
    expect(result).toEqual({
      theme: "money",
      planetLabel: "Venus",
      saying: "connect",
      because: "decisions may feel unclear",
    });
  });
});

describe("shortThemeReason", () => {
  it("builds a short good-polarity phrase from the category label", () => {
    expect(shortThemeReason("communication", "good")).toBe("Calls & messages is favored today");
  });

  it("builds a short caution-polarity phrase from the category label", () => {
    expect(shortThemeReason("money", "caution")).toBe("Go gently on Money today");
  });
});

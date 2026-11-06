import { TASK_CATEGORY_LABELS } from "@/lib/types";
import type { Planet, Theme } from "@/lib/types";

const ALL_PLANETS: Planet[] = [
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
];

// "The Sun"/"The Moon" read naturally with an article; the rest don't.
const PLANET_LABEL: Record<Planet, string> = {
  Sun: "The Sun",
  Moon: "The Moon",
  Mercury: "Mercury",
  Venus: "Venus",
  Mars: "Mars",
  Jupiter: "Jupiter",
  Saturn: "Saturn",
  Uranus: "Uranus",
  Neptune: "Neptune",
  Pluto: "Pluto",
};

// A short, consistent "personality" per planet — same phrase whether it's
// contributing a boost or a caution; the sentence around it (lifts/touches,
// and the because-clause) carries the actual good/gentle framing.
const PLANET_SAYING: Record<Planet, string> = {
  Sun: "think big",
  Moon: "feel it out",
  Mercury: "speak up",
  Venus: "connect",
  Mars: "take action",
  Jupiter: "go big",
  Saturn: "slow down and review",
  Uranus: "shake things up",
  Neptune: "trust your intuition",
  Pluto: "dig deeper",
};

const CATEGORY_WHY_GOOD: Record<Theme, string> = {
  focus: "your ideas and confidence flow easily",
  communication: "conversations go smoothly",
  creative: "fresh ideas come easily",
  admin: "it's a good day to review and tidy up",
  social: "your warmth draws people in",
  selfcare: "it's easier to slow down and recharge",
  money: "financial decisions feel clearer",
  action: "you have the energy to get things done",
};

const CATEGORY_WHY_CAUTION: Record<Theme, string> = {
  focus: "it's harder to concentrate",
  communication: "words may come out wrong",
  creative: "ideas may feel stuck",
  admin: "little things may slip through the cracks",
  social: "connections may feel strained",
  selfcare: "feelings may feel tender",
  money: "decisions may feel unclear",
  action: "energy may feel scattered",
};

/**
 * Finds the planet that actually drove a theme/caution entry, by scanning
 * its reason strings for one that starts with a planet name (how
 * computeDayThemes always writes aspect- and retrograde-based reasons).
 * Falls back to the Moon, since a moon-phase or "quiet day" reason is the
 * only kind that doesn't start with a planet name.
 */
export function findDrivingPlanet(reasons: string[]): Planet {
  for (const reason of reasons) {
    const word = reason.split(" ")[0];
    if ((ALL_PLANETS as string[]).includes(word)) return word as Planet;
  }
  return "Moon";
}

export interface ThemeExplanation {
  theme: Theme;
  planetLabel: string;
  saying: string;
  because: string;
}

export function explainGoodTheme(entry: { theme: Theme; reasons: string[] }): ThemeExplanation {
  const planet = findDrivingPlanet(entry.reasons);
  return {
    theme: entry.theme,
    planetLabel: PLANET_LABEL[planet],
    saying: PLANET_SAYING[planet],
    because: CATEGORY_WHY_GOOD[entry.theme],
  };
}

export function explainCaution(entry: { theme: Theme; reasons: string[] }): ThemeExplanation {
  const planet = findDrivingPlanet(entry.reasons);
  return {
    theme: entry.theme,
    planetLabel: PLANET_LABEL[planet],
    saying: PLANET_SAYING[planet],
    because: CATEGORY_WHY_CAUTION[entry.theme],
  };
}

/** A short, planet-free phrase for tight spaces (task hover, factor list). */
export function shortThemeReason(theme: Theme, polarity: "good" | "caution"): string {
  const label = TASK_CATEGORY_LABELS[theme];
  return polarity === "good" ? `${label} is favored today` : `Go gently on ${label} today`;
}

import type { Transits } from "@/lib/astro/transits";
import type { Aspect, AspectType, DayThemes, MoonPhase, Planet, Theme } from "@/lib/types";

const PLANET_THEMES: Record<Planet, Theme[]> = {
  Sun: ["focus"],
  Moon: ["selfcare"],
  Mercury: ["communication", "admin"],
  Venus: ["social", "creative", "money"],
  Mars: ["action", "focus"],
  Jupiter: ["money", "social"],
  Saturn: ["admin", "focus"],
  Uranus: ["creative"],
  Neptune: ["creative", "selfcare"],
  Pluto: ["focus"],
};

const HARMONIOUS: AspectType[] = ["trine", "sextile"];
const CHALLENGING: AspectType[] = ["square", "opposition"];

const MOON_PHASE_BOOST: Record<MoonPhase, { theme: Theme; reason: string }> = {
  new: { theme: "focus", reason: "New moon: a good day to start things." },
  waxing: { theme: "action", reason: "Waxing moon: energy is building." },
  full: { theme: "social", reason: "Full moon: a good day to finish up and review." },
  waning: { theme: "admin", reason: "Waning moon: a good day to clear the decks." },
};

const MAX_STRENGTH = 3;
const MAX_THEMES = 3;

function aspectMultiplier(aspect: Aspect): number {
  return aspect.b === "Sun" || aspect.b === "Moon" ? 2 : 1;
}

function describeAspect(aspect: Aspect): string {
  return `${aspect.a} ${aspect.type} your ${aspect.b}`;
}

class ThemeAccumulator {
  private strengths = new Map<Theme, number>();
  private reasons = new Map<Theme, string[]>();
  private cautionReasons = new Map<Theme, string[]>();

  boost(theme: Theme, amount: number, reason: string): void {
    this.strengths.set(theme, (this.strengths.get(theme) ?? 0) + amount);
    this.reasons.set(theme, [...(this.reasons.get(theme) ?? []), reason]);
  }

  flagCaution(theme: Theme, reason: string): void {
    this.cautionReasons.set(theme, [...(this.cautionReasons.get(theme) ?? []), reason]);
  }

  isEmpty(): boolean {
    return this.strengths.size === 0;
  }

  toThemeList(): { theme: Theme; strength: number; reasons: string[] }[] {
    return Array.from(this.strengths.entries())
      .map(([theme, strength]) => ({
        theme,
        strength: Math.min(strength, MAX_STRENGTH),
        reasons: this.reasons.get(theme) ?? [],
      }))
      .sort((a, b) => b.strength - a.strength)
      .slice(0, MAX_THEMES);
  }

  cautionList(): { theme: Theme; reasons: string[] }[] {
    return Array.from(this.cautionReasons.entries()).map(([theme, reasons]) => ({ theme, reasons }));
  }
}

export function computeDayThemes(transits: Transits): DayThemes {
  const acc = new ThemeAccumulator();

  for (const aspect of transits.aspects) {
    const themes = PLANET_THEMES[aspect.a];

    if (HARMONIOUS.includes(aspect.type)) {
      const amount = aspectMultiplier(aspect);
      for (const theme of themes) acc.boost(theme, amount, describeAspect(aspect));
    } else if (aspect.type === "conjunction") {
      const amount = aspectMultiplier(aspect);
      for (const theme of themes) acc.boost(theme, amount, `${describeAspect(aspect)} (intense)`);
    } else if (CHALLENGING.includes(aspect.type)) {
      for (const theme of themes) acc.flagCaution(theme, describeAspect(aspect));
    }
  }

  // Rule 9 checks in here, right after the aspect rules and before the
  // always-on moon phase / retrograde modifiers below: those two later rules
  // unconditionally boost something every single day, so checking "has
  // anything reached strength 1" after them would make this fallback
  // unreachable. Checking here makes it mean what it's meant to mean: "today
  // has no notable transiting aspects to the natal chart."
  if (acc.isEmpty()) {
    acc.boost("focus", 1, "A quiet day astrologically — good for steady, uninterrupted focus.");
    acc.boost("admin", 1, "A quiet day astrologically — a good day to clear small admin tasks.");
  }

  const moonBoost = MOON_PHASE_BOOST[transits.moonPhase];
  acc.boost(moonBoost.theme, 1, moonBoost.reason);

  if (transits.retrogradePlanets.includes("Mercury")) {
    acc.boost("admin", 1, "Mercury is retrograde: good for review and follow-up.");
    acc.flagCaution("communication", "Mercury is retrograde.");
  }
  if (transits.retrogradePlanets.includes("Venus")) {
    acc.flagCaution("money", "Venus is retrograde.");
  }
  if (transits.retrogradePlanets.includes("Mars")) {
    acc.flagCaution("action", "Mars is retrograde.");
    acc.boost("selfcare", 1, "Mars is retrograde: a good day to rest.");
  }

  return {
    date: transits.date,
    themes: acc.toThemeList(),
    caution: acc.cautionList(),
    moonPhase: transits.moonPhase,
  };
}

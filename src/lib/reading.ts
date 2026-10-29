import { TASK_CATEGORY_LABELS } from "@/lib/types";
import type { Aspect, DailyReading, DayThemes, MoonPhase, Planet, Sign, Theme } from "@/lib/types";

const VALID_THEMES: Theme[] = [
  "focus",
  "communication",
  "creative",
  "admin",
  "social",
  "selfcare",
  "money",
  "action",
];

function themeLabel(theme: Theme): string {
  return TASK_CATEGORY_LABELS[theme];
}

export function buildFallbackReading(dayThemes: DayThemes): DailyReading {
  const topThemes = dayThemes.themes.slice(0, 2).map((t) => themeLabel(t.theme));
  const themeText =
    topThemes.length === 2
      ? `${topThemes[0]} and ${topThemes[1]}`
      : (topThemes[0] ?? "a bit of everything");

  const cautionThemes = dayThemes.caution.slice(0, 2).map(themeLabel);
  const cautionText =
    cautionThemes.length > 0
      ? ` Go gently on ${cautionThemes.join(" and ")} today — smaller steps work better than big pushes.`
      : "";

  return {
    date: dayThemes.date,
    title: "Today's Quick Guide",
    reading: `Today leans toward ${themeText}. A good day to make progress on related tasks.${cautionText}`,
    tip: "Pick one task from today's top themes and knock it out first.",
    themes: dayThemes.themes.map((t) => t.theme),
    source: "fallback",
  };
}

export interface ReadingContext {
  natal: { sun: Sign; moon: Sign; rising?: Sign };
  transits: { aspects: Aspect[]; moonPhase: MoonPhase; retrogradePlanets: Planet[] };
  dayThemes: DayThemes;
  missing: string[];
}

const READING_SYSTEM_PROMPT = `You are the voice of Astro Planner, a daily planning app. Write a short daily reading from the astrological facts provided. Tone: warm and practical, lightly mystical. Ground every statement in the facts given; never invent placements or aspects. If the birth time is unknown, never mention houses or the rising sign. No predictions about health, money outcomes, or relationships ending. Return JSON only: {"title": string (max 6 words), "reading": string (80-120 words), "tip": string (one sentence linking today's themes to getting things done), "themes": array of the theme names given}.`;

export function buildReadingPrompt(context: ReadingContext): { system: string; user: string } {
  const user = JSON.stringify({
    natal: context.natal,
    transits: {
      aspects: context.transits.aspects.map(
        (a) => `${a.a} ${a.type} natal ${a.b} (orb ${a.orb.toFixed(1)}°)`,
      ),
      moonPhase: context.transits.moonPhase,
      retrogrades: context.transits.retrogradePlanets,
    },
    themes: context.dayThemes.themes,
    caution: context.dayThemes.caution,
    missing: context.missing,
  });

  return { system: READING_SYSTEM_PROMPT, user };
}

export function parseReadingResponse(raw: string, date: string): DailyReading | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object") return null;
  const obj = parsed as Record<string, unknown>;

  if (typeof obj.title !== "string" || !obj.title.trim()) return null;
  if (typeof obj.reading !== "string" || !obj.reading.trim()) return null;
  if (typeof obj.tip !== "string" || !obj.tip.trim()) return null;
  if (!Array.isArray(obj.themes)) return null;

  const themes = obj.themes.filter(
    (t): t is Theme => typeof t === "string" && VALID_THEMES.includes(t as Theme),
  );

  return {
    date,
    title: obj.title,
    reading: obj.reading,
    tip: obj.tip,
    themes,
    source: "ai",
  };
}

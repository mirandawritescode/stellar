import { shortThemeReason } from "@/lib/astro/explain";
import type { DayThemes, Task } from "@/lib/types";

export interface ScoreFactor {
  points: number;
  reason: string;
}

export interface RankedTask {
  task: Task;
  score: number;
  reason?: string;
  /** Every factor that contributed to the score, strongest first — for a full breakdown (e.g. a hover tooltip), unlike `reason` this isn't limited to the top 3 ranked tasks. */
  factors: ScoreFactor[];
}

interface ScoringFactor {
  points: number;
  priority: number;
  reason: string;
}

const OVERDUE_POINTS = 5;
const DUE_TODAY_POINTS = 4;
const DUE_SOON_POINTS = 2;
const DUE_SOON_WINDOW_DAYS = 3;
const CAUTION_POINTS = -1;
export const CAUTION_REASON = "Go gently: try a 15-minute first step";
const STALE_POINTS = 1;
const STALE_THRESHOLD_DAYS = 7;
const THEME_MATCH_MULTIPLIER = 2;

function daysBetween(a: string, b: string): number {
  const dateA = new Date(`${a}T00:00:00Z`);
  const dateB = new Date(`${b}T00:00:00Z`);
  return Math.round((dateA.getTime() - dateB.getTime()) / (1000 * 60 * 60 * 24));
}

function formatShortWeekday(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

function computeFactors(task: Task, day: DayThemes, today: string): ScoringFactor[] {
  const factors: ScoringFactor[] = [];

  if (task.dueDate) {
    const diff = daysBetween(task.dueDate, today);
    if (diff < 0) {
      factors.push({
        points: OVERDUE_POINTS,
        priority: 0,
        reason: `Overdue since ${formatShortWeekday(task.dueDate)}`,
      });
    } else if (diff === 0) {
      factors.push({ points: DUE_TODAY_POINTS, priority: 1, reason: "Due today" });
    } else if (diff <= DUE_SOON_WINDOW_DAYS) {
      factors.push({
        points: DUE_SOON_POINTS,
        priority: 2,
        reason: `Due ${formatShortWeekday(task.dueDate)}`,
      });
    }
  }

  const matchingTheme = day.themes.find((t) => t.theme === task.category);
  if (matchingTheme) {
    factors.push({
      points: matchingTheme.strength * THEME_MATCH_MULTIPLIER,
      priority: 3,
      reason: shortThemeReason(task.category, "good"),
    });
  }

  if (day.caution.some((c) => c.theme === task.category)) {
    factors.push({
      points: CAUTION_POINTS,
      priority: 4,
      reason: shortThemeReason(task.category, "caution"),
    });
  }

  if (daysBetween(today, task.createdAt.slice(0, 10)) > STALE_THRESHOLD_DAYS) {
    factors.push({ points: STALE_POINTS, priority: 5, reason: "It's been sitting a while" });
  }

  return factors;
}

export function rankTasks(tasks: Task[], day: DayThemes, today: string): RankedTask[] {
  const open = tasks.filter((t) => !t.done);

  const ranked = open.map((task) => {
    const factors = computeFactors(task, day, today);
    const score = factors.reduce((sum, f) => sum + f.points, 0);
    // The "strongest" factor (spec section 7) is the one worth the most
    // points; priority only breaks an exact point tie (see the ranking
    // logic reference doc for why: urgency reads as more concrete than
    // astrology when neither one is clearly bigger than the other).
    const topFactor = factors.reduce<ScoringFactor | undefined>((best, f) => {
      if (!best) return f;
      if (f.points !== best.points) return f.points > best.points ? f : best;
      return f.priority < best.priority ? f : best;
    }, undefined);
    const sortedFactors = [...factors]
      .sort((a, b) => b.points - a.points)
      .map(({ points, reason }) => ({ points, reason }));
    return { task, score, reason: topFactor?.reason, factors: sortedFactors };
  });

  ranked.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;

    const aDue = a.task.dueDate;
    const bDue = b.task.dueDate;
    if (aDue && bDue && aDue !== bDue) return aDue < bDue ? -1 : 1;
    if (aDue && !bDue) return -1;
    if (!aDue && bDue) return 1;

    return a.task.createdAt < b.task.createdAt ? -1 : a.task.createdAt > b.task.createdAt ? 1 : 0;
  });

  return ranked.map((r, i) => (i < 3 ? r : { task: r.task, score: r.score, reason: undefined, factors: r.factors }));
}

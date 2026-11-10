"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { DateTime } from "luxon";
import PointsChip from "@/components/PointsChip";
import TaskFormModal from "@/components/TaskFormModal";
import { computeNatalChart } from "@/lib/astro/natal";
import { computeTransits, localNoonToday } from "@/lib/astro/transits";
import { computeDayThemes } from "@/lib/astro/themes";
import { explainCaution, explainGoodTheme } from "@/lib/astro/explain";
import { CAUTION_REASON, rankTasks } from "@/lib/planner/rank";
import type { RankedTask } from "@/lib/planner/rank";
import { buildFallbackReading } from "@/lib/reading";
import type { ReadingContext } from "@/lib/reading";
import { loadBirthData } from "@/lib/storage/birthData";
import { loadCachedReading, saveCachedReading } from "@/lib/storage/reading";
import { loadTasks, saveTasks } from "@/lib/storage/tasks";
import { TASK_CATEGORY_LABELS } from "@/lib/types";
import type { BirthData, DailyReading, Task } from "@/lib/types";

type Tab = "best" | "caution" | "all";
type Tier = { label: string; muted: boolean };

function tierForPosition(index: number): Tier {
  if (index === 0) return { label: "Best", muted: false };
  if (index === 1) return { label: "Better", muted: false };
  if (index === 2) return { label: "Good", muted: false };
  return { label: "Open", muted: true };
}

// Oxford-comma joiner for the mood line: "A", "A and B", "A, B, and C".
function joinLabels(labels: string[], itemClassName: string): ReactNode[] {
  return labels.map((label, i) => {
    let separator = "";
    if (i > 0) {
      const isLast = i === labels.length - 1;
      separator = isLast ? (labels.length === 2 ? " and " : ", and ") : ", ";
    }
    return (
      <span key={label}>
        {separator}
        <span className={itemClassName}>{label}</span>
      </span>
    );
  });
}

export default function TodayPage() {
  const router = useRouter();
  const [birthData, setBirthData] = useState<BirthData | null>(null);
  const [ready, setReady] = useState(false);
  const [reading, setReading] = useState<DailyReading | null>(null);
  const [readingLoading, setReadingLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[] | undefined>(undefined);
  const [addingTask, setAddingTask] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [quoteExpanded, setQuoteExpanded] = useState(false);
  const [tab, setTab] = useState<Tab>("best");

  useEffect(() => {
    const data = loadBirthData();
    if (data) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from localStorage, a browser-only external system unavailable during SSR
      setBirthData(data);
      setReady(true);
    } else {
      router.replace("/onboarding");
    }
  }, [router]);

  const natalChart = birthData ? computeNatalChart(birthData) : null;
  const transits = natalChart ? computeTransits(natalChart, localNoonToday()) : null;
  const dayThemes = transits ? computeDayThemes(transits) : null;

  useEffect(() => {
    if (!dayThemes) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from localStorage, a browser-only external system unavailable during SSR
    setTasks(loadTasks(dayThemes.date));
    // dayThemes is a new object every render; keying off the date string
    // avoids re-running this effect (and re-reading storage) on every
    // unrelated re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayThemes?.date]);

  useEffect(() => {
    if (!dayThemes || !natalChart || !transits || !birthData) return;

    const cached = loadCachedReading(dayThemes.date);
    if (cached) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from localStorage, a browser-only external system unavailable during SSR
      setReading(cached);
      return;
    }

    const sun = natalChart.planets.find((p) => p.planet === "Sun")!;
    const moon = natalChart.planets.find((p) => p.planet === "Moon")!;

    const context: ReadingContext = {
      natal: {
        sun: sun.sign,
        moon: moon.sign,
        rising: natalChart.ascendant?.sign,
      },
      transits: {
        aspects: transits.aspects,
        moonPhase: transits.moonPhase,
        retrogradePlanets: transits.retrogradePlanets,
      },
      dayThemes,
      missing: birthData.timeAccuracy === "unknown" ? ["birthTime"] : [],
    };

    setReadingLoading(true);
    fetch("/api/reading", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(context),
    })
      .then((res) => {
        if (!res.ok) throw new Error("reading request failed");
        return res.json() as Promise<DailyReading>;
      })
      .then((result) => {
        saveCachedReading(result);
        setReading(result);
      })
      .catch(() => {
        const fallback = buildFallbackReading(dayThemes);
        saveCachedReading(fallback);
        setReading(fallback);
      })
      .finally(() => setReadingLoading(false));
    // dayThemes/natalChart/transits/birthData are recomputed fresh each
    // render; keying off the date string (and birthData's identity) avoids
    // re-fetching on every unrelated re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayThemes?.date, birthData]);

  if (!ready || !birthData || !dayThemes || tasks === undefined) {
    return (
      <div className="mx-auto flex w-full max-w-[640px] flex-1 flex-col gap-4 px-6 pt-6 nav-safe-bottom">
        <p className="text-muted text-sm">Loading...</p>
      </div>
    );
  }

  function persist(next: Task[]) {
    try {
      saveTasks(next);
      setTasks(next);
      setSaveError(null);
    } catch {
      setSaveError("Couldn't save your changes. Your browser's storage might be full or unavailable.");
    }
  }

  function handleToggleDone(task: Task) {
    if (!tasks) return;
    const willBeDone = !task.done;
    const next = tasks.map((t) =>
      t.id === task.id
        ? { ...t, done: willBeDone, completedAt: willBeDone ? new Date().toISOString() : undefined }
        : t,
    );
    persist(next);
  }

  function handleAddTask(task: Task) {
    if (!tasks) return;
    persist([...tasks, task]);
    setAddingTask(false);
  }

  function renderTaskRow(r: RankedTask, tier: { label: string; muted: boolean }, note?: string) {
    return (
      <li key={r.task.id} className="glass-card flex items-center gap-1 px-1 py-1">
        <label className="flex h-11 w-11 flex-shrink-0 items-center justify-center">
          <input
            type="checkbox"
            checked={r.task.done}
            onChange={() => handleToggleDone(r.task)}
            className="h-5 w-5"
            aria-label={`Mark "${r.task.title}" done`}
          />
        </label>
        <div className="min-h-[44px] flex-1 py-2">
          <p className="text-sm font-medium">{r.task.title}</p>
          <p className="text-muted text-xs">{TASK_CATEGORY_LABELS[r.task.category]}</p>
          {/* A gentle note (overdue, due today, ...) reads as pressure the "go
              gently" framing is explicitly trying to avoid, so it takes over
              this line instead of stacking underneath it. */}
          {note ? (
            <p className="text-muted text-xs italic">{note}</p>
          ) : (
            r.reason && <p className="text-accent text-xs">{r.reason}</p>
          )}
        </div>
        <PointsChip
          score={r.score}
          // A gentle row leaves due-date urgency out of the breakdown too,
          // not just the headline -- same reasoning as the note above.
          factors={note ? r.factors.filter((f) => f.kind !== "due") : r.factors}
          label={tier.label}
          muted={tier.muted}
        />
      </li>
    );
  }

  // A category can be both boosted (from one planet's harmonious aspect) and
  // flagged caution (from a different planet's challenging aspect) at once —
  // real, independently-tracked signals, but showing a theme as both "today's
  // theme" and "go gently" reads as a contradiction. Since it's already
  // surfaced positively above, drop it from the caution list here rather than
  // double-list it; the -1 still applies to task scoring either way.
  const topThemeKeys = new Set(dayThemes.themes.map((t) => t.theme));
  const cautionToShow = dayThemes.caution.filter((c) => !topThemeKeys.has(c.theme));

  const ranked = rankTasks(tasks, dayThemes, dayThemes.date);
  // A task's category can land it in today's caution list even when its
  // overall score is high (e.g. it's also overdue) -- that's still a real
  // "go gently" signal, so it's excluded from Best/Better/Good up front
  // rather than only checked once a task falls out of the top 3. Uses
  // cautionToShow (not the raw list) so a task never gets flagged "go
  // gently" for a category the mood line just said today favors.
  const cautionIds = new Set(
    ranked.filter((r) => cautionToShow.some((c) => c.theme === r.task.category)).map((r) => r.task.id),
  );
  const nonCautionRanked = ranked.filter((r) => !cautionIds.has(r.task.id));
  const bestForToday = nonCautionRanked.slice(0, 3);
  const badForToday = ranked.filter((r) => cautionIds.has(r.task.id));
  const tierByTaskId = new Map<string, Tier>(nonCautionRanked.map((r, i) => [r.task.id, tierForPosition(i)]));

  const goodLabels = dayThemes.themes.map((t) => TASK_CATEGORY_LABELS[t.theme]);
  const cautionLabels = cautionToShow.map((c) => TASK_CATEGORY_LABELS[c.theme]);

  const whyRows = [
    ...dayThemes.themes.map((t) => ({
      key: `good-${t.theme}`,
      badge: "lift" as const,
      explanation: explainGoodTheme(t),
    })),
    ...cautionToShow.map((c) => ({
      key: `caution-${c.theme}`,
      badge: "ease" as const,
      explanation: explainCaution(c),
    })),
  ];

  const today = DateTime.fromISO(dayThemes.date);
  const dateLabel = `${today.toFormat("cccc")} · ${today.toFormat("LLLL d")}`;

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-1 flex-col gap-4 px-6 pt-6 nav-safe-bottom">
      {saveError && <p className="text-error text-sm">{saveError}</p>}

      {addingTask && <TaskFormModal onClose={() => setAddingTask(false)} onSave={handleAddTask} />}

      <section className="flex flex-col items-center gap-2 text-center">
        <p className="section-label">{dateLabel}</p>
        <p className="text-muted text-xs">Moon phase &middot; {dayThemes.moonPhase}</p>
        <p className="text-muted text-xs italic">Let&apos;s make today stellar!</p>
        {birthData.name && <h1 className="heading-display text-xl">Hi, {birthData.name}</h1>}

        {readingLoading && !reading && <p className="text-muted text-sm">Loading today&apos;s reading...</p>}

        {reading && (
          <>
            <p className="quote-text">&ldquo;{reading.tip}&rdquo;</p>
            <button
              type="button"
              onClick={() => setQuoteExpanded((v) => !v)}
              className="text-accent text-xs font-medium"
            >
              {quoteExpanded ? "Show less ‹" : "Read the full reading ›"}
            </button>

            {quoteExpanded && (
              <div className="flex w-full flex-col gap-3 text-left">
                <p className="text-sm leading-relaxed">{reading.reading}</p>
                {whyRows.length > 0 && (
                  <ul className="flex flex-col gap-1.5">
                    {whyRows.map((row) => (
                      <li key={row.key} className="why-row">
                        <p className="text-sm">
                          <b>{row.explanation.planetLabel}</b> says {row.explanation.saying}, which{" "}
                          {row.badge === "lift" ? "lifts" : "touches"}{" "}
                          <b>{TASK_CATEGORY_LABELS[row.explanation.theme]}</b> because {row.explanation.because}.
                        </p>
                        <span className={`why-badge ${row.badge}`}>{row.badge === "lift" ? "LIFT" : "EASE"}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {reading.source === "fallback" && (
                  <p className="text-muted text-xs">
                    Today&apos;s full reading is taking a break; here&apos;s your quick guide.
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {(goodLabels.length > 0 || cautionLabels.length > 0) && (
          <p className="text-muted px-1 text-sm leading-relaxed">
            {goodLabels.length > 0 && <>Today favors {joinLabels(goodLabels, "text-accent font-medium")}</>}
            {goodLabels.length > 0 && cautionLabels.length > 0 && " — "}
            {cautionLabels.length > 0 && <>go gently on {joinLabels(cautionLabels, "italic")}</>}.
          </p>
        )}
      </section>

      <div className="flex justify-center">
        <div className="window-picker">
          <button
            type="button"
            onClick={() => setTab("best")}
            className={`window-pill ${tab === "best" ? "selected" : ""}`}
          >
            Best ({bestForToday.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("caution")}
            className={`window-pill ${tab === "caution" ? "selected" : ""}`}
          >
            Caution ({badForToday.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("all")}
            className={`window-pill ${tab === "all" ? "selected" : ""}`}
          >
            All ({ranked.length})
          </button>
        </div>
      </div>

      {ranked.length === 0 ? (
        <p className="text-muted text-sm">No open tasks yet. Add your first one to get started.</p>
      ) : (
        <>
          {tab === "best" &&
            (bestForToday.length === 0 ? (
              <p className="text-muted text-sm">No open tasks yet. Add your first one to get started.</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {bestForToday.map((r) => renderTaskRow(r, tierByTaskId.get(r.task.id)!))}
              </ul>
            ))}

          {tab === "caution" &&
            (badForToday.length === 0 ? (
              <p className="text-muted text-sm">Nothing to go gently on today.</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {badForToday.map((r) => renderTaskRow(r, { label: "Gentle", muted: true }, CAUTION_REASON))}
              </ul>
            ))}

          {tab === "all" && (
            <ul className="flex flex-col gap-1">
              {ranked.map((r) =>
                renderTaskRow(
                  r,
                  cautionIds.has(r.task.id) ? { label: "Gentle", muted: true } : tierByTaskId.get(r.task.id)!,
                  cautionIds.has(r.task.id) ? CAUTION_REASON : undefined,
                ),
              )}
            </ul>
          )}
        </>
      )}

      <p className="text-center">
        <button type="button" onClick={() => setAddingTask(true)} className="text-accent text-sm font-medium">
          + Add task
        </button>
      </p>
    </div>
  );
}

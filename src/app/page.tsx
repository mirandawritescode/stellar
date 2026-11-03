"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ArchGlyph from "@/components/ArchGlyph";
import PointsChip from "@/components/PointsChip";
import TaskFormModal from "@/components/TaskFormModal";
import { computeNatalChart } from "@/lib/astro/natal";
import { computeTransits, localNoonToday } from "@/lib/astro/transits";
import { computeDayThemes } from "@/lib/astro/themes";
import { CAUTION_REASON, rankTasks } from "@/lib/planner/rank";
import { buildFallbackReading } from "@/lib/reading";
import type { ReadingContext } from "@/lib/reading";
import { loadBirthData } from "@/lib/storage/birthData";
import { loadCachedReading, saveCachedReading } from "@/lib/storage/reading";
import { loadTasks, saveTasks } from "@/lib/storage/tasks";
import { TASK_CATEGORY_LABELS } from "@/lib/types";
import type { BirthData, DailyReading, Task } from "@/lib/types";

export default function TodayPage() {
  const router = useRouter();
  const [birthData, setBirthData] = useState<BirthData | null>(null);
  const [ready, setReady] = useState(false);
  const [reading, setReading] = useState<DailyReading | null>(null);
  const [readingLoading, setReadingLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[] | undefined>(undefined);
  const [addingTask, setAddingTask] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

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
      <div className="mx-auto flex w-full max-w-[720px] flex-1 flex-col gap-4 p-6">
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

  const ranked = rankTasks(tasks, dayThemes, dayThemes.date);
  const bestForToday = ranked.slice(0, 3);
  const remaining = ranked.slice(3);
  const badForToday = remaining.filter((r) => dayThemes.caution.includes(r.task.category));
  const badIds = new Set(badForToday.map((r) => r.task.id));
  const everythingElse = remaining.filter((r) => !badIds.has(r.task.id));

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-1 flex-col gap-4 p-6">
      {birthData.name && <h1 className="heading-display text-center text-xl">Hi, {birthData.name}</h1>}
      <p className="section-label text-center">Today &middot; {dayThemes.date}</p>

      {saveError && <p className="text-error text-sm">{saveError}</p>}

      {addingTask && <TaskFormModal onClose={() => setAddingTask(false)} onSave={handleAddTask} />}

      <section className="arch-card flex flex-col gap-2">
        <ArchGlyph />
        {readingLoading && !reading && (
          <p className="text-muted text-center text-sm">Loading today&apos;s reading...</p>
        )}
        {reading && (
          <>
            <h2 className="heading-display text-center text-xl">{reading.title}</h2>
            <p className="text-sm leading-relaxed">{reading.reading}</p>
            <p className="text-sm font-medium">{reading.tip}</p>
            {reading.source === "fallback" && (
              <p className="text-muted text-xs">
                Today&apos;s full reading is taking a break; here&apos;s your quick guide.
              </p>
            )}
          </>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="section-label">Today&apos;s themes</h2>
        <ul className="flex flex-col gap-1">
          {dayThemes.themes.map((t) => (
            <li key={t.theme} className="glass-card flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium">{TASK_CATEGORY_LABELS[t.theme]}</p>
                <p className="text-muted text-xs">{t.reasons.join("; ")}</p>
              </div>
              <span className="chip">STR {String(t.strength).padStart(2, "0")}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex items-center justify-between">
        <h2 className="section-label">Best for today</h2>
        <button type="button" onClick={() => setAddingTask(true)} className="btn">
          Add task
        </button>
      </div>

      {bestForToday.length === 0 ? (
        <p className="text-muted text-sm">No open tasks yet. Add your first one to get started.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {bestForToday.map(({ task, score, reason, factors }) => (
            <li key={task.id} className="glass-card flex items-center gap-1 px-1 py-1">
              <label className="flex h-11 w-11 flex-shrink-0 items-center justify-center">
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => handleToggleDone(task)}
                  className="h-5 w-5"
                  aria-label={`Mark "${task.title}" done`}
                />
              </label>
              <div className="min-h-[44px] flex-1 py-2">
                <p className="text-sm font-medium">{task.title}</p>
                <p className="text-muted text-xs">{TASK_CATEGORY_LABELS[task.category]}</p>
                {reason && <p className="text-accent text-xs">{reason}</p>}
              </div>
              <PointsChip score={score} factors={factors} />
            </li>
          ))}
        </ul>
      )}

      {badForToday.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="section-label">Bad for today</h2>
          <ul className="flex flex-col gap-1">
            {badForToday.map(({ task, score, factors }) => (
              <li key={task.id} className="glass-card flex items-center gap-1 px-1 py-1">
                <label className="flex h-11 w-11 flex-shrink-0 items-center justify-center">
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={() => handleToggleDone(task)}
                    className="h-5 w-5"
                    aria-label={`Mark "${task.title}" done`}
                  />
                </label>
                <div className="min-h-[44px] flex-1 py-2">
                  <p className="text-sm font-medium">{task.title}</p>
                  <p className="text-muted text-xs">{TASK_CATEGORY_LABELS[task.category]}</p>
                  <p className="text-muted text-xs italic">{CAUTION_REASON}</p>
                </div>
                <PointsChip score={score} factors={factors} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {everythingElse.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="section-label">Everything else</h2>
          <ul className="flex flex-col gap-1">
            {everythingElse.map(({ task, score, factors }) => (
              <li key={task.id} className="glass-card flex items-center gap-1 px-1 py-1">
                <label className="flex h-11 w-11 flex-shrink-0 items-center justify-center">
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={() => handleToggleDone(task)}
                    className="h-5 w-5"
                    aria-label={`Mark "${task.title}" done`}
                  />
                </label>
                <div className="min-h-[44px] flex-1 py-2">
                  <p className="text-sm">{task.title}</p>
                  <p className="text-muted text-xs">{TASK_CATEGORY_LABELS[task.category]}</p>
                </div>
                <PointsChip score={score} factors={factors} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-muted text-sm">Moon phase &middot; {dayThemes.moonPhase}</p>
    </div>
  );
}

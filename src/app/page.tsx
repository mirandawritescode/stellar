"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { computeNatalChart } from "@/lib/astro/natal";
import { computeTransits } from "@/lib/astro/transits";
import { computeDayThemes } from "@/lib/astro/themes";
import { buildFallbackReading } from "@/lib/reading";
import type { ReadingContext } from "@/lib/reading";
import { loadBirthData } from "@/lib/storage/birthData";
import { loadCachedReading, saveCachedReading } from "@/lib/storage/reading";
import { TASK_CATEGORY_LABELS } from "@/lib/types";
import type { BirthData, DailyReading } from "@/lib/types";

function localNoonToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
}

export default function TodayPage() {
  const router = useRouter();
  const [birthData, setBirthData] = useState<BirthData | null>(null);
  const [ready, setReady] = useState(false);
  const [reading, setReading] = useState<DailyReading | null>(null);
  const [readingLoading, setReadingLoading] = useState(false);

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

  if (!ready || !birthData || !dayThemes) return null;

  return (
    <div className="mx-auto flex max-w-[720px] flex-1 flex-col gap-4 p-6">
      <h1 className="text-lg font-semibold">Today</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{dayThemes.date}</p>

      <section className="flex flex-col gap-2 rounded-md border border-black/[.12] p-4 dark:border-white/[.18]">
        {readingLoading && !reading && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading today&apos;s reading...</p>
        )}
        {reading && (
          <>
            <h2 className="font-semibold">{reading.title}</h2>
            <p className="text-sm">{reading.reading}</p>
            <p className="text-sm font-medium">{reading.tip}</p>
            {reading.source === "fallback" && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Today&apos;s full reading is taking a break; here&apos;s your quick guide.
              </p>
            )}
          </>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
          Today&apos;s themes
        </h2>
        <ul className="flex flex-col gap-1">
          {dayThemes.themes.map((t) => (
            <li
              key={t.theme}
              className="rounded-md border border-black/[.12] px-3 py-2 dark:border-white/[.18]"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{TASK_CATEGORY_LABELS[t.theme]}</span>
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  Strength {t.strength}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{t.reasons.join("; ")}</p>
            </li>
          ))}
        </ul>
      </section>

      {dayThemes.caution.length > 0 && (
        <section className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
            Go gently on
          </h2>
          <p className="text-sm">
            {dayThemes.caution.map((c) => TASK_CATEGORY_LABELS[c]).join(", ")}
          </p>
        </section>
      )}

      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Moon phase: {dayThemes.moonPhase}
      </p>
    </div>
  );
}

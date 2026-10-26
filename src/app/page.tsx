"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { computeNatalChart } from "@/lib/astro/natal";
import { computeTransits } from "@/lib/astro/transits";
import { computeDayThemes } from "@/lib/astro/themes";
import { loadBirthData } from "@/lib/storage/birthData";
import { TASK_CATEGORY_LABELS } from "@/lib/types";
import type { BirthData } from "@/lib/types";

function localNoonToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
}

export default function TodayPage() {
  const router = useRouter();
  const [birthData, setBirthData] = useState<BirthData | null>(null);
  const [ready, setReady] = useState(false);

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

  if (!ready || !birthData) return null;

  const natalChart = computeNatalChart(birthData);
  const transits = computeTransits(natalChart, localNoonToday());
  const dayThemes = computeDayThemes(transits);

  return (
    <div className="mx-auto flex max-w-[720px] flex-1 flex-col gap-4 p-6">
      <h1 className="text-lg font-semibold">Today</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{dayThemes.date}</p>

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

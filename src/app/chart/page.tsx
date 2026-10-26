"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatBirthTime } from "@/lib/onboarding";
import { loadBirthData } from "@/lib/storage/birthData";
import type { BirthData } from "@/lib/types";

export default function ChartPage() {
  const [birthData, setBirthData] = useState<BirthData | null | undefined>(undefined);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from localStorage, a browser-only external system unavailable during SSR
    setBirthData(loadBirthData());
  }, []);

  if (birthData === undefined) return null;

  if (birthData === null) {
    return (
      <div className="mx-auto flex max-w-[480px] flex-1 flex-col gap-4 p-6">
        <h1 className="text-lg font-semibold">Chart</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No birth details saved yet.
        </p>
        <Link href="/onboarding" className="text-sm font-medium underline">
          Add your birth details
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[480px] flex-1 flex-col gap-4 p-6">
      <h1 className="text-lg font-semibold">Chart</h1>

      <dl className="flex flex-col gap-3">
        <div>
          <dt className="text-sm text-zinc-500 dark:text-zinc-400">Birth date</dt>
          <dd>{birthData.date}</dd>
        </div>
        <div>
          <dt className="text-sm text-zinc-500 dark:text-zinc-400">Birth time</dt>
          <dd>
            {formatBirthTime(birthData.timeAccuracy, birthData.time, birthData.approxWindow)}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-zinc-500 dark:text-zinc-400">Birth place</dt>
          <dd>{birthData.place.name}</dd>
          <dd className="text-xs text-zinc-500 dark:text-zinc-400">
            {birthData.place.lat.toFixed(4)}, {birthData.place.lon.toFixed(4)} &middot;{" "}
            {birthData.place.timeZone}
          </dd>
        </div>
      </dl>

      <Link href="/onboarding" className="text-sm font-medium underline">
        Add or fix birth details
      </Link>
    </div>
  );
}

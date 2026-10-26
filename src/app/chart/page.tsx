"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { computeNatalChart } from "@/lib/astro/natal";
import { loadBirthData } from "@/lib/storage/birthData";
import type { BirthData, NatalChart, PlanetPosition } from "@/lib/types";

const badgeClass =
  "ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-200";

function formatDegree(degreeInSign: number): string {
  const degrees = Math.floor(degreeInSign);
  const minutes = Math.round((degreeInSign - degrees) * 60);
  return `${degrees}°${minutes.toString().padStart(2, "0")}'`;
}

function moonSignLabel(moon: PlanetPosition): string {
  return moon.altSign ? `${moon.sign} or ${moon.altSign}` : moon.sign;
}

export default function ChartPage() {
  const [birthData, setBirthData] = useState<BirthData | null | undefined>(undefined);
  const [detailed, setDetailed] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from localStorage, a browser-only external system unavailable during SSR
    setBirthData(loadBirthData());
  }, []);

  if (birthData === undefined) return null;

  if (birthData === null) {
    return (
      <div className="mx-auto flex max-w-[720px] flex-1 flex-col gap-4 p-6">
        <h1 className="text-lg font-semibold">Chart</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">No birth details saved yet.</p>
        <Link href="/onboarding" className="text-sm font-medium underline">
          Add your birth details
        </Link>
      </div>
    );
  }

  const chart: NatalChart = computeNatalChart(birthData);
  const sun = chart.planets.find((p) => p.planet === "Sun")!;
  const moon = chart.planets.find((p) => p.planet === "Moon")!;
  const others = chart.planets.filter((p) => p.planet !== "Sun" && p.planet !== "Moon");
  const housesEstimated = chart.ascendant?.estimated ?? false;

  return (
    <div className="mx-auto flex max-w-[720px] flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Chart</h1>
        <button
          type="button"
          onClick={() => setDetailed((d) => !d)}
          className="min-h-[44px] rounded-md border border-black/[.12] px-3 text-sm font-medium dark:border-white/[.18]"
        >
          {detailed ? "Simple view" : "Detailed view"}
        </button>
      </div>

      <section className="flex flex-col gap-3">
        <p>
          Your Sun is in <strong>{sun.sign}</strong>
          {detailed && ` (${formatDegree(sun.degreeInSign)})`}.
        </p>
        <p>
          Your Moon is in <strong>{moonSignLabel(moon)}</strong>
          {detailed && !moon.altSign && ` (${formatDegree(moon.degreeInSign)})`}.
        </p>
        {chart.ascendant ? (
          <p>
            Your rising sign is <strong>{chart.ascendant.sign}</strong>
            {detailed && ` (${formatDegree(chart.ascendant.degreeInSign)})`}
            {housesEstimated && <span className={badgeClass}>Estimated</span>}.
          </p>
        ) : (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Rising sign isn&apos;t shown without a known birth time.
          </p>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="flex items-center text-sm font-semibold text-zinc-500 dark:text-zinc-400">
          Planets
          {housesEstimated && <span className={badgeClass}>Estimated houses</span>}
        </h2>
        <ul className="flex flex-col gap-1">
          {others.map((p) => (
            <li key={p.planet} className="flex items-center justify-between gap-2 text-sm">
              <span>{p.planet}</span>
              <span className="text-right">
                {p.sign}
                {detailed && ` ${formatDegree(p.degreeInSign)}`}
                {p.house !== undefined && ` · House ${p.house}`}
                {p.retrograde && " · Rx"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {detailed && chart.aspects.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Aspects</h2>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-zinc-500 dark:text-zinc-400">
                <th className="font-normal">Planets</th>
                <th className="font-normal">Aspect</th>
                <th className="font-normal">Orb</th>
              </tr>
            </thead>
            <tbody>
              {chart.aspects.map((a) => (
                <tr key={`${a.a}-${a.b}-${a.type}`}>
                  <td>
                    {a.a} &ndash; {a.b}
                  </td>
                  <td className="capitalize">{a.type}</td>
                  <td>{a.orb.toFixed(1)}&deg;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <Link href="/onboarding" className="text-sm font-medium underline">
        Add or fix birth details
      </Link>
    </div>
  );
}

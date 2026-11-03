"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { computeNatalChart } from "@/lib/astro/natal";
import { loadBirthData } from "@/lib/storage/birthData";
import type { BirthData, NatalChart, PlanetPosition } from "@/lib/types";

const badgeClass = "chip ml-2";

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
        <h1 className="heading-display text-lg">Chart</h1>
        <p className="text-muted text-sm">No birth details saved yet.</p>
        <Link href="/onboarding" className="text-accent text-sm font-medium underline">
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
        <h1 className="heading-display text-lg">Chart</h1>
        <button type="button" onClick={() => setDetailed((d) => !d)} className="btn">
          {detailed ? "Simple view" : "Detailed view"}
        </button>
      </div>

      <section className="glass-card flex flex-col gap-3 p-5">
        <p className="text-sm">
          Your Sun is in <strong>{sun.sign}</strong>
          {detailed && ` (${formatDegree(sun.degreeInSign)})`}.
        </p>
        <p className="text-sm">
          Your Moon is in <strong>{moonSignLabel(moon)}</strong>
          {detailed && !moon.altSign && ` (${formatDegree(moon.degreeInSign)})`}.
        </p>
        {chart.ascendant ? (
          <p className="text-sm">
            Your rising sign is <strong>{chart.ascendant.sign}</strong>
            {detailed && ` (${formatDegree(chart.ascendant.degreeInSign)})`}
            {housesEstimated && <span className={badgeClass}>Estimated</span>}.
          </p>
        ) : (
          <p className="text-muted text-sm">Rising sign isn&apos;t shown without a known birth time.</p>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="section-label flex items-center">
          Planets
          {housesEstimated && <span className={badgeClass}>Estimated houses</span>}
        </h2>
        <ul className="flex flex-col gap-1">
          {others.map((p) => (
            <li key={p.planet} className="glass-card flex items-center justify-between gap-2 px-4 py-2 text-sm">
              <span>{p.planet}</span>
              <span className="text-muted text-right">
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
        <section className="glass-card flex flex-col gap-2 p-5">
          <h2 className="section-label">Aspects</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-muted">
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
                    <td className="font-data">{a.orb.toFixed(1)}&deg;</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <Link href="/onboarding" className="text-accent text-sm font-medium underline">
        Add or fix birth details
      </Link>
    </div>
  );
}

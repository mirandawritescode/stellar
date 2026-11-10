"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ArchGlyph from "@/components/ArchGlyph";
import { clearAllData } from "@/lib/storage/reset";
import { loadThemePreference, saveThemePreference } from "@/lib/storage/theme";
import type { ThemePreference } from "@/lib/storage/theme";

export default function SettingsPage() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemePreference | undefined>(undefined);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from localStorage, a browser-only external system unavailable during SSR
    setTheme(loadThemePreference());
  }, []);

  function handleThemeChange(next: ThemePreference) {
    setTheme(next);
    saveThemePreference(next);
  }

  function handleReset() {
    try {
      clearAllData();
      router.push("/onboarding");
    } catch {
      setResetError("Couldn't clear your data. Try again, or clear your browser's site data manually.");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-1 flex-col gap-4 px-6 pt-6 nav-safe-bottom">
      <h1 className="heading-display text-center text-lg">Settings</h1>

      <section className="arch-card mx-auto flex w-full max-w-[360px] flex-col items-center gap-3 text-center">
        <ArchGlyph />
        <p className="section-label">Data</p>
        <h2 className="heading-display text-lg">Start fresh</h2>
        {resetError && <p className="text-error text-sm">{resetError}</p>}
        {confirming ? (
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm">
              This deletes your birth details, tasks, and cached readings from this browser. This
              can&apos;t be undone.
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={handleReset} className="btn text-error">
                Yes, delete everything
              </button>
              <button type="button" onClick={() => setConfirming(false)} className="btn">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirming(true)} className="btn">
            Delete all my data
          </button>
        )}
      </section>

      <section className="glass-card mx-auto flex w-full max-w-[360px] flex-col items-center gap-3 p-5 text-center">
        <p className="section-label">Appearance</p>
        {theme !== undefined && (
          <div className="window-picker w-full max-w-[260px]">
            <button
              type="button"
              onClick={() => handleThemeChange("auto")}
              aria-pressed={theme === "auto"}
              className={`window-pill ${theme === "auto" ? "selected" : ""}`}
            >
              Auto
            </button>
            <button
              type="button"
              onClick={() => handleThemeChange("light")}
              aria-pressed={theme === "light"}
              className={`window-pill ${theme === "light" ? "selected" : ""}`}
            >
              Day
            </button>
            <button
              type="button"
              onClick={() => handleThemeChange("dark")}
              aria-pressed={theme === "dark"}
              className={`window-pill ${theme === "dark" ? "selected" : ""}`}
            >
              Night
            </button>
          </div>
        )}
        <p className="text-muted text-xs">Auto follows your system&apos;s light/dark setting.</p>
      </section>

      <section className="glass-card mx-auto flex w-full max-w-[360px] flex-col items-center gap-2 p-5 text-center">
        <p className="section-label">About</p>
        <p className="text-sm">
          Stellar reads your natal chart and the day&apos;s transits, writes a short daily reading,
          and ranks your to-do list for the day. Everything stays in your browser.
        </p>
        <p className="text-muted text-xs">
          Place search &copy; OpenStreetMap contributors. Chart calculations by
          circular-natal-horoscope-js. Readings generated with Groq.
        </p>
      </section>
    </div>
  );
}

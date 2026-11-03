"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ArchGlyph from "@/components/ArchGlyph";
import { clearAllData } from "@/lib/storage/reset";

export default function SettingsPage() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  function handleReset() {
    try {
      clearAllData();
      router.push("/onboarding");
    } catch {
      setResetError("Couldn't clear your data. Try again, or clear your browser's site data manually.");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-1 flex-col gap-4 p-6">
      <h1 className="heading-display text-lg">Settings</h1>

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
    </div>
  );
}

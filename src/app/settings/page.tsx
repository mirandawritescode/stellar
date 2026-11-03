"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clearAllData } from "@/lib/storage/reset";

export default function SettingsPage() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  function handleReset() {
    clearAllData();
    router.push("/onboarding");
  }

  return (
    <div className="mx-auto flex max-w-[720px] flex-1 flex-col gap-4 p-6">
      <h1 className="heading-display text-lg">Settings</h1>

      <section className="glass-card flex flex-col gap-3 p-5">
        <h2 className="section-label">Data</h2>
        {confirming ? (
          <div className="flex flex-col gap-3">
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

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadBirthData } from "@/lib/storage/birthData";

export default function TodayPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loadBirthData()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from localStorage, a browser-only external system unavailable during SSR
      setReady(true);
    } else {
      router.replace("/onboarding");
    }
  }, [router]);

  if (!ready) return null;

  return <h1>Today</h1>;
}

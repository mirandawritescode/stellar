"use client";

import { useEffect } from "react";

/**
 * Registered in production only -- a service worker intercepting navigation
 * during local dev fights with Next's own hot-reloading (stale cached pages
 * instead of your latest change).
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Offline fallback is a nice-to-have, not critical -- fail quietly.
      });
    }
  }, []);

  return null;
}

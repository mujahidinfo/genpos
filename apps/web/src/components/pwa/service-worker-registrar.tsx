"use client";

import { useEffect } from "react";

/**
 * Registers /sw.js, which is what makes the app installable (a manifest alone
 * is not enough for Chrome's install criteria).
 *
 * Registration is skipped in development: an active worker caching /_next/static
 * fights the dev server's HMR chunks and produces stale-asset errors.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Registration failures are non-fatal — the app works without it,
        // it just isn't installable.
      });
    };

    // Wait for load so the worker never competes with the first paint.
    if (document.readyState === "complete") register();
    else {
      window.addEventListener("load", register);
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}

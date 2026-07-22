"use client";

import { useEffect } from "react";

export function RegistroServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    void navigator.serviceWorker.register("/sw.js").catch(() => {
      /* registro opcional; la app sigue funcionando sin SW */
    });
  }, []);

  return null;
}

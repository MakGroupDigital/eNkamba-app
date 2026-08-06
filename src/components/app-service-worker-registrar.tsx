"use client";

import { useEffect } from "react";

export function AppServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const registerWorker = async () => {
      try {
        await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      } catch (error) {
        console.warn("Service worker eNkamba indisponible:", error);
      }
    };

    void registerWorker();
  }, []);

  return null;
}

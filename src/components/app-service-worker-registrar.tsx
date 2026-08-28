"use client";

import { useEffect } from "react";

export function AppServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const registerWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        await registration.update();
      } catch (error) {
        console.warn("Service worker Kenz indisponible:", error);
      }
    };

    void registerWorker();
  }, []);

  return null;
}

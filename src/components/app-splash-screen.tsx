"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

import { ResponsiveSplashBackground } from "@/components/shared/responsive-splash-background";
import { hasNativeCallAccess, isCallRoute } from "@/lib/native-call-access";

const SPLASH_DURATION_MS = 1800;
const SPLASH_FADE_MS = 320;

export function AppSplashScreen() {
  const pathname = usePathname();
  const isNativeAcceptedCallRoute = useMemo(
    () => {
      if (typeof window === "undefined" || !isCallRoute(pathname)) return false;
      const params = new URLSearchParams(window.location.search);
      return params.get("nativeAccepted") === "1" && Boolean(params.get("callId"));
    },
    [pathname],
  );
  const shouldSkipSplash = isNativeAcceptedCallRoute || hasNativeCallAccess(pathname);
  const [visible, setVisible] = useState(() => !shouldSkipSplash);
  const [mounted, setMounted] = useState(() => !shouldSkipSplash);

  useEffect(() => {
    if (shouldSkipSplash) {
      setVisible(false);
      setMounted(false);
      return;
    }

    const hideTimer = window.setTimeout(() => {
      setVisible(false);
    }, SPLASH_DURATION_MS);

    const unmountTimer = window.setTimeout(() => {
      setMounted(false);
    }, SPLASH_DURATION_MS + SPLASH_FADE_MS);

    return () => {
      window.clearTimeout(hideTimer);
      window.clearTimeout(unmountTimer);
    };
  }, [shouldSkipSplash]);

  if (!mounted) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-[#073B9A] transition-opacity duration-300 ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!visible}
    >
      <div className="relative h-full w-full overflow-hidden">
        <ResponsiveSplashBackground showOverlay={false} />
      </div>
    </div>
  );
}

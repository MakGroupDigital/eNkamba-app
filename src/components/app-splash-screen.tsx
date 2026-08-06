"use client";

import { useEffect, useState } from "react";

import { ResponsiveSplashBackground } from "@/components/shared/responsive-splash-background";
import { hasNativeCallAccess } from "@/lib/native-call-access";

const SPLASH_DURATION_MS = 1800;
const SPLASH_FADE_MS = 320;

export function AppSplashScreen() {
  const [visible, setVisible] = useState(() => !hasNativeCallAccess());
  const [mounted, setMounted] = useState(() => !hasNativeCallAccess());

  useEffect(() => {
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
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-[#0A8B46] transition-opacity duration-300 ${
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

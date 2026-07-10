"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const SPLASH_DURATION_MS = 1800;
const SPLASH_FADE_MS = 320;

export function AppSplashScreen() {
  const [visible, setVisible] = useState(true);
  const [mounted, setMounted] = useState(true);

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
        <Image
          src="/splachone.jpeg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover md:hidden"
          priority
        />
        <Image
          src="/splachone-desktop.jpeg"
          alt=""
          fill
          sizes="100vw"
          className="hidden object-cover md:block"
          priority
        />
      </div>
    </div>
  );
}

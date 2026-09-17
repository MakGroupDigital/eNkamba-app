"use client";

import { useEffect, useRef } from "react";
import type { AnimationItem } from "lottie-web";

import infinityAnimation from "@/assets/animations/kenz-infinity-loader.json";
import { cn } from "@/lib/utils";

type KenzDataLoaderProps = {
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = {
  sm: "h-12 w-16",
  md: "h-20 w-28",
  lg: "h-28 w-40",
} as const;

/** Chargement réservé aux vues qui attendent réellement des données. */
export function KenzDataLoader({
  label = "Chargement des données...",
  size = "md",
  className,
}: KenzDataLoaderProps) {
  const animationContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animation: AnimationItem | undefined;
    let disposed = false;

    const loadAnimation = async () => {
      const { default: lottie } = await import("lottie-web");
      if (disposed || !animationContainerRef.current) return;

      animation = lottie.loadAnimation({
        container: animationContainerRef.current,
        renderer: "svg",
        loop: true,
        autoplay: true,
        animationData: infinityAnimation,
      });
    };

    void loadAnimation();
    return () => {
      disposed = true;
      animation?.destroy();
    };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("flex flex-col items-center justify-center gap-2 text-center", className)}
    >
      <div
        ref={animationContainerRef}
        className={sizes[size]}
        aria-hidden="true"
      />
      {label && <p className="text-sm font-semibold text-current/75">{label}</p>}
    </div>
  );
}

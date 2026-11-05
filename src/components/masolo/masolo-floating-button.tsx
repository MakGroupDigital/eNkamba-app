"use client";

import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MasoloFloatingButtonProps {
  onOpenChange?: (isOpen: boolean) => void;
}

// Compact 48px target (WCAG 2.5.8 / Android 48dp) with no glow overflowing onto nearby content.
export default function MasoloFloatingButton({ onOpenChange }: MasoloFloatingButtonProps) {
  const reduceMotion = useReducedMotion();

  return (
    <Link href="/dashboard/ai" aria-label="Ouvrir l'assistant IA Kenz" title="Assistant IA Kenz">
      <motion.div
        whileHover={reduceMotion ? undefined : { scale: 1.05 }}
        whileTap={reduceMotion ? undefined : { scale: 0.95 }}
        className={cn(
          "relative flex h-12 w-12 cursor-pointer items-center justify-center rounded-full",
          "bg-[#073B9A] shadow-lg shadow-[#073B9A]/30 ring-2 ring-white"
        )}
      >
        <span className="text-2xl font-bold leading-none text-white font-headline" aria-hidden="true">
          e
        </span>
        <span
          className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-[#073B9A] text-[8px] font-bold text-white"
          aria-hidden="true"
        >
          AI
        </span>
      </motion.div>
    </Link>
  )
}

"use client";

import Link from "next/link"
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MasoloFloatingButtonProps {
  onOpenChange?: (isOpen: boolean) => void;
}

export default function MasoloFloatingButton({ onOpenChange }: MasoloFloatingButtonProps) {
  return (
    <Link href="/dashboard/ai">
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative h-16 w-16 cursor-pointer"
        aria-label="Ouvrir eNkamba.AI"
      >
        {/* Cercle extérieur animé - Glow */}
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 rounded-full bg-[#32BB78] blur-xl"
        />
        
        {/* Cercle intermédiaire - Anneau rotatif */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ 
            duration: 8, 
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(
              from 0deg,
              transparent 0deg,
              #32BB78 90deg,
              transparent 180deg,
              #32BB78 270deg,
              transparent 360deg
            )`,
            padding: '2px',
          }}
        >
          <div className="h-full w-full rounded-full bg-background" />
        </motion.div>
        
        {/* Cercle principal - Bouton */}
        <motion.div
          className={cn(
            "absolute inset-1 rounded-full",
            "bg-gradient-to-br from-[#32BB78] via-[#28a86a] to-[#1e9f5e]",
            "flex items-center justify-center",
            "shadow-2xl shadow-[#32BB78]/50",
            "border-2 border-[#32BB78]/30"
          )}
        >
          {/* Effet de brillance */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 via-transparent to-transparent" />
          
          {/* Lettre "e" */}
          <motion.div
            animate={{ 
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="relative z-10"
          >
            <span className="text-4xl font-bold text-white drop-shadow-lg font-headline">
              e
            </span>
          </motion.div>
          
          {/* Particules flottantes */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: [-20, -40, -20],
                x: [0, (i - 1) * 10, 0],
                opacity: [0, 1, 0],
                scale: [0, 1, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.6,
                ease: "easeOut"
              }}
              className="absolute top-0 left-1/2 -translate-x-1/2"
            >
              <div className="h-1 w-1 rounded-full bg-white" />
            </motion.div>
          ))}
        </motion.div>
        
        {/* Badge "AI" */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={cn(
            "absolute -bottom-1 -right-1",
            "h-6 w-6 rounded-full",
            "bg-gradient-to-br from-[#32BB78] to-[#1e9f5e]",
            "flex items-center justify-center",
            "border-2 border-background",
            "shadow-lg"
          )}
        >
          <span className="text-[9px] font-bold text-white">AI</span>
        </motion.div>
        
        {/* Pulse ring */}
        <motion.div
          animate={{ 
            scale: [1, 1.5, 1],
            opacity: [0.5, 0, 0.5]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: "easeOut"
          }}
          className="absolute inset-0 rounded-full border-2 border-[#32BB78]"
        />
      </motion.div>
    </Link>
  )
}

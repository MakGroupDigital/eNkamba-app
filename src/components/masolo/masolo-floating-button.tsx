"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { X } from "lucide-react"
import Link from "next/link"
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  ChatNavIcon,
  PaymentNavIcon,
  ShopNavIcon,
  LogisticsNavIcon,
  SocialNavIcon,
  AINavIcon,
} from "@/components/icons/service-icons";

// Icône personnalisée pour Miyiki-Chat
const MiyikiIcon = ({ size = 24, className = "" }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="miyikiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fff" />
        <stop offset="100%" stopColor="#fff" stopOpacity="0.8" />
      </linearGradient>
    </defs>
    {/* Bulle principale */}
    <path d="M8 10H36C38.2 10 40 11.8 40 14V30C40 32.2 38.2 34 36 34H18L10 42V34H8C5.8 34 4 32.2 4 30V14C4 11.8 5.8 10 8 10Z" fill="url(#miyikiGrad)" />
    {/* Visage souriant */}
    <circle cx="16" cy="22" r="2" fill="#32BB78" />
    <circle cx="28" cy="22" r="2" fill="#32BB78" />
    <path d="M16 28C16 28 20 32 28 28" stroke="#32BB78" strokeWidth="2" strokeLinecap="round" fill="none" />
    {/* Étoile AI */}
    <circle cx="40" cy="12" r="6" fill="#FF8C00" />
    <path d="M40 8L41 11L44 10L42 12L44 14L41 13L40 16L39 13L36 14L38 12L36 10L39 11L40 8Z" fill="#fff" />
  </svg>
);

// Icône Écosystème
const EcosystemIcon = ({ size = 24, className = "" }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="ecoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#32BB78" />
        <stop offset="100%" stopColor="#0E5A59" />
      </linearGradient>
    </defs>
    {/* Cercle central */}
    <circle cx="24" cy="24" r="8" fill="url(#ecoGrad)" />
    {/* Orbites */}
    <circle cx="24" cy="24" r="16" stroke="#32BB78" strokeWidth="1.5" fill="none" strokeDasharray="4 2" opacity="0.5" />
    {/* Points satellites */}
    <circle cx="24" cy="8" r="4" fill="#FF8C00" />
    <circle cx="38" cy="18" r="4" fill="#32BB78" />
    <circle cx="38" cy="32" r="4" fill="#0E5A59" />
    <circle cx="24" cy="40" r="4" fill="#9C27B0" />
    <circle cx="10" cy="32" r="4" fill="#4FC3F7" />
    <circle cx="10" cy="18" r="4" fill="#FF8C00" />
    {/* Connexions */}
    <line x1="24" y1="16" x2="24" y2="12" stroke="#32BB78" strokeWidth="1" opacity="0.5" />
    <line x1="30" y1="20" x2="34" y2="18" stroke="#32BB78" strokeWidth="1" opacity="0.5" />
  </svg>
);

const chatSections = [
  { 
    label: "Accueil Écosystème", 
    icon: EcosystemIcon, 
    href: "/ecosystem",
    color: "from-emerald-500 to-teal-600",
    description: "Vue d'ensemble"
  },
  { 
    label: "ChatMbongo", 
    icon: PaymentNavIcon, 
    href: "/dashboard/miyiki-chat",
    color: "from-green-500 to-emerald-600",
    description: "Finance & Paiements"
  },
  { 
    label: "ChatNkampa", 
    icon: ShopNavIcon, 
    href: "/dashboard/miyiki-chat",
    color: "from-orange-500 to-amber-600",
    description: "E-commerce"
  },
  { 
    label: "ChatUgavi", 
    icon: LogisticsNavIcon, 
    href: "/dashboard/miyiki-chat",
    color: "from-blue-500 to-indigo-600",
    description: "Logistique"
  },
  { 
    label: "ChatMakutano", 
    icon: SocialNavIcon, 
    href: "/dashboard/miyiki-chat",
    color: "from-purple-500 to-pink-600",
    description: "Réseau Social"
  },
  { 
    label: "eNkamba.AI", 
    icon: AINavIcon, 
    href: "/dashboard/ai",
    color: "from-rose-500 to-red-600",
    description: "Assistant IA"
  },
];

interface MasoloFloatingButtonProps {
  onOpenChange?: (isOpen: boolean) => void;
}

export default function MasoloFloatingButton({ onOpenChange }: MasoloFloatingButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    onOpenChange?.(open);
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "relative h-16 w-16 rounded-full shadow-2xl transition-all duration-300",
            "bg-gradient-to-br from-primary via-primary to-green-800",
            "flex items-center justify-center",
            "focus:outline-none focus:ring-4 focus:ring-primary/30",
            isOpen && "rotate-180"
          )}
          aria-label="Ouvrir le chat Miyiki"
        >
          {/* Effet de glow */}
          <div className="absolute inset-0 rounded-full bg-primary/50 blur-xl opacity-60 animate-pulse" />
          
          {/* Cercles décoratifs animés */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-full border-2 border-white/20"
          />
          
          {/* Icône */}
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -180, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 180, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <X className="h-8 w-8 text-white relative z-10" />
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ rotate: 180, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -180, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <MiyikiIcon size={36} className="relative z-10" />
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Badge notification */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-accent flex items-center justify-center"
          >
            <span className="text-[10px] font-bold text-white">3</span>
          </motion.div>
        </motion.button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-80 mr-4 mb-2 p-0 border-0 shadow-2xl rounded-3xl overflow-hidden bg-transparent" 
        side="top" 
        align="end"
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="bg-background/95 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden"
        >
          {/* Header avec gradient */}
          <div className="relative p-5 bg-gradient-to-br from-primary via-primary to-green-800 overflow-hidden">
            {/* Pattern décoratif */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
            </div>
            
            <div className="relative flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                <ChatNavIcon size={28} className="text-white" />
              </div>
              <div>
                <h4 className="font-headline text-lg font-bold text-white">Miyiki-Chat</h4>
                <p className="text-sm text-white/70">Messagerie unifiée eNkamba</p>
              </div>
            </div>
          </div>
          
          {/* Liste des sections */}
          <div className="p-3 space-y-1">
            {chatSections.map((section, index) => {
              const IconComponent = section.icon;
              return (
                <motion.div
                  key={section.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    href={section.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-2xl",
                      "hover:bg-gradient-to-r hover:from-muted/50 hover:to-transparent",
                      "transition-all duration-300 group"
                    )}
                  >
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center",
                      "bg-gradient-to-br",
                      section.color,
                      "group-hover:scale-110 transition-transform duration-300"
                    )}>
                      <IconComponent size={22} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <span className="font-semibold text-sm text-foreground block">
                        {section.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {section.description}
                      </span>
                    </div>
                    <motion.div
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      whileHover={{ x: 5 }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                        <path d="M9 18l6-6-6-6"/>
                      </svg>
                    </motion.div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
          
          {/* Footer */}
          <div className="px-4 py-3 bg-muted/30 border-t border-border/50">
            <p className="text-xs text-center text-muted-foreground">
              💬 Discutez avec vos contacts sur toutes les plateformes
            </p>
          </div>
        </motion.div>
      </PopoverContent>
    </Popover>
  )
}

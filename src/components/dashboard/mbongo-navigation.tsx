'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HomeNavIcon,
  WalletNavIcon,
  HistoryNavIcon,
  ReportNavIcon,
} from '@/components/icons/service-icons';

const mbongoNavItems = [
  { 
    name: 'Accueil', 
    icon: HomeNavIcon, 
    href: '/dashboard/mbongo-dashboard',
    gradient: 'from-emerald-500 to-teal-600'
  },
  { 
    name: 'Wallet', 
    icon: WalletNavIcon, 
    href: '/dashboard/wallet',
    gradient: 'from-orange-500 to-amber-600'
  },
  { 
    name: 'Historique', 
    icon: HistoryNavIcon, 
    href: '/dashboard/history',
    gradient: 'from-blue-500 to-indigo-600'
  },
  { 
    name: 'Rapport IA', 
    icon: ReportNavIcon, 
    href: '/dashboard/report',
    gradient: 'from-purple-500 to-pink-600'
  },
];

export default function MbongoNavigation() {
  const pathname = usePathname();

  return (
    <motion.nav 
      initial={{ y: 100, opacity: 0, scale: 0.8 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.3 }}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30"
    >
      {/* Conteneur principal avec effet glassmorphism premium */}
      <div className="relative">
        {/* Glow effect derrière */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 blur-xl opacity-60" />
        
        {/* Barre de navigation */}
        <div className="relative flex h-16 items-center justify-center gap-2 rounded-full bg-background/80 px-3 shadow-2xl backdrop-blur-xl border border-white/10 dark:border-white/5">
          {/* Effet de brillance */}
          <div className="absolute inset-x-4 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          
          {mbongoNavItems.map((item, index) => {
            const isActive = pathname === item.href;
            const IconComponent = item.icon;
            
            return (
              <Link href={item.href} key={item.name}>
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + index * 0.1, type: 'spring' }}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    'relative flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300',
                    isActive
                      ? `bg-gradient-to-br ${item.gradient} text-white shadow-lg`
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                  title={item.name}
                >
                  {/* Effet de pulsation pour l'élément actif */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ scale: 1, opacity: 0.5 }}
                        animate={{ scale: 1.5, opacity: 0 }}
                        exit={{ scale: 1, opacity: 0 }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className={cn(
                          "absolute inset-0 rounded-full bg-gradient-to-br",
                          item.gradient
                        )}
                      />
                    )}
                  </AnimatePresence>
                  
                  {/* Icône */}
                  <IconComponent 
                    size={isActive ? 26 : 22} 
                    className={cn(
                      "relative z-10 transition-all duration-300",
                      isActive ? "drop-shadow-md" : ""
                    )}
                  />
                  
                  {/* Badge indicateur actif */}
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-4 rounded-full bg-white/80"
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
      
      {/* Label flottant pour l'élément actif */}
      <AnimatePresence mode="wait">
        {mbongoNavItems.map((item) => {
          const isActive = pathname === item.href;
          if (!isActive) return null;
          
          return (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap"
            >
              <span className={cn(
                "px-3 py-1 rounded-full text-xs font-medium text-white shadow-lg",
                `bg-gradient-to-r ${item.gradient}`
              )}>
                {item.name}
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.nav>
  );
}

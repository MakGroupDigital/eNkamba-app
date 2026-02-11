'use client';

import { cn } from '@/lib/utils';
import { Dispatch, SetStateAction } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ChatNavIcon,
  ShopNavIcon,
  LogisticsNavIcon,
  PaymentNavIcon,
  EStreamNavIcon,
  SocialNavIcon,
  AINavIcon,
  SettingsNavIcon,
} from '@/components/icons/service-icons';

const navItems = [
  { name: 'Chat', icon: ChatNavIcon, href: '/dashboard/miyiki-chat', color: '#32BB78' },
  { name: 'E-comm', icon: ShopNavIcon, href: '/dashboard/nkampa', color: '#FF8C00' },
  { name: 'Logistique', icon: LogisticsNavIcon, href: '/dashboard/ugavi', color: '#0E5A59' },
  { name: 'Paiement', icon: PaymentNavIcon, href: '/dashboard/mbongo-dashboard', color: '#32BB78' },
  { name: 'eStream', icon: EStreamNavIcon, href: '/dashboard/estream', color: '#FF6B6B' },
  { name: 'Connexion', icon: SocialNavIcon, href: '/dashboard/makutano', color: '#9C27B0' },
  { name: 'Paramètres', icon: SettingsNavIcon, href: '/dashboard/settings', color: '#666' },
];

interface HubNavigationProps {
  activeTab: string;
  setActiveTab: Dispatch<SetStateAction<string>>;
}

export default function HubNavigation({
  activeTab,
  setActiveTab,
}: HubNavigationProps) {
  const router = useRouter();

  const handleNav = (tabName: string, href: string) => {
    setActiveTab(tabName);
    router.push(href);
  };

  return (
    <motion.nav 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      className="fixed bottom-0 left-0 right-0 z-20"
    >
      {/* Fond avec effet glassmorphism */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/95 to-background/80 backdrop-blur-xl" />
      
      {/* Bordure supérieure avec dégradé */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      
      <div className="relative mx-auto max-w-lg px-2 py-2 md:py-3">
        <div className="grid h-16 grid-cols-7 items-stretch gap-1 md:h-20">
          {navItems.map((item, index) => {
            const isActive = activeTab === item.name;
            const IconComponent = item.icon;
            
            return (
              <motion.button
                key={item.name}
                onClick={() => handleNav(item.name, item.href)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-1 rounded-2xl text-xs font-medium transition-all duration-300',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {/* Indicateur actif */}
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute inset-0 rounded-2xl bg-primary/10"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                
                {/* Icône avec animation */}
                <motion.div
                  className="relative z-10"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <IconComponent 
                    size={isActive ? 28 : 24} 
                    className={cn(
                      "transition-all duration-300",
                      isActive ? "drop-shadow-lg" : ""
                    )}
                  />
                  
                  {/* Point lumineux pour l'état actif */}
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-accent shadow-lg shadow-accent/50"
                    />
                  )}
                </motion.div>
                
                {/* Label avec animation */}
                <motion.span 
                  className={cn(
                    "relative z-10 text-[10px] md:text-xs truncate max-w-full px-1",
                    isActive ? "font-semibold" : "font-normal"
                  )}
                  animate={{ 
                    opacity: isActive ? 1 : 0.7,
                  }}
                >
                  {item.name}
                </motion.span>
              </motion.button>
            );
          })}
        </div>
      </div>
      
      {/* Safe area pour les appareils avec encoche */}
      <div className="h-safe-area-inset-bottom bg-background" />
    </motion.nav>
  );
}

import React from 'react';
import { cn } from '@/lib/utils';

interface IconProps {
  className?: string;
  size?: number;
}

// ==================== ICÔNES NAVIGATION NKAMPA MODERNES ====================
// Style: Dégradés, détails, effets modernes comme les icônes de transaction

// Boutique - Sac de shopping moderne avec détails
export const NkampaNavShopIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="shopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    {/* Sac de shopping */}
    <path d="M10 16L8 40C8 42 9 44 11 44H37C39 44 40 42 40 40L38 16" fill="url(#shopGrad)" />
    {/* Poignées du sac */}
    <path d="M14 16C14 10 18 6 24 6C30 6 34 10 34 16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
    {/* Détails du sac */}
    <rect x="12" y="20" width="24" height="3" rx="1.5" fill="#479B67" opacity="0.6" />
    {/* Tag de prix */}
    <circle cx="24" cy="30" r="6" fill="#FFD700" />
    <text x="24" y="33" textAnchor="middle" fontSize="8" fill="#479B67" fontWeight="bold">%</text>
    {/* Sparkles */}
    <circle cx="16" cy="12" r="2" fill="#479B67" opacity="0.7" />
    <circle cx="32" cy="12" r="2" fill="#479B67" opacity="0.7" />
    <circle cx="38" cy="24" r="1.5" fill="#FFD700" opacity="0.8" />
  </svg>
);

// Commandes - Liste avec check moderne
export const NkampaNavOrdersIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="ordersGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2196F3" />
        <stop offset="100%" stopColor="#1565C0" />
      </linearGradient>
    </defs>
    {/* Document/Liste */}
    <rect x="10" y="6" width="28" height="36" rx="3" fill="url(#ordersGrad)" />
    {/* En-tête du document */}
    <rect x="14" y="10" width="20" height="4" rx="2" fill="#1565C0" />
    {/* Lignes de commande avec checks */}
    <circle cx="16" cy="20" r="3" fill="#479B67" />
    <path d="M14.5 20L15.5 21L17.5 19" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="22" y="18" width="12" height="2" rx="1" fill="#fff" opacity="0.8" />
    <rect x="22" y="21" width="8" height="1.5" rx="0.75" fill="#fff" opacity="0.5" />
    
    <circle cx="16" cy="28" r="3" fill="#479B67" />
    <path d="M14.5 28L15.5 29L17.5 27" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="22" y="26" width="12" height="2" rx="1" fill="#fff" opacity="0.8" />
    <rect x="22" y="29" width="8" height="1.5" rx="0.75" fill="#fff" opacity="0.5" />
    
    <circle cx="16" cy="36" r="3" fill="#FFD700" />
    <text x="16" y="38" textAnchor="middle" fontSize="5" fill="#1565C0" fontWeight="bold">!</text>
    <rect x="22" y="34" width="12" height="2" rx="1" fill="#fff" opacity="0.8" />
    <rect x="22" y="37" width="8" height="1.5" rx="0.75" fill="#fff" opacity="0.5" />
    {/* Badge de notification */}
    <circle cx="36" cy="8" r="5" fill="#E53935" />
    <text x="36" y="10.5" textAnchor="middle" fontSize="6" fill="#fff" fontWeight="bold">3</text>
  </svg>
);

// Favoris - Cœur moderne avec effet brillant
export const NkampaNavFavoritesIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="favGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E91E63" />
        <stop offset="100%" stopColor="#C2185B" />
      </linearGradient>
    </defs>
    {/* Cœur principal */}
    <path 
      d="M24 42C24 42 6 32 6 18C6 12 10 8 15 8C18 8 21 10 24 13C27 10 30 8 33 8C38 8 42 12 42 18C42 32 24 42 24 42Z" 
      fill="url(#favGrad)" 
    />
    {/* Reflet brillant */}
    <path 
      d="M16 14C18 12 20 12 22 14" 
      stroke="#fff" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      opacity="0.6" 
    />
    {/* Sparkles autour */}
    <circle cx="10" cy="12" r="2" fill="#FFD700" />
    <path d="M10 10V14M8 12H12" stroke="#FFD700" strokeWidth="1" />
    
    <circle cx="38" cy="14" r="2" fill="#FFD700" />
    <path d="M38 12V16M36 14H40" stroke="#FFD700" strokeWidth="1" />
    
    <circle cx="14" cy="36" r="1.5" fill="#E91E63" opacity="0.6" />
    <circle cx="34" cy="36" r="1.5" fill="#E91E63" opacity="0.6" />
    {/* Petit cœur flottant */}
    <path d="M32 10C32 10 30 8 28 10C26 8 24 10 24 12C24 14 28 16 28 16C28 16 32 14 32 12C32 10 32 10 32 10Z" fill="#FFD700" opacity="0.8" />
  </svg>
);

// Ma boutique / Créer boutique - Storefront moderne
export const NkampaNavSellerIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="sellerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF8C00" />
        <stop offset="100%" stopColor="#E67E00" />
      </linearGradient>
    </defs>
    {/* Bâtiment de la boutique */}
    <rect x="8" y="20" width="32" height="24" rx="2" fill="url(#sellerGrad)" />
    {/* Toit/Auvent */}
    <path d="M4 20L24 8L44 20" fill="#E67E00" />
    <path d="M6 20H42V24H6Z" fill="#C66900" />
    {/* Rayures de l'auvent */}
    <rect x="10" y="20" width="3" height="4" fill="#fff" opacity="0.3" />
    <rect x="16" y="20" width="3" height="4" fill="#fff" opacity="0.3" />
    <rect x="22" y="20" width="3" height="4" fill="#fff" opacity="0.3" />
    <rect x="28" y="20" width="3" height="4" fill="#fff" opacity="0.3" />
    <rect x="34" y="20" width="3" height="4" fill="#fff" opacity="0.3" />
    {/* Vitrine */}
    <rect x="12" y="26" width="10" height="12" rx="1" fill="#87CEEB" opacity="0.8" />
    <rect x="26" y="26" width="10" height="12" rx="1" fill="#87CEEB" opacity="0.8" />
    {/* Porte */}
    <rect x="20" y="32" width="8" height="12" rx="1" fill="#C66900" />
    <circle cx="26" cy="38" r="1" fill="#FFD700" />
    {/* Panneau "OPEN" */}
    <rect x="14" y="28" width="6" height="4" rx="0.5" fill="#479B67" />
    <text x="17" y="31" textAnchor="middle" fontSize="2.5" fill="#fff" fontWeight="bold">OPEN</text>
    {/* Étoile de qualité */}
    <circle cx="38" cy="10" r="6" fill="#FFD700" />
    <path d="M38 7L39 10L42 10L40 12L41 15L38 13L35 15L36 12L34 10L37 10Z" fill="#FF8C00" />
  </svg>
);


/**
 * Icônes modernes pour nKampa
 * Style: Moderne, minimaliste avec dégradés eNkamba
 */

import React from 'react';

// Icônes de livraison
export const TruckDeliveryIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <defs>
      <linearGradient id="truckGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0A8B46" />
        <stop offset="100%" stopColor="#0A8B46" />
      </linearGradient>
    </defs>
    {/* Camion */}
    <path d="M1 3h15v13H1z" fill="url(#truckGradient)" opacity="0.2" />
    <path d="M1 6h15M1 3h15v13H1V3z" stroke="url(#truckGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    {/* Cabine arrière */}
    <path d="M16 8h2.5L21 12v4h-5V8z" fill="url(#truckGradient)" opacity="0.2" />
    <path d="M16 8h2.5L21 12v4h-5V8z" stroke="url(#truckGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    {/* Roues */}
    <circle cx="5.5" cy="18.5" r="2.5" fill="white" stroke="url(#truckGradient)" strokeWidth="2" />
    <circle cx="18.5" cy="18.5" r="2.5" fill="white" stroke="url(#truckGradient)" strokeWidth="2" />
    {/* Détails roues */}
    <circle cx="5.5" cy="18.5" r="1" fill="url(#truckGradient)" />
    <circle cx="18.5" cy="18.5" r="1" fill="url(#truckGradient)" />
  </svg>
);

export const PlaneExpressIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <defs>
      <linearGradient id="planeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#2563eb" />
      </linearGradient>
    </defs>
    {/* Corps de l'avion */}
    <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" 
      fill="url(#planeGradient)" opacity="0.2" />
    <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" 
      stroke="url(#planeGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    {/* Lignes de vitesse */}
    <path d="M2 10h3M1 13h2" stroke="url(#planeGradient)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
  </svg>
);

export const ShipLogisticsIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <defs>
      <linearGradient id="shipGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8b5cf6" />
        <stop offset="100%" stopColor="#7c3aed" />
      </linearGradient>
    </defs>
    {/* Bateau */}
    <path d="M2 20l2-8h16l2 8" fill="url(#shipGradient)" opacity="0.2" />
    <path d="M2 20l2-8h16l2 8H2z" stroke="url(#shipGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    {/* Conteneurs */}
    <rect x="6" y="8" width="4" height="4" fill="url(#shipGradient)" opacity="0.3" stroke="url(#shipGradient)" strokeWidth="1.5" />
    <rect x="11" y="8" width="4" height="4" fill="url(#shipGradient)" opacity="0.3" stroke="url(#shipGradient)" strokeWidth="1.5" />
    <rect x="16" y="8" width="4" height="4" fill="url(#shipGradient)" opacity="0.3" stroke="url(#shipGradient)" strokeWidth="1.5" />
    {/* Vagues */}
    <path d="M1 22c1-1 2-1 3 0s2 1 3 0 2-1 3 0 2 1 3 0 2-1 3 0 2 1 3 0 2-1 3 0" 
      stroke="url(#shipGradient)" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
  </svg>
);

// Icônes de paiement
export const WalletPayIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <defs>
      <linearGradient id="walletGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0A8B46" />
        <stop offset="100%" stopColor="#0A8B46" />
      </linearGradient>
    </defs>
    {/* Portefeuille */}
    <rect x="2" y="6" width="20" height="14" rx="2" fill="url(#walletGradient)" opacity="0.2" />
    <rect x="2" y="6" width="20" height="14" rx="2" stroke="url(#walletGradient)" strokeWidth="2" />
    {/* Poche */}
    <path d="M2 10h20" stroke="url(#walletGradient)" strokeWidth="2" />
    {/* Carte */}
    <rect x="16" y="13" width="4" height="3" rx="0.5" fill="url(#walletGradient)" />
    {/* Logo eNkamba */}
    <circle cx="7" cy="15" r="2" fill="url(#walletGradient)" opacity="0.3" />
    <path d="M6 15h2" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const MobileMoneyIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <defs>
      <linearGradient id="mobileGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#FFA500" />
      </linearGradient>
    </defs>
    {/* Téléphone */}
    <rect x="5" y="2" width="14" height="20" rx="2" fill="url(#mobileGradient)" opacity="0.2" />
    <rect x="5" y="2" width="14" height="20" rx="2" stroke="url(#mobileGradient)" strokeWidth="2" />
    {/* Écran */}
    <rect x="7" y="5" width="10" height="13" rx="1" fill="white" stroke="url(#mobileGradient)" strokeWidth="1" />
    {/* Symbole argent */}
    <text x="12" y="14" textAnchor="middle" fill="url(#mobileGradient)" fontSize="8" fontWeight="bold">$</text>
    {/* Bouton home */}
    <circle cx="12" cy="20" r="1" fill="url(#mobileGradient)" />
  </svg>
);

export const BankCardIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <defs>
      <linearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#2563eb" />
      </linearGradient>
    </defs>
    {/* Carte */}
    <rect x="2" y="5" width="20" height="14" rx="2" fill="url(#cardGradient)" opacity="0.2" />
    <rect x="2" y="5" width="20" height="14" rx="2" stroke="url(#cardGradient)" strokeWidth="2" />
    {/* Bande magnétique */}
    <rect x="2" y="9" width="20" height="3" fill="url(#cardGradient)" opacity="0.5" />
    {/* Puce */}
    <rect x="5" y="13" width="4" height="3" rx="0.5" fill="url(#cardGradient)" />
    {/* Lignes de carte */}
    <line x1="11" y1="15" x2="19" y2="15" stroke="url(#cardGradient)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    <line x1="11" y1="17" x2="16" y2="17" stroke="url(#cardGradient)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
  </svg>
);

export const CashOnDeliveryIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <defs>
      <linearGradient id="cashGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0A8B46" />
        <stop offset="100%" stopColor="#0A8B46" />
      </linearGradient>
    </defs>
    {/* Boîte de livraison */}
    <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" fill="url(#cashGradient)" opacity="0.2" />
    <path d="M12 2L2 7l10 5 10-5L12 2z" stroke="url(#cashGradient)" strokeWidth="2" strokeLinejoin="round" />
    <path d="M2 7v10l10 5V12" stroke="url(#cashGradient)" strokeWidth="2" strokeLinejoin="round" />
    <path d="M22 7v10l-10 5V12" stroke="url(#cashGradient)" strokeWidth="2" strokeLinejoin="round" />
    {/* Symbole dollar */}
    <circle cx="12" cy="12" r="3" fill="url(#cashGradient)" />
    <text x="12" y="14" textAnchor="middle" fill="white" fontSize="5" fontWeight="bold">$</text>
  </svg>
);

// Icône de vérification
export const VerifiedBadgeIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <defs>
      <linearGradient id="verifiedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0A8B46" />
        <stop offset="100%" stopColor="#0A8B46" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="10" fill="url(#verifiedGradient)" />
    <path d="M8 12l3 3 5-6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

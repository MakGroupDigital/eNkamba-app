'use client';

import { cn } from '@/lib/utils';

interface IconProps {
  className?: string;
  size?: number;
}

// Fournisseurs - Usine/Production
export const SuppliersIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="suppliersGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#32BB78" />
        <stop offset="100%" stopColor="#0E5A59" />
      </linearGradient>
    </defs>
    {/* Bâtiment usine */}
    <rect x="8" y="18" width="32" height="22" rx="2" fill="url(#suppliersGrad)" />
    {/* Toit */}
    <polygon points="8,18 24,6 40,18" fill="#0E5A59" />
    {/* Fenêtres */}
    <rect x="12" y="22" width="6" height="6" fill="#fff" opacity="0.3" />
    <rect x="22" y="22" width="6" height="6" fill="#fff" opacity="0.3" />
    <rect x="32" y="22" width="6" height="6" fill="#fff" opacity="0.3" />
    {/* Cheminée */}
    <rect x="20" y="8" width="4" height="8" fill="#0E5A59" />
    <circle cx="22" cy="6" r="2" fill="#FF8C00" />
  </svg>
);

// Grossistes - Boîtes empilées
export const WholesalersIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="wholesalersGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#32BB78" />
        <stop offset="100%" stopColor="#0E5A59" />
      </linearGradient>
    </defs>
    {/* Boîte 1 (bas) */}
    <rect x="8" y="28" width="32" height="12" rx="1" fill="url(#wholesalersGrad)" />
    <line x1="8" y1="34" x2="40" y2="34" stroke="#fff" strokeWidth="1" opacity="0.3" />
    {/* Boîte 2 (milieu) */}
    <rect x="10" y="18" width="28" height="10" rx="1" fill="#32BB78" opacity="0.8" />
    <line x1="10" y1="23" x2="38" y2="23" stroke="#fff" strokeWidth="1" opacity="0.3" />
    {/* Boîte 3 (haut) */}
    <rect x="12" y="10" width="24" height="8" rx="1" fill="#32BB78" opacity="0.6" />
    <line x1="12" y1="14" x2="36" y2="14" stroke="#fff" strokeWidth="1" opacity="0.3" />
  </svg>
);

// Acheter détail - Panier shopping
export const RetailBuyIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="retailGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#32BB78" />
        <stop offset="100%" stopColor="#0E5A59" />
      </linearGradient>
    </defs>
    {/* Panier */}
    <path d="M10 16L12 8H36L38 16M12 16H36L34 32H14L12 16Z" fill="url(#retailGrad)" stroke="#0E5A59" strokeWidth="1.5" />
    {/* Poignées */}
    <path d="M16 8C16 4 20 2 24 2C28 2 32 4 32 8" stroke="#0E5A59" strokeWidth="2" strokeLinecap="round" />
    {/* Roues */}
    <circle cx="18" cy="36" r="2" fill="#0E5A59" />
    <circle cx="30" cy="36" r="2" fill="#0E5A59" />
  </svg>
);

// Facture pro - Document
export const ProInvoiceIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="invoiceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#32BB78" />
        <stop offset="100%" stopColor="#0E5A59" />
      </linearGradient>
    </defs>
    {/* Document */}
    <rect x="10" y="6" width="28" height="36" rx="2" fill="url(#invoiceGrad)" />
    {/* Lignes */}
    <line x1="14" y1="14" x2="34" y2="14" stroke="#fff" strokeWidth="2" opacity="0.5" />
    <line x1="14" y1="22" x2="34" y2="22" stroke="#fff" strokeWidth="1.5" opacity="0.4" />
    <line x1="14" y1="28" x2="28" y2="28" stroke="#fff" strokeWidth="1.5" opacity="0.4" />
    <line x1="14" y1="34" x2="28" y2="34" stroke="#fff" strokeWidth="1.5" opacity="0.4" />
    {/* Montant */}
    <text x="34" y="36" fontSize="8" fill="#fff" fontWeight="bold" textAnchor="end">$</text>
  </svg>
);

// Suivi colis - Camion
export const TrackingIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="trackingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#32BB78" />
        <stop offset="100%" stopColor="#0E5A59" />
      </linearGradient>
    </defs>
    {/* Cabine */}
    <rect x="6" y="18" width="12" height="14" rx="1" fill="url(#trackingGrad)" />
    {/* Benne */}
    <rect x="18" y="14" width="24" height="18" rx="1" fill="#32BB78" opacity="0.8" />
    {/* Roues */}
    <circle cx="12" cy="34" r="3" fill="#0E5A59" />
    <circle cx="38" cy="34" r="3" fill="#0E5A59" />
    {/* Fenêtre */}
    <rect x="8" y="20" width="6" height="6" fill="#fff" opacity="0.3" />
    {/* Flèche de mouvement */}
    <path d="M42 24L46 24M44 22L46 24L44 26" stroke="#FF8C00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Produit B2B - Bâtiment commercial
export const B2BProductIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="b2bGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#32BB78" />
        <stop offset="100%" stopColor="#0E5A59" />
      </linearGradient>
    </defs>
    {/* Bâtiment */}
    <rect x="10" y="14" width="28" height="26" rx="2" fill="url(#b2bGrad)" />
    {/* Toit */}
    <polygon points="10,14 24,4 38,14" fill="#0E5A59" />
    {/* Fenêtres */}
    <rect x="14" y="18" width="5" height="5" fill="#fff" opacity="0.3" />
    <rect x="22" y="18" width="5" height="5" fill="#fff" opacity="0.3" />
    <rect x="30" y="18" width="5" height="5" fill="#fff" opacity="0.3" />
    <rect x="14" y="26" width="5" height="5" fill="#fff" opacity="0.3" />
    <rect x="22" y="26" width="5" height="5" fill="#fff" opacity="0.3" />
    <rect x="30" y="26" width="5" height="5" fill="#fff" opacity="0.3" />
    {/* Porte */}
    <rect x="21" y="32" width="6" height="8" fill="#0E5A59" />
  </svg>
);

// Produit B2C - Sac shopping
export const B2CProductIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="b2cGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#32BB78" />
        <stop offset="100%" stopColor="#0E5A59" />
      </linearGradient>
    </defs>
    {/* Sac */}
    <path d="M12 14L14 8H34L36 14L34 36H14L12 14Z" fill="url(#b2cGrad)" stroke="#0E5A59" strokeWidth="1.5" />
    {/* Poignées */}
    <path d="M18 8C18 4 20 2 24 2C28 2 30 4 30 8" stroke="#0E5A59" strokeWidth="2" strokeLinecap="round" />
    {/* Motif */}
    <circle cx="24" cy="22" r="4" fill="#fff" opacity="0.3" />
  </svg>
);

// Contacter - Téléphone
export const ContactIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="contactGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#32BB78" />
        <stop offset="100%" stopColor="#0E5A59" />
      </linearGradient>
    </defs>
    {/* Téléphone */}
    <rect x="12" y="6" width="24" height="36" rx="3" fill="url(#contactGrad)" stroke="#0E5A59" strokeWidth="1.5" />
    {/* Écran */}
    <rect x="14" y="8" width="20" height="24" rx="2" fill="#fff" opacity="0.2" />
    {/* Bouton */}
    <circle cx="24" cy="36" r="2" fill="#fff" opacity="0.5" />
  </svg>
);

// Acheter - Bouton d'achat
export const BuyIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="buyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#32BB78" />
        <stop offset="100%" stopColor="#0E5A59" />
      </linearGradient>
    </defs>
    {/* Bouton */}
    <rect x="8" y="14" width="32" height="20" rx="4" fill="url(#buyGrad)" />
    {/* Texte */}
    <text x="24" y="28" fontSize="10" fill="#fff" fontWeight="bold" textAnchor="middle">BUY</text>
  </svg>
);

// Localisation - Épingle
export const LocationIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="locationGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#32BB78" />
        <stop offset="100%" stopColor="#0E5A59" />
      </linearGradient>
    </defs>
    {/* Épingle */}
    <path d="M24 6C18 6 14 10 14 16C14 24 24 38 24 38C24 38 34 24 34 16C34 10 30 6 24 6Z" fill="url(#locationGrad)" />
    {/* Point */}
    <circle cx="24" cy="16" r="3" fill="#fff" />
  </svg>
);

// Étoile - Notation
export const StarIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="starGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFD700" />
        <stop offset="100%" stopColor="#FFA500" />
      </linearGradient>
    </defs>
    {/* Étoile */}
    <polygon points="24,6 30,18 42,18 32,26 36,38 24,30 12,38 16,26 6,18 18,18" fill="url(#starGrad)" />
  </svg>
);

// MOQ - Boîte
export const MOQIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="moqGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#32BB78" />
        <stop offset="100%" stopColor="#0E5A59" />
      </linearGradient>
    </defs>
    {/* Boîte */}
    <rect x="10" y="14" width="28" height="24" rx="2" fill="url(#moqGrad)" />
    <line x1="10" y1="20" x2="38" y2="20" stroke="#fff" strokeWidth="1" opacity="0.3" />
    {/* Couvercle */}
    <path d="M10 14L14 8H34L38 14" fill="#0E5A59" />
  </svg>
);

// Prix - Symbole devise
export const PriceIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="priceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#32BB78" />
        <stop offset="100%" stopColor="#0E5A59" />
      </linearGradient>
    </defs>
    {/* Cercle */}
    <circle cx="24" cy="24" r="16" fill="url(#priceGrad)" />
    {/* Symbole $ */}
    <text x="24" y="30" fontSize="20" fill="#fff" fontWeight="bold" textAnchor="middle">$</text>
  </svg>
);

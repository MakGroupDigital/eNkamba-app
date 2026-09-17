import { cn } from '@/lib/utils';

interface IconProps {
  className?: string;
  size?: number;
}

// Icône Tout - Marché/Boutique
export const AllCategoriesIcon = ({ className, size = 48 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="allGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#073B9A" />
        <stop offset="100%" stopColor="#073B9A" />
      </linearGradient>
    </defs>
    {/* Bâtiment boutique */}
    <rect x="6" y="14" width="36" height="28" rx="2" fill="url(#allGrad)" />
    <rect x="10" y="18" width="28" height="20" rx="1" fill="#fff" opacity="0.94" />
    {/* Porte */}
    <rect x="20" y="24" width="8" height="14" rx="1" fill="#073B9A" />
    <circle cx="27" cy="31" r="1" fill="#073B9A" />
    {/* Fenêtres */}
    <rect x="12" y="20" width="5" height="5" fill="#073B9A" opacity="0.75" />
    <rect x="31" y="20" width="5" height={5} fill="#073B9A" opacity="0.75" />
    {/* Toit */}
    <path d="M6 14L24 4L42 14" stroke="url(#allGrad)" strokeWidth="2" fill="none" />
    {/* Drapeau/Enseigne */}
    <rect x="38" y="8" width="2" height="8" fill="#073B9A" />
    <path d="M40 8Q45 8 45 12Q40 16 40 16" fill="#073B9A" />
  </svg>
);

// Icône Fournisseurs - Usine
export const SuppliersIcon = ({ className, size = 48 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="supplierGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#073B9A" />
        <stop offset="100%" stopColor="#073B9A" />
      </linearGradient>
    </defs>
    {/* Bâtiment principal */}
    <rect x="8" y="18" width="32" height="24" rx="2" fill="url(#supplierGrad)" />
    <rect x="12" y="22" width="24" height="16" rx="1" fill="#073B9A" />
    {/* Fenêtres */}
    <rect x="14" y="24" width="4" height="4" fill="#073B9A" />
    <rect x="20" y="24" width="4" height="4" fill="#073B9A" />
    <rect x="26" y="24" width="4" height="4" fill="#073B9A" />
    <rect x="14" y="30" width="4" height="4" fill="#073B9A" />
    <rect x="20" y="30" width="4" height="4" fill="#073B9A" />
    <rect x="26" y="30" width="4" height="4" fill="#073B9A" />
    {/* Cheminées */}
    <rect x="10" y="6" width="3" height="12" fill="url(#supplierGrad)" />
    <rect x="35" y="8" width="3" height="10" fill="url(#supplierGrad)" />
    {/* Fumée */}
    <circle cx="11.5" cy="4" r="1.5" fill="#073B9A" opacity="0.6" />
    <circle cx="36.5" cy="6" r="1.5" fill="#073B9A" opacity="0.6" />
    {/* Porte */}
    <rect x="22" y="34" width="4" height="6" fill="#073B9A" />
  </svg>
);

// Icône Grossistes - Boîtes empilées
export const WholesalersIcon = ({ className, size = 48 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="wholesaleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#073B9A" />
        <stop offset="100%" stopColor="#073B9A" />
      </linearGradient>
    </defs>
    {/* Boîte 1 (bas) */}
    <rect x="6" y="28" width="36" height="14" rx="1" fill="url(#wholesaleGrad)" />
    <rect x="10" y="32" width="28" height="6" rx="1" fill="#073B9A" />
    {/* Boîte 2 (milieu) */}
    <rect x="10" y="16" width="28" height="12" rx="1" fill="url(#wholesaleGrad)" />
    <rect x="14" y="19" width="20" height="5" rx="1" fill="#073B9A" />
    {/* Boîte 3 (haut) */}
    <rect x="14" y="6" width="20" height="10" rx="1" fill="url(#wholesaleGrad)" />
    <rect x="17" y="8" width="14" height="4" rx="1" fill="#073B9A" />
    {/* Ruban */}
    <line x1="24" y1="6" x2="24" y2="42" stroke="#073B9A" strokeWidth="1.5" />
    {/* Nœud */}
    <circle cx="24" cy="24" r="2" fill="#073B9A" />
  </svg>
);

// Icône Détaillants - Sac shopping
export const RetailersIcon = ({ className, size = 48 }: IconProps) => (
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
        <stop offset="0%" stopColor="#073B9A" />
        <stop offset="100%" stopColor="#073B9A" />
      </linearGradient>
    </defs>
    {/* Sac */}
    <path d="M12 16L14 8C14 6 16 4 18 4H30C32 4 34 6 34 8L36 16" stroke="url(#retailGrad)" strokeWidth="2" fill="none" />
    <path d="M12 16H36V38C36 40 34 42 32 42H16C14 42 12 40 12 38V16Z" fill="url(#retailGrad)" />
    <path d="M12 16H36V38C36 40 34 42 32 42H16C14 42 12 40 12 38V16Z" fill="#073B9A" opacity="0.3" />
    {/* Poignées */}
    <path d="M18 4Q18 12 18 16" stroke="url(#retailGrad)" strokeWidth="2" fill="none" strokeLinecap="round" />
    <path d="M30 4Q30 12 30 16" stroke="url(#retailGrad)" strokeWidth="2" fill="none" strokeLinecap="round" />
    {/* Articles dans le sac */}
    <rect x="16" y="22" width="4" height="8" fill="#073B9A" rx="1" />
    <rect x="22" y="20" width="4" height="10" fill="#073B9A" rx="1" />
    <rect x="28" y="22" width="4" height="8" fill="#073B9A" rx="1" />
  </svg>
);

// Icône Producteurs - Feuille/Plante
export const ProducersIcon = ({ className, size = 48 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="producerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#073B9A" />
        <stop offset="100%" stopColor="#073B9A" />
      </linearGradient>
    </defs>
    {/* Pot */}
    <path d="M16 32L14 42H34L32 32Z" fill="url(#producerGrad)" />
    <ellipse cx="24" cy="32" rx="8" ry="3" fill="#073B9A" />
    {/* Tige */}
    <line x1="24" y1="32" x2="24" y2="8" stroke="url(#producerGrad)" strokeWidth="2" />
    {/* Feuilles gauche */}
    <path d="M24 12Q12 8 10 18" stroke="url(#producerGrad)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    <path d="M24 20Q8 18 6 28" stroke="url(#producerGrad)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    {/* Feuilles droite */}
    <path d="M24 12Q36 8 38 18" stroke="url(#producerGrad)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    <path d="M24 20Q40 18 42 28" stroke="url(#producerGrad)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    {/* Fleur */}
    <circle cx="24" cy="6" r="2" fill="#073B9A" />
    <circle cx="20" cy="4" r="1.5" fill="#073B9A" />
    <circle cx="28" cy="4" r="1.5" fill="#073B9A" />
    <circle cx="22" cy="2" r="1.5" fill="#073B9A" />
    <circle cx="26" cy="2" r="1.5" fill="#073B9A" />
  </svg>
);

// Icône Produits Digitaux - Ordinateur/Cloud
export const DigitalProductsIcon = ({ className, size = 48 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="digitalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#073B9A" />
        <stop offset="100%" stopColor="#073B9A" />
      </linearGradient>
    </defs>
    {/* Écran */}
    <rect x="6" y="6" width="36" height="24" rx="2" fill="url(#digitalGrad)" />
    <rect x="10" y="10" width="28" height="16" rx="1" fill="#073B9A" />
    {/* Contenu écran */}
    <rect x="12" y="12" width="8" height="4" fill="#073B9A" />
    <rect x="22" y="12" width="8" height="4" fill="#073B9A" />
    <rect x="12" y="18" width="18" height="2" fill="#073B9A" />
    <rect x="12" y="22" width="18" height="2" fill="#073B9A" />
    {/* Pied */}
    <rect x="20" y="30" width="8" height="3" fill="url(#digitalGrad)" />
    <rect x="18" y="33" width="12" height="2" fill="url(#digitalGrad)" />
    {/* Nuage (symbole digital) */}
    <path d="M32 8Q38 8 40 12Q42 14 42 16" stroke="#073B9A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    <circle cx="36" cy="12" r="1" fill="#073B9A" />
  </svg>
);

// Icône Suivi Colis - Camion de livraison
export const TrackingIcon = ({ className, size = 48 }: IconProps) => (
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
        <stop offset="0%" stopColor="#073B9A" />
        <stop offset="100%" stopColor="#073B9A" />
      </linearGradient>
    </defs>
    {/* Cabine du camion */}
    <rect x="6" y="18" width="12" height="14" rx="1" fill="url(#trackingGrad)" />
    <rect x="8" y="20" width="8" height="6" fill="#073B9A" />
    {/* Cargo */}
    <rect x="18" y="14" width="24" height="18" rx="1" fill="url(#trackingGrad)" />
    <rect x="20" y="16" width="20" height="14" rx="1" fill="#073B9A" />
    {/* Roues */}
    <circle cx="12" cy="34" r="3" fill="url(#trackingGrad)" />
    <circle cx="12" cy="34" r="1.5" fill="#073B9A" />
    <circle cx="38" cy="34" r="3" fill="url(#trackingGrad)" />
    <circle cx="38" cy="34" r="1.5" fill="#073B9A" />
    {/* Essieu */}
    <line x1="12" y1="34" x2="38" y2="34" stroke="url(#trackingGrad)" strokeWidth="1" />
    {/* Flèche de mouvement */}
    <path d="M42 24L46 24M44 22L46 24L44 26" stroke="#073B9A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

// Icône Produit - Boîte/Paquet
export const ProductIcon = ({ className, size = 48 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="productGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#073B9A" />
        <stop offset="100%" stopColor="#073B9A" />
      </linearGradient>
    </defs>
    {/* Boîte principale */}
    <path d="M8 16L24 6L40 16V38C40 40 38 42 36 42H12C10 42 8 40 8 38V16Z" fill="url(#productGrad)" />
    <path d="M8 16L24 6L40 16" stroke="#073B9A" strokeWidth="1.5" fill="none" />
    {/* Rabat */}
    <path d="M8 16L24 24L40 16" stroke="#073B9A" strokeWidth="1.5" fill="none" />
    {/* Arête centrale */}
    <line x1="24" y1="6" x2="24" y2="24" stroke="#073B9A" strokeWidth="1" />
    {/* Décoration */}
    <circle cx="24" cy="28" r="3" fill="#073B9A" />
    <line x1="20" y1="28" x2="28" y2="28" stroke="#073B9A" strokeWidth="1" />
    <line x1="24" y1="24" x2="24" y2="32" stroke="#073B9A" strokeWidth="1" />
  </svg>
);

// Icône Service - Clé/Outil
export const ServiceIcon = ({ className, size = 48 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="serviceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#073B9A" />
        <stop offset="100%" stopColor="#073B9A" />
      </linearGradient>
    </defs>
    {/* Manche de la clé */}
    <rect x="8" y="20" width="24" height="8" rx="4" fill="url(#serviceGrad)" />
    {/* Tête de la clé */}
    <circle cx="36" cy="24" r="6" fill="url(#serviceGrad)" />
    <circle cx="36" cy="24" r="3" fill="#073B9A" />
    {/* Dents de la clé */}
    <rect x="36" y="30" width="3" height="4" fill="url(#serviceGrad)" />
    <rect x="40" y="30" width="3" height="4" fill="url(#serviceGrad)" />
    {/* Engrenage décoratif */}
    <circle cx="16" cy="12" r="5" fill="none" stroke="url(#serviceGrad)" strokeWidth="2" />
    <circle cx="16" cy="12" r="2" fill="#073B9A" />
    {/* Rayons */}
    <line x1="16" y1="7" x2="16" y2="5" stroke="url(#serviceGrad)" strokeWidth="1.5" />
    <line x1="16" y1="19" x2="16" y2="21" stroke="url(#serviceGrad)" strokeWidth="1.5" />
    <line x1="11" y1="12" x2="9" y2="12" stroke="url(#serviceGrad)" strokeWidth="1.5" />
    <line x1="21" y1="12" x2="23" y2="12" stroke="url(#serviceGrad)" strokeWidth="1.5" />
  </svg>
);

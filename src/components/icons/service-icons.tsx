'use client';

import { cn } from '@/lib/utils';

interface IconProps {
  className?: string;
  size?: number;
}

// ==================== SERVICES FINANCIERS ====================

// Épargne - Tirelire moderne avec pièces
export const SavingsIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="savingsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    {/* Tirelire body */}
    <ellipse cx="24" cy="28" rx="16" ry="12" fill="url(#savingsGrad)" />
    {/* Fente */}
    <rect x="18" y="17" width="12" height="3" rx="1.5" fill="#479B67" />
    {/* Pattes */}
    <rect x="12" y="36" width="4" height="6" rx="2" fill="#479B67" />
    <rect x="32" y="36" width="4" height="6" rx="2" fill="#479B67" />
    {/* Oreille */}
    <ellipse cx="36" cy="22" rx="4" ry="3" fill="#479B67" stroke="#479B67" strokeWidth="1" />
    {/* Œil */}
    <circle cx="32" cy="26" r="2" fill="#fff" />
    <circle cx="32.5" cy="26" r="1" fill="#479B67" />
    {/* Pièce qui tombe */}
    <circle cx="24" cy="10" r="5" fill="#FF8C00" stroke="#E67E00" strokeWidth="1" />
    <text x="24" y="12" textAnchor="middle" fontSize="6" fill="#fff" fontWeight="bold">$</text>
    {/* Sparkles */}
    <path d="M38 10L39 12L41 11L39 13L40 15L38 13L36 15L37 13L35 12L37 11L38 10Z" fill="#FF8C00" />
  </svg>
);

// Crédit - Billets avec flèche
export const CreditIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="creditGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    {/* Billet arrière */}
    <rect x="8" y="14" width="28" height="18" rx="3" fill="#479B67" />
    {/* Billet avant */}
    <rect x="12" y="18" width="28" height="18" rx="3" fill="url(#creditGrad)" />
    <circle cx="26" cy="27" r="6" fill="#fff" fillOpacity="0.3" />
    <text x="26" y="30" textAnchor="middle" fontSize="8" fill="#fff" fontWeight="bold">$</text>
    {/* Flèche vers utilisateur */}
    <path d="M38 8L44 14L38 20" stroke="#FF8C00" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M44 14H32" stroke="#FF8C00" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

// Tontine - Cercle de personnes
// Positions pré-calculées pour éviter les erreurs d'hydratation SSR
const tontinePositions = [
  { x: 40, y: 24, color: "#479B67" },    // 0°
  { x: 32, y: 37.86, color: "#FF8C00" }, // 60°
  { x: 16, y: 37.86, color: "#479B67" }, // 120°
  { x: 8, y: 24, color: "#FF8C00" },     // 180°
  { x: 16, y: 10.14, color: "#479B67" }, // 240°
  { x: 32, y: 10.14, color: "#FF8C00" }, // 300°
];

export const TontineIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="tontineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    {/* Cercle central */}
    <circle cx="24" cy="24" r="8" fill="url(#tontineGrad)" />
    <text x="24" y="27" textAnchor="middle" fontSize="8" fill="#fff" fontWeight="bold">$</text>
    {/* Personnes autour - positions fixes */}
    {tontinePositions.map((pos, i) => (
      <g key={i}>
        <circle cx={pos.x} cy={pos.y - 2} r="4" fill={pos.color} />
        <circle cx={pos.x} cy={pos.y - 6} r="2.5" fill={pos.color} />
      </g>
    ))}
    {/* Lignes de connexion */}
    <circle cx="24" cy="24" r="16" stroke="#479B67" strokeWidth="1" strokeDasharray="4 2" fill="none" opacity="0.5" />
  </svg>
);

// Conversion - Devises avec flèches
export const ConversionIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="convGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    {/* Pièce gauche (USD) */}
    <circle cx="16" cy="20" r="10" fill="url(#convGrad1)" />
    <text x="16" y="24" textAnchor="middle" fontSize="10" fill="#fff" fontWeight="bold">$</text>
    {/* Pièce droite (EUR) */}
    <circle cx="32" cy="28" r="10" fill="#FF8C00" />
    <text x="32" y="32" textAnchor="middle" fontSize="10" fill="#fff" fontWeight="bold">€</text>
    {/* Flèches circulaires */}
    <path d="M26 12C30 8 38 10 40 16" stroke="#479B67" strokeWidth="2" strokeLinecap="round" />
    <path d="M40 16L42 12L38 13" stroke="#479B67" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M22 36C18 40 10 38 8 32" stroke="#FF8C00" strokeWidth="2" strokeLinecap="round" />
    <path d="M8 32L6 36L10 35" stroke="#FF8C00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Parrainage - Cadeau avec étoiles
export const ReferralIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="giftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF8C00" />
        <stop offset="100%" stopColor="#E67E00" />
      </linearGradient>
    </defs>
    {/* Boîte */}
    <rect x="8" y="20" width="32" height="22" rx="3" fill="url(#giftGrad)" />
    {/* Couvercle */}
    <rect x="6" y="14" width="36" height="8" rx="2" fill="#479B67" />
    {/* Ruban vertical */}
    <rect x="22" y="14" width="4" height="28" fill="#479B67" />
    {/* Ruban horizontal */}
    <rect x="6" y="16" width="36" height="4" fill="#479B67" />
    {/* Nœud */}
    <circle cx="24" cy="12" r="4" fill="#FF8C00" />
    <path d="M20 8C20 8 22 12 24 12C26 12 28 8 28 8" stroke="#E67E00" strokeWidth="2" fill="none" />
    {/* Étoiles */}
    <path d="M40 6L41 9L44 8L42 10L44 12L41 11L40 14L39 11L36 12L38 10L36 8L39 9L40 6Z" fill="#479B67" />
    <path d="M8 8L9 10L11 9L10 11L12 12L9 12L8 14L7 12L4 12L6 11L5 9L7 10L8 8Z" fill="#479B67" />
  </svg>
);

// Compte Agent - Badge professionnel
export const AgentIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="agentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    {/* Badge */}
    <path d="M24 4L40 12V24C40 34 32 42 24 44C16 42 8 34 8 24V12L24 4Z" fill="url(#agentGrad)" />
    {/* Étoile centrale */}
    <path d="M24 14L26.5 21H34L28 26L30 33L24 28L18 33L20 26L14 21H21.5L24 14Z" fill="#FF8C00" />
    {/* Cercle intérieur */}
    <circle cx="24" cy="24" r="12" stroke="#fff" strokeWidth="1.5" fill="none" opacity="0.3" />
  </svg>
);

// Lier un compte - Chaîne connectée
export const LinkAccountIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="linkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    {/* Maillon gauche */}
    <rect x="6" y="18" width="18" height="12" rx="6" stroke="url(#linkGrad)" strokeWidth="4" fill="none" />
    {/* Maillon droit */}
    <rect x="24" y="18" width="18" height="12" rx="6" stroke="#FF8C00" strokeWidth="4" fill="none" />
    {/* Icônes */}
    <circle cx="12" cy="24" r="3" fill="#479B67" />
    <text x="12" y="26" textAnchor="middle" fontSize="4" fill="#fff" fontWeight="bold">📱</text>
    <circle cx="36" cy="24" r="3" fill="#FF8C00" />
    <text x="36" y="26" textAnchor="middle" fontSize="4" fill="#fff" fontWeight="bold">🏦</text>
    {/* Check */}
    <circle cx="24" cy="10" r="6" fill="#479B67" />
    <path d="M21 10L23 12L27 8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Bonus - Médaille avec étoiles
export const BonusIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="bonusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF8C00" />
        <stop offset="100%" stopColor="#E67E00" />
      </linearGradient>
    </defs>
    {/* Rubans */}
    <path d="M18 28L12 44L18 38L24 44L24 28" fill="#479B67" />
    <path d="M30 28L36 44L30 38L24 44L24 28" fill="#479B67" />
    {/* Médaille */}
    <circle cx="24" cy="20" r="14" fill="url(#bonusGrad)" />
    <circle cx="24" cy="20" r="10" stroke="#fff" strokeWidth="2" fill="none" opacity="0.5" />
    {/* Pourcentage */}
    <text x="24" y="24" textAnchor="middle" fontSize="10" fill="#fff" fontWeight="bold">%</text>
    {/* Étoiles */}
    <circle cx="24" cy="8" r="2" fill="#fff" />
    <circle cx="16" cy="12" r="1.5" fill="#fff" opacity="0.7" />
    <circle cx="32" cy="12" r="1.5" fill="#fff" opacity="0.7" />
  </svg>
);

// ==================== FACTURES ET SERVICES PARTENAIRES ====================

// Impôts - Document officiel
export const TaxIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="taxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    {/* Document */}
    <path d="M12 6H30L36 12V42H12V6Z" fill="url(#taxGrad)" />
    <path d="M30 6V12H36" fill="#479B67" />
    {/* Lignes de texte */}
    <rect x="16" y="18" width="16" height="2" rx="1" fill="#fff" opacity="0.7" />
    <rect x="16" y="24" width="12" height="2" rx="1" fill="#fff" opacity="0.7" />
    <rect x="16" y="30" width="14" height="2" rx="1" fill="#fff" opacity="0.7" />
    {/* Tampon */}
    <circle cx="28" cy="36" r="6" fill="#FF8C00" opacity="0.9" />
    <path d="M25 36L27 38L31 34" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Yango - Voiture stylisée
export const YangoIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="yangoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF8C00" />
        <stop offset="100%" stopColor="#E67E00" />
      </linearGradient>
    </defs>
    {/* Corps voiture */}
    <path d="M8 28L12 18H36L40 28V34H8V28Z" fill="url(#yangoGrad)" />
    {/* Toit */}
    <path d="M14 18L18 10H30L34 18H14Z" fill="#479B67" />
    {/* Vitres */}
    <path d="M16 18L19 12H23V18H16Z" fill="#479B67" opacity="0.5" />
    <path d="M25 18V12H29L32 18H25Z" fill="#479B67" opacity="0.5" />
    {/* Roues */}
    <circle cx="14" cy="34" r="5" fill="#333" />
    <circle cx="14" cy="34" r="2" fill="#666" />
    <circle cx="34" cy="34" r="5" fill="#333" />
    <circle cx="34" cy="34" r="2" fill="#666" />
    {/* Phares */}
    <rect x="8" y="26" width="4" height="3" rx="1" fill="#FFE066" />
    <rect x="36" y="26" width="4" height="3" rx="1" fill="#FFE066" />
  </svg>
);

// Regideso - Goutte d'eau
export const WaterIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="waterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4FC3F7" />
        <stop offset="100%" stopColor="#0288D1" />
      </linearGradient>
    </defs>
    {/* Grande goutte */}
    <path d="M24 6C24 6 10 22 10 30C10 38 16 44 24 44C32 44 38 38 38 30C38 22 24 6 24 6Z" fill="url(#waterGrad)" />
    {/* Reflet */}
    <ellipse cx="18" cy="28" rx="4" ry="6" fill="#fff" opacity="0.4" />
    {/* Petites gouttes */}
    <path d="M40 14C40 14 36 20 36 22C36 24 38 26 40 26C42 26 44 24 44 22C44 20 40 14 40 14Z" fill="#4FC3F7" opacity="0.6" />
    <path d="M8 18C8 18 5 22 5 24C5 26 6 27 8 27C10 27 11 26 11 24C11 22 8 18 8 18Z" fill="#4FC3F7" opacity="0.6" />
  </svg>
);

// Canal+ - TV moderne
export const TvIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="tvGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1a1a2e" />
        <stop offset="100%" stopColor="#16213e" />
      </linearGradient>
    </defs>
    {/* Écran */}
    <rect x="6" y="8" width="36" height="26" rx="3" fill="url(#tvGrad)" />
    {/* Écran intérieur */}
    <rect x="9" y="11" width="30" height="20" rx="1" fill="#0f3460" />
    {/* Logo Canal+ stylisé */}
    <text x="24" y="24" textAnchor="middle" fontSize="10" fill="#FF8C00" fontWeight="bold">C+</text>
    {/* Pied */}
    <rect x="18" y="34" width="12" height="4" fill="#333" />
    <rect x="14" y="38" width="20" height="3" rx="1" fill="#333" />
    {/* Signal */}
    <path d="M38 4C40 6 41 8 41 11" stroke="#479B67" strokeWidth="2" strokeLinecap="round" fill="none" />
    <path d="M42 2C45 5 46 9 46 13" stroke="#479B67" strokeWidth="2" strokeLinecap="round" fill="none" />
  </svg>
);

// Frais Académiques - Chapeau diplômé
export const AcademicIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="acadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    {/* Chapeau */}
    <path d="M24 8L4 18L24 28L44 18L24 8Z" fill="url(#acadGrad)" />
    {/* Dessus du chapeau */}
    <path d="M24 8L4 18L24 16L44 18L24 8Z" fill="#479B67" />
    {/* Pompon */}
    <line x1="40" y1="18" x2="40" y2="32" stroke="#FF8C00" strokeWidth="2" />
    <circle cx="40" cy="34" r="3" fill="#FF8C00" />
    {/* Base */}
    <path d="M12 22V32C12 36 18 40 24 40C30 40 36 36 36 32V22" stroke="url(#acadGrad)" strokeWidth="3" fill="none" />
    {/* Livre */}
    <rect x="18" y="42" width="12" height="4" rx="1" fill="#FF8C00" />
  </svg>
);

// Frais Scolaires - École
export const SchoolIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="schoolGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF8C00" />
        <stop offset="100%" stopColor="#E67E00" />
      </linearGradient>
    </defs>
    {/* Bâtiment principal */}
    <rect x="8" y="20" width="32" height="24" fill="#479B67" />
    {/* Toit */}
    <path d="M4 20L24 6L44 20H4Z" fill="url(#schoolGrad)" />
    {/* Fenêtres */}
    <rect x="12" y="26" width="6" height="6" fill="#fff" opacity="0.8" />
    <rect x="30" y="26" width="6" height="6" fill="#fff" opacity="0.8" />
    {/* Porte */}
    <rect x="20" y="30" width="8" height="14" rx="1" fill="#479B67" />
    <circle cx="26" cy="38" r="1" fill="#FF8C00" />
    {/* Cloche */}
    <path d="M24 10L22 14H26L24 10Z" fill="#FFE066" />
    <circle cx="24" cy="8" r="2" fill="#FFE066" />
    {/* Drapeau */}
    <line x1="38" y1="6" x2="38" y2="16" stroke="#479B67" strokeWidth="2" />
    <path d="M38 6H44L42 9L44 12H38V6Z" fill="#479B67" />
  </svg>
);

// Billet d'avion - Avion stylisé
export const FlightIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="flightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    {/* Avion */}
    <path d="M42 8L26 18L14 14L12 16L22 22L16 28L10 26L8 28L14 32L18 38L20 36L18 30L24 24L30 34L32 32L28 20L38 4L42 8Z" fill="url(#flightGrad)" />
    {/* Traînée */}
    <path d="M6 40C10 36 16 34 22 34" stroke="#FF8C00" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 2" />
    {/* Nuages */}
    <ellipse cx="8" cy="14" rx="4" ry="2" fill="#E0E0E0" />
    <ellipse cx="14" cy="12" rx="3" ry="1.5" fill="#E0E0E0" />
    <ellipse cx="40" cy="28" rx="4" ry="2" fill="#E0E0E0" />
  </svg>
);

// Hôtel - Lit avec étoiles
export const HotelIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="hotelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#9C27B0" />
        <stop offset="100%" stopColor="#7B1FA2" />
      </linearGradient>
    </defs>
    {/* Lit base */}
    <rect x="6" y="30" width="36" height="10" rx="2" fill="url(#hotelGrad)" />
    {/* Matelas */}
    <rect x="8" y="24" width="32" height="8" rx="2" fill="#479B67" />
    {/* Oreillers */}
    <ellipse cx="14" cy="24" rx="5" ry="3" fill="#fff" />
    <ellipse cx="26" cy="24" rx="5" ry="3" fill="#fff" />
    {/* Tête de lit */}
    <rect x="6" y="14" width="36" height="12" rx="2" fill="#479B67" />
    {/* Étoiles rating */}
    <g fill="#FF8C00">
      <path d="M16 8L17 11H20L17.5 13L18.5 16L16 14L13.5 16L14.5 13L12 11H15L16 8Z" />
      <path d="M24 8L25 11H28L25.5 13L26.5 16L24 14L21.5 16L22.5 13L20 11H23L24 8Z" />
      <path d="M32 8L33 11H36L33.5 13L34.5 16L32 14L29.5 16L30.5 13L28 11H31L32 8Z" />
    </g>
    {/* Pieds */}
    <rect x="8" y="40" width="4" height="4" rx="1" fill="#333" />
    <rect x="36" y="40" width="4" height="4" rx="1" fill="#333" />
  </svg>
);

// Santé - Croix médicale avec cœur
export const HealthIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="healthGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    {/* Capsule médicale */}
    <rect x="8" y="10" width="32" height="28" rx="8" fill="url(#healthGrad)" />
    {/* Croix */}
    <rect x="21" y="15" width="6" height="18" rx="2" fill="#fff" />
    <rect x="15" y="21" width="18" height="6" rx="2" fill="#fff" />
    {/* Cœur */}
    <path d="M24 43C24 43 14 37 14 31C14 27 18 25 24 30C30 25 34 27 34 31C34 37 24 43 24 43Z" fill="#FF8C00" />
    {/* Signal vital */}
    <path d="M10 9H16L19 5L23 13L27 8H38" stroke="#FF8C00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Urgence - Ambulance
export const HealthEmergencyIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="healthEmergencyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    <rect x="6" y="18" width="24" height="16" rx="3" fill="url(#healthEmergencyGrad)" />
    <path d="M30 22H38L42 28V34H30V22Z" fill="#FF8C00" />
    <rect x="15" y="21" width="4" height="10" rx="1" fill="#fff" />
    <rect x="12" y="24" width="10" height="4" rx="1" fill="#fff" />
    <circle cx="14" cy="36" r="4" fill="#333" />
    <circle cx="36" cy="36" r="4" fill="#333" />
    <path d="M34 25H38L40 28H34V25Z" fill="#fff" opacity="0.85" />
    <path d="M8 13H16" stroke="#FF8C00" strokeWidth="2" strokeLinecap="round" />
    <path d="M10 9H18" stroke="#FF8C00" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// Hôpitaux - Bâtiment médical
export const HealthHospitalIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="healthHospitalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    <rect x="10" y="12" width="28" height="32" rx="3" fill="url(#healthHospitalGrad)" />
    <path d="M18 8H30V16H18V8Z" fill="#FF8C00" />
    <rect x="22" y="18" width="4" height="12" rx="1" fill="#fff" />
    <rect x="18" y="22" width="12" height="4" rx="1" fill="#fff" />
    <rect x="16" y="34" width="6" height="10" rx="1" fill="#479B67" />
    <rect x="26" y="34" width="6" height="10" rx="1" fill="#479B67" />
    <rect x="14" y="28" width="5" height="4" rx="1" fill="#fff" opacity="0.75" />
    <rect x="29" y="28" width="5" height="4" rx="1" fill="#fff" opacity="0.75" />
  </svg>
);

// Médecin - Stéthoscope
export const HealthDoctorIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="healthDoctorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    <circle cx="24" cy="12" r="6" fill="#FF8C00" />
    <path d="M12 42C13 31 17 24 24 24C31 24 35 31 36 42H12Z" fill="url(#healthDoctorGrad)" />
    <path d="M16 14V24C16 30 20 34 24 34C28 34 32 30 32 24V14" stroke="#479B67" strokeWidth="3" strokeLinecap="round" />
    <circle cx="16" cy="14" r="3" fill="#479B67" />
    <circle cx="32" cy="14" r="3" fill="#479B67" />
    <path d="M24 34V39" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    <circle cx="24" cy="41" r="4" fill="#fff" />
    <circle cx="24" cy="41" r="2" fill="#FF8C00" />
  </svg>
);

// Pharmacie - Pilules
export const HealthPharmacyIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="healthPharmacyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    <rect x="10" y="8" width="28" height="34" rx="5" fill="url(#healthPharmacyGrad)" />
    <rect x="20" y="13" width="8" height="14" rx="1.5" fill="#fff" />
    <rect x="17" y="16" width="14" height="8" rx="1.5" fill="#fff" />
    <path d="M16 35L24 27L32 35C28 40 20 40 16 35Z" fill="#FF8C00" />
    <path d="M24 27L32 19L36 23L28 31" fill="#fff" opacity="0.9" />
    <circle cx="17" cy="29" r="3" fill="#fff" opacity="0.75" />
    <circle cx="35" cy="34" r="3" fill="#FF8C00" />
  </svg>
);

// Téléconsultation - Consultation vidéo
export const HealthTeleconsultIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="healthTeleconsultGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    <rect x="6" y="10" width="36" height="26" rx="4" fill="url(#healthTeleconsultGrad)" />
    <rect x="10" y="14" width="20" height="18" rx="3" fill="#fff" opacity="0.95" />
    <circle cx="20" cy="20" r="4" fill="#FF8C00" />
    <path d="M13 31C14 26 16 24 20 24C24 24 26 26 27 31H13Z" fill="#479B67" />
    <path d="M32 19L42 14V32L32 27V19Z" fill="#FF8C00" />
    <rect x="18" y="38" width="12" height="4" rx="1" fill="#479B67" />
    <rect x="14" y="42" width="20" height="2" rx="1" fill="#479B67" />
  </svg>
);

// 5go - Voyage et services
export const FiveGoIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="fiveGoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    {/* Pin carte */}
    <path d="M24 4C15 4 8 11 8 20C8 32 24 44 24 44C24 44 40 32 40 20C40 11 33 4 24 4Z" fill="url(#fiveGoGrad)" />
    <circle cx="24" cy="20" r="8" fill="#fff" opacity="0.95" />
    {/* Lit */}
    <rect x="17" y="20" width="14" height="5" rx="1.5" fill="#479B67" />
    <rect x="17" y="16" width="6" height="4" rx="1.5" fill="#479B67" />
    <rect x="16" y="25" width="16" height="3" rx="1" fill="#479B67" />
    {/* Avion */}
    <path d="M35 10L29 16L25 15L24 16L28 19L25 22L22 21L21 22L25 25L28 29L29 28L28 25L31 22L34 26L35 25L34 21L40 15L35 10Z" fill="#FF8C00" />
  </svg>
);

// 5go Hôtels - Séjour
export const FiveGoHotelIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="fiveGoHotelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    <rect x="7" y="18" width="34" height="24" rx="3" fill="url(#fiveGoHotelGrad)" />
    <path d="M12 12H36V22H12V12Z" fill="#479B67" />
    <rect x="11" y="27" width="26" height="7" rx="2" fill="#fff" opacity="0.95" />
    <rect x="13" y="24" width="8" height="5" rx="2" fill="#FF8C00" />
    <rect x="23" y="24" width="8" height="5" rx="2" fill="#FF8C00" />
    <rect x="18" y="34" width="12" height="8" rx="1.5" fill="#479B67" />
    <g fill="#FF8C00">
      <path d="M16 5L17 8H20L17.5 10L18.5 13L16 11L13.5 13L14.5 10L12 8H15L16 5Z" />
      <path d="M24 5L25 8H28L25.5 10L26.5 13L24 11L21.5 13L22.5 10L20 8H23L24 5Z" />
      <path d="M32 5L33 8H36L33.5 10L34.5 13L32 11L29.5 13L30.5 10L28 8H31L32 5Z" />
    </g>
  </svg>
);

// 5go Vols - Billet d'avion
export const FiveGoFlightIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="fiveGoFlightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    <path d="M8 12H34C38 12 42 16 42 20V36H8V30C10 30 12 28 12 26C12 24 10 22 8 22V12Z" fill="url(#fiveGoFlightGrad)" />
    <path d="M42 20H34V12C38 12 42 16 42 20Z" fill="#FF8C00" />
    <path d="M35 8L26 18L18 16L16 18L24 23L19 29L14 28L13 30L20 34L24 41L26 40L25 35L31 30L36 38L38 36L36 28L46 19L35 8Z" fill="#FF8C00" />
    <rect x="13" y="16" width="12" height="2" rx="1" fill="#fff" opacity="0.8" />
    <rect x="13" y="22" width="8" height="2" rx="1" fill="#fff" opacity="0.8" />
    <rect x="13" y="30" width="16" height="2" rx="1" fill="#fff" opacity="0.65" />
    <circle cx="35" cy="30" r="3" fill="#fff" opacity="0.85" />
  </svg>
);

// 5go Bus - Billet de bus
export const FiveGoBusIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="fiveGoBusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    <rect x="8" y="10" width="32" height="28" rx="5" fill="url(#fiveGoBusGrad)" />
    <rect x="12" y="15" width="24" height="10" rx="2" fill="#fff" opacity="0.9" />
    <rect x="14" y="28" width="6" height="4" rx="1" fill="#FF8C00" />
    <rect x="22" y="28" width="6" height="4" rx="1" fill="#FF8C00" />
    <rect x="30" y="28" width="6" height="4" rx="1" fill="#FF8C00" />
    <circle cx="16" cy="38" r="4" fill="#333" />
    <circle cx="16" cy="38" r="1.7" fill="#777" />
    <circle cx="32" cy="38" r="4" fill="#333" />
    <circle cx="32" cy="38" r="1.7" fill="#777" />
    <path d="M6 6H26C30 6 33 9 33 13V13H8C7 13 6 12 6 11V6Z" fill="#FF8C00" />
    <rect x="10" y="8" width="12" height="2" rx="1" fill="#fff" opacity="0.8" />
  </svg>
);

// Mobilité - Taxi connecté
export const MobilityIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="mobilityGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF8C00" />
        <stop offset="100%" stopColor="#E67E00" />
      </linearGradient>
    </defs>
    {/* Route */}
    <path d="M8 42C14 35 18 31 24 28C30 25 35 20 40 12" stroke="#479B67" strokeWidth="4" strokeLinecap="round" strokeDasharray="5 4" />
    {/* Voiture */}
    <path d="M8 30L12 21H36L40 30V36H8V30Z" fill="url(#mobilityGrad)" />
    <path d="M15 21L18 14H30L33 21H15Z" fill="#479B67" />
    <path d="M17 21L19 16H23V21H17Z" fill="#479B67" opacity="0.55" />
    <path d="M25 21V16H29L31 21H25Z" fill="#479B67" opacity="0.55" />
    <circle cx="15" cy="36" r="5" fill="#333" />
    <circle cx="15" cy="36" r="2" fill="#666" />
    <circle cx="33" cy="36" r="5" fill="#333" />
    <circle cx="33" cy="36" r="2" fill="#666" />
    {/* Pin destination */}
    <path d="M38 4C34 4 31 7 31 11C31 16 38 22 38 22C38 22 45 16 45 11C45 7 42 4 38 4Z" fill="#479B67" />
    <circle cx="38" cy="11" r="2.5" fill="#fff" />
  </svg>
);

// Moto - Course rapide
export const MotoRideIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="motoRideGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    <path d="M12 32H22L28 22H36L40 28" stroke="url(#motoRideGrad)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="34" r="6" fill="#333" />
    <circle cx="12" cy="34" r="2.5" fill="#777" />
    <circle cx="36" cy="34" r="6" fill="#333" />
    <circle cx="36" cy="34" r="2.5" fill="#777" />
    <path d="M24 18L29 22L23 30H18L22 22L18 19" fill="#FF8C00" />
    <circle cx="25" cy="12" r="4" fill="#479B67" />
    <path d="M4 24H14" stroke="#FF8C00" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 3" />
  </svg>
);

// Appel chauffeur
export const RidePhoneIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="ridePhoneGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    <rect x="14" y="5" width="20" height="38" rx="5" fill="url(#ridePhoneGrad)" />
    <rect x="17" y="10" width="14" height="25" rx="2" fill="#fff" opacity="0.92" />
    <circle cx="24" cy="39" r="2" fill="#fff" />
    <path d="M20 25C24 30 28 32 32 28L29 24C28 25 27 25 26 24L23 21C22 20 22 19 23 18L19 15C15 19 16 23 20 25Z" fill="#FF8C00" />
  </svg>
);

// Sécurité trajet
export const RideShieldIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="rideShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    <path d="M24 4L8 10V22C8 32 14 40 24 44C34 40 40 32 40 22V10L24 4Z" fill="url(#rideShieldGrad)" />
    <path d="M17 25L22 30L32 18" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="36" cy="12" r="5" fill="#FF8C00" />
  </svg>
);

// Note chauffeur
export const RideStarIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="rideStarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF8C00" />
        <stop offset="100%" stopColor="#E67E00" />
      </linearGradient>
    </defs>
    <path d="M24 5L29 17H42L31.5 25L35.5 39L24 31L12.5 39L16.5 25L6 17H19L24 5Z" fill="url(#rideStarGrad)" />
    <circle cx="24" cy="24" r="7" fill="#479B67" opacity="0.9" />
    <path d="M21 24L23 26L28 21" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Événements - Ticket
export const EventIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="eventGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF8C00" />
        <stop offset="100%" stopColor="#E67E00" />
      </linearGradient>
    </defs>
    {/* Ticket gauche */}
    <path d="M6 14H32V18C30 18 28 20 28 22C28 24 30 26 32 26V34H6V14Z" fill="url(#eventGrad)" />
    {/* Ticket droit */}
    <path d="M32 14H42V34H32V26C34 26 36 24 36 22C36 20 34 18 32 18V14Z" fill="#479B67" />
    {/* Perforation */}
    <line x1="32" y1="14" x2="32" y2="18" stroke="#fff" strokeWidth="2" strokeDasharray="2 2" />
    <line x1="32" y1="26" x2="32" y2="34" stroke="#fff" strokeWidth="2" strokeDasharray="2 2" />
    {/* Étoile */}
    <path d="M18 20L19.5 24H24L20.5 27L22 31L18 28L14 31L15.5 27L12 24H16.5L18 20Z" fill="#fff" />
    {/* Code barre */}
    <rect x="34" y="18" width="1" height="12" fill="#479B67" />
    <rect x="36" y="18" width="2" height="12" fill="#479B67" />
    <rect x="39" y="18" width="1" height="12" fill="#479B67" />
    {/* Confettis */}
    <circle cx="8" cy="10" r="2" fill="#479B67" />
    <circle cx="40" cy="8" r="2" fill="#FF8C00" />
    <rect x="14" y="6" width="3" height="3" rx="0.5" fill="#479B67" transform="rotate(15 14 6)" />
  </svg>
);

// Crédit Téléphone - Smartphone avec signal
export const PhoneCreditIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="phoneGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    {/* Téléphone */}
    <rect x="14" y="4" width="20" height="40" rx="4" fill="url(#phoneGrad)" />
    {/* Écran */}
    <rect x="16" y="8" width="16" height="28" rx="1" fill="#0f3460" />
    {/* Bouton home */}
    <circle cx="24" cy="40" r="2" fill="#fff" opacity="0.5" />
    {/* Signal crédit */}
    <text x="24" y="24" textAnchor="middle" fontSize="10" fill="#479B67" fontWeight="bold">$</text>
    {/* Ondes signal */}
    <path d="M36 8C38 10 39 13 39 16" stroke="#FF8C00" strokeWidth="2" strokeLinecap="round" fill="none" />
    <path d="M40 5C43 8 45 13 45 18" stroke="#FF8C00" strokeWidth="2" strokeLinecap="round" fill="none" />
    {/* Plus */}
    <circle cx="38" cy="32" r="6" fill="#FF8C00" />
    <path d="M38 29V35M35 32H41" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// Assurance - Bouclier avec cœur
export const InsuranceIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="insurGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    {/* Bouclier */}
    <path d="M24 4L8 10V22C8 32 14 40 24 44C34 40 40 32 40 22V10L24 4Z" fill="url(#insurGrad)" />
    {/* Bordure */}
    <path d="M24 8L12 13V22C12 30 16 36 24 40C32 36 36 30 36 22V13L24 8Z" stroke="#fff" strokeWidth="2" fill="none" opacity="0.3" />
    {/* Cœur */}
    <path d="M24 32C24 32 16 26 16 20C16 16 20 14 24 18C28 14 32 16 32 20C32 26 24 32 24 32Z" fill="#FF8C00" />
    {/* Check */}
    <path d="M20 24L23 27L28 20" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// eSIM-eNkamba - Carte SIM avec signal
export const ESimIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="esimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    {/* Carte SIM */}
    <rect x="10" y="8" width="28" height="36" rx="3" fill="url(#esimGrad)" />
    {/* Coin coupé */}
    <path d="M10 8L18 8L10 16Z" fill="#479B67" />
    {/* Puce */}
    <rect x="16" y="18" width="16" height="20" rx="2" fill="#FFD700" stroke="#E6C200" strokeWidth="1" />
    {/* Lignes de la puce */}
    <line x1="20" y1="18" x2="20" y2="38" stroke="#E6C200" strokeWidth="1" />
    <line x1="24" y1="18" x2="24" y2="38" stroke="#E6C200" strokeWidth="1" />
    <line x1="28" y1="18" x2="28" y2="38" stroke="#E6C200" strokeWidth="1" />
    <line x1="16" y1="24" x2="32" y2="24" stroke="#E6C200" strokeWidth="1" />
    <line x1="16" y1="30" x2="32" y2="30" stroke="#E6C200" strokeWidth="1" />
    {/* Signal waves */}
    <path d="M38 12C40 14 40 18 38 20" stroke="#479B67" strokeWidth="2" strokeLinecap="round" fill="none" />
    <path d="M42 8C45 11 45 21 42 24" stroke="#479B67" strokeWidth="2" strokeLinecap="round" fill="none" />
    {/* Texte eSIM */}
    <text x="24" y="14" textAnchor="middle" fontSize="5" fill="#fff" fontWeight="bold">eSIM</text>
  </svg>
);

// Donation - Mains avec cœur
export const DonationIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="donateGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E91E63" />
        <stop offset="100%" stopColor="#C2185B" />
      </linearGradient>
    </defs>
    {/* Mains */}
    <path d="M8 28C8 28 4 24 4 20C4 16 8 14 12 18L14 20" stroke="#479B67" strokeWidth="3" strokeLinecap="round" fill="none" />
    <path d="M40 28C40 28 44 24 44 20C44 16 40 14 36 18L34 20" stroke="#479B67" strokeWidth="3" strokeLinecap="round" fill="none" />
    {/* Paumes */}
    <path d="M14 20L10 30C10 34 14 38 24 38C34 38 38 34 38 30L34 20" stroke="#479B67" strokeWidth="3" strokeLinecap="round" fill="none" />
    {/* Cœur central */}
    <path d="M24 30C24 30 16 24 16 18C16 14 20 12 24 16C28 12 32 14 32 18C32 24 24 30 24 30Z" fill="url(#donateGrad)" />
    {/* Sparkles */}
    <circle cx="12" cy="10" r="2" fill="#FF8C00" />
    <circle cx="36" cy="10" r="2" fill="#FF8C00" />
    <path d="M24 4L25 7L28 6L26 8L28 10L25 9L24 12L23 9L20 10L22 8L20 6L23 7L24 4Z" fill="#FFE066" />
  </svg>
);

// ==================== ESTREAM ICONS ====================

// Like Icon - Cœur moderne
export const EStreamLikeIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="estreamLikeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF6B6B" />
        <stop offset="100%" stopColor="#FF4757" />
      </linearGradient>
    </defs>
    <path
      d="M24 42C24 42 6 30 6 20C6 14 10 10 14 10C17 10 20 12 24 15C28 12 31 10 34 10C38 10 42 14 42 20C42 30 24 42 24 42Z"
      fill="url(#estreamLikeGrad)"
      stroke="url(#estreamLikeGrad)"
      strokeWidth="1.5"
    />
  </svg>
);

// Comment Icon - Bulle de chat moderne
export const EStreamCommentIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="estreamCommentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    <path
      d="M8 10C8 8 9 6 11 6H37C39 6 40 8 40 10V28C40 30 39 32 37 32H16L10 38V32H11C9 32 8 30 8 28V10Z"
      fill="url(#estreamCommentGrad)"
      stroke="url(#estreamCommentGrad)"
      strokeWidth="1.5"
    />
    <circle cx="16" cy="18" r="2" fill="white" opacity="0.8" />
    <circle cx="24" cy="18" r="2" fill="white" opacity="0.8" />
    <circle cx="32" cy="18" r="2" fill="white" opacity="0.8" />
  </svg>
);

// Share Icon - Partage moderne
export const EStreamShareIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="estreamShareGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFB84D" />
        <stop offset="100%" stopColor="#FF9800" />
      </linearGradient>
    </defs>
    {/* Cercle haut */}
    <circle cx="36" cy="10" r="5" fill="url(#estreamShareGrad)" stroke="url(#estreamShareGrad)" strokeWidth="1.5" />
    {/* Cercle bas gauche */}
    <circle cx="12" cy="32" r="5" fill="url(#estreamShareGrad)" stroke="url(#estreamShareGrad)" strokeWidth="1.5" />
    {/* Cercle bas droit */}
    <circle cx="36" cy="32" r="5" fill="url(#estreamShareGrad)" stroke="url(#estreamShareGrad)" strokeWidth="1.5" />
    {/* Lignes de connexion */}
    <path d="M33 13L15 29" stroke="url(#estreamShareGrad)" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
    <path d="M33 13L33 29" stroke="url(#estreamShareGrad)" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
  </svg>
);

// Sound Icon - Son moderne
export const EStreamSoundIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="estreamSoundGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#5B9BFF" />
        <stop offset="100%" stopColor="#4A7FD7" />
      </linearGradient>
    </defs>
    {/* Haut-parleur */}
    <path
      d="M12 16V32C12 34 13 36 15 36H20L30 42V6L20 12H15C13 12 12 14 12 16Z"
      fill="url(#estreamSoundGrad)"
      stroke="url(#estreamSoundGrad)"
      strokeWidth="1.5"
    />
    {/* Ondes sonores */}
    <path d="M34 14C36 16 37 19 37 24C37 29 36 32 34 34" stroke="url(#estreamSoundGrad)" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
    <path d="M38 10C41 13 42 18 42 24C42 30 41 35 38 38" stroke="url(#estreamSoundGrad)" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
  </svg>
);

// Mute Icon - Muet moderne
export const EStreamMuteIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="estreamMuteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF6B6B" />
        <stop offset="100%" stopColor="#FF4757" />
      </linearGradient>
    </defs>
    {/* Haut-parleur */}
    <path
      d="M12 16V32C12 34 13 36 15 36H20L30 42V6L20 12H15C13 12 12 14 12 16Z"
      fill="url(#estreamMuteGrad)"
      stroke="url(#estreamMuteGrad)"
      strokeWidth="1.5"
    />
    {/* Ligne de prohibition */}
    <circle cx="36" cy="24" r="12" fill="none" stroke="url(#estreamMuteGrad)" strokeWidth="2" />
    <path d="M28 32L44 16" stroke="url(#estreamMuteGrad)" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

// ==================== NAVIGATION ICONS ====================

// eStream - Icône Play moderne
export const EStreamNavIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="estreamPlayGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#FFC107" />
      </linearGradient>
      <filter id="estreamGlow">
        <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    
    {/* Cercle de fond avec dégradé */}
    <circle cx="24" cy="24" r="20" fill="url(#estreamPlayGrad)" opacity="0.15" />
    
    {/* Bouton Play principal - Triangle */}
    <path 
      d="M18 16L18 32L34 24Z" 
      fill="url(#estreamPlayGrad)" 
      filter="url(#estreamGlow)"
    />
    
    {/* Contour du triangle pour plus de définition */}
    <path 
      d="M18 16L18 32L34 24Z" 
      fill="none" 
      stroke="url(#estreamPlayGrad)" 
      strokeWidth="1.5"
      opacity="0.6"
    />
  </svg>
);

// Home - Maison moderne
export const HomeNavIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="homeNavGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="currentColor" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.7" />
      </linearGradient>
    </defs>
    {/* Toit */}
    <path d="M24 6L4 22H10V40H38V22H44L24 6Z" fill="url(#homeNavGrad)" />
    {/* Fenêtre */}
    <rect x="18" y="26" width="12" height="14" rx="2" fill="#fff" fillOpacity="0.3" />
    {/* Porte intérieure */}
    <rect x="20" y="30" width="8" height="10" rx="1" fill="#fff" fillOpacity="0.5" />
    {/* Cheminée */}
    <rect x="32" y="12" width="4" height="10" rx="1" fill="currentColor" fillOpacity="0.8" />
  </svg>
);

// Wallet - Portefeuille stylisé
export const WalletNavIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="walletNavGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="currentColor" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.7" />
      </linearGradient>
    </defs>
    {/* Corps du portefeuille */}
    <rect x="4" y="12" width="40" height="28" rx="4" fill="url(#walletNavGrad)" />
    {/* Rabat */}
    <path d="M4 16C4 13.79 5.79 12 8 12H40C42.21 12 44 13.79 44 16V20H4V16Z" fill="currentColor" fillOpacity="0.8" />
    {/* Compartiment cartes */}
    <rect x="28" y="24" width="12" height="10" rx="2" fill="#fff" fillOpacity="0.3" />
    {/* Cercle monnaie */}
    <circle cx="34" cy="29" r="3" fill="#fff" fillOpacity="0.5" />
    {/* Lignes de cartes */}
    <rect x="8" y="26" width="14" height="2" rx="1" fill="#fff" fillOpacity="0.3" />
    <rect x="8" y="32" width="10" height="2" rx="1" fill="#fff" fillOpacity="0.3" />
  </svg>
);

// History - Horloge avec flèche
export const HistoryNavIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="historyNavGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="currentColor" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.7" />
      </linearGradient>
    </defs>
    {/* Cercle horloge */}
    <circle cx="26" cy="26" r="18" fill="url(#historyNavGrad)" />
    {/* Cadran intérieur */}
    <circle cx="26" cy="26" r="14" fill="none" stroke="#fff" strokeWidth="2" strokeOpacity="0.3" />
    {/* Aiguilles */}
    <line x1="26" y1="26" x2="26" y2="16" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    <line x1="26" y1="26" x2="34" y2="26" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    {/* Centre */}
    <circle cx="26" cy="26" r="2" fill="#fff" />
    {/* Flèche de retour */}
    <path d="M12 8L6 14L12 20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6 14H18C22 14 26 18 26 22" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
  </svg>
);

// Report/AI - Document intelligent
export const ReportNavIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="reportNavGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="currentColor" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.7" />
      </linearGradient>
    </defs>
    {/* Document */}
    <path d="M10 6H30L38 14V42H10V6Z" fill="url(#reportNavGrad)" />
    <path d="M30 6V14H38" fill="currentColor" fillOpacity="0.5" />
    {/* Lignes de texte */}
    <rect x="14" y="20" width="20" height="2" rx="1" fill="#fff" fillOpacity="0.4" />
    <rect x="14" y="26" width="16" height="2" rx="1" fill="#fff" fillOpacity="0.4" />
    <rect x="14" y="32" width="12" height="2" rx="1" fill="#fff" fillOpacity="0.4" />
    {/* Sparkle AI */}
    <circle cx="38" cy="38" r="8" fill="currentColor" />
    <path d="M38 32L39 36L43 35L40 37L42 40L39 38L37 41L38 38L34 39L37 37L35 34L38 36L38 32Z" fill="#fff" />
  </svg>
);

// Chat - Bulles de discussion
export const ChatNavIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="chatNavGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="currentColor" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.7" />
      </linearGradient>
    </defs>
    {/* Bulle principale */}
    <path d="M6 10H34C36.2 10 38 11.8 38 14V28C38 30.2 36.2 32 34 32H16L8 40V32H6C3.8 32 2 30.2 2 28V14C2 11.8 3.8 10 6 10Z" fill="url(#chatNavGrad)" />
    {/* Points de typing */}
    <circle cx="12" cy="21" r="2" fill="#fff" fillOpacity="0.6" />
    <circle cx="20" cy="21" r="2" fill="#fff" fillOpacity="0.6" />
    <circle cx="28" cy="21" r="2" fill="#fff" fillOpacity="0.6" />
    {/* Bulle secondaire */}
    <path d="M42 18H44C45.1 18 46 18.9 46 20V32C46 33.1 45.1 34 44 34H42V38L38 34H32C30.9 34 30 33.1 30 32V28" stroke="currentColor" strokeWidth="2" fill="none" strokeOpacity="0.5" />
  </svg>
);

// E-commerce - Panier stylisé
export const ShopNavIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="shopNavGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="currentColor" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.7" />
      </linearGradient>
    </defs>
    {/* Panier */}
    <path d="M8 16L12 38H36L40 16H8Z" fill="url(#shopNavGrad)" />
    {/* Anse */}
    <path d="M16 16V12C16 8 20 4 24 4C28 4 32 8 32 12V16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
    {/* Lignes décoratives */}
    <line x1="14" y1="24" x2="34" y2="24" stroke="#fff" strokeWidth="2" strokeOpacity="0.3" />
    <line x1="15" y1="32" x2="33" y2="32" stroke="#fff" strokeWidth="2" strokeOpacity="0.3" />
    {/* Badge */}
    <circle cx="38" cy="12" r="6" fill="#FF8C00" />
    <text x="38" y="15" textAnchor="middle" fontSize="8" fill="#fff" fontWeight="bold">+</text>
  </svg>
);

// Logistique - Camion/livraison
export const LogisticsNavIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="logNavGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="currentColor" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.7" />
      </linearGradient>
    </defs>
    {/* Corps du camion */}
    <rect x="4" y="14" width="28" height="18" rx="2" fill="url(#logNavGrad)" />
    {/* Cabine */}
    <path d="M32 20H40C42 20 44 22 44 24V32H32V20Z" fill="currentColor" fillOpacity="0.8" />
    {/* Fenêtre cabine */}
    <rect x="34" y="22" width="8" height="6" rx="1" fill="#fff" fillOpacity="0.4" />
    {/* Roues */}
    <circle cx="14" cy="34" r="5" fill="currentColor" />
    <circle cx="14" cy="34" r="2" fill="#fff" fillOpacity="0.5" />
    <circle cx="38" cy="34" r="5" fill="currentColor" />
    <circle cx="38" cy="34" r="2" fill="#fff" fillOpacity="0.5" />
    {/* Colis */}
    <rect x="8" y="18" width="8" height="8" rx="1" fill="#FF8C00" fillOpacity="0.8" />
    <rect x="18" y="20" width="6" height="6" rx="1" fill="#FF8C00" fillOpacity="0.6" />
  </svg>
);

// Connexion/Social - Personnes connectées
export const SocialNavIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="socialNavGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="currentColor" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.7" />
      </linearGradient>
    </defs>
    {/* Personne centrale */}
    <circle cx="24" cy="14" r="6" fill="url(#socialNavGrad)" />
    <path d="M14 32C14 26 18 22 24 22C30 22 34 26 34 32" fill="url(#socialNavGrad)" />
    {/* Personne gauche */}
    <circle cx="10" cy="18" r="4" fill="currentColor" fillOpacity="0.6" />
    <path d="M4 30C4 26 6 24 10 24C14 24 16 26 16 30" fill="currentColor" fillOpacity="0.6" />
    {/* Personne droite */}
    <circle cx="38" cy="18" r="4" fill="currentColor" fillOpacity="0.6" />
    <path d="M32 30C32 26 34 24 38 24C42 24 44 26 44 30" fill="currentColor" fillOpacity="0.6" />
    {/* Lignes de connexion */}
    <path d="M16 16L20 14M28 14L32 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.4" />
  </svg>
);

// AI Bot - Robot intelligent
export const AINavIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="aiNavGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="currentColor" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.7" />
      </linearGradient>
    </defs>
    {/* Tête du robot */}
    <rect x="10" y="12" width="28" height="24" rx="6" fill="url(#aiNavGrad)" />
    {/* Antenne */}
    <line x1="24" y1="6" x2="24" y2="12" stroke="currentColor" strokeWidth="2" />
    <circle cx="24" cy="5" r="3" fill="#FF8C00" />
    {/* Yeux */}
    <circle cx="18" cy="22" r="4" fill="#fff" />
    <circle cx="18" cy="22" r="2" fill="currentColor" fillOpacity="0.8" />
    <circle cx="30" cy="22" r="4" fill="#fff" />
    <circle cx="30" cy="22" r="2" fill="currentColor" fillOpacity="0.8" />
    {/* Bouche/écran */}
    <rect x="16" y="28" width="16" height="4" rx="2" fill="#fff" fillOpacity="0.5" />
    {/* Oreilles */}
    <rect x="4" y="18" width="6" height="12" rx="2" fill="currentColor" fillOpacity="0.6" />
    <rect x="38" y="18" width="6" height="12" rx="2" fill="currentColor" fillOpacity="0.6" />
    {/* Corps indication */}
    <path d="M18 36V42H30V36" stroke="currentColor" strokeWidth="2" fill="none" strokeOpacity="0.5" />
  </svg>
);

// Settings - Engrenage moderne
export const SettingsNavIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="settingsNavGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="currentColor" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.7" />
      </linearGradient>
    </defs>
    {/* Engrenage principal */}
    <path d="M24 4L28 8L34 6L36 12L42 14L40 20L44 24L40 28L42 34L36 36L34 42L28 40L24 44L20 40L14 42L12 36L6 34L8 28L4 24L8 20L6 14L12 12L14 6L20 8L24 4Z" fill="url(#settingsNavGrad)" />
    {/* Cercle central */}
    <circle cx="24" cy="24" r="8" fill="#fff" fillOpacity="0.3" />
    <circle cx="24" cy="24" r="5" fill="#fff" fillOpacity="0.5" />
    {/* Points de réglage */}
    <circle cx="24" cy="24" r="2" fill="currentColor" />
  </svg>
);

// Payment/Mbongo - Pièces et billets
export const PaymentNavIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="payNavGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="currentColor" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.7" />
      </linearGradient>
    </defs>
    {/* Billet */}
    <rect x="4" y="14" width="32" height="20" rx="3" fill="url(#payNavGrad)" />
    <circle cx="20" cy="24" r="6" fill="#fff" fillOpacity="0.3" />
    <text x="20" y="27" textAnchor="middle" fontSize="8" fill="#fff" fontWeight="bold">$</text>
    {/* Pièces empilées */}
    <ellipse cx="38" cy="30" rx="8" ry="4" fill="currentColor" />
    <ellipse cx="38" cy="26" rx="8" ry="4" fill="currentColor" fillOpacity="0.9" />
    <ellipse cx="38" cy="22" rx="8" ry="4" fill="#FF8C00" />
    {/* Reflet pièce */}
    <ellipse cx="36" cy="22" rx="2" ry="1" fill="#fff" fillOpacity="0.5" />
  </svg>
);

// ==================== MODULE SPECIFIC ICONS ====================

// Miyiki Chat Header Icon
export const MiyikiChatIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="miyikiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    {/* Bulle principale */}
    <path d="M6 8H34C36.2 8 38 9.8 38 12V28C38 30.2 36.2 32 34 32H16L8 40V32H6C3.8 32 2 30.2 2 28V12C2 9.8 3.8 8 6 8Z" fill="url(#miyikiGrad)" />
    {/* Points de message */}
    <circle cx="12" cy="20" r="2.5" fill="#fff" />
    <circle cx="20" cy="20" r="2.5" fill="#fff" />
    <circle cx="28" cy="20" r="2.5" fill="#fff" />
    {/* Bulle secondaire */}
    <path d="M42 14H44C45.1 14 46 14.9 46 16V26C46 27.1 45.1 28 44 28H42V32L38 28H34" stroke="#FF8C00" strokeWidth="2" fill="none" />
    {/* Étoile notification */}
    <circle cx="40" cy="10" r="6" fill="#FF8C00" />
    <text x="40" y="13" textAnchor="middle" fontSize="8" fill="#fff" fontWeight="bold">!</text>
  </svg>
);

// Nkampa E-commerce Icon
export const NkampaIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="nkampaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF8C00" />
        <stop offset="100%" stopColor="#E67E00" />
      </linearGradient>
    </defs>
    {/* Panier */}
    <path d="M6 14L10 38H38L42 14H6Z" fill="url(#nkampaGrad)" />
    {/* Anse */}
    <path d="M14 14V10C14 6 18 2 24 2C30 2 34 6 34 10V14" stroke="#479B67" strokeWidth="3" strokeLinecap="round" fill="none" />
    {/* Produits dans le panier */}
    <rect x="12" y="20" width="8" height="10" rx="2" fill="#479B67" />
    <rect x="22" y="22" width="6" height="8" rx="1" fill="#479B67" />
    <circle cx="34" cy="26" r="4" fill="#479B67" />
    {/* Badge promo */}
    <circle cx="40" cy="8" r="6" fill="#479B67" />
    <text x="40" y="11" textAnchor="middle" fontSize="7" fill="#fff" fontWeight="bold">%</text>
    {/* Étoile qualité */}
    <path d="M8 8L9 11L12 10L10 12L12 14L9 13L8 16L7 13L4 14L6 12L4 10L7 11L8 8Z" fill="#FFE066" />
  </svg>
);

// Ugavi Logistics Icon
export const UgaviIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="ugaviGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    {/* Avion cargo */}
    <path d="M40 16L24 24L8 16L24 8L40 16Z" fill="url(#ugaviGrad)" />
    <path d="M24 24V40L8 32V16L24 24Z" fill="#479B67" />
    <path d="M24 24V40L40 32V16L24 24Z" fill="#479B67" />
    {/* Colis */}
    <rect x="18" y="26" width="12" height="8" rx="1" fill="#FF8C00" />
    <line x1="24" y1="26" x2="24" y2="34" stroke="#E67E00" strokeWidth="1" />
    <line x1="18" y1="30" x2="30" y2="30" stroke="#E67E00" strokeWidth="1" />
    {/* Flèche de direction */}
    <path d="M36 6L42 10L36 14" stroke="#FF8C00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M42 10H32" stroke="#FF8C00" strokeWidth="2" strokeLinecap="round" />
    {/* Globe indication */}
    <circle cx="8" cy="40" r="5" stroke="#479B67" strokeWidth="1.5" fill="none" />
    <ellipse cx="8" cy="40" rx="5" ry="2" stroke="#479B67" strokeWidth="1" fill="none" />
    <line x1="8" y1="35" x2="8" y2="45" stroke="#479B67" strokeWidth="1" />
  </svg>
);

// Makutano Social Icon
export const MakutanoIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="makutanoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#9C27B0" />
        <stop offset="100%" stopColor="#7B1FA2" />
      </linearGradient>
    </defs>
    {/* Cercle central */}
    <circle cx="24" cy="24" r="10" fill="url(#makutanoGrad)" />
    {/* Personnes autour */}
    <circle cx="24" cy="6" r="4" fill="#479B67" />
    <circle cx="24" cy="2" r="2.5" fill="#479B67" />
    <circle cx="40" cy="16" r="4" fill="#FF8C00" />
    <circle cx="40" cy="12" r="2.5" fill="#FF8C00" />
    <circle cx="40" cy="32" r="4" fill="#479B67" />
    <circle cx="40" cy="28" r="2.5" fill="#479B67" />
    <circle cx="24" cy="42" r="4" fill="#FF8C00" />
    <circle cx="24" cy="38" r="2.5" fill="#FF8C00" />
    <circle cx="8" cy="32" r="4" fill="#479B67" />
    <circle cx="8" cy="28" r="2.5" fill="#479B67" />
    <circle cx="8" cy="16" r="4" fill="#FF8C00" />
    <circle cx="8" cy="12" r="2.5" fill="#FF8C00" />
    {/* Connexions */}
    <circle cx="24" cy="24" r="16" stroke="#9C27B0" strokeWidth="1" strokeDasharray="3 2" fill="none" opacity="0.5" />
    {/* Cœur central */}
    <path d="M24 28C24 28 20 25 20 22C20 20 22 19 24 21C26 19 28 20 28 22C28 25 24 28 24 28Z" fill="#fff" />
  </svg>
);

export const MakutanoCreateIcon = ({ className, size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("", className)}>
    <defs>
      <linearGradient id="makutanoCreateGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    <rect x="8" y="10" width="28" height="28" rx="8" fill="url(#makutanoCreateGrad)" />
    <path d="M22 17V31M15 24H29" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
    <circle cx="35" cy="13" r="7" fill="#FF8C00" />
    <path d="M32 13H38M35 10V16" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const MakutanoMusicIcon = ({ className, size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("", className)}>
    <defs>
      <linearGradient id="makutanoMusicGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF8C00" />
        <stop offset="100%" stopColor="#E67E00" />
      </linearGradient>
    </defs>
    <path d="M18 10V32" stroke="url(#makutanoMusicGrad)" strokeWidth="5" strokeLinecap="round" />
    <path d="M18 10L36 6V26" stroke="url(#makutanoMusicGrad)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="14" cy="34" r="7" fill="#479B67" />
    <circle cx="32" cy="28" r="7" fill="#479B67" />
    <path d="M8 14C11 11 14 10 18 10" stroke="#479B67" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
  </svg>
);

export const MakutanoMoreIcon = ({ className, size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("", className)}>
    <circle cx="14" cy="24" r="5" fill="#479B67" />
    <circle cx="24" cy="24" r="5" fill="#479B67" />
    <circle cx="34" cy="24" r="5" fill="#FF8C00" />
    <path d="M14 34C20 38 28 38 34 34" stroke="#479B67" strokeWidth="2" strokeLinecap="round" opacity="0.55" />
  </svg>
);

export const MakutanoLikeIcon = ({ className, size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("", className)}>
    <defs>
      <linearGradient id="makutanoLikeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    <path d="M17 20V40H10C8 40 6 38 6 36V24C6 22 8 20 10 20H17Z" fill="#FF8C00" />
    <path d="M17 20L24 8C26 5 31 7 30 11L28 18H37C41 18 43 22 42 26L39 37C38 40 36 42 32 42H17V20Z" fill="url(#makutanoLikeGrad)" />
    <path d="M22 21L27 12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity="0.65" />
  </svg>
);

export const MakutanoCommentIcon = ({ className, size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("", className)}>
    <defs>
      <linearGradient id="makutanoCommentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    <path d="M8 12C8 8 11 6 15 6H33C37 6 40 8 40 12V27C40 31 37 33 33 33H24L13 42V33C10 33 8 30 8 27V12Z" fill="url(#makutanoCommentGrad)" />
    <circle cx="18" cy="20" r="2.5" fill="#fff" />
    <circle cx="24" cy="20" r="2.5" fill="#fff" />
    <circle cx="30" cy="20" r="2.5" fill="#fff" />
    <circle cx="38" cy="10" r="5" fill="#FF8C00" />
  </svg>
);

export const MakutanoShareIcon = ({ className, size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("", className)}>
    <defs>
      <linearGradient id="makutanoShareGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    <path d="M7 24L41 8L33 40L25 28L15 34L18 25L7 24Z" fill="url(#makutanoShareGrad)" />
    <path d="M18 25L41 8L25 28" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
    <circle cx="35" cy="13" r="5" fill="#FF8C00" />
  </svg>
);

export const MakutanoPlayIcon = ({ className, size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("", className)}>
    <defs>
      <linearGradient id="makutanoPlayGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    <circle cx="24" cy="24" r="18" fill="url(#makutanoPlayGrad)" />
    <path d="M20 15L34 24L20 33V15Z" fill="#fff" />
    <circle cx="36" cy="12" r="5" fill="#FF8C00" />
  </svg>
);

export const MakutanoPauseIcon = ({ className, size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("", className)}>
    <defs>
      <linearGradient id="makutanoPauseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    <circle cx="24" cy="24" r="18" fill="url(#makutanoPauseGrad)" />
    <rect x="17" y="15" width="5" height="18" rx="2" fill="#fff" />
    <rect x="26" y="15" width="5" height="18" rx="2" fill="#fff" />
    <circle cx="12" cy="36" r="5" fill="#FF8C00" />
  </svg>
);

export const MakutanoAudioIcon = ({ className, size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("", className)}>
    <defs>
      <linearGradient id="makutanoAudioGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    <path d="M8 18H16L28 8V40L16 30H8V18Z" fill="url(#makutanoAudioGrad)" />
    <path d="M34 18C37 21 37 27 34 30" stroke="#FF8C00" strokeWidth="4" strokeLinecap="round" />
    <path d="M39 13C45 19 45 29 39 35" stroke="#FF8C00" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
  </svg>
);

export const MakutanoBookIcon = ({ className, size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("", className)}>
    <defs>
      <linearGradient id="makutanoBookGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    <path d="M8 8H22V40H9C6 40 4 38 4 35V12C4 10 6 8 8 8Z" fill="url(#makutanoBookGrad)" />
    <path d="M26 8H40C42 8 44 10 44 12V35C44 38 42 40 39 40H26V8Z" fill="#FF8C00" />
    <path d="M24 8V40" stroke="#479B67" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M11 16H18M11 22H17M31 16H38M31 22H37" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.75" />
  </svg>
);

export const MakutanoIdeaIcon = ({ className, size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("", className)}>
    <defs>
      <linearGradient id="makutanoIdeaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF8C00" />
        <stop offset="100%" stopColor="#E67E00" />
      </linearGradient>
    </defs>
    <path d="M24 4C14 4 7 12 7 21C7 27 10 32 16 35V39C16 42 18 44 21 44H27C30 44 32 42 32 39V35C38 32 41 27 41 21C41 12 34 4 24 4Z" fill="url(#makutanoIdeaGrad)" />
    <path d="M18 39H30M20 44H28" stroke="#479B67" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M18 22C18 18 20 16 24 16" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity="0.65" />
    <path d="M33 8L36 4M39 15L44 13M39 24H44" stroke="#479B67" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

// eNkamba AI Icon
export const EnkambaAIIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="enkambaAIGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
      <linearGradient id="brainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF8C00" />
        <stop offset="100%" stopColor="#E67E00" />
      </linearGradient>
    </defs>
    {/* Tête robot */}
    <rect x="8" y="10" width="32" height="28" rx="8" fill="url(#enkambaAIGrad)" />
    {/* Yeux LED */}
    <rect x="14" y="18" width="8" height="6" rx="2" fill="#fff" />
    <rect x="26" y="18" width="8" height="6" rx="2" fill="#fff" />
    <rect x="16" y="20" width="4" height="2" rx="1" fill="#479B67" />
    <rect x="28" y="20" width="4" height="2" rx="1" fill="#479B67" />
    {/* Bouche écran */}
    <rect x="16" y="28" width="16" height="6" rx="2" fill="#479B67" />
    <rect x="18" y="30" width="3" height="2" rx="0.5" fill="#479B67" />
    <rect x="22.5" y="30" width="3" height="2" rx="0.5" fill="#479B67" />
    <rect x="27" y="30" width="3" height="2" rx="0.5" fill="#479B67" />
    {/* Antenne */}
    <line x1="24" y1="4" x2="24" y2="10" stroke="#479B67" strokeWidth="2" />
    <circle cx="24" cy="4" r="3" fill="url(#brainGrad)" />
    {/* Ondes AI */}
    <path d="M6 20C4 22 4 26 6 28" stroke="#FF8C00" strokeWidth="2" strokeLinecap="round" fill="none" />
    <path d="M2 18C-1 22 -1 26 2 30" stroke="#FF8C00" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5" />
    <path d="M42 20C44 22 44 26 42 28" stroke="#FF8C00" strokeWidth="2" strokeLinecap="round" fill="none" />
    <path d="M46 18C49 22 49 26 46 30" stroke="#FF8C00" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5" />
    {/* Sparkles */}
    <path d="M40 6L41 8L43 7L42 9L44 10L42 10L41 12L40 10L38 10L40 9L39 7L41 8L40 6Z" fill="#FFE066" />
  </svg>
);

// Settings Page Icon
export const SettingsPageIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="settingsPageGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    {/* Grand engrenage */}
    <path d="M24 2L28 6L35 4L38 10L45 11L44 18L48 24L44 30L45 37L38 38L35 44L28 42L24 46L20 42L13 44L10 38L3 37L4 30L0 24L4 18L3 11L10 10L13 4L20 6L24 2Z" fill="url(#settingsPageGrad)" />
    {/* Cercle intérieur */}
    <circle cx="24" cy="24" r="10" fill="#fff" fillOpacity="0.2" />
    {/* Petit engrenage */}
    <circle cx="24" cy="24" r="6" fill="#479B67" />
    <circle cx="24" cy="24" r="3" fill="#fff" fillOpacity="0.5" />
    {/* Sliders */}
    <rect x="20" y="22" width="8" height="2" rx="1" fill="#FF8C00" />
    <rect x="22" y="25" width="4" height="2" rx="1" fill="#FF8C00" />
  </svg>
);

// User Profile Icon
export const UserProfileIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="userProfileGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    {/* Cercle fond */}
    <circle cx="24" cy="24" r="22" fill="url(#userProfileGrad)" />
    {/* Tête */}
    <circle cx="24" cy="18" r="8" fill="#fff" />
    {/* Corps */}
    <path d="M10 42C10 34 16 28 24 28C32 28 38 34 38 42" fill="#fff" />
    {/* Badge vérifié */}
    <circle cx="36" cy="36" r="7" fill="#FF8C00" />
    <path d="M33 36L35 38L39 34" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Security Icon
export const SecurityIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="securityGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    {/* Bouclier */}
    <path d="M24 4L6 10V22C6 34 14 42 24 46C34 42 42 34 42 22V10L24 4Z" fill="url(#securityGrad)" />
    {/* Cadenas */}
    <rect x="16" y="22" width="16" height="14" rx="3" fill="#479B67" />
    <path d="M20 22V18C20 15.8 21.8 14 24 14C26.2 14 28 15.8 28 18V22" stroke="#479B67" strokeWidth="3" fill="none" />
    {/* Trou serrure */}
    <circle cx="24" cy="28" r="2" fill="#FF8C00" />
    <rect x="23" y="28" width="2" height="4" rx="1" fill="#FF8C00" />
  </svg>
);

// Notification Bell Icon
export const NotificationIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="notifGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    {/* Cloche */}
    <path d="M24 4C24 4 12 8 12 22V32L8 36V38H40V36L36 32V22C36 8 24 4 24 4Z" fill="url(#notifGrad)" />
    {/* Battant */}
    <circle cx="24" cy="42" r="4" fill="#479B67" />
    {/* Ondes */}
    <path d="M8 18C6 20 6 24 8 26" stroke="#FF8C00" strokeWidth="2" strokeLinecap="round" fill="none" />
    <path d="M40 18C42 20 42 24 40 26" stroke="#FF8C00" strokeWidth="2" strokeLinecap="round" fill="none" />
    {/* Badge notification */}
    <circle cx="36" cy="12" r="6" fill="#FF8C00" />
    <text x="36" y="15" textAnchor="middle" fontSize="8" fill="#fff" fontWeight="bold">3</text>
  </svg>
);

// Theme/Palette Icon
export const ThemeIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="themeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    {/* Palette */}
    <path d="M24 4C12.95 4 4 12.95 4 24C4 35.05 12.95 44 24 44C25.66 44 27 42.66 27 41C27 40.2 26.68 39.48 26.18 38.94C25.7 38.42 25.4 37.74 25.4 37C25.4 35.34 26.74 34 28.4 34H32C38.63 34 44 28.63 44 22C44 12.06 35.05 4 24 4Z" fill="url(#themeGrad)" />
    {/* Couleurs */}
    <circle cx="14" cy="18" r="4" fill="#FF8C00" />
    <circle cx="22" cy="12" r="4" fill="#9C27B0" />
    <circle cx="32" cy="14" r="4" fill="#4FC3F7" />
    <circle cx="14" cy="28" r="4" fill="#E91E63" />
  </svg>
);

// Language/Globe Icon
export const LanguageIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="langGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    {/* Globe */}
    <circle cx="24" cy="24" r="20" fill="url(#langGrad)" />
    {/* Méridiens */}
    <ellipse cx="24" cy="24" rx="20" ry="8" stroke="#fff" strokeWidth="1.5" fill="none" strokeOpacity="0.5" />
    <ellipse cx="24" cy="24" rx="8" ry="20" stroke="#fff" strokeWidth="1.5" fill="none" strokeOpacity="0.5" />
    <line x1="4" y1="24" x2="44" y2="24" stroke="#fff" strokeWidth="1.5" strokeOpacity="0.5" />
    <line x1="24" y1="4" x2="24" y2="44" stroke="#fff" strokeWidth="1.5" strokeOpacity="0.5" />
    {/* Texte A */}
    <circle cx="38" cy="38" r="8" fill="#FF8C00" />
    <text x="38" y="42" textAnchor="middle" fontSize="10" fill="#fff" fontWeight="bold">A</text>
  </svg>
);

// Help/Support Icon
export const HelpIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="helpGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    {/* Bouée */}
    <circle cx="24" cy="24" r="18" fill="url(#helpGrad)" />
    <circle cx="24" cy="24" r="8" fill="#fff" />
    {/* Bandes */}
    <path d="M10 14L18 22" stroke="#FF8C00" strokeWidth="6" strokeLinecap="round" />
    <path d="M30 22L38 14" stroke="#FF8C00" strokeWidth="6" strokeLinecap="round" />
    <path d="M30 26L38 34" stroke="#FF8C00" strokeWidth="6" strokeLinecap="round" />
    <path d="M10 34L18 26" stroke="#FF8C00" strokeWidth="6" strokeLinecap="round" />
    {/* Point d'interrogation */}
    <text x="24" y="28" textAnchor="middle" fontSize="12" fill="#479B67" fontWeight="bold">?</text>
  </svg>
);

// Logout Icon
export const LogoutIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="logoutGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E53935" />
        <stop offset="100%" stopColor="#C62828" />
      </linearGradient>
    </defs>
    {/* Porte */}
    <rect x="6" y="8" width="24" height="32" rx="3" fill="url(#logoutGrad)" />
    <rect x="10" y="12" width="16" height="24" rx="2" fill="#fff" fillOpacity="0.3" />
    {/* Poignée */}
    <circle cx="24" cy="24" r="2" fill="#fff" />
    {/* Flèche sortie */}
    <path d="M32 24H44" stroke="#E53935" strokeWidth="3" strokeLinecap="round" />
    <path d="M40 18L46 24L40 30" stroke="#E53935" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

// New Conversation Icon
export const NewChatIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="newChatGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF8C00" />
        <stop offset="100%" stopColor="#E67E00" />
      </linearGradient>
    </defs>
    {/* Bulle */}
    <path d="M8 10H32C34.2 10 36 11.8 36 14V28C36 30.2 34.2 32 32 32H16L8 40V32C5.8 32 4 30.2 4 28V14C4 11.8 5.8 10 8 10Z" fill="url(#newChatGrad)" />
    {/* Plus */}
    <line x1="20" y1="16" x2="20" y2="26" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    <line x1="15" y1="21" x2="25" y2="21" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    {/* Étoile */}
    <circle cx="40" cy="12" r="6" fill="#479B67" />
    <path d="M40 8L41 11L44 10L42 12L44 14L41 13L40 16L39 13L36 14L38 12L36 10L39 11L40 8Z" fill="#fff" />
  </svg>
);

// Search Icon
export const SearchIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="searchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    {/* Cercle loupe */}
    <circle cx="20" cy="20" r="14" stroke="url(#searchGrad)" strokeWidth="4" fill="none" />
    {/* Verre */}
    <circle cx="20" cy="20" r="8" fill="#479B67" fillOpacity="0.2" />
    {/* Manche */}
    <line x1="30" y1="30" x2="42" y2="42" stroke="url(#searchGrad)" strokeWidth="4" strokeLinecap="round" />
    {/* Reflet */}
    <path d="M14 12C16 10 20 10 22 12" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />
  </svg>
);

// Send Package Icon
export const SendPackageIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="sendPkgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    {/* Colis */}
    <rect x="8" y="16" width="24" height="20" rx="2" fill="url(#sendPkgGrad)" />
    <line x1="20" y1="16" x2="20" y2="36" stroke="#479B67" strokeWidth="2" />
    <line x1="8" y1="26" x2="32" y2="26" stroke="#479B67" strokeWidth="2" />
    {/* Ruban */}
    <rect x="16" y="12" width="8" height="4" rx="1" fill="#FF8C00" />
    {/* Flèche envoi */}
    <path d="M36 24L44 16L44 22H40" stroke="#FF8C00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M44 16L36 8" stroke="#FF8C00" strokeWidth="2" strokeLinecap="round" fill="none" />
  </svg>
);

// Track Package Icon
export const TrackPackageIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="trackPkgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF8C00" />
        <stop offset="100%" stopColor="#E67E00" />
      </linearGradient>
    </defs>
    {/* Colis */}
    <rect x="6" y="20" width="20" height="16" rx="2" fill="url(#trackPkgGrad)" />
    <line x1="16" y1="20" x2="16" y2="36" stroke="#E67E00" strokeWidth="1.5" />
    <line x1="6" y1="28" x2="26" y2="28" stroke="#E67E00" strokeWidth="1.5" />
    {/* Loupe */}
    <circle cx="36" cy="20" r="8" stroke="#479B67" strokeWidth="3" fill="none" />
    <line x1="42" y1="26" x2="46" y2="30" stroke="#479B67" strokeWidth="3" strokeLinecap="round" />
    {/* Check dans loupe */}
    <path d="M32 20L35 23L40 17" stroke="#479B67" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    {/* Points de suivi */}
    <circle cx="10" cy="42" r="2" fill="#479B67" />
    <circle cx="20" cy="42" r="2" fill="#479B67" />
    <circle cx="30" cy="42" r="2" fill="#FF8C00" />
    <line x1="12" y1="42" x2="18" y2="42" stroke="#479B67" strokeWidth="1" strokeDasharray="2 1" />
    <line x1="22" y1="42" x2="28" y2="42" stroke="#479B67" strokeWidth="1" strokeDasharray="2 1" />
  </svg>
);

export const UgaviPlayIcon = ({ className, size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("", className)}>
    <defs>
      <linearGradient id="ugaviPlayGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    <circle cx="24" cy="24" r="18" fill="url(#ugaviPlayGrad)" />
    <path d="M20 16L34 24L20 32V16Z" fill="#fff" />
    <path d="M9 39C15 35 21 34 28 35" stroke="#FF8C00" strokeWidth="3" strokeLinecap="round" strokeDasharray="4 3" />
  </svg>
);

export const UgaviPauseIcon = ({ className, size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("", className)}>
    <defs>
      <linearGradient id="ugaviPauseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    <circle cx="24" cy="24" r="18" fill="url(#ugaviPauseGrad)" />
    <rect x="17" y="15" width="5" height="18" rx="2" fill="#fff" />
    <rect x="26" y="15" width="5" height="18" rx="2" fill="#fff" />
    <circle cx="36" cy="12" r="5" fill="#FF8C00" />
  </svg>
);

export const UgaviStopIcon = ({ className, size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("", className)}>
    <defs>
      <linearGradient id="ugaviStopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF8C00" />
        <stop offset="100%" stopColor="#E67E00" />
      </linearGradient>
    </defs>
    <circle cx="24" cy="24" r="18" fill="url(#ugaviStopGrad)" />
    <rect x="16" y="16" width="16" height="16" rx="3" fill="#fff" />
    <path d="M10 38H38" stroke="#479B67" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const UgaviShareIcon = ({ className, size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("", className)}>
    <defs>
      <linearGradient id="ugaviShareGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    <circle cx="14" cy="24" r="6" fill="#FF8C00" />
    <circle cx="34" cy="13" r="6" fill="url(#ugaviShareGrad)" />
    <circle cx="34" cy="35" r="6" fill="url(#ugaviShareGrad)" />
    <path d="M19 22L29 16M19 26L29 32" stroke="#479B67" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

// Calculator Icon
export const CalculatorIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="calcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    {/* Corps calculatrice */}
    <rect x="8" y="4" width="32" height="40" rx="4" fill="url(#calcGrad)" />
    {/* Écran */}
    <rect x="12" y="8" width="24" height="10" rx="2" fill="#479B67" />
    <text x="32" y="15" textAnchor="end" fontSize="8" fill="#479B67" fontWeight="bold">123</text>
    {/* Boutons */}
    <rect x="12" y="22" width="6" height="5" rx="1" fill="#fff" fillOpacity="0.8" />
    <rect x="21" y="22" width="6" height="5" rx="1" fill="#fff" fillOpacity="0.8" />
    <rect x="30" y="22" width="6" height="5" rx="1" fill="#FF8C00" />
    <rect x="12" y="30" width="6" height="5" rx="1" fill="#fff" fillOpacity="0.8" />
    <rect x="21" y="30" width="6" height="5" rx="1" fill="#fff" fillOpacity="0.8" />
    <rect x="30" y="30" width="6" height="5" rx="1" fill="#FF8C00" />
    <rect x="12" y="38" width="15" height="4" rx="1" fill="#fff" fillOpacity="0.8" />
    <rect x="30" y="38" width="6" height="4" rx="1" fill="#479B67" />
  </svg>
);

// Map Pin Icon
export const MapPinIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="mapPinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E53935" />
        <stop offset="100%" stopColor="#C62828" />
      </linearGradient>
    </defs>
    {/* Pin */}
    <path d="M24 4C15.16 4 8 11.16 8 20C8 31 24 44 24 44C24 44 40 31 40 20C40 11.16 32.84 4 24 4Z" fill="url(#mapPinGrad)" />
    {/* Cercle intérieur */}
    <circle cx="24" cy="20" r="8" fill="#fff" />
    {/* Point central */}
    <circle cx="24" cy="20" r="4" fill="#479B67" />
    {/* Ombre */}
    <ellipse cx="24" cy="44" rx="6" ry="2" fill="#000" fillOpacity="0.2" />
  </svg>
);

// Export all icons as a collection
export const ServiceIcons = {
  // Financial Services
  savings: SavingsIcon,
  credit: CreditIcon,
  tontine: TontineIcon,
  conversion: ConversionIcon,
  referral: ReferralIcon,
  agent: AgentIcon,
  linkAccount: LinkAccountIcon,
  bonus: BonusIcon,
  // Bills & Partners
  tax: TaxIcon,
  yango: YangoIcon,
  water: WaterIcon,
  tv: TvIcon,
  academic: AcademicIcon,
  school: SchoolIcon,
  flight: FlightIcon,
  hotel: HotelIcon,
  health: HealthIcon,
  healthEmergency: HealthEmergencyIcon,
  healthHospital: HealthHospitalIcon,
  healthDoctor: HealthDoctorIcon,
  healthPharmacy: HealthPharmacyIcon,
  healthTeleconsult: HealthTeleconsultIcon,
  fiveGo: FiveGoIcon,
  fiveGoHotel: FiveGoHotelIcon,
  fiveGoFlight: FiveGoFlightIcon,
  fiveGoBus: FiveGoBusIcon,
  mobility: MobilityIcon,
  motoRide: MotoRideIcon,
  ridePhone: RidePhoneIcon,
  rideShield: RideShieldIcon,
  rideStar: RideStarIcon,
  event: EventIcon,
  phoneCredit: PhoneCreditIcon,
  insurance: InsuranceIcon,
  donation: DonationIcon,
  // Navigation
  homeNav: HomeNavIcon,
  walletNav: WalletNavIcon,
  historyNav: HistoryNavIcon,
  reportNav: ReportNavIcon,
  chatNav: ChatNavIcon,
  shopNav: ShopNavIcon,
  logisticsNav: LogisticsNavIcon,
  socialNav: SocialNavIcon,
  aiNav: AINavIcon,
  settingsNav: SettingsNavIcon,
  paymentNav: PaymentNavIcon,
  // Module Specific
  miyikiChat: MiyikiChatIcon,
  nkampa: NkampaIcon,
  ugavi: UgaviIcon,
  makutano: MakutanoIcon,
  makutanoCreate: MakutanoCreateIcon,
  makutanoMusic: MakutanoMusicIcon,
  makutanoMore: MakutanoMoreIcon,
  makutanoLike: MakutanoLikeIcon,
  makutanoComment: MakutanoCommentIcon,
  makutanoShare: MakutanoShareIcon,
  makutanoPlay: MakutanoPlayIcon,
  makutanoPause: MakutanoPauseIcon,
  makutanoAudio: MakutanoAudioIcon,
  makutanoBook: MakutanoBookIcon,
  makutanoIdea: MakutanoIdeaIcon,
  enkambaAI: EnkambaAIIcon,
  settingsPage: SettingsPageIcon,
  userProfile: UserProfileIcon,
  security: SecurityIcon,
  notification: NotificationIcon,
  theme: ThemeIcon,
  language: LanguageIcon,
  help: HelpIcon,
  logout: LogoutIcon,
  newChat: NewChatIcon,
  search: SearchIcon,
  sendPackage: SendPackageIcon,
  trackPackage: TrackPackageIcon,
  ugaviPlay: UgaviPlayIcon,
  ugaviPause: UgaviPauseIcon,
  ugaviStop: UgaviStopIcon,
  ugaviShare: UgaviShareIcon,
  calculator: CalculatorIcon,
  mapPin: MapPinIcon,
};


// ==================== ACTIONS RAPIDES PERSONNALISÉES ====================

// Envoyer - Flèche d'envoi stylisée
export const SendIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="sendGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    {/* Enveloppe */}
    <path d="M6 12H42V36C42 38.2 40.2 40 38 40H10C7.8 40 6 38.2 6 36V12Z" fill="url(#sendGrad)" />
    {/* Rabat */}
    <path d="M6 12L24 26L42 12" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    {/* Flèche d'envoi */}
    <path d="M28 32L38 22L36 24L28 32Z" fill="#FF8C00" />
    <path d="M28 32L38 22" stroke="#FF8C00" strokeWidth="2.5" strokeLinecap="round" />
    {/* Sparkle */}
    <circle cx="42" cy="8" r="2" fill="#FF8C00" />
  </svg>
);

// Recevoir - Flèche de réception
export const ReceiveIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="receiveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4FC3F7" />
        <stop offset="100%" stopColor="#0288D1" />
      </linearGradient>
    </defs>
    {/* Boîte de réception */}
    <path d="M6 14H42V32C42 34.2 40.2 36 38 36H10C7.8 36 6 34.2 6 32V14Z" fill="url(#receiveGrad)" />
    {/* Rabat */}
    <path d="M6 14L24 22L42 14" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    {/* Flèche descendante */}
    <path d="M24 10V28" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    <path d="M18 22L24 28L30 22" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    {/* Sparkle */}
    <circle cx="8" cy="8" r="2" fill="#479B67" />
  </svg>
);

// Payer en Masse - Personnes avec argent
export const BulkPayIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="bulkPayGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#9C27B0" />
        <stop offset="100%" stopColor="#7B1FA2" />
      </linearGradient>
    </defs>
    {/* Personne 1 */}
    <circle cx="12" cy="10" r="4" fill="#479B67" />
    <path d="M8 16C8 14 10 14 12 14C14 14 16 14 16 16V22H8V16Z" fill="#479B67" />
    {/* Personne 2 */}
    <circle cx="24" cy="8" r="5" fill="url(#bulkPayGrad)" />
    <path d="M18 16C18 13 21 13 24 13C27 13 30 13 30 16V24H18V16Z" fill="url(#bulkPayGrad)" />
    {/* Personne 3 */}
    <circle cx="36" cy="10" r="4" fill="#FF8C00" />
    <path d="M32 16C32 14 34 14 36 14C38 14 40 14 40 16V22H32V16Z" fill="#FF8C00" />
    {/* Billets d'argent */}
    <rect x="10" y="28" width="12" height="8" rx="1" fill="#479B67" />
    <text x="16" y="34" textAnchor="middle" fontSize="5" fill="#fff" fontWeight="bold">$</text>
    <rect x="24" y="30" width="12" height="8" rx="1" fill="#FF8C00" />
    <text x="30" y="36" textAnchor="middle" fontSize="5" fill="#fff" fontWeight="bold">$</text>
    <rect x="38" y="28" width="8" height="8" rx="1" fill="#479B67" />
    <text x="42" y="34" textAnchor="middle" fontSize="4" fill="#fff" fontWeight="bold">$</text>
    {/* Flèches de distribution */}
    <path d="M16 26L16 28" stroke="#479B67" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M30 28L30 30" stroke="#FF8C00" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M42 26L42 28" stroke="#479B67" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// Demander - Main avec demande
export const RequestIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="requestGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF8C00" />
        <stop offset="100%" stopColor="#E67E00" />
      </linearGradient>
    </defs>
    {/* Main ouverte */}
    <path d="M8 24L8 12C8 10 10 8 12 8C14 8 16 10 16 12V20" stroke="url(#requestGrad)" strokeWidth="3" fill="none" strokeLinecap="round" />
    <path d="M20 24L20 10C20 8 22 6 24 6C26 6 28 8 28 10V20" stroke="url(#requestGrad)" strokeWidth="3" fill="none" strokeLinecap="round" />
    <path d="M32 24L32 12C32 10 34 8 36 8C38 8 40 10 40 12V20" stroke="url(#requestGrad)" strokeWidth="3" fill="none" strokeLinecap="round" />
    {/* Paume */}
    <path d="M8 24C8 28 12 32 20 34C28 32 32 28 32 24H8Z" fill="url(#requestGrad)" />
    {/* Poignet */}
    <rect x="12" y="34" width="16" height="8" rx="2" fill="#479B67" />
    {/* Point d'interrogation */}
    <text x="24" y="38" textAnchor="middle" fontSize="8" fill="#fff" fontWeight="bold">?</text>
    {/* Bulle de demande */}
    <path d="M36 6C38 6 40 8 40 10V14C40 16 38 18 36 18L34 20L36 18H32C30 18 28 16 28 14V10C28 8 30 6 32 6H36Z" fill="#479B67" />
    <circle cx="34" cy="12" r="1.5" fill="#fff" />
  </svg>
);

// ==================== LOGISTIQUE - UGAVI ====================

// Monde → Monde - Globe avec paquet
export const WorldShippingIconBrand = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="worldShippingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    {/* Globe */}
    <circle cx="18" cy="18" r="14" fill="url(#worldShippingGrad)" />
    {/* Continents/Lignes */}
    <path d="M8 18C8 18 18 10 28 18" stroke="#fff" strokeWidth="1.5" fill="none" opacity="0.6" />
    <path d="M10 24L22 20L28 26" stroke="#fff" strokeWidth="1.5" fill="none" opacity="0.6" />
    <circle cx="18" cy="18" r="14" stroke="#479B67" strokeWidth="2" fill="none" />
    {/* Paquet/Boîte */}
    <path d="M32 10L40 14V26H32V10Z" fill="#FF8C00" />
    <path d="M40 14L44 18V30L40 26V14Z" fill="#E67E00" />
    <path d="M32 10L36 6L44 10L40 14L32 10Z" fill="#FFB347" />
    {/* Ruban */}
    <rect x="36" y="6" width="2" height="20" fill="#479B67" />
    <ellipse cx="37" cy="26" rx="3" ry="1.5" fill="#479B67" />
    {/* Flèche direction */}
    <path d="M24 30L28 34L26 32L30 36" stroke="#479B67" strokeWidth="2" fill="none" strokeLinecap="round" />
  </svg>
);

// Express & Standard - Camion de livraison
export const DeliveryMethodsIconBrand = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="deliveryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF8C00" />
        <stop offset="100%" stopColor="#E67E00" />
      </linearGradient>
    </defs>
    {/* Carrosserie camion */}
    <path d="M8 22L12 14H32V32L8 32V22Z" fill="url(#deliveryGrad)" />
    {/* Cabine */}
    <rect x="30" y="14" width="10" height="10" rx="1" fill="#479B67" />
    {/* Vitres cabine */}
    <rect x="32" y="16" width="3" height="4" fill="#4FC3F7" opacity="0.8" />
    <rect x="37" y="16" width="3" height="4" fill="#4FC3F7" opacity="0.8" />
    {/* Roue avant */}
    <circle cx="16" cy="32" r="5" fill="#333" />
    <circle cx="16" cy="32" r="2.5" fill="#666" />
    {/* Roue arrière */}
    <circle cx="32" cy="32" r="5" fill="#333" />
    <circle cx="32" cy="32" r="2.5" fill="#666" />
    {/* Pare-chocs/Tuyau */}
    <rect x="8" y="30" width="4" height="2" fill="#479B67" />
    {/* Lumière/Signal */}
    <circle cx="42" cy="20" r="2" fill="#FF8C00" opacity="0.8" />
    {/* Flèches vitesse */}
    <path d="M38 24L42 24M38 27L42 27" stroke="#479B67" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// Calculer les frais - Calculatrice
export const CalculateFeesIconBrand = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="calculatorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    {/* Corps calculatrice */}
    <rect x="8" y="6" width="32" height="38" rx="3" fill="url(#calculatorGrad)" />
    {/* Écran */}
    <rect x="12" y="10" width="24" height="8" rx="1" fill="#479B67" />
    {/* Texte écran */}
    <text x="24" y="16" textAnchor="middle" fontSize="5" fill="#479B67" fontWeight="bold">28,750</text>
    {/* Grille de boutons */}
    <rect x="12" y="20" width="5" height="4" rx="1" fill="#479B67" stroke="#479B67" strokeWidth="1" />
    <rect x="19" y="20" width="5" height="4" rx="1" fill="#479B67" stroke="#479B67" strokeWidth="1" />
    <rect x="26" y="20" width="5" height="4" rx="1" fill="#479B67" stroke="#479B67" strokeWidth="1" />
    <rect x="33" y="20" width="3" height="4" rx="1" fill="#FF8C00" />
    {/* Deuxième rangée */}
    <rect x="12" y="26" width="5" height="4" rx="1" fill="#479B67" stroke="#479B67" strokeWidth="1" />
    <rect x="19" y="26" width="5" height="4" rx="1" fill="#479B67" stroke="#479B67" strokeWidth="1" />
    <rect x="26" y="26" width="5" height="4" rx="1" fill="#479B67" stroke="#479B67" strokeWidth="1" />
    <rect x="33" y="26" width="3" height="4" rx="1" fill="#FF8C00" />
    {/* Troisième rangée */}
    <rect x="12" y="32" width="5" height="4" rx="1" fill="#479B67" stroke="#479B67" strokeWidth="1" />
    <rect x="19" y="32" width="5" height="4" rx="1" fill="#479B67" stroke="#479B67" strokeWidth="1" />
    <rect x="26" y="32" width="5" height="4" rx="1" fill="#479B67" stroke="#479B67" strokeWidth="1" />
    <rect x="33" y="32" width="3" height="8" rx="1" fill="#FF8C00" />
    {/* Boutons */}
    <circle cx="14.5" cy="22" r="1.5" fill="#fff" opacity="0.6" />
    <circle cx="21.5" cy="22" r="1.5" fill="#fff" opacity="0.6" />
  </svg>
);

// Trouver un point relais - Boîte postale/Locales
export const RelayPointIconBrand = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="relayGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF8C00" />
        <stop offset="100%" stopColor="#E67E00" />
      </linearGradient>
    </defs>
    {/* Bâtiment */}
    <path d="M8 28H40V42H8V28Z" fill="url(#relayGrad)" />
    {/* Toit */}
    <path d="M8 28L24 12L40 28" stroke="#479B67" strokeWidth="2" fill="none" />
    <path d="M10 28L24 16L38 28" fill="#E67E00" opacity="0.7" />
    {/* Porte */}
    <rect x="20" y="32" width="8" height="10" rx="1" fill="#479B67" />
    <circle cx="26" cy="37" r="1" fill="#FF8C00" />
    {/* Fenêtres */}
    <rect x="12" y="20" width="4" height="4" fill="#479B67" />
    <rect x="32" y="20" width="4" height="4" fill="#479B67" />
    <line x1="14" y1="20" x2="14" y2="24" stroke="#4FC3F7" strokeWidth="0.5" />
    <line x1="12" y1="22" x2="16" y2="22" stroke="#4FC3F7" strokeWidth="0.5" />
    {/* Drapeau/Indicateur */}
    <rect x="38" y="16" width="2" height="6" fill="#479B67" />
    <path d="M40 16C42 16 44 16 44 18C44 20 42 20 40 20Z" fill="#479B67" />
    {/* Marqueur localisation */}
    <circle cx="24" cy="10" r="3" fill="#479B67" stroke="#fff" strokeWidth="1" />
  </svg>
);

// Historique d'envoi - Horloge/Timeline
export const ShippingHistoryIconBrand = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="historyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    {/* Horloge */}
    <circle cx="20" cy="20" r="14" fill="url(#historyGrad)" />
    <circle cx="20" cy="20" r="12" stroke="#fff" strokeWidth="1" fill="none" opacity="0.3" />
    {/* Aiguilles */}
    <line x1="20" y1="20" x2="20" y2="10" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    <line x1="20" y1="20" x2="26" y2="20" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="20" cy="20" r="2" fill="#fff" />
    {/* Marques horaires */}
    <circle cx="20" cy="8" r="1" fill="#fff" opacity="0.7" />
    <circle cx="32" cy="20" r="1" fill="#fff" opacity="0.7" />
    <circle cx="20" cy="32" r="1" fill="#fff" opacity="0.7" />
    <circle cx="8" cy="20" r="1" fill="#fff" opacity="0.7" />
    {/* Flèche de progression */}
    <path d="M32 10L38 16L32 18" stroke="#FF8C00" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    {/* Points de timeline */}
    <circle cx="36" cy="28" r="2" fill="#FF8C00" />
    <circle cx="38" cy="36" r="2" fill="#FF8C00" opacity="0.6" />
    <line x1="36" y1="30" x2="38" y2="34" stroke="#FF8C00" strokeWidth="1" opacity="0.6" />
  </svg>
);

// ==================== CATÉGORIES E-COMMERCE ====================

// Électronique - Écran/Monitor
export const ElectronicsIconBrand = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="electronicsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    {/* Écran */}
    <rect x="8" y="6" width="32" height="24" rx="2" fill="url(#electronicsGrad)" />
    {/* Contenu écran */}
    <rect x="12" y="10" width="24" height="16" fill="#479B67" />
    {/* Cercles (boutons/interface) */}
    <circle cx="16" cy="14" r="3" fill="#479B67" opacity="0.8" />
    <circle cx="24" cy="14" r="3" fill="#FF8C00" opacity="0.8" />
    <circle cx="32" cy="14" r="3" fill="#479B67" opacity="0.8" />
    {/* Barres de contenu */}
    <rect x="14" y="20" width="6" height="2" rx="1" fill="#479B67" opacity="0.6" />
    <rect x="24" y="20" width="8" height="2" rx="1" fill="#FF8C00" opacity="0.6" />
    {/* Pied */}
    <rect x="18" y="30" width="12" height="4" fill="#479B67" />
    {/* Support */}
    <rect x="20" y="34" width="8" height="3" rx="1" fill="#479B67" />
    {/* Reflet brillant */}
    <ellipse cx="20" cy="12" rx="4" ry="2" fill="#fff" opacity="0.3" />
  </svg>
);

// Mode & Vêtements - Robe/Habit
export const FashionIconBrand = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="fashionGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF8C00" />
        <stop offset="100%" stopColor="#E67E00" />
      </linearGradient>
    </defs>
    {/* Cintres */}
    <path d="M12 8C10 8 9 9 9 11L9 30C9 32 11 34 13 34L35 34C37 34 39 32 39 30L39 11C39 9 38 8 36 8" stroke="url(#fashionGrad)" strokeWidth="2" fill="none" strokeLinecap="round" />
    {/* Robe */}
    <path d="M18 12H30L28 20L26 32C25 34 24 35 24 35C24 35 23 34 22 32L20 20L18 12Z" fill="url(#fashionGrad)" />
    {/* Nœud/détail */}
    <circle cx="24" cy="10" r="3" fill="#479B67" />
    {/* Plis */}
    <path d="M22 15V25" stroke="#E67E00" strokeWidth="1.5" opacity="0.7" />
    <path d="M26 15V25" stroke="#E67E00" strokeWidth="1.5" opacity="0.7" />
    {/* Boutons */}
    <circle cx="24" cy="18" r="1.5" fill="#fff" opacity="0.8" />
    <circle cx="24" cy="23" r="1.5" fill="#fff" opacity="0.8" />
    {/* Ceinture */}
    <ellipse cx="24" cy="19" rx="8" ry="1.5" fill="#479B67" />
  </svg>
);

// Maison & Cuisine - Maison avec ustensiles
export const HomeKitchenIconBrand = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="homeKitchenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    {/* Maison */}
    <path d="M6 24L24 8L42 24V40H6V24Z" fill="url(#homeKitchenGrad)" />
    {/* Toit */}
    <path d="M6 24L24 8L42 24" stroke="#479B67" strokeWidth="2" fill="none" />
    {/* Porte */}
    <rect x="20" y="28" width="8" height="12" rx="1" fill="#479B67" />
    <circle cx="26" cy="34" r="1.5" fill="#FF8C00" />
    {/* Fenêtres */}
    <rect x="10" y="20" width="6" height="6" rx="1" fill="#479B67" />
    <rect x="32" y="20" width="6" height="6" rx="1" fill="#479B67" />
    {/* Fourchette */}
    <line x1="12" y1="14" x2="12" y2="22" stroke="#FF8C00" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="11" cy="14" r="1" fill="#FF8C00" />
    <circle cx="13" cy="14" r="1" fill="#FF8C00" />
    {/* Couteau */}
    <path d="M36 12L36 22L34 20" stroke="#479B67" strokeWidth="2" strokeLinecap="round" />
    {/* Pot */}
    <ellipse cx="24" cy="12" rx="4" ry="3" fill="#479B67" opacity="0.7" />
    <line x1="21" y1="12" x2="27" y2="12" stroke="#FF8C00" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// Beauté & Soins - Lotion/Produit beauté
export const BeautyIconBrand = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="beautyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF8C00" />
        <stop offset="100%" stopColor="#E67E00" />
      </linearGradient>
    </defs>
    {/* Bouteille */}
    <rect x="14" y="10" width="20" height="24" rx="2" fill="url(#beautyGrad)" />
    {/* Contenu brillant */}
    <rect x="16" y="12" width="16" height="20" rx="1" fill="#E67E00" opacity="0.6" />
    {/* Bouchon */}
    <rect x="18" y="6" width="12" height="4" rx="1" fill="#479B67" />
    {/* Spray/Pompe */}
    <rect x="22" y="4" width="4" height="2" fill="#479B67" />
    {/* Étoiles/Sparkles */}
    <circle cx="32" cy="18" r="1.5" fill="#479B67" />
    <path d="M32 16L33 18L35 19L33 20L32 22L31 20L29 19L31 18L32 16Z" stroke="#479B67" strokeWidth="0.5" fill="#479B67" opacity="0.8" />
    {/* Paillettes */}
    <circle cx="20" cy="15" r="1" fill="#479B67" opacity="0.6" />
    <circle cx="26" cy="22" r="1" fill="#479B67" opacity="0.6" />
    {/* Reflet */}
    <ellipse cx="18" cy="12" rx="3" ry="2" fill="#fff" opacity="0.4" />
  </svg>
);

// Sport & Loisirs - Balle/Sports
export const SportsIconBrand = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="sportsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    {/* Balle/Sphère */}
    <circle cx="24" cy="18" r="12" fill="url(#sportsGrad)" />
    {/* Lignes de balle */}
    <path d="M14 18C14 18 18 14 24 14C30 14 34 18 34 18" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7" />
    <path d="M14 18C14 18 18 22 24 22C30 22 34 18 34 18" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7" />
    {/* Reflet brillant */}
    <circle cx="19" cy="11" r="3" fill="#fff" opacity="0.5" />
    {/* Raquette */}
    <rect x="32" y="6" width="3" height="12" fill="#479B67" rx="1" />
    <circle cx="33.5" cy="4" r="3" fill="#479B67" />
    {/* Cordage */}
    <path d="M31 4.5H36M31 6H36M31 7.5H36" stroke="#FF8C00" strokeWidth="0.5" opacity="0.8" />
    {/* Chaussure */}
    <path d="M8 30C6 28 6 34 8 36C12 38 18 36 20 32" fill="#FF8C00" opacity="0.7" />
    <ellipse cx="10" cy="33" rx="2" ry="1.5" fill="#479B67" />
  </svg>
);

// Autres - Boîte/Paquet
export const OthersIconBrand = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="othersGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF8C00" />
        <stop offset="100%" stopColor="#E67E00" />
      </linearGradient>
    </defs>
    {/* Boîte arrière */}
    <path d="M8 28L8 12C8 10 10 8 12 8L36 8C38 8 40 10 40 12L40 28" fill="url(#othersGrad)" opacity="0.7" />
    {/* Boîte avant */}
    <path d="M8 28L14 36C14 38 16 40 18 40L30 40C32 40 34 38 34 36L40 28" fill="url(#othersGrad)" />
    {/* Couvercle */}
    <path d="M10 10L24 4L38 10V12L24 6L10 12V10Z" fill="#479B67" />
    {/* Ruban/Nœud */}
    <rect x="22" y="4" width="4" height="20" fill="#479B67" />
    <ellipse cx="24" cy="24" rx="4" ry="2" fill="#479B67" />
    {/* Ombres */}
    <path d="M8 28L14 36" stroke="#479B67" strokeWidth="1" opacity="0.5" />
    <path d="M40 28L34 36" stroke="#479B67" strokeWidth="1" opacity="0.5" />
    {/* Points de scellage */}
    <circle cx="16" cy="20" r="1" fill="#fff" opacity="0.6" />
    <circle cx="32" cy="20" r="1" fill="#fff" opacity="0.6" />
  </svg>
);

// eStream Post Video Icon
export const EStreamPostIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("", className)}
  >
    <defs>
      <linearGradient id="postGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#479B67" />
        <stop offset="100%" stopColor="#479B67" />
      </linearGradient>
    </defs>
    {/* Caméra principale */}
    <rect x="8" y="12" width="32" height="24" rx="3" fill="none" stroke="url(#postGrad)" strokeWidth="2" />
    {/* Objectif */}
    <circle cx="24" cy="24" r="8" fill="none" stroke="url(#postGrad)" strokeWidth="2" />
    <circle cx="24" cy="24" r="5" fill="url(#postGrad)" opacity="0.3" />
    {/* Flash */}
    <rect x="12" y="14" width="4" height="4" rx="1" fill="url(#postGrad)" opacity="0.8" />
    {/* Bouton enregistrement */}
    <circle cx="36" cy="16" r="3" fill="#FF6B6B" />
    <circle cx="36" cy="16" r="4" fill="none" stroke="#FF6B6B" strokeWidth="1" opacity="0.5" />
    {/* Indicateur actif */}
    <circle cx="36" cy="16" r="5" fill="none" stroke="#FF6B6B" strokeWidth="0.5" opacity="0.3" />
  </svg>
);

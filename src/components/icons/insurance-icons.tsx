/**
 * Icônes des compagnies d'assurance RDC
 * Style: Moderne avec dégradés
 */

import React from 'react';

export const SonasIcon = ({ className = "w-12 h-12" }: { className?: string }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className}>
    <defs>
      <linearGradient id="sonasGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1e40af" />
        <stop offset="100%" stopColor="#3b82f6" />
      </linearGradient>
    </defs>
    {/* Bouclier */}
    <path d="M32 4L8 16v16c0 15 10 26 24 32 14-6 24-17 24-32V16L32 4z" 
      fill="url(#sonasGradient)" opacity="0.2" />
    <path d="M32 4L8 16v16c0 15 10 26 24 32 14-6 24-17 24-32V16L32 4z" 
      stroke="url(#sonasGradient)" strokeWidth="2.5" strokeLinejoin="round" />
    {/* Checkmark */}
    <path d="M20 32l8 8 16-16" stroke="url(#sonasGradient)" strokeWidth="3" 
      strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const RawbankAssuranceIcon = ({ className = "w-12 h-12" }: { className?: string }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className}>
    <defs>
      <linearGradient id="rawbankGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#dc2626" />
        <stop offset="100%" stopColor="#ef4444" />
      </linearGradient>
    </defs>
    {/* Bâtiment bancaire */}
    <rect x="12" y="24" width="40" height="32" rx="2" 
      fill="url(#rawbankGradient)" opacity="0.2" />
    <rect x="12" y="24" width="40" height="32" rx="2" 
      stroke="url(#rawbankGradient)" strokeWidth="2.5" />
    {/* Colonnes */}
    <line x1="20" y1="28" x2="20" y2="52" stroke="url(#rawbankGradient)" strokeWidth="2" />
    <line x1="32" y1="28" x2="32" y2="52" stroke="url(#rawbankGradient)" strokeWidth="2" />
    <line x1="44" y1="28" x2="44" y2="52" stroke="url(#rawbankGradient)" strokeWidth="2" />
    {/* Toit */}
    <path d="M8 24L32 8L56 24" stroke="url(#rawbankGradient)" strokeWidth="2.5" 
      strokeLinecap="round" strokeLinejoin="round" />
    {/* Bouclier */}
    <circle cx="32" cy="40" r="8" fill="url(#rawbankGradient)" />
    <path d="M28 40l3 3 5-6" stroke="white" strokeWidth="2" 
      strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const SunuAssuranceIcon = ({ className = "w-12 h-12" }: { className?: string }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className}>
    <defs>
      <linearGradient id="sunuGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#fbbf24" />
      </linearGradient>
    </defs>
    {/* Soleil */}
    <circle cx="32" cy="32" r="12" fill="url(#sunuGradient)" opacity="0.3" />
    <circle cx="32" cy="32" r="12" stroke="url(#sunuGradient)" strokeWidth="2.5" />
    {/* Rayons */}
    <line x1="32" y1="8" x2="32" y2="16" stroke="url(#sunuGradient)" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="32" y1="48" x2="32" y2="56" stroke="url(#sunuGradient)" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="8" y1="32" x2="16" y2="32" stroke="url(#sunuGradient)" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="48" y1="32" x2="56" y2="32" stroke="url(#sunuGradient)" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="14" y1="14" x2="20" y2="20" stroke="url(#sunuGradient)" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="44" y1="44" x2="50" y2="50" stroke="url(#sunuGradient)" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="50" y1="14" x2="44" y2="20" stroke="url(#sunuGradient)" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="20" y1="44" x2="14" y2="50" stroke="url(#sunuGradient)" strokeWidth="2.5" strokeLinecap="round" />
    {/* Bouclier central */}
    <path d="M32 24L26 28v4c0 3 2 5 6 6 4-1 6-3 6-6v-4l-6-4z" 
      fill="url(#sunuGradient)" />
  </svg>
);

export const ActivaAssuranceIcon = ({ className = "w-12 h-12" }: { className?: string }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className}>
    <defs>
      <linearGradient id="activaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8b5cf6" />
        <stop offset="100%" stopColor="#a78bfa" />
      </linearGradient>
    </defs>
    {/* Éclair (symbole d'activité) */}
    <path d="M36 4L20 32h12L28 60L44 32H32L36 4z" 
      fill="url(#activaGradient)" opacity="0.2" />
    <path d="M36 4L20 32h12L28 60L44 32H32L36 4z" 
      stroke="url(#activaGradient)" strokeWidth="2.5" 
      strokeLinecap="round" strokeLinejoin="round" />
    {/* Cercle de protection */}
    <circle cx="32" cy="32" r="26" stroke="url(#activaGradient)" 
      strokeWidth="2" opacity="0.3" strokeDasharray="4 4" />
  </svg>
);

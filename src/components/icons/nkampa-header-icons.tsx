import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

// Icône Retour - Flèche moderne double trait
export const NkampaBackIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19 18L13 12L19 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3"/>
  </svg>
);

// Icône Recherche - Loupe avec reflet
export const NkampaSearchIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.5"/>
    <path d="M20 20L16.5 16.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M8.5 8.5C9 7.5 10 7 11 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
  </svg>
);

// Icône Micro - Microphone avec ondes
export const NkampaMicIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="9" y="3" width="6" height="10" rx="3" stroke="currentColor" strokeWidth="2"/>
    <path d="M5 11C5 14.866 8.134 18 12 18C15.866 18 19 14.866 19 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="9" y1="22" x2="15" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// Icône Panier - Sac de shopping moderne
export const NkampaCartIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M6 2L3 6V20C3 21.1 3.9 22 5 22H19C20.1 22 21 21.1 21 20V6L18 2H6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M16 10C16 12.209 14.209 14 12 14C9.791 14 8 12.209 8 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// Icône Pulse - Animation pour micro actif
export const NkampaPulseIcon: React.FC<IconProps> = ({ className = '', size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} animate-ping`}>
    <circle cx="12" cy="12" r="10" fill="currentColor"/>
  </svg>
);

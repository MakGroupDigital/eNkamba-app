import React from 'react';

// Hero Section Icon
export const HeroIcon = ({ className = 'w-10 h-10' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="45" stroke="#32BB78" strokeWidth="2"/>
    <path d="M50 20L65 35L60 50L75 60L55 65L50 85L45 65L25 60L40 50L35 35Z" fill="#32BB78"/>
    <circle cx="50" cy="50" r="8" fill="#32BB78"/>
  </svg>
);

// Modules Section Icons
export const ModulesIcon = ({ className = 'w-10 h-10' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="15" y="15" width="25" height="25" rx="4" stroke="#32BB78" strokeWidth="2" fill="none"/>
    <rect x="60" y="15" width="25" height="25" rx="4" stroke="#32BB78" strokeWidth="2" fill="none"/>
    <rect x="15" y="60" width="25" height="25" rx="4" stroke="#32BB78" strokeWidth="2" fill="none"/>
    <rect x="60" y="60" width="25" height="25" rx="4" stroke="#32BB78" strokeWidth="2" fill="none"/>
    <circle cx="27.5" cy="27.5" r="3" fill="#32BB78"/>
    <circle cx="72.5" cy="27.5" r="3" fill="#32BB78"/>
    <circle cx="27.5" cy="72.5" r="3" fill="#32BB78"/>
    <circle cx="72.5" cy="72.5" r="3" fill="#32BB78"/>
  </svg>
);

// Module Detail Icon
export const ModuleDetailIcon = ({ className = 'w-10 h-10' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="20" y="20" width="60" height="60" rx="8" stroke="#32BB78" strokeWidth="2"/>
    <line x1="20" y1="40" x2="80" y2="40" stroke="#32BB78" strokeWidth="2"/>
    <line x1="20" y1="60" x2="80" y2="60" stroke="#32BB78" strokeWidth="2"/>
    <circle cx="35" cy="30" r="3" fill="#32BB78"/>
    <circle cx="35" cy="50" r="3" fill="#32BB78"/>
    <circle cx="35" cy="70" r="3" fill="#32BB78"/>
  </svg>
);

// Features Section Icon
export const FeaturesIcon = ({ className = 'w-10 h-10' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 50L40 70L80 30" stroke="#32BB78" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <circle cx="50" cy="50" r="35" stroke="#32BB78" strokeWidth="2" fill="none"/>
  </svg>
);

// IA Showcase Icon
export const IAIcon = ({ className = 'w-10 h-10' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="40" stroke="#32BB78" strokeWidth="2"/>
    <path d="M35 40C35 35 40 30 45 30C50 30 55 35 55 40" stroke="#32BB78" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <circle cx="40" cy="45" r="2" fill="#32BB78"/>
    <circle cx="60" cy="45" r="2" fill="#32BB78"/>
    <path d="M40 60Q50 70 60 60" stroke="#32BB78" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M30 50L25 50M70 50L75 50" stroke="#32BB78" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// Security Section Icon
export const SecurityIcon = ({ className = 'w-10 h-10' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 15L80 30V55C80 75 50 85 50 85C50 85 20 75 20 55V30L50 15Z" stroke="#32BB78" strokeWidth="2" fill="none"/>
    <path d="M40 50L48 58L62 42" stroke="#32BB78" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

// CTA Section Icon
export const CTAIcon = ({ className = 'w-10 h-10' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="40" stroke="#32BB78" strokeWidth="2"/>
    <path d="M50 25L60 45L80 50L65 62L70 82L50 70L30 82L35 62L20 50L40 45Z" fill="#32BB78"/>
  </svg>
);

// Stat Icons
export const StatSpeedIcon = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 80L50 20L80 80" stroke="#32BB78" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="50" cy="50" r="8" fill="#32BB78"/>
  </svg>
);

export const StatSecurityIcon = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="25" y="30" width="50" height="50" rx="4" stroke="#32BB78" strokeWidth="2"/>
    <circle cx="50" cy="55" r="8" stroke="#32BB78" strokeWidth="2" fill="none"/>
    <path d="M50 48V55M50 62V65" stroke="#32BB78" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const StatFreeIcon = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="35" stroke="#32BB78" strokeWidth="2"/>
    <path d="M50 30V70M35 50H65" stroke="#32BB78" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// Feature Card Icons
export const FeatureSpeedIcon = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M30 70L50 30L70 70" stroke="#32BB78" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="50" cy="50" r="6" fill="#32BB78"/>
  </svg>
);

export const FeatureSecureIcon = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 20L75 35V60C75 75 50 85 50 85C50 85 25 75 25 60V35L50 20Z" stroke="#32BB78" strokeWidth="2" fill="none"/>
    <path d="M40 55L48 63L62 45" stroke="#32BB78" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

export const FeatureGlobalIcon = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="35" stroke="#32BB78" strokeWidth="2"/>
    <path d="M50 15V85M15 50H85" stroke="#32BB78" strokeWidth="2"/>
    <circle cx="50" cy="50" r="8" fill="#32BB78"/>
  </svg>
);

export const FeatureMobileIcon = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="30" y="15" width="40" height="70" rx="4" stroke="#32BB78" strokeWidth="2"/>
    <rect x="35" y="20" width="30" height="45" stroke="#32BB78" strokeWidth="1" fill="none"/>
    <circle cx="50" cy="72" r="2" fill="#32BB78"/>
  </svg>
);

// Security Detail Icons
export const SecurityEncryptIcon = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="25" y="40" width="50" height="40" rx="4" stroke="#32BB78" strokeWidth="2"/>
    <path d="M35 40V30C35 22 42 15 50 15C58 15 65 22 65 30V40" stroke="#32BB78" strokeWidth="2" fill="none"/>
    <circle cx="50" cy="60" r="4" fill="#32BB78"/>
  </svg>
);

export const Security2FAIcon = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="20" y="30" width="30" height="40" rx="3" stroke="#32BB78" strokeWidth="2"/>
    <rect x="50" y="30" width="30" height="40" rx="3" stroke="#32BB78" strokeWidth="2"/>
    <circle cx="35" cy="50" r="3" fill="#32BB78"/>
    <circle cx="65" cy="50" r="3" fill="#32BB78"/>
  </svg>
);

export const SecurityBiometryIcon = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 20C35 20 25 30 25 45C25 60 35 70 50 70C65 70 75 60 75 45C75 30 65 20 50 20Z" stroke="#32BB78" strokeWidth="2" fill="none"/>
    <path d="M40 45L48 55L60 40" stroke="#32BB78" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

export const SecurityStandardsIcon = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 15L70 25V50C70 65 50 80 50 80C50 80 30 65 30 50V25L50 15Z" stroke="#32BB78" strokeWidth="2" fill="none"/>
    <path d="M40 50L48 58L62 42" stroke="#32BB78" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

// IA Feature Icons
export const IA24Icon = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="35" stroke="#32BB78" strokeWidth="2"/>
    <text x="50" y="60" textAnchor="middle" fontSize="24" fontWeight="bold" fill="#32BB78">24</text>
  </svg>
);

export const IAPersonalIcon = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="35" r="12" stroke="#32BB78" strokeWidth="2"/>
    <path d="M35 55C35 45 42 40 50 40C58 40 65 45 65 55V70H35V55Z" stroke="#32BB78" strokeWidth="2" fill="none"/>
    <path d="M45 60L50 65L55 60" stroke="#32BB78" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

export const IAMultiIcon = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="35" cy="35" r="15" stroke="#32BB78" strokeWidth="2"/>
    <circle cx="65" cy="35" r="15" stroke="#32BB78" strokeWidth="2"/>
    <circle cx="50" cy="65" r="15" stroke="#32BB78" strokeWidth="2"/>
    <line x1="45" y1="48" x2="50" y2="50" stroke="#32BB78" strokeWidth="1.5"/>
    <line x1="55" y1="48" x2="50" y2="50" stroke="#32BB78" strokeWidth="1.5"/>
  </svg>
);

export const IALearningIcon = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 70L50 30L80 70" stroke="#32BB78" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="50" cy="50" r="8" stroke="#32BB78" strokeWidth="2" fill="none"/>
    <path d="M50 45V55M45 50H55" stroke="#32BB78" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// Module Icons
export const MbongoModuleIcon = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="25" y="30" width="50" height="40" rx="4" stroke="#32BB78" strokeWidth="2"/>
    <path d="M35 50L50 60L65 45" stroke="#32BB78" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <circle cx="50" cy="35" r="2" fill="#32BB78"/>
  </svg>
);

export const MiyikiModuleIcon = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="20" y="25" width="60" height="50" rx="4" stroke="#32BB78" strokeWidth="2"/>
    <path d="M30 40L50 55L70 40" stroke="#32BB78" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="35" cy="35" r="1.5" fill="#32BB78"/>
    <circle cx="65" cy="35" r="1.5" fill="#32BB78"/>
  </svg>
);

export const NkampaModuleIcon = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M25 35L50 20L75 35V70C75 75 72 80 50 80C28 80 25 75 25 70V35Z" stroke="#32BB78" strokeWidth="2" fill="none"/>
    <path d="M50 35V60" stroke="#32BB78" strokeWidth="1.5"/>
    <circle cx="50" cy="50" r="3" fill="#32BB78"/>
  </svg>
);

export const UgaviModuleIcon = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="20" y="40" width="60" height="35" rx="3" stroke="#32BB78" strokeWidth="2"/>
    <path d="M30 50L50 35L70 50" stroke="#32BB78" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="35" cy="60" r="2" fill="#32BB78"/>
    <circle cx="65" cy="60" r="2" fill="#32BB78"/>
  </svg>
);

export const MakutanoModuleIcon = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="35" cy="40" r="10" stroke="#32BB78" strokeWidth="2"/>
    <circle cx="65" cy="40" r="10" stroke="#32BB78" strokeWidth="2"/>
    <circle cx="50" cy="65" r="10" stroke="#32BB78" strokeWidth="2"/>
    <line x1="42" y1="47" x2="50" y2="58" stroke="#32BB78" strokeWidth="1.5"/>
    <line x1="58" y1="47" x2="50" y2="58" stroke="#32BB78" strokeWidth="1.5"/>
  </svg>
);

export const EnkambaIAModuleIcon = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="35" stroke="#32BB78" strokeWidth="2"/>
    <path d="M40 40C40 35 44 30 50 30C56 30 60 35 60 40" stroke="#32BB78" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <circle cx="42" cy="48" r="2" fill="#32BB78"/>
    <circle cx="58" cy="48" r="2" fill="#32BB78"/>
    <path d="M42 60Q50 68 58 60" stroke="#32BB78" strokeWidth="2" fill="none" strokeLinecap="round"/>
  </svg>
);

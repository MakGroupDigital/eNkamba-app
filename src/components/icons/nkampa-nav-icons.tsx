import React from 'react';

type IconProps = { className?: string };

// Icônes navigation Nkampa (personnalisées eNkamba)
// Style: traits arrondis + léger duotone via opacité, couleur via currentColor.

export const NkampaNavShopIcon = ({ className = 'w-4 h-4' }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M4.5 9.5l1.3-4.2A2.2 2.2 0 0 1 7.9 4h8.2a2.2 2.2 0 0 1 2.1 1.3l1.3 4.2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.9"
    />
    <path
      d="M5.5 9.5V19a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V9.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9 12.5h6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.45"
    />
    <path
      d="M10 16.5h4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.45"
    />
  </svg>
);

export const NkampaNavOrdersIcon = ({ className = 'w-4 h-4' }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M7 4h10a2 2 0 0 1 2 2v14.2a1.8 1.8 0 0 1-2.6 1.6L12 19.8l-4.4 2a1.8 1.8 0 0 1-2.6-1.6V6a2 2 0 0 1 2-2Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M8 8h8M8 12h6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.55"
    />
    <path
      d="M16.9 12.1l1.6 1.6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.35"
    />
  </svg>
);

export const NkampaNavFavoritesIcon = ({ className = 'w-4 h-4' }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M12 20.2s-7-4.3-9.2-8.7C1.2 8.4 3.3 5.8 6.3 5.6c1.7-.1 3.1.7 3.9 2 0 0 .9-2.1 3.9-2 3 .2 5.1 2.8 3.5 5.9C19 15.9 12 20.2 12 20.2Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M8.2 9.6c.7-1 2-1.5 3.1-1.2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.4"
    />
  </svg>
);

export const NkampaNavSellerIcon = ({ className = 'w-4 h-4' }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M12 12.2a4.2 4.2 0 1 0 0-8.4 4.2 4.2 0 0 0 0 8.4Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M4.5 20a7.5 7.5 0 0 1 15 0"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M16.7 14.7l1.2 1.2 2.1-2.1"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.5"
    />
  </svg>
);


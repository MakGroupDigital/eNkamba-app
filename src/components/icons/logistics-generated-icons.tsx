/* eslint-disable max-lines */
'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type IconProps = {
  className?: string;
  size?: number;
};

const BadgeBase = ({ size = 24, className, children }: IconProps & { children: ReactNode }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn('', className)}
  >
    <circle cx="24" cy="24" r="22" fill="#009058" />
    <circle cx="24" cy="24" r="20" fill="#009058" fillOpacity="0.78" />
    <circle cx="24" cy="24" r="17" fill="#FFFFFF" fillOpacity="0.16" />
    {children}
  </svg>
);

export const LogisticsExpressIcon = ({ className, size = 24 }: IconProps) => (
  <BadgeBase className={className} size={size}>
    <rect x="9" y="18" width="18" height="12" rx="2" fill="#fff" />
    <rect x="27" y="21" width="7" height="9" rx="1" fill="#fff" />
    <circle cx="15" cy="33" r="3" fill="#FFA500" />
    <circle cx="30" cy="33" r="3" fill="#FFA500" />
    <path d="M30 14L37 20L30 26" stroke="#FFA500" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </BadgeBase>
);

export const LogisticsStandardIcon = ({ className, size = 24 }: IconProps) => (
  <BadgeBase className={className} size={size}>
    <rect x="9" y="17" width="25" height="13" rx="2" fill="#fff" />
    <rect x="12" y="13" width="14" height="6" rx="1.5" fill="#FFA500" />
    <circle cx="16" cy="33" r="3" fill="#009058" />
    <circle cx="29" cy="33" r="3" fill="#009058" />
  </BadgeBase>
);

export const LogisticsInternationalIcon = ({ className, size = 24 }: IconProps) => (
  <BadgeBase className={className} size={size}>
    <circle cx="24" cy="24" r="10" stroke="#fff" strokeWidth="2" fill="none" />
    <ellipse cx="24" cy="24" rx="10" ry="4" stroke="#fff" strokeWidth="1.5" fill="none" />
    <ellipse cx="24" cy="24" rx="4" ry="10" stroke="#fff" strokeWidth="1.5" fill="none" />
    <path d="M36 11L40 14L36 17" stroke="#FFA500" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M40 14H31" stroke="#FFA500" strokeWidth="2.5" strokeLinecap="round" />
  </BadgeBase>
);

export const LogisticsTrackingIcon = ({ className, size = 24 }: IconProps) => (
  <BadgeBase className={className} size={size}>
    <rect x="12" y="10" width="24" height="30" rx="4" fill="#fff" />
    <rect x="16" y="15" width="10" height="2" rx="1" fill="#009058" />
    <rect x="16" y="20" width="14" height="2" rx="1" fill="#009058" />
    <circle cx="24" cy="30" r="5" fill="#009058" />
    <path d="M22 30L24 32L27 28" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </BadgeBase>
);

export const LogisticsRelayIcon = ({ className, size = 24 }: IconProps) => (
  <BadgeBase className={className} size={size}>
    <path d="M10 26L24 14L38 26" fill="#fff" />
    <rect x="14" y="24" width="20" height="12" rx="2" fill="#fff" />
    <rect x="21" y="28" width="6" height="8" rx="1" fill="#009058" />
  </BadgeBase>
);

export const LogisticsAgencyIcon = ({ className, size = 24 }: IconProps) => (
  <BadgeBase className={className} size={size}>
    <rect x="10" y="14" width="28" height="22" rx="2" fill="#fff" />
    <rect x="12" y="10" width="24" height="5" rx="1.5" fill="#FFA500" />
    <rect x="15" y="20" width="4" height="12" rx="1" fill="#009058" />
    <rect x="22" y="20" width="4" height="12" rx="1" fill="#009058" />
    <rect x="29" y="20" width="4" height="12" rx="1" fill="#009058" />
  </BadgeBase>
);

export const LogisticsCourierIcon = ({ className, size = 24 }: IconProps) => (
  <BadgeBase className={className} size={size}>
    <circle cx="18" cy="33" r="3" fill="#fff" />
    <circle cx="31" cy="33" r="3" fill="#fff" />
    <path d="M11 30H34L31 24H17L15 20H11" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <rect x="23" y="16" width="10" height="7" rx="1.5" fill="#FFA500" />
  </BadgeBase>
);

export const LogisticsWalkModeIcon = ({ className, size = 24 }: IconProps) => (
  <BadgeBase className={className} size={size}>
    <circle cx="24" cy="14" r="3.2" fill="#fff" />
    <path d="M24 18L20 24L24 27L27 23L24 18Z" fill="#fff" />
    <path d="M22 27L18 34M26 27L31 34" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
  </BadgeBase>
);

export const LogisticsBikeModeIcon = ({ className, size = 24 }: IconProps) => (
  <BadgeBase className={className} size={size}>
    <circle cx="16" cy="31" r="5" stroke="#fff" strokeWidth="2" fill="none" />
    <circle cx="33" cy="31" r="5" stroke="#fff" strokeWidth="2" fill="none" />
    <path d="M16 31L22 24L27 31H22L19 27" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M23 18H28" stroke="#FFA500" strokeWidth="2" strokeLinecap="round" />
  </BadgeBase>
);

export const LogisticsMotoModeIcon = ({ className, size = 24 }: IconProps) => (
  <BadgeBase className={className} size={size}>
    <circle cx="16" cy="32" r="4" fill="#fff" />
    <circle cx="32" cy="32" r="4" fill="#fff" />
    <path d="M12 31H36L31 24H24L21 20H17" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <rect x="24" y="16" width="8" height="5" rx="1.5" fill="#FFA500" />
  </BadgeBase>
);

export const LogisticsCarModeIcon = ({ className, size = 24 }: IconProps) => (
  <BadgeBase className={className} size={size}>
    <rect x="10" y="22" width="28" height="10" rx="4" fill="#fff" />
    <path d="M14 22L19 17H30L34 22" fill="#fff" />
    <circle cx="18" cy="33" r="3" fill="#FFA500" />
    <circle cx="30" cy="33" r="3" fill="#FFA500" />
  </BadgeBase>
);

export const LogisticsTrainModeIcon = ({ className, size = 24 }: IconProps) => (
  <BadgeBase className={className} size={size}>
    <rect x="13" y="11" width="22" height="24" rx="5" fill="#fff" />
    <rect x="17" y="16" width="6" height="5" rx="1" fill="#009058" />
    <rect x="25" y="16" width="6" height="5" rx="1" fill="#009058" />
    <rect x="17" y="24" width="14" height="3" rx="1.5" fill="#009058" />
    <path d="M18 35L15 39M30 35L33 39" stroke="#FFA500" strokeWidth="2" strokeLinecap="round" />
  </BadgeBase>
);

import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

const SvgDefs = () => (
  <defs>
    <linearGradient id="chatPrimaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#009058" />
      <stop offset="100%" stopColor="#009058" />
    </linearGradient>
    <linearGradient id="chatAccentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#FFA500" />
      <stop offset="100%" stopColor="#FFA500" />
    </linearGradient>
  </defs>
);

export const ChatEmptyIcon: React.FC<IconProps> = ({ size = 48, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <SvgDefs />
    <path d="M8 10C8 7.8 9.8 6 12 6H36C38.2 6 40 7.8 40 10V27C40 29.2 38.2 31 36 31H22L12 40V31C9.8 31 8 29.2 8 27V10Z" fill="url(#chatPrimaryGrad)" />
    <circle cx="17" cy="18" r="2.5" fill="#fff" />
    <circle cx="24" cy="18" r="2.5" fill="#fff" />
    <circle cx="31" cy="18" r="2.5" fill="#fff" />
    <path d="M28 34H40L34 42L28 34Z" fill="url(#chatAccentGrad)" opacity="0.95" />
  </svg>
);

export const ChatPlusIcon: React.FC<IconProps> = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <SvgDefs />
    <circle cx="24" cy="24" r="18" fill="url(#chatPrimaryGrad)" />
    <rect x="21" y="13" width="6" height="22" rx="2" fill="#fff" />
    <rect x="13" y="21" width="22" height="6" rx="2" fill="#fff" />
    <circle cx="36" cy="12" r="5" fill="url(#chatAccentGrad)" />
  </svg>
);

export const ChatGroupCustomIcon: React.FC<IconProps> = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <SvgDefs />
    <circle cx="18" cy="17" r="7" fill="url(#chatPrimaryGrad)" />
    <circle cx="32" cy="18" r="6" fill="url(#chatAccentGrad)" />
    <path d="M7 40C8 31 12 27 18 27C24 27 28 31 29 40H7Z" fill="url(#chatPrimaryGrad)" />
    <path d="M25 40C26 32 29 29 34 29C39 29 42 33 43 40H25Z" fill="#009058" opacity="0.9" />
  </svg>
);

export const ChatSentIcon: React.FC<IconProps> = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <SvgDefs />
    <circle cx="24" cy="24" r="18" fill="url(#chatPrimaryGrad)" />
    <path d="M15 24L22 31L34 17" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ChatReadIcon: React.FC<IconProps> = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <SvgDefs />
    <circle cx="24" cy="24" r="18" fill="url(#chatPrimaryGrad)" />
    <path d="M12 25L18 31L29 18" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M23 28L28 33L38 20" stroke="#FFA500" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ChatPhotoIcon: React.FC<IconProps> = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <SvgDefs />
    <rect x="8" y="10" width="32" height="28" rx="5" fill="url(#chatPrimaryGrad)" />
    <circle cx="30" cy="18" r="4" fill="#FFA500" />
    <path d="M11 34L19 25L25 31L29 27L38 36H12C11.4 36 11 35.6 11 35V34Z" fill="#fff" opacity="0.92" />
  </svg>
);

export const ChatVideoCustomIcon: React.FC<IconProps> = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <SvgDefs />
    <rect x="8" y="14" width="25" height="20" rx="5" fill="url(#chatPrimaryGrad)" />
    <path d="M33 20L42 15V33L33 28V20Z" fill="url(#chatAccentGrad)" />
    <circle cx="18" cy="24" r="4" fill="#fff" opacity="0.9" />
  </svg>
);

export const ChatMicCustomIcon: React.FC<IconProps> = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <SvgDefs />
    <rect x="17" y="6" width="14" height="24" rx="7" fill="url(#chatPrimaryGrad)" />
    <path d="M12 23C12 30 17 35 24 35C31 35 36 30 36 23" stroke="#FFA500" strokeWidth="4" strokeLinecap="round" />
    <path d="M24 35V42" stroke="#009058" strokeWidth="4" strokeLinecap="round" />
    <path d="M18 42H30" stroke="#009058" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

export const ChatLocationCustomIcon: React.FC<IconProps> = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <SvgDefs />
    <path d="M24 4C16 4 10 10 10 18C10 29 24 43 24 43C24 43 38 29 38 18C38 10 32 4 24 4Z" fill="url(#chatPrimaryGrad)" />
    <circle cx="24" cy="18" r="7" fill="#fff" />
    <circle cx="24" cy="18" r="3" fill="#FFA500" />
  </svg>
);

export const ChatNotificationIcon: React.FC<IconProps> = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <SvgDefs />
    <path d="M14 22C14 14 18 9 24 9C30 9 34 14 34 22V30L39 36H9L14 30V22Z" fill="url(#chatPrimaryGrad)" />
    <path d="M20 39C21 42 23 43 24 43C25 43 27 42 28 39H20Z" fill="#FFA500" />
    <circle cx="34" cy="12" r="5" fill="url(#chatAccentGrad)" />
  </svg>
);

export const ChatCallIcon: React.FC<IconProps> = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <SvgDefs />
    <circle cx="24" cy="24" r="18" fill="url(#chatPrimaryGrad)" />
    <path d="M17 17C18 27 24 32 31 33L35 28L30 24L27 27C24 25 22 23 21 20L24 17L20 13L17 17Z" fill="#fff" />
    <path d="M33 12C37 14 39 17 40 22" stroke="#FFA500" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const ChatEditIcon: React.FC<IconProps> = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <SvgDefs />
    <rect x="10" y="9" width="24" height="30" rx="4" fill="url(#chatPrimaryGrad)" />
    <path d="M25 31L36 20L40 24L29 35L23 37L25 31Z" fill="#FFA500" />
    <path d="M15 17H28M15 23H24" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const ChatEyeIcon: React.FC<IconProps> = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <SvgDefs />
    <path d="M5 24C10 14 16 10 24 10C32 10 38 14 43 24C38 34 32 38 24 38C16 38 10 34 5 24Z" fill="url(#chatPrimaryGrad)" />
    <circle cx="24" cy="24" r="8" fill="#fff" />
    <circle cx="24" cy="24" r="4" fill="#FFA500" />
  </svg>
);

export const ChatEyeOffIcon: React.FC<IconProps> = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <SvgDefs />
    <path d="M6 24C11 15 17 11 24 11C31 11 37 15 42 24C37 33 31 37 24 37C17 37 11 33 6 24Z" fill="url(#chatPrimaryGrad)" opacity="0.75" />
    <path d="M10 40L39 9" stroke="#FFA500" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

export const ChatLastSeenIcon: React.FC<IconProps> = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <SvgDefs />
    <circle cx="24" cy="24" r="18" fill="url(#chatPrimaryGrad)" />
    <path d="M24 13V25L32 30" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="36" cy="14" r="5" fill="url(#chatAccentGrad)" />
  </svg>
);

// Icône Discussions - Bulles de chat modernes
export const ChatDiscussionsIcon: React.FC<IconProps> = ({ size = 24, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M8 10H8.01M12 10H12.01M16 10H16.01M9 16H5C3.89543 16 3 15.1046 3 14V6C3 4.89543 3.89543 4 5 4H19C20.1046 4 21 4.89543 21 6V14C21 15.1046 20.1046 16 19 16H14L9 20V16Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <circle cx="8" cy="10" r="1.5" fill="currentColor" />
    <circle cx="12" cy="10" r="1.5" fill="currentColor" />
    <circle cx="16" cy="10" r="1.5" fill="currentColor" />
  </svg>
);

// Icône Stories - Éclair avec cercle
export const ChatStoriesIcon: React.FC<IconProps> = ({ size = 24, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle
      cx="12"
      cy="12"
      r="9"
      stroke="currentColor"
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <path
      d="M13 3L8 13H12L11 21L16 11H12L13 3Z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Icône Transactions - Graphique avec flèches
export const ChatTransactionsIcon: React.FC<IconProps> = ({ size = 24, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect
      x="3"
      y="3"
      width="18"
      height="18"
      rx="3"
      stroke="currentColor"
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <path
      d="M7 15L10 12L13 14L17 9"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14 9H17V12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="7" cy="15" r="1.5" fill="currentColor" />
    <circle cx="10" cy="12" r="1.5" fill="currentColor" />
    <circle cx="13" cy="14" r="1.5" fill="currentColor" />
    <circle cx="17" cy="9" r="1.5" fill="currentColor" />
  </svg>
);

// Icône Paramètres - Engrenage moderne
export const ChatSettingsIcon: React.FC<IconProps> = ({ size = 24, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
      stroke="currentColor"
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <path
      d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Icône Filtre "Tout"
export const ChatFilterAllIcon: React.FC<IconProps> = ({ size = 20, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect x="3" y="5" width="18" height="4" rx="2" fill="currentColor" />
    <rect x="3" y="11" width="18" height="4" rx="2" fill="currentColor" />
    <rect x="3" y="17" width="18" height="4" rx="2" fill="currentColor" />
  </svg>
);

// Icône Filtre "Non lu"
export const ChatFilterUnreadIcon: React.FC<IconProps> = ({ size = 20, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="currentColor" />
    <circle cx="12" cy="12" r="4" fill="white" />
  </svg>
);

// Icône Filtre "Lu"
export const ChatFilterReadIcon: React.FC<IconProps> = ({ size = 20, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M20 6L9 17L4 12"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M20 6L9 17"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.5"
    />
  </svg>
);

// Icône Filtre "Groupes"
export const ChatFilterGroupsIcon: React.FC<IconProps> = ({ size = 20, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.3" />
    <circle cx="17" cy="7" r="4" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.3" />
    <path
      d="M3 21C3 17.134 6.13401 14 10 14C10.695 14 11.366 14.101 12 14.288"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M14 21C14 17.134 17.134 14 21 14"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

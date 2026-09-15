// Seller Portal Icons - Modern & Professional

export const StoreStatsIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="storeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#073B9A" />
        <stop offset="100%" stopColor="#073B9A" />
      </linearGradient>
    </defs>
    <rect x="6" y="18" width="8" height="22" rx="1" fill="url(#storeGrad)" />
    <rect x="20" y="10" width="8" height="30" rx="1" fill="url(#storeGrad)" opacity="0.7" />
    <rect x="34" y="14" width="8" height="26" rx="1" fill="url(#storeGrad)" opacity="0.5" />
    <path d="M4 42H44" stroke="url(#storeGrad)" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const CustomersIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="customersGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#073B9A" />
        <stop offset="100%" stopColor="#073B9A" />
      </linearGradient>
    </defs>
    <circle cx="16" cy="12" r="6" fill="url(#customersGrad)" />
    <path d="M6 24C6 20 10 18 16 18C22 18 26 20 26 24V28C26 30 24 32 22 32H10C8 32 6 30 6 28V24Z" fill="url(#customersGrad)" opacity="0.7" />
    <circle cx="32" cy="14" r="5" fill="url(#customersGrad)" />
    <path d="M24 26C24 22.5 27.5 20 32 20C36.5 20 40 22.5 40 26V30C40 31.5 38.5 33 37 33H27C25.5 33 24 31.5 24 30V26Z" fill="url(#customersGrad)" opacity="0.5" />
  </svg>
);

export const OrdersIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="ordersGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#073B9A" />
        <stop offset="100%" stopColor="#073B9A" />
      </linearGradient>
    </defs>
    <rect x="8" y="6" width="32" height="36" rx="2" stroke="url(#ordersGrad)" strokeWidth="2" fill="none" />
    <line x1="8" y1="14" x2="40" y2="14" stroke="url(#ordersGrad)" strokeWidth="2" />
    <line x1="12" y1="20" x2="36" y2="20" stroke="url(#ordersGrad)" strokeWidth="1.5" opacity="0.7" />
    <line x1="12" y1="26" x2="36" y2="26" stroke="url(#ordersGrad)" strokeWidth="1.5" opacity="0.7" />
    <line x1="12" y1="32" x2="28" y2="32" stroke="url(#ordersGrad)" strokeWidth="1.5" opacity="0.7" />
  </svg>
);

export const DeliveryIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="deliveryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#073B9A" />
        <stop offset="100%" stopColor="#073B9A" />
      </linearGradient>
    </defs>
    <path d="M6 24H38L42 14H12L6 24Z" fill="url(#deliveryGrad)" opacity="0.7" />
    <rect x="6" y="24" width="32" height="12" rx="1" fill="url(#deliveryGrad)" />
    <circle cx="14" cy="38" r="3" fill="url(#deliveryGrad)" />
    <circle cx="30" cy="38" r="3" fill="url(#deliveryGrad)" />
    <path d="M38 26V20C38 18 39 16 41 16H44V28H38Z" fill="url(#deliveryGrad)" opacity="0.5" />
  </svg>
);

export const ProductsIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="productsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#073B9A" />
        <stop offset="100%" stopColor="#073B9A" />
      </linearGradient>
    </defs>
    <rect x="6" y="8" width="14" height="16" rx="1" fill="url(#productsGrad)" />
    <rect x="28" y="8" width="14" height="16" rx="1" fill="url(#productsGrad)" opacity="0.7" />
    <rect x="6" y="28" width="14" height="16" rx="1" fill="url(#productsGrad)" opacity="0.7" />
    <rect x="28" y="28" width="14" height="16" rx="1" fill="url(#productsGrad)" opacity="0.5" />
  </svg>
);

export const RatingIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="ratingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFD700" />
        <stop offset="100%" stopColor="#F51B2B" />
      </linearGradient>
    </defs>
    <path d="M24 4L30 18H44L33 26L39 40L24 32L9 40L15 26L4 18H18L24 4Z" fill="url(#ratingGrad)" />
  </svg>
);

export const VerifiedIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="verifiedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#073B9A" />
        <stop offset="100%" stopColor="#073B9A" />
      </linearGradient>
    </defs>
    <circle cx="24" cy="24" r="20" fill="url(#verifiedGrad)" />
    <path d="M18 24L22 28L32 18" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ExperienceIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="experienceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#073B9A" />
        <stop offset="100%" stopColor="#073B9A" />
      </linearGradient>
    </defs>
    <path d="M8 10H40C42 10 44 12 44 14V38C44 40 42 42 40 42H8C6 42 4 40 4 38V14C4 12 6 10 8 10Z" fill="url(#experienceGrad)" opacity="0.1" stroke="url(#experienceGrad)" strokeWidth="2" />
    <circle cx="12" cy="20" r="2" fill="url(#experienceGrad)" />
    <line x1="18" y1="20" x2="36" y2="20" stroke="url(#experienceGrad)" strokeWidth="2" />
    <circle cx="12" cy="30" r="2" fill="url(#experienceGrad)" />
    <line x1="18" y1="30" x2="36" y2="30" stroke="url(#experienceGrad)" strokeWidth="2" />
  </svg>
);

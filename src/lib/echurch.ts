export const ECHURCH_PRIMARY = '#073B9A';
export const ECHURCH_ORANGE = '#F51B2B';

export type ChurchAccountStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'validated'
  | 'rejected'
  | 'suspended'
  | 'archived';

export type ChurchRole =
  | 'super_admin'
  | 'country_admin'
  | 'parish_admin'
  | 'treasurer'
  | 'pastor'
  | 'auditor';

export type ChurchPaymentCategory =
  | 'tithe'
  | 'offering'
  | 'donation'
  | 'thanksgiving'
  | 'special_contribution'
  | 'building'
  | 'social_aid'
  | 'evangelism'
  | 'project'
  | 'marriage'
  | 'baptism'
  | 'conference'
  | 'retreat'
  | 'choir'
  | 'youth'
  | 'sunday_school'
  | 'media'
  | 'other';

export interface ChurchAccount {
  id: string;
  ownerId: string;
  ownerName: string;
  name: string;
  legalName?: string;
  type: 'church' | 'parish' | 'ministry' | 'community';
  country: string;
  region?: string;
  city: string;
  address: string;
  latitude?: number;
  longitude?: number;
  representativeName: string;
  representativeRole: string;
  phone: string;
  email: string;
  logoUrl?: string;
  slogan?: string;
  defaultCurrency: 'CDF';
  timezone: string;
  languages: string[];
  paymentRecipientId: string;
  paymentAlias: string;
  publicId: string;
  status: ChurchAccountStatus;
  receivedTotal: number;
  transactionCount: number;
  availableBalance: number;
  createdAt?: unknown;
  submittedAt?: unknown;
  verifiedAt?: unknown;
  rejectionReason?: string;
}

export interface ChurchParish {
  id: string;
  name: string;
  city: string;
  region?: string;
  address?: string;
  country: string;
  status: 'active' | 'inactive';
  receivedTotal: number;
  transactionCount: number;
  createdAt?: unknown;
}

export interface ChurchCampaign {
  id: string;
  name: string;
  description?: string;
  targetAmount: number;
  collectedAmount: number;
  currency: 'CDF';
  parishId?: string;
  parishName?: string;
  startsAt?: unknown;
  endsAt?: unknown;
  status: 'draft' | 'active' | 'completed' | 'closed';
  createdAt?: unknown;
}

export interface ChurchTransaction {
  id: string;
  reference: string;
  receiptNumber: string;
  churchId: string;
  churchName: string;
  parishId?: string | null;
  parishName?: string | null;
  campaignId?: string | null;
  campaignName?: string | null;
  category: ChurchPaymentCategory;
  categoryLabel: string;
  amount: number;
  currency: 'CDF';
  fees: number;
  netAmount: number;
  paymentChannel: 'enkamba_wallet';
  status: 'completed' | 'reversed' | 'pending';
  contributorId?: string | null;
  contributorName?: string | null;
  isAnonymous: boolean;
  message?: string | null;
  source: 'app' | 'qr' | 'link';
  qrId?: string | null;
  paymentTransactionId: string;
  createdAt?: unknown;
  paidAt?: unknown;
}

export interface ChurchQrCode {
  id: string;
  churchId: string;
  parishId?: string | null;
  parishName?: string | null;
  campaignId?: string | null;
  campaignName?: string | null;
  category?: ChurchPaymentCategory | null;
  categoryLabel?: string | null;
  alias: string;
  type: 'institutional' | 'parish' | 'campaign' | 'category';
  status: 'active' | 'revoked';
  createdAt?: unknown;
}

export const CHURCH_PAYMENT_CATEGORIES: Array<{
  value: ChurchPaymentCategory;
  label: string;
  description: string;
}> = [
  { value: 'tithe', label: 'Dîme', description: 'Contribution régulière' },
  { value: 'offering', label: 'Offrande', description: 'Offrande de culte' },
  { value: 'donation', label: 'Don', description: 'Soutien libre' },
  { value: 'thanksgiving', label: 'Action de grâces', description: 'Remerciement' },
  { value: 'special_contribution', label: 'Contribution spéciale', description: 'Contribution ponctuelle' },
  { value: 'building', label: 'Construction', description: 'Projet bâtiment' },
  { value: 'social_aid', label: 'Aide sociale', description: 'Soutien communautaire' },
  { value: 'evangelism', label: 'Évangélisation', description: 'Mission et évangélisation' },
  { value: 'project', label: 'Projet social', description: 'Projet de la communauté' },
  { value: 'marriage', label: 'Mariage', description: 'Cérémonie de mariage' },
  { value: 'baptism', label: 'Baptême', description: 'Cérémonie de baptême' },
  { value: 'conference', label: 'Conférence', description: 'Événement ou conférence' },
  { value: 'retreat', label: 'Retraite spirituelle', description: 'Retraite et formation' },
  { value: 'choir', label: 'Chorale', description: 'Cotisation chorale' },
  { value: 'youth', label: 'Jeunesse', description: 'Cotisation jeunesse' },
  { value: 'sunday_school', label: 'École du dimanche', description: 'Activités enfants' },
  { value: 'media', label: 'Médias', description: 'Communication et diffusion' },
  { value: 'other', label: 'Autre', description: 'Autre contribution' },
];

export const getChurchCategory = (value?: string | null) =>
  CHURCH_PAYMENT_CATEGORIES.find((category) => category.value === value) || CHURCH_PAYMENT_CATEGORIES[2];

export const formatChurchCurrency = (amount: number) =>
  new Intl.NumberFormat('fr-CD', {
    style: 'currency',
    currency: 'CDF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

export const churchStatusLabel: Record<ChurchAccountStatus, string> = {
  draft: 'Brouillon',
  submitted: 'Soumis',
  under_review: 'En vérification',
  validated: 'Validé',
  rejected: 'À corriger',
  suspended: 'Suspendu',
  archived: 'Archivé',
};

export const slugifyChurchName = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 34) || 'eglise';

export const createChurchPublicId = (country: string) => {
  const countryCode = country.trim().slice(0, 3).toUpperCase().replace(/[^A-Z]/g, '') || 'INT';
  return `ECH-${countryCode}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
};

import {
  addDoc,
  collection,
  getDocs,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentData,
  doc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type NkampaStoreProfileType = 'individual' | 'business';
export type NkampaStoreSellType = 'product' | 'service';
export type NkampaBusinessRole = 'supplier' | 'wholesaler' | 'producer' | 'retailer';

export type NkampaStore = {
  id: string;
  ownerId: string;
  profileType: NkampaStoreProfileType;
  businessRoles: NkampaBusinessRole[];
  businessSubroles?: Partial<Record<NkampaBusinessRole, string[]>>;
  sellType: NkampaStoreSellType;
  category: string;
  storeName: string;
  slug: string;
  description?: string;
  phone?: string;
  location?: string;
  logoUrl?: string;
  coverUrl?: string;
  promoEnabled?: boolean;
  promoTitle?: string;
  promoText?: string;
  promoImageUrl?: string;
  accent?: 'green' | 'amber' | 'pink' | 'sky';
  status: 'active' | 'submitted' | 'approved' | 'rejected' | 'draft';
  createdAt?: any;
  updatedAt?: any;
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

async function isSlugTaken(slug: string) {
  const q = query(collection(db, 'nkampa_stores'), where('slug', '==', slug), limit(1));
  const snap = await getDocs(q);
  return !snap.empty;
}

export async function createNkampaStore(input: {
  ownerId: string;
  profileType: NkampaStoreProfileType;
  businessRoles: NkampaBusinessRole[];
  businessSubroles?: Partial<Record<NkampaBusinessRole, string[]>>;
  sellType: NkampaStoreSellType;
  category: string;
  storeName: string;
  description?: string;
  phone?: string;
  location?: string;
}): Promise<NkampaStore> {
  const base = slugify(input.storeName || 'boutique');
  let slug = base || 'boutique';

  if (await isSlugTaken(slug)) {
    const suffix = Math.random().toString(36).slice(2, 7);
    slug = `${slug}-${suffix}`;
  }

  const status: NkampaStore['status'] = input.profileType === 'business' ? 'submitted' : 'active';

  const payload: Omit<NkampaStore, 'id'> = {
    ownerId: input.ownerId,
    profileType: input.profileType,
    businessRoles: input.profileType === 'business' ? input.businessRoles : [],
    businessSubroles: input.profileType === 'business' ? (input.businessSubroles || {}) : {},
    sellType: input.sellType,
    category: input.category,
    storeName: input.storeName,
    slug,
    description: input.description || '',
    phone: input.phone || '',
    location: input.location || '',
    logoUrl: '',
    coverUrl: '',
    promoEnabled: false,
    promoTitle: '',
    promoText: '',
    promoImageUrl: '',
    accent: 'green',
    status,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const ref = await addDoc(collection(db, 'nkampa_stores'), payload as DocumentData);
  return { id: ref.id, ...payload };
}

export async function updateNkampaStore(storeId: string, updates: Partial<NkampaStore>) {
  const ref = doc(db, 'nkampa_stores', storeId);
  await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() } as any);
}

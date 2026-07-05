'use client';

import { useMemo, useState, type ChangeEvent, type ReactNode } from 'react';
import {
  addDoc,
  collection,
  getDocs,
  limit,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import {
  ArrowLeft,
  Boxes,
  CheckCircle2,
  DownloadCloud,
  FileCheck2,
  FileArchive,
  Loader2,
  PackagePlus,
  ShieldCheck,
  UploadCloud,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { uploadToCloudinary, type CloudinaryUploadResult } from '@/lib/cloudinary-upload';
import { getMarketplaceComplianceRequirements } from '@/lib/compliance-rules';
import type { BusinessUser } from '@/types/business-dashboard.types';

type CommerceProfile = 'seller' | 'supplier' | 'wholesaler' | 'producer' | 'retailer';
type ListingType = 'product' | 'service' | 'digital';
type DigitalProductType = 'pdf' | 'ebook' | 'logo' | 'template' | 'course' | 'software' | 'design' | 'other';
type CommerceFieldKey =
  | 'moq'
  | 'stock'
  | 'packaging'
  | 'batch'
  | 'expiry'
  | 'origin'
  | 'certification'
  | 'warranty'
  | 'specs'
  | 'capacity'
  | 'serviceArea'
  | 'duration'
  | 'digitalFormat';

type CommerceBuilderConfig = {
  title: string;
  description: string;
  role: CommerceProfile;
  defaultAudience: 'B2B' | 'B2C';
  defaultCategory: string;
  defaultSubcategory: string;
  listingType: ListingType;
  cta: string;
  requiredFields: CommerceFieldKey[];
  badges: string[];
};

const COMMERCE_CONFIGS: Record<string, CommerceBuilderConfig> = {
  WHOLESALE: {
    title: 'Catalogue grossiste',
    description: 'Ajout optimisé pour ventes en lots, MOQ, prix professionnel et disponibilité fournisseur.',
    role: 'wholesaler',
    defaultAudience: 'B2B',
    defaultCategory: 'alimentaire',
    defaultSubcategory: 'cereales',
    listingType: 'product',
    cta: 'Publier dans le marché B2B',
    requiredFields: ['moq', 'stock', 'packaging'],
    badges: ['B2B', 'MOQ', 'Lots', 'Facture'],
  },
  RETAIL: {
    title: 'Catalogue détaillant',
    description: 'Ajout rapide pour vente au détail, disponibilité locale et livraison client.',
    role: 'retailer',
    defaultAudience: 'B2C',
    defaultCategory: 'mode',
    defaultSubcategory: 'vetements',
    listingType: 'product',
    cta: 'Publier pour les clients',
    requiredFields: ['stock', 'packaging'],
    badges: ['B2C', 'Stock', 'Livraison', 'Paiement sécurisé'],
  },
  EQUIPMENT_PRODUCER: {
    title: 'Catalogue équipements',
    description: 'Ajout professionnel pour machines, équipements, garantie, spécifications et devis.',
    role: 'producer',
    defaultAudience: 'B2B',
    defaultCategory: 'electro',
    defaultSubcategory: 'energie',
    listingType: 'product',
    cta: 'Publier l’équipement',
    requiredFields: ['stock', 'warranty', 'specs', 'capacity'],
    badges: ['Équipement', 'Garantie', 'Spécifications', 'B2B'],
  },
  PRODUCT_PRODUCER: {
    title: 'Catalogue fabricant',
    description: 'Ajout adapté aux producteurs avec capacité, origine, lots et disponibilité de production.',
    role: 'producer',
    defaultAudience: 'B2B',
    defaultCategory: 'maison',
    defaultSubcategory: 'meubles',
    listingType: 'product',
    cta: 'Publier la production',
    requiredFields: ['stock', 'origin', 'capacity', 'packaging'],
    badges: ['Fabricant', 'Capacité', 'Origine', 'Lots'],
  },
  FOOD_SUPPLY: {
    title: 'Catalogue alimentaire',
    description: 'Ajout avec traçabilité, lot, conservation et date limite pour produits alimentaires.',
    role: 'supplier',
    defaultAudience: 'B2B',
    defaultCategory: 'alimentaire',
    defaultSubcategory: 'frais',
    listingType: 'product',
    cta: 'Publier le produit alimentaire',
    requiredFields: ['stock', 'batch', 'expiry', 'origin', 'packaging'],
    badges: ['Traçabilité', 'Lot', 'Date limite', 'Contrôle qualité'],
  },
  BIO_PRODUCTS: {
    title: 'Catalogue bio & fermier',
    description: 'Ajout pour produits bio, origine ferme, certification et traçabilité courte.',
    role: 'producer',
    defaultAudience: 'B2C',
    defaultCategory: 'bio',
    defaultSubcategory: 'legumes',
    listingType: 'product',
    cta: 'Publier le produit bio',
    requiredFields: ['stock', 'origin', 'certification', 'batch'],
    badges: ['Bio', 'Origine', 'Certification', 'Traçabilité'],
  },
  DIGITAL_SERVICES: {
    title: 'Catalogue digital',
    description: 'Ajout pour offres numériques, prestation digitale, livraison en ligne ou accès personnalisé.',
    role: 'supplier',
    defaultAudience: 'B2B',
    defaultCategory: 'digital',
    defaultSubcategory: 'logiciels',
    listingType: 'digital',
    cta: 'Publier l’offre digitale',
    requiredFields: ['digitalFormat', 'duration'],
    badges: ['Digital', 'Service', 'Accès contrôlé', 'Support'],
  },
  SERVICES: {
    title: 'Catalogue services',
    description: 'Ajout pour prestations professionnelles avec zone, durée, disponibilité et conditions.',
    role: 'seller',
    defaultAudience: 'B2C',
    defaultCategory: 'service',
    defaultSubcategory: 'formation',
    listingType: 'service',
    cta: 'Publier le service',
    requiredFields: ['serviceArea', 'duration'],
    badges: ['Service', 'Zone', 'Réservation', 'Support'],
  },
};

const MARKET_CATEGORIES = [
  { value: 'alimentaire', label: 'Alimentaire' },
  { value: 'bio', label: 'Bio & fermier' },
  { value: 'tech', label: 'Technologie' },
  { value: 'electro', label: 'Équipement / Électro' },
  { value: 'mode', label: 'Mode' },
  { value: 'maison', label: 'Maison' },
  { value: 'beaute', label: 'Beauté & santé' },
  { value: 'sports', label: 'Sports' },
  { value: 'accessoires', label: 'Accessoires' },
  { value: 'digital', label: 'Digital' },
  { value: 'service', label: 'Service' },
];

const MARKET_SUBCATEGORIES: Record<string, Array<{ value: string; label: string }>> = {
  alimentaire: [
    { value: 'cereales', label: 'Céréales' },
    { value: 'boissons', label: 'Boissons' },
    { value: 'epices', label: 'Épices' },
    { value: 'snacks', label: 'Snacks' },
    { value: 'frais', label: 'Produits frais' },
  ],
  bio: [
    { value: 'legumes', label: 'Légumes' },
    { value: 'fruits', label: 'Fruits' },
    { value: 'miel', label: 'Miel' },
    { value: 'tisanes', label: 'Tisanes' },
    { value: 'graines', label: 'Graines' },
  ],
  tech: [
    { value: 'smartphones', label: 'Smartphones' },
    { value: 'ordinateurs', label: 'Ordinateurs' },
    { value: 'accessoires', label: 'Accessoires' },
    { value: 'audio', label: 'Audio' },
  ],
  electro: [
    { value: 'cuisine', label: 'Cuisine' },
    { value: 'entretien', label: 'Entretien' },
    { value: 'clim', label: 'Climatisation' },
    { value: 'energie', label: 'Énergie' },
  ],
  mode: [
    { value: 'vetements', label: 'Vêtements' },
    { value: 'chaussures', label: 'Chaussures' },
    { value: 'sacs', label: 'Sacs' },
    { value: 'montres', label: 'Montres' },
  ],
  maison: [
    { value: 'decor', label: 'Décor' },
    { value: 'meubles', label: 'Meubles' },
    { value: 'linge', label: 'Linge' },
    { value: 'cuisine', label: 'Cuisine' },
  ],
  beaute: [
    { value: 'soins', label: 'Soins' },
    { value: 'parfums', label: 'Parfums' },
    { value: 'makeup', label: 'Maquillage' },
    { value: 'cheveux', label: 'Cheveux' },
  ],
  sports: [
    { value: 'fitness', label: 'Fitness' },
    { value: 'ballons', label: 'Ballons' },
    { value: 'equipements', label: 'Équipements' },
    { value: 'tenues', label: 'Tenues' },
  ],
  accessoires: [
    { value: 'telephones', label: 'Téléphones' },
    { value: 'mode', label: 'Mode' },
    { value: 'auto', label: 'Auto' },
    { value: 'maison', label: 'Maison' },
  ],
  digital: [
    { value: 'templates', label: 'Templates' },
    { value: 'cours', label: 'Cours' },
    { value: 'logiciels', label: 'Logiciels' },
    { value: 'ebooks', label: 'E-books' },
    { value: 'design', label: 'Design' },
    { value: 'marketing', label: 'Marketing' },
  ],
  service: [
    { value: 'livraison', label: 'Livraison' },
    { value: 'reparation', label: 'Réparation' },
    { value: 'installation', label: 'Installation' },
    { value: 'formation', label: 'Formation' },
    { value: 'sante', label: 'Santé' },
    { value: 'event', label: 'Événementiel' },
  ],
};

const DIGITAL_PRODUCT_TYPES: Array<{ value: DigitalProductType; label: string; hint: string }> = [
  { value: 'pdf', label: 'PDF professionnel', hint: 'Rapport, guide, document ou manuel PDF.' },
  { value: 'ebook', label: 'E-book', hint: 'Livre numérique PDF, EPUB ou MOBI.' },
  { value: 'logo', label: 'Logo / identité', hint: 'Pack logo, SVG, PNG, ZIP, fichiers sources.' },
  { value: 'template', label: 'Template', hint: 'Modèle Canva, Figma, Word, Excel, présentation ou ZIP.' },
  { value: 'course', label: 'Cours digital', hint: 'Support de formation, vidéo, archive ou accès pédagogique.' },
  { value: 'software', label: 'Logiciel / application', hint: 'Archive, APK, installateur ou package logiciel.' },
  { value: 'design', label: 'Design graphique', hint: 'Création graphique, affiche, maquette ou ressources design.' },
  { value: 'other', label: 'Autre livrable', hint: 'Livrable numérique personnalisé.' },
];

const DIGITAL_ACCEPT_BY_TYPE: Record<DigitalProductType, string> = {
  pdf: '.pdf',
  ebook: '.pdf,.epub,.mobi',
  logo: '.zip,.svg,.png,.jpg,.jpeg,.webp,.pdf,.ai,.psd,.fig',
  template: '.zip,.pdf,.doc,.docx,.xlsx,.ppt,.pptx,.fig,.psd,.ai',
  course: '.pdf,.zip,.mp4,.mov,.m4v,.doc,.docx,.ppt,.pptx',
  software: '.zip,.rar,.7z,.apk,.exe,.dmg,.pkg',
  design: '.zip,.svg,.png,.jpg,.jpeg,.webp,.pdf,.ai,.psd,.fig',
  other: '.pdf,.zip,.rar,.7z,.png,.jpg,.jpeg,.webp,.mp4,.doc,.docx,.xlsx,.ppt,.pptx',
};

function getDigitalTypeForSubcategory(subcategory: string): DigitalProductType {
  if (subcategory === 'ebooks') return 'ebook';
  if (subcategory === 'templates') return 'template';
  if (subcategory === 'cours') return 'course';
  if (subcategory === 'logiciels') return 'software';
  if (subcategory === 'design') return 'design';
  if (subcategory === 'marketing') return 'pdf';
  return 'other';
}

function getDigitalTypeMeta(type: DigitalProductType) {
  return DIGITAL_PRODUCT_TYPES.find((item) => item.value === type) || {
    value: 'other' as const,
    label: 'Autre livrable',
    hint: 'Livrable numérique personnalisé.',
  };
}

type ProductFormState = {
  name: string;
  reference: string;
  audience: 'B2B' | 'B2C';
  marketplaceCategory: string;
  marketplaceSubcategory: string;
  price: string;
  currency: string;
  stock: string;
  moq: string;
  unit: string;
  packaging: string;
  location: string;
  deliveryTime: string;
  description: string;
  batch: string;
  expiry: string;
  origin: string;
  certification: string;
  warranty: string;
  specs: string;
  capacity: string;
  serviceArea: string;
  duration: string;
  digitalFormat: string;
  digitalProductType: DigitalProductType;
  license: string;
  accessInstructions: string;
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 52);
}

function getCommerceConfig(subCategory?: string): CommerceBuilderConfig {
  return COMMERCE_CONFIGS[subCategory || ''] || COMMERCE_CONFIGS.RETAIL;
}

function getListingTypeForCategory(category: string): ListingType {
  if (category === 'service') return 'service';
  if (category === 'digital') return 'digital';
  return 'product';
}

function getVisibleFields(config: CommerceBuilderConfig, form: ProductFormState): Set<CommerceFieldKey> {
  const fields = new Set<CommerceFieldKey>();
  const listingType = getListingTypeForCategory(form.marketplaceCategory);

  if (listingType === 'service') {
    fields.add('serviceArea');
    fields.add('duration');
    return fields;
  }

  if (listingType === 'digital') {
    fields.add('digitalFormat');
    fields.add('duration');
    return fields;
  }

  fields.add('stock');
  if (form.audience === 'B2B' || config.role === 'wholesaler') fields.add('moq');
  if (form.audience === 'B2B' || config.role === 'wholesaler' || config.role === 'supplier') {
    fields.add('packaging');
  }

  if (form.marketplaceCategory === 'alimentaire') {
    fields.add('packaging');
    fields.add('batch');
    fields.add('expiry');
    fields.add('origin');
  }

  if (form.marketplaceCategory === 'bio') {
    fields.add('batch');
    fields.add('origin');
    fields.add('certification');
  }

  if (form.marketplaceCategory === 'tech' || form.marketplaceCategory === 'electro') {
    fields.add('warranty');
    fields.add('specs');
  }

  if (form.marketplaceCategory === 'electro' || config.role === 'producer') {
    fields.add('capacity');
  }

  config.requiredFields.forEach((field) => fields.add(field));
  return fields;
}

function isFieldVisible(visibleFields: Set<CommerceFieldKey>, field: CommerceFieldKey) {
  return visibleFields.has(field);
}

function isFieldRequired(config: CommerceBuilderConfig, form: ProductFormState, field: CommerceFieldKey) {
  const listingType = getListingTypeForCategory(form.marketplaceCategory);
  if (field === 'stock') return listingType === 'product';
  if (field === 'moq') return form.audience === 'B2B' || config.requiredFields.includes('moq');
  if (field === 'batch') return form.marketplaceCategory === 'alimentaire' || form.marketplaceCategory === 'bio' || config.requiredFields.includes('batch');
  if (field === 'expiry') return form.marketplaceCategory === 'alimentaire' || config.requiredFields.includes('expiry');
  if (field === 'origin') return ['alimentaire', 'bio'].includes(form.marketplaceCategory) || config.requiredFields.includes('origin');
  if (field === 'certification') return form.marketplaceCategory === 'bio' || config.requiredFields.includes('certification');
  if (field === 'warranty') return ['tech', 'electro'].includes(form.marketplaceCategory) || config.requiredFields.includes('warranty');
  if (field === 'specs') return ['tech', 'electro'].includes(form.marketplaceCategory) || config.requiredFields.includes('specs');
  if (field === 'capacity') return config.role === 'producer' || config.requiredFields.includes('capacity');
  if (field === 'serviceArea') return listingType === 'service';
  if (field === 'duration') return listingType === 'service' || listingType === 'digital' || config.requiredFields.includes('duration');
  if (field === 'digitalFormat') return listingType === 'digital';
  return config.requiredFields.includes(field);
}

function omitUndefined<T extends Record<string, any>>(payload: T): T {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined)) as T;
}

async function isStoreSlugTaken(slug: string) {
  const snap = await getDocs(query(collection(db, 'nkampa_stores'), where('slug', '==', slug), limit(1)));
  return !snap.empty;
}

async function ensureCommerceCatalog(input: {
  businessUser: BusinessUser;
  config: CommerceBuilderConfig;
  listingType: ListingType;
  category: string;
  location: string;
  description: string;
}) {
  const { businessUser, config } = input;

  if (businessUser.businessId) {
    const byBusiness = await getDocs(query(collection(db, 'nkampa_stores'), where('businessId', '==', businessUser.businessId), limit(8)));
    const existing = byBusiness.docs
      .map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as any) }))
      .find((store) => store.commerceCatalog === true || store.commerceCatalogType === 'enterprise_ecommerce');
    if (existing) return existing;
  }

  const byOwner = await getDocs(query(collection(db, 'nkampa_stores'), where('ownerId', '==', businessUser.uid), limit(12)));
  const existingByOwner = byOwner.docs
    .map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as any) }))
    .find((store) => store.commerceCatalog === true || store.commerceCatalogType === 'enterprise_ecommerce');
  if (existingByOwner) return existingByOwner;

  const baseSlug = slugify(`${businessUser.businessName} pro`) || `commerce-${businessUser.uid.slice(0, 8)}`;
  let slug = baseSlug;
  if (await isStoreSlugTaken(slug)) {
    slug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`;
  }

  const catalogPayload = {
    ownerId: businessUser.uid,
    businessId: businessUser.businessId || businessUser.uid,
    profileType: 'business',
    commerceCatalog: true,
    commerceCatalogType: 'enterprise_ecommerce',
    businessSubCategory: businessUser.subCategory || 'RETAIL',
    businessRoles: [config.role],
    businessSubroles: { [config.role]: [businessUser.subCategory || 'COMMERCE'] },
    sellType: input.listingType === 'service' || input.listingType === 'digital' ? 'service' : 'product',
    category: input.category,
    storeName: businessUser.businessName,
    slug,
    description: input.description || `Catalogue professionnel ${businessUser.businessName}`,
    phone: '',
    location: input.location,
    logoUrl: '',
    coverUrl: '',
    promoEnabled: false,
    promoTitle: '',
    promoText: '',
    promoImageUrl: '',
    accent: 'green',
    status: 'approved',
    verified: true,
    isVerified: true,
    trustLevel: 'Professionnel',
    sellerLevel: 'Vendeur vérifié',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const ref = await addDoc(collection(db, 'nkampa_stores'), catalogPayload as any);
  return { id: ref.id, ...catalogPayload };
}

function createInitialForm(config: CommerceBuilderConfig, businessUser: BusinessUser): ProductFormState {
  return {
    name: '',
    reference: '',
    audience: config.defaultAudience,
    marketplaceCategory: config.defaultCategory,
    marketplaceSubcategory: config.defaultSubcategory,
    price: '',
    currency: 'CDF',
    stock: config.listingType === 'service' || config.listingType === 'digital' ? '' : '1',
    moq: config.defaultAudience === 'B2B' ? '1 lot' : '',
    unit: config.listingType === 'service' ? 'prestation' : 'unité',
    packaging: '',
    location: '',
    deliveryTime: config.listingType === 'digital' ? 'Immédiat après confirmation' : '24h - 72h selon la zone',
    description: businessUser.subCategory === 'DIGITAL_SERVICES' ? 'Offre digitale professionnelle avec support.' : '',
    batch: '',
    expiry: '',
    origin: '',
    certification: '',
    warranty: '',
    specs: '',
    capacity: '',
    serviceArea: '',
    duration: '',
    digitalFormat: config.listingType === 'digital' ? 'Téléchargement sécurisé après paiement' : '',
    digitalProductType: config.listingType === 'digital' ? getDigitalTypeForSubcategory(config.defaultSubcategory) : 'other',
    license: config.listingType === 'digital' ? 'Licence personnelle ou professionnelle selon l’offre. Revente interdite sans accord.' : '',
    accessInstructions: config.listingType === 'digital' ? 'Le fichier sera disponible dans Mes commandes après paiement confirmé.' : '',
  };
}

export function CommerceProductBuilder({
  businessUser,
  onBack,
  onCreated,
}: {
  businessUser: BusinessUser;
  onBack: () => void;
  onCreated?: () => void;
}) {
  const { toast } = useToast();
  const config = useMemo(() => getCommerceConfig(businessUser.subCategory), [businessUser.subCategory]);
  const [form, setForm] = useState<ProductFormState>(() => createInitialForm(config, businessUser));
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [digitalFiles, setDigitalFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subcategoryOptions = MARKET_SUBCATEGORIES[form.marketplaceCategory] || [];
  const listingType = getListingTypeForCategory(form.marketplaceCategory);
  const visibleFields = useMemo(() => getVisibleFields(config, form), [config, form]);
  const isServiceLike = listingType === 'service' || listingType === 'digital';

  const setField = (field: keyof ProductFormState, value: string) => {
    setForm((prev) => {
      if (field === 'marketplaceCategory') {
        const firstSubcategory = MARKET_SUBCATEGORIES[value]?.[0]?.value || '';
        const nextListingType = getListingTypeForCategory(value);
        return {
          ...prev,
          marketplaceCategory: value,
          marketplaceSubcategory: firstSubcategory,
          stock: nextListingType === 'product' ? (prev.stock || '1') : '',
          moq: nextListingType === 'product' && prev.audience === 'B2B' ? (prev.moq || '1 lot') : '',
          unit: nextListingType === 'service' ? 'prestation' : nextListingType === 'digital' ? 'accès' : (prev.unit || 'unité'),
          deliveryTime:
            nextListingType === 'digital'
              ? 'Immédiat après confirmation'
              : nextListingType === 'service'
                ? 'Selon disponibilité'
                : prev.deliveryTime || '24h - 72h selon la zone',
          digitalProductType: nextListingType === 'digital' ? getDigitalTypeForSubcategory(firstSubcategory) : prev.digitalProductType,
          digitalFormat: nextListingType === 'digital' ? (prev.digitalFormat || 'Téléchargement sécurisé après paiement') : '',
          accessInstructions:
            nextListingType === 'digital'
              ? (prev.accessInstructions || 'Le fichier sera disponible dans Mes commandes après paiement confirmé.')
              : '',
        };
      }
      if (field === 'marketplaceSubcategory') {
        return {
          ...prev,
          marketplaceSubcategory: value,
          digitalProductType:
            getListingTypeForCategory(prev.marketplaceCategory) === 'digital'
              ? getDigitalTypeForSubcategory(value)
              : prev.digitalProductType,
        };
      }
      if (field === 'audience') {
        return {
          ...prev,
          audience: value as 'B2B' | 'B2C',
          moq: value === 'B2B' ? (prev.moq || '1 lot') : '',
        };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []).slice(0, 6);
    if (!selected.length) return;
    setFiles(selected);
    previews.forEach((preview) => URL.revokeObjectURL(preview));
    setPreviews(selected.map((file) => URL.createObjectURL(file)));
  };

  const handleDigitalFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []).slice(0, 8);
    if (!selected.length) return;
    setDigitalFiles(selected);
  };

  const validate = () => {
    if (!form.name.trim()) return 'Nom du produit ou service requis.';
    if (!form.price || Number(form.price) <= 0) return 'Prix valide requis.';
    if (!form.location.trim()) return 'Ville ou zone de disponibilité requise.';
    if (!form.description.trim()) return 'Description professionnelle requise.';
    if (isFieldVisible(visibleFields, 'stock') && isFieldRequired(config, form, 'stock') && (!form.stock || Number(form.stock) < 0)) return 'Stock disponible requis.';
    if (isFieldVisible(visibleFields, 'moq') && isFieldRequired(config, form, 'moq') && !form.moq.trim()) return 'MOQ ou quantité minimale requise.';
    if (isFieldVisible(visibleFields, 'batch') && isFieldRequired(config, form, 'batch') && !form.batch.trim()) return 'Numéro de lot requis pour ce type de produit.';
    if (isFieldVisible(visibleFields, 'expiry') && isFieldRequired(config, form, 'expiry') && !form.expiry.trim()) return 'Date limite ou période de validité requise.';
    if (isFieldVisible(visibleFields, 'origin') && isFieldRequired(config, form, 'origin') && !form.origin.trim()) return 'Origine du produit requise.';
    if (isFieldVisible(visibleFields, 'certification') && isFieldRequired(config, form, 'certification') && !form.certification.trim()) return 'Certification ou preuve bio requise.';
    if (isFieldVisible(visibleFields, 'warranty') && isFieldRequired(config, form, 'warranty') && !form.warranty.trim()) return 'Garantie requise.';
    if (isFieldVisible(visibleFields, 'specs') && isFieldRequired(config, form, 'specs') && !form.specs.trim()) return 'Spécifications techniques requises.';
    if (isFieldVisible(visibleFields, 'capacity') && isFieldRequired(config, form, 'capacity') && !form.capacity.trim()) return 'Capacité de production ou disponibilité requise.';
    if (isFieldVisible(visibleFields, 'serviceArea') && isFieldRequired(config, form, 'serviceArea') && !form.serviceArea.trim()) return 'Zone de service requise.';
    if (isFieldVisible(visibleFields, 'duration') && isFieldRequired(config, form, 'duration') && !form.duration.trim()) return 'Durée ou délai du service requis.';
    if (isFieldVisible(visibleFields, 'digitalFormat') && isFieldRequired(config, form, 'digitalFormat') && !form.digitalFormat.trim()) return 'Format digital requis.';
    if (listingType === 'digital' && !form.digitalProductType) return 'Type de livrable digital requis.';
    if (listingType === 'digital' && digitalFiles.length === 0) return 'Importez le fichier digital à livrer après paiement.';
    return '';
  };

  const handleSubmit = async () => {
    const message = validate();
    if (message) {
      toast({ variant: 'destructive', title: 'Formulaire incomplet', description: message });
      return;
    }

    setIsSubmitting(true);
    try {
      const uploadedUrls: string[] = [];
      const visualUploadErrors: string[] = [];
      for (const file of files) {
        try {
          const upload = await uploadToCloudinary(file, 'image');
          uploadedUrls.push(upload.secureUrl);
        } catch (error: any) {
          console.warn('Visuel produit non uploadé sur Cloudinary:', error);
          visualUploadErrors.push(error?.message || 'Upload visuel impossible');
        }
      }

      let digitalUploads: CloudinaryUploadResult[] = [];
      if (listingType === 'digital') {
        try {
          digitalUploads = await Promise.all(digitalFiles.map((file) => uploadToCloudinary(file, 'raw')));
        } catch (error: any) {
          throw new Error(error?.message || 'Impossible d’importer le fichier digital sur Cloudinary.');
        }
      }

      const fallbackImage = `https://picsum.photos/seed/${encodeURIComponent(`${businessUser.uid}-${form.name}`)}/700/700`;
      const image = uploadedUrls[0] || fallbackImage;
      const catalog = await ensureCommerceCatalog({
        businessUser,
        config,
        listingType,
        category: form.marketplaceCategory,
        location: form.location.trim(),
        description: form.description.trim(),
      });
      const complianceRequirements = getMarketplaceComplianceRequirements({
        category: form.audience,
        roles: [config.role],
        sellerVerified: true,
      });
      const stockValue = isServiceLike ? null : Math.max(0, Math.floor(Number(form.stock || 0)));
      const digitalMeta = getDigitalTypeMeta(form.digitalProductType);
      const digitalDelivery = listingType === 'digital'
        ? {
            provider: 'cloudinary' as const,
            accessMode: 'download_after_purchase' as const,
            productType: form.digitalProductType,
            productTypeLabel: digitalMeta.label,
            license: form.license.trim() || 'Licence personnelle ou professionnelle selon l’offre.',
            instructions: form.accessInstructions.trim() || 'Fichier disponible après paiement dans Mes commandes.',
            files: digitalUploads.map((upload, index) => {
              const sourceFile = digitalFiles[index];
              return {
                name: sourceFile?.name || `livrable-${index + 1}`,
                size: sourceFile?.size || 0,
                type: sourceFile?.type || 'application/octet-stream',
                url: upload.secureUrl,
                publicId: upload.publicId,
                resourceType: upload.resourceType,
                format: upload.format,
              };
            }),
            status: 'pending' as const,
          }
        : null;

      const productPayload = omitUndefined({
        name: form.name.trim(),
        reference: form.reference.trim() || null,
        price: Number(form.price),
        currency: form.currency,
        image,
        images: uploadedUrls.length ? uploadedUrls : [image],
        moq: isFieldVisible(visibleFields, 'moq') ? form.moq.trim() || null : null,
        unit: form.unit.trim() || null,
        location: form.location.trim(),
        category: form.audience,
        description: form.description.trim(),
        stock: stockValue,
        quantityAvailable: stockValue,
        availableStock: stockValue,
        sold: 0,
        rating: 4.8,
        reviews: 0,
        sellerId: businessUser.uid,
        sellerName: businessUser.businessName,
        sellerEmail: null,
        sellerVerified: true,
        sellerVerificationStatus: 'verified',
        storeId: catalog.id,
        storeSlug: catalog.slug,
        storeCategory: form.marketplaceCategory,
        storeSubcategory: form.marketplaceSubcategory,
        listingType,
        businessProductType: 'commerce-pro',
        marketplaceSource: 'business-commerce',
        businessId: businessUser.businessId || businessUser.uid,
        businessName: businessUser.businessName,
        businessType: 'COMMERCE',
        businessSubCategory: businessUser.subCategory || 'RETAIL',
        businessRole: config.role,
        businessAudience: form.audience,
        deliveryAvailable: true,
        logisticsEnabled: true,
        deliveryTime: form.deliveryTime.trim() || 'Selon la zone',
        hasDigitalDelivery: listingType === 'digital',
        digitalProductType: listingType === 'digital' ? form.digitalProductType : null,
        digitalProductTypeLabel: listingType === 'digital' ? digitalMeta.label : null,
        digitalFileCount: listingType === 'digital' ? digitalUploads.length : null,
        digitalDelivery,
        invoiceRequired: true,
        taxRecorded: true,
        packaging: isFieldVisible(visibleFields, 'packaging') ? form.packaging.trim() || null : null,
        batchNumber: isFieldVisible(visibleFields, 'batch') ? form.batch.trim() || null : null,
        expiryDate: isFieldVisible(visibleFields, 'expiry') ? form.expiry.trim() || null : null,
        origin: isFieldVisible(visibleFields, 'origin') ? form.origin.trim() || null : null,
        certification: isFieldVisible(visibleFields, 'certification') ? form.certification.trim() || null : null,
        warranty: isFieldVisible(visibleFields, 'warranty') ? form.warranty.trim() || null : null,
        technicalSpecs: isFieldVisible(visibleFields, 'specs') ? form.specs.trim() || null : null,
        productionCapacity: isFieldVisible(visibleFields, 'capacity') ? form.capacity.trim() || null : null,
        serviceArea: isFieldVisible(visibleFields, 'serviceArea') ? form.serviceArea.trim() || null : null,
        serviceDuration: isFieldVisible(visibleFields, 'duration') ? form.duration.trim() || null : null,
        digitalFormat: isFieldVisible(visibleFields, 'digitalFormat') ? form.digitalFormat.trim() || null : null,
        complianceRequirements,
        commerceControls: {
          invoice: true,
          stock: !isServiceLike,
          paymentTrace: true,
          refundControl: true,
          auditLog: true,
          customsRequired: complianceRequirements.customsRequired,
          requiredDocuments: complianceRequirements.requiredDocuments,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      } as any);

      await addDoc(collection(db, 'nkampa_products'), productPayload);

      toast({
        title: 'Produit publié',
        description: visualUploadErrors.length
          ? 'Produit publié. Certains visuels n’ont pas été envoyés sur Cloudinary.'
          : 'Le catalogue commerce pro est maintenant visible dans le marché.',
        className: 'bg-primary text-white border-none',
      });
      previews.forEach((preview) => URL.revokeObjectURL(preview));
      setPreviews([]);
      setFiles([]);
      setDigitalFiles([]);
      setForm(createInitialForm(config, businessUser));
      onCreated?.();
    } catch (error: any) {
      console.error('Erreur ajout produit commerce pro:', error);
      toast({
        variant: 'destructive',
        title: 'Publication impossible',
        description: error?.message || 'Impossible de publier ce produit dans le marché.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-[30px] border border-[#479B67]/25 bg-white shadow-sm">
        <div className="bg-[#479B67] px-4 py-4 text-white">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="grid h-10 w-10 place-items-center rounded-2xl bg-white/15 transition hover:bg-white/25"
              aria-label="Retour catalogue"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/70">Commerce entreprise</p>
              <h2 className="truncate text-xl font-black">{config.title}</h2>
              <p className="line-clamp-2 text-xs font-semibold text-white/75">{config.description}</p>
            </div>
            <div className="hidden h-12 w-12 place-items-center rounded-2xl bg-white sm:grid">
              <PackagePlus className="h-6 w-6 text-[#479B67]" />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {config.badges.map((badge) => (
              <span key={badge} className="rounded-full border border-white/20 bg-white/15 px-3 py-1 text-[11px] font-black">
                {badge}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-4 p-4 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="space-y-4 rounded-[26px] border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#479B67]/10 text-[#479B67]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-950">{businessUser.businessName}</p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Profil: {businessUser.subCategory || 'COMMERCE'} · rôle marché: {config.role}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                ['Visibilité', form.audience],
                ['Type', listingType],
                ['Facture', 'active'],
                ['Statut', 'vérifié'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-white p-3">
                  <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">{label}</p>
                  <p className="mt-1 truncate text-sm font-black text-slate-950">{value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-[#479B67]/20 bg-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-[#479B67]" />
                <p className="text-sm font-black text-slate-950">Contrôles intégrés</p>
              </div>
              <div className="space-y-2 text-xs font-semibold text-slate-600">
                {['Facture automatique', 'Stock et disponibilité', 'Paiement traçable', 'Audit commande', 'Remboursement contrôlé'].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#479B67]" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <label className="block cursor-pointer rounded-[24px] border-2 border-dashed border-[#479B67]/30 bg-white p-5 text-center transition hover:border-[#479B67]">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#479B67]/10">
                <UploadCloud className="h-6 w-6 text-[#479B67]" />
              </div>
              <p className="mt-3 text-sm font-black text-slate-950">
                {listingType === 'service' ? 'Images du service' : listingType === 'digital' ? 'Visuels de l’offre' : 'Images produit'}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">Jusqu’à 6 visuels propres</p>
              <input type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />
            </label>

            {previews.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {previews.map((preview) => (
                  <div key={preview} className="aspect-square overflow-hidden rounded-2xl bg-slate-100">
                    <img src={preview} alt="Aperçu produit" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            ) : null}

            {listingType === 'digital' ? (
              <div className="rounded-[24px] border border-[#479B67]/20 bg-white p-4">
                <div className="mb-3 flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#479B67]/10 text-[#479B67]">
                    <DownloadCloud className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-950">Fichier livré après paiement</p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                      Import Cloudinary uniquement. Le client verra ce fichier dans ses commandes après achat confirmé.
                    </p>
                  </div>
                </div>
                <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-[#479B67]/30 bg-[#479B67]/5 p-4 text-center transition hover:border-[#479B67]">
                  <FileArchive className="mx-auto h-7 w-7 text-[#479B67]" />
                  <p className="mt-2 text-sm font-black text-slate-950">Importer le livrable digital</p>
                  <p className="mt-1 text-[11px] font-semibold text-slate-500">
                    {getDigitalTypeMeta(form.digitalProductType).hint}
                  </p>
                  <input
                    type="file"
                    multiple
                    accept={DIGITAL_ACCEPT_BY_TYPE[form.digitalProductType]}
                    onChange={handleDigitalFiles}
                    className="hidden"
                  />
                </label>
                {digitalFiles.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {digitalFiles.map((file) => (
                      <div key={`${file.name}-${file.size}`} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-black text-slate-900">{file.name}</p>
                          <p className="text-[11px] font-semibold text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} Mo</p>
                        </div>
                        <span className="rounded-full bg-[#479B67]/10 px-2 py-1 text-[10px] font-black text-[#479B67]">Cloudinary</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>

          <section className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nom commercial" required>
                <Input
                  value={form.name}
                  onChange={(event) => setField('name', event.target.value)}
                  placeholder={listingType === 'service' ? 'Ex: Installation réseau entreprise' : listingType === 'digital' ? 'Ex: Licence logiciel pro' : 'Ex: Riz premium 25kg'}
                />
              </Field>
              <Field label="Référence interne">
                <Input value={form.reference} onChange={(event) => setField('reference', event.target.value)} placeholder="SKU, code lot, modèle..." />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <Field label="Marché" required>
                <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.audience} onChange={(event) => setField('audience', event.target.value as 'B2B' | 'B2C')}>
                  <option value="B2B">B2B</option>
                  <option value="B2C">B2C</option>
                </select>
              </Field>
              <Field label="Catégorie" required>
                <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.marketplaceCategory} onChange={(event) => setField('marketplaceCategory', event.target.value)}>
                  {MARKET_CATEGORIES.map((category) => (
                    <option key={category.value} value={category.value}>{category.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Rayon" required>
                <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.marketplaceSubcategory} onChange={(event) => setField('marketplaceSubcategory', event.target.value)}>
                  {subcategoryOptions.map((subcategory) => (
                    <option key={subcategory.value} value={subcategory.value}>{subcategory.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Devise">
                <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.currency} onChange={(event) => setField('currency', event.target.value)}>
                  <option value="CDF">CDF</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="RMB">RMB</option>
                </select>
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <Field label="Prix" required>
                <Input type="number" min="0" value={form.price} onChange={(event) => setField('price', event.target.value)} placeholder="0" />
              </Field>
              {isFieldVisible(visibleFields, 'stock') ? (
                <Field label="Stock" required={isFieldRequired(config, form, 'stock')}>
                  <Input type="number" min="0" value={form.stock} onChange={(event) => setField('stock', event.target.value)} placeholder="0" />
                </Field>
              ) : null}
              {listingType === 'product' ? (
                <Field label="Unité">
                  <Input value={form.unit} onChange={(event) => setField('unit', event.target.value)} placeholder="unité, kg, carton..." />
                </Field>
              ) : null}
              {isFieldVisible(visibleFields, 'moq') ? (
                <Field label="MOQ" required={isFieldRequired(config, form, 'moq')}>
                  <Input value={form.moq} onChange={(event) => setField('moq', event.target.value)} placeholder="Ex: 10 cartons" />
                </Field>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Ville / zone" required>
                <Input value={form.location} onChange={(event) => setField('location', event.target.value)} placeholder="Ex: Kinshasa, Gombe" />
              </Field>
              <Field label="Délai">
                <Input value={form.deliveryTime} onChange={(event) => setField('deliveryTime', event.target.value)} placeholder="Ex: 24h - 72h" />
              </Field>
            </div>

            <Field label="Description professionnelle" required>
              <Textarea
                value={form.description}
                onChange={(event) => setField('description', event.target.value)}
                placeholder={
                  listingType === 'service'
                    ? 'Décrivez la prestation, la zone couverte, les conditions, le délai et ce qui est inclus.'
                    : listingType === 'digital'
                      ? 'Décrivez le livrable digital, le format, l’accès, le support et les conditions d’utilisation.'
                      : 'Décrivez le produit, les conditions, la qualité, la disponibilité et les garanties.'
                }
                className="min-h-28"
              />
            </Field>

            {Array.from(visibleFields).some((field) => !['stock', 'moq'].includes(field)) ? (
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Boxes className="h-4 w-4 text-[#479B67]" />
                <p className="text-sm font-black text-slate-950">
                  Détails utiles pour {listingType === 'service' ? 'ce service' : listingType === 'digital' ? 'cette offre digitale' : 'ce produit'}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {isFieldVisible(visibleFields, 'packaging') && (
                  <Field label="Conditionnement">
                    <Input value={form.packaging} onChange={(event) => setField('packaging', event.target.value)} placeholder="Carton, palette, sac, pack..." />
                  </Field>
                )}
                {isFieldVisible(visibleFields, 'batch') && (
                  <Field label="Lot / traçabilité" required={isFieldRequired(config, form, 'batch')}>
                    <Input value={form.batch} onChange={(event) => setField('batch', event.target.value)} placeholder="Ex: LOT-KIN-2026-001" />
                  </Field>
                )}
                {isFieldVisible(visibleFields, 'expiry') && (
                  <Field label="Date limite" required={isFieldRequired(config, form, 'expiry')}>
                    <Input type="date" value={form.expiry} onChange={(event) => setField('expiry', event.target.value)} />
                  </Field>
                )}
                {isFieldVisible(visibleFields, 'origin') && (
                  <Field label="Origine" required={isFieldRequired(config, form, 'origin')}>
                    <Input value={form.origin} onChange={(event) => setField('origin', event.target.value)} placeholder="Pays, ville, ferme, usine..." />
                  </Field>
                )}
                {isFieldVisible(visibleFields, 'certification') && (
                  <Field label="Certification" required={isFieldRequired(config, form, 'certification')}>
                    <Input value={form.certification} onChange={(event) => setField('certification', event.target.value)} placeholder="Bio, local, fiche contrôle..." />
                  </Field>
                )}
                {isFieldVisible(visibleFields, 'warranty') && (
                  <Field label="Garantie" required={isFieldRequired(config, form, 'warranty')}>
                    <Input value={form.warranty} onChange={(event) => setField('warranty', event.target.value)} placeholder="Ex: 12 mois" />
                  </Field>
                )}
                {isFieldVisible(visibleFields, 'capacity') && (
                  <Field label="Capacité / disponibilité" required={isFieldRequired(config, form, 'capacity')}>
                    <Input value={form.capacity} onChange={(event) => setField('capacity', event.target.value)} placeholder="Ex: 500 unités/semaine" />
                  </Field>
                )}
                {isFieldVisible(visibleFields, 'serviceArea') && (
                  <Field label="Zone de service" required={isFieldRequired(config, form, 'serviceArea')}>
                    <Input value={form.serviceArea} onChange={(event) => setField('serviceArea', event.target.value)} placeholder="Ex: Kinshasa, Lubumbashi, en ligne" />
                  </Field>
                )}
                {isFieldVisible(visibleFields, 'duration') && (
                  <Field label="Durée / délai" required={isFieldRequired(config, form, 'duration')}>
                    <Input value={form.duration} onChange={(event) => setField('duration', event.target.value)} placeholder="Ex: 2 jours, 1 mois, immédiat" />
                  </Field>
                )}
                {isFieldVisible(visibleFields, 'digitalFormat') && (
                  <Field label="Format digital" required={isFieldRequired(config, form, 'digitalFormat')}>
                    <Input value={form.digitalFormat} onChange={(event) => setField('digitalFormat', event.target.value)} placeholder="SaaS, PDF, vidéo, licence, accès privé..." />
                  </Field>
                )}
                {listingType === 'digital' && (
                  <Field label="Type de livrable" required>
                    <select
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      value={form.digitalProductType}
                      onChange={(event) => setField('digitalProductType', event.target.value)}
                    >
                      {DIGITAL_PRODUCT_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </Field>
                )}
              </div>
              {isFieldVisible(visibleFields, 'specs') && (
                <div className="mt-3">
                  <Field label="Spécifications techniques" required={isFieldRequired(config, form, 'specs')}>
                    <Textarea value={form.specs} onChange={(event) => setField('specs', event.target.value)} placeholder="Puissance, dimensions, matériaux, compatibilité, conditions d’utilisation." className="min-h-24" />
                  </Field>
                </div>
              )}
              {listingType === 'digital' && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Field label="Licence">
                    <Textarea
                      value={form.license}
                      onChange={(event) => setField('license', event.target.value)}
                      placeholder="Conditions d’utilisation, licence, droit de revente, nombre d’utilisateurs..."
                      className="min-h-24"
                    />
                  </Field>
                  <Field label="Instructions client">
                    <Textarea
                      value={form.accessInstructions}
                      onChange={(event) => setField('accessInstructions', event.target.value)}
                      placeholder="Message visible après achat : comment utiliser, installer ou ouvrir le fichier."
                      className="min-h-24"
                    />
                  </Field>
                </div>
              )}
            </div>
            ) : null}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" className="rounded-2xl" onClick={onBack} disabled={isSubmitting}>
                Annuler
              </Button>
              <Button type="button" className="rounded-2xl bg-[#479B67] hover:bg-[#0A4747]" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PackagePlus className="mr-2 h-4 w-4" />}
                {config.cta}
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-600">
        {label}
        {required ? <Badge className="rounded-full bg-[#479B67]/10 px-2 py-0.5 text-[10px] text-[#479B67] hover:bg-[#479B67]/10">requis</Badge> : null}
      </span>
      {children}
    </label>
  );
}

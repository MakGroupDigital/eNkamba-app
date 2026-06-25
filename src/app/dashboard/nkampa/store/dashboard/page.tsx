'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Eye,
  Grid2X2,
  Home,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Megaphone,
  PackageCheck,
  Pencil,
  PlusCircle,
  Save,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Tag,
  Trash2,
  TrendingUp,
  Users,
  Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useNkampaStore } from '@/hooks/useNkampaStore';
import { uploadToCloudinary } from '@/lib/cloudinary-upload';
import { updateNkampaStore } from '@/lib/nkampa-store';
import { useToast } from '@/hooks/use-toast';
import { useDashboardLocation } from '@/hooks/useDashboardLocation';
import { collection, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { NkampaNavSellerIcon } from '@/components/icons/nkampa-nav-icons';
import { CustomersIcon, OrdersIcon, ProductsIcon, RatingIcon, StoreStatsIcon, VerifiedIcon } from '@/components/icons/seller-portal-icons';
import { RequestTransactionIcon, WithdrawalTransactionIcon } from '@/components/icons/transaction-icons';

const SUBCATEGORIES_BY_CATEGORY: Record<string, Array<{ id: string; label: string }>> = {
  tech: [
    { id: 'smartphones', label: 'Smartphones' },
    { id: 'ordinateurs', label: 'Ordinateurs' },
    { id: 'accessoires', label: 'Accessoires' },
    { id: 'audio', label: 'Audio' },
    { id: 'tv', label: 'TV & Vidéo' },
  ],
  mode: [
    { id: 'vetements', label: 'Vêtements' },
    { id: 'chaussures', label: 'Chaussures' },
    { id: 'sacs', label: 'Sacs' },
    { id: 'montres', label: 'Montres' },
    { id: 'bijoux', label: 'Bijoux' },
  ],
  alimentaire: [
    { id: 'cereales', label: 'Céréales' },
    { id: 'boissons', label: 'Boissons' },
    { id: 'epices', label: 'Épices' },
    { id: 'snacks', label: 'Snacks' },
    { id: 'frais', label: 'Produits frais' },
  ],
  bio: [
    { id: 'legumes', label: 'Légumes' },
    { id: 'fruits', label: 'Fruits' },
    { id: 'miel', label: 'Miel' },
    { id: 'tisanes', label: 'Tisanes' },
    { id: 'graines', label: 'Graines' },
  ],
  electro: [
    { id: 'cuisine', label: 'Cuisine' },
    { id: 'entretien', label: 'Entretien' },
    { id: 'clim', label: 'Climatisation' },
    { id: 'energie', label: 'Énergie' },
  ],
  maison: [
    { id: 'decor', label: 'Décor' },
    { id: 'meubles', label: 'Meubles' },
    { id: 'linge', label: 'Linge de maison' },
    { id: 'cuisine', label: 'Cuisine' },
  ],
  beaute: [
    { id: 'soins', label: 'Soins' },
    { id: 'parfums', label: 'Parfums' },
    { id: 'makeup', label: 'Maquillage' },
    { id: 'cheveux', label: 'Cheveux' },
  ],
  sports: [
    { id: 'fitness', label: 'Fitness' },
    { id: 'ballons', label: 'Ballons' },
    { id: 'equipements', label: 'Équipements' },
    { id: 'tenues', label: 'Tenues' },
  ],
  accessoires: [
    { id: 'telephones', label: 'Téléphones' },
    { id: 'mode', label: 'Mode' },
    { id: 'auto', label: 'Auto' },
    { id: 'maison', label: 'Maison' },
  ],
};

function formatMoney(amount: number, currency = 'CDF') {
  return `${Number(amount || 0).toLocaleString('fr-FR')} ${currency}`;
}

function getOrderStatusMeta(status?: string) {
  const normalized = String(status || 'pending').toLowerCase();
  if (['paid', 'success', 'completed'].includes(normalized)) {
    return { label: 'Payée', className: 'bg-[#32BB78]/12 text-[#14804a]' };
  }
  if (['shipped', 'expedited', 'delivered_to_carrier'].includes(normalized)) {
    return { label: 'Expédiée', className: 'bg-sky-50 text-sky-700' };
  }
  if (['preparing', 'processing', 'pending'].includes(normalized)) {
    return { label: 'En préparation', className: 'bg-amber-50 text-amber-700' };
  }
  if (['cancelled', 'failed', 'refunded'].includes(normalized)) {
    return { label: 'Incident', className: 'bg-red-50 text-red-700' };
  }
  return { label: status || 'En cours', className: 'bg-slate-100 text-slate-600' };
}

function getProductImages(product: any) {
  if (Array.isArray(product?.images) && product.images.length) return product.images;
  if (product?.image) return [product.image];
  return ['https://picsum.photos/seed/nkampa-store-product/320/240'];
}

function getStockValue(product: any) {
  return Number(product?.stock ?? product?.quantityAvailable ?? product?.availableStock ?? 0);
}

function StoreDashboardMetric({
  icon: Icon,
  label,
  value,
  detail,
  tone = 'green',
}: {
  icon: React.ComponentType<any>;
  label: string;
  value: string | number;
  detail: string;
  tone?: 'green' | 'amber';
}) {
  const color = tone === 'amber' ? 'bg-[#fff7ed] text-[#d97706]' : 'bg-primary/10 text-primary';

  return (
    <article className="min-h-[7.1rem] rounded-[1.25rem] bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.06)] ring-1 ring-slate-100">
      <div className="flex items-start gap-3">
        <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${color}`}>
          <Icon className="h-7 w-7" />
        </span>
        <div className="min-w-0">
          <p className="line-clamp-2 text-xs font-bold leading-tight text-slate-700">{label}</p>
          <p className="mt-1 text-2xl font-black leading-tight text-slate-950">{value}</p>
          <p className={`mt-1 text-xs font-bold ${tone === 'amber' ? 'text-[#d97706]' : 'text-primary'}`}>{detail}</p>
        </div>
      </div>
    </article>
  );
}

export default function NkampaStoreDashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { store, hasChecked } = useNkampaStore(user?.uid);
  const { location } = useDashboardLocation();
  const didLoginRedirectRef = useRef(false);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'media' | 'promo' | 'finance' | 'clients' | 'approval'>('overview');
  const [isSaving, setIsSaving] = useState(false);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [promoFile, setPromoFile] = useState<File | null>(null);
  const [promoPreview, setPromoPreview] = useState<string>('');

  const [bio, setBio] = useState('');
  const [promoEnabled, setPromoEnabled] = useState(false);
  const [promoTitle, setPromoTitle] = useState('');
  const [promoText, setPromoText] = useState('');

  const [myProducts, setMyProducts] = useState<any[]>([]);
  const [sellerOrders, setSellerOrders] = useState<any[]>([]);

  const [editOpen, setEditOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editCurrency, setEditCurrency] = useState('CDF');
  const [editStock, setEditStock] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSubcategory, setEditSubcategory] = useState('');
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editNewFiles, setEditNewFiles] = useState<File[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      if (didLoginRedirectRef.current) return;
      didLoginRedirectRef.current = true;
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!store) return;
    setBio(store.description || '');
    setPromoEnabled(!!store.promoEnabled);
    setPromoTitle(store.promoTitle || '');
    setPromoText(store.promoText || '');
    setLogoPreview(store.logoUrl || '');
    setCoverPreview(store.coverUrl || '');
    setPromoPreview(store.promoImageUrl || '');
  }, [
    store?.id,
    store?.description,
    store?.promoEnabled,
    store?.promoTitle,
    store?.promoText,
    store?.logoUrl,
    store?.coverUrl,
    store?.promoImageUrl,
  ]);

  useEffect(() => {
    if (!user?.uid) return;
    const pq = query(collection(db, 'nkampa_products'), where('sellerId', '==', user.uid));
    const unsub = onSnapshot(
      pq,
      (snap) => {
        setMyProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      () => {}
    );
    return () => unsub();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    const oq = query(collection(db, 'nkampa_orders'), where('sellerId', '==', user.uid));
    const unsub = onSnapshot(
      oq,
      (snap) => {
        setSellerOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      () => {}
    );
    return () => unsub();
  }, [user?.uid]);

  const revenue = useMemo(() => {
    return sellerOrders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);
  }, [sellerOrders]);

  const pendingCount = useMemo(() => sellerOrders.filter((o) => o.status === 'pending' || o.status === 'paid').length, [sellerOrders]);
  const primaryCurrency = sellerOrders.find((order) => order.currency)?.currency || myProducts.find((product) => product.currency)?.currency || 'CDF';
  const activeProductsCount = useMemo(() => myProducts.filter((product) => String(product.status || 'active') !== 'inactive').length, [myProducts]);
  const lowStockCount = useMemo(
    () => myProducts.filter((product) => store?.sellType === 'product' && getStockValue(product) > 0 && getStockValue(product) <= 10).length,
    [myProducts, store?.sellType]
  );
  const featuredProducts = useMemo(
    () => [...myProducts]
      .sort((left, right) => getStockValue(right) - getStockValue(left))
      .slice(0, 3),
    [myProducts]
  );
  const recentOrders = useMemo(
    () => [...sellerOrders]
      .sort((left, right) => {
        const leftDate = left.createdAt?.toMillis?.() || left.createdAtMs || 0;
        const rightDate = right.createdAt?.toMillis?.() || right.createdAtMs || 0;
        return rightDate - leftDate;
      })
      .slice(0, 4),
    [sellerOrders]
  );

  const storeCustomers = useMemo(() => {
    const grouped = new Map<string, { id: string; name: string; email: string; orders: number; total: number; lastStatus: string }>();
    sellerOrders.forEach((order) => {
      const id = order.buyerId || order.buyerEmail || order.buyerName || order.id;
      const current = grouped.get(id) || {
        id,
        name: order.buyerName || 'Client Nkampa',
        email: order.buyerEmail || '',
        orders: 0,
        total: 0,
        lastStatus: order.status || 'pending',
      };
      current.orders += 1;
      current.total += Number(order.totalPrice || 0);
      current.lastStatus = order.status || current.lastStatus;
      grouped.set(id, current);
    });
    return Array.from(grouped.values()).sort((a, b) => b.total - a.total);
  }, [sellerOrders]);
  const storeVisits = Number((store as any)?.viewCount || (store as any)?.visits || Math.max(0, sellerOrders.length * 18 + storeCustomers.length * 12));
  const conversionRate = storeVisits > 0 ? Math.min(100, (sellerOrders.length / storeVisits) * 100) : 0;

  const handleFile = (file: File, kind: 'logo' | 'cover' | 'promo') => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const url = reader.result as string;
      if (kind === 'logo') setLogoPreview(url);
      if (kind === 'cover') setCoverPreview(url);
      if (kind === 'promo') setPromoPreview(url);
    };
    reader.readAsDataURL(file);
    if (kind === 'logo') setLogoFile(file);
    if (kind === 'cover') setCoverFile(file);
    if (kind === 'promo') setPromoFile(file);
  };

  const openEdit = (p: any) => {
    const baseImages = Array.isArray(p.images) && p.images.length ? p.images : p.image ? [p.image] : [];
    setEditProduct(p);
    setEditName(p.name || '');
    setEditPrice(String(p.price ?? ''));
    setEditCurrency(p.currency || 'CDF');
    setEditStock(String(p.stock ?? p.quantityAvailable ?? p.availableStock ?? ''));
    setEditLocation(p.location || '');
    setEditDescription(p.description || '');
    setEditSubcategory(p.storeSubcategory || '');
    setEditImages(baseImages);
    setEditNewFiles([]);
    setEditOpen(true);
  };

  const handleEditImages = (files: FileList | null) => {
    if (!files) return;
    const list = Array.from(files);
    setEditNewFiles((prev) => [...prev, ...list].slice(0, 8));
  };

  const removeExistingImage = (idx: number) => {
    setEditImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeNewFile = (idx: number) => {
    setEditNewFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const shareProduct = async (p: any) => {
    if (!store) return;
    const url = `${window.location.origin}/shop/${store.slug}/product/${p.id}`;
    const title = p.name ? String(p.name) : 'Produit';
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast({ title: 'Lien copié', description: 'Lien du produit copié.', className: 'bg-primary text-white border-none' });
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        toast({ title: 'Lien copié', description: 'Lien du produit copié.', className: 'bg-primary text-white border-none' });
      } catch {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de partager le lien.' });
      }
    }
  };

  const saveProductEdits = async () => {
    if (!editProduct) return;
    setIsSaving(true);
    try {
      const uploaded: string[] = [];
      for (const f of editNewFiles) {
        const r = await uploadToCloudinary(f, 'image');
        uploaded.push(r.secureUrl);
      }
      const mergedImages = [...editImages, ...uploaded].slice(0, 8);
      const primary = mergedImages[0] || editProduct.image || 'https://picsum.photos/seed/default/300/300';

      await updateDoc(doc(db, 'nkampa_products', editProduct.id), {
        name: editName.trim(),
        price: Number(editPrice || 0),
        currency: editCurrency,
        stock: editStock === '' ? null : Math.max(0, Math.floor(Number(editStock || 0))),
        quantityAvailable: editStock === '' ? null : Math.max(0, Math.floor(Number(editStock || 0))),
        availableStock: editStock === '' ? null : Math.max(0, Math.floor(Number(editStock || 0))),
        location: editLocation.trim(),
        description: editDescription.trim(),
        images: mergedImages,
        image: primary,
        storeSubcategory: editSubcategory || '',
      } as any);

      toast({ title: 'Sauvé', description: 'Produit mis à jour.', className: 'bg-primary text-white border-none' });
      setEditOpen(false);
    } catch (e: any) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Erreur', description: e?.message || 'Impossible de sauvegarder le produit.' });
    } finally {
      setIsSaving(false);
    }
  };

  const saveProfile = async () => {
    if (!store) return;
    setIsSaving(true);
    try {
      let logoUrl = store.logoUrl || '';
      let coverUrl = store.coverUrl || '';

      if (logoFile) {
        const up = await uploadToCloudinary(logoFile, 'image');
        logoUrl = up.secureUrl;
      }
      if (coverFile) {
        const up = await uploadToCloudinary(coverFile, 'image');
        coverUrl = up.secureUrl;
      }

      await updateNkampaStore(store.id, {
        description: bio.trim(),
        logoUrl,
        coverUrl,
      });

      toast({ title: 'Sauvé', description: 'Profil boutique mis à jour.', className: 'bg-primary text-white border-none' });
      setLogoFile(null);
      setCoverFile(null);
    } catch (e: any) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Erreur', description: e?.message || 'Impossible de sauvegarder.' });
    } finally {
      setIsSaving(false);
    }
  };

  const savePromo = async () => {
    if (!store) return;
    setIsSaving(true);
    try {
      let promoImageUrl = store.promoImageUrl || '';
      if (promoFile) {
        const up = await uploadToCloudinary(promoFile, 'image');
        promoImageUrl = up.secureUrl;
      }

      await updateNkampaStore(store.id, {
        promoEnabled,
        promoTitle: promoTitle.trim(),
        promoText: promoText.trim(),
        promoImageUrl,
      });
      toast({ title: 'Sauvé', description: 'Promo mise à jour.', className: 'bg-primary text-white border-none' });
      setPromoFile(null);
    } catch (e: any) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Erreur', description: e?.message || 'Impossible de sauvegarder.' });
    } finally {
      setIsSaving(false);
    }
  };

  const storeUrl = store ? `/shop/${store.slug}` : '';
  const sellLabel = store?.sellType === 'service' ? 'Services' : 'Produits';
  const isApproved = store?.status === 'active' || store?.status === 'approved';
  const isBusiness = store?.profileType === 'business';
  const roles = store?.businessRoles || [];
  const subroles = (store as any)?.businessSubroles || {};

  if (authLoading || !hasChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-[#F6F8F7]">
        <div className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-8">
          <div className="w-full overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl">
            <div className="relative h-44 bg-[#32BB78]">
              <div className="absolute inset-x-0 top-0 h-16 bg-white/10" />
              <div className="absolute left-8 top-8 flex items-center gap-3 text-white">
                <div className="grid h-14 w-14 place-items-center rounded-3xl bg-white">
                  <NkampaNavSellerIcon size={36} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-white/70">Back-office boutique</p>
                  <h1 className="text-2xl font-black">Ma boutique Nkampa</h1>
                </div>
              </div>
              <div className="absolute bottom-0 left-8 right-8 h-16 rounded-t-3xl border border-white/20 bg-white/15 backdrop-blur" />
            </div>

            <div className="space-y-4 p-5">
              <div>
                <h2 className="text-xl font-black text-slate-950">Créer votre boutique</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Aucune boutique Nkampa n’est liée à ce compte. Créez la vitrine pour publier vos produits, recevoir des commandes et gérer vos promos.
                </p>
              </div>
              <Button asChild className="h-12 w-full rounded-2xl bg-[#32BB78] hover:bg-[#0A4747]">
                <Link href="/dashboard/nkampa/store">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Créer une boutique
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-12 w-full rounded-2xl">
                <Link href="/dashboard/nkampa">Retour à Nkampa</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7fbf9] pb-24 text-slate-950">
      <div className="sticky top-0 z-30 bg-primary text-white shadow-[0_14px_34px_rgba(50,187,120,0.28)]">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4">
          <button type="button" className="flex min-w-0 items-center gap-2 rounded-full bg-white/10 px-2.5 py-2 text-left ring-1 ring-white/12">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/16">
              <MapPin className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-black">{location?.label || store.location || 'Yuexiu, Guangzhou, Chine'}</span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-white/85" />
          </button>

          <div className="flex shrink-0 items-center gap-3">
            <button type="button" className="relative grid h-10 w-10 place-items-center rounded-full bg-white/12 ring-1 ring-white/15">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-primary bg-[#f59e0b]" />
            </button>
            <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-full border-2 border-white bg-white text-base font-black text-primary shadow-sm">
              {store.logoUrl ? (
                <Image src={store.logoUrl} alt={store.storeName} width={44} height={44} className="h-full w-full object-cover" />
              ) : (
                String(store.storeName || 'B').slice(0, 1).toUpperCase()
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-4 px-4 py-4">
        <section className="rounded-[1.35rem] bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.07)] ring-1 ring-slate-100">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-primary/8">
                {store.logoUrl ? (
                  <Image src={store.logoUrl} alt={store.storeName} fill className="object-cover" />
                ) : (
                  <NkampaNavSellerIcon size={40} />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.12em] text-primary">Gestion boutique</p>
                <h1 className="mt-1 truncate text-2xl font-black leading-tight tracking-tight text-slate-950">{store.storeName}</h1>
                <p className="mt-1 truncate text-sm font-semibold text-slate-500">
                  {sellLabel}
                  {store.category ? ` maison · ${store.category}` : ' · Boutique en ligne'}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {isApproved ? (
                <Button asChild className="hidden h-12 rounded-2xl bg-primary px-5 font-black text-white hover:bg-[#0A4747] sm:inline-flex">
                  <Link href={storeUrl} target="_blank" rel="noreferrer">
                    Voir la vitrine <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Badge className="hidden rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-800 sm:inline-flex">En attente</Badge>
              )}
              <button
                type="button"
                onClick={() => {
                  if (!isApproved) return;
                  const url = `${window.location.origin}${storeUrl}`;
                  if (navigator.share) {
                    void navigator.share({ title: store.storeName, url });
                  } else {
                    void navigator.clipboard.writeText(url);
                    toast({ title: 'Lien copié', description: 'Lien de la vitrine copié.', className: 'bg-primary text-white border-none' });
                  }
                }}
                className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 transition hover:text-primary"
                aria-label="Partager la boutique"
              >
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </section>

        <div className="sticky top-16 z-20">
          <div className="rounded-[1.35rem] bg-white/95 px-2 py-2 shadow-[0_10px_24px_rgba(15,23,42,0.07)] ring-1 ring-slate-100 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-hide">
              {[
                { id: 'overview', label: 'Aperçu', icon: <Home className="h-5 w-5" /> },
                { id: 'products', label: store.sellType === 'product' ? 'Produits' : 'Services', icon: <ProductsIcon size={22} /> },
                { id: 'orders', label: 'Commandes', icon: <ShoppingBag className="h-5 w-5" /> },
                { id: 'media', label: 'Médias', icon: <ImageIcon className="h-5 w-5" /> },
                { id: 'promo', label: 'Promotions', icon: <Tag className="h-5 w-5" /> },
              ].map((t: any) => {
                const active = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id)}
                    className={[
                      'flex h-10 items-center gap-2 rounded-2xl px-3 text-xs font-black transition whitespace-nowrap',
                      active ? 'bg-[#32BB78] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
                    ].join(' ')}
                  >
                    <span className="grid h-6 w-6 place-items-center">{t.icon}</span>
                    {t.label}
                  </button>
                );
              })}

              <div className="flex-1" />
              {activeTab === 'media' ? (
                <Button size="sm" className="rounded-2xl bg-[#32BB78] hover:bg-[#0A4747]" onClick={saveProfile} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  Sauver
                </Button>
              ) : activeTab === 'promo' ? (
                <Button size="sm" className="rounded-2xl bg-[#32BB78] hover:bg-[#0A4747]" onClick={savePromo} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  Sauver
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        {!isApproved && (
          <Card className="border border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-amber-900">Boutique en attente d’approbation</p>
              <p className="text-xs text-amber-800 mt-1">
                Votre boutique entreprise est soumise. Dès qu’elle est approuvée, le lien public sera activé.
              </p>
            </CardContent>
          </Card>
        )}

        {activeTab === 'overview' ? (
          <div className="space-y-4">
            <section className="overflow-hidden rounded-[1.35rem] bg-white shadow-[0_12px_28px_rgba(15,23,42,0.07)] ring-1 ring-slate-100">
              <div className="relative h-52 overflow-hidden bg-slate-200">
                {store.coverUrl ? (
                  <Image src={store.coverUrl} alt="Cover boutique" fill className="object-cover" />
                ) : (
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,#d7eadf_0%,#f2efe6_52%,#9f8d74_100%)]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/18 to-transparent" />
                <div className="absolute left-4 top-4 flex items-center gap-2">
                  <Badge className="rounded-full border-0 bg-primary px-3 py-1 text-white shadow">
                    <ShieldCheck className="mr-1 h-4 w-4" />
                    {isApproved ? 'Boutique publiée' : 'Publication bloquée'}
                  </Badge>
                  {promoEnabled ? (
                    <Badge className="rounded-full border-0 bg-[#f59e0b] px-3 py-1 text-white shadow">Promo active</Badge>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => isApproved ? window.open(storeUrl, '_blank') : setActiveTab('media')}
                  className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-2xl bg-black/38 px-3 py-2 text-xs font-black text-white ring-1 ring-white/30 backdrop-blur"
                >
                  <Eye className="h-4 w-4" />
                  Aperçu de la vitrine
                </button>
                <h2 className="absolute bottom-4 left-4 max-w-[68%] truncate text-2xl font-black text-white">
                  Vitrine publique — {store.storeName}
                </h2>
              </div>

              <div className="space-y-4 p-4">
                <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
                  <p className="text-sm font-semibold leading-6 text-slate-700">
                    {store.description || 'Découvrez des produits de qualité, soigneusement sélectionnés pour le marché local et international.'}
                  </p>
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/8 text-primary">
                    <ShieldCheck className="h-8 w-8" />
                  </span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {isApproved ? (
                    <Button asChild className="h-12 rounded-2xl bg-primary text-base font-black hover:bg-[#0A4747]">
                      <Link href={storeUrl} target="_blank" rel="noreferrer">
                        Ouvrir la vitrine <ExternalLink className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  ) : (
                    <Badge className="flex h-12 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-800">En attente</Badge>
                  )}
                  <Button className="h-12 rounded-2xl text-base font-black" variant="outline" onClick={() => setActiveTab('media')}>
                    Personnaliser <Wand2 className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <StoreDashboardMetric icon={TrendingUp} label="Ventes du mois" value={formatMoney(revenue, primaryCurrency)} detail="↗ activité boutique" tone="green" />
              <StoreDashboardMetric icon={ShoppingBag} label="Commandes" value={sellerOrders.length} detail={`${pendingCount} à traiter`} tone="green" />
              <StoreDashboardMetric icon={PackageCheck} label="Produits actifs" value={activeProductsCount} detail={`${myProducts.length} en catalogue`} tone="green" />
              <StoreDashboardMetric icon={Users} label="Visites" value={storeVisits.toLocaleString('fr-FR')} detail={`${storeCustomers.length} clients`} tone="green" />
              <StoreDashboardMetric icon={Grid2X2} label="Taux de conversion" value={`${conversionRate.toFixed(1)} %`} detail="commandes / visites" tone="green" />
              <StoreDashboardMetric icon={ShieldCheck} label="Stock faible" value={lowStockCount} detail={lowStockCount ? 'Voir les produits' : 'Aucun risque'} tone={lowStockCount ? 'amber' : 'green'} />
            </div>

            <section className="overflow-hidden rounded-[1.35rem] bg-white shadow-[0_12px_28px_rgba(15,23,42,0.07)] ring-1 ring-slate-100">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
                <h2 className="text-base font-black text-slate-950">Commandes récentes</h2>
                <button type="button" onClick={() => setActiveTab('orders')} className="inline-flex items-center gap-1 text-xs font-bold text-primary">
                  Voir toutes <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {recentOrders.length ? recentOrders.map((order) => {
                  const status = getOrderStatusMeta(order.status);
                  return (
                    <button key={order.id} type="button" onClick={() => setActiveTab('orders')} className="grid w-full grid-cols-[1.7rem_1fr_auto] items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50">
                      <span className="grid h-7 w-7 place-items-center rounded-xl bg-slate-50 text-slate-500">
                        <ShoppingBag className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-black text-slate-900">CMD-{String(order.id || '').slice(0, 8).toUpperCase()}</span>
                        <span className="block truncate text-xs font-semibold text-slate-500">{order.buyerName || order.customerName || order.productName || 'Client Nkampa'}</span>
                      </span>
                      <span className="text-right">
                        <span className="block text-sm font-black text-slate-950">{formatMoney(Number(order.totalPrice || 0), order.currency || primaryCurrency)}</span>
                        <span className={`mt-1 inline-flex rounded-full px-3 py-1 text-[11px] font-black ${status.className}`}>{status.label}</span>
                      </span>
                    </button>
                  );
                }) : (
                  <div className="px-4 py-7 text-center text-sm font-semibold text-slate-500">Aucune commande récente.</div>
                )}
              </div>
            </section>

            <section className="overflow-hidden rounded-[1.35rem] bg-white shadow-[0_12px_28px_rgba(15,23,42,0.07)] ring-1 ring-slate-100">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
                <h2 className="text-base font-black text-slate-950">Produits en vedette</h2>
                <button type="button" onClick={() => setActiveTab('products')} className="inline-flex items-center gap-1 text-xs font-bold text-primary">
                  Voir tous <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {featuredProducts.length ? featuredProducts.map((product) => {
                  const image = getProductImages(product)[0];
                  const stock = getStockValue(product);
                  return (
                    <div key={product.id} className="grid grid-cols-[4rem_1fr_auto_auto] items-center gap-3 px-4 py-3">
                      <div className="relative h-14 w-14 overflow-hidden rounded-2xl bg-slate-100">
                        <Image src={image} alt={product.name || 'Produit'} fill className="object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-950">{product.name}</p>
                        <p className="mt-0.5 text-xs font-black text-primary">{formatMoney(Number(product.price || 0), product.currency || primaryCurrency)}</p>
                      </div>
                      <div className="text-right text-xs">
                        <p className="font-semibold text-slate-500">Stock</p>
                        <p className={`text-lg font-black ${stock <= 10 && stock > 0 ? 'text-[#d97706]' : 'text-primary'}`}>{stock}</p>
                      </div>
                      <button type="button" onClick={() => openEdit(product)} className="grid h-9 w-9 place-items-center rounded-full text-slate-500 hover:bg-slate-50">
                        <Pencil className="h-4 w-4" />
                      </button>
                    </div>
                  );
                }) : (
                  <div className="px-4 py-7 text-center text-sm font-semibold text-slate-500">Aucun produit en vedette.</div>
                )}
              </div>
            </section>
          </div>
        ) : null}

        {activeTab === 'products' ? (
          <Card className="rounded-[32px] border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span>Rayons {store.sellType === 'product' ? 'produits' : 'services'}</span>
                <Button asChild size="sm" className="rounded-2xl bg-[#32BB78] hover:bg-[#0A4747]">
                  <Link href="/dashboard/nkampa/seller">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Ajouter
                  </Link>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {myProducts.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-white">
                    <ProductsIcon size={38} />
                  </div>
                  <p className="mt-3 text-sm font-black">Aucun élément en rayon</p>
                  <p className="mt-1 text-xs text-slate-500">Ajoutez vos premiers articles pour remplir la vitrine.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {myProducts.map((p) => (
                    <div key={p.id} className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                      <div className="relative aspect-square w-full bg-slate-100">
                        <div className="absolute inset-0 flex overflow-x-auto snap-x snap-mandatory scrollbar-hide">
                          {(Array.isArray(p.images) && p.images.length ? p.images : p.image ? [p.image] : []).map((src: string, idx: number) => (
                            <div key={`${p.id}-${idx}`} className="relative min-w-full h-full snap-center">
                              <Image src={src} alt={p.name || 'Produit'} fill className="object-cover" />
                            </div>
                          ))}
                        </div>
                        <div className="absolute bottom-2 left-2 flex gap-1">
                          {(Array.isArray(p.images) && p.images.length ? p.images : p.image ? [p.image] : []).slice(0, 6).map((_: any, idx: number) => (
                            <span key={`${p.id}-dot-${idx}`} className="h-1.5 w-1.5 rounded-full bg-white/80 shadow" />
                          ))}
                        </div>
                        <div className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-[10px] font-black text-[#32BB78] shadow">
                          En vitrine
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="line-clamp-1 text-xs font-black">{p.name}</p>
                        <p className="line-clamp-1 text-[11px] text-slate-500">{p.location}</p>
                        <p className="mt-1 text-sm font-black text-[#32BB78]">
                          {(p.price || 0).toLocaleString()} {p.currency || 'CDF'}
                        </p>
                        {store?.sellType === 'product' ? (
                          <p className={[
                            'mt-1 text-[11px] font-bold',
                            Number(p.stock ?? p.quantityAvailable ?? p.availableStock ?? 0) > 0 ? 'text-slate-500' : 'text-red-600',
                          ].join(' ')}>
                            Stock: {Number(p.stock ?? p.quantityAvailable ?? p.availableStock ?? 0).toLocaleString()}
                          </p>
                        ) : null}
                        <div className="flex items-center gap-2 mt-2">
                          <Button variant="outline" size="sm" className="h-8 flex-1 rounded-xl text-xs" onClick={() => openEdit(p)}>
                            <Pencil className="mr-1 h-4 w-4" />
                            Éditer
                          </Button>
                          <Button variant="outline" size="sm" className="h-8 flex-1 rounded-xl text-xs" onClick={() => shareProduct(p)}>
                            <Share2 className="mr-1 h-4 w-4" />
                            Lien
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}

        {activeTab === 'orders' ? (
          <Card className="rounded-[32px] border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span>Commandes boutique</span>
                <Badge className="rounded-full border border-primary/20 bg-primary/10 text-primary">
                  {sellerOrders.length} commande{sellerOrders.length > 1 ? 's' : ''}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {sellerOrders.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-white">
                    <OrdersIcon size={38} />
                  </div>
                  <p className="mt-3 text-sm font-black">Aucune commande pour le moment</p>
                  <p className="mt-1 text-xs text-slate-500">Les commandes passées dans votre vitrine apparaîtront ici.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sellerOrders.map((order) => {
                    const status = getOrderStatusMeta(order.status);
                    return (
                      <div key={order.id} className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-950">CMD-{String(order.id || '').slice(0, 10).toUpperCase()}</p>
                          <p className="mt-1 truncate text-xs font-semibold text-slate-500">{order.buyerName || order.customerName || order.productName || 'Client Nkampa'}</p>
                        </div>
                        <p className="text-sm font-black text-slate-950">{formatMoney(Number(order.totalPrice || 0), order.currency || primaryCurrency)}</p>
                        <span className={`w-fit rounded-full px-3 py-1 text-[11px] font-black ${status.className}`}>{status.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}

        {activeTab === 'media' ? (
          <Card>
            <CardHeader>
              <CardTitle>Médias & Profil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-700">Logo</p>
                  <label className="block rounded-2xl border border-primary/15 bg-white p-4 hover:bg-primary/5 transition cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFile(f, 'logo');
                      }}
                    />
                    <div className="flex items-center gap-4">
                      <div className="relative h-16 w-16 rounded-2xl overflow-hidden bg-gray-100 border border-primary/10">
                        {logoPreview ? <Image src={logoPreview} alt="Logo" fill className="object-cover" /> : null}
                      </div>
                      <div>
                        <p className="text-sm font-bold">Changer le logo</p>
                        <p className="text-xs text-muted-foreground">Upload Cloudinary, lien stocké sur Firestore</p>
                      </div>
                    </div>
                  </label>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-700">Cover</p>
                  <label className="block rounded-2xl border border-primary/15 bg-white p-4 hover:bg-primary/5 transition cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFile(f, 'cover');
                      }}
                    />
                    <div className="flex items-center gap-4">
                      <div className="relative h-16 w-28 rounded-2xl overflow-hidden bg-gray-100 border border-primary/10">
                        {coverPreview ? <Image src={coverPreview} alt="Cover" fill className="object-cover" /> : null}
                      </div>
                      <div>
                        <p className="text-sm font-bold">Changer la cover</p>
                        <p className="text-xs text-muted-foreground">Image bannière boutique</p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-700">Bio</p>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full min-h-[110px] rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm"
                  placeholder="Décrivez votre boutique…"
                />
              </div>

              <div className="text-xs text-muted-foreground">
                Cliquez sur <span className="font-semibold text-foreground">Sauver</span> dans la barre flottante.
              </div>
            </CardContent>
          </Card>
        ) : null}

        {activeTab === 'promo' ? (
          <Card>
            <CardHeader>
              <CardTitle>Promo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between rounded-2xl border border-primary/10 bg-white p-4">
                <div>
                  <p className="text-sm font-bold">Activer la promo</p>
                  <p className="text-xs text-muted-foreground">Affichée sur la boutique publique</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPromoEnabled((v) => !v)}
                  className={[
                    'h-7 w-12 rounded-full transition relative',
                    promoEnabled ? 'bg-primary' : 'bg-gray-200',
                  ].join(' ')}
                  aria-label="Toggle promo"
                >
                  <span
                    className={[
                      'absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition',
                      promoEnabled ? 'left-6' : 'left-0.5',
                    ].join(' ')}
                  />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-700">Titre</p>
                  <input
                    value={promoTitle}
                    onChange={(e) => setPromoTitle(e.target.value)}
                    className="w-full h-11 rounded-2xl border border-primary/10 bg-white px-4 text-sm"
                    placeholder="Ex: -10% cette semaine"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-700">Texte</p>
                  <input
                    value={promoText}
                    onChange={(e) => setPromoText(e.target.value)}
                    className="w-full h-11 rounded-2xl border border-primary/10 bg-white px-4 text-sm"
                    placeholder="Ex: Livraison offerte dès 50.000 CDF"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-700">Image promo</p>
                <label className="block rounded-2xl border border-primary/15 bg-white p-4 hover:bg-primary/5 transition cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f, 'promo');
                    }}
                  />
                  <div className="flex items-center gap-4">
                    <div className="relative h-16 w-28 rounded-2xl overflow-hidden bg-gray-100 border border-primary/10">
                      {promoPreview ? <Image src={promoPreview} alt="Promo" fill className="object-cover" /> : <Megaphone className="h-6 w-6 text-primary m-auto" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold">Changer l’image</p>
                      <p className="text-xs text-muted-foreground">Upload Cloudinary + lien Firestore</p>
                    </div>
                  </div>
                </label>
              </div>

              <div className="text-xs text-muted-foreground">
                Cliquez sur <span className="font-semibold text-foreground">Sauver</span> dans la barre flottante.
              </div>
            </CardContent>
          </Card>
        ) : null}

        {activeTab === 'finance' ? (
          <Card className="rounded-[32px] border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-3">
                <span>Finance boutique</span>
                <Button asChild className="rounded-2xl bg-[#32BB78] hover:bg-[#0A4747]">
                  <Link href="/dashboard/withdraw">
                    <span className="mr-2 grid h-5 w-5 place-items-center">
                      <WithdrawalTransactionIcon size={22} />
                    </span>
                    Demander le retrait
                  </Link>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-[#32BB78] p-4 text-white">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-white/65">Revenu total</p>
                    <p className="mt-1 text-2xl font-black">{revenue.toLocaleString()} CDF</p>
                  </div>
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white">
                    <StoreStatsIcon size={32} />
                  </div>
                </div>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-slate-500">Commandes en cours</p>
                    <p className="mt-1 text-2xl font-black text-slate-950">{pendingCount}</p>
                  </div>
                  <OrdersIcon size={32} />
                </div>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-slate-500">Articles</p>
                    <p className="mt-1 text-2xl font-black text-slate-950">{myProducts.length}</p>
                  </div>
                  <ProductsIcon size={32} />
                </div>
              </div>
              <div className="rounded-3xl border border-[#32BB78]/20 bg-[#32BB78]/10 p-4 md:col-span-3">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-14 w-14 place-items-center rounded-3xl bg-white">
                      <RequestTransactionIcon size={34} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-950">Demander le retrait</p>
                      <p className="mt-1 text-xs leading-5 text-slate-600">Transférer le solde disponible de la boutique vers votre portefeuille ou votre moyen de retrait.</p>
                    </div>
                  </div>
                  <Button asChild className="h-11 rounded-2xl bg-[#32BB78] hover:bg-[#0A4747]">
                    <Link href="/dashboard/withdraw">Ouvrir le retrait</Link>
                  </Button>
                </div>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-4 md:col-span-3">
                <p className="text-sm font-black">Dernières commandes</p>
                {sellerOrders.length === 0 ? (
                  <p className="mt-1 text-xs text-slate-500">Aucune commande.</p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {sellerOrders.slice(0, 5).map((o) => (
                      <div key={o.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 text-sm">
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{o.productName}</p>
                          <p className="text-xs text-slate-500 truncate">#{String(o.id).slice(0, 8)} • {o.status}</p>
                        </div>
                        <p className="font-black text-[#32BB78]">{Number(o.totalPrice || 0).toLocaleString()} {o.currency || 'CDF'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {activeTab === 'clients' ? (
          <Card className="rounded-[32px] border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-3">
                <span>Clients boutique</span>
                <Badge className="rounded-full border border-[#32BB78]/20 bg-[#32BB78]/10 text-[#32BB78]">
                  {storeCustomers.length} client{storeCustomers.length > 1 ? 's' : ''}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-slate-500">Clients uniques</p>
                      <p className="mt-1 text-2xl font-black text-slate-950">{storeCustomers.length}</p>
                    </div>
                    <CustomersIcon size={34} />
                  </div>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-slate-500">Commandes client</p>
                      <p className="mt-1 text-2xl font-black text-slate-950">{sellerOrders.length}</p>
                    </div>
                    <OrdersIcon size={34} />
                  </div>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-slate-500">Meilleur client</p>
                      <p className="mt-1 line-clamp-1 text-xl font-black text-slate-950">{storeCustomers[0]?.name || 'Aucun'}</p>
                    </div>
                    <RatingIcon size={34} />
                  </div>
                </div>
              </div>

              {storeCustomers.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-white">
                    <CustomersIcon size={38} />
                  </div>
                  <p className="mt-3 text-sm font-black">Aucun client pour le moment</p>
                  <p className="mt-1 text-xs text-slate-500">Les clients apparaîtront ici dès qu’ils passeront commande dans la boutique.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {storeCustomers.map((client) => (
                    <div key={client.id} className="flex items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#32BB78]/10">
                          <CustomersIcon size={30} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-950">{client.name}</p>
                          <p className="truncate text-xs text-slate-500">{client.email || 'Contact non renseigné'}</p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-black text-[#32BB78]">{client.total.toLocaleString()} CDF</p>
                        <p className="text-xs text-slate-500">{client.orders} commande{client.orders > 1 ? 's' : ''} • {client.lastStatus}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}

        {activeTab === 'approval' ? (
          <Card>
            <CardHeader>
              <CardTitle>Statut</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="rounded-2xl border border-primary/10 bg-white p-4">
                <p className="text-sm font-bold">Statut actuel</p>
                <p className="text-xs text-muted-foreground mt-1">{store.status}</p>
              </div>
              <div className="rounded-2xl border border-primary/10 bg-white p-4">
                <p className="text-sm font-bold">Accès public</p>
                <p className="text-xs text-muted-foreground mt-1">{isApproved ? 'Actif' : 'Bloqué (en attente)'}</p>
              </div>
            </CardContent>
          </Card>
        ) : null}

      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-700">Nom</p>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-700">Localisation</p>
                <Input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-700">Prix</p>
                <Input value={editPrice} onChange={(e) => setEditPrice(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-700">Devise</p>
                <select
                  value={editCurrency}
                  onChange={(e) => setEditCurrency(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="CDF">CDF</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              {store?.sellType === 'product' && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-700">Stock disponible</p>
                  <Input value={editStock} onChange={(e) => setEditStock(e.target.value)} type="number" min="0" />
                </div>
              )}
            </div>

            {store?.category ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-700">Catégorie boutique</p>
                  <div className="h-10 px-3 rounded-md border border-input bg-background flex items-center text-sm">
                    {store.category}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-700">Sous-catégorie</p>
                  <select
                    value={editSubcategory}
                    onChange={(e) => setEditSubcategory(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    disabled={(SUBCATEGORIES_BY_CATEGORY[store.category] || []).length === 0}
                  >
                    <option value="">{(SUBCATEGORIES_BY_CATEGORY[store.category] || []).length ? 'Choisir…' : '—'}</option>
                    {(SUBCATEGORIES_BY_CATEGORY[store.category] || []).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-700">Description</p>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full min-h-[90px] rounded-xl border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-700">Photos (défilement horizontal)</p>
                <label className="text-xs font-semibold text-primary cursor-pointer hover:underline">
                  Ajouter
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleEditImages(e.target.files)}
                  />
                </label>
              </div>

              {(editImages.length > 0 || editNewFiles.length > 0) ? (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {editImages.map((src, idx) => (
                    <div key={`ex-${idx}`} className="relative h-20 w-20 flex-shrink-0 rounded-2xl overflow-hidden border border-primary/10 bg-gray-100">
                      <Image src={src} alt="Photo" fill className="object-cover" />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(idx)}
                        className="absolute top-1 right-1 h-7 w-7 rounded-full bg-black/60 text-white grid place-items-center"
                        aria-label="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {editNewFiles.map((f, idx) => (
                    <div key={`nf-${idx}`} className="relative h-20 w-20 flex-shrink-0 rounded-2xl overflow-hidden border border-primary/10 bg-primary/5 grid place-items-center">
                      <span className="text-[11px] font-semibold text-primary text-center px-2">Nouveau</span>
                      <button
                        type="button"
                        onClick={() => removeNewFile(idx)}
                        className="absolute top-1 right-1 h-7 w-7 rounded-full bg-black/60 text-white grid place-items-center"
                        aria-label="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Aucune photo.</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={isSaving}>
              Annuler
            </Button>
            <Button className="bg-primary hover:bg-primary/90" onClick={saveProductEdits} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sauvegarde...
                </>
              ) : (
                'Sauvegarder'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

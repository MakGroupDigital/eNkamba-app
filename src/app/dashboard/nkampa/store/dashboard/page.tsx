'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExternalLink, Loader2, PlusCircle, Store, LayoutDashboard, Boxes, Briefcase, Wallet, Megaphone, Image as ImageIcon, ShieldCheck, Save, Share2, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useNkampaStore } from '@/hooks/useNkampaStore';
import { uploadToCloudinary } from '@/lib/cloudinary-upload';
import { updateNkampaStore } from '@/lib/nkampa-store';
import { useToast } from '@/hooks/use-toast';
import { collection, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

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

function roleLabel(role: string) {
  const map: Record<string, string> = {
    individual: 'Individu',
    retailer: 'Détaillant',
    wholesaler: 'Grossiste',
    producer: 'Producteur',
    supplier: 'Fournisseur',
  };
  return map[role] || role;
}

export default function NkampaStoreDashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { store, hasChecked } = useNkampaStore(user?.uid);
  const didLoginRedirectRef = useRef(false);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'media' | 'promo' | 'finance' | 'approval'>('overview');
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
        toast({ title: 'Lien copié', description: 'Lien du produit copié.', className: 'bg-green-600 text-white border-none' });
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        toast({ title: 'Lien copié', description: 'Lien du produit copié.', className: 'bg-green-600 text-white border-none' });
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
        location: editLocation.trim(),
        description: editDescription.trim(),
        images: mergedImages,
        image: primary,
        storeSubcategory: editSubcategory || '',
      } as any);

      toast({ title: 'Sauvé', description: 'Produit mis à jour.', className: 'bg-green-600 text-white border-none' });
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

      toast({ title: 'Sauvé', description: 'Profil boutique mis à jour.', className: 'bg-green-600 text-white border-none' });
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
      toast({ title: 'Sauvé', description: 'Promo mise à jour.', className: 'bg-green-600 text-white border-none' });
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
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 z-10 bg-gradient-to-r from-primary to-green-800 text-white p-4 shadow-lg">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            <h1 className="text-lg font-extrabold">Ma boutique</h1>
          </div>
          <p className="text-xs text-white/80">Aucune boutique trouvée</p>
        </div>

        <div className="mx-auto max-w-2xl p-4">
          <Card>
            <CardHeader>
              <CardTitle>Créer votre boutique</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Vous n’avez pas encore de boutique Nkampa. Créez-en une pour commencer à vendre.
              </p>
              <Button asChild className="w-full bg-primary hover:bg-primary/90">
                <Link href="/dashboard/nkampa/store">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Créer une boutique
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/nkampa">Retour à Nkampa</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const blocks: Array<{
    key: string;
    title: string;
    icon: any;
    desc: string;
    href: string;
    cta: string;
  }> = [
    {
      key: 'listing',
      title: store.sellType === 'product' ? 'Gérer les produits' : 'Gérer les services',
      icon: store.sellType === 'product' ? Boxes : Briefcase,
      desc: store.sellType === 'product' ? 'Ajouter, modifier, prix, stock.' : 'Créer des offres, tarifs, disponibilité.',
      href: '/dashboard/nkampa/seller',
      cta: store.sellType === 'product' ? 'Ajouter un produit' : 'Ajouter une offre',
    },
    {
      key: 'orders',
      title: 'Commandes',
      icon: LayoutDashboard,
      desc: 'Suivi, statuts, expédition.',
      href: '/dashboard/nkampa/orders',
      cta: 'Voir commandes',
    },
  ];

  const typeCards = isBusiness
    ? [
        {
          title: roles.length > 1 ? 'Dashboard Multi-rôles' : `Dashboard ${roleLabel(roles[0] || '')}`,
          desc:
            roles.includes('wholesaler')
              ? 'Outils vente en gros, MOQ, lots.'
              : roles.includes('producer')
                ? 'Gestion production, nouveautés.'
                : roles.includes('retailer')
                  ? 'Ventes au détail, promotions.'
                  : roles.includes('supplier')
                    ? 'Catalogue fournisseur, disponibilité.'
                    : 'Vue complète multi-rôles.',
        },
      ]
    : [
        {
          title: 'Dashboard Boutique',
          desc: 'Gestion simple et rapide.',
        },
      ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 bg-gradient-to-r from-primary to-green-800 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              <h1 className="text-lg font-extrabold truncate">{store.storeName}</h1>
            </div>
            <p className="text-xs text-white/80 truncate">
              {sellLabel}
              {isBusiness && roles.length > 0 ? ` • ${roles.map(roleLabel).join(' • ')}` : ''}
              {store.category ? ` • ${store.category}` : ''}
            </p>
          </div>
          {isApproved ? (
            <Button asChild variant="secondary" className="bg-white/15 text-white border border-white/20 hover:bg-white/20">
              <Link href={storeUrl} target="_blank" rel="noreferrer">
                Voir <ExternalLink className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          ) : (
            <Badge className="bg-white/15 text-white border border-white/20">En attente</Badge>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-6xl p-4 space-y-4">
        {/* Floating management bar */}
        <div className="sticky top-[76px] z-10">
          <div className="rounded-3xl border border-primary/15 bg-white/75 backdrop-blur-xl shadow-[0_18px_45px_rgba(0,0,0,0.10)] px-3 py-2">
            <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-hide">
              {[
                { id: 'overview', label: 'Aperçu', icon: LayoutDashboard },
                { id: 'products', label: store.sellType === 'product' ? 'Produits' : 'Services', icon: store.sellType === 'product' ? Boxes : Briefcase },
                { id: 'media', label: 'Médias', icon: ImageIcon },
                { id: 'promo', label: 'Promo', icon: Megaphone },
                { id: 'finance', label: 'Finance', icon: Wallet },
                ...(store.profileType === 'business' ? [{ id: 'approval', label: 'Statut', icon: ShieldCheck }] : []),
              ].map((t: any) => {
                const Icon = t.icon;
                const active = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id)}
                    className={[
                      'flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-semibold transition whitespace-nowrap',
                      active ? 'bg-primary/10 text-primary' : 'text-foreground/70 hover:bg-primary/5 hover:text-foreground',
                    ].join(' ')}
                  >
                    <Icon className="h-4 w-4" />
                    {t.label}
                  </button>
                );
              })}

              <div className="flex-1" />
              {activeTab === 'media' ? (
                <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={saveProfile} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  Sauver
                </Button>
              ) : activeTab === 'promo' ? (
                <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={savePromo} disabled={isSaving}>
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
          <Card>
            <CardContent className="p-0">
              <div className="relative">
                <div className="relative h-44 sm:h-52 w-full overflow-hidden rounded-t-lg bg-gradient-to-br from-primary via-emerald-700 to-green-900">
                  {store.coverUrl ? (
                    <>
                      <Image src={store.coverUrl} alt="Cover boutique" fill className="object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-emerald-800/60 to-green-900/55" />
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_55%),radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.12),transparent_60%)]" />
                  )}
                </div>

                <div className="absolute -bottom-7 left-4 flex items-end gap-4">
                  <div className="relative h-20 w-20 rounded-3xl overflow-hidden bg-white shadow-[0_18px_45px_rgba(0,0,0,0.18)] ring-4 ring-white">
                    {store.logoUrl ? (
                      <Image src={store.logoUrl} alt="Logo boutique" fill className="object-cover" />
                    ) : (
                      <div className="h-full w-full grid place-items-center bg-primary/10">
                        <span className="text-2xl font-black text-primary">{String(store.storeName || 'B').slice(0, 1).toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-4 pt-10 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-muted-foreground">Profil boutique</p>
                    <h2 className="text-xl font-extrabold tracking-tight truncate">{store.storeName}</h2>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {sellLabel}
                      {store.category ? ` • ${store.category}` : ''}
                      {isBusiness && roles.length ? ` • ${roles.map(roleLabel).join(' • ')}` : ''}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {isApproved ? (
                      <Button asChild size="sm" className="bg-primary hover:bg-primary/90">
                        <Link href={storeUrl} target="_blank" rel="noreferrer">
                          Voir la boutique <ExternalLink className="h-4 w-4 ml-2" />
                        </Link>
                      </Button>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-900 border border-amber-200">En attente</Badge>
                    )}
                    <Button size="sm" variant="outline" onClick={() => setActiveTab('media')}>
                      Personnaliser
                    </Button>
                  </div>
                </div>

                {store.description ? (
                  <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{store.description}</p>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {activeTab === 'overview' ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span>Résumé</span>
                <Badge className="bg-primary/10 text-primary border border-primary/15">
                  {isBusiness ? 'Entreprise' : 'Individu'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {typeCards.map((t) => (
                <div key={t.title} className="rounded-2xl border border-primary/10 bg-white p-4">
                  <p className="text-sm font-bold">{t.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t.desc}</p>
                </div>
              ))}
              {isBusiness && roles.length > 0 ? (
                <div className="rounded-2xl border border-primary/10 bg-white p-4">
                  <p className="text-sm font-bold">Rôles</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {roles.map((r: string) => roleLabel(r)).join(' • ')}
                  </p>
                  {Object.keys(subroles).length > 0 ? (
                    <div className="mt-3 space-y-1">
                      {roles.map((r: string) => {
                        const list = subroles[r] || [];
                        if (!list.length) return null;
                        return (
                          <p key={r} className="text-[11px] text-muted-foreground">
                            <span className="font-semibold text-foreground/80">{roleLabel(r)}:</span> {list.join(', ')}
                          </p>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              ) : null}
              <div className="rounded-2xl border border-primary/10 bg-white p-4">
                <p className="text-sm font-bold">Lien boutique</p>
                <p className="text-xs text-muted-foreground mt-1">{isApproved ? storeUrl : 'Activé après approbation'}</p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {activeTab === 'products' ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span>{store.sellType === 'product' ? 'Produits' : 'Services'}</span>
                <Button asChild size="sm" className="bg-primary hover:bg-primary/90">
                  <Link href="/dashboard/nkampa/seller">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Ajouter
                  </Link>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {myProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun élément pour le moment.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {myProducts.map((p) => (
                    <div key={p.id} className="rounded-2xl border border-primary/10 bg-white overflow-hidden">
                      <div className="relative w-full aspect-square bg-gray-100">
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
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-bold line-clamp-1">{p.name}</p>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">{p.location}</p>
                        <p className="text-xs font-extrabold text-primary mt-1">
                          {(p.price || 0).toLocaleString()} {p.currency || 'CDF'}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => openEdit(p)}>
                            <Pencil className="h-4 w-4 mr-1" />
                            Éditer
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => shareProduct(p)}>
                            <Share2 className="h-4 w-4 mr-1" />
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
          <Card>
            <CardHeader>
              <CardTitle>Finance</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-primary/10 bg-white p-4">
                <p className="text-xs text-muted-foreground">Revenu total</p>
                <p className="text-2xl font-extrabold text-primary mt-1">{revenue.toLocaleString()} CDF</p>
              </div>
              <div className="rounded-2xl border border-primary/10 bg-white p-4">
                <p className="text-xs text-muted-foreground">Commandes (en cours)</p>
                <p className="text-2xl font-extrabold text-foreground mt-1">{pendingCount}</p>
              </div>
              <div className="rounded-2xl border border-primary/10 bg-white p-4">
                <p className="text-xs text-muted-foreground">Articles</p>
                <p className="text-2xl font-extrabold text-foreground mt-1">{myProducts.length}</p>
              </div>
              <div className="md:col-span-3 rounded-2xl border border-primary/10 bg-white p-4">
                <p className="text-sm font-bold">Dernières commandes</p>
                {sellerOrders.length === 0 ? (
                  <p className="text-xs text-muted-foreground mt-1">Aucune commande.</p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {sellerOrders.slice(0, 5).map((o) => (
                      <div key={o.id} className="flex items-center justify-between text-sm">
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{o.productName}</p>
                          <p className="text-xs text-muted-foreground truncate">#{String(o.id).slice(0, 8)} • {o.status}</p>
                        </div>
                        <p className="font-extrabold text-primary">{Number(o.totalPrice || 0).toLocaleString()} {o.currency || 'CDF'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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

        {activeTab === 'overview' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {blocks.map((b) => {
              const Icon = b.icon;
              return (
                <Card key={b.key} className="overflow-hidden">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Icon className="h-5 w-5 text-primary" />
                      {b.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{b.desc}</p>
                    <Button asChild className="w-full bg-primary hover:bg-primary/90">
                      <Link href={b.href}>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        {b.cta}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
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

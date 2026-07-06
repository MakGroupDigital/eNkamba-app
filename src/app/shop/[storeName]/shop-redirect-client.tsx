'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { NkampaNavSellerIcon, NkampaNavShopIcon } from '@/components/icons/nkampa-nav-icons';
import { CustomersIcon, ProductsIcon, RatingIcon, StoreStatsIcon, VerifiedIcon } from '@/components/icons/seller-portal-icons';
import { LocationIcon, PriceIcon } from '@/components/icons/nkampa-ecommerce-icons';

// Map of store names to seller IDs
const STORE_NAME_TO_SELLER_ID: Record<string, string> = {
  'kasang-elektronique': 'seller-1',
  'fournisseur-premium': 'seller-1',
  'grossiste-goma': 'seller-2',
  'producteur-bio-bukavu': 'seller-3',
  'electroshop': 'seller-4',
};

export default function ShopRedirectClient({ params }: { params: Promise<{ storeName: string }> }) {
  const { storeName } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [storeDoc, setStoreDoc] = useState<any | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [products, setProducts] = useState<any[]>([]);

  const slug = useMemo(() => (storeName || '').toLowerCase(), [storeName]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setIsChecking(true);
        const q = query(collection(db, 'nkampa_stores'), where('slug', '==', slug), limit(1));
        const snap = await getDocs(q);
        if (!mounted) return;

        if (!snap.empty) {
          const doc = snap.docs[0];
          const foundStore = { id: doc.id, ...(doc.data() as any) };
          setStoreDoc(foundStore);

          // Charger produits de la boutique
          const pq = query(collection(db, 'nkampa_products'), where('sellerId', '==', foundStore.ownerId));
          const psnap = await getDocs(pq);
          if (!mounted) return;
          setProducts(psnap.docs.map((d) => ({ id: d.id, ...d.data() })));

          setIsChecking(false);
          return;
        }

        // fallback legacy redirect
        const sellerId = STORE_NAME_TO_SELLER_ID[slug] || 'seller-1';
        router.replace(`/dashboard/nkampa/seller/${sellerId}`);
      } catch (e) {
        console.error(e);
        const sellerId = STORE_NAME_TO_SELLER_ID[slug] || 'seller-1';
        router.replace(`/dashboard/nkampa/seller/${sellerId}`);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [slug, router]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-primary">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg font-semibold">Ouverture de la boutique...</p>
        </div>
      </div>
    );
  }

  if (!storeDoc) return null;

  const isOwner = !!user && user.uid === storeDoc.ownerId;
  const sellLabel = storeDoc.sellType === 'service' ? 'Services' : 'Produits';
  const isApproved = storeDoc.status === 'active' || storeDoc.status === 'approved';
  const visibleProducts = products.slice(0, 24);
  const lowestPrice = products.reduce((min, product) => {
    const price = Number(product.price || 0);
    if (!price) return min;
    return min === 0 ? price : Math.min(min, price);
  }, 0);

  return (
    <div className="min-h-screen bg-[#F6F8F7] text-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-sm">
          <div className="relative h-[330px] bg-[#009058] sm:h-[390px]">
            {storeDoc.coverUrl ? (
              <>
                <Image src={storeDoc.coverUrl} alt="Cover" fill className="object-cover" priority />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              </>
            ) : (
              <div className="absolute inset-0 bg-[linear-gradient(135deg,#009058_0%,#009058_54%,#101827_100%)]" />
            )}

            <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-3">
              <Badge className="rounded-full border border-white/20 bg-white/90 px-3 py-1 text-[#009058]">
                {isApproved ? 'Boutique vérifiée' : 'En attente'}
              </Badge>
              {isOwner ? (
                <Button asChild className="rounded-2xl bg-white text-[#009058] hover:bg-white/90">
                  <Link href="/dashboard/nkampa/store/dashboard">Gérer</Link>
                </Button>
              ) : null}
            </div>

            <div className="absolute bottom-5 left-4 right-4">
              <div className="flex items-end gap-4">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[28px] bg-white shadow-2xl ring-4 ring-white">
                  {storeDoc.logoUrl ? (
                    <Image src={storeDoc.logoUrl} alt="Logo" fill className="object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-[#009058]/10">
                      <NkampaNavSellerIcon size={54} />
                    </div>
                  )}
                </div>
                <div className="min-w-0 pb-1 text-white">
                  <p className="text-xs font-black uppercase tracking-wide text-white/70">Vitrine Nkampa</p>
                  <h1 className="truncate text-3xl font-black tracking-tight sm:text-4xl">{storeDoc.storeName}</h1>
                  <p className="mt-1 truncate text-sm font-semibold text-white/80">
                    {sellLabel} • {storeDoc.category || 'Catalogue'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-4 md:grid-cols-[1fr_auto]">
            <p className="text-sm leading-6 text-slate-600">
              {storeDoc.description || 'Cette boutique prépare sa vitrine. Les articles et offres apparaîtront ici.'}
            </p>
            <div className="flex flex-wrap gap-2 md:justify-end">
              <Badge className="rounded-full border border-[#009058]/20 bg-[#009058]/10 px-3 py-1 text-[#009058]">
                <VerifiedIcon size={18} /> <span className="ml-1">{sellLabel}</span>
              </Badge>
              <Badge className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700">
                <LocationIcon size={18} /> <span className="ml-1">{storeDoc.location || storeDoc.category || 'Nkampa'}</span>
              </Badge>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Rayon</p>
                <p className="mt-1 text-2xl font-black">{products.length}</p>
              </div>
              <ProductsIcon size={34} />
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Type</p>
                <p className="mt-1 text-lg font-black">{sellLabel}</p>
              </div>
              <NkampaNavShopIcon size={34} />
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Dès</p>
                <p className="mt-1 text-lg font-black">{lowestPrice ? `${lowestPrice.toLocaleString()} CDF` : '—'}</p>
              </div>
              <PriceIcon size={34} />
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Statut</p>
                <p className="mt-1 text-lg font-black">{isApproved ? 'Ouvert' : 'Pause'}</p>
              </div>
              <StoreStatsIcon size={34} />
            </div>
          </div>
        </div>

        <Card className="mt-4 overflow-hidden rounded-[32px] border-slate-200 shadow-sm">
          <CardContent className="space-y-5 p-4">
            {!isApproved && !isOwner ? (
              <div className="rounded-3xl border border-[#FFA500]/30 bg-[#FFA500]/10 p-4">
                <p className="text-sm font-semibold text-[#FFA500]">Boutique en attente d’approbation</p>
                <p className="text-xs text-[#FFA500] mt-1">Cette boutique entreprise n’est pas encore publique.</p>
              </div>
            ) : null}

            {storeDoc.promoEnabled && (isApproved || isOwner) ? (
              <div className="rounded-[28px] border border-[#009058]/20 bg-[#009058]/10 p-4">
                <div className="flex items-center gap-3">
                  <div className="relative h-16 w-24 overflow-hidden rounded-2xl border border-white bg-white">
                    {storeDoc.promoImageUrl ? <Image src={storeDoc.promoImageUrl} alt="Promo" fill className="object-cover" /> : null}
                  </div>
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <RatingIcon size={22} />
                      <p className="text-sm font-black text-[#009058] truncate">{storeDoc.promoTitle || 'Promo boutique'}</p>
                    </div>
                    <p className="truncate text-xs text-slate-600">{storeDoc.promoText || ''}</p>
                  </div>
                </div>
              </div>
            ) : null}

            {(isApproved || isOwner) ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-[#009058]">Catalogue</p>
                    <h2 className="text-xl font-black tracking-tight">{sellLabel} en vitrine</h2>
                  </div>
                  <Badge className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700">
                    <CustomersIcon size={18} /> <span className="ml-1">Service client</span>
                  </Badge>
                </div>
                {products.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                    <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-white">
                      <ProductsIcon size={38} />
                    </div>
                    <p className="mt-3 text-sm font-black">Aucun élément pour le moment</p>
                    <p className="mt-1 text-xs text-slate-500">La boutique publiera bientôt ses premiers articles.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {visibleProducts.map((p) => (
                      <Link
                        key={p.id}
                        href={`/shop/${storeDoc.slug}/product/${p.id}`}
                        className="block overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <div className="relative w-full aspect-square bg-gray-100">
                          {p.image ? <Image src={p.image} alt={p.name || 'Produit'} fill className="object-cover" /> : (
                            <div className="grid h-full w-full place-items-center bg-[#009058]/10">
                              <ProductsIcon size={40} />
                            </div>
                          )}
                          <div className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-[10px] font-black text-[#009058] shadow">
                            Voir
                          </div>
                        </div>
                        <div className="p-3">
                          <p className="line-clamp-1 text-xs font-black">{p.name}</p>
                          <p className="mt-1 text-sm font-black text-[#009058]">
                            {(p.price || 0).toLocaleString()} {p.currency || 'CDF'}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button asChild className="rounded-2xl bg-[#009058] hover:bg-[#009058]">
                <Link href="/dashboard/nkampa">Explorer Nkampa</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

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
  const { user, isLoading: authLoading } = useAuth();
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-green-900">
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="relative">
        {storeDoc.coverUrl ? (
          <div className="absolute inset-0 h-48">
            <Image src={storeDoc.coverUrl} alt="Cover" fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/85 to-green-900/70" />
          </div>
        ) : (
          <div className="absolute inset-0 h-48 bg-gradient-to-r from-primary to-green-900" />
        )}

        <div className="relative z-10 pt-6 pb-6 text-white">
          <div className="max-w-5xl mx-auto px-4 flex items-center gap-4">
            <div className="relative h-14 w-14 rounded-2xl overflow-hidden bg-white/15 border border-white/20">
              {storeDoc.logoUrl ? <Image src={storeDoc.logoUrl} alt="Logo" fill className="object-cover" /> : null}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold truncate">{storeDoc.storeName}</h1>
              <p className="text-xs text-white/85 truncate">
                {sellLabel} • {storeDoc.category}
              </p>
            </div>
            <div className="flex-1" />
            {isOwner ? (
              <Button asChild variant="secondary" className="bg-white/15 text-white border border-white/20 hover:bg-white/20">
                <Link href="/dashboard/nkampa/store/dashboard">Gérer</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2">
              <span>Bienvenue</span>
              <Badge className="bg-primary/10 text-primary border border-primary/15">{sellLabel}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isApproved && !isOwner ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-900">Boutique en attente d’approbation</p>
                <p className="text-xs text-amber-800 mt-1">Cette boutique entreprise n’est pas encore publique.</p>
              </div>
            ) : null}

            {storeDoc.promoEnabled && (isApproved || isOwner) ? (
              <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4">
                <div className="flex items-center gap-3">
                  <div className="relative h-14 w-20 rounded-2xl overflow-hidden bg-white border border-primary/10">
                    {storeDoc.promoImageUrl ? <Image src={storeDoc.promoImageUrl} alt="Promo" fill className="object-cover" /> : null}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-primary truncate">{storeDoc.promoTitle || 'Promo'}</p>
                    <p className="text-xs text-muted-foreground truncate">{storeDoc.promoText || ''}</p>
                  </div>
                </div>
              </div>
            ) : null}

            {storeDoc.description ? (
              <p className="text-sm text-muted-foreground">{storeDoc.description}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Cette boutique est nouvelle. Les articles apparaîtront bientôt.</p>
            )}

            {(isApproved || isOwner) ? (
              <div className="space-y-2">
                <p className="text-sm font-bold">{sellLabel}</p>
                {products.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Aucun élément pour le moment.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {products.slice(0, 12).map((p) => (
                      <Link
                        key={p.id}
                        href={`/shop/${storeDoc.slug}/product/${p.id}`}
                        className="rounded-2xl border border-primary/10 bg-white overflow-hidden block hover:shadow-md transition-shadow"
                      >
                        <div className="relative w-full aspect-square bg-gray-100">
                          {p.image ? <Image src={p.image} alt={p.name || 'Produit'} fill className="object-cover" /> : null}
                        </div>
                        <div className="p-2">
                          <p className="text-xs font-bold line-clamp-1">{p.name}</p>
                          <p className="text-xs font-extrabold text-primary mt-1">
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
              <Button asChild className="bg-primary hover:bg-primary/90">
                <Link href="/dashboard/nkampa">Explorer Nkampa</Link>
              </Button>
              {authLoading ? null : isOwner ? null : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

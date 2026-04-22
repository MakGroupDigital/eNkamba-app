'use client';

import { use } from 'react';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Share2, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export default function ShopProductPage({
  params,
}: {
  params: Promise<{ storeName: string; productId: string }>;
}) {
  const { storeName, productId } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const slug = useMemo(() => (storeName || '').toLowerCase(), [storeName]);
  const [storeDoc, setStoreDoc] = useState<any | null>(null);
  const [product, setProduct] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setIsLoading(true);
        const sq = query(collection(db, 'nkampa_stores'), where('slug', '==', slug), limit(1));
        const ssnap = await getDocs(sq);
        if (!mounted) return;
        if (ssnap.empty) {
          router.replace(`/shop/${slug}`);
          return;
        }
        const store = { id: ssnap.docs[0].id, ...(ssnap.docs[0].data() as any) };
        setStoreDoc(store);

        const psnap = await getDoc(doc(db, 'nkampa_products', productId));
        if (!mounted) return;
        if (!psnap.exists()) {
          router.replace(`/shop/${slug}`);
          return;
        }
        setProduct({ id: psnap.id, ...(psnap.data() as any) });
        setIsLoading(false);
      } catch (e) {
        console.error(e);
        router.replace(`/shop/${slug}`);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [slug, productId, router]);

  const isOwner = !!user && !!storeDoc && user.uid === storeDoc.ownerId;
  const isApproved = storeDoc?.status === 'active' || storeDoc?.status === 'approved';

  const images: string[] = useMemo(() => {
    if (!product) return [];
    const list = Array.isArray(product.images) && product.images.length ? product.images : product.image ? [product.image] : [];
    return list.slice(0, 8);
  }, [product]);

  const share = async () => {
    const url = window.location.href;
    const title = product?.name ? String(product.name) : 'Produit';
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!storeDoc || !product) return null;

  if (!isApproved && !isOwner) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 z-10 bg-gradient-to-r from-primary to-green-800 text-white p-4 shadow-lg">
          <div className="flex items-center gap-3 max-w-5xl mx-auto">
            <Button size="icon" variant="ghost" className="text-white hover:bg-white/15" onClick={() => router.back()}>
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-lg font-extrabold truncate">{storeDoc.storeName}</h1>
              <p className="text-xs text-white/80">Boutique en attente d’approbation</p>
            </div>
          </div>
        </div>
        <div className="max-w-5xl mx-auto p-4">
          <Card className="border border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-amber-900">Accès non disponible</p>
              <p className="text-xs text-amber-800 mt-1">Ce produit n’est pas encore public.</p>
              <Button asChild className="mt-3 bg-primary hover:bg-primary/90">
                <Link href={`/shop/${slug}`}>Retour boutique</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="sticky top-0 z-10 bg-gradient-to-r from-primary to-green-800 text-white p-4 shadow-lg">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Button size="icon" variant="ghost" className="text-white hover:bg-white/15" onClick={() => router.back()}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg font-extrabold truncate">{product.name}</h1>
            <p className="text-xs text-white/80 truncate">{storeDoc.storeName}</p>
          </div>
          <div className="flex-1" />
          <Button size="icon" variant="ghost" className="text-white hover:bg-white/15" onClick={share} aria-label="Partager">
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 space-y-4">
        <div className="rounded-3xl overflow-hidden border border-primary/10 bg-white">
          <div className="relative w-full aspect-square bg-gray-100">
            <div className="absolute inset-0 flex overflow-x-auto snap-x snap-mandatory scrollbar-hide">
              {images.map((src, idx) => (
                <div key={idx} className="relative min-w-full h-full snap-center">
                  <Image src={src} alt={product.name} fill className="object-cover" />
                </div>
              ))}
            </div>
            <div className="absolute bottom-3 left-3 flex gap-1.5">
              {images.map((_, idx) => (
                <span key={idx} className="h-1.5 w-1.5 rounded-full bg-white/85 shadow" />
              ))}
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Prix</p>
                <p className="text-2xl font-extrabold text-primary">
                  {(product.price || 0).toLocaleString()} {product.currency || 'CDF'}
                </p>
              </div>
              <Badge className="bg-primary/10 text-primary border border-primary/15">
                {product.storeCategory || storeDoc.category || 'Nkampa'}
              </Badge>
            </div>
            {product.description ? <p className="text-sm text-muted-foreground mt-3">{product.description}</p> : null}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Infos</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl border border-primary/10 bg-white p-3">
              <p className="text-xs text-muted-foreground">Localisation</p>
              <p className="font-semibold">{product.location || '—'}</p>
            </div>
            <div className="rounded-2xl border border-primary/10 bg-white p-3">
              <p className="text-xs text-muted-foreground">Sous-catégorie</p>
              <p className="font-semibold">{product.storeSubcategory || '—'}</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button asChild className="bg-primary hover:bg-primary/90 flex-1">
            <Link href={`/shop/${slug}`}>Retour boutique</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href="/dashboard/nkampa">Explorer Nkampa</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}


'use client';

import { use, useEffect, useMemo, useState, type ComponentType } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { ArrowLeft, BarChart3, DownloadCloud, Eye, Megaphone, PackageCheck, Share2, ShoppingBag, WalletCards } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';

const SPONSOR_PACKAGES = [
  { id: 'day', label: '24h', amount: 2500, days: 1, description: 'Mise en avant courte pour tester la demande.' },
  { id: 'week', label: '7 jours', amount: 10000, days: 7, description: 'Visibilité régulière sur le marché.' },
  { id: 'month', label: '30 jours', amount: 25000, days: 30, description: 'Campagne longue pour produit stratégique.' },
];

function formatMoney(amount: number) {
  return `${Math.round(Number(amount || 0)).toLocaleString('fr-FR')} CDF`;
}

function toDate(value: any): Date | null {
  if (!value) return null;
  if (typeof value?.toDate === 'function') return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export default function CommerceProductStatsPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = use(params);
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [product, setProduct] = useState<any | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSponsoring, setIsSponsoring] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user?.uid) {
      setError('Connexion requise.');
      setIsLoading(false);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const [productSnap, userSnap] = await Promise.all([
          getDoc(doc(db, 'nkampa_products', productId)),
          getDoc(doc(db, 'users', user.uid)),
        ]);

        if (!mounted) return;
        if (!productSnap.exists()) {
          setError('Produit introuvable.');
          setIsLoading(false);
          return;
        }

        const productData = { id: productSnap.id, ...productSnap.data() } as any;
        if (productData.sellerId !== user.uid) {
          setError('Ce produit n’appartient pas à ce compte commerce.');
          setIsLoading(false);
          return;
        }

        const ordersSnap = await getDocs(query(
          collection(db, 'nkampa_orders'),
          where('productId', '==', productId),
          where('sellerId', '==', user.uid)
        ));

        if (!mounted) return;
        setProduct(productData);
        setOrders(ordersSnap.docs.map((orderDoc) => ({ id: orderDoc.id, ...orderDoc.data() })));
        setWalletBalance(Number(userSnap.data()?.walletBalance || 0));
      } catch (err) {
        console.error('Erreur stats produit commerce:', err);
        setError('Impossible de charger les statistiques du produit.');
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [authLoading, productId, user?.uid]);

  const publicUrl = useMemo(() => {
    if (!product) return '';
    const storeSlug = product.storeSlug || 'boutique';
    if (typeof window === 'undefined') return `/shop/${storeSlug}/product/${product.id}`;
    return `${window.location.origin}/shop/${storeSlug}/product/${product.id}`;
  }, [product]);

  const stats = useMemo(() => {
    const revenue = orders.reduce((total, order) => total + Number(order.totalAmount || order.totalPrice || 0), 0);
    const paidOrders = orders.filter((order) => order.paymentStatus === 'completed' || order.status === 'paid').length;
    const deliveredOrders = orders.filter((order) => order.status === 'delivered').length;
    const views = Number(product?.clickCount || product?.views || 0);
    const sold = Number(product?.sold || 0);
    return {
      revenue,
      paidOrders,
      deliveredOrders,
      views,
      sold,
      conversion: views > 0 ? Math.min(100, (paidOrders / views) * 100) : 0,
      downloads: Number(product?.digitalDownloadCount || 0),
    };
  }, [orders, product]);

  const sponsoredUntil = toDate(product?.sponsoredUntil);
  const isSponsored = Boolean(product?.sponsored) && sponsoredUntil && sponsoredUntil.getTime() > Date.now();

  const shareProduct = async () => {
    if (!product || !publicUrl) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name || 'Produit eNkamba', url: publicUrl });
      } else {
        await navigator.clipboard.writeText(publicUrl);
        toast({ title: 'Lien copié', description: 'Lien public du produit copié.', className: 'bg-primary text-white border-none' });
      }
      await runTransaction(db, async (tx) => {
        tx.update(doc(db, 'nkampa_products', product.id), {
          shareCount: increment(1),
          lastSharedAt: serverTimestamp(),
        });
      });
    } catch {
      try {
        await navigator.clipboard.writeText(publicUrl);
        toast({ title: 'Lien copié', description: 'Lien public du produit copié.', className: 'bg-primary text-white border-none' });
      } catch {
        toast({ variant: 'destructive', title: 'Partage impossible', description: 'Impossible de partager ce produit.' });
      }
    }
  };

  const sponsorProduct = async (pack: typeof SPONSOR_PACKAGES[number]) => {
    if (!user?.uid || !product) return;
    setIsSponsoring(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const productRef = doc(db, 'nkampa_products', product.id);
      const transactionId = `SPONSOR_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const transactionRef = doc(collection(db, 'users', user.uid, 'transactions'), transactionId);
      const until = new Date(Date.now() + pack.days * 24 * 60 * 60 * 1000).toISOString();

      await runTransaction(db, async (tx) => {
        const [freshUserSnap, freshProductSnap] = await Promise.all([
          tx.get(userRef),
          tx.get(productRef),
        ]);
        if (!freshUserSnap.exists()) throw new Error('Compte wallet introuvable.');
        if (!freshProductSnap.exists()) throw new Error('Produit introuvable.');
        if (freshProductSnap.data()?.sellerId !== user.uid) throw new Error('Accès produit refusé.');

        const balance = Number(freshUserSnap.data()?.walletBalance || 0);
        if (balance < pack.amount) {
          throw new Error('Solde eNkamba insuffisant pour sponsoriser ce produit.');
        }

        tx.update(userRef, {
          walletBalance: balance - pack.amount,
          updatedAt: serverTimestamp(),
        });
        tx.update(productRef, {
          sponsored: true,
          promoEnabled: true,
          sponsoredUntil: until,
          sponsorPackage: pack.id,
          sponsorBudget: increment(pack.amount),
          sponsorLastPaymentAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        tx.set(transactionRef, {
          type: 'marketplace_sponsorship',
          amount: -pack.amount,
          status: 'completed',
          description: `Sponsoring produit - ${product.name}`,
          previousBalance: balance,
          newBalance: balance - pack.amount,
          timestamp: serverTimestamp(),
          createdAt: new Date().toISOString(),
          metadata: {
            productId: product.id,
            productName: product.name,
            packageId: pack.id,
            days: pack.days,
            sponsoredUntil: until,
          },
        });
      });

      setWalletBalance((current) => current - pack.amount);
      setProduct((current: any) => current ? {
        ...current,
        sponsored: true,
        promoEnabled: true,
        sponsoredUntil: until,
        sponsorPackage: pack.id,
        sponsorBudget: Number(current.sponsorBudget || 0) + pack.amount,
      } : current);
      toast({
        title: 'Produit sponsorisé',
        description: `Mise en avant activée jusqu’au ${new Date(until).toLocaleDateString('fr-FR')}.`,
        className: 'bg-primary text-white border-none',
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Sponsoring impossible',
        description: err?.message || 'Le paiement wallet n’a pas pu être effectué.',
      });
    } finally {
      setIsSponsoring(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
        <div className="mx-auto max-w-xl rounded-3xl border border-red-100 bg-white p-6 text-center shadow-sm">
          <BarChart3 className="mx-auto h-10 w-10 text-red-500" />
          <h1 className="mt-3 text-xl font-black text-slate-950">Produit indisponible</h1>
          <p className="mt-2 text-sm font-semibold text-slate-600">{error || 'Impossible d’ouvrir ce produit.'}</p>
          <Button className="mt-5 bg-primary hover:bg-primary" onClick={() => router.push('/dashboard/business-pro?module=COMMERCE')}>
            Retour Commerce
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <header className="sticky top-0 z-30 bg-primary px-4 py-3 text-white shadow-lg">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <Button asChild size="icon" variant="ghost" className="text-white hover:bg-white/15">
            <Link href="/dashboard/business-pro?module=COMMERCE">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/70">Commerce produit</p>
            <h1 className="truncate text-lg font-black">Statistiques & sponsoring</h1>
          </div>
          <Button variant="secondary" className="rounded-2xl bg-white text-primary hover:bg-white/90" onClick={shareProduct}>
            <Share2 className="mr-2 h-4 w-4" />
            Partager
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-5 p-4">
        <section className="overflow-hidden rounded-3xl border border-primary/15 bg-white shadow-sm">
          <div className="grid gap-4 p-4 md:grid-cols-[220px_1fr]">
            <div className="relative aspect-square overflow-hidden rounded-3xl bg-slate-100">
              <Image
                src={product.image || product.images?.[0] || 'https://picsum.photos/seed/business-commerce/500/500'}
                alt={product.name || 'Produit'}
                fill
                className="object-cover"
              />
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="rounded-full bg-primary text-white hover:bg-primary">{product.businessAudience || product.category || 'COMMERCE'}</Badge>
                  {isSponsored ? (
                    <Badge className="rounded-full bg-orange-500 text-white hover:bg-orange-500">
                      Sponsorisé jusqu’au {sponsoredUntil?.toLocaleDateString('fr-FR')}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="rounded-full">Non sponsorisé</Badge>
                  )}
                </div>
                <h2 className="mt-3 text-2xl font-black text-slate-950">{product.name}</h2>
                <p className="mt-2 line-clamp-3 text-sm font-semibold leading-6 text-slate-600">{product.description || 'Aucune description.'}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label="Prix" value={`${Number(product.price || 0).toLocaleString('fr-FR')} ${product.currency || 'CDF'}`} icon={WalletCards} />
                <StatCard label="Stock" value={product.stock === null || product.stock === undefined ? 'Digital/service' : Number(product.stock || 0).toLocaleString('fr-FR')} icon={PackageCheck} />
                <StatCard label="Vues" value={stats.views.toLocaleString('fr-FR')} icon={Eye} />
                <StatCard label="Vendus" value={stats.sold.toLocaleString('fr-FR')} icon={ShoppingBag} />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatPanel title="Commandes payées" value={stats.paidOrders.toLocaleString('fr-FR')} />
          <StatPanel title="Chiffre d’affaires" value={formatMoney(stats.revenue)} />
          <StatPanel title="Conversion estimée" value={`${stats.conversion.toFixed(1)}%`} />
          <StatPanel title={product.listingType === 'digital' ? 'Téléchargements' : 'Livraisons'} value={(product.listingType === 'digital' ? stats.downloads : stats.deliveredOrders).toLocaleString('fr-FR')} />
        </section>

        <section className="rounded-3xl border border-primary/15 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-950">Sponsoriser ce produit</h2>
              <p className="text-sm font-semibold text-slate-600">Paiement direct via wallet eNkamba. Solde: {formatMoney(walletBalance)}</p>
            </div>
            <Megaphone className="h-8 w-8 text-primary" />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {SPONSOR_PACKAGES.map((pack) => (
              <div key={pack.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-lg font-black text-slate-950">{pack.label}</p>
                <p className="mt-1 text-2xl font-black text-primary">{formatMoney(pack.amount)}</p>
                <p className="mt-2 min-h-10 text-xs font-semibold leading-5 text-slate-600">{pack.description}</p>
                <Button
                  className="mt-4 w-full rounded-2xl bg-primary hover:bg-primary"
                  onClick={() => sponsorProduct(pack)}
                  disabled={isSponsoring}
                >
                  {isSponsoring ? 'Traitement...' : 'Payer avec wallet'}
                </Button>
              </div>
            ))}
          </div>
        </section>

        {product.listingType === 'digital' || product.hasDigitalDelivery ? (
          <section className="rounded-3xl border border-primary/15 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                <DownloadCloud className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-950">Livraison digitale</h2>
                <p className="mt-1 text-sm font-semibold text-slate-600">
                  {Number(product.digitalFileCount || product.digitalDelivery?.files?.length || 0)} fichier(s) Cloudinary attaché(s). Les clients y accèdent uniquement depuis une commande payée.
                </p>
              </div>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <Icon className="h-5 w-5 text-primary" />
      <p className="mt-2 text-[11px] font-black uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-slate-950">{value}</p>
    </div>
  );
}

function StatPanel({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-primary/15 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-3 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}

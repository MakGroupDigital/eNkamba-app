'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { doc, getDoc, increment, serverTimestamp, updateDoc } from 'firebase/firestore';
import { ArrowLeft, DownloadCloud, FileArchive, LockKeyhole, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import type { NkampaOrder, NkampaDigitalDeliveryFile } from '@/lib/nkampa-orders';

function formatFileSize(size: number) {
  if (!size) return 'Taille non précisée';
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} Ko`;
  return `${(size / 1024 / 1024).toFixed(2)} Mo`;
}

export default function DigitalOrderAccessPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [order, setOrder] = useState<NkampaOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
        const snap = await getDoc(doc(db, 'nkampa_orders', orderId));
        if (!mounted) return;
        if (!snap.exists()) {
          setError('Commande introuvable.');
          setIsLoading(false);
          return;
        }

        const data = { id: snap.id, ...snap.data() } as NkampaOrder;
        if (data.buyerId !== user.uid) {
          setError('Accès non autorisé pour cette commande.');
          setIsLoading(false);
          return;
        }

        setOrder(data);
      } catch (err) {
        console.error('Erreur accès digital:', err);
        setError('Impossible de charger le téléchargement.');
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [authLoading, orderId, user?.uid]);

  const files = order?.digitalDelivery?.files || [];
  const canDownload = order?.paymentStatus === 'completed' && files.length > 0;

  const handleDownload = async (file: NkampaDigitalDeliveryFile) => {
    if (!order || !canDownload) return;

    try {
      window.open(file.url, '_blank', 'noopener,noreferrer');
      await updateDoc(doc(db, 'nkampa_products', order.productId), {
        digitalDownloadCount: increment(1),
        lastDigitalDownloadAt: serverTimestamp(),
      });
      toast({
        title: 'Téléchargement ouvert',
        description: file.name,
        className: 'bg-primary text-white border-none',
      });
    } catch (err) {
      console.error('Erreur téléchargement digital:', err);
      toast({
        variant: 'destructive',
        title: 'Téléchargement impossible',
        description: 'Le fichier Cloudinary n’a pas pu être ouvert.',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
        <div className="mx-auto max-w-xl rounded-3xl border border-red-100 bg-white p-6 text-center shadow-sm">
          <LockKeyhole className="mx-auto h-10 w-10 text-red-500" />
          <h1 className="mt-3 text-xl font-black text-slate-950">Accès indisponible</h1>
          <p className="mt-2 text-sm font-semibold text-slate-600">{error || 'Commande introuvable.'}</p>
          <Button className="mt-5 bg-primary hover:bg-primary" onClick={() => router.push('/dashboard/nkampa/orders')}>
            Retour aux commandes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <header className="sticky top-0 z-20 bg-primary px-4 py-3 text-white shadow-lg">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Button asChild size="icon" variant="ghost" className="text-white hover:bg-white/15">
            <Link href="/dashboard/nkampa/orders">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/70">Marché digital</p>
            <h1 className="truncate text-lg font-black">Téléchargement sécurisé</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 p-4">
        <section className="overflow-hidden rounded-3xl border border-primary/15 bg-white shadow-sm">
          <div className="bg-primary/5 p-4">
            <div className="flex items-start gap-4">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                <Image
                  src={order.productImage || '/placeholder-product.png'}
                  alt={order.productName}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <Badge className="rounded-full bg-primary text-white hover:bg-primary">Commande payée</Badge>
                <h2 className="mt-2 line-clamp-2 text-xl font-black text-slate-950">{order.productName}</h2>
                <p className="mt-1 text-xs font-semibold text-slate-500">Référence {order.orderId}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 p-4">
            <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-black text-slate-950">Accès contrôlé par commande</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    Ces fichiers sont disponibles uniquement pour l’acheteur connecté à cette commande.
                  </p>
                </div>
              </div>
            </div>

            {order.digitalDelivery?.instructions ? (
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">Instructions du vendeur</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-800">{order.digitalDelivery.instructions}</p>
              </div>
            ) : null}

            {order.digitalDelivery?.license ? (
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">Licence</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-800">{order.digitalDelivery.license}</p>
              </div>
            ) : null}

            <div className="space-y-2">
              <p className="text-sm font-black text-slate-950">Fichiers disponibles</p>
              {canDownload ? (
                files.map((file) => (
                  <div key={`${file.publicId || file.url}-${file.name}`} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                      <FileArchive className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-slate-950">{file.name}</p>
                      <p className="text-xs font-semibold text-slate-500">{formatFileSize(file.size)} · Cloudinary</p>
                    </div>
                    <Button className="shrink-0 gap-2 rounded-2xl bg-primary hover:bg-primary" onClick={() => handleDownload(file)}>
                      <DownloadCloud className="h-4 w-4" />
                      Ouvrir
                    </Button>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                  <LockKeyhole className="mx-auto h-8 w-8 text-slate-400" />
                  <p className="mt-2 text-sm font-bold text-slate-700">Aucun fichier disponible pour cette commande.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

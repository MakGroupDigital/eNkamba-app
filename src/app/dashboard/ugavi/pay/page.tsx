'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UnifiedPaymentFlow } from '@/components/payment/UnifiedPaymentFlow';
import { useAuth } from '@/hooks/useAuth';
import { arrayUnion, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { buildUgaviStatusEntry } from '@/lib/ugavi-requests';

type UgaviPaymentPayload = {
  amount: number;
  description?: string;
  metadata?: {
    requestDraftId?: string;
    senderAddress?: string;
    receiverAddress?: string;
    serviceMode?: string;
    packageWeight?: number | string;
    selectedCourier?: {
      name?: string;
    };
  };
};

export default function UgaviPayPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [paymentPayload, setPaymentPayload] = useState<UgaviPaymentPayload | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = sessionStorage.getItem('ugavi_payment_data');
    if (!raw) return;

    try {
      setPaymentPayload(JSON.parse(raw) as UgaviPaymentPayload);
    } catch (error) {
      console.error('Erreur lecture paiement Ugavi:', error);
    }
  }, []);

  const ugvTrackingNumber = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const destination = (paymentPayload?.metadata?.receiverAddress || 'DST').slice(0, 3).toUpperCase().replace(/[^A-Z]/g, '') || 'DST';
    const origin = (paymentPayload?.metadata?.senderAddress || 'KIN').slice(0, 3).toUpperCase().replace(/[^A-Z]/g, '') || 'KIN';
    const serial = `${Date.now()}`.slice(-5);
    return `UGV-${year}-${origin}-${destination}-${serial}`;
  }, [paymentPayload]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-white to-cyan-50">
      <div className="container mx-auto max-w-2xl space-y-6 p-4">
        <header className="flex items-center gap-4 pt-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/ugavi">
              <ArrowLeft />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-primary">Paiement Logistique</h1>
            <p className="text-sm text-muted-foreground">Règlement sécurisé pour les services Ugavi</p>
          </div>
        </header>

        <UnifiedPaymentFlow
          context="ugavi"
          customLabel="Payer Ugavi"
          initialAmount={paymentPayload?.amount}
          initialDescription={paymentPayload?.description}
          initialMetadata={paymentPayload?.metadata}
          onSuccess={async (transactionId) => {
            const requestDraftId = paymentPayload?.metadata?.requestDraftId;

            if (requestDraftId) {
              try {
                const actorName = user.displayName || user.email || 'Client';
                const timelineEntries = [
                  buildUgaviStatusEntry('payment_confirmed', actorName, 'Kenz Pay', 'Paiement confirme'),
                  buildUgaviStatusEntry('registered', actorName, paymentPayload?.metadata?.senderAddress || 'Point de depart'),
                ];

                if (paymentPayload?.metadata?.selectedCourier?.name) {
                  timelineEntries.push(
                    buildUgaviStatusEntry(
                      'assigned',
                      paymentPayload.metadata.selectedCourier.name,
                      paymentPayload.metadata.selectedCourier.name
                    )
                  );
                }

                await updateDoc(doc(db, 'ugaviRequests', requestDraftId), {
                  status: 'paid',
                  paymentStatus: 'completed',
                  logisticsStatus: paymentPayload?.metadata?.selectedCourier?.name ? 'assigned' : 'registered',
                  transactionId,
                  trackingNumber: ugvTrackingNumber,
                  statusHistory: arrayUnion(...timelineEntries),
                  updatedAt: serverTimestamp(),
                  paidAt: serverTimestamp(),
                });
              } catch (error) {
                console.error('Erreur finalisation demande Ugavi:', error);
              }
            }

            if (typeof window !== 'undefined') {
              sessionStorage.removeItem('ugavi_payment_data');
              sessionStorage.removeItem('ugavi_service_prefill');
            }

            router.push(`/dashboard/ugavi/tracking?tracking=${encodeURIComponent(ugvTrackingNumber)}`);
          }}
          onError={(error) => {
            console.error('Erreur de paiement Ugavi:', error);
          }}
          onBack={() => router.push('/dashboard/ugavi')}
        />
      </div>
    </div>
  );
}

'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

function PaymentReturnContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [state, setState] = useState<'loading' | 'completed' | 'failed' | 'pending'>('loading');

  const status = params?.get('status') || '';
  const userId = params?.get('userId') || '';
  const transactionId = params?.get('transactionId') || '';
  const brand = params?.get('brand') === 'maxicash' ? 'maxicash' : 'enkambapay';
  const displayName = brand === 'maxicash' ? 'MaxiCash' : 'eNkambaPay';

  useEffect(() => {
    const finalize = async () => {
      if (!userId || !transactionId) {
        setState('failed');
        return;
      }

      try {
        const query = new URLSearchParams();
        params?.forEach((value, key) => query.set(key, value));
        query.set('userId', userId);
        query.set('transactionId', transactionId);
        query.set('status', status);

        const response = await fetch(`/api/wallet/maxicash/notify?${query.toString()}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || `Validation ${displayName} impossible`);
        setState(data.transactionStatus === 'completed' ? 'completed' : data.transactionStatus === 'failed' ? 'failed' : 'pending');
      } catch {
        setState('failed');
      }
    };

    finalize();
  }, [displayName, params, status, transactionId, userId]);

  const icon =
    state === 'loading' ? <Loader2 className="h-14 w-14 animate-spin text-[#009058]" /> :
    state === 'completed' ? <CheckCircle2 className="h-14 w-14 text-[#009058]" /> :
    <AlertCircle className="h-14 w-14 text-red-600" />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-[#009058]/5 to-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="space-y-6 p-6 text-center">
          <div className="flex items-center justify-center gap-2">
            {brand === 'enkambapay' && <Image src="/enkamba-logo.png" alt="" width={34} height={34} className="h-9 w-9 object-contain" />}
            <span className="text-lg font-semibold text-[#009058]">{displayName}</span>
          </div>
          <div className="flex justify-center">{icon}</div>
          <div>
            <h1 className="text-2xl font-bold">
              {state === 'loading' ? `Validation ${displayName}` : state === 'completed' ? 'Dépôt confirmé' : 'Dépôt non confirmé'}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {state === 'loading'
                ? `Nous confirmons votre paiement ${displayName}.`
                : state === 'completed'
                  ? 'Votre portefeuille a été crédité.'
                  : 'Le paiement a été annulé, refusé ou reste non confirmé.'}
            </p>
          </div>
          <Button className="w-full bg-[#009058] hover:bg-[#009058]" onClick={() => router.push('/dashboard/wallet')}>
            Retour au portefeuille
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center"><Loader2 className="h-8 w-8 animate-spin text-[#009058]" /></div>}>
      <PaymentReturnContent />
    </Suspense>
  );
}

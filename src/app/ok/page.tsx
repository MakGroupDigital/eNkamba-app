'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Home, Loader2 } from 'lucide-react';

// ENK-007: returning from PayPal proves nothing about the payment. This page never credits the wallet;
// a deposit is credited only after the provider confirms it server-side and an entry is recorded.
function PaymentReturnContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const amountUsd = Number(searchParams?.get('amount') || 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#073B9A]/5 to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <Clock className="w-16 h-16 text-[#073B9A]" />
            <h2 className="text-2xl font-bold text-[#073B9A]">Paiement en vérification</h2>
            <p className="text-sm text-muted-foreground">
              Votre retour de PayPal a bien été reçu. Votre solde sera crédité uniquement après la confirmation du paiement par PayPal.
            </p>
            {amountUsd > 0 && (
              <div className="w-full rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="mb-1 text-sm text-muted-foreground">Montant annoncé</p>
                <p className="text-xl font-bold text-blue-600">{amountUsd.toLocaleString('fr-FR')} USD</p>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Suivez le statut dans l&apos;historique de votre portefeuille. Contactez le support si le paiement n&apos;apparaît pas sous 24 h.
            </p>
            <Button onClick={() => router.push('/dashboard/history')} className="mt-4 w-full bg-[#073B9A] hover:bg-[#073B9A]">
              Voir mon historique
            </Button>
            <Button variant="ghost" onClick={() => router.push('/dashboard')} className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Retour à l&apos;accueil
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-background via-[#073B9A]/5 to-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="w-16 h-16 text-[#073B9A] animate-spin" />
              <h2 className="text-xl font-semibold">Chargement...</h2>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <PaymentReturnContent />
    </Suspense>
  );
}

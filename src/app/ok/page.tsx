'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Loader2, Home } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { doc, updateDoc, increment, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { convertUsdToCdf } from '@/lib/exchange-rate';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [amountCdf, setAmountCdf] = useState<number>(0);
  const [exchangeRate, setExchangeRate] = useState<number>(0);

  useEffect(() => {
    const processPayment = async () => {
      if (!user) {
        setError('Utilisateur non authentifié');
        setIsProcessing(false);
        return;
      }

      try {
        // Récupérer les paramètres de l'URL
        const amountUsd = searchParams?.get('amount');
        const userId = searchParams?.get('userId');
        const paymentId = searchParams?.get('paymentId') || `PAYPAL_${Date.now()}`;

        if (!amountUsd || !userId || userId !== user.uid) {
          setError('Paramètres de paiement invalides');
          setIsProcessing(false);
          return;
        }

        const amountUsdNumber = parseFloat(amountUsd);

        if (isNaN(amountUsdNumber) || amountUsdNumber <= 0) {
          setError('Montant invalide');
          setIsProcessing(false);
          return;
        }

        // Convertir USD en CDF
        const { cdfAmount, rate } = await convertUsdToCdf(amountUsdNumber);
        setAmountCdf(cdfAmount);
        setExchangeRate(rate);

        // Récupérer le solde actuel
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        const currentBalance = userSnap.exists() ? (userSnap.data()?.walletBalance || 0) : 0;
        const newBalance = currentBalance + cdfAmount;

        // Mettre à jour le solde de l'utilisateur
        await updateDoc(userRef, {
          walletBalance: increment(cdfAmount),
          updatedAt: serverTimestamp(),
        });

        // Créer une transaction avec ID unique
        const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const transactionRef = doc(db, 'users', user.uid, 'transactions', transactionId);
        
        await setDoc(transactionRef, {
          type: 'deposit',
          amount: cdfAmount,
          status: 'completed',
          description: `Dépôt PayPal (${amountUsdNumber} USD)`,
          paymentMethod: 'paypal',
          paymentId,
          previousBalance: currentBalance,
          newBalance: newBalance,
          timestamp: serverTimestamp(),
          createdAt: new Date().toISOString(),
          metadata: {
            amountUsd: amountUsdNumber,
            exchangeRate: rate,
            currency: 'USD',
          },
        });

        setIsProcessing(false);
      } catch (err: any) {
        console.error('Erreur traitement paiement:', err);
        setError(err.message || 'Erreur lors du traitement du paiement');
        setIsProcessing(false);
      }
    };

    processPayment();
  }, [user, searchParams]);

  const handleGoHome = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#073B9A]/5 to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          {isProcessing ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="w-16 h-16 text-[#073B9A] animate-spin" />
              <h2 className="text-xl font-semibold">Traitement du paiement...</h2>
              <p className="text-sm text-muted-foreground text-center">
                Conversion USD → CDF en cours...
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-3xl">❌</span>
              </div>
              <h2 className="text-xl font-semibold text-red-600">Erreur de paiement</h2>
              <p className="text-sm text-muted-foreground text-center">{error}</p>
              <Button
                onClick={handleGoHome}
                className="mt-4 bg-[#073B9A] hover:bg-[#073B9A]"
              >
                <Home className="w-4 h-4 mr-2" />
                Retour à l'accueil
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-8">
              <CheckCircle className="w-16 h-16 text-[#073B9A]" />
              <h2 className="text-2xl font-bold text-[#073B9A]">Paiement réussi!</h2>
              <p className="text-sm text-muted-foreground text-center">
                Votre paiement PayPal a été traité avec succès.
              </p>
              
              <div className="w-full space-y-3 mt-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-center text-muted-foreground mb-1">
                    Montant payé (USD)
                  </p>
                  <p className="text-xl font-bold text-center text-blue-600">
                    ${searchParams?.get('amount')} USD
                  </p>
                </div>

                <div className="bg-[#073B9A]/10 border border-[#073B9A]/30 rounded-lg p-4">
                  <p className="text-sm text-center text-muted-foreground mb-1">
                    Montant ajouté (CDF)
                  </p>
                  <p className="text-2xl font-bold text-center text-[#073B9A]">
                    {amountCdf.toLocaleString('fr-FR')} CDF
                  </p>
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Taux: 1 USD = {exchangeRate.toLocaleString('fr-FR')} CDF
                  </p>
                </div>
              </div>

              <Button
                onClick={handleGoHome}
                className="mt-4 w-full bg-[#073B9A] hover:bg-[#073B9A]"
              >
                <Home className="w-4 h-4 mr-2" />
                Retour à l'accueil
              </Button>
            </div>
          )}
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
      <PaymentSuccessContent />
    </Suspense>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useWalletTransactions } from '@/hooks/useWalletTransactions';
import { ArrowLeft, Smartphone, CheckCircle2, AlertCircle, Loader2, Phone } from 'lucide-react';
import Link from 'next/link';

const ESIM_PRICE = 1000; // CDF

export default function ESIMPurchasePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { balance } = useWalletTransactions();
  
  const [step, setStep] = useState<'info' | 'confirm' | 'processing' | 'success'>('info');
  const [selectedNumber, setSelectedNumber] = useState<string>('');
  const [availableNumbers, setAvailableNumbers] = useState<string[]>([]);
  const [isLoadingNumbers, setIsLoadingNumbers] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchasedESIM, setPurchasedESIM] = useState<any>(null);

  // Charger les numéros disponibles
  useEffect(() => {
    loadAvailableNumbers();
  }, []);

  const loadAvailableNumbers = async () => {
    setIsLoadingNumbers(true);
    try {
      const response = await fetch('/api/esim/available-numbers');
      if (response.ok) {
        const data = await response.json();
        setAvailableNumbers(data.numbers || []);
      }
    } catch (error) {
      console.error('Erreur chargement numéros:', error);
    } finally {
      setIsLoadingNumbers(false);
    }
  };

  const handlePurchase = async () => {
    if (!user || !selectedNumber) return;

    if (balance < ESIM_PRICE) {
      toast({
        variant: 'destructive',
        title: 'Solde insuffisant',
        description: `Vous avez besoin de ${ESIM_PRICE.toLocaleString('fr-FR')} CDF pour acheter un eSIM`,
      });
      return;
    }

    setIsPurchasing(true);
    setStep('processing');

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/esim/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.uid,
          phoneNumber: selectedNumber,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'achat');
      }

      const data = await response.json();
      setPurchasedESIM(data.esim);
      setStep('success');

      toast({
        title: 'eSIM activé !',
        description: `Votre numéro ${selectedNumber} est maintenant actif`,
        className: 'bg-green-600 text-white border-none',
      });
    } catch (error: any) {
      setStep('confirm');
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Erreur lors de l\'achat de l\'eSIM',
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#32BB78]/5 to-background">
      <div className="container mx-auto max-w-2xl p-4 space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <header className="flex items-center gap-4 pt-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/partner-services">
              <ArrowLeft />
            </Link>
          </Button>
          <div>
            <h1 className="font-headline text-3xl font-bold bg-gradient-to-r from-[#32BB78] to-[#2a9d63] bg-clip-text text-transparent">
              eSIM-eNkamba
            </h1>
            <p className="text-sm text-muted-foreground">Numéro virtuel RDC</p>
          </div>
        </header>

        {/* Info Step */}
        {step === 'info' && (
          <div className="space-y-6">
            {/* Features Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-primary" />
                  Qu'est-ce qu'un eSIM-eNkamba ?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Un numéro de téléphone virtuel congolais (+243 07...) qui vous permet de recevoir des appels et SMS sans carte SIM physique.
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">Activation instantanée</p>
                      <p className="text-xs text-muted-foreground">Votre numéro est actif immédiatement après l'achat</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">Numéro RDC authentique</p>
                      <p className="text-xs text-muted-foreground">Format: +243 07XX XXX XXX (10 chiffres)</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">Gestion complète</p>
                      <p className="text-xs text-muted-foreground">Consultez l'historique, rechargez et gérez votre eSIM</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">Prix unique</p>
                      <p className="text-xs text-muted-foreground">Seulement {ESIM_PRICE.toLocaleString('fr-FR')} CDF</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Available Numbers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-primary" />
                    Choisissez votre numéro
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadAvailableNumbers}
                    disabled={isLoadingNumbers}
                  >
                    {isLoadingNumbers ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Actualiser'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingNumbers ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : availableNumbers.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucun numéro disponible pour le moment</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadAvailableNumbers}
                      className="mt-4"
                    >
                      Réessayer
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {availableNumbers.map((number) => (
                      <button
                        key={number}
                        onClick={() => setSelectedNumber(number)}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          selectedNumber === number
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-lg font-semibold">{number}</span>
                          {selectedNumber === number && (
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Balance Check */}
            <Card className={balance < ESIM_PRICE ? 'border-red-200' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Votre solde</p>
                    <p className="text-2xl font-bold">{balance.toLocaleString('fr-FR')} CDF</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Prix eSIM</p>
                    <p className="text-2xl font-bold text-primary">{ESIM_PRICE.toLocaleString('fr-FR')} CDF</p>
                  </div>
                </div>
                {balance < ESIM_PRICE && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Solde insuffisant. Veuillez recharger votre portefeuille.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 w-full"
                      onClick={() => router.push('/dashboard/add-funds')}
                    >
                      Recharger mon portefeuille
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Button */}
            <Button
              className="w-full"
              size="lg"
              onClick={() => setStep('confirm')}
              disabled={!selectedNumber || balance < ESIM_PRICE}
            >
              Continuer
            </Button>
          </div>
        )}

        {/* Confirm Step */}
        {step === 'confirm' && (
          <Card>
            <CardHeader>
              <CardTitle>Confirmer l'achat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-lg bg-muted space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Numéro choisi:</span>
                  <span className="font-mono font-bold">{selectedNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Prix:</span>
                  <span className="font-bold">{ESIM_PRICE.toLocaleString('fr-FR')} CDF</span>
                </div>
                <div className="flex justify-between pt-3 border-t">
                  <span className="text-sm font-semibold">Nouveau solde:</span>
                  <span className="font-bold text-primary">
                    {(balance - ESIM_PRICE).toLocaleString('fr-FR')} CDF
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep('info')}
                  disabled={isPurchasing}
                >
                  Retour
                </Button>
                <Button
                  className="flex-1"
                  onClick={handlePurchase}
                  disabled={isPurchasing}
                >
                  {isPurchasing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    'Confirmer l\'achat'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Processing Step */}
        {step === 'processing' && (
          <Card>
            <CardContent className="p-12 text-center">
              <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Activation en cours...</h3>
              <p className="text-muted-foreground">
                Veuillez patienter pendant l'activation de votre eSIM
              </p>
            </CardContent>
          </Card>
        )}

        {/* Success Step */}
        {step === 'success' && purchasedESIM && (
          <div className="space-y-6">
            <Card className="border-green-200">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold mb-2">eSIM activé avec succès !</h3>
                <p className="text-muted-foreground mb-6">
                  Votre numéro est maintenant actif et prêt à l'emploi
                </p>
                
                <div className="p-4 rounded-lg bg-green-50 border border-green-200 mb-6">
                  <p className="text-sm text-muted-foreground mb-1">Votre numéro eSIM</p>
                  <p className="text-3xl font-mono font-bold text-green-700">
                    {purchasedESIM.phoneNumber}
                  </p>
                </div>

                <div className="space-y-2 text-sm text-left">
                  <div className="flex justify-between p-2 rounded bg-muted">
                    <span className="text-muted-foreground">ID eSIM:</span>
                    <span className="font-mono">{purchasedESIM.id}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-muted">
                    <span className="text-muted-foreground">Statut:</span>
                    <Badge className="bg-green-100 text-green-700">Actif</Badge>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-muted">
                    <span className="text-muted-foreground">Date d'activation:</span>
                    <span>{new Date(purchasedESIM.activatedAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => router.push('/dashboard/esim/manage')}
              >
                Gérer mon eSIM
              </Button>
              <Button
                className="flex-1"
                onClick={() => router.push('/dashboard/partner-services')}
              >
                Retour aux services
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, CreditCard, Loader2, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWalletTransactions } from '@/hooks/useWalletTransactions';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

type PaymentMethod = 'maxicash' | 'wonyapay' | 'paypal';

export default function AddFundsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { addFunds, isLoading } = useWalletTransactions();

  const [step, setStep] = useState<'method' | 'details' | 'confirm'>('method');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [wonyaDetails, setWonyaDetails] = useState({
    currency: 'CDF' as 'CDF' | 'USD',
    motif: '',
  });
  const [usdToCdfRate, setUsdToCdfRate] = useState<number>(2800);
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const numericAmount = Number(amount || 0);
  const usesUsdRate =
    paymentMethod === 'paypal' ||
    paymentMethod === 'maxicash' ||
    (paymentMethod === 'wonyapay' && wonyaDetails.currency === 'USD');

  useEffect(() => {
    if (!usesUsdRate) return;

    const loadExchangeRate = async () => {
      setIsLoadingRate(true);
      try {
        const { getUsdToCdfRate } = await import('@/lib/exchange-rate');
        setUsdToCdfRate(await getUsdToCdfRate());
      } catch (error) {
        console.error('Erreur chargement taux:', error);
      } finally {
        setIsLoadingRate(false);
      }
    };

    loadExchangeRate();
  }, [usesUsdRate]);

  const convertedAmount = useMemo(() => {
    if (!numericAmount || numericAmount <= 0) return 0;
    if (usesUsdRate) return Math.round(numericAmount * usdToCdfRate);
    return numericAmount;
  }, [numericAmount, usdToCdfRate, usesUsdRate]);

  const handleMethodSelect = (method: PaymentMethod) => {
    setPaymentMethod(method);
    setStep('details');
  };

  const validateDetails = () => {
    if (!paymentMethod) return 'Méthode de paiement manquante';
    if (!numericAmount || numericAmount <= 0) return 'Veuillez entrer un montant valide';
    if ((paymentMethod === 'maxicash' || paymentMethod === 'wonyapay') && !phoneNumber.trim()) {
      return 'Veuillez entrer un numéro de téléphone';
    }
    if (paymentMethod === 'maxicash' && !email.trim()) {
      return 'Veuillez entrer un email';
    }
    return null;
  };

  const handleDetailsSubmit = () => {
    const validationError = validateDetails();
    if (validationError) {
      toast({ variant: 'destructive', title: 'Erreur', description: validationError });
      return;
    }

    setStep('confirm');
  };

  const submitMaxiCashFormPost = () => {
    if (!user) throw new Error('Utilisateur non authentifié');

    setIsProcessing(true);
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/api/wallet/maxicash/form-post';
    form.style.display = 'none';

    const fields: Record<string, string> = {
      userId: user.uid,
      amount,
      telephone: phoneNumber.trim(),
      email: email.trim(),
    };

    Object.entries(fields).forEach(([name, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      input.value = value;
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  };

  const handleConfirm = async () => {
    if (!user || !paymentMethod) return;

    try {
      if (paymentMethod === 'maxicash') {
        submitMaxiCashFormPost();
        return;
      }

      if (paymentMethod === 'paypal') {
        const returnUrl = encodeURIComponent(`https://enkamba.io/ok?amount=${amount}&userId=${user.uid}`);
        const cancelUrl = encodeURIComponent('https://enkamba.io/cancel');
        window.open(`https://www.paypal.com/ncp/payment/D723Q3TM3HQRW?return=${returnUrl}&cancel_return=${cancelUrl}`, '_blank');
        toast({
          title: 'Redirection PayPal',
          description: 'Vous allez être redirigé vers PayPal pour finaliser le paiement.',
          className: 'bg-blue-600 text-white border-none',
        });
        return;
      }

      const result = await addFunds(numericAmount, 'wonyapay', {
        phoneNumber,
        wonyaDetails,
      });

      toast({
        title: result.transactionStatus === 'pending' ? 'Demande envoyée' : 'Succès',
        description:
          result.message ||
          (result.transactionStatus === 'pending'
            ? 'Votre dépôt Mobile Money est en attente de confirmation.'
            : 'Votre dépôt a été ajouté au portefeuille.'),
        className: result.transactionStatus === 'pending'
          ? 'bg-amber-600 text-white border-none'
          : 'bg-green-600 text-white border-none',
      });

      router.push('/dashboard/wallet');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Erreur lors de l’ajout de fonds',
      });
      setIsProcessing(false);
    }
  };

  if (!user) return null;

  const busy = isLoading || isProcessing;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#32BB78]/5 to-background">
      <div className="container mx-auto max-w-3xl space-y-6 p-4">
        <header className="flex items-center gap-4 pt-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/wallet">
              <ArrowLeft />
            </Link>
          </Button>
          <div>
            <h1 className="font-headline text-3xl font-bold text-[#0B6E4F]">Ajouter des fonds</h1>
            <p className="text-sm text-muted-foreground">Choisissez une méthode de dépôt.</p>
          </div>
        </header>

        {step === 'method' && (
          <div className="space-y-4">
            <Card
              className="cursor-pointer border-2 border-[#32BB78]/40 bg-[#32BB78]/5 transition-colors hover:border-[#0B6E4F]"
              onClick={() => handleMethodSelect('maxicash')}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#32BB78]/25 bg-white">
                    <Image src="/enkamba-logo.png" alt="eNkambaPay" width={56} height={56} className="h-14 w-14 max-w-none object-cover" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-[#0B6E4F]">eNkambaPay</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Paiement sécurisé : carte, Mobile Money, PayPal, Mobile Banking et portefeuille partenaire.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card className="cursor-pointer border-2 transition-colors hover:border-[#0B6E4F]" onClick={() => handleMethodSelect('wonyapay')}>
                <CardContent className="space-y-4 p-5 text-center">
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      ['/logoairtel.png', 'Airtel Money'],
                      ['/logompsa.png', 'M-Pesa'],
                      ['/logo-orange.png', 'Orange Money'],
                      ['/logoafricell.png', 'Africell Money'],
                    ].map(([src, alt]) => (
                      <div key={alt} className="flex min-h-12 items-center justify-center rounded-lg border bg-background px-2">
                        <Image src={src} alt={alt} width={72} height={36} className="h-7 w-auto object-contain" />
                      </div>
                    ))}
                  </div>
                  <div>
                    <h3 className="font-semibold">Mobile Money direct</h3>
                    <p className="text-sm text-muted-foreground">Dépôt opérateur via le connecteur existant.</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer border-2 transition-colors hover:border-[#0070BA]" onClick={() => handleMethodSelect('paypal')}>
                <CardContent className="flex h-full flex-col items-center justify-center gap-4 p-5 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#0070BA]/10 text-[#0070BA]">
                    <CreditCard className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="font-semibold">PayPal</h3>
                    <p className="text-sm text-muted-foreground">Paiement USD via PayPal et cartes compatibles.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {step === 'details' && (
          <Card>
            <CardHeader>
              <CardTitle>
                {paymentMethod === 'maxicash'
                  ? 'Dépôt eNkambaPay'
                  : paymentMethod === 'wonyapay'
                    ? 'Dépôt Mobile Money direct'
                    : 'Paiement PayPal'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {paymentMethod === 'maxicash' && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Montant à payer (USD)</Label>
                      <Input type="number" min="1" placeholder="Ex: 10" value={amount} onChange={(event) => setAmount(event.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Crédit portefeuille estimé</Label>
                      <div className="rounded-md border bg-muted/40 px-3 py-2">
                        <p className="text-lg font-bold text-[#32BB78]">
                          {isLoadingRate ? 'Calcul...' : `${convertedAmount.toLocaleString('fr-FR')} CDF`}
                        </p>
                        <p className="text-xs text-muted-foreground">Taux: 1 USD = {usdToCdfRate.toLocaleString('fr-FR')} CDF</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Phone className="h-4 w-4" />Téléphone</Label>
                    <Input type="tel" placeholder="Ex: 0997654321" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Mail className="h-4 w-4" />Email</Label>
                    <Input type="email" placeholder="client@exemple.com" value={email} onChange={(event) => setEmail(event.target.value)} />
                  </div>

                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    Le paiement sécurisé s’ouvrira en plein écran pour finaliser votre dépôt eNkambaPay.
                  </div>
                </>
              )}

              {paymentMethod === 'wonyapay' && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Devise</Label>
                      <select
                        className="w-full rounded-md border bg-background p-2"
                        value={wonyaDetails.currency}
                        onChange={(event) => setWonyaDetails({ ...wonyaDetails, currency: event.target.value as 'CDF' | 'USD' })}
                      >
                        <option value="CDF">Franc Congolais (CDF)</option>
                        <option value="USD">Dollar Américain (USD)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Montant ({wonyaDetails.currency})</Label>
                      <Input type="number" value={amount} onChange={(event) => setAmount(event.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Numéro Mobile Money</Label>
                    <Input type="tel" placeholder="0997654321" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} />
                  </div>
                </>
              )}

              {paymentMethod === 'paypal' && (
                <div className="space-y-2">
                  <Label>Montant (USD)</Label>
                  <Input type="number" placeholder="Ex: 10" value={amount} onChange={(event) => setAmount(event.target.value)} />
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep('method')} className="flex-1">
                  Retour
                </Button>
                <Button onClick={handleDetailsSubmit} className="flex-1 bg-[#32BB78] hover:bg-[#2a9d63]">
                  Continuer
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'confirm' && (
          <Card>
            <CardHeader>
              <CardTitle>Confirmer le dépôt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3 rounded-lg bg-muted p-4">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Méthode</span>
                  <span className="text-right font-semibold">
                    {paymentMethod === 'maxicash' ? 'eNkambaPay' : paymentMethod === 'wonyapay' ? 'Mobile Money direct' : 'PayPal'}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Montant payé</span>
                  <span className="text-right font-bold">
                    {paymentMethod === 'wonyapay'
                      ? `${numericAmount.toLocaleString('fr-FR')} ${wonyaDetails.currency}`
                      : `${numericAmount.toLocaleString('en-US')} USD`}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Crédit portefeuille</span>
                  <span className="text-right font-bold text-[#32BB78]">{convertedAmount.toLocaleString('fr-FR')} CDF</span>
                </div>
                {phoneNumber && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Téléphone</span>
                    <span className="text-right font-semibold">{phoneNumber}</span>
                  </div>
                )}
                {email && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Email</span>
                    <span className="max-w-[220px] break-all text-right font-semibold">{email}</span>
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>
                    {paymentMethod === 'maxicash'
                      ? 'Le paiement sera ouvert dans un environnement sécurisé eNkambaPay.'
                      : paymentMethod === 'wonyapay'
                        ? 'Le dépôt sera initié et confirmé par l’opérateur Mobile Money.'
                        : 'Vous serez redirigé vers PayPal pour finaliser le paiement.'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep('details')} className="flex-1" disabled={busy}>
                  Retour
                </Button>
                <Button onClick={handleConfirm} className="flex-1 bg-[#32BB78] hover:bg-[#2a9d63]" disabled={busy}>
                  {busy ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Traitement...
                    </>
                  ) : paymentMethod === 'maxicash' ? (
                    'Continuer'
                  ) : (
                    'Confirmer'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

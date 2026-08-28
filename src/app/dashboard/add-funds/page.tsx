'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, CreditCard, Loader2, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWalletTransactions } from '@/hooks/useWalletTransactions';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

type PaymentMethod = 'enkambapay' | 'wonyapay' | 'paypal';
type EnkambaPayPartner = 'maxicash' | 'airtel' | 'mpesa' | 'orange' | 'africell';
type EnkambaPayCurrency = 'USD' | 'CDF';
type PaymentError = { title: string; message: string; details?: string };

const KENZ_PAY_PARTNERS: Array<{ id: EnkambaPayPartner; label: string; logo?: string; payType: number }> = [
  { id: 'airtel', label: 'Airtel Money', logo: '/logoairtel.png', payType: 1 },
  { id: 'mpesa', label: 'M-Pesa', logo: '/logompsa.png', payType: 2 },
  { id: 'orange', label: 'Orange Money', logo: '/logo-orange.png', payType: 3 },
  // MaxiCash PaymentType enum: AfricellDRC = 52 (4 is MaxiCashCard)
  { id: 'africell', label: 'Africell Money', logo: '/logoafricell.png', payType: 52 },
  { id: 'maxicash', label: 'Portefeuille partenaire', payType: 0 },
];

function normalizeCdPhoneDigits(value: string) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('243')) return digits;
  if (digits.startsWith('0')) return `243${digits.slice(1)}`;
  // allow entering without country code (e.g. 81xxxxxxx)
  if (digits.length === 9 && ['80', '81', '82', '83', '84', '85', '89', '90', '91', '97', '98', '99'].includes(digits.slice(0, 2))) {
    return `243${digits}`;
  }
  return digits;
}

function guessPartnerFromPhone(phoneNumber: string): EnkambaPayPartner | null {
  const digits = normalizeCdPhoneDigits(phoneNumber);
  if (!digits.startsWith('243') || digits.length < 5) return null;

  const prefix = digits.slice(3, 5); // e.g. 81, 84...

  // DRC prefix assignments (heuristic). User can always change the selection.
  if (['81', '82', '83'].includes(prefix)) return 'mpesa';
  if (['84', '85'].includes(prefix)) return 'orange';
  if (['97', '98', '99'].includes(prefix)) return 'airtel';
  if (['90', '91'].includes(prefix)) return 'africell';

  return null;
}

export default function AddFundsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { addFunds, isLoading } = useWalletTransactions();

  const [step, setStep] = useState<'method' | 'details' | 'confirm'>('method');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [enkambaPayPartner, setEnkambaPayPartner] = useState<EnkambaPayPartner>('airtel');
  const [enkambaPayCurrency, setEnkambaPayCurrency] = useState<EnkambaPayCurrency>('USD');
  const [enkambaPayPartnerLocked, setEnkambaPayPartnerLocked] = useState(false);
  const [wonyaDetails, setWonyaDetails] = useState({
    currency: 'CDF' as 'CDF' | 'USD',
    motif: '',
  });
  const [usdToCdfRate, setUsdToCdfRate] = useState<number>(2800);
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<PaymentError | null>(null);

  const numericAmount = Number(amount || 0);
  const usesUsdRate =
    paymentMethod === 'paypal' ||
    (paymentMethod === 'enkambapay' && enkambaPayCurrency === 'USD') ||
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

  useEffect(() => {
    if (paymentMethod !== 'enkambapay') return;

    const suggestion = guessPartnerFromPhone(phoneNumber);
    if (!suggestion) return;

    if (!enkambaPayPartnerLocked) {
      setEnkambaPayPartner(suggestion);
    }
  }, [paymentMethod, phoneNumber, enkambaPayPartnerLocked]);

  const handleMethodSelect = (method: PaymentMethod) => {
    setPaymentError(null);
    setPaymentMethod(method);
    setStep('details');
  };

  const validateDetails = () => {
    if (!paymentMethod) return 'Méthode de paiement manquante';
    if (!numericAmount || numericAmount <= 0) return 'Veuillez entrer un montant valide';
    if ((paymentMethod === 'enkambapay' || paymentMethod === 'wonyapay') && !phoneNumber.trim()) {
      return 'Veuillez entrer un numéro de téléphone';
    }
    return null;
  };

  const handleDetailsSubmit = () => {
    const validationError = validateDetails();
    if (validationError) {
      setPaymentError({ title: 'Informations incomplètes', message: validationError });
      toast({ variant: 'destructive', title: 'Erreur', description: validationError });
      return;
    }

    setPaymentError(null);
    setStep('confirm');
  };

  const buildEnkambaPayError = (result: any): PaymentError => {
    const provider = result?.providerResponse || {};
    const message =
      provider.ResponseError ||
      provider.ResponseDesc ||
      result?.error ||
      'Le paiement Kenz Pay n’a pas pu être initié.';
    const details = [
      provider.ResponseStatus ? `Statut: ${provider.ResponseStatus}` : '',
      provider.ResponseData ? `Réponse: ${provider.ResponseData}` : '',
      result?.reference ? `Référence: ${result.reference}` : '',
    ].filter(Boolean).join(' · ');

    return { title: 'Paiement non initié', message, details: details || undefined };
  };

  const submitEnkambaPayDirectPayment = async () => {
    if (!user) throw new Error('Utilisateur non authentifié');

    setIsProcessing(true);
    const response = await fetch('/api/wallet/maxicash/direct-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.uid,
        amount: numericAmount,
        telephone: phoneNumber.trim(),
        partner: enkambaPayPartner,
        currency: enkambaPayCurrency,
      }),
    });
    const result = await response.json().catch(() => null);

    if (!response.ok || result?.success === false || result?.transactionStatus === 'failed') {
      const error = buildEnkambaPayError(result);
      setPaymentError(error);
      throw new Error(error.message);
    }

    toast({
      title: result.transactionStatus === 'completed' ? 'Dépôt confirmé' : 'Paiement initié',
      description:
        result.transactionStatus === 'completed'
          ? 'Votre portefeuille a été crédité.'
          : result.providerResponse?.ResponseDesc || result.providerResponse?.ResponseData || 'Confirmez le paiement sur votre téléphone. Le dépôt sera finalisé après confirmation.',
      className: result.transactionStatus === 'completed'
        ? 'bg-primary text-white border-none'
        : 'bg-[#F51B2B] text-white border-none',
    });

    router.push('/dashboard/wallet');
  };

  const handleConfirm = async () => {
    if (!user || !paymentMethod) return;

    try {
      setPaymentError(null);
      if (paymentMethod === 'enkambapay') {
        await submitEnkambaPayDirectPayment();
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
          ? 'bg-[#F51B2B] text-white border-none'
          : 'bg-primary text-white border-none',
      });

      router.push('/dashboard/wallet');
    } catch (error: any) {
      setPaymentError((current) => current || {
        title: 'Erreur de dépôt',
        message: error.message || 'Erreur lors de l’ajout de fonds',
      });
      setIsProcessing(false);
    }
  };

  if (!user) return null;

  const busy = isLoading || isProcessing;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#073B9A]/5 to-background">
      <div className="container mx-auto max-w-3xl space-y-6 p-4">
        <header className="flex items-center gap-4 pt-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/wallet">
              <ArrowLeft />
            </Link>
          </Button>
          <div>
            <h1 className="font-headline text-3xl font-bold text-[#073B9A]">Ajouter des fonds</h1>
          </div>
        </header>

        {paymentError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex gap-3 p-4 text-red-900">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="space-y-1">
                <p className="font-semibold">{paymentError.title}</p>
                <p className="text-sm">{paymentError.message}</p>
                {paymentError.details && <p className="text-xs text-red-700">{paymentError.details}</p>}
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'method' && (
          <div className="space-y-4">
            <Card
              className="cursor-pointer border-2 border-[#073B9A]/40 bg-[#073B9A]/5 transition-colors hover:border-[#073B9A]"
              onClick={() => handleMethodSelect('enkambapay')}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#073B9A]/25 bg-white">
                    <Image src="/kenz-logo.png" alt="Kenz Pay" width={56} height={56} className="h-14 w-14 max-w-none object-cover" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-[#073B9A]">Kenz Pay</h2>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card className="cursor-pointer border-2 transition-colors hover:border-[#073B9A]" onClick={() => handleMethodSelect('wonyapay')}>
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
                {paymentMethod === 'enkambapay'
                  ? 'Dépôt Kenz Pay'
                  : paymentMethod === 'wonyapay'
                    ? 'Dépôt Mobile Money direct'
                    : 'Paiement PayPal'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {paymentMethod === 'enkambapay' && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Devise</Label>
                      <Select value={enkambaPayCurrency} onValueChange={(value) => setEnkambaPayCurrency(value as EnkambaPayCurrency)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une devise" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="CDF">CDF</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Montant ({enkambaPayCurrency})</Label>
                      <Input
                        type="number"
                        min="1"
                        step={enkambaPayCurrency === 'USD' ? '0.01' : '1'}
                        placeholder={enkambaPayCurrency === 'USD' ? 'Ex: 10' : 'Ex: 10000'}
                        value={amount}
                        onChange={(event) => setAmount(event.target.value)}
                      />
                      {numericAmount > 0 && (
                        <p className="text-sm font-semibold text-[#073B9A]">
                          Crédit portefeuille: {isLoadingRate ? 'Calcul...' : `${convertedAmount.toLocaleString('fr-FR')} CDF`}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Phone className="h-4 w-4" />Numéro téléphone</Label>
                    <Input type="tel" placeholder="Ex: 243997654321" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label>Opérateur</Label>
                    <Select
                      value={enkambaPayPartner}
                      onValueChange={(value) => {
                        setEnkambaPayPartner(value as EnkambaPayPartner);
                        setEnkambaPayPartnerLocked(true);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un partenaire" />
                      </SelectTrigger>
                      <SelectContent>
                        {KENZ_PAY_PARTNERS.map((partner) => (
                          <SelectItem key={partner.id} value={partner.id}>
                            {partner.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                <Button onClick={handleDetailsSubmit} className="flex-1 bg-[#073B9A] hover:bg-[#073B9A]">
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
                    {paymentMethod === 'enkambapay'
                      ? 'Kenz Pay'
                      : paymentMethod === 'wonyapay'
                        ? 'Mobile Money direct'
                        : 'PayPal'}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Montant payé</span>
                  <span className="text-right font-bold">
                    {paymentMethod === 'wonyapay'
                      ? `${numericAmount.toLocaleString('fr-FR')} ${wonyaDetails.currency}`
                      : paymentMethod === 'enkambapay'
                        ? `${numericAmount.toLocaleString('fr-FR')} ${enkambaPayCurrency}`
                        : `${numericAmount.toLocaleString('en-US')} USD`}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Crédit portefeuille</span>
                  <span className="text-right font-bold text-[#073B9A]">{convertedAmount.toLocaleString('fr-FR')} CDF</span>
                </div>
                {phoneNumber && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Téléphone</span>
                    <span className="text-right font-semibold">{phoneNumber}</span>
                  </div>
                )}
                {paymentMethod === 'enkambapay' && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Opérateur</span>
                    <span className="text-right font-semibold">
                      {KENZ_PAY_PARTNERS.find((partner) => partner.id === enkambaPayPartner)?.label}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep('details')} className="flex-1" disabled={busy}>
                  Retour
                </Button>
                <Button onClick={handleConfirm} className="flex-1 bg-[#073B9A] hover:bg-[#073B9A]" disabled={busy}>
                  {busy ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Traitement...
                    </>
                  ) : paymentMethod === 'enkambapay' ? (
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

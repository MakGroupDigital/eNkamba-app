'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Banknote, Info, RefreshCw, ShieldCheck, TrendingUp, WalletCards } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PinVerification } from '@/components/payment/PinVerification';
import { auth, db } from '@/lib/firebase';
import { collection, doc, increment, onSnapshot, runTransaction, serverTimestamp } from 'firebase/firestore';

const currencies = ['CDF', 'USD', 'EUR', 'RMB', 'FCFA'] as const;
type Currency = typeof currencies[number];

const apiCurrencyMap: Record<Currency, string> = {
  CDF: 'CDF',
  USD: 'USD',
  EUR: 'EUR',
  RMB: 'CNY',
  FCFA: 'XAF',
};

type CurrencyWallets = Record<string, { balance?: number; currency?: string; updatedAt?: unknown }>;

function isCurrency(value: string): value is Currency {
  return currencies.includes(value as Currency);
}

const ConversionFlowIcon = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
    <rect x="8" y="10" width="32" height="28" rx="8" fill="#009058" />
    <path d="M17 20h14l-4-4M31 28H17l4 4" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="35" cy="13" r="4" fill="#FFA500" />
    <circle cx="13" cy="35" r="4" fill="#009058" />
  </svg>
);

const MarketRateIcon = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
    <rect x="9" y="12" width="30" height="26" rx="8" fill="#009058" />
    <path d="M16 30l6-7 5 4 6-9" stroke="#009058" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="16" cy="30" r="2.5" fill="white" />
    <circle cx="33" cy="18" r="3" fill="#FFA500" />
  </svg>
);

export default function ConversionPage() {
  const { toast } = useToast();
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [fromCurrency] = useState<Currency>('CDF');
  const [toCurrency, setToCurrency] = useState<Currency>('USD');
  const [rate, setRate] = useState<number | null>(null);
  const [baseRates, setBaseRates] = useState<Record<Currency, number> | null>(null);
  const [isLoadingRates, setIsLoadingRates] = useState(true);
  const [ratesError, setRatesError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [currencyWallets, setCurrencyWallets] = useState<CurrencyWallets>({});

  const destinationCurrencies = currencies.filter((currency) => currency !== 'CDF');

  const fetchLiveRates = async () => {
    setIsLoadingRates(true);
    setRatesError(null);
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/CDF');
      if (!response.ok) throw new Error('Taux indisponibles');
      const data = await response.json();
      if (!data?.rates?.USD || !data?.rates?.EUR || !data?.rates?.CNY || !data?.rates?.XAF) {
        throw new Error('Taux incomplets');
      }

      setBaseRates({
        CDF: 1,
        USD: Number(data.rates.USD),
        EUR: Number(data.rates.EUR),
        RMB: Number(data.rates.CNY),
        FCFA: Number(data.rates.XAF),
      });
      setLastUpdated(new Date().toLocaleString('fr-FR'));
    } catch (error) {
      console.error('Erreur récupération taux conversion:', error);
      setBaseRates(null);
      setRatesError("Les taux réels sont indisponibles pour le moment.");
    } finally {
      setIsLoadingRates(false);
    }
  };

  useEffect(() => {
    void fetchLiveRates();
  }, []);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    return onSnapshot(doc(db, 'users', currentUser.uid), (snapshot) => {
      const data = snapshot.data();
      setWalletBalance(Number(data?.walletBalance || 0));
      setCurrencyWallets((data?.currencyWallets || {}) as CurrencyWallets);
    });
  }, []);

  useEffect(() => {
    const calculateConversion = () => {
      if (!baseRates || fromCurrency === toCurrency) {
        setRate(null);
        setToAmount('');
        return;
      }

      const liveRate = baseRates[toCurrency] / baseRates[fromCurrency];
      setRate(liveRate);
      const amount = parseFloat(fromAmount);
      if (!isNaN(amount)) {
        setToAmount((amount * liveRate).toFixed(2));
      } else {
        setToAmount('');
      }
    };
    calculateConversion();
  }, [baseRates, fromAmount, fromCurrency, toCurrency]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
        setFromAmount(value);
    }
  }

  const handleToCurrencyChange = (value: string) => {
    if (isCurrency(value)) setToCurrency(value);
  };

  const executeConversion = async () => {
    const currentUser = auth.currentUser;
    const sourceAmount = Number(fromAmount);
    const targetAmount = Number(toAmount);
    if (!currentUser) {
      toast({ variant: 'destructive', title: 'Connexion requise', description: 'Connectez-vous avant de convertir.' });
      return;
    }
    if (!sourceAmount || !targetAmount || sourceAmount <= 0 || targetAmount <= 0 || fromCurrency === toCurrency) {
      toast({ variant: 'destructive', title: 'Conversion invalide', description: 'Vérifiez le montant et les devises.' });
      return;
    }

    setIsConverting(true);
    try {
      const serviceFee = Number((sourceAmount * 0.01).toFixed(2));
      const totalDebit = Number((sourceAmount + serviceFee).toFixed(2));
      const userRef = doc(db, 'users', currentUser.uid);
      const transactionRef = doc(collection(db, 'users', currentUser.uid, 'transactions'));

      await runTransaction(db, async (tx) => {
        const userSnap = await tx.get(userRef);
        if (!userSnap.exists()) throw new Error('missing-user');
        const data = userSnap.data();
        const currencyWallets = (data.currencyWallets || {}) as Record<string, { balance?: number }>;
        const sourceBalance = fromCurrency === 'CDF'
          ? Number(data.walletBalance || 0)
          : Number(currencyWallets[fromCurrency]?.balance || 0);

        if (sourceBalance < totalDebit) throw new Error('insufficient');

        const updates: Record<string, any> = {
          updatedAt: serverTimestamp(),
        };

        if (fromCurrency === 'CDF') {
          updates.walletBalance = increment(-totalDebit);
        } else {
          updates[`currencyWallets.${fromCurrency}.balance`] = increment(-totalDebit);
          updates[`currencyWallets.${fromCurrency}.updatedAt`] = serverTimestamp();
        }

        if (toCurrency === 'CDF') {
          updates.walletBalance = increment(targetAmount);
        } else {
          updates[`currencyWallets.${toCurrency}.balance`] = increment(targetAmount);
          updates[`currencyWallets.${toCurrency}.currency`] = toCurrency;
          updates[`currencyWallets.${toCurrency}.updatedAt`] = serverTimestamp();
        }

        tx.update(userRef, updates);
        tx.set(transactionRef, {
          type: 'currency_conversion',
          status: 'completed',
          amount: sourceAmount,
          currency: fromCurrency,
          targetAmount,
          targetCurrency: toCurrency,
          serviceFee,
          exchangeRate: rate,
          rateSource: 'exchange-rate-api',
          description: `Conversion ${sourceAmount} ${fromCurrency} vers ${targetAmount} ${toCurrency}`,
          previousBalance: sourceBalance,
          newBalance: sourceBalance - totalDebit,
          timestamp: serverTimestamp(),
          createdAt: new Date().toISOString(),
        });
      });

      setShowConfirmDialog(false);
      setFromAmount('');
      setToAmount('');
      toast({
        title: 'Conversion effectuée',
        description: `${targetAmount.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} ${toCurrency} ajoutés au mini portefeuille ${toCurrency}.`,
      });
    } catch (error: any) {
      const description = error?.message === 'insufficient'
        ? `Solde insuffisant dans le portefeuille ${fromCurrency}.`
        : 'La conversion n’a pas pu être finalisée.';
      toast({ variant: 'destructive', title: 'Conversion refusée', description });
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7faf8]">
    <div className="container mx-auto max-w-3xl p-3 space-y-4 animate-in fade-in duration-500 sm:p-4">
      <header className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#009058] to-[#009058] p-4 text-white shadow-lg shadow-[#009058]/20">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/16 ring-1 ring-white/25">
              <ConversionFlowIcon className="h-8 w-8" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/70">Marché des devises</p>
              <h1 className="font-headline text-xl font-black text-white sm:text-2xl">
                Bureau de change
              </h1>
              <p className="mt-1 max-w-xl text-xs leading-5 text-white/78 sm:text-sm">
                Convertissez le solde principal vers vos mini portefeuilles devises.
              </p>
            </div>
          </div>
          <Button
            type="button"
            onClick={() => void fetchLiveRates()}
            disabled={isLoadingRates}
            className="h-10 shrink-0 rounded-xl bg-white px-3 text-xs font-bold text-[#009058] hover:bg-white/90 sm:text-sm"
          >
            <RefreshCw className={`mr-1.5 h-4 w-4 ${isLoadingRates ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </header>
      
      <Card className="overflow-hidden border-[#009058]/10 bg-white shadow-sm">
        <CardHeader className="border-b border-[#009058]/10 px-4 py-3">
          <CardTitle className="font-headline flex items-center gap-2 text-lg text-[#009058]">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#009058]/10">
              <MarketRateIcon className="h-6 w-6" />
            </span>
            Bureau de change
          </CardTitle>
          <CardDescription>L’argent quitte le portefeuille principal et entre dans le portefeuille de la devise choisie.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          {ratesError && (
            <Alert variant="destructive" className="rounded-2xl">
              <Info className="h-4 w-4"/>
              <AlertTitle>Taux indisponibles</AlertTitle>
              <AlertDescription>{ratesError}</AlertDescription>
            </Alert>
          )}
          
          <div className="flex flex-col gap-2">
             <label className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Portefeuille principal à convertir</label>
            <div className="grid gap-2 sm:grid-cols-[1fr_130px]">
              <Input
                type="text"
                value={fromAmount}
                onChange={handleAmountChange}
                className="h-14 flex-1 rounded-xl border-[#009058]/20 bg-[#f7faf8] text-2xl font-black focus-visible:ring-[#009058]"
                placeholder="0.00"
              />
              <div className="flex h-14 items-center justify-center rounded-xl border border-[#009058]/20 bg-white px-3 font-black text-[#009058]">
                CDF
              </div>
            </div>
            <p className="text-xs font-semibold text-muted-foreground">Disponible : {walletBalance.toLocaleString('fr-FR')} CDF</p>
          </div>

          <div className="flex items-center justify-center my-4 gap-3">
             <div className="flex-1 border-t border-[#009058]/15"></div>
             <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#009058]/20 bg-white text-[#009058] shadow-sm">
                <Banknote className="h-5 w-5"/>
             </div>
             <div className="flex-1 border-t border-[#009058]/15"></div>
          </div>

           <div className="flex flex-col gap-2">
             <label className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Mini portefeuille à créditer</label>
            <div className="grid gap-2 sm:grid-cols-[1fr_130px]">
              <Input
                type="text"
                value={toAmount}
                readOnly
                className="h-14 flex-1 rounded-xl border-[#009058]/20 bg-[#009058]/5 text-2xl font-black text-[#009058]"
                placeholder="0.00"
              />
              <Select value={toCurrency} onValueChange={handleToCurrencyChange}>
                <SelectTrigger className="h-14 w-[120px] rounded-xl border-[#009058]/20 font-semibold">
                  <SelectValue placeholder="Devise" />
                </SelectTrigger>
                <SelectContent>
                  {destinationCurrencies.map((currency) => (
                    <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <p className="rounded-xl bg-[#f7faf8] px-3 py-2 text-xs font-semibold text-muted-foreground">
                Solde actuel {toCurrency} : <span className="font-black text-[#009058]">{Number(currencyWallets[toCurrency]?.balance || 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 })}</span>
              </p>
              <p className="rounded-xl bg-[#f7faf8] px-3 py-2 text-xs font-semibold text-muted-foreground">
                Après conversion : <span className="font-black text-[#009058]">{(Number(currencyWallets[toCurrency]?.balance || 0) + Number(toAmount || 0)).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} {toCurrency}</span>
              </p>
            </div>
          </div>

            {rate !== null && (
                <div className="rounded-2xl border border-[#009058]/10 bg-[#f7faf8] p-3 text-center text-sm font-medium text-[#009058]">
                    <TrendingUp className="mx-auto mb-1 h-4 w-4 text-[#009058]" />
                    Taux réel chargé : 1 {fromCurrency} = {rate.toFixed(6)} {toCurrency}
                    {lastUpdated && <p className="mt-1 text-[11px] text-muted-foreground">Actualisé le {lastUpdated}</p>}
                </div>
            )}

        </CardContent>
        <CardFooter className="flex-col gap-4 border-t border-[#009058]/10 px-4 py-3">
            <Button 
              size="lg" 
              className="h-11 w-full rounded-xl bg-[#009058] font-bold hover:bg-[#009058]"
              onClick={() => {
                if (!fromAmount || isNaN(parseFloat(fromAmount)) || parseFloat(fromAmount) <= 0) {
                  toast({
                    variant: "destructive",
                    title: "Erreur",
                    description: "Veuillez entrer un montant valide à convertir.",
                  });
                  return;
                }
                if (fromCurrency === toCurrency) {
                  toast({
                    variant: "destructive",
                    title: "Erreur",
                    description: "Veuillez sélectionner deux devises différentes.",
                  });
                  return;
                }
                setShowConfirmDialog(true);
              }}
              disabled={!fromAmount || !toAmount || fromCurrency === toCurrency || !baseRates || isLoadingRates}
            >
                Prévisualiser la conversion
            </Button>
            <Alert variant="default" className="rounded-2xl border-[#009058]/20 bg-[#009058]/5 text-xs">
                <ShieldCheck className="h-4 w-4 text-[#009058]"/>
                <AlertTitle className="text-xs font-semibold text-[#009058]">Information</AlertTitle>
                <AlertDescription>
                    Cette opération convertit le solde principal CDF vers le mini portefeuille de la devise choisie. Les frais de service de 1% sont débités du portefeuille principal.
                </AlertDescription>
            </Alert>
        </CardFooter>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#009058]">Prévisualisation du bureau de change</DialogTitle>
            <DialogDescription>
              Vérifiez le débit du portefeuille principal et le crédit du mini portefeuille devise.
            </DialogDescription>
          </DialogHeader>
          {rate !== null && (
            <div className="space-y-4 py-4">
              <div className="space-y-2 rounded-2xl bg-[#f7faf8] p-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Débit portefeuille principal :</span>
                  <span className="font-bold text-lg">{fromAmount} {fromCurrency}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Crédit mini portefeuille {toCurrency} :</span>
                  <span className="font-bold text-lg text-[#009058]">{toAmount} {toCurrency}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Taux de change :</span>
                  <span className="text-sm font-semibold">1 {fromCurrency} = {rate.toFixed(6)} {toCurrency}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Frais de service (1%) :</span>
                  <span className="text-sm font-semibold">≈ {((parseFloat(fromAmount) || 0) * 0.01).toFixed(2)} {fromCurrency}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={isConverting}>
              Annuler
            </Button>
            <Button 
              className="bg-[#009058] hover:bg-[#009058]"
              onClick={() => setShowPinDialog(true)}
              disabled={isConverting}
            >
              Confirmer la conversion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <PinVerification
        isOpen={showPinDialog}
        onClose={() => setShowPinDialog(false)}
        onSuccess={() => {
          setShowPinDialog(false);
          void executeConversion();
        }}
        purpose="payment"
        paymentDetails={{
          recipient: `Bureau de change ${toCurrency}`,
          amount: fromAmount,
          currency: fromCurrency,
        }}
      />
    </div>
    </div>
  );
}

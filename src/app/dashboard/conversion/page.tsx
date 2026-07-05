'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRightLeft, Info, RefreshCw, ShieldCheck, TrendingUp } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const currencies = ['CDF', 'USD', 'EUR'] as const;
type Currency = typeof currencies[number];

function isCurrency(value: string): value is Currency {
  return currencies.includes(value as Currency);
}

const ConversionFlowIcon = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
    <rect x="8" y="10" width="32" height="28" rx="8" fill="#479B67" />
    <path d="M17 20h14l-4-4M31 28H17l4 4" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="35" cy="13" r="4" fill="#FFB545" />
    <circle cx="13" cy="35" r="4" fill="#479B67" />
  </svg>
);

const MarketRateIcon = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
    <rect x="9" y="12" width="30" height="26" rx="8" fill="#479B67" />
    <path d="M16 30l6-7 5 4 6-9" stroke="#479B67" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="16" cy="30" r="2.5" fill="white" />
    <circle cx="33" cy="18" r="3" fill="#FFB545" />
  </svg>
);

export default function ConversionPage() {
  const { toast } = useToast();
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [fromCurrency, setFromCurrency] = useState<Currency>('CDF');
  const [toCurrency, setToCurrency] = useState<Currency>('USD');
  const [rate, setRate] = useState<number | null>(null);
  const [baseRates, setBaseRates] = useState<Record<Currency, number> | null>(null);
  const [isLoadingRates, setIsLoadingRates] = useState(true);
  const [ratesError, setRatesError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  const fetchLiveRates = async () => {
    setIsLoadingRates(true);
    setRatesError(null);
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/CDF');
      if (!response.ok) throw new Error('Taux indisponibles');
      const data = await response.json();
      if (!data?.rates?.USD || !data?.rates?.EUR) {
        throw new Error('Taux incomplets');
      }

      setBaseRates({
        CDF: 1,
        USD: Number(data.rates.USD),
        EUR: Number(data.rates.EUR),
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

  const handleSwapCurrencies = () => {
    const tempCurrency = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(tempCurrency);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
        setFromAmount(value);
    }
  }

  const handleFromCurrencyChange = (value: string) => {
    if (isCurrency(value)) setFromCurrency(value);
  };

  const handleToCurrencyChange = (value: string) => {
    if (isCurrency(value)) setToCurrency(value);
  };

  return (
    <div className="min-h-screen bg-[#f7faf8]">
    <div className="container mx-auto max-w-3xl p-3 space-y-4 animate-in fade-in duration-500 sm:p-4">
      <header className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#479B67] to-[#479B67] p-4 text-white shadow-lg shadow-[#479B67]/20">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/16 ring-1 ring-white/25">
              <ConversionFlowIcon className="h-8 w-8" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/70">Marché des devises</p>
              <h1 className="font-headline text-xl font-black text-white sm:text-2xl">
                Conversion de Devise
              </h1>
              <p className="mt-1 max-w-xl text-xs leading-5 text-white/78 sm:text-sm">
                Calculez vos conversions avec des taux réels chargés en direct.
              </p>
            </div>
          </div>
          <Button
            type="button"
            onClick={() => void fetchLiveRates()}
            disabled={isLoadingRates}
            className="h-10 shrink-0 rounded-xl bg-white px-3 text-xs font-bold text-[#479B67] hover:bg-white/90 sm:text-sm"
          >
            <RefreshCw className={`mr-1.5 h-4 w-4 ${isLoadingRates ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </header>
      
      <Card className="overflow-hidden border-[#479B67]/10 bg-white shadow-sm">
        <CardHeader className="border-b border-[#479B67]/10 px-4 py-3">
          <CardTitle className="font-headline flex items-center gap-2 text-lg text-[#479B67]">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#479B67]/10">
              <MarketRateIcon className="h-6 w-6" />
            </span>
            Convertisseur
          </CardTitle>
          <CardDescription>Effectuez vos conversions avec le dernier taux réel chargé.</CardDescription>
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
             <label className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Vous envoyez</label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={fromAmount}
                onChange={handleAmountChange}
                className="h-14 flex-1 rounded-xl border-[#479B67]/20 bg-[#f7faf8] text-2xl font-black focus-visible:ring-[#479B67]"
                placeholder="0.00"
              />
              <Select value={fromCurrency} onValueChange={handleFromCurrencyChange}>
                <SelectTrigger className="h-14 w-[120px] rounded-xl border-[#479B67]/20 font-semibold">
                  <SelectValue placeholder="Devise" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-center my-4">
             <div className="flex-1 border-t border-[#479B67]/15"></div>
             <Button variant="ghost" size="icon" onClick={handleSwapCurrencies} className="mx-2 rounded-full border border-[#479B67]/20 bg-white text-[#479B67] shadow-sm hover:bg-[#479B67]/5">
                <ArrowRightLeft className="h-5 w-5"/>
             </Button>
             <div className="flex-1 border-t border-[#479B67]/15"></div>
          </div>

           <div className="flex flex-col gap-2">
             <label className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Le bénéficiaire reçoit</label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={toAmount}
                readOnly
                className="h-14 flex-1 rounded-xl border-[#479B67]/20 bg-[#479B67]/5 text-2xl font-black text-[#479B67]"
                placeholder="0.00"
              />
              <Select value={toCurrency} onValueChange={handleToCurrencyChange}>
                <SelectTrigger className="h-14 w-[120px] rounded-xl border-[#479B67]/20 font-semibold">
                  <SelectValue placeholder="Devise" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

            {rate !== null && (
                <div className="rounded-2xl border border-[#479B67]/10 bg-[#f7faf8] p-3 text-center text-sm font-medium text-[#479B67]">
                    <TrendingUp className="mx-auto mb-1 h-4 w-4 text-[#479B67]" />
                    Taux réel chargé : 1 {fromCurrency} = {rate.toFixed(6)} {toCurrency}
                    {lastUpdated && <p className="mt-1 text-[11px] text-muted-foreground">Actualisé le {lastUpdated}</p>}
                </div>
            )}

        </CardContent>
        <CardFooter className="flex-col gap-4 border-t border-[#479B67]/10 px-4 py-3">
            <Button 
              size="lg" 
              className="h-11 w-full rounded-xl bg-[#479B67] font-bold hover:bg-[#479B67]"
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
            <Alert variant="default" className="rounded-2xl border-[#479B67]/20 bg-[#479B67]/5 text-xs">
                <ShieldCheck className="h-4 w-4 text-[#479B67]"/>
                <AlertTitle className="text-xs font-semibold text-[#479B67]">Information</AlertTitle>
                <AlertDescription>
                    Seuls les taux réels chargés depuis le service de change sont affichés. Les frais de service de 1% sont présentés séparément.
                </AlertDescription>
            </Alert>
        </CardFooter>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#479B67]">Prévisualisation de la conversion</DialogTitle>
            <DialogDescription>
              Vérifiez les détails calculés avec le taux réel actuellement chargé.
            </DialogDescription>
          </DialogHeader>
          {rate !== null && (
            <div className="space-y-4 py-4">
              <div className="space-y-2 rounded-2xl bg-[#f7faf8] p-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Vous convertissez :</span>
                  <span className="font-bold text-lg">{fromAmount} {fromCurrency}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Vous recevrez :</span>
                  <span className="font-bold text-lg text-[#479B67]">{toAmount} {toCurrency}</span>
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
              className="bg-[#479B67] hover:bg-[#479B67]"
              onClick={async () => {
                setIsConverting(true);
                setIsConverting(false);
                setShowConfirmDialog(false);
                
                toast({
                  title: "Conversion prévisualisée",
                  description: `Montant calculé: ${fromAmount} ${fromCurrency} ≈ ${toAmount} ${toCurrency}.`,
                });
              }}
              disabled={isConverting}
            >
              Fermer la prévisualisation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </div>
  );
}

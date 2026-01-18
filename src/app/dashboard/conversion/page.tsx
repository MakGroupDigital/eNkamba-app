'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CandlestickChart, ArrowRightLeft, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const exchangeRates: { [key: string]: { [key: string]: number } } = {
  USD: { EUR: 0.93, CDF: 2850.50 },
  EUR: { USD: 1.08, CDF: 3075.20 },
  CDF: { USD: 0.00035, EUR: 0.00032 },
};

export default function ConversionPage() {
  const { toast } = useToast();
  const [fromAmount, setFromAmount] = useState('100000');
  const [toAmount, setToAmount] = useState('');
  const [fromCurrency, setFromCurrency] = useState('CDF');
  const [toCurrency, setToCurrency] = useState('USD');
  const [rate, setRate] = useState<number | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    const calculateConversion = () => {
      const rate = exchangeRates[fromCurrency]?.[toCurrency];
      if (rate !== undefined) {
        setRate(rate);
        const amount = parseFloat(fromAmount);
        if (!isNaN(amount)) {
          setToAmount((amount * rate).toFixed(2));
        } else {
          setToAmount('');
        }
      } else {
        setRate(null);
        setToAmount('');
      }
    };
    calculateConversion();
  }, [fromAmount, fromCurrency, toCurrency]);

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

  return (
    <div className="container mx-auto max-w-2xl p-4 space-y-6 animate-in fade-in duration-500">
      <header className="flex items-center gap-2">
        <CandlestickChart className="h-6 w-6 text-primary" />
        <h1 className="font-headline text-xl font-bold text-primary">
          Conversion de Devise
        </h1>
      </header>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Convertisseur</CardTitle>
          <CardDescription>Effectuez vos conversions en un clin d'œil au taux du marché.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <div className="flex flex-col gap-2">
             <label className="text-sm font-medium">Vous envoyez</label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={fromAmount}
                onChange={handleAmountChange}
                className="h-14 text-2xl font-bold flex-1"
                placeholder="0.00"
              />
              <Select value={fromCurrency} onValueChange={setFromCurrency}>
                <SelectTrigger className="w-[120px] h-14 font-semibold">
                  <SelectValue placeholder="Devise" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CDF">CDF</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-center my-4">
             <div className="flex-1 border-t"></div>
             <Button variant="ghost" size="icon" onClick={handleSwapCurrencies} className="mx-2 rounded-full border">
                <ArrowRightLeft className="h-5 w-5 text-primary"/>
             </Button>
             <div className="flex-1 border-t"></div>
          </div>

           <div className="flex flex-col gap-2">
             <label className="text-sm font-medium">Le bénéficiaire reçoit</label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={toAmount}
                readOnly
                className="h-14 text-2xl font-bold flex-1 bg-muted"
                placeholder="0.00"
              />
              <Select value={toCurrency} onValueChange={setToCurrency}>
                <SelectTrigger className="w-[120px] h-14 font-semibold">
                  <SelectValue placeholder="Devise" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CDF">CDF</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

            {rate !== null && (
                <div className="text-center text-sm font-medium text-muted-foreground pt-4">
                    Taux de change : 1 {fromCurrency} = {rate.toFixed(4)} {toCurrency}
                </div>
            )}

        </CardContent>
        <CardFooter className="flex-col gap-4">
            <Button 
              size="lg" 
              className="w-full"
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
              disabled={!fromAmount || !toAmount || fromCurrency === toCurrency}
            >
                Convertir
            </Button>
            <Alert variant="default" className="text-xs">
                <Info className="h-4 w-4"/>
                <AlertTitle className="text-xs font-semibold">Information</AlertTitle>
                <AlertDescription>
                    Les taux de change sont fournis à titre indicatif et peuvent varier. Des frais de service de 1% seront appliqués.
                </AlertDescription>
            </Alert>
        </CardFooter>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la conversion</DialogTitle>
            <DialogDescription>
              Vérifiez les détails de votre conversion avant de confirmer.
            </DialogDescription>
          </DialogHeader>
          {rate !== null && (
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg bg-muted space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Vous convertissez :</span>
                  <span className="font-bold text-lg">{fromAmount} {fromCurrency}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Vous recevrez :</span>
                  <span className="font-bold text-lg text-primary">{toAmount} {toCurrency}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Taux de change :</span>
                  <span className="text-sm font-semibold">1 {fromCurrency} = {rate.toFixed(4)} {toCurrency}</span>
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
              onClick={async () => {
                setIsConverting(true);
                await new Promise(resolve => setTimeout(resolve, 2000));
                setIsConverting(false);
                setShowConfirmDialog(false);
                
                toast({
                  title: "Conversion réussie !",
                  description: `Vous avez converti ${fromAmount} ${fromCurrency} en ${toAmount} ${toCurrency}.`,
                });

                // Reset
                setFromAmount('100000');
                setToAmount('');
              }}
              disabled={isConverting}
            >
              {isConverting ? "Conversion en cours..." : "Confirmer la conversion"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

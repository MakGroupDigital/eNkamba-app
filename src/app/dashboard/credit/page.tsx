'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Landmark, Info, Percent, ArrowRight, Calculator, CheckCircle2, XCircle, TrendingUp, Clock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Currency = 'CDF' | 'USD' | 'EUR';

interface CreditOffer {
  id: string;
  name: string;
  maxAmount: number;
  currency: Currency;
  duration: number; // en jours
  interestRate: number; // pourcentage
  description: string;
}

const creditOffers: CreditOffer[] = [
  {
    id: 'express',
    name: 'Crédit Express',
    maxAmount: 625000, // CDF (~250 USD)
    currency: 'CDF',
    duration: 30,
    interestRate: 5,
    description: 'Pour vos besoins urgents. Remboursable en 30 jours.',
  },
  {
    id: 'project',
    name: 'Crédit Projet',
    maxAmount: 12500000, // CDF (~5000 USD)
    currency: 'CDF',
    duration: 180,
    interestRate: 3.5,
    description: 'Pour financer vos projets personnels ou professionnels.',
  },
];

export default function CreditPage() {
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('CDF');
  const [selectedOffer, setSelectedOffer] = useState<CreditOffer | null>(null);
  const [isEligible, setIsEligible] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [simulation, setSimulation] = useState<{
    totalAmount: number;
    monthlyPayment: number;
    totalInterest: number;
  } | null>(null);

  // Simulation d'historique de transactions
  const transactionVolume = 50000000; // CDF - Volume fictif des transactions utilisateur

  const checkEligibility = () => {
    if (!amount || isNaN(parseFloat(amount))) return;
    
    setIsChecking(true);
    const amountValue = parseFloat(amount);
    const amountInCDF = currency === 'CDF' ? amountValue : amountValue * (currency === 'USD' ? 2500 : 3000);
    
    // Simuler vérification éligibilité (80% du montant)
    setTimeout(() => {
      const requiredVolume = amountInCDF * 0.8;
      setIsEligible(transactionVolume >= requiredVolume);
      setIsChecking(false);
      
      if (transactionVolume >= requiredVolume && selectedOffer) {
        calculateSimulation(amountInCDF, selectedOffer);
      }
    }, 1500);
  };

  const calculateSimulation = (amountValue: number, offer: CreditOffer) => {
    const annualRate = offer.interestRate / 100;
    const monthlyRate = annualRate / 12;
    const numMonths = offer.duration / 30;
    
    const totalInterest = amountValue * (annualRate * (offer.duration / 365));
    const totalAmount = amountValue + totalInterest;
    const monthlyPayment = totalAmount / numMonths;
    
    setSimulation({
      totalAmount,
      monthlyPayment,
      totalInterest,
    });
  };

  const formatCurrency = (amount: number, currency: Currency) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleOfferSelect = (offer: CreditOffer) => {
    setSelectedOffer(offer);
    setCurrency(offer.currency);
    if (amount && isEligible !== false) {
      const amountValue = parseFloat(amount);
      const amountInCDF = offer.currency === 'CDF' ? amountValue : amountValue * (offer.currency === 'USD' ? 2500 : 3000);
      calculateSimulation(Math.min(amountInCDF, offer.maxAmount), offer);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl p-4 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex items-center gap-2">
        <Landmark className="h-6 w-6 text-primary" />
        <h1 className="font-headline text-xl font-bold text-primary">
          Crédit Mbongo.io
        </h1>
      </header>

      {/* Main Credit Request Card */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Demander un crédit</CardTitle>
          <CardDescription>Financez vos projets en quelques clics grâce à notre analyse intelligente.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Montant désiré</Label>
              <div className="flex gap-2">
                <Input
                  id="amount"
                  type="number"
                  placeholder="Ex: 625000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-12 text-lg flex-1"
                />
                <Select value={currency} onValueChange={(value) => setCurrency(value as Currency)}>
                  <SelectTrigger className="w-[100px] h-12 font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CDF">CDF</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {currency !== 'CDF' && amount && !isNaN(parseFloat(amount)) && (
                <p className="text-xs text-muted-foreground">
                  ≈ {formatCurrency(parseFloat(amount) * (currency === 'USD' ? 2500 : 3000), 'CDF')} CDF
                </p>
              )}
            </div>
            <Button 
              className="w-full" 
              size="lg"
              onClick={checkEligibility}
              disabled={!amount || isChecking}
            >
              {isChecking ? 'Vérification...' : 'Vérifier mon éligibilité'}
            </Button>

            {/* Eligibility Result */}
            {isEligible !== null && (
              <Alert variant={isEligible ? "default" : "destructive"} className={cn(
                "animate-in fade-in-up",
                isEligible && "border-green-200 bg-green-50 dark:bg-green-950/20"
              )}>
                {isEligible ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-700 dark:text-green-300">Éligible</AlertTitle>
                    <AlertDescription className="text-green-700 dark:text-green-300">
                      Vous êtes éligible pour ce montant ! Choisissez une offre ci-dessous pour continuer.
                    </AlertDescription>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Non éligible</AlertTitle>
                    <AlertDescription>
                      Votre volume de transactions doit représenter au moins 80% du montant demandé. Continuez à utiliser Mbongo.io pour augmenter votre éligibilité.
                    </AlertDescription>
                  </>
                )}
              </Alert>
            )}
          </div>

          <Alert variant="default" className="border-primary/20 bg-primary/5">
            <Info className="h-4 w-4 text-primary" />
            <AlertTitle className="font-headline text-primary">Condition d'Éligibilité</AlertTitle>
            <AlertDescription className="text-sm">
              Pour être éligible à un crédit, le volume total de vos transactions (dépôts, envois, paiements) sur votre compte Mbongo.io doit être d'au moins <strong>80% du montant</strong> que vous souhaitez emprunter.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">Les demandes sont évaluées par notre IA en fonction de votre activité sur l'écosystème eNkamba. La décision est généralement instantanée.</p>
        </CardFooter>
      </Card>

      {/* Simulation Result */}
      {simulation && selectedOffer && (
        <Card className="border-primary/50 bg-primary/5 animate-in fade-in-up">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              Simulation de Remboursement
            </CardTitle>
            <CardDescription>Prévisualisation de votre crédit : {selectedOffer.name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-card border">
                <p className="text-sm text-muted-foreground mb-1">Montant emprunté</p>
                <p className="text-xl font-bold">{formatCurrency(parseFloat(amount) || 0, currency)}</p>
              </div>
              <div className="p-4 rounded-lg bg-card border">
                <p className="text-sm text-muted-foreground mb-1">Intérêts totaux</p>
                <p className="text-xl font-bold text-orange-600">
                  {formatCurrency(simulation.totalInterest, selectedOffer.currency)}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-card border">
                <p className="text-sm text-muted-foreground mb-1">Montant total</p>
                <p className="text-xl font-bold text-primary">
                  {formatCurrency(simulation.totalAmount, selectedOffer.currency)}
                </p>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-green-800/10 border border-primary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Paiement mensuel</span>
                </div>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(simulation.monthlyPayment, selectedOffer.currency)}
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Sur {selectedOffer.duration} jours • Taux : {selectedOffer.interestRate}% annuel
              </p>
            </div>
            {isEligible && (
              <Button 
                size="lg" 
                className="w-full"
                onClick={() => setShowConfirmDialog(true)}
              >
                Demander ce crédit <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Credit Offers */}
      <div className="space-y-4">
        <h2 className="font-headline text-lg font-bold text-primary">Nos offres de crédit</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {creditOffers.map((offer) => (
            <Card
              key={offer.id}
              className={cn(
                "hover:shadow-lg transition-shadow cursor-pointer",
                selectedOffer?.id === offer.id && "border-primary shadow-md"
              )}
              onClick={() => handleOfferSelect(offer)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Percent className="text-primary" />
                    {offer.name}
                  </CardTitle>
                  {selectedOffer?.id === offer.id && (
                    <Badge className="bg-primary">Sélectionné</Badge>
                  )}
                </div>
                <CardDescription>{offer.description}</CardDescription>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span>Jusqu'à {formatCurrency(offer.maxAmount, offer.currency)}</span>
                  <span>•</span>
                  <span>{offer.duration} jours</span>
                  <span>•</span>
                  <span className="text-primary font-semibold">{offer.interestRate}% annuel</span>
                </div>
              </CardHeader>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => handleOfferSelect(offer)}>
                  {offer.id === 'project' ? 'Faire une simulation' : 'Demander maintenant'} 
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmer la demande de crédit</DialogTitle>
            <DialogDescription>
              Voulez-vous vraiment demander ce crédit ? Veuillez vérifier les détails ci-dessous.
            </DialogDescription>
          </DialogHeader>
          {simulation && selectedOffer && (
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg bg-muted space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Montant :</span>
                  <span className="font-semibold">{formatCurrency(parseFloat(amount) || 0, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Offre :</span>
                  <span className="font-semibold">{selectedOffer.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Taux d'intérêt :</span>
                  <span className="font-semibold">{selectedOffer.interestRate}% annuel</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Durée :</span>
                  <span className="font-semibold">{selectedOffer.duration} jours</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-sm font-semibold">Paiement mensuel :</span>
                  <span className="font-bold text-primary">{formatCurrency(simulation.monthlyPayment, selectedOffer.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-semibold">Montant total à rembourser :</span>
                  <span className="font-bold text-primary">{formatCurrency(simulation.totalAmount, selectedOffer.currency)}</span>
                </div>
              </div>
              <Alert variant="default" className="border-primary/20 bg-primary/5">
                <Info className="h-4 w-4 text-primary" />
                <AlertTitle className="text-sm font-semibold text-primary">Information</AlertTitle>
                <AlertDescription className="text-xs">
                  Si votre demande est approuvée, le montant sera débloqué directement dans votre portefeuille Mbongo dans les 24 heures.
                </AlertDescription>
              </Alert>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmDialog(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button 
              onClick={async () => {
                setIsSubmitting(true);
                
                // Préparer les données de paiement pour le crédit
                const paymentData = {
                  context: 'credit',
                  amount: parseFloat(amount),
                  description: `Demande de crédit: ${selectedOffer?.name}`,
                  metadata: {
                    offerId: selectedOffer?.id,
                    offerName: selectedOffer?.name,
                    interestRate: selectedOffer?.interestRate,
                    duration: selectedOffer?.duration,
                    totalAmount: simulation?.totalAmount,
                    monthlyPayment: simulation?.monthlyPayment,
                    type: 'credit_request'
                  }
                };

                // Stocker les données
                sessionStorage.setItem('credit_payment_data', JSON.stringify(paymentData));
                
                // Rediriger vers le paiement
                window.location.href = '/dashboard/pay?context=credit';
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Envoi en cours..." : "Confirmer la demande"} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

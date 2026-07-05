'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Landmark, Info, ArrowRight, Calculator, CheckCircle2, XCircle, TrendingUp, Clock, ShieldCheck, WalletCards } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useRouter } from 'next/navigation';

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

const CreditBadgeIcon = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
    <rect x="7" y="13" width="34" height="24" rx="7" fill="#25543A" />
    <path d="M12 21h24" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.85" />
    <rect x="13" y="27" width="10" height="5" rx="2" fill="white" opacity="0.9" />
    <circle cx="33" cy="30" r="3" fill="#FFB545" />
    <path d="M21 9h14a5 5 0 0 1 5 5v12" stroke="#25543A" strokeWidth="3" strokeLinecap="round" opacity="0.35" />
  </svg>
);

const ProjectCreditIcon = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
    <rect x="9" y="11" width="30" height="28" rx="8" fill="#25543A" />
    <path d="M16 31l6-6 4 4 7-9" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="17" cy="18" r="3" fill="#25543A" />
    <circle cx="31" cy="18" r="3" fill="#FFB545" />
    <path d="M13 39h22" stroke="#25543A" strokeWidth="3" strokeLinecap="round" opacity="0.75" />
  </svg>
);

const EligibilityIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
    <path d="M20 5l12 5v8c0 8-5 13-12 17C13 31 8 26 8 18v-8l12-5Z" fill="#25543A" />
    <path d="M14 20l4 4 8-9" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

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
  const router = useRouter();
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
    <div className="min-h-screen bg-[#f7faf8]">
    <div className="container mx-auto max-w-4xl p-3 space-y-4 animate-in fade-in duration-500 sm:p-4">
      {/* Header */}
      <header className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#25543A] to-[#25543A] p-4 text-white shadow-lg shadow-[#25543A]/20">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/16 ring-1 ring-white/25">
              <CreditBadgeIcon className="h-8 w-8" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/70">Crédit intelligent</p>
              <h1 className="font-headline text-xl font-black text-white sm:text-2xl">
                Crédit Mbongo.io
              </h1>
              <p className="mt-1 max-w-xl text-xs leading-5 text-white/78 sm:text-sm">
                Simulez, vérifiez votre éligibilité et financez vos projets depuis votre activité eNkamba.
              </p>
            </div>
          </div>
          <div className="hidden shrink-0 rounded-2xl bg-white/14 px-3 py-2 text-right ring-1 ring-white/20 sm:block">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/65">Décision</p>
            <p className="text-sm font-black">Instantanée</p>
          </div>
        </div>
      </header>

      {/* Main Credit Request Card */}
      <Card className="overflow-hidden border-[#25543A]/10 bg-white shadow-sm">
        <CardHeader className="border-b border-[#25543A]/10 bg-white px-4 py-3">
          <CardTitle className="font-headline flex items-center gap-2 text-lg text-[#25543A]">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#25543A]/10 text-[#25543A]">
              <Landmark className="h-5 w-5" />
            </span>
            Demander un crédit
          </CardTitle>
          <CardDescription>Financez vos projets en quelques clics grâce à notre analyse intelligente.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 items-start gap-4 p-4 md:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Montant désiré</Label>
              <div className="flex gap-2">
                <Input
                  id="amount"
                  type="number"
                  placeholder="Ex: 625000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-12 flex-1 rounded-xl border-[#25543A]/20 bg-[#f7faf8] text-lg font-bold focus-visible:ring-[#25543A]"
                />
                <Select value={currency} onValueChange={(value) => setCurrency(value as Currency)}>
                  <SelectTrigger className="h-12 w-[100px] rounded-xl border-[#25543A]/20 bg-white font-semibold">
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
              className="h-11 w-full rounded-xl bg-[#25543A] font-bold text-white hover:bg-[#25543A]" 
              size="lg"
              onClick={checkEligibility}
              disabled={!amount || isChecking}
            >
              {isChecking ? 'Vérification...' : 'Vérifier mon éligibilité'}
            </Button>

            {/* Eligibility Result */}
            {isEligible !== null && (
              <Alert variant={isEligible ? "default" : "destructive"} className={cn(
                "animate-in fade-in-up rounded-2xl",
                isEligible && "border-[#25543A]/20 bg-[#25543A]/5 dark:bg-primary/20"
              )}>
                {isEligible ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-[#25543A]" />
                    <AlertTitle className="text-[#25543A] dark:text-primary">Éligible</AlertTitle>
                    <AlertDescription className="text-[#25543A] dark:text-primary">
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

          <div className="space-y-3">
            <Alert variant="default" className="rounded-2xl border-[#25543A]/20 bg-[#25543A]/5">
              <EligibilityIcon className="h-4 w-4" />
              <AlertTitle className="font-headline text-[#25543A]">Condition d'Éligibilité</AlertTitle>
              <AlertDescription className="text-sm">
                Pour être éligible à un crédit, le volume total de vos transactions (dépôts, envois, paiements) sur votre compte Mbongo.io doit être d'au moins <strong>80% du montant</strong> que vous souhaitez emprunter.
              </AlertDescription>
            </Alert>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl border border-[#25543A]/10 bg-[#f7faf8] p-3">
                <ShieldCheck className="mb-2 h-5 w-5 text-[#25543A]" />
                <p className="text-xs font-bold text-[#25543A]">Analyse IA</p>
                <p className="mt-1 text-[11px] leading-4 text-muted-foreground">Activité et capacité vérifiées.</p>
              </div>
              <div className="rounded-2xl border border-[#25543A]/10 bg-[#f7faf8] p-3">
                <WalletCards className="mb-2 h-5 w-5 text-[#FFB545]" />
                <p className="text-xs font-bold text-[#25543A]">Décaissement</p>
                <p className="mt-1 text-[11px] leading-4 text-muted-foreground">Versement vers wallet.</p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t border-[#25543A]/10 px-4 py-3">
          <p className="text-xs text-muted-foreground">Les demandes sont évaluées par notre IA en fonction de votre activité sur l'écosystème eNkamba. La décision est généralement instantanée.</p>
        </CardFooter>
      </Card>

      {/* Simulation Result */}
      {simulation && selectedOffer && (
        <Card className="animate-in fade-in-up overflow-hidden border-[#25543A]/30 bg-white shadow-sm">
          <CardHeader className="bg-[#25543A]/5 px-4 py-3">
            <CardTitle className="font-headline flex items-center gap-2 text-[#25543A]">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#25543A]/10">
                <Calculator className="h-5 w-5 text-[#25543A]" />
              </span>
              Simulation de Remboursement
            </CardTitle>
            <CardDescription>Prévisualisation de votre crédit : {selectedOffer.name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#25543A]/10 bg-card p-3">
                <p className="text-sm text-muted-foreground mb-1">Montant emprunté</p>
                <p className="text-xl font-bold">{formatCurrency(parseFloat(amount) || 0, currency)}</p>
              </div>
              <div className="rounded-2xl border border-orange-200 bg-orange-50/60 p-3">
                <p className="text-sm text-muted-foreground mb-1">Intérêts totaux</p>
                <p className="text-xl font-bold text-orange-600">
                  {formatCurrency(simulation.totalInterest, selectedOffer.currency)}
                </p>
              </div>
              <div className="rounded-2xl border border-[#25543A]/20 bg-[#25543A]/5 p-3">
                <p className="text-sm text-muted-foreground mb-1">Montant total</p>
                <p className="text-xl font-bold text-[#25543A]">
                  {formatCurrency(simulation.totalAmount, selectedOffer.currency)}
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-[#25543A]/20 bg-gradient-to-r from-[#25543A]/10 to-[#25543A]/5 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-[#25543A]" />
                  <span className="font-semibold">Paiement mensuel</span>
                </div>
                <p className="text-2xl font-bold text-[#25543A]">
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
                className="h-11 w-full rounded-xl bg-[#25543A] font-bold hover:bg-[#25543A]"
                onClick={() => setShowConfirmDialog(true)}
              >
                Demander ce crédit <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Credit Offers */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-headline text-lg font-bold text-[#25543A]">Nos offres de crédit</h2>
          <Badge className="rounded-full bg-[#25543A]/10 text-[#25543A] hover:bg-[#25543A]/10">2 offres</Badge>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {creditOffers.map((offer) => (
            <Card
              key={offer.id}
              className={cn(
                "cursor-pointer overflow-hidden border-[#25543A]/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
                selectedOffer?.id === offer.id && "border-[#25543A] shadow-md ring-1 ring-[#25543A]/20"
              )}
              onClick={() => handleOfferSelect(offer)}
            >
              <CardHeader className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#25543A]/10">
                      {offer.id === 'project' ? <ProjectCreditIcon className="h-8 w-8" /> : <CreditBadgeIcon className="h-8 w-8" />}
                    </div>
                    <CardTitle className="text-base text-[#25543A]">
                      {offer.name}
                    </CardTitle>
                  </div>
                  {selectedOffer?.id === offer.id && (
                    <Badge className="bg-[#25543A]">Sélectionné</Badge>
                  )}
                </div>
                <CardDescription className="leading-5">{offer.description}</CardDescription>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                  <span className="rounded-xl bg-[#f7faf8] px-2 py-2 font-semibold text-[#25543A]">Max {formatCurrency(offer.maxAmount, offer.currency)}</span>
                  <span className="rounded-xl bg-[#f7faf8] px-2 py-2 font-semibold text-[#25543A]">{offer.duration} jours</span>
                  <span className="rounded-xl bg-[#25543A]/10 px-2 py-2 font-bold text-[#25543A]">{offer.interestRate}% annuel</span>
                </div>
              </CardHeader>
              <CardFooter className="px-4 pb-4 pt-0">
                <Button variant="outline" className="h-10 w-full rounded-xl border-[#25543A]/25 text-[#25543A] hover:bg-[#25543A]/5" onClick={() => handleOfferSelect(offer)}>
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
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Confirmer la demande de crédit</DialogTitle>
            <DialogDescription>
              Voulez-vous vraiment demander ce crédit ? Veuillez vérifier les détails ci-dessous.
            </DialogDescription>
          </DialogHeader>
          {simulation && selectedOffer && (
            <div className="space-y-4 py-4">
              <div className="space-y-2 rounded-2xl bg-muted p-4">
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
                  <span className="font-bold text-[#25543A]">{formatCurrency(simulation.monthlyPayment, selectedOffer.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-semibold">Montant total à rembourser :</span>
                  <span className="font-bold text-[#25543A]">{formatCurrency(simulation.totalAmount, selectedOffer.currency)}</span>
                </div>
              </div>
              <Alert variant="default" className="rounded-2xl border-[#25543A]/20 bg-[#25543A]/5">
                <Info className="h-4 w-4 text-[#25543A]" />
                <AlertTitle className="text-sm font-semibold text-[#25543A]">Information</AlertTitle>
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
              className="bg-[#25543A] hover:bg-[#25543A]"
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
                router.push('/dashboard/pay?context=credit');
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Envoi en cours..." : "Confirmer la demande"} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </div>
  );
}

'use client';

import { useState, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, CheckCircle2, Info, QrCode } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams, useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type Currency = 'CDF' | 'USD' | 'EUR';
type BillType = 'tax' | 'yango' | 'water' | 'tv' | 'academic' | 'school' | 'flight' | 'hotel' | 'event' | 'phone' | 'insurance' | 'donation';

const billTypes: Record<BillType, { label: string; description: string; fields: string[] }> = {
  tax: { label: 'Impôts', description: 'Paiement des impôts et taxes', fields: ['Numéro fiscal', 'Période'] },
  yango: { label: 'Yango', description: 'Recharger votre compte Yango', fields: ['Numéro de téléphone', 'Montant'] },
  water: { label: 'Regideso', description: 'Paiement de facture d\'eau', fields: ['Numéro de compte', 'Période'] },
  tv: { label: 'Canal+', description: 'Abonnement Canal+', fields: ['Numéro d\'abonnement', 'Période'] },
  academic: { label: 'Frais Académiques', description: 'Paiement des frais académiques', fields: ['Matricule étudiant', 'Semestre'] },
  school: { label: 'Frais Scolaires', description: 'Paiement des frais scolaires', fields: ['Nom de l\'école', 'Numéro élève'] },
  flight: { label: 'Billet d\'avion', description: 'Réserver un vol', fields: ['Destination', 'Date'] },
  hotel: { label: 'Hôtel', description: 'Réservation hôtelière', fields: ['Nom de l\'hôtel', 'Dates'] },
  event: { label: 'Événements', description: 'Acheter des tickets', fields: ['Nom de l\'événement', 'Nombre de tickets'] },
  phone: { label: 'Crédit Téléphone', description: 'Recharger crédit téléphone', fields: ['Numéro de téléphone', 'Montant'] },
  insurance: { label: 'Assurance', description: 'Paiement de prime d\'assurance', fields: ['Numéro de police', 'Période'] },
  donation: { label: 'Donation', description: 'Faire un don', fields: ['Organisation', 'Montant'] },
};

function PayBillContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const billType = (searchParams.get('type') || 'tax') as BillType;
  const billInfo = billTypes[billType];
  
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('CDF');
  const [field1, setField1] = useState('');
  const [field2, setField2] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  const handlePay = () => {
    if (!amount || !field1) {
      toast({
        variant: "destructive",
        title: "Informations manquantes",
        description: "Veuillez remplir tous les champs obligatoires.",
      });
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirmPayment = async () => {
    setIsPaying(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsPaying(false);
    setShowConfirm(false);

    toast({
      title: "Paiement réussi !",
      description: `Votre paiement de ${amount} ${currency} pour ${billInfo.label} a été effectué avec succès.`,
    });

    // Reset
    setAmount('');
    setField1('');
    setField2('');
  };

  return (
    <div className="container mx-auto max-w-2xl p-4 space-y-6 animate-in fade-in duration-500">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/mbongo-dashboard">
            <ArrowLeft />
          </Link>
        </Button>
        <div>
          <h1 className="font-headline text-xl font-bold text-primary">
            Payer : {billInfo.label}
          </h1>
          <p className="text-sm text-muted-foreground">{billInfo.description}</p>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Informations de paiement</CardTitle>
          <CardDescription>Remplissez les informations ou scannez un QR code pour procéder au paiement.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="default" className="border-primary/20 bg-primary/5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <QrCode className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1 flex-1">
                <AlertTitle className="text-sm font-semibold text-primary">
                  Scanner un QR code pour payer
                </AlertTitle>
                <AlertDescription className="text-xs text-muted-foreground">
                  Vous pouvez utiliser le scanner QR pour payer ce service (Impôts, Yango, Regideso, Canal+, frais, billets, etc.) directement.
                </AlertDescription>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 gap-2"
                  onClick={() => router.push(`/dashboard/scanner?context=bill&type=${billType}`)}
                >
                  <QrCode className="h-4 w-4" />
                  Scanner un QR code
                </Button>
              </div>
            </div>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="field1">{billInfo.fields[0]} *</Label>
            <Input
              id="field1"
              placeholder={`Entrez ${billInfo.fields[0].toLowerCase()}`}
              value={field1}
              onChange={(e) => setField1(e.target.value)}
            />
          </div>
          
          {billInfo.fields[1] && (
            <div className="space-y-2">
              <Label htmlFor="field2">{billInfo.fields[1]}</Label>
              <Input
                id="field2"
                placeholder={`Entrez ${billInfo.fields[1].toLowerCase()}`}
                value={field2}
                onChange={(e) => setField2(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="amount">Montant à payer</Label>
            <div className="flex gap-2">
              <Input
                id="amount"
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-12 text-lg font-semibold flex-1"
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
                ≈ {(parseFloat(amount) * (currency === 'USD' ? 2500 : 3000)).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} CDF
              </p>
            )}
          </div>

          {currency !== 'CDF' && (
            <Alert variant="default" className="border-primary/20 bg-primary/5">
              <Info className="h-4 w-4 text-primary" />
              <AlertTitle className="text-sm font-semibold text-primary">Conversion de devise</AlertTitle>
              <AlertDescription className="text-xs">
                Le montant sera automatiquement converti en CDF pour le paiement.
              </AlertDescription>
            </Alert>
          )}

          <Button size="lg" className="w-full" onClick={handlePay}>
            Payer maintenant
          </Button>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer le paiement</DialogTitle>
            <DialogDescription>
              Vérifiez les détails avant de confirmer le paiement.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-muted space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Service :</span>
                <span className="font-bold">{billInfo.label}</span>
              </div>
              {field1 && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{billInfo.fields[0]} :</span>
                  <span className="font-semibold">{field1}</span>
                </div>
              )}
              {field2 && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{billInfo.fields[1]} :</span>
                  <span className="font-semibold">{field2}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t">
                <span className="font-semibold">Montant :</span>
                <span className="font-bold text-primary text-lg">{amount} {currency}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={isPaying}>
              Annuler
            </Button>
            <Button onClick={handleConfirmPayment} disabled={isPaying} className="bg-gradient-to-r from-primary to-green-800">
              {isPaying ? "Paiement en cours..." : "Confirmer le paiement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function PayBillPage() {
  return (
    <Suspense fallback={<div className="container mx-auto max-w-2xl p-4 flex items-center justify-center h-screen">Chargement...</div>}>
      <PayBillContent />
    </Suspense>
  );
}

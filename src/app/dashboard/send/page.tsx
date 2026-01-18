'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft,
  Send as SendIcon,
  User,
  Smartphone,
  Landmark,
  Globe,
  Wallet,
  Users,
  Clock,
  Info,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

type Currency = 'CDF' | 'USD' | 'EUR';
type RecipientType = 'mbongo' | 'mobile-money' | 'bank' | 'international';

export default function SendMoneyPage() {
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('CDF');
  const [recipientType, setRecipientType] = useState<RecipientType | null>(null);
  const [recipient, setRecipient] = useState('');
  const [note, setNote] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const exchangeRates = {
    CDF: { USD: 2500, EUR: 3000 },
    USD: { CDF: 0.0004, EUR: 1.08 },
    EUR: { CDF: 0.00033, USD: 0.93 }
  };

  const getEquivalentInCDF = () => {
    if (!amount || isNaN(parseFloat(amount))) return null;
    if (currency === 'CDF') return parseFloat(amount);
    const rate = exchangeRates[currency].CDF;
    return parseFloat(amount) / rate;
  };

  const handleContinue = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmSend = async () => {
    setIsSending(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSending(false);
    setShowConfirmDialog(false);
    
    toast({
      title: "Envoi réussi !",
      description: `${amount} ${currency} ont été envoyés à ${recipient}.`,
    });

    // Reset form
    setAmount('');
    setRecipient('');
    setNote('');
    setRecipientType(null);
  };

  return (
    <div className="container mx-auto max-w-4xl p-4 space-y-6 animate-in fade-in duration-500">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/mbongo-dashboard">
            <ArrowLeft />
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <SendIcon className="h-6 w-6 text-primary" />
          <h1 className="font-headline text-xl font-bold text-primary">Envoyer de l'argent</h1>
        </div>
      </header>

      {/* Main Send Form */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-lg">Nouveau transfert</CardTitle>
          <CardDescription>Envoyez de l'argent rapidement et en toute sécurité.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Amount and Currency */}
          <div className="space-y-2">
            <Label htmlFor="amount">Montant à envoyer</Label>
            <div className="flex gap-2">
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-14 text-2xl font-bold flex-1"
              />
              <Select value={currency} onValueChange={(value) => setCurrency(value as Currency)}>
                <SelectTrigger className="w-[120px] h-14 font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CDF">CDF</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {currency !== 'CDF' && getEquivalentInCDF() && (
              <p className="text-sm text-muted-foreground">
                ≈ {getEquivalentInCDF()!.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} CDF
              </p>
            )}
          </div>

          {/* Recipient Type Selection */}
          <div className="space-y-2">
            <Label>Destinataire</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button
                variant={recipientType === 'mbongo' ? 'default' : 'outline'}
                className={cn(
                  "h-auto py-4 flex flex-col items-center gap-2",
                  recipientType === 'mbongo' && "bg-primary"
                )}
                onClick={() => setRecipientType('mbongo')}
              >
                <User className="h-5 w-5" />
                <span className="text-xs">Mbongo.io</span>
              </Button>
              <Button
                variant={recipientType === 'mobile-money' ? 'default' : 'outline'}
                className={cn(
                  "h-auto py-4 flex flex-col items-center gap-2",
                  recipientType === 'mobile-money' && "bg-primary"
                )}
                onClick={() => setRecipientType('mobile-money')}
              >
                <Smartphone className="h-5 w-5" />
                <span className="text-xs">Mobile Money</span>
              </Button>
              <Button
                variant={recipientType === 'bank' ? 'default' : 'outline'}
                className={cn(
                  "h-auto py-4 flex flex-col items-center gap-2",
                  recipientType === 'bank' && "bg-primary"
                )}
                onClick={() => setRecipientType('bank')}
              >
                <Landmark className="h-5 w-5" />
                <span className="text-xs">Banque</span>
              </Button>
              <Button
                variant={recipientType === 'international' ? 'default' : 'outline'}
                className={cn(
                  "h-auto py-4 flex flex-col items-center gap-2",
                  recipientType === 'international' && "bg-primary"
                )}
                onClick={() => setRecipientType('international')}
              >
                <Globe className="h-5 w-5" />
                <span className="text-xs">International</span>
              </Button>
            </div>
          </div>

          {/* Recipient Details */}
          {recipientType && (
            <div className="space-y-2 animate-in fade-in-up">
              <Label htmlFor="recipient">
                {recipientType === 'mbongo' && "Numéro de téléphone ou email"}
                {recipientType === 'mobile-money' && "Numéro Mobile Money"}
                {recipientType === 'bank' && "Numéro de compte bancaire"}
                {recipientType === 'international' && "Informations du bénéficiaire"}
              </Label>
              <Input
                id="recipient"
                placeholder={
                  recipientType === 'mbongo' ? "+243 XXX XXX XXX ou email@exemple.com" :
                  recipientType === 'mobile-money' ? "+243 XXX XXX XXX" :
                  recipientType === 'bank' ? "Numéro de compte" :
                  "Nom et coordonnées"
                }
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="h-12"
              />
            </div>
          )}

          {/* Note (Optional) */}
          {recipientType && amount && (
            <div className="space-y-2 animate-in fade-in-up">
              <Label htmlFor="note">Note (optionnel)</Label>
              <Input
                id="note"
                placeholder="Ajouter une note pour cette transaction"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="h-12"
              />
            </div>
          )}

          {/* Info Alert */}
          {currency !== 'CDF' && (
            <Alert variant="default" className="border-primary/20 bg-primary/5">
              <Info className="h-4 w-4 text-primary" />
              <AlertTitle className="text-sm font-semibold text-primary">Conversion de devise</AlertTitle>
              <AlertDescription className="text-xs">
                Le bénéficiaire recevra le montant converti dans sa devise locale. Les frais de conversion seront calculés avant la confirmation.
              </AlertDescription>
            </Alert>
          )}

          {/* Continue Button */}
          {amount && recipientType && recipient && (
            <Button 
              size="lg" 
              className="w-full"
              onClick={handleContinue}
            >
              Continuer <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}

          {/* Confirmation Dialog */}
          <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmer l'envoi</DialogTitle>
                <DialogDescription>
                  Vérifiez les détails avant de confirmer l'envoi.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="p-4 rounded-lg bg-muted space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Montant :</span>
                    <span className="font-bold">{amount} {currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Destinataire :</span>
                    <span className="font-semibold">{recipient}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Type :</span>
                    <span className="font-semibold">
                      {recipientType === 'mbongo' && 'Mbongo.io'}
                      {recipientType === 'mobile-money' && 'Mobile Money'}
                      {recipientType === 'bank' && 'Banque'}
                      {recipientType === 'international' && 'International'}
                    </span>
                  </div>
                  {note && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Note :</span>
                      <span className="font-semibold text-right">{note}</span>
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={isSending}>
                  Annuler
                </Button>
                <Button onClick={handleConfirmSend} disabled={isSending}>
                  {isSending ? "Envoi en cours..." : "Confirmer l'envoi"} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Quick Options */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-lg">Options rapides</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button variant="outline" className="h-auto py-4 justify-start">
            <Users className="mr-2 h-5 w-5" />
            <div className="text-left">
              <div className="font-semibold">Transfert Multiple</div>
              <div className="text-xs text-muted-foreground">Envoyez à plusieurs contacts</div>
            </div>
          </Button>
          <Button variant="outline" className="h-auto py-4 justify-start">
            <Clock className="mr-2 h-5 w-5" />
            <div className="text-left">
              <div className="font-semibold">Envoi Programmé</div>
              <div className="text-xs text-muted-foreground">Planifiez un envoi futur</div>
            </div>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

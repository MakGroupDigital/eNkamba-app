'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Users, Plus, LogIn, Search, Link as LinkIcon, QrCode, ArrowRight, ShieldCheck, WalletCards, UserRoundCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from 'next/navigation';

type Currency = 'CDF' | 'USD' | 'EUR';
type Frequency = 'daily' | 'weekly' | 'monthly';

interface Tontine {
  id: string;
  name: string;
  members: number;
  maxMembers: number;
  amount: number;
  currency: Currency;
  frequency: string;
  avatar: string;
  progress: number;
}

const myTontines: Tontine[] = [];
const publicTontines: Tontine[] = [];

const TontineCircleIcon = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
    <circle cx="24" cy="24" r="15" fill="#32BB78" />
    <circle cx="24" cy="14" r="5" fill="#173f2b" />
    <circle cx="34" cy="29" r="5" fill="#FFB545" />
    <circle cx="14" cy="29" r="5" fill="white" opacity="0.92" />
    <path d="M19 20a12 12 0 0 1 10 0M29 28a12 12 0 0 1-10 0" stroke="white" strokeWidth="2.8" strokeLinecap="round" opacity="0.85" />
  </svg>
);

const InviteLinkIcon = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
    <rect x="8" y="12" width="32" height="24" rx="8" fill="#173f2b" />
    <path d="M18 24h12" stroke="white" strokeWidth="3" strokeLinecap="round" />
    <path d="M21 17h-2a7 7 0 0 0 0 14h2M27 17h2a7 7 0 0 1 0 14h-2" stroke="#32BB78" strokeWidth="3" strokeLinecap="round" />
    <circle cx="36" cy="14" r="4" fill="#FFB545" />
  </svg>
);

const TrustPotIcon = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
    <path d="M12 19h24l-3 20H15l-3-20Z" fill="#32BB78" />
    <path d="M17 19a7 7 0 0 1 14 0" stroke="#173f2b" strokeWidth="3" strokeLinecap="round" />
    <path d="M19 29l4 4 7-9" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="34" cy="14" r="4" fill="#FFB545" />
  </svg>
);

export default function TontinePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [tontineName, setTontineName] = useState('');
  const [tontineAmount, setTontineAmount] = useState('');
  const [tontineCurrency, setTontineCurrency] = useState<Currency>('CDF');
  const [tontineFrequency, setTontineFrequency] = useState<Frequency>('monthly');
  const [maxMembers, setMaxMembers] = useState('10');
  const [inviteLink, setInviteLink] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const formatCurrency = (amount: number, currency: Currency) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleCreateTontine = async () => {
    if (!tontineName || !tontineAmount || !maxMembers) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
      });
      return;
    }

    // Préparer les données de paiement pour la tontine
    const paymentData = {
      context: 'tontine',
      amount: parseFloat(tontineAmount),
      description: `Création de tontine: ${tontineName}`,
      metadata: {
        tontineName,
        tontineAmount: parseFloat(tontineAmount),
        tontineCurrency,
        tontineFrequency,
        maxMembers: parseInt(maxMembers),
        type: 'tontine_creation'
      }
    };

    // Stocker les données
    sessionStorage.setItem('tontine_payment_data', JSON.stringify(paymentData));
    
    // Rediriger vers le paiement
    router.push('/dashboard/pay?context=tontine');
  };

  const handleJoinByLink = async () => {
    if (!inviteLink || !inviteLink.trim()) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez entrer un lien d'invitation valide.",
      });
      return;
    }

    setIsJoining(true);
    setIsJoining(false);
    setShowJoinForm(false);
    
    toast({
      title: "Lien reçu",
      description: "Aucune tontine réelle n'a encore été chargée pour ce lien. La demande ne sera envoyée qu'après connexion au service tontine.",
    });

    setInviteLink('');
  };

  return (
    <div className="min-h-screen bg-[#f7faf8]">
    <div className="container mx-auto max-w-4xl p-3 space-y-4 animate-in fade-in duration-500 sm:p-4">
      {/* Header */}
      <header className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#32BB78] to-[#21945e] p-4 text-white shadow-lg shadow-[#32BB78]/20">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/16 ring-1 ring-white/25">
              <TontineCircleIcon className="h-8 w-8" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/70">Épargne communautaire</p>
              <h1 className="font-headline text-xl font-black text-white sm:text-2xl">
                Tontine Participative
              </h1>
              <p className="mt-1 max-w-xl text-xs leading-5 text-white/78 sm:text-sm">
                Créez une tontine réelle, rejoignez via invitation et lancez le paiement sécurisé.
              </p>
            </div>
          </div>
          <Badge className="hidden rounded-full bg-white/16 text-white hover:bg-white/16 sm:inline-flex">
            Données réelles uniquement
          </Badge>
        </div>
      </header>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 rounded-2xl bg-white p-1 shadow-sm">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="my-tontines">Mes Tontines</TabsTrigger>
          <TabsTrigger value="discover">Découvrir</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Main Actions */}
          <Card className="overflow-hidden border-[#32BB78]/10 bg-white shadow-sm">
            <CardHeader className="border-b border-[#32BB78]/10 px-4 py-3">
              <CardTitle className="font-headline flex items-center gap-2 text-lg text-[#173f2b]">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#32BB78]/10">
                  <TrustPotIcon className="h-6 w-6" />
                </span>
                Rejoignez ou Créez une Tontine
              </CardTitle>
              <CardDescription>Épargnez en groupe, atteignez vos objectifs communs et renforcez les liens communautaires.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
              <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
                <DialogTrigger asChild>
                  <Button size="lg" className="h-20 justify-start rounded-2xl bg-[#32BB78] px-4 text-left hover:bg-[#299c63]">
                    <span className="mr-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white/18">
                      <Plus className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block text-base font-black">Créer une Tontine</span>
                      <span className="block text-xs font-medium text-white/75">Définir le montant et lancer le paiement</span>
                    </span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-[#173f2b]">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#32BB78]/10">
                        <TontineCircleIcon className="h-6 w-6" />
                      </span>
                      Créer une nouvelle tontine
                    </DialogTitle>
                    <DialogDescription>
                      Remplissez les informations pour créer votre tontine participative.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="tontine-name" className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Nom de la tontine</Label>
                      <Input
                        id="tontine-name"
                        placeholder="Ex: Épargne Familiale"
                        value={tontineName}
                        onChange={(e) => setTontineName(e.target.value)}
                        className="rounded-xl border-[#32BB78]/20 focus-visible:ring-[#32BB78]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tontine-amount" className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Montant par cotisation</Label>
                        <div className="flex gap-2">
                          <Input
                            id="tontine-amount"
                            type="number"
                            placeholder="0"
                            value={tontineAmount}
                            onChange={(e) => setTontineAmount(e.target.value)}
                            className="rounded-xl border-[#32BB78]/20 focus-visible:ring-[#32BB78]"
                          />
                          <Select value={tontineCurrency} onValueChange={(value) => setTontineCurrency(value as Currency)}>
                            <SelectTrigger className="w-[100px] rounded-xl border-[#32BB78]/20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CDF">CDF</SelectItem>
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="EUR">EUR</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="max-members" className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Nombre max de membres</Label>
                        <Input
                          id="max-members"
                          type="number"
                          placeholder="10"
                          value={maxMembers}
                          onChange={(e) => setMaxMembers(e.target.value)}
                          className="rounded-xl border-[#32BB78]/20 focus-visible:ring-[#32BB78]"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="frequency" className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Fréquence des cotisations</Label>
                      <Select value={tontineFrequency} onValueChange={(value) => setTontineFrequency(value as Frequency)}>
                        <SelectTrigger className="rounded-xl border-[#32BB78]/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Quotidienne</SelectItem>
                          <SelectItem value="weekly">Hebdomadaire</SelectItem>
                          <SelectItem value="monthly">Mensuelle</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                        Annuler
                      </Button>
                      <Button onClick={handleCreateTontine} disabled={isCreating} className="bg-[#32BB78] hover:bg-[#299c63]">
                        {isCreating ? "Création en cours..." : "Créer la tontine"}
                      </Button>
                    </DialogFooter>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showJoinForm} onOpenChange={setShowJoinForm}>
                <DialogTrigger asChild>
                  <Button size="lg" variant="outline" className="h-20 justify-start rounded-2xl border-[#32BB78]/20 bg-[#f7faf8] px-4 text-left hover:bg-[#32BB78]/5">
                    <span className="mr-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#32BB78]/10 text-[#32BB78]">
                      <LogIn className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block text-base font-black text-[#173f2b]">Rejoindre une Tontine</span>
                      <span className="block text-xs font-medium text-muted-foreground">Utiliser un lien d’invitation réel</span>
                    </span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-[#173f2b]">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#32BB78]/10">
                        <InviteLinkIcon className="h-6 w-6" />
                      </span>
                      Rejoindre une tontine
                    </DialogTitle>
                    <DialogDescription>
                      Entrez le lien d'invitation ou scannez un QR code.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="invite-link" className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Lien d'invitation</Label>
                      <div className="flex gap-2">
                        <Input
                          id="invite-link"
                          placeholder="https://enkamba.io/tontine/..."
                          value={inviteLink}
                          onChange={(e) => setInviteLink(e.target.value)}
                          className="flex-1 rounded-xl border-[#32BB78]/20 focus-visible:ring-[#32BB78]"
                        />
                        <Button variant="outline" size="icon" className="rounded-xl border-[#32BB78]/20">
                          <QrCode className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowJoinForm(false)}>
                        Annuler
                      </Button>
                      <Button onClick={handleJoinByLink} disabled={isJoining} className="bg-[#32BB78] hover:bg-[#299c63]">
                        {isJoining ? "Traitement..." : "Rejoindre"}
                      </Button>
                    </DialogFooter>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-3 border-t border-[#32BB78]/10 px-4 py-3">
              <p className="text-sm font-medium text-muted-foreground">Autres façons de rejoindre :</p>
              <div className="flex w-full flex-col gap-2 sm:flex-row">
                <Button variant="secondary" className="flex-1 justify-start rounded-xl bg-[#32BB78]/10 text-[#173f2b] hover:bg-[#32BB78]/15">
                  <QrCode className="mr-2" /> Scanner un QR Code
                </Button>
                <div className="flex-1 relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Coller un lien d'invitation"
                    className="rounded-xl border-[#32BB78]/20 pl-10 focus-visible:ring-[#32BB78]"
                    value={inviteLink}
                    onChange={(e) => setInviteLink(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && inviteLink && handleJoinByLink()}
                  />
                </div>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="my-tontines" className="space-y-4">
          <Card className="overflow-hidden border-[#32BB78]/10 bg-white shadow-sm">
            <CardHeader className="border-b border-[#32BB78]/10 px-4 py-3">
              <CardTitle className="font-headline flex items-center gap-2 text-lg text-[#173f2b]">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#32BB78]/10">
                  <UserRoundCheck className="h-5 w-5 text-[#32BB78]" />
                </span>
                Mes Tontines
              </CardTitle>
              <CardDescription>Les tontines liées à votre compte apparaîtront ici après chargement réel.</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              {myTontines.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-[#32BB78]/25 bg-[#f7faf8] p-8 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#32BB78]/10">
                    <TontineCircleIcon className="h-9 w-9" />
                  </div>
                  <p className="font-bold text-[#173f2b]">Aucune tontine réelle chargée</p>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                    Cette section n’affiche pas de données de démonstration. Créez une tontine ou utilisez un lien d’invitation réel.
                  </p>
                  <Button variant="outline" className="mt-4 rounded-xl border-[#32BB78]/20 text-[#173f2b] hover:bg-[#32BB78]/5" onClick={() => setShowJoinForm(true)}>
                    Rejoindre via invitation
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {myTontines.map((tontine) => (
                    <Card key={tontine.id} className="border-[#32BB78]/10 transition hover:shadow-md">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#32BB78]/10 font-black text-[#32BB78]">
                            {tontine.name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <p className="font-headline font-bold text-[#173f2b]">{tontine.name}</p>
                            <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                              <span>{formatCurrency(tontine.amount, tontine.currency)} {tontine.frequency}</span>
                              <span>•</span>
                              <span>{tontine.members}/{tontine.maxMembers} membres</span>
                            </div>
                          </div>
                          <Button variant="outline" className="rounded-xl border-[#32BB78]/20 text-[#173f2b]">
                            Gérer
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discover" className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-headline text-lg font-bold text-[#173f2b]">Tontines à découvrir</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher..." className="w-64 rounded-xl border-[#32BB78]/20 pl-10 focus-visible:ring-[#32BB78]" />
              </div>
            </div>
            {publicTontines.length === 0 ? (
              <Card className="border-[#32BB78]/10 bg-white shadow-sm">
                <CardContent className="p-8 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#32BB78]/10">
                    <Search className="h-7 w-7 text-[#32BB78]" />
                  </div>
                  <p className="font-bold text-[#173f2b]">Aucune tontine publique réelle disponible</p>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                    Les anciennes données d’exemple ont été retirées. Les tontines publiques s’afficheront uniquement lorsqu’une source réelle sera connectée.
                  </p>
                  <Button className="mt-4 rounded-xl bg-[#32BB78] hover:bg-[#299c63]" onClick={() => setShowCreateForm(true)}>
                    Créer une tontine réelle <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </TabsContent>
      </Tabs>
    </div>
    </div>
  );
}

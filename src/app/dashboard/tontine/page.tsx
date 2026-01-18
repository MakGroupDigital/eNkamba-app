'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Users, Plus, LogIn, Search, Link as LinkIcon, QrCode, ArrowRight, Calendar, DollarSign, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

const mockTontinesToDiscover: Tontine[] = [
  {
    id: '1',
    name: "Les Bâtisseurs de Kin",
    members: 8,
    maxMembers: 10,
    amount: 125000, // CDF (~50 USD)
    currency: 'CDF',
    frequency: "chaque mois",
    avatar: "https://picsum.photos/seed/kin-builders/100/100",
    progress: 80,
  },
  {
    id: '2',
    name: "Projet École Maternelle",
    members: 45,
    maxMembers: 50,
    amount: 50000, // CDF (~20 USD)
    currency: 'CDF',
    frequency: "chaque semaine",
    avatar: "https://picsum.photos/seed/school-project/100/100",
    progress: 90,
  },
];

const mockMyTontines: Tontine[] = [];

export default function TontinePage() {
  const { toast } = useToast();
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

    setIsCreating(true);
    // Simuler la création
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsCreating(false);
    setShowCreateForm(false);
    
    toast({
      title: "Tontine créée avec succès !",
      description: `La tontine "${tontineName}" a été créée. Vous pouvez maintenant inviter des membres.`,
    });

    // Reset form
    setTontineName('');
    setTontineAmount('');
    setTontineCurrency('CDF');
    setTontineFrequency('monthly');
    setMaxMembers('10');
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
    // Simuler la demande de rejoindre
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsJoining(false);
    setShowJoinForm(false);
    
    toast({
      title: "Demande envoyée !",
      description: "Votre demande pour rejoindre la tontine a été envoyée. Vous recevrez une notification lorsqu'elle sera approuvée.",
    });

    setInviteLink('');
  };

  return (
    <div className="container mx-auto max-w-4xl p-4 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex items-center gap-2">
        <Users className="h-6 w-6 text-primary" />
        <h1 className="font-headline text-xl font-bold text-primary">
          Tontine Participative
        </h1>
      </header>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="my-tontines">Mes Tontines</TabsTrigger>
          <TabsTrigger value="discover">Découvrir</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Main Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Rejoignez ou Créez une Tontine</CardTitle>
              <CardDescription>Épargnez en groupe, atteignez vos objectifs communs et renforcez les liens communautaires.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
                <DialogTrigger asChild>
                  <Button size="lg" className="h-16 text-lg">
                    <Plus className="mr-2" />
                    Créer une Tontine
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Créer une nouvelle tontine</DialogTitle>
                    <DialogDescription>
                      Remplissez les informations pour créer votre tontine participative.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="tontine-name">Nom de la tontine</Label>
                      <Input
                        id="tontine-name"
                        placeholder="Ex: Épargne Familiale"
                        value={tontineName}
                        onChange={(e) => setTontineName(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tontine-amount">Montant par cotisation</Label>
                        <div className="flex gap-2">
                          <Input
                            id="tontine-amount"
                            type="number"
                            placeholder="0"
                            value={tontineAmount}
                            onChange={(e) => setTontineAmount(e.target.value)}
                          />
                          <Select value={tontineCurrency} onValueChange={(value) => setTontineCurrency(value as Currency)}>
                            <SelectTrigger className="w-[100px]">
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
                        <Label htmlFor="max-members">Nombre max de membres</Label>
                        <Input
                          id="max-members"
                          type="number"
                          placeholder="10"
                          value={maxMembers}
                          onChange={(e) => setMaxMembers(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="frequency">Fréquence des cotisations</Label>
                      <Select value={tontineFrequency} onValueChange={(value) => setTontineFrequency(value as Frequency)}>
                        <SelectTrigger>
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
                      <Button onClick={handleCreateTontine} disabled={isCreating}>
                        {isCreating ? "Création en cours..." : "Créer la tontine"}
                      </Button>
                    </DialogFooter>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showJoinForm} onOpenChange={setShowJoinForm}>
                <DialogTrigger asChild>
                  <Button size="lg" variant="outline" className="h-16 text-lg">
                    <LogIn className="mr-2" />
                    Rejoindre une Tontine
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Rejoindre une tontine</DialogTitle>
                    <DialogDescription>
                      Entrez le lien d'invitation ou scannez un QR code.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="invite-link">Lien d'invitation</Label>
                      <div className="flex gap-2">
                        <Input
                          id="invite-link"
                          placeholder="https://enkamba.io/tontine/..."
                          value={inviteLink}
                          onChange={(e) => setInviteLink(e.target.value)}
                          className="flex-1"
                        />
                        <Button variant="outline" size="icon">
                          <QrCode className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowJoinForm(false)}>
                        Annuler
                      </Button>
                      <Button onClick={handleJoinByLink} disabled={isJoining}>
                        {isJoining ? "Traitement..." : "Rejoindre"}
                      </Button>
                    </DialogFooter>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-4 pt-4 border-t">
              <p className="text-sm font-medium text-muted-foreground">Autres façons de rejoindre :</p>
              <div className="flex flex-col sm:flex-row gap-2 w-full">
                <Button variant="secondary" className="flex-1 justify-start">
                  <QrCode className="mr-2" /> Scanner un QR Code
                </Button>
                <div className="flex-1 relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Coller un lien d'invitation"
                    className="pl-10"
                    value={inviteLink}
                    onChange={(e) => setInviteLink(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && inviteLink && handleJoinByLink()}
                  />
                </div>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="my-tontines" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Mes Tontines</CardTitle>
            </CardHeader>
            <CardContent>
              {mockMyTontines.length === 0 ? (
                <div className="text-center py-10">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Vous n'avez pas encore rejoint de tontine.</p>
                  <Button variant="link" className="mt-2" onClick={() => setShowJoinForm(true)}>
                    Découvrir les tontines publiques
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {mockMyTontines.map((tontine) => (
                    <Card key={tontine.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarImage src={tontine.avatar} />
                            <AvatarFallback>{tontine.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-headline font-semibold">{tontine.name}</p>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                              <span>{formatCurrency(tontine.amount, tontine.currency)} {tontine.frequency}</span>
                              <span>•</span>
                              <span>{tontine.members}/{tontine.maxMembers} membres</span>
                            </div>
                            <Progress value={tontine.progress} className="mt-2 h-2" />
                          </div>
                          <Button variant="outline">
                            <Settings className="h-4 w-4 mr-2" />
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

        <TabsContent value="discover" className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-headline text-lg font-bold text-primary">Tontines à découvrir</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher..." className="pl-10 w-64" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockTontinesToDiscover.map((tontine) => (
                <Card key={tontine.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={tontine.avatar} />
                        <AvatarFallback>{tontine.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <CardTitle className="text-base font-headline">{tontine.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-2xl font-bold text-primary">
                        {formatCurrency(tontine.amount, tontine.currency)}
                      </p>
                      <p className="text-xs text-muted-foreground">{tontine.frequency}</p>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{tontine.members}/{tontine.maxMembers} membres</span>
                      <Badge variant="secondary">{tontine.progress}% remplie</Badge>
                    </div>
                    <Progress value={tontine.progress} className="h-2" />
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" variant="outline">
                      Demander à rejoindre <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  UgaviIcon,
  SendPackageIcon,
  TrackPackageIcon,
  CalculatorIcon,
  MapPinIcon,
  HistoryNavIcon,
  SearchIcon,
} from "@/components/icons/service-icons";

type Currency = 'CDF' | 'USD' | 'EUR';

const UgaviLogo = () => (
  <div className="flex items-center gap-3">
    <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
      <UgaviIcon size={32} />
    </div>
    <div>
      <span className="font-headline text-2xl font-bold text-white">Ugavi</span>
      <p className="text-xs text-white/70">Logistique mondiale</p>
    </div>
  </div>
);

const coreServices = [
  { title: "Monde → Monde", description: "Expédiez vos colis partout dans le monde en toute simplicité.", icon: "✈️" },
  { title: "Express & Standard", description: "Choisissez le mode de livraison adapté à vos besoins.", icon: "🌍" }
];

const features = [
  { icon: CalculatorIcon, label: "Calculer les frais", href: "#" },
  { icon: MapPinIcon, label: "Trouver un point relais", href: "#" },
  { icon: HistoryNavIcon, label: "Historique d'envoi", href: "#" }
];

export default function UgaviPage() {
  const { toast } = useToast();
  const [trackingNumber, setTrackingNumber] = useState('');
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showTrackingResult, setShowTrackingResult] = useState(false);
  const [showCalculateDialog, setShowCalculateDialog] = useState(false);
  const [showRelayDialog, setShowRelayDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Calculate fees states
  const [weight, setWeight] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  
  // Form states
  const [senderName, setSenderName] = useState('');
  const [senderAddress, setSenderAddress] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverAddress, setReceiverAddress] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [packageWeight, setPackageWeight] = useState('');
  const [packageDescription, setPackageDescription] = useState('');
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');
  const [currency, setCurrency] = useState<Currency>('CDF');

  const handleTrack = () => {
    if (!trackingNumber || !trackingNumber.trim()) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez entrer un numéro de suivi.",
      });
      return;
    }
    setShowTrackingResult(true);
    toast({
      title: "Suivi trouvé",
      description: "Informations de suivi affichées ci-dessous.",
    });
  };

  const handleSendPackage = async () => {
    if (!senderName || !senderAddress || !senderPhone || !receiverName || !receiverAddress || !receiverPhone || !packageWeight) {
      toast({
        variant: "destructive",
        title: "Informations manquantes",
        description: "Veuillez remplir tous les champs obligatoires.",
      });
      return;
    }

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSubmitting(false);
    setShowSendDialog(false);

    const newTrackingNumber = `UGV-${Date.now().toString().slice(-8)}`;
    setTrackingNumber(newTrackingNumber);
    
    toast({
      title: "Colis créé avec succès !",
      description: `Votre colis a été enregistré. Numéro de suivi : ${newTrackingNumber}`,
    });

    // Reset form
    setSenderName('');
    setSenderAddress('');
    setSenderPhone('');
    setReceiverName('');
    setReceiverAddress('');
    setReceiverPhone('');
    setPackageWeight('');
    setPackageDescription('');
    setShippingMethod('standard');
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background animate-in fade-in duration-500">
      {/* Header */}
      <header className="sticky top-0 z-30 w-full bg-gradient-to-r from-primary via-primary to-green-800 p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <UgaviLogo />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        <div className="container mx-auto max-w-4xl p-4 space-y-8">
          {/* Tracking Section */}
          <Card className="shadow-xl animate-in fade-in-up duration-500 border-primary/20 dark:border-primary/30 overflow-hidden">
            <div className="bg-gradient-to-r from-primary/10 to-green-800/10 p-1">
              <CardContent className="p-5 space-y-4 bg-card rounded-lg">
                <div className="flex items-center gap-3">
                  <TrackPackageIcon size={32} />
                  <label htmlFor="tracking-number" className="font-headline text-lg font-semibold bg-gradient-to-r from-primary to-green-800 bg-clip-text text-transparent">
                    Suivez votre colis en temps réel
                  </label>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="tracking-number"
                      placeholder="Entrez le numéro de suivi"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
                      className="h-14 text-base pl-4 pr-4 rounded-xl border-primary/20 dark:border-primary/40"
                    />
                  </div>
                  <Button 
                    size="icon" 
                    className="h-14 w-14 rounded-xl bg-gradient-to-r from-primary to-green-800 hover:from-primary/90 hover:to-green-800/90 shadow-lg"
                    onClick={handleTrack}
                  >
                    <SearchIcon size={24} className="text-white" />
                  </Button>
                </div>
              </CardContent>
            </div>
          </Card>

          {/* Tracking Result */}
          {showTrackingResult && trackingNumber && (
            <Card className="border-primary/50 bg-primary/5 animate-in fade-in-up">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Statut du colis : {trackingNumber}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Statut :</span>
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">En transit</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Origine :</span>
                  <span className="font-semibold">Kinshasa, RDC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Destination :</span>
                  <span className="font-semibold">Paris, France</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dernière mise à jour :</span>
                  <span className="font-semibold">Il y a 2 heures</span>
                </div>
                <div className="pt-3 border-t">
                  <p className="text-sm text-muted-foreground">Le colis a quitté l'entrepôt de destination et est en route vers le point de livraison.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4 animate-in fade-in-up duration-500" style={{animationDelay: '150ms'}}>
            <Card className="text-center transition-all duration-300 hover:scale-105 hover:shadow-xl overflow-hidden bg-gradient-to-br from-primary to-green-800 text-white cursor-pointer" onClick={() => setShowSendDialog(true)}>
              <CardContent className="p-6 flex flex-col items-center justify-center gap-4">
                <div className="p-3 rounded-2xl bg-white/20">
                  <SendPackageIcon size={36} className="text-white" />
                </div>
                <span className="font-headline font-semibold">Envoyer un colis</span>
              </CardContent>
            </Card>

            <Card className="text-center transition-all duration-300 hover:scale-105 hover:shadow-xl overflow-hidden bg-card cursor-pointer" onClick={() => setShowTrackingResult(true)}>
              <CardContent className="p-6 flex flex-col items-center justify-center gap-4">
                <div className="p-3 rounded-2xl bg-muted">
                  <TrackPackageIcon size={36} />
                </div>
                <span className="font-headline font-semibold">Suivi de colis</span>
              </CardContent>
            </Card>
          </div>

          {/* Core Services */}
          <div className="space-y-4 animate-in fade-in-up duration-500" style={{animationDelay: '300ms'}}>
            {coreServices.map(service => (
              <Card key={service.title}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="text-4xl">{service.icon}</div>
                  <div>
                    <p className="font-headline font-bold text-primary">{service.title}</p>
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                  </div>
                  <ArrowRight className="ml-auto h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Key Features */}
          <div className="animate-in fade-in-up duration-500" style={{animationDelay: '450ms'}}>
            <h3 className="font-headline text-xl font-bold bg-gradient-to-r from-primary to-green-800 bg-clip-text text-transparent mb-4">
              Autres fonctionnalités
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              {features.map(feature => {
                const IconComponent = feature.icon;
                return (
                  <button
                    key={feature.label}
                    onClick={() => {
                      if (feature.label === 'Calculer les frais') setShowCalculateDialog(true);
                      if (feature.label === 'Trouver un point relais') setShowRelayDialog(true);
                      if (feature.label === 'Historique d\'envoi') setShowHistoryDialog(true);
                    }}
                    className="flex flex-col items-center gap-3 text-sm font-medium text-foreground hover:text-primary transition-all group"
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-green-800/10 dark:from-primary/20 dark:to-green-800/20 shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all border border-primary/20 dark:border-primary/40">
                      <IconComponent size={32} />
                    </div>
                    <span className="px-1">{feature.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Send Package Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Envoyer un colis</DialogTitle>
            <DialogDescription>
              Remplissez les informations pour envoyer votre colis.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Sender Info */}
            <div className="space-y-4">
              <h3 className="font-semibold">Expéditeur</h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="sender-name">Nom complet *</Label>
                  <Input id="sender-name" value={senderName} onChange={(e) => setSenderName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sender-address">Adresse complète *</Label>
                  <Textarea id="sender-address" value={senderAddress} onChange={(e) => setSenderAddress(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sender-phone">Téléphone *</Label>
                  <Input id="sender-phone" value={senderPhone} onChange={(e) => setSenderPhone(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Receiver Info */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold">Destinataire</h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="receiver-name">Nom complet *</Label>
                  <Input id="receiver-name" value={receiverName} onChange={(e) => setReceiverName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="receiver-address">Adresse complète *</Label>
                  <Textarea id="receiver-address" value={receiverAddress} onChange={(e) => setReceiverAddress(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="receiver-phone">Téléphone *</Label>
                  <Input id="receiver-phone" value={receiverPhone} onChange={(e) => setReceiverPhone(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Package Info */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold">Informations du colis</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Poids (kg) *</Label>
                  <Input id="weight" type="number" value={packageWeight} onChange={(e) => setPackageWeight(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shipping-method">Mode de livraison</Label>
                  <Select value={shippingMethod} onValueChange={(value: 'standard' | 'express') => setShippingMethod(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard (5-7 jours)</SelectItem>
                      <SelectItem value="express">Express (1-3 jours)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description du contenu</Label>
                <Textarea id="description" value={packageDescription} onChange={(e) => setPackageDescription(e.target.value)} placeholder="Décrivez le contenu du colis..." />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendDialog(false)} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button onClick={handleSendPackage} disabled={isSubmitting} className="bg-gradient-to-r from-primary to-green-800">
              {isSubmitting ? "Enregistrement..." : "Créer l'envoi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Calculate Fees Dialog */}
      <Dialog open={showCalculateDialog} onOpenChange={setShowCalculateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Calculer les frais de livraison</DialogTitle>
            <DialogDescription>
              Obtenez une estimation des frais de livraison pour votre colis.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="calc-weight">Poids (kg) *</Label>
              <Input
                id="calc-weight"
                type="number"
                placeholder="Ex: 2.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="calc-origin">Ville d'origine *</Label>
              <Input
                id="calc-origin"
                placeholder="Ex: Kinshasa"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="calc-destination">Ville de destination *</Label>
              <Input
                id="calc-destination"
                placeholder="Ex: Paris"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={() => {
                if (!weight || !origin || !destination) {
                  toast({
                    variant: "destructive",
                    title: "Erreur",
                    description: "Veuillez remplir tous les champs.",
                  });
                  return;
                }
                // Calcul simple : base 5000 CDF + 1000 par kg + distance estimée
                const basePrice = 5000;
                const weightPrice = parseFloat(weight) * 1000;
                const distancePrice = 15000; // Prix fixe pour l'exemple
                setCalculatedPrice(basePrice + weightPrice + distancePrice);
                toast({
                  title: "Calcul effectué",
                  description: "Les frais estimés sont affichés ci-dessous.",
                });
              }}
            >
              Calculer
            </Button>
            {calculatedPrice !== null && (
              <Card className="p-4 bg-primary/10 border-primary/20">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Frais estimés :</span>
                  <span className="text-2xl font-bold text-primary">{calculatedPrice.toLocaleString('fr-FR')} CDF</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Prix indicatif. Les frais réels peuvent varier selon les options choisies.
                </p>
              </Card>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCalculateDialog(false);
              setWeight('');
              setOrigin('');
              setDestination('');
              setCalculatedPrice(null);
            }}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Find Relay Point Dialog */}
      <Dialog open={showRelayDialog} onOpenChange={setShowRelayDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trouver un point relais</DialogTitle>
            <DialogDescription>
              Recherchez un point relais près de chez vous.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="relay-location">Votre localisation</Label>
              <Input
                id="relay-location"
                placeholder="Ex: Kinshasa, Gombe"
                className="pl-10"
              />
            </div>
            <Button
              className="w-full"
              onClick={() => {
                toast({
                  title: "Recherche effectuée",
                  description: "10 points relais trouvés dans votre zone. Affichage de la carte...",
                });
              }}
            >
              Rechercher
            </Button>
            <div className="space-y-2 pt-4 border-t">
              <p className="font-semibold text-sm">Points relais à proximité :</p>
              <div className="space-y-2">
                {['Point Relais Kinshasa Centre', 'Point Relais Gombe', 'Point Relais Limete'].map((name, i) => (
                  <Card key={i} className="p-3">
                    <p className="font-semibold text-sm">{name}</p>
                    <p className="text-xs text-muted-foreground">Ouvert 7j/7, 8h-20h</p>
                    <p className="text-xs text-primary mt-1">📍 1.2 km</p>
                  </Card>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRelayDialog(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shipping History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Historique d'envoi</DialogTitle>
            <DialogDescription>
              Consultez l'historique de tous vos envois de colis.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {[
              { id: 'UGV-12345678', date: '15/05/2024', destination: 'Paris, France', status: 'Livré', amount: '125000 CDF' },
              { id: 'UGV-87654321', date: '10/05/2024', destination: 'Kinshasa, RDC', status: 'En transit', amount: '45000 CDF' },
              { id: 'UGV-11223344', date: '05/05/2024', destination: 'Bruxelles, Belgique', status: 'Livré', amount: '98000 CDF' },
            ].map((shipment) => (
              <Card key={shipment.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">{shipment.id}</p>
                      <p className="text-xs text-muted-foreground">{shipment.date}</p>
                    </div>
                    <Badge className={shipment.status === 'Livré' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                      {shipment.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">Vers : {shipment.destination}</p>
                  <p className="text-sm font-semibold text-primary">{shipment.amount}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHistoryDialog(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

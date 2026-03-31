'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Plane, Search, Calendar, Users, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";

interface SearchParams {
  from: string;
  to: string;
  tripType: 'one-way' | 'round-trip';
  departDate: string;
  returnDate: string;
  passengers: number;
  cabinClass: 'economy' | 'premium-economy' | 'business' | 'first';
}

// Aéroports populaires
const AIRPORTS = [
  { code: 'FIH', city: 'Kinshasa', country: 'RD Congo', name: 'Aéroport International de N\'djili' },
  { code: 'FBM', city: 'Lubumbashi', country: 'RD Congo', name: 'Aéroport International de Luano' },
  { code: 'BRU', city: 'Bruxelles', country: 'Belgique', name: 'Brussels Airport' },
  { code: 'CDG', city: 'Paris', country: 'France', name: 'Charles de Gaulle' },
  { code: 'LHR', city: 'Londres', country: 'Royaume-Uni', name: 'Heathrow' },
  { code: 'JNB', city: 'Johannesburg', country: 'Afrique du Sud', name: 'O.R. Tambo' },
  { code: 'ADD', city: 'Addis-Abeba', country: 'Éthiopie', name: 'Bole International' },
  { code: 'NBO', city: 'Nairobi', country: 'Kenya', name: 'Jomo Kenyatta' },
  { code: 'LOS', city: 'Lagos', country: 'Nigeria', name: 'Murtala Muhammed' },
  { code: 'DXB', city: 'Dubaï', country: 'EAU', name: 'Dubai International' },
  { code: 'IST', city: 'Istanbul', country: 'Turquie', name: 'Istanbul Airport' },
  { code: 'DOH', city: 'Doha', country: 'Qatar', name: 'Hamad International' },
];

export default function FlightsPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [searchParams, setSearchParams] = useState<SearchParams>({
    from: '',
    to: '',
    tripType: 'round-trip',
    departDate: '',
    returnDate: '',
    passengers: 1,
    cabinClass: 'economy',
  });
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);

  const handleSearch = async () => {
    // Validation
    if (!searchParams.from || !searchParams.to) {
      toast({
        variant: "destructive",
        title: "Champs manquants",
        description: "Veuillez sélectionner l'aéroport de départ et d'arrivée.",
      });
      return;
    }

    if (!searchParams.departDate) {
      toast({
        variant: "destructive",
        title: "Date manquante",
        description: "Veuillez sélectionner la date de départ.",
      });
      return;
    }

    if (searchParams.tripType === 'round-trip' && !searchParams.returnDate) {
      toast({
        variant: "destructive",
        title: "Date manquante",
        description: "Veuillez sélectionner la date de retour.",
      });
      return;
    }

    if (searchParams.from === searchParams.to) {
      toast({
        variant: "destructive",
        title: "Destinations identiques",
        description: "L'aéroport de départ et d'arrivée doivent être différents.",
      });
      return;
    }

    // Afficher la barre de chargement
    setIsSearching(true);
    setSearchProgress(0);

    // Simuler la progression de la recherche
    const progressInterval = setInterval(() => {
      setSearchProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    // Attendre un peu pour montrer l'animation
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Compléter la progression
    setSearchProgress(100);
    await new Promise(resolve => setTimeout(resolve, 300));

    // Redirection vers la page de résultats avec les paramètres
    const params = new URLSearchParams({
      from: searchParams.from,
      to: searchParams.to,
      tripType: searchParams.tripType,
      departDate: searchParams.departDate,
      returnDate: searchParams.returnDate || '',
      passengers: searchParams.passengers.toString(),
      cabinClass: searchParams.cabinClass,
    });

    router.push(`/dashboard/flights/results?${params.toString()}`);
  };

  const getAirportLabel = (code: string) => {
    const airport = AIRPORTS.find(a => a.code === code);
    return airport ? `${airport.city} (${airport.code}) - ${airport.country}` : code;
  };

  const cabinClassLabels = {
    'economy': 'Économique',
    'premium-economy': 'Économique Premium',
    'business': 'Affaires',
    'first': 'Première Classe',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#32BB78]/5 to-background">
      {/* Overlay de recherche */}
      {isSearching && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="w-full max-w-md px-6 space-y-6">
            <div className="text-center space-y-4">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <Plane className="absolute inset-0 m-auto w-10 h-10 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Recherche de vols en cours...</h3>
                <p className="text-muted-foreground">
                  Nous recherchons les meilleurs vols pour vous
                </p>
              </div>
            </div>

            {/* Barre de progression moderne */}
            <div className="space-y-2">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-green-600 transition-all duration-300 ease-out rounded-full"
                  style={{ width: `${searchProgress}%` }}
                >
                  <div className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                </div>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                {searchProgress < 30 && "Connexion aux compagnies aériennes..."}
                {searchProgress >= 30 && searchProgress < 60 && "Analyse des disponibilités..."}
                {searchProgress >= 60 && searchProgress < 90 && "Comparaison des prix..."}
                {searchProgress >= 90 && "Finalisation..."}
              </p>
            </div>

            {/* Informations de recherche */}
            <div className="p-4 rounded-lg bg-muted/50 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Trajet:</span>
                <span className="font-semibold">
                  {AIRPORTS.find(a => a.code === searchParams.from)?.city} → {AIRPORTS.find(a => a.code === searchParams.to)?.city}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Passagers:</span>
                <span className="font-semibold">{searchParams.passengers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Classe:</span>
                <span className="font-semibold">{cabinClassLabels[searchParams.cabinClass]}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto max-w-4xl p-4 space-y-6 animate-in fade-in duration-500">
        <header className="flex items-center gap-4 pt-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/mbongo-dashboard">
              <ArrowLeft />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="font-headline text-2xl font-bold bg-gradient-to-r from-[#32BB78] to-[#2a9d63] bg-clip-text text-transparent">
              Réservation de vols
            </h1>
            <p className="text-sm text-muted-foreground">Trouvez et réservez votre vol</p>
          </div>
        </header>

        {/* Bannière d'information */}
        <Card className="bg-gradient-to-r from-blue-600 to-cyan-800 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Plane className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">Voyagez en toute sérénité</h3>
                <p className="text-sm opacity-90">Comparez les meilleurs prix et réservez en quelques clics</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulaire de recherche */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Rechercher un vol
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Type de voyage */}
            <div className="space-y-3">
              <Label>Type de voyage</Label>
              <RadioGroup
                value={searchParams.tripType}
                onValueChange={(value: 'one-way' | 'round-trip') => 
                  setSearchParams(prev => ({ ...prev, tripType: value }))
                }
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="round-trip" id="round-trip" />
                  <Label htmlFor="round-trip" className="cursor-pointer">Aller-Retour</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="one-way" id="one-way" />
                  <Label htmlFor="one-way" className="cursor-pointer">Aller Simple</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Départ et Destination */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>D'où partez-vous ? *</Label>
                <Select
                  value={searchParams.from}
                  onValueChange={(value) => setSearchParams(prev => ({ ...prev, from: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un aéroport" />
                  </SelectTrigger>
                  <SelectContent>
                    {AIRPORTS.map(airport => (
                      <SelectItem key={airport.code} value={airport.code}>
                        <div className="flex flex-col">
                          <span className="font-semibold">{airport.city} ({airport.code})</span>
                          <span className="text-xs text-muted-foreground">{airport.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Où allez-vous ? *</Label>
                <Select
                  value={searchParams.to}
                  onValueChange={(value) => setSearchParams(prev => ({ ...prev, to: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un aéroport" />
                  </SelectTrigger>
                  <SelectContent>
                    {AIRPORTS.map(airport => (
                      <SelectItem key={airport.code} value={airport.code}>
                        <div className="flex flex-col">
                          <span className="font-semibold">{airport.city} ({airport.code})</span>
                          <span className="text-xs text-muted-foreground">{airport.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Affichage du trajet sélectionné */}
            {searchParams.from && searchParams.to && (
              <div className="p-4 rounded-lg bg-muted/50 flex items-center justify-center gap-3">
                <Badge variant="outline" className="text-sm">
                  {AIRPORTS.find(a => a.code === searchParams.from)?.city}
                </Badge>
                <ArrowRight className="w-5 h-5 text-primary" />
                <Badge variant="outline" className="text-sm">
                  {AIRPORTS.find(a => a.code === searchParams.to)?.city}
                </Badge>
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date de départ *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={searchParams.departDate}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, departDate: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="pl-10"
                  />
                </div>
              </div>

              {searchParams.tripType === 'round-trip' && (
                <div className="space-y-2">
                  <Label>Date de retour *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="date"
                      value={searchParams.returnDate}
                      onChange={(e) => setSearchParams(prev => ({ ...prev, returnDate: e.target.value }))}
                      min={searchParams.departDate || new Date().toISOString().split('T')[0]}
                      className="pl-10"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Passagers et Classe */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre de passagers</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    min={1}
                    max={9}
                    value={searchParams.passengers}
                    onChange={(e) => setSearchParams(prev => ({ 
                      ...prev, 
                      passengers: parseInt(e.target.value) || 1 
                    }))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Classe de voyage</Label>
                <Select
                  value={searchParams.cabinClass}
                  onValueChange={(value: any) => setSearchParams(prev => ({ ...prev, cabinClass: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="economy">
                      <div className="flex flex-col">
                        <span>Économique</span>
                        <span className="text-xs text-muted-foreground">Tarif standard</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="premium-economy">
                      <div className="flex flex-col">
                        <span>Économique Premium</span>
                        <span className="text-xs text-muted-foreground">Plus d'espace et confort</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="business">
                      <div className="flex flex-col">
                        <span>Affaires</span>
                        <span className="text-xs text-muted-foreground">Confort supérieur</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="first">
                      <div className="flex flex-col">
                        <span>Première Classe</span>
                        <span className="text-xs text-muted-foreground">Luxe et exclusivité</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Récapitulatif */}
            {searchParams.from && searchParams.to && searchParams.departDate && (
              <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-green-800/10 space-y-2">
                <h4 className="font-semibold text-sm">Récapitulatif de votre recherche</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Trajet:</span>
                    <p className="font-semibold">
                      {AIRPORTS.find(a => a.code === searchParams.from)?.city} → {AIRPORTS.find(a => a.code === searchParams.to)?.city}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <p className="font-semibold">
                      {searchParams.tripType === 'round-trip' ? 'Aller-Retour' : 'Aller Simple'}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Passagers:</span>
                    <p className="font-semibold">{searchParams.passengers}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Classe:</span>
                    <p className="font-semibold">{cabinClassLabels[searchParams.cabinClass]}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Bouton de recherche */}
            <Button 
              className="w-full h-12 text-lg bg-gradient-to-r from-primary to-green-800"
              onClick={handleSearch}
              disabled={isSearching}
            >
              <Search className="w-5 h-5 mr-2" />
              {isSearching ? 'Recherche en cours...' : 'Rechercher des vols'}
            </Button>
          </CardContent>
        </Card>

        {/* Destinations populaires */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Destinations populaires depuis Kinshasa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { to: 'BRU', city: 'Bruxelles', price: 850 },
                { to: 'CDG', city: 'Paris', price: 900 },
                { to: 'JNB', city: 'Johannesburg', price: 650 },
                { to: 'ADD', city: 'Addis-Abeba', price: 550 },
                { to: 'DXB', city: 'Dubaï', price: 950 },
                { to: 'FBM', city: 'Lubumbashi', price: 200 },
              ].map(dest => (
                <button
                  key={dest.to}
                  onClick={() => {
                    setSearchParams(prev => ({
                      ...prev,
                      from: 'FIH',
                      to: dest.to,
                    }));
                  }}
                  className="p-4 rounded-lg border-2 hover:border-primary transition-all text-left"
                >
                  <p className="font-bold">{dest.city}</p>
                  <p className="text-sm text-muted-foreground">À partir de</p>
                  <p className="text-lg font-bold text-primary">{dest.price} USD</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

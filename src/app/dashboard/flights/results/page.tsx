'use client';

import { useState, useMemo, Suspense } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plane, Clock, Calendar, Users, Briefcase, ArrowRight, Filter } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Image from 'next/image';

interface Flight {
  id: string;
  airline: string;
  airlineLogo: string;
  flightNumber: string;
  from: string;
  to: string;
  departTime: string;
  arriveTime: string;
  duration: string;
  stops: number;
  stopCities?: string[];
  price: number;
  currency: string;
  cabinClass: string;
  seatsAvailable: number;
  aircraft: string;
}

// Compagnies aériennes
const AIRLINES = {
  'ET': { name: 'Ethiopian Airlines', logo: '🇪🇹' },
  'KQ': { name: 'Kenya Airways', logo: '🇰🇪' },
  'SN': { name: 'Brussels Airlines', logo: '🇧🇪' },
  'AF': { name: 'Air France', logo: '🇫🇷' },
  'EK': { name: 'Emirates', logo: '🇦🇪' },
  'QR': { name: 'Qatar Airways', logo: '🇶🇦' },
  'TK': { name: 'Turkish Airlines', logo: '🇹🇷' },
  'SA': { name: 'South African Airways', logo: '🇿🇦' },
};

// Génération de vols simulés (à remplacer par une vraie API)
const generateFlights = (from: string, to: string, date: string, cabinClass: string): Flight[] => {
  const flights: Flight[] = [];
  const airlines = Object.keys(AIRLINES);
  const basePrice = cabinClass === 'economy' ? 500 : cabinClass === 'business' ? 1500 : 2500;
  
  // Générer 8-12 vols
  const numFlights = Math.floor(Math.random() * 5) + 8;
  
  for (let i = 0; i < numFlights; i++) {
    const airlineCode = airlines[Math.floor(Math.random() * airlines.length)];
    const airline = AIRLINES[airlineCode as keyof typeof AIRLINES];
    const stops = Math.random() > 0.6 ? 0 : Math.random() > 0.5 ? 1 : 2;
    const duration = stops === 0 ? '6h 30m' : stops === 1 ? '9h 15m' : '12h 45m';
    const priceVariation = Math.floor(Math.random() * 400) - 200;
    
    flights.push({
      id: `${airlineCode}${Math.floor(Math.random() * 9000) + 1000}`,
      airline: airline.name,
      airlineLogo: airline.logo,
      flightNumber: `${airlineCode} ${Math.floor(Math.random() * 900) + 100}`,
      from,
      to,
      departTime: `${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${['00', '15', '30', '45'][Math.floor(Math.random() * 4)]}`,
      arriveTime: `${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${['00', '15', '30', '45'][Math.floor(Math.random() * 4)]}`,
      duration,
      stops,
      stopCities: stops > 0 ? ['Addis-Abeba', 'Nairobi', 'Johannesburg'].slice(0, stops) : undefined,
      price: basePrice + priceVariation + (stops * 100),
      currency: 'USD',
      cabinClass,
      seatsAvailable: Math.floor(Math.random() * 20) + 5,
      aircraft: ['Boeing 737', 'Airbus A320', 'Boeing 787', 'Airbus A350'][Math.floor(Math.random() * 4)],
    });
  }
  
  return flights.sort((a, b) => a.price - b.price);
};

function FlightResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const from = searchParams?.get('from') || '';
  const to = searchParams?.get('to') || '';
  const tripType = searchParams?.get('tripType') || 'round-trip';
  const departDate = searchParams?.get('departDate') || '';
  const returnDate = searchParams?.get('returnDate') || '';
  const passengers = parseInt(searchParams?.get('passengers') || '1');
  const cabinClass = searchParams?.get('cabinClass') || 'economy';

  const [sortBy, setSortBy] = useState<'price' | 'duration' | 'departure'>('price');
  const [filterStops, setFilterStops] = useState<'all' | 'direct' | 'one-stop'>('all');

  // Générer les vols
  const allFlights = useMemo(() => {
    return generateFlights(from, to, departDate, cabinClass);
  }, [from, to, departDate, cabinClass]);

  // Filtrer et trier
  const filteredFlights = useMemo(() => {
    let filtered = allFlights.filter(flight => {
      if (filterStops === 'direct') return flight.stops === 0;
      if (filterStops === 'one-stop') return flight.stops === 1;
      return true;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price': return a.price - b.price;
        case 'duration': return parseInt(a.duration) - parseInt(b.duration);
        case 'departure': return a.departTime.localeCompare(b.departTime);
        default: return 0;
      }
    });

    return filtered;
  }, [allFlights, sortBy, filterStops]);

  const cabinClassLabels: Record<string, string> = {
    'economy': 'Économique',
    'premium-economy': 'Économique Premium',
    'business': 'Affaires',
    'first': 'Première Classe',
  };

  if (!from || !to) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">Paramètres de recherche manquants</p>
            <Button asChild>
              <Link href="/dashboard/flights">Nouvelle recherche</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#32BB78]/5 to-background">
      <div className="container mx-auto max-w-7xl p-4 space-y-6 animate-in fade-in duration-500">
        <header className="flex items-center gap-4 pt-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/flights">
              <ArrowLeft />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="font-headline text-2xl font-bold">Résultats de recherche</h1>
            <p className="text-sm text-muted-foreground">
              {filteredFlights.length} vol{filteredFlights.length > 1 ? 's' : ''} trouvé{filteredFlights.length > 1 ? 's' : ''}
            </p>
          </div>
        </header>

        {/* Résumé de la recherche */}
        <Card className="bg-gradient-to-r from-blue-600 to-cyan-800 text-white border-0">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-white text-foreground text-base px-3 py-1">{from}</Badge>
                <ArrowRight className="w-5 h-5" />
                <Badge className="bg-white text-foreground text-base px-3 py-1">{to}</Badge>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4" />
                <span>{new Date(departDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                {tripType === 'round-trip' && returnDate && (
                  <>
                    <ArrowRight className="w-4 h-4" />
                    <span>{new Date(returnDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4" />
                <span>{passengers} passager{passengers > 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="w-4 h-4" />
                <span>{cabinClassLabels[cabinClass]}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filtres et tri */}
        <div className="flex flex-wrap gap-3">
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price">Prix croissant</SelectItem>
              <SelectItem value="duration">Durée</SelectItem>
              <SelectItem value="departure">Heure de départ</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStops} onValueChange={(value: any) => setFilterStops(value)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les escales</SelectItem>
              <SelectItem value="direct">Vol direct uniquement</SelectItem>
              <SelectItem value="one-stop">1 escale maximum</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Liste des vols */}
        <div className="space-y-4">
          {filteredFlights.map(flight => (
            <Card 
              key={flight.id}
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/dashboard/flights/booking?flightId=${flight.id}&${searchParams?.toString()}`)}
            >
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Compagnie */}
                  <div className="flex items-center gap-3 md:w-48">
                    <div className="text-4xl">{flight.airlineLogo}</div>
                    <div>
                      <p className="font-bold">{flight.airline}</p>
                      <p className="text-sm text-muted-foreground">{flight.flightNumber}</p>
                      <p className="text-xs text-muted-foreground">{flight.aircraft}</p>
                    </div>
                  </div>

                  {/* Horaires */}
                  <div className="flex-1 flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{flight.departTime}</p>
                      <p className="text-sm text-muted-foreground">{from}</p>
                    </div>

                    <div className="flex-1 flex flex-col items-center">
                      <p className="text-sm text-muted-foreground mb-1">{flight.duration}</p>
                      <div className="w-full h-px bg-border relative">
                        <Plane className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-primary rotate-90" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {flight.stops === 0 ? 'Direct' : `${flight.stops} escale${flight.stops > 1 ? 's' : ''}`}
                      </p>
                      {flight.stopCities && (
                        <p className="text-xs text-muted-foreground">
                          via {flight.stopCities.join(', ')}
                        </p>
                      )}
                    </div>

                    <div className="text-center">
                      <p className="text-2xl font-bold">{flight.arriveTime}</p>
                      <p className="text-sm text-muted-foreground">{to}</p>
                    </div>
                  </div>

                  {/* Prix et action */}
                  <div className="flex flex-col items-end justify-between md:w-48 border-l pl-6">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">À partir de</p>
                      <p className="text-3xl font-bold text-primary">{flight.price}</p>
                      <p className="text-sm text-muted-foreground">{flight.currency}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {flight.seatsAvailable} siège{flight.seatsAvailable > 1 ? 's' : ''} restant{flight.seatsAvailable > 1 ? 's' : ''}
                      </p>
                    </div>
                    <Button className="w-full">
                      Sélectionner
                    </Button>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                  <Badge variant="outline">{cabinClassLabels[flight.cabinClass]}</Badge>
                  {flight.stops === 0 && (
                    <Badge className="bg-primary">Vol direct</Badge>
                  )}
                  {flight.seatsAvailable < 10 && (
                    <Badge variant="destructive">Places limitées</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredFlights.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground mb-4">Aucun vol trouvé avec ces critères</p>
              <Button asChild>
                <Link href="/dashboard/flights">Modifier la recherche</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function FlightResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Recherche de vols en cours...</p>
        </div>
      </div>
    }>
      <FlightResultsContent />
    </Suspense>
  );
}

'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ArrowLeft, Search, Filter, MapPin, Star, Wifi, Coffee, Car, Utensils, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface Hotel {
  id: string;
  name: string;
  image: string;
  rating: number;
  reviews: number;
  price: number;
  currency: 'USD' | 'CDF';
  continent: string;
  country: string;
  city: string;
  region: string;
  commune: string;
  address: string;
  description: string;
  amenities: string[];
  roomTypes: RoomType[];
  featured: boolean;
}

interface RoomType {
  id: string;
  name: string;
  capacity: number;
  price: number;
  available: number;
  description: string;
}

interface FeaturedOffer {
  id: string;
  title: string;
  subtitle: string;
  discount: string;
  image: string;
  hotelId: string;
  gradient: string;
}

// Offres vedettes pour le carrousel
const FEATURED_OFFERS: FeaturedOffer[] = [
  {
    id: 'offer-1',
    title: 'Grand Hôtel Kinshasa',
    subtitle: 'Séjour de luxe au bord du fleuve',
    discount: '-30%',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
    hotelId: 'hotel-001',
    gradient: 'from-blue-600 to-blue-800',
  },
  {
    id: 'offer-2',
    title: 'Pullman Kinshasa',
    subtitle: 'Expérience 5 étoiles exceptionnelle',
    discount: '-25%',
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800',
    hotelId: 'hotel-002',
    gradient: 'from-purple-600 to-purple-800',
  },
  {
    id: 'offer-3',
    title: 'Hôtel Sultani Lubumbashi',
    subtitle: 'Découvrez la capitale du cuivre',
    discount: '-20%',
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
    hotelId: 'hotel-005',
    gradient: 'from-[#FFA500] to-[#FFA500]',
  },
];

// Base de données des hôtels
const HOTELS: Hotel[] = [
  {
    id: 'hotel-001',
    name: 'Grand Hôtel Kinshasa',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
    rating: 4.8,
    reviews: 234,
    price: 150,
    currency: 'USD',
    continent: 'Afrique',
    country: 'RD Congo',
    city: 'Kinshasa',
    region: 'Kinshasa',
    commune: 'Gombe',
    address: 'Avenue du Port, Gombe',
    description: 'Hôtel de luxe au cœur de Kinshasa avec vue sur le fleuve Congo',
    amenities: ['Wifi', 'Restaurant', 'Parking', 'Piscine', 'Spa', 'Salle de sport'],
    roomTypes: [
      { id: 'r1', name: 'Chambre Standard', capacity: 2, price: 150, available: 5, description: 'Chambre confortable avec vue sur la ville' },
      { id: 'r2', name: 'Suite Deluxe', capacity: 3, price: 250, available: 3, description: 'Suite spacieuse avec salon' },
      { id: 'r3', name: 'Suite Présidentielle', capacity: 4, price: 500, available: 1, description: 'Suite de luxe avec terrasse privée' },
    ],
    featured: true,
  },
  {
    id: 'hotel-002',
    name: 'Pullman Kinshasa Grand Hôtel',
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800',
    rating: 4.7,
    reviews: 189,
    price: 180,
    currency: 'USD',
    continent: 'Afrique',
    country: 'RD Congo',
    city: 'Kinshasa',
    region: 'Kinshasa',
    commune: 'Gombe',
    address: '4 Avenue Batetela, Gombe',
    description: 'Hôtel international 5 étoiles avec services premium',
    amenities: ['Wifi', 'Restaurant', 'Parking', 'Piscine', 'Bar', 'Centre d\'affaires'],
    roomTypes: [
      { id: 'r1', name: 'Chambre Supérieure', capacity: 2, price: 180, available: 8, description: 'Chambre moderne avec équipements haut de gamme' },
      { id: 'r2', name: 'Suite Executive', capacity: 3, price: 300, available: 4, description: 'Suite avec espace de travail' },
    ],
    featured: true,
  },
  {
    id: 'hotel-003',
    name: 'Hôtel Memling',
    image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
    rating: 4.5,
    reviews: 156,
    price: 120,
    currency: 'USD',
    continent: 'Afrique',
    country: 'RD Congo',
    city: 'Kinshasa',
    region: 'Kinshasa',
    commune: 'Gombe',
    address: 'Avenue de la Libération, Gombe',
    description: 'Hôtel historique avec charme colonial',
    amenities: ['Wifi', 'Restaurant', 'Parking', 'Jardin'],
    roomTypes: [
      { id: 'r1', name: 'Chambre Classic', capacity: 2, price: 120, available: 10, description: 'Chambre élégante style colonial' },
      { id: 'r2', name: 'Suite Junior', capacity: 2, price: 200, available: 5, description: 'Suite avec balcon' },
    ],
    featured: false,
  },
  {
    id: 'hotel-004',
    name: 'Béatrice Hôtel',
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
    rating: 4.3,
    reviews: 98,
    price: 100,
    currency: 'USD',
    continent: 'Afrique',
    country: 'RD Congo',
    city: 'Kinshasa',
    region: 'Kinshasa',
    commune: 'Ngaliema',
    address: 'Boulevard du 30 Juin, Ngaliema',
    description: 'Hôtel confortable avec excellent rapport qualité-prix',
    amenities: ['Wifi', 'Restaurant', 'Parking'],
    roomTypes: [
      { id: 'r1', name: 'Chambre Standard', capacity: 2, price: 100, available: 12, description: 'Chambre simple et confortable' },
      { id: 'r2', name: 'Chambre Familiale', capacity: 4, price: 180, available: 6, description: 'Chambre spacieuse pour famille' },
    ],
    featured: false,
  },
  {
    id: 'hotel-005',
    name: 'Hôtel Sultani',
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
    rating: 4.6,
    reviews: 145,
    price: 140,
    currency: 'USD',
    continent: 'Afrique',
    country: 'RD Congo',
    city: 'Lubumbashi',
    region: 'Haut-Katanga',
    commune: 'Lubumbashi',
    address: 'Avenue Mobutu, Centre-ville',
    description: 'Hôtel moderne au cœur de la capitale du cuivre',
    amenities: ['Wifi', 'Restaurant', 'Parking', 'Piscine', 'Bar'],
    roomTypes: [
      { id: 'r1', name: 'Chambre Standard', capacity: 2, price: 140, available: 7, description: 'Chambre climatisée moderne' },
      { id: 'r2', name: 'Suite Business', capacity: 2, price: 220, available: 3, description: 'Suite avec bureau' },
    ],
    featured: true,
  },
  {
    id: 'hotel-006',
    name: 'Karavia Hôtel',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
    rating: 4.4,
    reviews: 112,
    price: 130,
    currency: 'USD',
    continent: 'Afrique',
    country: 'RD Congo',
    city: 'Lubumbashi',
    region: 'Haut-Katanga',
    commune: 'Lubumbashi',
    address: 'Avenue Kasaï, Lubumbashi',
    description: 'Hôtel d\'affaires avec services complets',
    amenities: ['Wifi', 'Restaurant', 'Parking', 'Salle de conférence'],
    roomTypes: [
      { id: 'r1', name: 'Chambre Executive', capacity: 2, price: 130, available: 9, description: 'Chambre pour professionnels' },
    ],
    featured: false,
  },
];

export default function HotelsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContinent, setSelectedContinent] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedCommune, setSelectedCommune] = useState<string>('all');
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'rating' | 'name'>('rating');
  const [showFilters, setShowFilters] = useState(false);
  const [currentOfferIndex, setCurrentOfferIndex] = useState(0);

  // Auto-défilement du carrousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentOfferIndex((prev) => (prev + 1) % FEATURED_OFFERS.length);
    }, 5000); // Change toutes les 5 secondes

    return () => clearInterval(interval);
  }, []);

  // Extraire les valeurs uniques pour les filtres
  const continents = useMemo(() => ['all', ...new Set(HOTELS.map(h => h.continent))], []);
  const countries = useMemo(() => {
    if (selectedContinent === 'all') return ['all', ...new Set(HOTELS.map(h => h.country))];
    return ['all', ...new Set(HOTELS.filter(h => h.continent === selectedContinent).map(h => h.country))];
  }, [selectedContinent]);
  
  const cities = useMemo(() => {
    let filtered = HOTELS;
    if (selectedCountry !== 'all') filtered = filtered.filter(h => h.country === selectedCountry);
    return ['all', ...new Set(filtered.map(h => h.city))];
  }, [selectedCountry]);
  
  const communes = useMemo(() => {
    let filtered = HOTELS;
    if (selectedCity !== 'all') filtered = filtered.filter(h => h.city === selectedCity);
    return ['all', ...new Set(filtered.map(h => h.commune))];
  }, [selectedCity]);

  // Filtrer et trier les hôtels
  const filteredHotels = useMemo(() => {
    let filtered = HOTELS.filter(hotel => {
      const matchesSearch = hotel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          hotel.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          hotel.commune.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesContinent = selectedContinent === 'all' || hotel.continent === selectedContinent;
      const matchesCountry = selectedCountry === 'all' || hotel.country === selectedCountry;
      const matchesCity = selectedCity === 'all' || hotel.city === selectedCity;
      const matchesCommune = selectedCommune === 'all' || hotel.commune === selectedCommune;
      const matchesRating = hotel.rating >= minRating;

      return matchesSearch && matchesContinent && matchesCountry && matchesCity && matchesCommune && matchesRating;
    });

    // Tri
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc': return a.price - b.price;
        case 'price-desc': return b.price - a.price;
        case 'rating': return b.rating - a.rating;
        case 'name': return a.name.localeCompare(b.name);
        default: return 0;
      }
    });

    return filtered;
  }, [searchQuery, selectedContinent, selectedCountry, selectedCity, selectedCommune, minRating, sortBy]);

  const resetFilters = () => {
    setSelectedContinent('all');
    setSelectedCountry('all');
    setSelectedCity('all');
    setSelectedCommune('all');
    setMinRating(0);
    setSearchQuery('');
  };

  const activeFiltersCount = [
    selectedContinent !== 'all',
    selectedCountry !== 'all',
    selectedCity !== 'all',
    selectedCommune !== 'all',
    minRating > 0,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#0A8B46]/5 to-background">
      <div className="container mx-auto max-w-7xl p-4 space-y-6 animate-in fade-in duration-500">
        <header className="flex items-center gap-4 pt-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/mbongo-dashboard">
              <ArrowLeft />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="font-headline text-2xl font-bold bg-gradient-to-r from-[#0A8B46] to-[#0A8B46] bg-clip-text text-transparent">
              Réservation d'hôtels
            </h1>
            <p className="text-sm text-muted-foreground">
              {filteredHotels.length} hôtel{filteredHotels.length > 1 ? 's' : ''} disponible{filteredHotels.length > 1 ? 's' : ''}
            </p>
          </div>
        </header>

        {/* Carrousel d'offres vedettes */}
        <div className="relative h-48 rounded-2xl overflow-hidden shadow-xl">
          {FEATURED_OFFERS.map((offer, index) => (
            <div
              key={offer.id}
              className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                index === currentOfferIndex 
                  ? 'opacity-100 translate-x-0' 
                  : index < currentOfferIndex 
                    ? 'opacity-0 -translate-x-full' 
                    : 'opacity-0 translate-x-full'
              }`}
            >
              <div className="relative h-full w-full">
                {/* Image de fond */}
                <Image
                  src={offer.image}
                  alt={offer.title}
                  fill
                  className="object-cover"
                />
                {/* Overlay gradient */}
                <div className={`absolute inset-0 bg-gradient-to-r ${offer.gradient} opacity-80`} />
                
                {/* Contenu */}
                <div className="relative h-full flex items-center justify-between p-6 text-white">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-yellow-400 text-yellow-900 hover:bg-yellow-400">
                        Offre Vedette
                      </Badge>
                    </div>
                    <h3 className="text-2xl font-bold">{offer.title}</h3>
                    <p className="text-sm opacity-90">{offer.subtitle}</p>
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => router.push(`/dashboard/hotels/${offer.hotelId}`)}
                      className="mt-2"
                    >
                      Voir l'offre
                    </Button>
                  </div>
                  <div className="text-right">
                    <div className="text-5xl font-bold">{offer.discount}</div>
                    <p className="text-sm opacity-90">de réduction</p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Indicateurs de pagination */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {FEATURED_OFFERS.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentOfferIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentOfferIndex 
                    ? 'w-8 bg-white' 
                    : 'w-2 bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Aller à l'offre ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Barre de recherche et filtres */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un hôtel, ville, commune..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Sheet open={showFilters} onOpenChange={setShowFilters}>
              <SheetTrigger asChild>
                <Button variant="outline" className="relative">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtres
                  {activeFiltersCount > 0 && (
                    <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[85vh]">
                <SheetHeader>
                  <SheetTitle>Filtres de recherche</SheetTitle>
                  <SheetDescription>Affinez votre recherche d'hôtel</SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-4 overflow-y-auto max-h-[calc(85vh-180px)]">
                  <div className="space-y-2">
                    <Label>Continent</Label>
                    <Select value={selectedContinent} onValueChange={setSelectedContinent}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {continents.map(c => (
                          <SelectItem key={c} value={c}>
                            {c === 'all' ? 'Tous les continents' : c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Pays</Label>
                    <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map(c => (
                          <SelectItem key={c} value={c}>
                            {c === 'all' ? 'Tous les pays' : c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Ville</Label>
                    <Select value={selectedCity} onValueChange={setSelectedCity}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map(c => (
                          <SelectItem key={c} value={c}>
                            {c === 'all' ? 'Toutes les villes' : c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Commune</Label>
                    <Select value={selectedCommune} onValueChange={setSelectedCommune}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {communes.map(c => (
                          <SelectItem key={c} value={c}>
                            {c === 'all' ? 'Toutes les communes' : c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Note minimale: {minRating > 0 ? `${minRating}★` : 'Toutes'}</Label>
                    <div className="flex gap-2">
                      {[0, 3, 4, 4.5].map(rating => (
                        <Button
                          key={rating}
                          variant={minRating === rating ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setMinRating(rating)}
                        >
                          {rating === 0 ? 'Toutes' : `${rating}★+`}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t flex gap-2">
                  <Button variant="outline" onClick={resetFilters} className="flex-1">
                    Réinitialiser
                  </Button>
                  <Button onClick={() => setShowFilters(false)} className="flex-1">
                    Appliquer
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Tri rapide */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button
              variant={sortBy === 'rating' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('rating')}
            >
              Mieux notés
            </Button>
            <Button
              variant={sortBy === 'price-asc' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('price-asc')}
            >
              Prix croissant
            </Button>
            <Button
              variant={sortBy === 'price-desc' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('price-desc')}
            >
              Prix décroissant
            </Button>
            <Button
              variant={sortBy === 'name' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('name')}
            >
              Nom A-Z
            </Button>
          </div>
        </div>

        {/* Liste des hôtels */}
        {filteredHotels.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Aucun hôtel trouvé avec ces critères</p>
              <Button variant="link" onClick={resetFilters} className="mt-2">
                Réinitialiser les filtres
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredHotels.map(hotel => (
              <Card
                key={hotel.id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => router.push(`/dashboard/hotels/${hotel.id}`)}
              >
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={hotel.image}
                    alt={hotel.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  {hotel.featured && (
                    <Badge className="absolute top-2 right-2 bg-gradient-to-r from-[#0A8B46] to-[#0A8B46]">
                      Recommandé
                    </Badge>
                  )}
                </div>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="font-bold text-lg line-clamp-1">{hotel.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <MapPin className="w-3 h-3" />
                      <span className="line-clamp-1">{hotel.commune}, {hotel.city}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                      <span className="font-semibold">{hotel.rating}</span>
                      <span className="text-sm text-muted-foreground">({hotel.reviews})</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">À partir de</p>
                      <p className="text-xl font-bold text-primary">{hotel.price} {hotel.currency}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {hotel.amenities.slice(0, 3).map((amenity, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {amenity}
                      </Badge>
                    ))}
                    {hotel.amenities.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{hotel.amenities.length - 3}
                      </Badge>
                    )}
                  </div>

                  <Button className="w-full" size="sm">
                    Voir les détails
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

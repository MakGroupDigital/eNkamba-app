'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ArrowLeft, Search, Filter, MapPin, Calendar, Clock, Users, ChevronRight, Ticket } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface Event {
  id: string;
  name: string;
  image: string;
  type: string;
  category: string;
  date: string;
  time: string;
  venue: string;
  city: string;
  country: string;
  address: string;
  description: string;
  organizer: string;
  price: number;
  currency: 'USD' | 'CDF';
  ticketsAvailable: number;
  totalTickets: number;
  featured: boolean;
  tags: string[];
}

interface FeaturedEvent {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  image: string;
  eventId: string;
  gradient: string;
}

// Événements vedettes pour le carrousel
const FEATURED_EVENTS: FeaturedEvent[] = [
  {
    id: 'featured-1',
    title: 'Festival Amani 2024',
    subtitle: 'Le plus grand festival de musique de RDC',
    date: '15 Juin 2024',
    image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
    eventId: 'event-001',
    gradient: 'from-pink-600 to-purple-800',
  },
  {
    id: 'featured-2',
    title: 'Tech Summit Kinshasa',
    subtitle: 'Innovation et technologie en Afrique',
    date: '20 Juin 2024',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
    eventId: 'event-005',
    gradient: 'from-blue-600 to-cyan-800',
  },
  {
    id: 'featured-3',
    title: 'Fally Ipupa Live',
    subtitle: 'Concert exceptionnel à Kinshasa',
    date: '25 Juin 2024',
    image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800',
    eventId: 'event-002',
    gradient: 'from-orange-600 to-red-800',
  },
];

// Base de données des événements
const EVENTS: Event[] = [
  {
    id: 'event-001',
    name: 'Festival Amani 2024',
    image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
    type: 'Festival',
    category: 'Musique',
    date: '2024-06-15',
    time: '18:00',
    venue: 'Stade des Martyrs',
    city: 'Kinshasa',
    country: 'RD Congo',
    address: 'Boulevard Triomphal, Kinshasa',
    description: 'Le plus grand festival de musique de la RDC avec des artistes internationaux et locaux',
    organizer: 'Amani Productions',
    price: 50,
    currency: 'USD',
    ticketsAvailable: 5000,
    totalTickets: 10000,
    featured: true,
    tags: ['Musique', 'Festival', 'Outdoor', 'Famille'],
  },
  {
    id: 'event-002',
    name: 'Fally Ipupa Live Concert',
    image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800',
    type: 'Concert',
    category: 'Musique',
    date: '2024-06-25',
    time: '20:00',
    venue: 'Pullman Grand Hôtel',
    city: 'Kinshasa',
    country: 'RD Congo',
    address: '4 Avenue Batetela, Gombe',
    description: 'Concert exclusif de Fally Ipupa, l\'artiste congolais le plus populaire',
    organizer: 'Dicap Music',
    price: 100,
    currency: 'USD',
    ticketsAvailable: 800,
    totalTickets: 1000,
    featured: true,
    tags: ['Musique', 'Concert', 'VIP', 'Rumba'],
  },
  {
    id: 'event-003',
    name: 'Salon de l\'Entrepreneuriat',
    image: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800',
    type: 'Conférence',
    category: 'Business',
    date: '2024-06-10',
    time: '09:00',
    venue: 'Fleuve Congo Hotel',
    city: 'Kinshasa',
    country: 'RD Congo',
    address: 'Avenue du Port, Gombe',
    description: 'Rencontre des entrepreneurs et investisseurs de la région',
    organizer: 'Congo Business Forum',
    price: 30,
    currency: 'USD',
    ticketsAvailable: 300,
    totalTickets: 500,
    featured: false,
    tags: ['Business', 'Networking', 'Conférence'],
  },
  {
    id: 'event-004',
    name: 'Match TP Mazembe vs AS Vita',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
    type: 'Sport',
    category: 'Football',
    date: '2024-06-18',
    time: '16:00',
    venue: 'Stade TP Mazembe',
    city: 'Lubumbashi',
    country: 'RD Congo',
    address: 'Avenue Lumumba, Lubumbashi',
    description: 'Derby congolais entre les deux géants du football',
    organizer: 'LINAFOOT',
    price: 10,
    currency: 'USD',
    ticketsAvailable: 15000,
    totalTickets: 20000,
    featured: false,
    tags: ['Sport', 'Football', 'Derby', 'Famille'],
  },
  {
    id: 'event-005',
    name: 'Tech Summit Kinshasa 2024',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
    type: 'Conférence',
    category: 'Technologie',
    date: '2024-06-20',
    time: '08:00',
    venue: 'Kempinski Hotel',
    city: 'Kinshasa',
    country: 'RD Congo',
    address: 'Avenue Wagenia, Gombe',
    description: 'Sommet sur l\'innovation technologique et la transformation digitale en Afrique',
    organizer: 'Tech Africa',
    price: 75,
    currency: 'USD',
    ticketsAvailable: 400,
    totalTickets: 500,
    featured: true,
    tags: ['Technologie', 'Innovation', 'Startup', 'Networking'],
  },
  {
    id: 'event-006',
    name: 'Théâtre: La Vie est Belle',
    image: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800',
    type: 'Théâtre',
    category: 'Culture',
    date: '2024-06-12',
    time: '19:00',
    venue: 'Institut Français',
    city: 'Kinshasa',
    country: 'RD Congo',
    address: 'Avenue de la Justice, Gombe',
    description: 'Pièce de théâtre inspirée du film culte congolais',
    organizer: 'Compagnie Théâtrale Mwinda',
    price: 15,
    currency: 'USD',
    ticketsAvailable: 150,
    totalTickets: 200,
    featured: false,
    tags: ['Théâtre', 'Culture', 'Art', 'Comédie'],
  },
  {
    id: 'event-007',
    name: 'Fashion Week Kinshasa',
    image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800',
    type: 'Mode',
    category: 'Fashion',
    date: '2024-06-28',
    time: '18:00',
    venue: 'Palais du Peuple',
    city: 'Kinshasa',
    country: 'RD Congo',
    address: 'Boulevard du 30 Juin',
    description: 'Défilé des plus grands créateurs de mode congolais',
    organizer: 'Congo Fashion Week',
    price: 40,
    currency: 'USD',
    ticketsAvailable: 600,
    totalTickets: 800,
    featured: false,
    tags: ['Mode', 'Fashion', 'Défilé', 'Glamour'],
  },
  {
    id: 'event-008',
    name: 'Festival de Jazz de Kinshasa',
    image: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800',
    type: 'Festival',
    category: 'Musique',
    date: '2024-07-05',
    time: '17:00',
    venue: 'Jardin Botanique',
    city: 'Kinshasa',
    country: 'RD Congo',
    address: 'Mont Ngaliema',
    description: 'Festival de jazz avec des artistes locaux et internationaux',
    organizer: 'Jazz Congo',
    price: 35,
    currency: 'USD',
    ticketsAvailable: 1000,
    totalTickets: 1500,
    featured: false,
    tags: ['Musique', 'Jazz', 'Festival', 'Outdoor'],
  },
];

export default function EventsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'price-asc' | 'price-desc' | 'name'>('date');
  const [showFilters, setShowFilters] = useState(false);
  const [currentFeaturedIndex, setCurrentFeaturedIndex] = useState(0);

  // Auto-défilement du carrousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeaturedIndex((prev) => (prev + 1) % FEATURED_EVENTS.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Extraire les valeurs uniques pour les filtres
  const types = useMemo(() => ['all', ...new Set(EVENTS.map(e => e.type))], []);
  const categories = useMemo(() => ['all', ...new Set(EVENTS.map(e => e.category))], []);
  const cities = useMemo(() => ['all', ...new Set(EVENTS.map(e => e.city))], []);
  const months = useMemo(() => {
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const eventMonths = new Set(EVENTS.map(e => new Date(e.date).getMonth()));
    return ['all', ...Array.from(eventMonths).sort().map(m => monthNames[m])];
  }, []);

  // Filtrer et trier les événements
  const filteredEvents = useMemo(() => {
    let filtered = EVENTS.filter(event => {
      const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          event.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          event.city.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === 'all' || event.type === selectedType;
      const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;
      const matchesCity = selectedCity === 'all' || event.city === selectedCity;
      
      const eventMonth = new Date(event.date).toLocaleDateString('fr-FR', { month: 'long' });
      const matchesMonth = selectedMonth === 'all' || eventMonth.toLowerCase() === selectedMonth.toLowerCase();
      
      let matchesPrice = true;
      if (priceRange === 'free') matchesPrice = event.price === 0;
      else if (priceRange === 'low') matchesPrice = event.price > 0 && event.price <= 20;
      else if (priceRange === 'medium') matchesPrice = event.price > 20 && event.price <= 50;
      else if (priceRange === 'high') matchesPrice = event.price > 50;

      return matchesSearch && matchesType && matchesCategory && matchesCity && matchesMonth && matchesPrice;
    });

    // Tri
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date': return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'price-asc': return a.price - b.price;
        case 'price-desc': return b.price - a.price;
        case 'name': return a.name.localeCompare(b.name);
        default: return 0;
      }
    });

    return filtered;
  }, [searchQuery, selectedType, selectedCategory, selectedCity, selectedMonth, priceRange, sortBy]);

  const resetFilters = () => {
    setSelectedType('all');
    setSelectedCategory('all');
    setSelectedCity('all');
    setSelectedMonth('all');
    setPriceRange('all');
    setSearchQuery('');
  };

  const activeFiltersCount = [
    selectedType !== 'all',
    selectedCategory !== 'all',
    selectedCity !== 'all',
    selectedMonth !== 'all',
    priceRange !== 'all',
  ].filter(Boolean).length;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#479B67]/5 to-background">
      <div className="container mx-auto max-w-7xl p-4 space-y-6 animate-in fade-in duration-500">
        <header className="flex items-center gap-4 pt-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/mbongo-dashboard">
              <ArrowLeft />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="font-headline text-2xl font-bold bg-gradient-to-r from-[#479B67] to-[#479B67] bg-clip-text text-transparent">
              Billeterie Événements
            </h1>
            <p className="text-sm text-muted-foreground">
              {filteredEvents.length} événement{filteredEvents.length > 1 ? 's' : ''} disponible{filteredEvents.length > 1 ? 's' : ''}
            </p>
          </div>
        </header>

        {/* Carrousel d'événements vedettes */}
        <div className="relative h-52 rounded-2xl overflow-hidden shadow-xl">
          {FEATURED_EVENTS.map((featured, index) => (
            <div
              key={featured.id}
              className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                index === currentFeaturedIndex 
                  ? 'opacity-100 translate-x-0' 
                  : index < currentFeaturedIndex 
                    ? 'opacity-0 -translate-x-full' 
                    : 'opacity-0 translate-x-full'
              }`}
            >
              <div className="relative h-full w-full">
                <Image
                  src={featured.image}
                  alt={featured.title}
                  fill
                  className="object-cover"
                />
                <div className={`absolute inset-0 bg-gradient-to-r ${featured.gradient} opacity-85`} />
                
                <div className="relative h-full flex items-center justify-between p-6 text-white">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-yellow-400 text-yellow-900 hover:bg-yellow-400">
                        Événement Vedette
                      </Badge>
                    </div>
                    <h3 className="text-2xl font-bold">{featured.title}</h3>
                    <p className="text-sm opacity-90">{featured.subtitle}</p>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>{featured.date}</span>
                    </div>
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => router.push(`/dashboard/events/${featured.eventId}`)}
                      className="mt-2"
                    >
                      <Ticket className="w-4 h-4 mr-2" />
                      Réserver
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {FEATURED_EVENTS.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentFeaturedIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentFeaturedIndex 
                    ? 'w-8 bg-white' 
                    : 'w-2 bg-white/50 hover:bg-white/75'
                }`}
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
                placeholder="Rechercher un événement, lieu..."
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
                  <SheetDescription>Affinez votre recherche d'événements</SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-4 overflow-y-auto max-h-[calc(85vh-180px)]">
                  <div className="space-y-2">
                    <Label>Type d'événement</Label>
                    <Select value={selectedType} onValueChange={setSelectedType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {types.map(t => (
                          <SelectItem key={t} value={t}>
                            {t === 'all' ? 'Tous les types' : t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Catégorie</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(c => (
                          <SelectItem key={c} value={c}>
                            {c === 'all' ? 'Toutes les catégories' : c}
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
                    <Label>Mois</Label>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map(m => (
                          <SelectItem key={m} value={m}>
                            {m === 'all' ? 'Tous les mois' : m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Gamme de prix</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'all', label: 'Tous' },
                        { value: 'free', label: 'Gratuit' },
                        { value: 'low', label: '0-20 USD' },
                        { value: 'medium', label: '20-50 USD' },
                        { value: 'high', label: '50+ USD' },
                      ].map(range => (
                        <Button
                          key={range.value}
                          variant={priceRange === range.value ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setPriceRange(range.value)}
                        >
                          {range.label}
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
              variant={sortBy === 'date' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('date')}
            >
              Date
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

        {/* Liste des événements */}
        {filteredEvents.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Aucun événement trouvé avec ces critères</p>
              <Button variant="link" onClick={resetFilters} className="mt-2">
                Réinitialiser les filtres
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEvents.map(event => (
              <Card
                key={event.id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => router.push(`/dashboard/events/${event.id}`)}
              >
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={event.image}
                    alt={event.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  {event.featured && (
                    <Badge className="absolute top-2 right-2 bg-gradient-to-r from-[#479B67] to-[#479B67]">
                      Vedette
                    </Badge>
                  )}
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="bg-white/90 text-foreground">
                      {event.type}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="font-bold text-lg line-clamp-1">{event.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <MapPin className="w-3 h-3" />
                      <span className="line-clamp-1">{event.venue}, {event.city}</span>
                    </div>
                  </div>

                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>{formatDate(event.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>{event.time}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">À partir de</p>
                      <p className="text-xl font-bold text-primary">
                        {event.price === 0 ? 'Gratuit' : `${event.price} ${event.currency}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Disponibles</p>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span className="font-semibold">{event.ticketsAvailable}</span>
                      </div>
                    </div>
                  </div>

                  <Button className="w-full" size="sm">
                    <Ticket className="w-4 h-4 mr-2" />
                    Réserver
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

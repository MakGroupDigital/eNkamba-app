'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, MapPin, Star, Wifi, Coffee, Car, Utensils, Users, Calendar, CheckCircle2, Download, Share2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import html2canvas from 'html2canvas';

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
  images: string[];
}

interface RoomType {
  id: string;
  name: string;
  capacity: number;
  price: number;
  available: number;
  description: string;
}

interface BookingInfo {
  checkIn: string;
  checkOut: string;
  guests: number;
  roomType: RoomType | null;
  fullName: string;
  phone: string;
  email: string;
}

interface BookingReceipt {
  id: string;
  date: string;
  hotel: Hotel;
  booking: BookingInfo;
  totalPrice: number;
  nights: number;
}

// Base de données (même que la page principale)
const HOTELS_DB = [
  {
    id: 'hotel-001',
    name: 'Grand Hôtel Kinshasa',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
    ],
    rating: 4.8,
    reviews: 234,
    price: 150,
    currency: 'USD' as const,
    continent: 'Afrique',
    country: 'RD Congo',
    city: 'Kinshasa',
    region: 'Kinshasa',
    commune: 'Gombe',
    address: 'Avenue du Port, Gombe',
    description: 'Hôtel de luxe au cœur de Kinshasa avec vue sur le fleuve Congo. Profitez de nos installations modernes et de notre service exceptionnel.',
    amenities: ['Wifi', 'Restaurant', 'Parking', 'Piscine', 'Spa', 'Salle de sport'],
    roomTypes: [
      { id: 'r1', name: 'Chambre Standard', capacity: 2, price: 150, available: 5, description: 'Chambre confortable avec vue sur la ville' },
      { id: 'r2', name: 'Suite Deluxe', capacity: 3, price: 250, available: 3, description: 'Suite spacieuse avec salon' },
      { id: 'r3', name: 'Suite Présidentielle', capacity: 4, price: 500, available: 1, description: 'Suite de luxe avec terrasse privée' },
    ],
  },
  // Ajoutez les autres hôtels ici...
];

const amenityIcons: Record<string, any> = {
  'Wifi': Wifi,
  'Restaurant': Utensils,
  'Parking': Car,
  'Piscine': Coffee,
  'Spa': Coffee,
  'Salle de sport': Coffee,
  'Bar': Coffee,
  'Centre d\'affaires': Coffee,
  'Jardin': Coffee,
  'Salle de conférence': Coffee,
};

export default function HotelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const receiptRef = useRef<HTMLDivElement>(null);

  const hotelId = params?.id as string | undefined;
  const hotel = hotelId ? HOTELS_DB.find(h => h.id === hotelId) : undefined;
  
  const [step, setStep] = useState<'details' | 'booking' | 'payment' | 'receipt'>('details');
  const [booking, setBooking] = useState<BookingInfo>({
    checkIn: '',
    checkOut: '',
    guests: 1,
    roomType: null,
    fullName: '',
    phone: '',
    email: '',
  });
  const [receipt, setReceipt] = useState<BookingReceipt | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  if (!hotel) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">Hôtel non trouvé</p>
            <Button asChild>
              <Link href="/dashboard/hotels">Retour aux hôtels</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const calculateNights = () => {
    if (!booking.checkIn || !booking.checkOut) return 0;
    const start = new Date(booking.checkIn);
    const end = new Date(booking.checkOut);
    const diff = end.getTime() - start.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const calculateTotal = () => {
    if (!booking.roomType) return 0;
    return booking.roomType.price * calculateNights();
  };

  const handleSelectRoom = (room: RoomType) => {
    setBooking(prev => ({ ...prev, roomType: room }));
    setStep('booking');
  };

  const handlePayment = async () => {
    if (!booking.roomType || !booking.checkIn || !booking.checkOut || !booking.fullName || !booking.phone) {
      toast({
        variant: "destructive",
        title: "Informations manquantes",
        description: "Veuillez remplir tous les champs obligatoires.",
      });
      return;
    }

    if (calculateNights() < 1) {
      toast({
        variant: "destructive",
        title: "Dates invalides",
        description: "La date de départ doit être après la date d'arrivée.",
      });
      return;
    }

    setIsPaying(true);
    setStep('payment');

    await new Promise(resolve => setTimeout(resolve, 2000));

    const newReceipt: BookingReceipt = {
      id: `ENK-HTL-${Date.now()}`,
      date: new Date().toISOString(),
      hotel,
      booking,
      totalPrice: calculateTotal(),
      nights: calculateNights(),
    };

    setReceipt(newReceipt);
    setIsPaying(false);
    setStep('receipt');

    toast({
      title: "Réservation confirmée !",
      description: `Votre séjour au ${hotel.name} est confirmé.`,
    });
  };

  const handleDownloadReceipt = async () => {
    if (receiptRef.current) {
      try {
        const canvas = await html2canvas(receiptRef.current, {
          backgroundColor: '#ffffff',
          scale: 2,
          logging: false,
        });
        
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `reservation-hotel-${receipt?.id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          title: "Reçu téléchargé",
          description: "Le reçu a été téléchargé avec succès.",
        });
      } catch (error) {
        console.error('Erreur téléchargement:', error);
      }
    }
  };

  const handleShareReceipt = async () => {
    if (receiptRef.current) {
      try {
        const canvas = await html2canvas(receiptRef.current, {
          backgroundColor: '#ffffff',
          scale: 2,
          logging: false,
        });
        
        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], `reservation-${receipt?.id}.png`, { type: 'image/png' });
            
            if (navigator.share && navigator.canShare({ files: [file] })) {
              await navigator.share({
                title: 'Réservation d\'hôtel',
                text: `Réservation confirmée - ${receipt?.id}`,
                files: [file],
              });
            } else {
              toast({
                title: "Partage non disponible",
                description: "Utilisez le bouton de téléchargement.",
              });
            }
          }
        });
      } catch (error) {
        console.error('Erreur partage:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#073B9A]/5 to-background">
      <div className="container mx-auto max-w-6xl p-4 space-y-6 animate-in fade-in duration-500">
        <header className="flex items-center gap-4 pt-4">
          <Button variant="ghost" size="icon" onClick={() => {
            if (step === 'details') {
              router.push('/dashboard/hotels');
            } else {
              setStep('details');
            }
          }}>
            <ArrowLeft />
          </Button>
          <div className="flex-1">
            <h1 className="font-headline text-2xl font-bold">{hotel.name}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{hotel.address}, {hotel.commune}, {hotel.city}</span>
            </div>
          </div>
        </header>

        {/* Détails de l'hôtel */}
        {step === 'details' && (
          <div className="space-y-6">
            {/* Galerie d'images */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 relative h-96 rounded-xl overflow-hidden">
                <Image
                  src={hotel.images[0]}
                  alt={hotel.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
                {hotel.images.slice(1, 3).map((img, idx) => (
                  <div key={idx} className="relative h-44 rounded-xl overflow-hidden">
                    <Image
                      src={img}
                      alt={`${hotel.name} ${idx + 2}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Informations principales */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                    <span className="text-xl font-bold">{hotel.rating}</span>
                    <span className="text-muted-foreground">({hotel.reviews} avis)</span>
                  </div>
                  <Badge className="text-lg px-4 py-2">
                    À partir de {hotel.price} {hotel.currency}/nuit
                  </Badge>
                </div>

                <div>
                  <h3 className="font-bold text-lg mb-2">Description</h3>
                  <p className="text-muted-foreground">{hotel.description}</p>
                </div>

                <div>
                  <h3 className="font-bold text-lg mb-3">Équipements</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {hotel.amenities.map((amenity, idx) => {
                      const Icon = amenityIcons[amenity] || Coffee;
                      return (
                        <div key={idx} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                          <Icon className="w-5 h-5 text-primary" />
                          <span className="text-sm">{amenity}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Types de chambres */}
            <div>
              <h2 className="font-bold text-xl mb-4">Choisissez votre chambre</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {hotel.roomTypes.map(room => (
                  <Card key={room.id} className="overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/10">
                      <CardTitle className="text-lg">{room.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      <p className="text-sm text-muted-foreground">{room.description}</p>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4" />
                        <span>{room.capacity} personne{room.capacity > 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div>
                          <p className="text-2xl font-bold text-primary">{room.price} {hotel.currency}</p>
                          <p className="text-xs text-muted-foreground">par nuit</p>
                        </div>
                        <Badge variant="outline">{room.available} dispo</Badge>
                      </div>
                      <Button 
                        className="w-full" 
                        onClick={() => handleSelectRoom(room)}
                        disabled={room.available === 0}
                      >
                        {room.available > 0 ? 'Réserver' : 'Complet'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Formulaire de réservation */}
        {step === 'booking' && booking.roomType && (
          <Card>
            <CardHeader>
              <CardTitle>Informations de réservation</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge>{booking.roomType.name}</Badge>
                <Badge variant="outline">{booking.roomType.price} {hotel.currency}/nuit</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date d'arrivée *</Label>
                  <Input
                    type="date"
                    value={booking.checkIn}
                    onChange={(e) => setBooking(prev => ({ ...prev, checkIn: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date de départ *</Label>
                  <Input
                    type="date"
                    value={booking.checkOut}
                    onChange={(e) => setBooking(prev => ({ ...prev, checkOut: e.target.value }))}
                    min={booking.checkIn || new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Nombre de personnes *</Label>
                <Input
                  type="number"
                  min={1}
                  max={booking.roomType.capacity}
                  value={booking.guests}
                  onChange={(e) => setBooking(prev => ({ ...prev, guests: parseInt(e.target.value) }))}
                />
                <p className="text-xs text-muted-foreground">
                  Capacité maximale: {booking.roomType.capacity} personne{booking.roomType.capacity > 1 ? 's' : ''}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Nom complet *</Label>
                <Input
                  value={booking.fullName}
                  onChange={(e) => setBooking(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Ex: Jean Mukendi"
                />
              </div>

              <div className="space-y-2">
                <Label>Téléphone *</Label>
                <Input
                  value={booking.phone}
                  onChange={(e) => setBooking(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Ex: +243 XXX XXX XXX"
                />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={booking.email}
                  onChange={(e) => setBooking(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Ex: jean@example.com"
                />
              </div>

              {calculateNights() > 0 && (
                <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/10 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Nombre de nuits:</span>
                    <span className="font-semibold">{calculateNights()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Prix par nuit:</span>
                    <span className="font-semibold">{booking.roomType.price} {hotel.currency}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="font-bold">Total à payer:</span>
                    <span className="text-2xl font-bold text-primary">{calculateTotal()} {hotel.currency}</span>
                  </div>
                </div>
              )}

              <Button className="w-full h-12 bg-gradient-to-r from-primary to-primary" onClick={handlePayment}>
                Confirmer et payer
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Paiement en cours */}
        {step === 'payment' && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-xl font-bold mb-2">Paiement en cours...</h3>
              <p className="text-muted-foreground">Veuillez patienter</p>
            </CardContent>
          </Card>
        )}

        {/* Reçu */}
        {step === 'receipt' && receipt && (
          <div className="space-y-6">
            <div ref={receiptRef} className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-[#073B9A] to-[#073B9A] p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                      <Image src="/kenz-logo.png" alt="Kenz" width={32} height={32} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Kenz Pay</h2>
                      <p className="text-sm opacity-90">Confirmation de réservation</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm opacity-90">Référence</p>
                    <p className="font-mono font-bold text-lg">{receipt.id}</p>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <CheckCircle2 className="w-16 h-16" />
                </div>
                <p className="text-center text-xl font-bold mt-2">Réservation confirmée</p>
              </div>

              <div className="p-6 space-y-6">
                <div className="text-center py-6 border-b">
                  <p className="text-sm text-muted-foreground mb-2">Montant total payé</p>
                  <p className="text-4xl font-bold text-primary">
                    {receipt.totalPrice} {receipt.hotel.currency}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {new Date(receipt.date).toLocaleDateString('fr-FR', { 
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-muted-foreground mb-3">HÔTEL</h3>
                  <div className="space-y-2">
                    <p className="font-bold text-lg">{receipt.hotel.name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{receipt.hotel.address}, {receipt.hotel.commune}, {receipt.hotel.city}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                      <span className="font-semibold">{receipt.hotel.rating}</span>
                      <span className="text-sm text-muted-foreground">({receipt.hotel.reviews} avis)</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-muted-foreground mb-3">DÉTAILS DE LA RÉSERVATION</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Type de chambre:</span>
                      <span className="font-semibold">{receipt.booking.roomType?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Arrivée:</span>
                      <span className="font-semibold">
                        {new Date(receipt.booking.checkIn).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Départ:</span>
                      <span className="font-semibold">
                        {new Date(receipt.booking.checkOut).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Nombre de nuits:</span>
                      <span className="font-semibold">{receipt.nights}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Nombre de personnes:</span>
                      <span className="font-semibold">{receipt.booking.guests}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-muted-foreground mb-3">CLIENT</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Nom:</span>
                      <span className="font-semibold">{receipt.booking.fullName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Téléphone:</span>
                      <span className="font-semibold">{receipt.booking.phone}</span>
                    </div>
                    {receipt.booking.email && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Email:</span>
                        <span className="text-sm">{receipt.booking.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t text-center space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Présentez ce reçu à votre arrivée à l'hôtel. Un email de confirmation a été envoyé.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Kenz Pay © {new Date().getFullYear()} - Tous droits réservés
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button variant="outline" onClick={handleDownloadReceipt} className="gap-2">
                <Download className="w-4 h-4" />
                Télécharger
              </Button>
              <Button variant="outline" onClick={handleShareReceipt} className="gap-2">
                <Share2 className="w-4 h-4" />
                Partager
              </Button>
              <Button onClick={() => router.push('/dashboard/hotels')} className="gap-2">
                Retour aux hôtels
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

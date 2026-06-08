'use client';

import { useState, useRef, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plane, Calendar, Users, CheckCircle2, Download, Share2, MapPin } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import html2canvas from 'html2canvas';
import Image from 'next/image';

interface PassengerInfo {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  passportNumber: string;
}

interface BookingInfo {
  email: string;
  phone: string;
  passengers: PassengerInfo[];
}

interface BookingReceipt {
  id: string;
  bookingDate: string;
  flight: any;
  booking: BookingInfo;
  totalPrice: number;
  pnr: string;
}

function FlightBookingContent() {
  const router = useRouter();
  const { toast } = useToast();
  const receiptRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();

  const flightId = searchParams?.get('flightId') || '';
  const from = searchParams?.get('from') || '';
  const to = searchParams?.get('to') || '';
  const departDate = searchParams?.get('departDate') || '';
  const passengers = parseInt(searchParams?.get('passengers') || '1');
  const cabinClass = searchParams?.get('cabinClass') || 'economy';

  // Simuler les données du vol (normalement récupérées via API)
  const flight = {
    id: flightId,
    airline: 'Ethiopian Airlines',
    airlineLogo: '🇪🇹',
    flightNumber: 'ET 809',
    from,
    to,
    departTime: '14:30',
    arriveTime: '20:45',
    duration: '6h 15m',
    stops: 0,
    price: 850,
    currency: 'USD',
    cabinClass,
    aircraft: 'Boeing 787',
    date: departDate,
  };

  const [step, setStep] = useState<'booking' | 'payment' | 'receipt'>('booking');
  const [booking, setBooking] = useState<BookingInfo>({
    email: '',
    phone: '',
    passengers: Array(passengers).fill(null).map(() => ({
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      passportNumber: '',
    })),
  });
  const [receipt, setReceipt] = useState<BookingReceipt | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  const calculateTotal = () => {
    return flight.price * passengers;
  };

  const handlePayment = async () => {
    // Validation
    if (!booking.email || !booking.phone) {
      toast({
        variant: "destructive",
        title: "Informations manquantes",
        description: "Veuillez remplir votre email et téléphone.",
      });
      return;
    }

    for (let i = 0; i < booking.passengers.length; i++) {
      const p = booking.passengers[i];
      if (!p.firstName || !p.lastName || !p.dateOfBirth || !p.passportNumber) {
        toast({
          variant: "destructive",
          title: "Informations manquantes",
          description: `Veuillez remplir toutes les informations du passager ${i + 1}.`,
        });
        return;
      }
    }

    setIsPaying(true);
    setStep('payment');

    await new Promise(resolve => setTimeout(resolve, 2500));

    const newReceipt: BookingReceipt = {
      id: `ENK-FLT-${Date.now()}`,
      bookingDate: new Date().toISOString(),
      flight,
      booking,
      totalPrice: calculateTotal(),
      pnr: `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 9000) + 1000}`,
    };

    setReceipt(newReceipt);
    setIsPaying(false);
    setStep('receipt');

    toast({
      title: "Réservation confirmée !",
      description: `Votre vol a été réservé avec succès. PNR: ${newReceipt.pnr}`,
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
        link.download = `billet-avion-${receipt?.id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          title: "Billet téléchargé",
          description: "Le billet a été téléchargé avec succès.",
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
            const file = new File([blob], `billet-${receipt?.id}.png`, { type: 'image/png' });
            
            if (navigator.share && navigator.canShare({ files: [file] })) {
              await navigator.share({
                title: 'Billet d\'avion',
                text: `Billet confirmé - PNR: ${receipt?.pnr}`,
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

  const cabinClassLabels: Record<string, string> = {
    'economy': 'Économique',
    'premium-economy': 'Économique Premium',
    'business': 'Affaires',
    'first': 'Première Classe',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#32BB78]/5 to-background">
      <div className="container mx-auto max-w-6xl p-4 space-y-6 animate-in fade-in duration-500">
        <header className="flex items-center gap-4 pt-4">
          <Button variant="ghost" size="icon" onClick={() => {
            if (step === 'booking') {
              router.back();
            } else {
              setStep('booking');
            }
          }}>
            <ArrowLeft />
          </Button>
          <div className="flex-1">
            <h1 className="font-headline text-2xl font-bold">Réservation de vol</h1>
            <p className="text-sm text-muted-foreground">{flight.flightNumber} - {flight.airline}</p>
          </div>
        </header>

        {/* Formulaire de réservation */}
        {step === 'booking' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Informations de contact */}
              <Card>
                <CardHeader>
                  <CardTitle>Informations de contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={booking.email}
                      onChange={(e) => setBooking(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="votre@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Téléphone *</Label>
                    <Input
                      value={booking.phone}
                      onChange={(e) => setBooking(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+243 XXX XXX XXX"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Informations des passagers */}
              {booking.passengers.map((passenger, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle>Passager {index + 1}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Prénom *</Label>
                        <Input
                          value={passenger.firstName}
                          onChange={(e) => {
                            const newPassengers = [...booking.passengers];
                            newPassengers[index].firstName = e.target.value;
                            setBooking(prev => ({ ...prev, passengers: newPassengers }));
                          }}
                          placeholder="Jean"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Nom *</Label>
                        <Input
                          value={passenger.lastName}
                          onChange={(e) => {
                            const newPassengers = [...booking.passengers];
                            newPassengers[index].lastName = e.target.value;
                            setBooking(prev => ({ ...prev, passengers: newPassengers }));
                          }}
                          placeholder="Mukendi"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Date de naissance *</Label>
                        <Input
                          type="date"
                          value={passenger.dateOfBirth}
                          onChange={(e) => {
                            const newPassengers = [...booking.passengers];
                            newPassengers[index].dateOfBirth = e.target.value;
                            setBooking(prev => ({ ...prev, passengers: newPassengers }));
                          }}
                          max={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Numéro de passeport *</Label>
                        <Input
                          value={passenger.passportNumber}
                          onChange={(e) => {
                            const newPassengers = [...booking.passengers];
                            newPassengers[index].passportNumber = e.target.value.toUpperCase();
                            setBooking(prev => ({ ...prev, passengers: newPassengers }));
                          }}
                          placeholder="AB1234567"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Récapitulatif */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader className="bg-gradient-to-r from-blue-600/10 to-cyan-800/10">
                  <CardTitle>Récapitulatif</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{flight.airlineLogo}</div>
                      <div>
                        <p className="font-bold">{flight.airline}</p>
                        <p className="text-sm text-muted-foreground">{flight.flightNumber}</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Départ:</span>
                        <span className="font-semibold">{from} - {flight.departTime}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Arrivée:</span>
                        <span className="font-semibold">{to} - {flight.arriveTime}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Date:</span>
                        <span className="font-semibold">
                          {new Date(flight.date).toLocaleDateString('fr-FR', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Durée:</span>
                        <span className="font-semibold">{flight.duration}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Classe:</span>
                        <span className="font-semibold">{cabinClassLabels[flight.cabinClass]}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Prix par billet:</span>
                        <span className="font-semibold">{flight.price} {flight.currency}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Nombre de passagers:</span>
                        <span className="font-semibold">{passengers}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t">
                      <div className="flex justify-between items-center">
                        <span className="font-bold">Total:</span>
                        <span className="text-3xl font-bold text-primary">
                          {calculateTotal()} {flight.currency}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button 
                    className="w-full h-12 bg-gradient-to-r from-primary to-primary"
                    onClick={handlePayment}
                  >
                    Confirmer et payer
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    Paiement sécurisé via eNkambaPay
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Paiement en cours */}
        {step === 'payment' && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-xl font-bold mb-2">Paiement en cours...</h3>
              <p className="text-muted-foreground">Veuillez patienter pendant que nous traitons votre réservation</p>
            </CardContent>
          </Card>
        )}

        {/* Billet électronique */}
        {step === 'receipt' && receipt && (
          <div className="space-y-6">
            <div ref={receiptRef} className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-cyan-800 p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                      <Image src="/enkamba-logo.png" alt="eNkamba" width={32} height={32} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">eNkambaPay</h2>
                      <p className="text-sm opacity-90">Billet électronique</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm opacity-90">PNR</p>
                    <p className="font-mono font-bold text-2xl">{receipt.pnr}</p>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <CheckCircle2 className="w-16 h-16" />
                </div>
                <p className="text-center text-xl font-bold mt-2">Réservation confirmée</p>
              </div>

              <div className="p-6 space-y-6">
                <div className="text-center py-6 border-b">
                  <p className="text-sm text-muted-foreground mb-2">Montant payé</p>
                  <p className="text-4xl font-bold text-primary">
                    {receipt.totalPrice} {receipt.flight.currency}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {new Date(receipt.bookingDate).toLocaleDateString('fr-FR', { 
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-muted-foreground mb-3">DÉTAILS DU VOL</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{receipt.flight.airlineLogo}</div>
                      <div>
                        <p className="font-bold text-lg">{receipt.flight.airline}</p>
                        <p className="text-sm text-muted-foreground">{receipt.flight.flightNumber}</p>
                        <p className="text-xs text-muted-foreground">{receipt.flight.aircraft}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                      <div>
                        <p className="text-xs text-muted-foreground">Départ</p>
                        <p className="font-bold text-lg">{receipt.flight.from}</p>
                        <p className="text-sm">{receipt.flight.departTime}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Arrivée</p>
                        <p className="font-bold text-lg">{receipt.flight.to}</p>
                        <p className="text-sm">{receipt.flight.arriveTime}</p>
                      </div>
                    </div>

                    <div className="flex justify-between text-sm pt-3 border-t">
                      <span className="text-muted-foreground">Date:</span>
                      <span className="font-semibold">
                        {new Date(receipt.flight.date).toLocaleDateString('fr-FR', { 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Durée:</span>
                      <span className="font-semibold">{receipt.flight.duration}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Classe:</span>
                      <Badge>{cabinClassLabels[receipt.flight.cabinClass]}</Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-muted-foreground mb-3">PASSAGERS</h3>
                  <div className="space-y-3">
                    {receipt.booking.passengers.map((passenger, index) => (
                      <div key={index} className="p-3 rounded-lg bg-muted/50">
                        <p className="font-bold">
                          {passenger.firstName} {passenger.lastName}
                        </p>
                        <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Date de naissance:</span>
                            <p className="font-semibold">
                              {new Date(passenger.dateOfBirth).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Passeport:</span>
                            <p className="font-semibold font-mono">{passenger.passportNumber}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-muted-foreground mb-3">CONTACT</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-semibold">{receipt.booking.email}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Téléphone:</span>
                      <span className="font-semibold">{receipt.booking.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Code-barres simulé */}
                <div className="flex justify-center py-6 border-y">
                  <div className="text-center">
                    <div className="h-24 w-64 bg-gradient-to-r from-black via-gray-800 to-black flex items-center justify-center">
                      <p className="text-white font-mono text-xs">{receipt.id}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Code de réservation</p>
                  </div>
                </div>

                <div className="pt-6 border-t text-center space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Présentez ce billet à l'enregistrement. Arrivez à l'aéroport 3 heures avant le départ pour les vols internationaux.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    eNkambaPay © {new Date().getFullYear()} - Tous droits réservés
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
              <Button onClick={() => router.push('/dashboard/flights')} className="gap-2">
                Nouvelle recherche
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FlightBookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    }>
      <FlightBookingContent />
    </Suspense>
  );
}

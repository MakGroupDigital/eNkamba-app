'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, MapPin, Calendar, Clock, Users, Ticket, CheckCircle2, Download, Share2, Tag } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import html2canvas from 'html2canvas';

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
  tags: string[];
  images: string[];
}

interface TicketInfo {
  quantity: number;
  fullName: string;
  phone: string;
  email: string;
}

interface TicketReceipt {
  id: string;
  date: string;
  event: Event;
  ticket: TicketInfo;
  totalPrice: number;
  qrCode: string;
}

// Base de données (même que la page principale)
const EVENTS_DB = [
  {
    id: 'event-001',
    name: 'Festival Amani 2024',
    image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
    images: [
      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
      'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800',
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
    ],
    type: 'Festival',
    category: 'Musique',
    date: '2024-06-15',
    time: '18:00',
    venue: 'Stade des Martyrs',
    city: 'Kinshasa',
    country: 'RD Congo',
    address: 'Boulevard Triomphal, Kinshasa',
    description: 'Le plus grand festival de musique de la RDC avec des artistes internationaux et locaux. Une expérience musicale inoubliable avec plus de 20 artistes sur scène.',
    organizer: 'Amani Productions',
    price: 50,
    currency: 'USD' as const,
    ticketsAvailable: 5000,
    totalTickets: 10000,
    tags: ['Musique', 'Festival', 'Outdoor', 'Famille'],
  },
  {
    id: 'event-002',
    name: 'Fally Ipupa Live Concert',
    image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800',
    images: [
      'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800',
      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
    ],
    type: 'Concert',
    category: 'Musique',
    date: '2024-06-25',
    time: '20:00',
    venue: 'Pullman Grand Hôtel',
    city: 'Kinshasa',
    country: 'RD Congo',
    address: '4 Avenue Batetela, Gombe',
    description: 'Concert exclusif de Fally Ipupa, l\'artiste congolais le plus populaire. Une soirée exceptionnelle avec ses plus grands hits.',
    organizer: 'Dicap Music',
    price: 100,
    currency: 'USD' as const,
    ticketsAvailable: 800,
    totalTickets: 1000,
    tags: ['Musique', 'Concert', 'VIP', 'Rumba'],
  },
  // Ajoutez les autres événements ici...
];

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const receiptRef = useRef<HTMLDivElement>(null);

  const eventId = params?.id as string | undefined;
  const event = eventId ? EVENTS_DB.find(e => e.id === eventId) : undefined;
  
  const [step, setStep] = useState<'details' | 'booking' | 'payment' | 'receipt'>('details');
  const [ticket, setTicket] = useState<TicketInfo>({
    quantity: 1,
    fullName: '',
    phone: '',
    email: '',
  });
  const [receipt, setReceipt] = useState<TicketReceipt | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">Événement non trouvé</p>
            <Button asChild>
              <Link href="/dashboard/events">Retour aux événements</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const calculateTotal = () => {
    return event.price * ticket.quantity;
  };

  const handleBooking = () => {
    if (ticket.quantity < 1 || ticket.quantity > event.ticketsAvailable) {
      toast({
        variant: "destructive",
        title: "Quantité invalide",
        description: `Veuillez choisir entre 1 et ${event.ticketsAvailable} billets.`,
      });
      return;
    }
    setStep('booking');
  };

  const handlePayment = async () => {
    if (!ticket.fullName || !ticket.phone) {
      toast({
        variant: "destructive",
        title: "Informations manquantes",
        description: "Veuillez remplir tous les champs obligatoires.",
      });
      return;
    }

    setIsPaying(true);
    setStep('payment');

    await new Promise(resolve => setTimeout(resolve, 2000));

    const newReceipt: TicketReceipt = {
      id: `ENK-TKT-${Date.now()}`,
      date: new Date().toISOString(),
      event,
      ticket,
      totalPrice: calculateTotal(),
      qrCode: `QR-${Date.now()}`,
    };

    setReceipt(newReceipt);
    setIsPaying(false);
    setStep('receipt');

    toast({
      title: "Réservation confirmée !",
      description: `Vos ${ticket.quantity} billet(s) pour ${event.name} sont confirmés.`,
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
        link.download = `billet-${receipt?.id}.png`;
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
                title: 'Billet d\'événement',
                text: `Billet confirmé - ${receipt?.id}`,
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#479B67]/5 to-background">
      <div className="container mx-auto max-w-6xl p-4 space-y-6 animate-in fade-in duration-500">
        <header className="flex items-center gap-4 pt-4">
          <Button variant="ghost" size="icon" onClick={() => {
            if (step === 'details') {
              router.push('/dashboard/events');
            } else {
              setStep('details');
            }
          }}>
            <ArrowLeft />
          </Button>
          <div className="flex-1">
            <h1 className="font-headline text-2xl font-bold">{event.name}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{event.venue}, {event.city}</span>
            </div>
          </div>
        </header>

        {/* Détails de l'événement */}
        {step === 'details' && (
          <div className="space-y-6">
            {/* Image principale */}
            <div className="relative h-96 rounded-2xl overflow-hidden">
              <Image
                src={event.images[0]}
                alt={event.name}
                fill
                className="object-cover"
              />
              <div className="absolute top-4 left-4">
                <Badge className="bg-white/90 text-foreground text-lg px-4 py-2">
                  {event.type}
                </Badge>
              </div>
            </div>

            {/* Informations principales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <h3 className="font-bold text-lg mb-2">Description</h3>
                      <p className="text-muted-foreground">{event.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <Calendar className="w-8 h-8 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Date</p>
                          <p className="font-semibold">{formatDate(event.date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <Clock className="w-8 h-8 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Heure</p>
                          <p className="font-semibold">{event.time}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <MapPin className="w-8 h-8 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Lieu</p>
                          <p className="font-semibold">{event.venue}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <Users className="w-8 h-8 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Disponibles</p>
                          <p className="font-semibold">{event.ticketsAvailable} / {event.totalTickets}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-muted-foreground mb-2">ORGANISATEUR</h3>
                      <p className="font-semibold">{event.organizer}</p>
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-muted-foreground mb-2">CATÉGORIES</h3>
                      <div className="flex flex-wrap gap-2">
                        {event.tags.map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Carte de réservation */}
              <div className="md:col-span-1">
                <Card className="sticky top-4">
                  <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/10">
                    <CardTitle>Réserver vos billets</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <p className="text-3xl font-bold text-primary">
                        {event.price === 0 ? 'Gratuit' : `${event.price} ${event.currency}`}
                      </p>
                      <p className="text-sm text-muted-foreground">par billet</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Nombre de billets</Label>
                      <Input
                        type="number"
                        min={1}
                        max={event.ticketsAvailable}
                        value={ticket.quantity}
                        onChange={(e) => setTicket(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                      />
                      <p className="text-xs text-muted-foreground">
                        Maximum: {event.ticketsAvailable} billets
                      </p>
                    </div>

                    {ticket.quantity > 0 && (
                      <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/10">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">Total:</span>
                          <span className="text-2xl font-bold text-primary">
                            {calculateTotal()} {event.currency}
                          </span>
                        </div>
                      </div>
                    )}

                    <Button 
                      className="w-full h-12 bg-gradient-to-r from-primary to-primary" 
                      onClick={handleBooking}
                      disabled={event.ticketsAvailable === 0}
                    >
                      <Ticket className="w-5 h-5 mr-2" />
                      {event.ticketsAvailable === 0 ? 'Complet' : 'Réserver maintenant'}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      Paiement sécurisé via eNkambaPay
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* Formulaire de réservation */}
        {step === 'booking' && (
          <Card>
            <CardHeader>
              <CardTitle>Informations de réservation</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge>{ticket.quantity} billet(s)</Badge>
                <Badge variant="outline">{calculateTotal()} {event.currency}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nom complet *</Label>
                <Input
                  value={ticket.fullName}
                  onChange={(e) => setTicket(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Ex: Jean Mukendi"
                />
              </div>

              <div className="space-y-2">
                <Label>Téléphone *</Label>
                <Input
                  value={ticket.phone}
                  onChange={(e) => setTicket(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Ex: +243 XXX XXX XXX"
                />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={ticket.email}
                  onChange={(e) => setTicket(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Ex: jean@example.com"
                />
              </div>

              <div className="p-4 rounded-lg bg-muted space-y-2">
                <h4 className="font-semibold">Récapitulatif</h4>
                <div className="flex justify-between text-sm">
                  <span>Événement:</span>
                  <span className="font-semibold">{event.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Date:</span>
                  <span className="font-semibold">{formatDate(event.date)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Nombre de billets:</span>
                  <span className="font-semibold">{ticket.quantity}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="font-bold">Total à payer:</span>
                  <span className="text-2xl font-bold text-primary">{calculateTotal()} {event.currency}</span>
                </div>
              </div>

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

        {/* Billet/Reçu */}
        {step === 'receipt' && receipt && (
          <div className="space-y-6">
            <div ref={receiptRef} className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-[#479B67] to-[#479B67] p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                      <Image src="/enkamba-logo.png" alt="eNkamba" width={32} height={32} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">eNkambaPay</h2>
                      <p className="text-sm opacity-90">Billet d'événement</p>
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
                  <p className="text-sm text-muted-foreground mb-2">Montant payé</p>
                  <p className="text-4xl font-bold text-primary">
                    {receipt.totalPrice} {receipt.event.currency}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {new Date(receipt.date).toLocaleDateString('fr-FR', { 
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-muted-foreground mb-3">ÉVÉNEMENT</h3>
                  <div className="space-y-2">
                    <p className="font-bold text-xl">{receipt.event.name}</p>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>{formatDate(receipt.event.date)} à {receipt.event.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{receipt.event.venue}, {receipt.event.city}</span>
                    </div>
                    <Badge className="mt-2">{receipt.event.type}</Badge>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-muted-foreground mb-3">DÉTAILS DU BILLET</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Nombre de billets:</span>
                      <span className="font-semibold">{receipt.ticket.quantity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Prix unitaire:</span>
                      <span className="font-semibold">{receipt.event.price} {receipt.event.currency}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-muted-foreground mb-3">TITULAIRE</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Nom:</span>
                      <span className="font-semibold">{receipt.ticket.fullName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Téléphone:</span>
                      <span className="font-semibold">{receipt.ticket.phone}</span>
                    </div>
                    {receipt.ticket.email && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Email:</span>
                        <span className="text-sm">{receipt.ticket.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* QR Code simulé */}
                <div className="flex justify-center py-6 border-y">
                  <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-32 h-32 bg-white border-4 border-foreground mx-auto mb-2"></div>
                      <p className="text-xs text-muted-foreground">Code QR</p>
                      <p className="text-xs font-mono">{receipt.qrCode}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t text-center space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Présentez ce billet à l'entrée de l'événement. Le code QR sera scanné pour validation.
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
              <Button onClick={() => router.push('/dashboard/events')} className="gap-2">
                Retour aux événements
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

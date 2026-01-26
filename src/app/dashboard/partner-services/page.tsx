'use client';

import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Zap, Search, Star, ArrowRight, Clock, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ServiceStatus = 'active' | 'inactive' | 'coming-soon';

interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  currency: string;
  rating: number;
  reviews: number;
  icon: string;
  status: ServiceStatus;
  provider: string;
}

const mockServices: Service[] = [
  {
    id: '1',
    name: 'Nettoyage Professionnel',
    category: 'Ménage',
    description: 'Service de nettoyage complet de votre domicile',
    price: 50000,
    currency: 'CDF',
    rating: 4.8,
    reviews: 245,
    icon: '🧹',
    status: 'active',
    provider: 'CleanPro',
  },
  {
    id: '2',
    name: 'Réparation Électrique',
    category: 'Maintenance',
    description: 'Réparation et installation électrique professionnelle',
    price: 75000,
    currency: 'CDF',
    rating: 4.9,
    reviews: 189,
    icon: '⚡',
    status: 'active',
    provider: 'ElectroFix',
  },
  {
    id: '3',
    name: 'Cours de Langue',
    category: 'Éducation',
    description: 'Cours particuliers d\'anglais, français ou swahili',
    price: 30000,
    currency: 'CDF',
    rating: 4.7,
    reviews: 312,
    icon: '📚',
    status: 'active',
    provider: 'LinguaPlus',
  },
  {
    id: '4',
    name: 'Consultation Juridique',
    category: 'Légal',
    description: 'Consultation avec avocat professionnel',
    price: 100000,
    currency: 'CDF',
    rating: 4.9,
    reviews: 156,
    icon: '⚖️',
    status: 'active',
    provider: 'LexConsult',
  },
  {
    id: '5',
    name: 'Coaching Fitness',
    category: 'Santé',
    description: 'Séances de coaching fitness personnalisées',
    price: 40000,
    currency: 'CDF',
    rating: 4.6,
    reviews: 428,
    icon: '💪',
    status: 'active',
    provider: 'FitLife',
  },
  {
    id: '6',
    name: 'Plomberie d\'Urgence',
    category: 'Maintenance',
    description: 'Service de plomberie 24/7 disponible',
    price: 60000,
    currency: 'CDF',
    rating: 4.8,
    reviews: 267,
    icon: '🔧',
    status: 'active',
    provider: 'PlumbPro',
  },
  {
    id: '7',
    name: 'Traduction Professionnelle',
    category: 'Services',
    description: 'Traduction de documents professionnels',
    price: 45000,
    currency: 'CDF',
    rating: 4.7,
    reviews: 134,
    icon: '📝',
    status: 'coming-soon',
    provider: 'TranslateHub',
  },
  {
    id: '8',
    name: 'Consultation Comptable',
    category: 'Affaires',
    description: 'Conseil comptable et fiscal pour entreprises',
    price: 120000,
    currency: 'CDF',
    rating: 4.9,
    reviews: 98,
    icon: '📊',
    status: 'coming-soon',
    provider: 'AcctPro',
  },
];

export default function PartnerServicesPage() {
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>(mockServices);
  const [showBookDialog, setShowBookDialog] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedService = selectedServiceId ? services.find(s => s.id === selectedServiceId) : null;

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: ServiceStatus) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700">Disponible</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-700">Indisponible</Badge>;
      case 'coming-soon':
        return <Badge className="bg-blue-100 text-blue-700">Bientôt</Badge>;
    }
  };

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.provider.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeServices = filteredServices.filter(s => s.status === 'active');
  const comingSoonServices = filteredServices.filter(s => s.status === 'coming-soon');

  const handleBookService = () => {
    if (!selectedServiceId) return;

    const service = services.find(s => s.id === selectedServiceId);
    if (!service) return;

    // Préparer les données de paiement pour le service
    const paymentData = {
      context: 'services',
      amount: service.price,
      description: `Réservation: ${service.name}`,
      metadata: {
        serviceId: service.id,
        serviceName: service.name,
        provider: service.provider,
        category: service.category,
        servicePrice: service.price,
        serviceCurrency: service.currency,
        type: 'service_booking'
      }
    };

    // Stocker les données
    sessionStorage.setItem('services_payment_data', JSON.stringify(paymentData));
    
    // Rediriger vers le paiement
    window.location.href = '/dashboard/pay?context=services';
  };

  return (
    <div className="container mx-auto max-w-4xl p-4 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex items-center gap-2">
        <Zap className="h-6 w-6 text-primary" />
        <h1 className="font-headline text-xl font-bold text-primary">
          Services Partenaires
        </h1>
      </header>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un service..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Services Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">Tous ({filteredServices.length})</TabsTrigger>
          <TabsTrigger value="active">Disponibles ({activeServices.length})</TabsTrigger>
          <TabsTrigger value="coming">Bientôt ({comingSoonServices.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredServices.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Aucun service trouvé</p>
              </CardContent>
            </Card>
          ) : (
            filteredServices.map((service) => (
              <Card key={service.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">{service.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <p className="font-headline font-semibold">{service.name}</p>
                          <p className="text-xs text-muted-foreground">{service.provider}</p>
                        </div>
                        {getStatusBadge(service.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{service.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          {service.rating} ({service.reviews} avis)
                        </span>
                        <span className="font-semibold text-primary">
                          {formatCurrency(service.price, service.currency)}
                        </span>
                      </div>
                    </div>
                    {service.status === 'active' && (
                      <Button
                        onClick={() => {
                          setSelectedServiceId(service.id);
                          setShowBookDialog(true);
                        }}
                        className="bg-primary hover:bg-primary/90"
                      >
                        Réserver <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {activeServices.map((service) => (
            <Card key={service.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{service.icon}</div>
                  <div className="flex-1">
                    <p className="font-headline font-semibold">{service.name}</p>
                    <p className="text-xs text-muted-foreground mb-2">{service.provider}</p>
                    <p className="text-sm text-muted-foreground mb-2">{service.description}</p>
                    <div className="flex items-center gap-2 text-sm">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{service.rating} ({service.reviews} avis)</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary mb-2">
                      {formatCurrency(service.price, service.currency)}
                    </p>
                    <Button
                      onClick={() => {
                        setSelectedServiceId(service.id);
                        setShowBookDialog(true);
                      }}
                      className="bg-primary hover:bg-primary/90"
                    >
                      Réserver
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="coming" className="space-y-4">
          {comingSoonServices.map((service) => (
            <Card key={service.id} className="hover:shadow-md transition-shadow opacity-75">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{service.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <p className="font-headline font-semibold">{service.name}</p>
                        <p className="text-xs text-muted-foreground">{service.provider}</p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-700">Bientôt</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{service.description}</p>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="text-blue-600">Disponible prochainement</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Book Dialog */}
      <Dialog open={showBookDialog} onOpenChange={setShowBookDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Réserver le service</DialogTitle>
            <DialogDescription>
              Confirmez la réservation de {selectedService?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedService && (
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg bg-muted space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Service :</span>
                  <span className="font-semibold">{selectedService.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Fournisseur :</span>
                  <span className="font-semibold text-sm">{selectedService.provider}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Catégorie :</span>
                  <span className="font-semibold text-sm">{selectedService.category}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-sm font-semibold">Tarif :</span>
                  <span className="font-bold text-primary">{formatCurrency(selectedService.price, selectedService.currency)}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBookDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleBookService}>
              Réserver maintenant <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

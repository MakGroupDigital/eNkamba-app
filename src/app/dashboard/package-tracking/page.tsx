'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Package, Search, AlertCircle, CheckCircle, Clock, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface TrackingInfo {
  trackingNumber: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'failed';
  sender: string;
  recipient: string;
  origin: string;
  destination: string;
  estimatedDelivery: string;
  lastUpdate: string;
  events: Array<{
    date: string;
    time: string;
    status: string;
    location: string;
  }>;
}

export default function PackageTrackingPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const hasAutoSearched = useRef(false);

  const handleSearch = useCallback(async (numberOverride?: string) => {
    const numberToSearch = (numberOverride ?? trackingNumber).trim();
    if (!numberToSearch) {
      setSearchError('Veuillez entrer un numéro de suivi');
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      // Rechercher la commande par numéro de suivi
      const { db } = await import('@/lib/firebase');
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      
      const ordersRef = collection(db, 'nkampa_orders');
      const q = query(ordersRef, where('trackingNumber', '==', numberToSearch));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setSearchError('Aucune commande trouvée avec ce numéro de suivi');
        toast({
          variant: 'destructive',
          title: 'Colis introuvable',
          description: 'Vérifiez le numéro de suivi et réessayez',
        });
        return;
      }

      const orderDoc = querySnapshot.docs[0];
      const orderData = orderDoc.data();

      // Récupérer les infos du vendeur
      const { doc: docRef, getDoc } = await import('firebase/firestore');
      const sellerDoc = await getDoc(docRef(db, 'users', orderData.sellerId));
      const sellerData = sellerDoc.exists() ? sellerDoc.data() : null;

      // Récupérer les infos de l'acheteur
      const buyerDoc = await getDoc(docRef(db, 'users', orderData.buyerId));
      const buyerData = buyerDoc.exists() ? buyerDoc.data() : null;

      // Mapper le statut de la commande au statut de suivi
      const statusMap: Record<string, 'pending' | 'in_transit' | 'delivered' | 'failed'> = {
        'pending': 'pending',
        'paid': 'in_transit',
        'processing': 'in_transit',
        'shipped': 'in_transit',
        'delivered': 'delivered',
        'cancelled': 'failed',
      };

      // Créer l'historique des événements
      const events = [];
      const createdDate = orderData.createdAt?.toDate?.() || new Date();
      
      events.push({
        date: createdDate.toLocaleDateString('fr-FR'),
        time: createdDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        status: 'Commande créée',
        location: sellerData?.location || 'Kinshasa',
      });

      if (orderData.status === 'paid' || orderData.status === 'processing' || orderData.status === 'shipped' || orderData.status === 'delivered') {
        events.push({
          date: createdDate.toLocaleDateString('fr-FR'),
          time: createdDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          status: 'Paiement confirmé',
          location: 'eNkamba',
        });
      }

      if (orderData.pickupRoute?.enabled) {
        events.push({
          date: createdDate.toLocaleDateString('fr-FR'),
          time: createdDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          status: 'Retrait en boutique disponible',
          location: orderData.pickupRoute.storeLocationLabel || 'Boutique Nkampa',
        });
      }

      if (orderData.status === 'shipped' || orderData.status === 'delivered') {
        const shippedDate = orderData.updatedAt?.toDate?.() || new Date();
        events.push({
          date: shippedDate.toLocaleDateString('fr-FR'),
          time: shippedDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          status: 'Colis expédié',
          location: sellerData?.location || 'Kinshasa',
        });
      }

      if (orderData.status === 'delivered') {
        const deliveredDate = orderData.updatedAt?.toDate?.() || new Date();
        events.push({
          date: deliveredDate.toLocaleDateString('fr-FR'),
          time: deliveredDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          status: 'Colis livré',
          location: orderData.shippingAddress || 'Destination',
        });
      }

      // Estimer la date de livraison (3-5 jours après la commande)
      const estimatedDelivery = new Date(createdDate);
      estimatedDelivery.setDate(estimatedDelivery.getDate() + 4);

      const trackingData: TrackingInfo = {
        trackingNumber: numberToSearch,
        status: statusMap[orderData.status] || 'pending',
        sender: sellerData?.fullName || 'Vendeur',
        recipient: buyerData?.fullName || 'Client',
        origin: sellerData?.location || 'Kinshasa',
        destination: orderData.shippingAddress || 'Destination',
        estimatedDelivery: estimatedDelivery.toLocaleDateString('fr-FR'),
        lastUpdate: (orderData.updatedAt?.toDate?.() || new Date()).toLocaleString('fr-FR'),
        events: events.reverse(), // Plus récent en premier
      };

      setTrackingInfo(trackingData);
      toast({
        title: 'Colis trouvé ✅',
        description: `Numéro de suivi: ${numberToSearch}`,
      });
    } catch (error) {
      console.error('Erreur recherche:', error);
      setSearchError('Erreur lors de la recherche. Veuillez réessayer.');
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de trouver le colis',
      });
    } finally {
      setIsSearching(false);
    }
  }, [trackingNumber, toast]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const prefilledTracking = (searchParams?.get('tracking') || '').trim();
    if (!prefilledTracking || hasAutoSearched.current) return;
    hasAutoSearched.current = true;
    setTrackingNumber(prefilledTracking);
    void handleSearch(prefilledTracking);
  }, [searchParams, handleSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'in_transit':
        return <Clock className="w-6 h-6 text-blue-600" />;
      case 'failed':
        return <AlertCircle className="w-6 h-6 text-red-600" />;
      default:
        return <Package className="w-6 h-6 text-gray-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'Livré';
      case 'in_transit':
        return 'En transit';
      case 'failed':
        return 'Problème de livraison';
      case 'pending':
        return 'En attente';
      default:
        return 'Inconnu';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-50 border-green-200';
      case 'in_transit':
        return 'bg-blue-50 border-blue-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="container mx-auto max-w-2xl p-4 flex flex-col min-h-screen bg-muted/20">
      {/* Header */}
      <header className="flex items-center gap-4 mb-6 flex-shrink-0">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/ugavi">
            <ArrowLeft />
          </Link>
        </Button>
        <h1 className="font-headline text-2xl font-bold text-primary flex-1">
          Suivi de Colis
        </h1>
      </header>

      {/* Search Section */}
      {!trackingInfo && (
        <Card className="mb-6">
          <CardContent className="p-6 space-y-4">
            <div>
              <Label htmlFor="tracking" className="text-base font-semibold">
                Numéro de Suivi
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                Entrez le numéro de suivi de votre colis
              </p>
            </div>

            <div className="flex gap-2">
              <Input
                id="tracking"
                placeholder="Ex: ENK-2026-001234"
                value={trackingNumber}
                onChange={(e) => {
                  setTrackingNumber(e.target.value);
                  setSearchError(null);
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                className="flex-1 h-12 text-base"
              />
              <Button
                onClick={() => void handleSearch()}
                disabled={isSearching || !trackingNumber.trim()}
                className="bg-primary hover:bg-primary/90 text-white h-12 px-6"
              >
                {isSearching ? (
                  <>
                    <div className="animate-spin mr-2">⏳</div>
                    Recherche...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Rechercher
                  </>
                )}
              </Button>
            </div>

            {searchError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription>{searchError}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tracking Info */}
      {trackingInfo && (
        <div className="space-y-6 flex-1">
          {/* Status Card */}
          <Card className={`border-2 ${getStatusColor(trackingInfo.status)}`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon(trackingInfo.status)}
                  <div>
                    <p className="text-sm text-gray-600">État du colis</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {getStatusLabel(trackingInfo.status)}
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-600">
                Numéro de suivi: <span className="font-mono font-semibold">{trackingInfo.trackingNumber}</span>
              </p>
            </CardContent>
          </Card>

          {/* Delivery Info */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold text-lg">Informations de Livraison</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Expéditeur</p>
                  <p className="font-semibold text-gray-900">{trackingInfo.sender}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Destinataire</p>
                  <p className="font-semibold text-gray-900">{trackingInfo.recipient}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Origine</p>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <p className="font-semibold text-gray-900">{trackingInfo.origin}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Destination</p>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <p className="font-semibold text-gray-900">{trackingInfo.destination}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Livraison Estimée</p>
                  <p className="font-semibold text-gray-900">{trackingInfo.estimatedDelivery}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Dernière Mise à Jour</p>
                  <p className="font-semibold text-gray-900">{trackingInfo.lastUpdate}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-6">Historique du Suivi</h3>

              <div className="space-y-6">
                {trackingInfo.events.map((event, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-4 h-4 rounded-full bg-primary" />
                      {index < trackingInfo.events.length - 1 && (
                        <div className="w-0.5 h-12 bg-gray-200 mt-2" />
                      )}
                    </div>
                    <div className="pb-6">
                      <p className="font-semibold text-gray-900">{event.status}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {event.date} à {event.time}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        {event.location}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pb-6">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setTrackingInfo(null);
                setTrackingNumber('');
                setSearchError(null);
              }}
            >
              Nouveau Suivi
            </Button>
            <Button
              className="flex-1 bg-primary hover:bg-primary/90 text-white"
              asChild
            >
              <Link href="/dashboard/nkampa">
                Retour à Nkampa
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!trackingInfo && !isSearching && (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
          <div className="bg-primary/10 rounded-full p-6 mb-4">
            <Package className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Suivez votre Colis
          </h2>
          <p className="text-gray-600 max-w-sm">
            Entrez votre numéro de suivi pour connaître l'état de votre livraison en temps réel
          </p>
        </div>
      )}
    </div>
  );
}

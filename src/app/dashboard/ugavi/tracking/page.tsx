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

export default function UgaviTrackingPage() {
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
      const { db } = await import('@/lib/firebase');
      const { collection, query, where, getDocs, doc: docRef, getDoc } = await import('firebase/firestore');

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
      const sellerDoc = await getDoc(docRef(db, 'users', orderData.sellerId));
      const sellerData = sellerDoc.exists() ? sellerDoc.data() : null;
      const buyerDoc = await getDoc(docRef(db, 'users', orderData.buyerId));
      const buyerData = buyerDoc.exists() ? buyerDoc.data() : null;

      const statusMap: Record<string, 'pending' | 'in_transit' | 'delivered' | 'failed'> = {
        pending: 'pending',
        paid: 'in_transit',
        processing: 'in_transit',
        shipped: 'in_transit',
        delivered: 'delivered',
        cancelled: 'failed',
      };

      const createdDate = orderData.createdAt?.toDate?.() || new Date();
      const events = [
        {
          date: createdDate.toLocaleDateString('fr-FR'),
          time: createdDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          status: 'Commande créée',
          location: sellerData?.location || 'Boutique Nkampa',
        },
      ];

      if (['paid', 'processing', 'shipped', 'delivered'].includes(orderData.status)) {
        events.push({
          date: createdDate.toLocaleDateString('fr-FR'),
          time: createdDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          status: 'Paiement confirmé',
          location: 'eNkambaPay',
        });
      }

      if (orderData.pickupRoute?.enabled) {
        events.push({
          date: createdDate.toLocaleDateString('fr-FR'),
          time: createdDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          status: 'Itinéraire boutique disponible',
          location: orderData.pickupRoute.storeLocationLabel || 'Boutique',
        });
      }

      if (['shipped', 'delivered'].includes(orderData.status)) {
        const shippedDate = orderData.shippedAt?.toDate?.() || orderData.updatedAt?.toDate?.() || new Date();
        events.push({
          date: shippedDate.toLocaleDateString('fr-FR'),
          time: shippedDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          status: 'Colis expédié',
          location: sellerData?.location || 'Kinshasa',
        });
      }

      if (orderData.status === 'delivered') {
        const deliveredDate = orderData.deliveredAt?.toDate?.() || orderData.updatedAt?.toDate?.() || new Date();
        events.push({
          date: deliveredDate.toLocaleDateString('fr-FR'),
          time: deliveredDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          status: 'Colis livré',
          location: orderData.shippingAddress || orderData.pickupRoute?.storeLocationLabel || 'Destination',
        });
      }

      const estimatedDelivery = new Date(createdDate);
      estimatedDelivery.setDate(estimatedDelivery.getDate() + (orderData.pickupRoute?.enabled ? 1 : 4));

      const trackingData: TrackingInfo = {
        trackingNumber: numberToSearch,
        status: statusMap[orderData.status] || 'pending',
        sender: sellerData?.fullName || sellerData?.displayName || orderData.sellerName || 'Vendeur',
        recipient: buyerData?.fullName || buyerData?.displayName || orderData.buyerName || 'Client',
        origin: sellerData?.location || orderData.pickupRoute?.storeLocationLabel || 'Kinshasa',
        destination: orderData.shippingAddress || orderData.pickupRoute?.storeLocationLabel || 'Destination',
        estimatedDelivery: estimatedDelivery.toLocaleDateString('fr-FR'),
        lastUpdate: (orderData.updatedAt?.toDate?.() || new Date()).toLocaleString('fr-FR'),
        events: events.reverse(),
      };

      setTrackingInfo(trackingData);
      toast({
        title: 'Colis trouvé ✅',
        description: `Numéro de suivi: ${numberToSearch}`,
      });
    } catch (error) {
      console.error('Erreur recherche suivi Ugavi:', error);
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
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'in_transit':
        return <Clock className="h-6 w-6 text-blue-600" />;
      case 'failed':
        return <AlertCircle className="h-6 w-6 text-red-600" />;
      default:
        return <Package className="h-6 w-6 text-gray-600" />;
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

  return (
    <div className="container mx-auto flex min-h-screen max-w-2xl flex-col bg-muted/20 p-4">
      <header className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/ugavi">
            <ArrowLeft />
          </Link>
        </Button>
        <h1 className="flex-1 text-2xl font-bold text-primary">Suivi de Colis Ugavi</h1>
      </header>

      {!trackingInfo && (
        <Card className="mb-6">
          <CardContent className="space-y-4 p-6">
            <div>
              <Label htmlFor="tracking" className="text-base font-semibold">
                Numéro de Suivi
              </Label>
              <p className="mt-1 text-sm text-gray-600">Entrez le numéro de suivi de votre colis</p>
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    void handleSearch();
                  }
                }}
                className="h-12 flex-1 text-base"
              />
              <Button
                onClick={() => void handleSearch()}
                disabled={isSearching || !trackingNumber.trim()}
                className="h-12 bg-primary px-6 text-white hover:bg-primary/90"
              >
                {isSearching ? (
                  <>Recherche...</>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
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

      {trackingInfo && (
        <div className="flex-1 space-y-6">
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(trackingInfo.status)}
                  <div>
                    <p className="text-sm text-gray-600">État du colis</p>
                    <p className="text-2xl font-bold text-gray-900">{getStatusLabel(trackingInfo.status)}</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-600">
                Numéro de suivi: <span className="font-mono font-semibold">{trackingInfo.trackingNumber}</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-6">
              <h3 className="text-lg font-semibold">Informations de Livraison</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="mb-1 text-xs text-gray-600">Expéditeur</p>
                  <p className="font-semibold text-gray-900">{trackingInfo.sender}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-gray-600">Destinataire</p>
                  <p className="font-semibold text-gray-900">{trackingInfo.recipient}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="mb-1 text-xs text-gray-600">Origine</p>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <p className="font-semibold text-gray-900">{trackingInfo.origin}</p>
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-xs text-gray-600">Destination</p>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <p className="font-semibold text-gray-900">{trackingInfo.destination}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button variant="outline" onClick={() => setTrackingInfo(null)} className="w-full">
            Nouveau Suivi
          </Button>
        </div>
      )}
    </div>
  );
}

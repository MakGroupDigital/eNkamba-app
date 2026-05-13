'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Bike,
  Car,
  ChevronLeft,
  ChevronRight,
  Clock,
  Footprints,
  MapPin,
  Navigation,
  Package,
  Pause,
  Plane,
  Play,
  RadioTower,
  Route,
  Search,
  Send,
  Share2,
  Square,
  Star,
  Truck,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PinVerification } from '@/components/payment/PinVerification';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useBusinessStatus } from '@/hooks/useBusinessStatus';
import { addDoc, collection, doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { buildUgaviStatusEntry } from '@/lib/ugavi-requests';

const KINSHASA_CENTER = { lat: -4.325, lon: 15.3222 };

type GeoPoint = typeof KINSHASA_CENTER;
type UgaviMode = 'send' | 'track' | 'express';
type AgencyScope = 'national' | 'international';
type TripStatus = 'idle' | 'running' | 'paused';
type TransportMode = 'walk' | 'bike' | 'car' | 'taxi';
type PaymentChoice = 'wallet' | 'cod';

type Agency = GeoPoint & {
  id: string;
  name: string;
  scope: AgencyScope;
  zone: string;
  eta: string;
};

type Courier = GeoPoint & {
  id: string;
  name: string;
  locomotion: 'foot' | 'bike' | 'moto' | 'car' | 'truck' | 'drone';
  rating: number;
  fare: number;
  zone: string;
  eta: string;
};

type AddressField = 'pickup' | 'dropoff';

type AddressSuggestion = GeoPoint & {
  id: string;
  label: string;
  secondary: string;
  source: 'local' | 'photon';
};

const AGENCIES: Agency[] = [
  { id: 'nat-gombe', name: 'Ugavi National Gombe', scope: 'national', zone: 'Gombe', eta: '12 min', lat: -4.3152, lon: 15.3066 },
  { id: 'nat-limete', name: 'Ugavi Hub Limete', scope: 'national', zone: 'Limete', eta: '18 min', lat: -4.3439, lon: 15.3446 },
  { id: 'nat-matete', name: 'Ugavi Relais Matete', scope: 'national', zone: 'Matete', eta: '25 min', lat: -4.3837, lon: 15.3422 },
  { id: 'int-ndjili', name: 'Ugavi Cargo N\'djili', scope: 'international', zone: 'Aeroport', eta: '35 min', lat: -4.3858, lon: 15.4446 },
  { id: 'int-port', name: 'Ugavi Port International', scope: 'international', zone: 'Port de Kinshasa', eta: '22 min', lat: -4.3019, lon: 15.3158 },
];

const COURIERS: Courier[] = [
  { id: 'cr-foot', name: 'Patrick M.', locomotion: 'foot', rating: 4.6, fare: 4500, zone: 'Kasa-Vubu', eta: '8 min', lat: -4.3244, lon: 15.3268 },
  { id: 'cr-bike', name: 'Grace K.', locomotion: 'bike', rating: 4.8, fare: 6500, zone: 'Gombe', eta: '6 min', lat: -4.3181, lon: 15.3145 },
  { id: 'cr-moto', name: 'Cedrick L.', locomotion: 'moto', rating: 4.9, fare: 9500, zone: 'Limete', eta: '5 min', lat: -4.3337, lon: 15.3374 },
  { id: 'cr-car', name: 'Sarah N.', locomotion: 'car', rating: 4.7, fare: 14500, zone: 'Ngaliema', eta: '12 min', lat: -4.3195, lon: 15.2811 },
  { id: 'cr-truck', name: 'Cargo Pro', locomotion: 'truck', rating: 4.5, fare: 28000, zone: 'Kingabwa', eta: '18 min', lat: -4.3335, lon: 15.3616 },
  { id: 'cr-drone', name: 'Drone Swift', locomotion: 'drone', rating: 4.4, fare: 22000, zone: 'Centre', eta: '9 min', lat: -4.3118, lon: 15.3297 },
];

const transportLabels: Record<TransportMode, string> = {
  walk: 'Marche',
  bike: 'Velo',
  car: 'Voiture',
  taxi: 'Taxi',
};

const locomotionLabels: Record<Courier['locomotion'], string> = {
  foot: 'A pied',
  bike: 'Velo',
  moto: 'Moto',
  car: 'Voiture',
  truck: 'Camion',
  drone: 'Drone',
};

function distanceKm(from: GeoPoint, to: GeoPoint) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const radius = 6371;
  const dLat = toRad(to.lat - from.lat);
  const dLon = toRad(to.lon - from.lon);
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function markerPercent(point: GeoPoint, center: GeoPoint) {
  const left = 50 + (point.lon - center.lon) * 520;
  const top = 50 - (point.lat - center.lat) * 520;
  return {
    left: Math.min(88, Math.max(12, left)),
    top: Math.min(82, Math.max(16, top)),
  };
}

function markerPosition(point: GeoPoint, center: GeoPoint) {
  const position = markerPercent(point, center);
  return {
    left: `${position.left}%`,
    top: `${position.top}%`,
  };
}

function LocomotionIcon({ type }: { type: Courier['locomotion'] }) {
  if (type === 'foot') return <Footprints className="h-4 w-4" />;
  if (type === 'bike') return <Bike className="h-4 w-4" />;
  if (type === 'car') return <Car className="h-4 w-4" />;
  if (type === 'truck') return <Truck className="h-4 w-4" />;
  if (type === 'drone') return <RadioTower className="h-4 w-4" />;
  return <Navigation className="h-4 w-4" />;
}

function AddressAutocompleteInput({
  value,
  placeholder,
  Icon,
  iconClassName,
  suggestions,
  isLoading,
  isOpen,
  onChange,
  onFocus,
  onSelect,
}: {
  value: string;
  placeholder: string;
  Icon: LucideIcon;
  iconClassName: string;
  suggestions: AddressSuggestion[];
  isLoading: boolean;
  isOpen: boolean;
  onChange: (value: string) => void;
  onFocus: () => void;
  onSelect: (suggestion: AddressSuggestion) => void;
}) {
  return (
    <div className="relative">
      <Icon className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${iconClassName}`} />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={onFocus}
        placeholder={placeholder}
        className="h-11 rounded-xl border-slate-200 bg-white pl-9"
      />
      {isOpen && (isLoading || suggestions.length > 0) && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
          {isLoading && (
            <div className="px-3 py-2 text-xs font-semibold text-slate-500">Recherche d'adresse...</div>
          )}
          {!isLoading &&
            suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  onSelect(suggestion);
                }}
                className="flex w-full items-start gap-2 px-3 py-2 text-left transition hover:bg-emerald-50"
              >
                <MapPin className="mt-0.5 h-4 w-4 flex-none text-emerald-600" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-slate-900">{suggestion.label}</span>
                  <span className="block truncate text-xs text-slate-500">{suggestion.secondary}</span>
                </span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

export default function UgaviPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const { businessUser } = useBusinessStatus();
  const watchIdRef = useRef<number | null>(null);
  const [mode, setMode] = useState<UgaviMode>('send');
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [pickupPoint, setPickupPoint] = useState<GeoPoint | null>(null);
  const [dropoffPoint, setDropoffPoint] = useState<GeoPoint | null>(null);
  const [activeAddressField, setActiveAddressField] = useState<AddressField | null>(null);
  const [addressSuggestions, setAddressSuggestions] = useState<Record<AddressField, AddressSuggestion[]>>({ pickup: [], dropoff: [] });
  const [isAddressSearchLoading, setIsAddressSearchLoading] = useState(false);
  const [trackingQuery, setTrackingQuery] = useState('');
  const [shipmentType, setShipmentType] = useState<AgencyScope>('national');
  const [selectedAgencyId, setSelectedAgencyId] = useState<string | null>(null);
  const [selectedCourierId, setSelectedCourierId] = useState<string | null>(null);
  const [transportMode, setTransportMode] = useState<TransportMode>('car');
  const [tripStatus, setTripStatus] = useState<TripStatus>('idle');
  const [isRouteReady, setIsRouteReady] = useState(false);
  const [courierInstructions, setCourierInstructions] = useState('');
  const [instructionsConfirmed, setInstructionsConfirmed] = useState(false);
  const [paymentChoice, setPaymentChoice] = useState<PaymentChoice | null>(null);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [isClientPanelOpen, setIsClientPanelOpen] = useState(false);
  const [isProcessingExpressPayment, setIsProcessingExpressPayment] = useState(false);
  const [userPosition, setUserPosition] = useState(KINSHASA_CENTER);
  const [recentShipments, setRecentShipments] = useState<Array<{ id: string; trackingNumber: string; destination: string; status: string; source: 'ugavi' | 'nkampa' }>>([]);

  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextPosition = { lat: position.coords.latitude, lon: position.coords.longitude };
        setUserPosition(nextPosition);
        setPickupPoint((current) => current || nextPosition);
      },
      () => setUserPosition(KINSHASA_CENTER),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 15000 }
    );
  }, []);

  useEffect(() => {
    if (searchParams?.get('panel') === 'client') {
      setIsClientPanelOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!activeAddressField) return;
    const query = activeAddressField === 'pickup' ? pickupLocation : dropoffLocation;
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 2) {
      setAddressSuggestions((current) => ({ ...current, [activeAddressField]: [] }));
      setIsAddressSearchLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        setIsAddressSearchLoading(true);
        const response = await fetch(`/api/geo/kinshasa/search?q=${encodeURIComponent(trimmedQuery)}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Recherche adresse impossible');
        const payload = await response.json();
        setAddressSuggestions((current) => ({
          ...current,
          [activeAddressField]: Array.isArray(payload.items) ? payload.items : [],
        }));
      } catch (error: any) {
        if (error?.name !== 'AbortError') {
          setAddressSuggestions((current) => ({ ...current, [activeAddressField]: [] }));
        }
      } finally {
        if (!controller.signal.aborted) setIsAddressSearchLoading(false);
      }
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [activeAddressField, pickupLocation, dropoffLocation]);

  useEffect(() => {
    if (!user?.uid) {
      setRecentShipments([]);
      return;
    }

    let isCancelled = false;

    const loadRecentShipments = async () => {
      try {
        const { db } = await import('@/lib/firebase');
        const { collection, getDocs, query, where } = await import('firebase/firestore');

        const ugaviSnapshot = await getDocs(query(collection(db, 'ugaviRequests'), where('userId', '==', user.uid)));
        const nkampaSnapshot = await getDocs(query(collection(db, 'nkampa_orders'), where('buyerId', '==', user.uid)));

        const normalizeStatus = (status: string) => {
          const lowered = (status || '').toLowerCase();
          if (['delivered', 'livré', 'livre'].includes(lowered)) return 'Livre';
          if (['assigned', 'registered', 'paid', 'processing', 'shipped', 'in_transit', 'out_for_delivery'].includes(lowered)) return 'En transit';
          if (['blocked', 'failed', 'cancelled', 'returned'].includes(lowered)) return 'Incident';
          return 'En attente';
        };

        const ugaviItems = ugaviSnapshot.docs.map((shipmentDoc) => {
          const data = shipmentDoc.data() as any;
          return {
            id: shipmentDoc.id,
            trackingNumber: data.trackingNumber || `UGV-${shipmentDoc.id.slice(0, 6).toUpperCase()}`,
            destination: data.receiverAddress || 'Destination Ugavi',
            status: normalizeStatus(data.logisticsStatus || data.status || 'pending_payment'),
            source: 'ugavi' as const,
            updatedAt: data.updatedAt?.toMillis?.() || 0,
          };
        });

        const nkampaItems = nkampaSnapshot.docs
          .map((orderDoc) => {
            const data = orderDoc.data() as any;
            if (!data.trackingNumber) return null;
            return {
              id: orderDoc.id,
              trackingNumber: data.trackingNumber,
              destination: data.shippingAddress || data.pickupRoute?.storeLocationLabel || 'Destination Nkampa',
              status: normalizeStatus(data.status || 'pending'),
              source: 'nkampa' as const,
              updatedAt: data.updatedAt?.toMillis?.() || 0,
            };
          })
          .filter(Boolean) as Array<any>;

        const merged = [...ugaviItems, ...nkampaItems]
          .sort((left, right) => right.updatedAt - left.updatedAt)
          .slice(0, 3)
          .map(({ updatedAt, ...shipment }) => shipment);

        if (!isCancelled) setRecentShipments(merged);
      } catch (error) {
        console.error('Erreur chargement envois Ugavi:', error);
        if (!isCancelled) setRecentShipments([]);
      }
    };

    loadRecentShipments();
    return () => {
      isCancelled = true;
    };
  }, [user?.uid]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const availableAgencies = useMemo(
    () => AGENCIES.filter((agency) => agency.scope === shipmentType),
    [shipmentType]
  );

  const selectedAgency = availableAgencies.find((agency) => agency.id === selectedAgencyId) || null;
  const selectedCourier = COURIERS.find((courier) => courier.id === selectedCourierId) || null;
  const activeRouteTarget = mode === 'express' ? selectedCourier : selectedAgency;
  const routeStartPoint = pickupPoint || userPosition;
  const activeDistance = activeRouteTarget ? distanceKm(routeStartPoint, activeRouteTarget) : null;
  const activeEtaMinutes = activeDistance ? Math.max(4, Math.round((activeDistance / (transportMode === 'walk' ? 4 : transportMode === 'bike' ? 12 : 24)) * 60)) : null;
  const mapCenter = useMemo(() => {
    if (activeRouteTarget) {
      return {
        lat: (routeStartPoint.lat + activeRouteTarget.lat) / 2,
        lon: (routeStartPoint.lon + activeRouteTarget.lon) / 2,
      };
    }
    return dropoffPoint || pickupPoint || userPosition;
  }, [activeRouteTarget, dropoffPoint, pickupPoint, routeStartPoint, userPosition]);
  const showAgencyMarkers = mode === 'send' && pickupLocation && dropoffLocation;
  const showCourierMarkers = mode === 'express' && pickupLocation && dropoffLocation;
  const hasExpressRoute = Boolean(pickupLocation.trim() && dropoffLocation.trim());
  const routeLine = useMemo(() => {
    if (!activeRouteTarget) return null;
    const start = markerPercent(routeStartPoint, mapCenter);
    const end = markerPercent(activeRouteTarget, mapCenter);

    return {
      start,
      end,
    };
  }, [activeRouteTarget, mapCenter, routeStartPoint]);

  const startTrip = () => {
    if (!activeRouteTarget) {
      toast({ variant: 'destructive', title: 'Destination requise', description: 'Selectionnez une agence ou un livreur.' });
      return;
    }

    setTripStatus('running');
    if ('geolocation' in navigator && watchIdRef.current === null) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => setUserPosition({ lat: position.coords.latitude, lon: position.coords.longitude }),
        () => undefined,
        { enableHighAccuracy: true, maximumAge: 4000, timeout: 12000 }
      );
    }
  };

  const pauseTrip = () => setTripStatus('paused');

  const stopTrip = () => {
    setTripStatus('idle');
    if (watchIdRef.current !== null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  const shareRoute = async () => {
    const targetName = activeRouteTarget?.name || 'destination Ugavi';
    const text = `Itineraire Ugavi vers ${targetName}${activeDistance ? ` (${activeDistance.toFixed(1)} km)` : ''}`;
    if (navigator.share) {
      await navigator.share({ title: 'Itineraire Ugavi', text });
      return;
    }
    await navigator.clipboard?.writeText(text);
    toast({ title: 'Itineraire copie', description: text });
  };

  const searchTracking = () => {
    if (!trackingQuery.trim()) {
      toast({ variant: 'destructive', title: 'Numero requis', description: 'Veuillez entrer un numero de suivi.' });
      return;
    }
    router.push(`/dashboard/ugavi/tracking?tracking=${encodeURIComponent(trackingQuery.trim())}`);
  };

  const prepareAgencyRoute = () => {
    if (!pickupLocation.trim() || !dropoffLocation.trim()) {
      toast({ variant: 'destructive', title: 'Trajet incomplet', description: 'Renseignez le depart et la destination.' });
      return;
    }
    if (!selectedAgency) {
      toast({ variant: 'destructive', title: 'Agence requise', description: 'Selectionnez une agence sur la carte.' });
      return;
    }
    setIsRouteReady(true);
    setTripStatus('idle');
    toast({
      title: 'Itineraire cree',
      description: `${selectedAgency.name} · ${activeDistance?.toFixed(1)} km`,
      className: 'bg-green-600 text-white border-none',
    });
  };

  const handleAgencyRouteButton = () => {
    if (isRouteReady) {
      startTrip();
      return;
    }
    prepareAgencyRoute();
  };

  const openBusinessArea = () => {
    if (businessUser?.status === 'APPROVED') {
      router.push('/dashboard/business-pro?module=LOGISTICS');
      return;
    }
    router.push('/dashboard/settings/business-account');
  };

  const buildExpressTrackingNumber = () => {
    const origin = pickupLocation.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, '') || 'KIN';
    const destination = dropoffLocation.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, '') || 'DST';
    return `UGV-${new Date().getFullYear()}-${origin}-${destination}-${Date.now().toString().slice(-5)}`;
  };

  const validateExpressOrder = () => {
    if (!pickupLocation.trim() || !dropoffLocation.trim() || !selectedCourier) {
      toast({ variant: 'destructive', title: 'Livraison incomplete', description: 'Renseignez le trajet et choisissez un livreur.' });
      return false;
    }
    if (!courierInstructions.trim()) {
      toast({ variant: 'destructive', title: 'Instructions requises', description: 'Ajoutez une instruction pour le livreur.' });
      return false;
    }
    if (!paymentChoice) {
      toast({ variant: 'destructive', title: 'Paiement requis', description: 'Choisissez un mode de paiement.' });
      return false;
    }
    return true;
  };

  const createExpressRequest = async (options: { transactionId?: string; paidByWallet: boolean; trackingNumber?: string }) => {
    if (!selectedCourier) throw new Error('Livreur requis');
    const trackingNumber = options.trackingNumber || buildExpressTrackingNumber();
    const actorName = user?.displayName || user?.email || 'Client';
    const requestDraft = await addDoc(collection(db, 'ugaviRequests'), {
      userId: user?.uid || null,
      status: options.paidByWallet ? 'paid' : 'registered',
      paymentStatus: options.paidByWallet ? 'completed' : 'cash_on_delivery',
      logisticsStatus: 'assigned',
      serviceMode: 'express',
      senderName: actorName,
      senderAddress: pickupLocation,
      receiverName: 'Destinataire',
      receiverAddress: dropoffLocation,
      packageWeight: 1,
      description: 'Livraison express',
      serviceInstructions: courierInstructions,
      eta: selectedCourier.eta,
      selectedCourier,
      totalAmount: selectedCourier.fare,
      paymentChoice,
      trackingNumber,
      transactionId: options.transactionId || '',
      statusHistory: [
        buildUgaviStatusEntry('draft', actorName, pickupLocation, 'Demande express creee'),
        ...(options.paidByWallet
          ? [buildUgaviStatusEntry('payment_confirmed', actorName, 'eNkambaPay', 'Paiement confirme')]
          : []),
        buildUgaviStatusEntry('assigned', selectedCourier.name, selectedCourier.zone, 'Livreur assigne'),
      ],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...(options.paidByWallet ? { paidAt: serverTimestamp() } : {}),
    });

    return { requestId: requestDraft.id, trackingNumber };
  };

  const confirmExpressDelivery = async () => {
    if (!validateExpressOrder()) return;
    if (paymentChoice === 'wallet') {
      setShowPinDialog(true);
      return;
    }

    try {
      const { trackingNumber } = await createExpressRequest({ paidByWallet: false });
      router.push(`/dashboard/ugavi/tracking?tracking=${encodeURIComponent(trackingNumber)}`);
    } catch (error) {
      console.error('Erreur commande express Ugavi:', error);
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de creer la commande express.' });
    }
  };

  const processExpressWalletPayment = async () => {
    if (!user || !selectedCourier || !validateExpressOrder()) return;

    setIsProcessingExpressPayment(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      const currentBalance = userDoc.exists() ? Number(userDoc.data()?.walletBalance || 0) : 0;
      const amount = selectedCourier.fare;

      if (currentBalance < amount) {
        throw new Error('Solde insuffisant');
      }

      const newBalance = currentBalance - amount;
      const trackingNumber = buildExpressTrackingNumber();

      await updateDoc(userRef, {
        walletBalance: newBalance,
        lastTransactionTime: serverTimestamp(),
      });

      const txDoc = await addDoc(collection(db, 'users', user.uid, 'transactions'), {
        type: 'payment_sent',
        context: 'ugavi',
        amount,
        amountInCDF: amount,
        status: 'completed',
        description: `Livraison Express Ugavi - ${selectedCourier.name}`,
        previousBalance: currentBalance,
        newBalance,
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString(),
        paymentMethod: 'enkambapay',
        metadata: {
          trackingNumber,
          courierId: selectedCourier.id,
          courierName: selectedCourier.name,
          senderAddress: pickupLocation,
          receiverAddress: dropoffLocation,
        },
      });

      const { requestId } = await createExpressRequest({ paidByWallet: true, transactionId: txDoc.id, trackingNumber });
      await updateDoc(txDoc, {
        metadata: {
          trackingNumber,
          requestId,
          courierId: selectedCourier.id,
          courierName: selectedCourier.name,
          senderAddress: pickupLocation,
          receiverAddress: dropoffLocation,
        },
      });

      await addDoc(collection(db, 'users', user.uid, 'notifications'), {
        type: 'ugavi_payment',
        title: 'Paiement Ugavi effectue',
        message: `Livraison express payee: ${amount.toLocaleString('fr-FR')} CDF`,
        amount,
        transactionId: txDoc.id,
        trackingNumber,
        read: false,
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString(),
      });

      toast({
        title: 'Paiement confirme',
        description: 'Votre portefeuille eNkambapay a ete debite.',
        className: 'bg-green-600 text-white border-none',
      });
      setShowPinDialog(false);
      router.push(`/dashboard/ugavi/tracking?tracking=${encodeURIComponent(trackingNumber)}`);
    } catch (error: any) {
      console.error('Erreur paiement express Ugavi:', error);
      toast({ variant: 'destructive', title: 'Erreur paiement', description: error?.message || 'Paiement impossible.' });
      setShowPinDialog(false);
    } finally {
      setIsProcessingExpressPayment(false);
    }
  };

  const resetContextForMode = (nextMode: UgaviMode) => {
    setMode(nextMode);
    setTripStatus('idle');
    setIsRouteReady(false);
    setSelectedAgencyId(null);
    setSelectedCourierId(null);
    setCourierInstructions('');
    setInstructionsConfirmed(false);
    setPaymentChoice(null);
    setActiveAddressField(null);
  };

  const selectAddressSuggestion = (field: AddressField, suggestion: AddressSuggestion) => {
    const label = suggestion.secondary ? `${suggestion.label}, ${suggestion.secondary}` : suggestion.label;
    const point = { lat: suggestion.lat, lon: suggestion.lon };

    if (field === 'pickup') {
      setPickupLocation(label);
      setPickupPoint(point);
    } else {
      setDropoffLocation(label);
      setDropoffPoint(point);
    }

    setActiveAddressField(null);
    setAddressSuggestions((current) => ({ ...current, [field]: [] }));
    setIsRouteReady(false);
    setTripStatus('idle');
  };

  const updatePickupLocation = (value: string) => {
    setPickupLocation(value);
    setPickupPoint(null);
    if (mode === 'express') {
      setSelectedCourierId(null);
      setCourierInstructions('');
      setInstructionsConfirmed(false);
      setPaymentChoice(null);
    }
    if (mode === 'send') setIsRouteReady(false);
  };

  const updateDropoffLocation = (value: string) => {
    setDropoffLocation(value);
    setDropoffPoint(null);
    if (mode === 'express') {
      setSelectedCourierId(null);
      setCourierInstructions('');
      setInstructionsConfirmed(false);
      setPaymentChoice(null);
    }
    if (mode === 'send') setIsRouteReady(false);
  };

  return (
    <div className="relative h-screen overflow-hidden bg-slate-950">
      <iframe
        title="Carte Ugavi"
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapCenter.lon - 0.06},${mapCenter.lat - 0.06},${mapCenter.lon + 0.06},${mapCenter.lat + 0.06}&layer=mapnik&marker=${userPosition.lat},${userPosition.lon}`}
        className="absolute inset-0 h-full w-full border-0"
        style={{ filter: 'saturate(0.85) contrast(1.02)' }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/25" />

      <button
        type="button"
        className="absolute z-20 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 shadow-lg ring-1 ring-black/5"
        style={markerPosition(userPosition, mapCenter)}
      >
        <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
        Vous
      </button>

      {pickupPoint && (
        <button
          type="button"
          title={pickupLocation}
          className="absolute z-20 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-lg ring-2 ring-white/80"
          style={markerPosition(pickupPoint, mapCenter)}
        >
          <MapPin className="h-3.5 w-3.5" />
          Depart
        </button>
      )}

      {dropoffPoint && (
        <button
          type="button"
          title={dropoffLocation}
          className="absolute z-20 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full bg-orange-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-lg ring-2 ring-white/80"
          style={markerPosition(dropoffPoint, mapCenter)}
        >
          <Navigation className="h-3.5 w-3.5" />
          Destination
        </button>
      )}

      {showAgencyMarkers &&
        availableAgencies.map((agency) => (
          <button
            key={agency.id}
            type="button"
            onClick={() => {
              setSelectedAgencyId(agency.id);
              setIsRouteReady(false);
              setTripStatus('idle');
            }}
            title={agency.name}
            className={`absolute z-20 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full shadow-xl ring-2 ring-white/80 ${
              selectedAgencyId === agency.id ? 'bg-emerald-600 text-white' : 'bg-white text-slate-800'
            }`}
            style={markerPosition(agency, mapCenter)}
          >
            {agency.scope === 'international' ? <Plane className="h-5 w-5" /> : <Package className="h-5 w-5" />}
          </button>
        ))}

      {showCourierMarkers &&
        COURIERS.map((courier) => (
          <button
            key={courier.id}
            type="button"
            onClick={() => {
              setSelectedCourierId(courier.id);
              setCourierInstructions('');
              setInstructionsConfirmed(false);
              setPaymentChoice(null);
            }}
            title={`${courier.name} - ${locomotionLabels[courier.locomotion]}`}
            className={`absolute z-20 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full shadow-xl ring-2 ring-white/80 ${
              selectedCourierId === courier.id ? 'bg-orange-600 text-white' : 'bg-white text-slate-800'
            }`}
            style={markerPosition(courier, mapCenter)}
          >
            <LocomotionIcon type={courier.locomotion} />
          </button>
        ))}

      {isRouteReady && routeLine && (
        <div className="pointer-events-none absolute inset-0 z-10">
          <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
            <line
              x1={`${routeLine.start.left}%`}
              y1={`${routeLine.start.top}%`}
              x2={`${routeLine.end.left}%`}
              y2={`${routeLine.end.top}%`}
              stroke="rgba(16,185,129,0.95)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={tripStatus === 'running' ? '10 8' : undefined}
              filter="drop-shadow(0 0 8px rgba(16,185,129,0.75))"
            />
          </svg>
          <span
            className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600 ring-4 ring-white/80"
            style={{ left: `${routeLine.start.left}%`, top: `${routeLine.start.top}%` }}
          />
          <span
            className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-600 ring-4 ring-white/80"
            style={{ left: `${routeLine.end.left}%`, top: `${routeLine.end.top}%` }}
          />
        </div>
      )}

      <header className="absolute left-0 right-0 top-0 z-30 flex items-center justify-between px-4 py-3">
        <div className="rounded-full bg-white/88 px-4 py-2 shadow-lg backdrop-blur">
          <p className="text-sm font-black text-emerald-700">Ugavi</p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={openBusinessArea}
          className="rounded-full bg-white/90 text-slate-800 shadow-lg backdrop-blur hover:bg-white"
        >
          Business
        </Button>
      </header>

      <section className="absolute left-3 right-3 top-16 z-30 mx-auto max-w-md">
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-white/92 p-1.5 shadow-2xl backdrop-blur-xl ring-1 ring-black/5">
          {[
            { id: 'send', label: 'Envoyer', icon: Send },
            { id: 'track', label: 'Suivi', icon: Search },
            { id: 'express', label: 'Express', icon: Navigation },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = mode === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => resetContextForMode(item.id as UgaviMode)}
                className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  isActive ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="absolute bottom-24 left-3 right-3 z-30 mx-auto grid max-w-6xl gap-3 lg:grid-cols-[minmax(330px,390px)_1fr]">
        <div className="rounded-2xl bg-white/92 p-3 shadow-2xl backdrop-blur-xl ring-1 ring-black/5">

          {mode === 'track' ? (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={trackingQuery}
                  onChange={(event) => setTrackingQuery(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && searchTracking()}
                  placeholder="Numero de suivi"
                  className="h-12 rounded-xl border-slate-200 bg-white pl-9"
                />
              </div>
              <Button onClick={searchTracking} className="h-11 w-full rounded-xl bg-emerald-600 hover:bg-emerald-700">
                Rechercher
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                <AddressAutocompleteInput
                  value={pickupLocation}
                  onChange={updatePickupLocation}
                  onFocus={() => setActiveAddressField('pickup')}
                  onSelect={(suggestion) => selectAddressSuggestion('pickup', suggestion)}
                  placeholder="Point de depart"
                  Icon={MapPin}
                  iconClassName="text-emerald-600"
                  suggestions={addressSuggestions.pickup}
                  isLoading={isAddressSearchLoading && activeAddressField === 'pickup'}
                  isOpen={activeAddressField === 'pickup'}
                />
                <AddressAutocompleteInput
                  value={dropoffLocation}
                  onChange={updateDropoffLocation}
                  onFocus={() => setActiveAddressField('dropoff')}
                  onSelect={(suggestion) => selectAddressSuggestion('dropoff', suggestion)}
                  placeholder="Destination"
                  Icon={Navigation}
                  iconClassName="text-orange-600"
                  suggestions={addressSuggestions.dropoff}
                  isLoading={isAddressSearchLoading && activeAddressField === 'dropoff'}
                  isOpen={activeAddressField === 'dropoff'}
                />
              </div>

              {mode === 'send' && (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'national', label: 'National' },
                      { id: 'international', label: 'International' },
                      { id: 'national', label: 'Express' },
                    ].map((option, index) => (
                      <button
                        key={`${option.label}-${index}`}
                        type="button"
                        onClick={() => {
                          if (option.label === 'Express') {
                            resetContextForMode('express');
                            return;
                          }
                          setShipmentType(option.id as AgencyScope);
                          setSelectedAgencyId(null);
                          setIsRouteReady(false);
                          setTripStatus('idle');
                        }}
                        className={`rounded-xl border px-2 py-2 text-xs font-semibold ${
                          option.id === shipmentType && option.label !== 'Express'
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                    {selectedAgency ? (
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-bold text-slate-900">{selectedAgency.name}</p>
                            <p className="text-xs text-slate-500">{selectedAgency.zone} · {selectedAgency.eta}</p>
                          </div>
                          <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-emerald-700">
                            {activeDistance?.toFixed(1)} km
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(Object.keys(transportLabels) as TransportMode[]).map((item) => (
                            <button
                              key={item}
                              type="button"
                              onClick={() => setTransportMode(item)}
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                transportMode === item ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'
                              }`}
                            >
                              {transportLabels[item]}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-600">Renseignez le trajet, puis choisissez une agence sur la carte.</p>
                    )}
                  </div>

                  <Button onClick={handleAgencyRouteButton} disabled={isRouteReady && tripStatus === 'running'} className="h-11 w-full rounded-xl bg-emerald-600 hover:bg-emerald-700">
                    {isRouteReady ? (tripStatus === 'running' ? 'Itineraire en cours' : "Commencer l'itineraire") : "Creer l'itineraire"}
                  </Button>
                </>
              )}

              {mode === 'express' && (
                <>
                  {!hasExpressRoute && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                      Renseignez seulement le point de depart et la destination.
                    </div>
                  )}

                  {hasExpressRoute && !selectedCourier && (
                    <div className="rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">
                      Les livreurs disponibles sont sur la carte. Touchez un marqueur pour continuer.
                    </div>
                  )}

                  {selectedCourier && !instructionsConfirmed && (
                    <>
                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="rounded-full bg-orange-50 p-2 text-orange-700">
                              <LocomotionIcon type={selectedCourier.locomotion} />
                            </span>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{selectedCourier.name}</p>
                              <p className="text-xs text-slate-500">{locomotionLabels[selectedCourier.locomotion]} · {selectedCourier.zone} · {selectedCourier.eta}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-slate-900">{selectedCourier.fare.toLocaleString('fr-FR')} FC</p>
                            <p className="flex items-center justify-end gap-1 text-xs text-amber-600">
                              <Star className="h-3 w-3 fill-current" />
                              {selectedCourier.rating}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Input
                        value={courierInstructions}
                        onChange={(event) => {
                          setCourierInstructions(event.target.value);
                          setPaymentChoice(null);
                        }}
                        placeholder="Instruction pour le livreur"
                        className="h-11 rounded-xl border-slate-200"
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          if (!courierInstructions.trim()) {
                            toast({ variant: 'destructive', title: 'Instruction requise', description: 'Ajoutez une instruction avant de continuer.' });
                            return;
                          }
                          setInstructionsConfirmed(true);
                        }}
                        className="h-11 w-full rounded-xl bg-slate-900 hover:bg-slate-800"
                      >
                        Continuer
                      </Button>
                    </>
                  )}

                  {selectedCourier && instructionsConfirmed && !paymentChoice && (
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'wallet', label: 'eNkambapay' },
                        { id: 'cod', label: 'A la livraison' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setPaymentChoice(item.id as PaymentChoice)}
                          className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedCourier && instructionsConfirmed && paymentChoice && (
                    <Button onClick={confirmExpressDelivery} className="h-11 w-full rounded-xl bg-orange-600 hover:bg-orange-700">
                      Commander
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div className="hidden rounded-2xl bg-white/88 p-3 shadow-2xl backdrop-blur-xl ring-1 ring-black/5 lg:block">
          <div className="grid h-full grid-cols-[1fr_auto] gap-3">
            <div>
              <p className="text-sm font-bold text-slate-900">Trajet actif</p>
              <p className="mt-1 text-sm text-slate-600">
                {activeRouteTarget
                  ? `${activeRouteTarget.name} · ${activeDistance?.toFixed(1)} km · ${tripStatus === 'running' ? 'en cours' : tripStatus === 'paused' ? 'en pause' : 'pret'}`
                  : 'Aucune destination selectionnee'}
              </p>
              {recentShipments.length > 0 && (
                <div className="mt-3 flex gap-2 overflow-x-auto">
                  {recentShipments.map((shipment) => (
                    <button
                      key={`${shipment.source}-${shipment.id}`}
                      type="button"
                      onClick={() => router.push(`/dashboard/ugavi/tracking?tracking=${encodeURIComponent(shipment.trackingNumber)}`)}
                      className="min-w-44 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left"
                    >
                      <p className="truncate text-xs font-bold text-slate-900">{shipment.trackingNumber}</p>
                      <p className="truncate text-[11px] text-slate-500">{shipment.destination}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" size="icon" variant="outline" onClick={startTrip} disabled={!activeRouteTarget || tripStatus === 'running'} title="Demarrer">
                <Play className="h-4 w-4" />
              </Button>
              <Button type="button" size="icon" variant="outline" onClick={pauseTrip} disabled={tripStatus !== 'running'} title="Pause">
                <Pause className="h-4 w-4" />
              </Button>
              <Button type="button" size="icon" variant="outline" onClick={stopTrip} disabled={tripStatus === 'idle'} title="Arreter">
                <Square className="h-4 w-4" />
              </Button>
              <Button type="button" size="icon" variant="outline" onClick={() => void shareRoute()} disabled={!activeRouteTarget} title="Partager">
                <Share2 className="h-4 w-4" />
              </Button>
              <span className="rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white">
                <Route className="mr-1 inline h-3.5 w-3.5" />
                {transportLabels[transportMode]}
              </span>
            </div>
          </div>
        </div>
      </section>

      <button
        type="button"
        onClick={() => setIsClientPanelOpen(true)}
        className="absolute left-0 top-1/2 z-40 flex -translate-y-1/2 items-center gap-1 rounded-r-2xl bg-slate-950/90 px-2 py-4 text-xs font-semibold text-white shadow-2xl backdrop-blur transition hover:bg-slate-900"
      >
        <ChevronRight className="h-4 w-4" />
        <span className="hidden [writing-mode:vertical-rl] sm:inline">Mes colis</span>
      </button>

      {isClientPanelOpen && (
        <div className="absolute inset-0 z-50">
          <button
            type="button"
            aria-label="Fermer"
            className="absolute inset-0 bg-black/25"
            onClick={() => setIsClientPanelOpen(false)}
          />
          <aside className="absolute bottom-0 left-0 top-0 flex w-[86vw] max-w-sm flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Espace client</p>
                <h2 className="text-lg font-black text-slate-900">Mes colis</h2>
              </div>
              <Button type="button" size="icon" variant="ghost" onClick={() => setIsClientPanelOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Livraisons', value: recentShipments.length, tone: 'bg-emerald-50 text-emerald-700' },
                  { label: 'A deposer', value: 0, tone: 'bg-amber-50 text-amber-700' },
                  { label: 'En transit', value: recentShipments.filter((item) => item.status === 'En transit').length, tone: 'bg-blue-50 text-blue-700' },
                  { label: 'Livres', value: recentShipments.filter((item) => item.status === 'Livre').length, tone: 'bg-slate-100 text-slate-700' },
                ].map((section) => (
                  <button
                    key={section.label}
                    type="button"
                    className={`rounded-xl px-3 py-3 text-left ${section.tone}`}
                  >
                    <p className="text-2xl font-black">{section.value}</p>
                    <p className="text-xs font-semibold">{section.label}</p>
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Suivis recents</h3>
                  <button
                    type="button"
                    className="text-xs font-semibold text-emerald-700"
                    onClick={() => {
                      setIsClientPanelOpen(false);
                      resetContextForMode('track');
                    }}
                  >
                    Rechercher
                  </button>
                </div>

                {recentShipments.length ? (
                  recentShipments.map((shipment) => (
                    <button
                      key={`${shipment.source}-${shipment.id}-side`}
                      type="button"
                      onClick={() => router.push(`/dashboard/ugavi/tracking?tracking=${encodeURIComponent(shipment.trackingNumber)}`)}
                      className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-emerald-300"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-mono text-xs font-bold text-slate-900">{shipment.trackingNumber}</p>
                        <p className="truncate text-xs text-slate-500">{shipment.destination}</p>
                      </div>
                      <span className="ml-2 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                        {shipment.status}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                    Aucun colis recent pour le moment.
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900">Sections</h3>
                {[
                  'Commandes express',
                  'Colis en agence',
                  'Colis a deposer',
                  'Incidents et retours',
                  'Recus et preuves',
                ].map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700"
                  >
                    {item}
                    <ChevronLeft className="h-4 w-4 rotate-180 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}

      <PinVerification
        isOpen={showPinDialog}
        onClose={() => {
          if (!isProcessingExpressPayment) setShowPinDialog(false);
        }}
        onSuccess={() => void processExpressWalletPayment()}
        paymentDetails={selectedCourier ? {
          recipient: selectedCourier.name,
          amount: selectedCourier.fare.toLocaleString('fr-FR'),
          currency: 'CDF',
        } : undefined}
      />
    </div>
  );
}

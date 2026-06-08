'use client';

import { useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Clock, MessageCircle, Phone, Share2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PinVerification } from '@/components/payment/PinVerification';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useBusinessStatus } from '@/hooks/useBusinessStatus';
import { addDoc, collection, doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { buildUgaviStatusEntry } from '@/lib/ugavi-requests';
import { DASHBOARD_LOCATION_EVENT, readDashboardLocation, toGeoPoint } from '@/lib/dashboard-location';
import {
  FiveGoFlightIcon,
  MapPinIcon,
  MobilityIcon,
  MotoRideIcon,
  RideStarIcon,
  SearchIcon as CustomSearchIcon,
  SendIcon as CustomSendIcon,
  SendPackageIcon,
  TrackPackageIcon,
  UgaviPauseIcon,
  UgaviPlayIcon,
  UgaviShareIcon,
  UgaviStopIcon,
  UgaviIcon,
} from '@/components/icons/service-icons';
import {
  LogisticsAgencyIcon,
  LogisticsExpressIcon,
  LogisticsInternationalIcon,
  LogisticsRelayIcon,
  LogisticsStandardIcon,
  LogisticsTrackingIcon,
} from '@/components/icons/logistics-generated-icons';

const KINSHASA_CENTER = { lat: -4.325, lon: 15.3222 };

type GeoPoint = typeof KINSHASA_CENTER;
type UgaviMode = 'send' | 'track' | 'express';
type AgencyScope = 'relay' | 'national' | 'international';
type TripStatus = 'idle' | 'running' | 'paused';
type TransportMode = 'walk' | 'bike' | 'car' | 'taxi';
type InternationalTransportMode = 'air' | 'sea' | 'rail' | 'road';
type InternationalServiceType = 'deposit' | 'transit' | 'customs' | 'delivery';
type InternationalSearchScope = 'current_country' | 'foreign_country';
type NationalTransportMode = 'air' | 'truck' | 'bus' | 'rail' | 'boat';
type RelayDeliveryMode = 'deposit' | 'pickup' | 'moto' | 'express' | 'truck';
type PaymentChoice = 'wallet' | 'cod';
type CustomIcon = ComponentType<{ size?: number; className?: string }>;

type Agency = GeoPoint & {
  id: string;
  name: string;
  scope: AgencyScope;
  zone: string;
  eta: string;
  country?: string;
  city?: string;
  address?: string;
  status?: 'open' | 'closed';
  hours?: string;
  phone?: string;
  services?: string[];
  destinations?: string[];
  transports?: InternationalTransportMode[];
  estimatedDelay?: string;
  estimatedFees?: string;
  documents?: string[];
  landmarks?: string;
  province?: string;
  capacity?: string;
  reliability?: string;
  nationalTransports?: NationalTransportMode[];
  relayServices?: RelayDeliveryMode[];
  couriersAvailable?: number;
  zoneCovered?: string;
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

type DeliveryStep = 'route' | 'options' | 'parcel' | 'payment' | 'confirmed';

type AddressField = 'pickup' | 'dropoff';

type AddressSuggestion = GeoPoint & {
  id: string;
  label: string;
  secondary: string;
  source: 'local' | 'photon';
};

const AGENCIES: Agency[] = [
  {
    id: 'relay-gombe-centre',
    name: 'Agence Relais Gombe Centre',
    scope: 'relay',
    zone: 'Gombe Centre',
    eta: '6 min',
    lat: -4.3181,
    lon: 15.3145,
    country: 'RDC',
    city: 'Kinshasa',
    province: 'Kinshasa',
    address: 'Avenue du Port, Gombe, Kinshasa',
    status: 'open',
    hours: '08:00-18:00',
    phone: '+243 800 200 301',
    destinations: ['Gombe', 'Kinshasa', 'Limete', 'Ngaliema', 'Kasa-Vubu'],
    estimatedDelay: '30 min a 4h',
    estimatedFees: 'a partir de 4 500 FC',
    capacity: '80 colis / jour',
    reliability: '4.8/5',
    relayServices: ['deposit', 'pickup', 'moto', 'express'],
    couriersAvailable: 5,
    zoneCovered: 'Gombe, Centre-ville, Gare centrale',
    landmarks: 'Pres du port et de la gare',
  },
  {
    id: 'relay-limete-industriel',
    name: 'Agence Relais Limete Industriel',
    scope: 'relay',
    zone: 'Limete Industriel',
    eta: '14 min',
    lat: -4.3439,
    lon: 15.3446,
    country: 'RDC',
    city: 'Kinshasa',
    province: 'Kinshasa',
    address: 'Boulevard Lumumba, Limete Industriel',
    status: 'open',
    hours: '07:30-19:30',
    phone: '+243 800 200 302',
    destinations: ['Limete', 'Masina', 'Matete', 'Ndjili', 'Kingabwa'],
    estimatedDelay: '45 min a 6h',
    estimatedFees: 'a partir de 5 500 FC',
    capacity: '120 colis / jour',
    reliability: '4.6/5',
    relayServices: ['deposit', 'pickup', 'moto', 'truck'],
    couriersAvailable: 8,
    zoneCovered: 'Limete, Kingabwa, Masina',
    landmarks: 'Zone industrielle',
  },
  {
    id: 'relay-ngaliema',
    name: 'Agence Relais Ngaliema UPN',
    scope: 'relay',
    zone: 'Ngaliema',
    eta: '20 min',
    lat: -4.3195,
    lon: 15.2811,
    country: 'RDC',
    city: 'Kinshasa',
    province: 'Kinshasa',
    address: 'Route de Matadi, quartier UPN',
    status: 'open',
    hours: '08:30-17:30',
    phone: '+243 800 200 303',
    destinations: ['Ngaliema', 'Binza', 'Kintambo', 'Bandalungwa'],
    estimatedDelay: '1h a 5h',
    estimatedFees: 'a partir de 6 000 FC',
    capacity: '60 colis / jour',
    reliability: '4.4/5',
    relayServices: ['deposit', 'pickup', 'express'],
    couriersAvailable: 3,
    zoneCovered: 'Ngaliema, UPN, Binza',
    landmarks: 'Arret UPN',
  },
  {
    id: 'nat-gombe',
    name: 'Agence Nationale Congo Express Gombe',
    scope: 'national',
    zone: 'Gombe',
    eta: '12 min',
    lat: -4.3152,
    lon: 15.3066,
    country: 'RDC',
    city: 'Kinshasa',
    province: 'Kinshasa',
    address: 'Avenue du Port, Gombe, Kinshasa',
    status: 'open',
    hours: 'Lun-Sam 07:30-18:00',
    phone: '+243 800 100 201',
    destinations: ['Lubumbashi', 'Goma', 'Kisangani', 'Kolwezi', 'Matadi'],
    nationalTransports: ['truck', 'air', 'boat'],
    estimatedDelay: '24h a 72h',
    estimatedFees: 'a partir de 18 USD',
    capacity: 'Colis petits, moyens et palettes legeres',
    reliability: '4.7/5',
    landmarks: 'Pres du port commercial',
  },
  {
    id: 'nat-limete',
    name: 'Ugavi Hub National Limete',
    scope: 'national',
    zone: 'Limete',
    eta: '18 min',
    lat: -4.3439,
    lon: 15.3446,
    country: 'RDC',
    city: 'Kinshasa',
    province: 'Kinshasa',
    address: 'Boulevard Lumumba, Limete Industriel',
    status: 'open',
    hours: 'Lun-Dim 08:00-20:00',
    phone: '+243 800 100 202',
    destinations: ['Lubumbashi', 'Bukavu', 'Bunia', 'Kisangani', 'Mbuji-Mayi'],
    nationalTransports: ['truck', 'bus', 'air'],
    estimatedDelay: '1 a 4 jours',
    estimatedFees: 'a partir de 12 USD',
    capacity: 'Depot fort volume et groupage',
    reliability: '4.5/5',
    landmarks: 'Zone industrielle Limete',
  },
  {
    id: 'nat-matete',
    name: 'Ugavi Relais National Matete',
    scope: 'national',
    zone: 'Matete',
    eta: '25 min',
    lat: -4.3837,
    lon: 15.3422,
    country: 'RDC',
    city: 'Kinshasa',
    province: 'Kinshasa',
    address: 'Avenue Kianza, Matete',
    status: 'closed',
    hours: 'Lun-Sam 08:00-17:00',
    phone: '+243 800 100 203',
    destinations: ['Kikwit', 'Mbandaka', 'Kananga', 'Matadi'],
    nationalTransports: ['bus', 'truck', 'boat'],
    estimatedDelay: '2 a 5 jours',
    estimatedFees: 'a partir de 10 USD',
    capacity: 'Colis standards',
    reliability: '4.2/5',
    landmarks: 'Rond-point Matete',
  },
  {
    id: 'int-ndjili',
    name: 'Ugavi Cargo N\'djili',
    scope: 'international',
    zone: 'Aeroport',
    eta: '35 min',
    lat: -4.3858,
    lon: 15.4446,
    country: 'RDC',
    city: 'Kinshasa',
    address: 'Aeroport International de N\'djili, zone cargo',
    status: 'open',
    hours: 'Lun-Sam 08:00-18:00',
    phone: '+243 800 000 901',
    services: ['depot', 'transit', 'dedouanement', 'livraison'],
    destinations: ['Chine', 'Dubai', 'France', 'Angola', 'Tanzanie'],
    transports: ['air', 'sea', 'road'],
    estimatedDelay: '3 a 12 jours',
    estimatedFees: 'a partir de 60 USD',
    documents: ['piece d\'identite', 'facture', 'description colis'],
    landmarks: 'Entree cargo, cote fret international',
  },
  {
    id: 'int-port',
    name: 'Ugavi Port International',
    scope: 'international',
    zone: 'Port de Kinshasa',
    eta: '22 min',
    lat: -4.3019,
    lon: 15.3158,
    country: 'RDC',
    city: 'Kinshasa',
    address: 'Port de Kinshasa, quai transit international',
    status: 'open',
    hours: 'Lun-Ven 07:30-17:00',
    phone: '+243 800 000 902',
    services: ['depot', 'transit', 'consolidation', 'dedouanement'],
    destinations: ['Angola', 'Tanzanie', 'Congo-Brazzaville', 'Dubai'],
    transports: ['sea', 'road', 'rail'],
    estimatedDelay: '7 a 21 jours',
    estimatedFees: 'a partir de 45 USD',
    documents: ['piece d\'identite', 'facture', 'liste colisage'],
    landmarks: 'Quai logistique principal',
  },
  {
    id: 'int-guangzhou',
    name: 'Agence Transitaire Guangzhou eNKAMBA Partner',
    scope: 'international',
    zone: 'Baiyun District',
    eta: 'Agence distante',
    lat: 23.2608,
    lon: 113.302,
    country: 'Chine',
    city: 'Guangzhou',
    address: 'Baiyun District, Logistics Center, Guangzhou',
    status: 'open',
    hours: 'Lun-Sam 09:00-19:00',
    phone: '+86 20 0000 0984',
    services: ['depot', 'transit', 'consolidation', 'export', 'fret aerien', 'fret maritime'],
    destinations: ['RDC', 'Angola', 'Tanzanie', 'Kenya'],
    transports: ['air', 'sea', 'rail', 'road'],
    estimatedDelay: '5 a 25 jours',
    estimatedFees: 'a partir de 38 USD',
    documents: ['facture fournisseur', 'packing list', 'photo colis'],
    landmarks: 'Entrepot partenaire pres du corridor Baiyun',
  },
  {
    id: 'int-dubai',
    name: 'Ugavi Dubai Cargo Partner',
    scope: 'international',
    zone: 'Deira Cargo',
    eta: 'Agence distante',
    lat: 25.276987,
    lon: 55.296249,
    country: 'Dubai',
    city: 'Dubai',
    address: 'Deira Cargo Village, Dubai',
    status: 'open',
    hours: 'Lun-Sam 08:30-18:30',
    phone: '+971 4 000 0984',
    services: ['depot', 'transit', 'dedouanement', 'livraison'],
    destinations: ['RDC', 'Angola', 'France', 'Tanzanie'],
    transports: ['air', 'sea', 'road'],
    estimatedDelay: '3 a 14 jours',
    estimatedFees: 'a partir de 55 USD',
    documents: ['piece deposant', 'facture', 'declaration valeur'],
    landmarks: 'Zone cargo Deira',
  },
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

const internationalTransportLabels: Record<InternationalTransportMode, string> = {
  air: 'Avion',
  sea: 'Bateau',
  rail: 'Train',
  road: 'Vehicule',
};

const internationalServiceLabels: Record<InternationalServiceType, string> = {
  deposit: 'Depot',
  transit: 'Transit',
  customs: 'Dedouanement',
  delivery: 'Livraison',
};

const nationalTransportLabels: Record<NationalTransportMode, string> = {
  air: 'Avion',
  truck: 'Camion',
  bus: 'Bus',
  rail: 'Train',
  boat: 'Bateau',
};

const relayDeliveryLabels: Record<RelayDeliveryMode, string> = {
  deposit: 'Depot',
  pickup: 'Retrait',
  moto: 'Livraison moto',
  express: 'Express',
  truck: 'Camion',
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

function markerPercent(point: GeoPoint, center: GeoPoint, radius = 0.06) {
  const left = 50 + (point.lon - center.lon) * (38 / radius);
  const top = 50 - (point.lat - center.lat) * (34 / radius);
  return {
    left: Math.min(88, Math.max(12, left)),
    top: Math.min(82, Math.max(16, top)),
  };
}

function markerPosition(point: GeoPoint, center: GeoPoint, radius = 0.06) {
  const position = markerPercent(point, center, radius);
  return {
    left: `${position.left}%`,
    top: `${position.top}%`,
  };
}

function LocomotionIcon({ type }: { type: Courier['locomotion'] }) {
  if (type === 'moto' || type === 'bike') return <MotoRideIcon size={20} />;
  if (type === 'car') return <MobilityIcon size={20} />;
  if (type === 'truck') return <SendPackageIcon size={20} />;
  if (type === 'drone') return <FiveGoFlightIcon size={20} />;
  return <MapPinIcon size={20} />;
}

function FloatingBadge({
  children,
  tone = 'emerald',
}: {
  children: ReactNode;
  tone?: 'emerald' | 'orange' | 'slate';
}) {
  const toneClass =
    tone === 'orange'
      ? 'border-orange-200/70 bg-orange-50/76 shadow-orange-900/10'
      : tone === 'slate'
        ? 'border-slate-200/70 bg-white/74 shadow-slate-900/10'
        : 'border-primary/20/70 bg-primary/5/76 shadow-primary/10';

  return (
    <div className={`rounded-2xl border p-2 shadow-2xl backdrop-blur-2xl ring-1 ring-white/55 ${toneClass}`}>
      {children}
    </div>
  );
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
  Icon: CustomIcon;
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
        className="h-11 rounded-xl border-white/70 bg-white/78 pl-9 shadow-xl backdrop-blur-xl"
      />
      {isOpen && (isLoading || suggestions.length > 0) && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl border border-white/70 bg-white/90 shadow-2xl backdrop-blur-xl">
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
                className="flex w-full items-start gap-2 px-3 py-2 text-left transition hover:bg-primary/5"
              >
                <MapPinIcon size={18} />
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

function buildAgencySuggestions(scope: AgencyScope, field: AddressField, query: string): AddressSuggestion[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery.length < 2) return [];

  const suggestions: AddressSuggestion[] = [];
  const addSuggestion = (suggestion: AddressSuggestion) => {
    const key = `${suggestion.label}-${suggestion.secondary}`.toLowerCase();
    if (!suggestions.some((item) => `${item.label}-${item.secondary}`.toLowerCase() === key)) {
      suggestions.push(suggestion);
    }
  };

  AGENCIES.filter((agency) => agency.scope === scope).forEach((agency) => {
    if (field === 'pickup') {
      const pickupValues = [agency.city, agency.country, agency.province, agency.zone, agency.address, agency.name].filter(Boolean) as string[];
      if (pickupValues.some((value) => value.toLowerCase().includes(normalizedQuery))) {
        addSuggestion({
          id: `agency-${agency.id}`,
          label: agency.city || agency.zone,
          secondary: agency.country ? `${agency.country} · ${agency.name}` : agency.name,
          lat: agency.lat,
          lon: agency.lon,
          source: 'local',
        });
      }
      return;
    }

    agency.destinations?.forEach((destination) => {
      if (destination.toLowerCase().includes(normalizedQuery)) {
        addSuggestion({
          id: `destination-${agency.id}-${destination}`,
          label: destination,
          secondary: agency.name,
          lat: agency.lat,
          lon: agency.lon,
          source: 'local',
        });
      }
    });
  });

  return suggestions.slice(0, 6);
}

export default function UgaviPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const { businessUser } = useBusinessStatus();
  const mapGestureRef = useRef<{
    pointers: Map<number, { x: number; y: number }>;
    pinchDistance: number | null;
  }>({ pointers: new Map(), pinchDistance: null });
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
  const [deliveryStep, setDeliveryStep] = useState<DeliveryStep>('route');
  const [deliverySenderName, setDeliverySenderName] = useState('');
  const [deliverySenderPhone, setDeliverySenderPhone] = useState('');
  const [deliveryRecipientName, setDeliveryRecipientName] = useState('');
  const [deliveryRecipientPhone, setDeliveryRecipientPhone] = useState('');
  const [deliveryPackageType, setDeliveryPackageType] = useState('');
  const [deliveryPackageWeight, setDeliveryPackageWeight] = useState('');
  const [deliveryPackageValue, setDeliveryPackageValue] = useState('');
  const [confirmedDeliveryTracking, setConfirmedDeliveryTracking] = useState<string | null>(null);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [isClientPanelOpen, setIsClientPanelOpen] = useState(false);
  const [isProcessingExpressPayment, setIsProcessingExpressPayment] = useState(false);
  const [userPosition, setUserPosition] = useState(KINSHASA_CENTER);
  const [mapViewCenter, setMapViewCenter] = useState(KINSHASA_CENTER);
  const [mapRadius, setMapRadius] = useState(0.06);
  const [hasUserMovedMap, setHasUserMovedMap] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [recentShipments, setRecentShipments] = useState<Array<{
    id: string;
    trackingNumber: string;
    destination: string;
    origin: string;
    status: string;
    source: 'ugavi' | 'nkampa';
    serviceMode: string;
    transportLabel: string;
    agencyName: string;
    courierName: string;
    paymentLabel: string;
    packageDescription: string;
    amountLabel: string;
    updatedAtLabel: string;
    operationLabel: string;
    detailLines: string[];
  }>>([]);
  const [relayCity, setRelayCity] = useState('Kinshasa');
  const [relayArea, setRelayArea] = useState('Gombe');
  const [relayDestination, setRelayDestination] = useState('Gombe');
  const [relayDeliveryMode, setRelayDeliveryMode] = useState<RelayDeliveryMode>('moto');
  const [hasRelaySearch, setHasRelaySearch] = useState(false);
  const [relayParcelDescription, setRelayParcelDescription] = useState('');
  const [relayTrackingCode, setRelayTrackingCode] = useState<string | null>(null);
  const [isCreatingRelayParcel, setIsCreatingRelayParcel] = useState(false);
  const [nationalCity, setNationalCity] = useState('Kinshasa');
  const [nationalArea, setNationalArea] = useState('Gombe');
  const [nationalDestination, setNationalDestination] = useState('Lubumbashi');
  const [nationalTransport, setNationalTransport] = useState<NationalTransportMode>('truck');
  const [hasNationalSearch, setHasNationalSearch] = useState(false);
  const [nationalDepositDescription, setNationalDepositDescription] = useState('');
  const [nationalDepositCode, setNationalDepositCode] = useState<string | null>(null);
  const [isCreatingNationalDeposit, setIsCreatingNationalDeposit] = useState(false);
  const [internationalSearchScope, setInternationalSearchScope] = useState<InternationalSearchScope>('foreign_country');
  const [requesterCountry, setRequesterCountry] = useState('RDC');
  const [packageCountry, setPackageCountry] = useState('Chine');
  const [packageCity, setPackageCity] = useState('Guangzhou');
  const [destinationCountry, setDestinationCountry] = useState('RDC');
  const [destinationCity, setDestinationCity] = useState('Kinshasa');
  const [internationalTransport, setInternationalTransport] = useState<InternationalTransportMode>('air');
  const [internationalService, setInternationalService] = useState<InternationalServiceType>('deposit');
  const [hasInternationalSearch, setHasInternationalSearch] = useState(false);
  const [depositDescription, setDepositDescription] = useState('');
  const [depositDeadline, setDepositDeadline] = useState('');
  const [depositInstructions, setDepositInstructions] = useState<string | null>(null);
  const [depositInstructionCode, setDepositInstructionCode] = useState<string | null>(null);
  const [isCreatingDepositInstruction, setIsCreatingDepositInstruction] = useState(false);

  useEffect(() => {
    const syncStoredLocation = () => {
      const storedLocation = readDashboardLocation();
      setUserPosition(storedLocation ? toGeoPoint(storedLocation) : KINSHASA_CENTER);
    };

    syncStoredLocation();
    window.addEventListener(DASHBOARD_LOCATION_EVENT, syncStoredLocation);
    window.addEventListener('storage', syncStoredLocation);
    return () => {
      window.removeEventListener(DASHBOARD_LOCATION_EVENT, syncStoredLocation);
      window.removeEventListener('storage', syncStoredLocation);
    };
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

    if (mode === 'send') {
      setAddressSuggestions((current) => ({
        ...current,
        [activeAddressField]: buildAgencySuggestions(shipmentType, activeAddressField, trimmedQuery),
      }));
      setIsAddressSearchLoading(false);
      return;
    }

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
  }, [activeAddressField, mode, pickupLocation, dropoffLocation, shipmentType]);

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
        const formatDate = (value: any) => {
          const date = value?.toDate?.() || (value?.seconds ? new Date(value.seconds * 1000) : null);
          return date ? date.toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Mise a jour recente';
        };
        const getOperationLabel = (data: any) => {
          const mode = (data.serviceMode || data.shipmentType || '').toString();
          if (mode === 'international') return 'Agence internationale';
          if (mode === 'national') return 'Agence nationale';
          if (mode === 'relay') return 'Agence relais';
          if (mode === 'express') return 'Livraison';
          if (data.relayShipment) return 'Agence relais';
          if (data.nationalShipment) return 'Agence nationale';
          if (data.internationalShipment) return 'Agence internationale';
          return 'Operation logistique';
        };
        const getTransportLabel = (data: any) =>
          data.transportCategoryLabel ||
          data.internationalShipment?.transportLabel ||
          data.nationalShipment?.transportLabel ||
          data.relayShipment?.serviceLabel ||
          data.selectedCourier?.locomotion ||
          data.serviceMode ||
          'Transport';
        const getAmountLabel = (data: any) => {
          const pricingTotal = data.pricing?.total;
          const total = pricingTotal ?? data.totalAmount ?? data.amount ?? 0;
          const currency = data.pricing?.currency || data.currency || 'CDF';
          return Number(total) > 0 ? `${Number(total).toLocaleString('fr-FR')} ${currency}` : 'A confirmer';
        };

        const ugaviItems = ugaviSnapshot.docs.map((shipmentDoc) => {
          const data = shipmentDoc.data() as any;
          const agencyName = data.selectedAgency?.name || data.registrationAgency || data.agencyName || '';
          const courierName = data.selectedCourier?.name || data.courierName || '';
          const detailLines = [
            data.packageDescription || data.description || data.parcelName || data.packageType ? `Colis: ${data.packageDescription || data.description || data.parcelName || data.packageType}` : '',
            getTransportLabel(data) ? `Transport: ${getTransportLabel(data)}` : '',
            agencyName ? `Agence: ${agencyName}` : '',
            courierName ? `Livreur: ${courierName}` : '',
            data.cbm || data.totalVolumeCbm ? `CBM: ${data.totalVolumeCbm || data.cbm}` : '',
            data.volumetricWeightKg ? `Poids volumetrique: ${data.volumetricWeightKg} kg` : '',
            data.invoice?.invoiceNumber ? `Facture: ${data.invoice.invoiceNumber}` : '',
            data.paymentStatus ? `Paiement: ${data.paymentStatus}` : '',
          ].filter(Boolean);
          return {
            id: shipmentDoc.id,
            trackingNumber: data.trackingNumber || `UGV-${shipmentDoc.id.slice(0, 6).toUpperCase()}`,
            destination: data.receiverAddress || 'Destination Ugavi',
            origin: data.senderAddress || data.pickupLocation || 'Point de depart',
            status: normalizeStatus(data.logisticsStatus || data.status || 'pending_payment'),
            source: 'ugavi' as const,
            serviceMode: data.serviceMode || data.shipmentType || '',
            transportLabel: getTransportLabel(data),
            agencyName,
            courierName,
            paymentLabel: data.paymentStatus === 'completed' ? 'Payé' : data.paymentStatus === 'cash_on_delivery' ? 'A la livraison' : 'En attente',
            packageDescription: data.packageDescription || data.description || data.parcelName || data.packageType || 'Colis Ugavi',
            amountLabel: getAmountLabel(data),
            updatedAtLabel: formatDate(data.updatedAt || data.createdAt),
            operationLabel: getOperationLabel(data),
            detailLines,
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
              origin: data.pickupRoute?.storeLocationLabel || data.storeName || 'Boutique Nkampa',
              status: normalizeStatus(data.status || 'pending'),
              source: 'nkampa' as const,
              serviceMode: 'nkampa_order',
              transportLabel: data.deliveryOption || 'Livraison Nkampa',
              agencyName: data.storeName || data.sellerName || 'Boutique Nkampa',
              courierName: data.courierName || '',
              paymentLabel: data.paymentStatus === 'paid' ? 'Payé' : 'En attente',
              packageDescription: data.items?.[0]?.name || data.productName || 'Commande Nkampa',
              amountLabel: data.totalAmount ? `${Number(data.totalAmount).toLocaleString('fr-FR')} CDF` : 'A confirmer',
              updatedAtLabel: formatDate(data.updatedAt || data.createdAt),
              operationLabel: 'Commande e-commerce',
              detailLines: [
                data.items?.[0]?.name || data.productName ? `Produit: ${data.items?.[0]?.name || data.productName}` : '',
                data.storeName || data.sellerName ? `Boutique: ${data.storeName || data.sellerName}` : '',
                data.deliveryOption ? `Mode: ${data.deliveryOption}` : '',
                data.paymentStatus ? `Paiement: ${data.paymentStatus}` : '',
              ].filter(Boolean),
              updatedAt: data.updatedAt?.toMillis?.() || 0,
            };
          })
          .filter(Boolean) as Array<any>;

        const merged = [...ugaviItems, ...nkampaItems]
          .sort((left, right) => right.updatedAt - left.updatedAt)
          .slice(0, 20)
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

  const filteredInternationalAgencies = useMemo(() => {
    if (!hasInternationalSearch) {
      return AGENCIES.filter((agency) => agency.scope === 'international');
    }

    const lookupCountry = internationalSearchScope === 'current_country' ? requesterCountry : packageCountry;
    const lookupCity = internationalSearchScope === 'current_country' ? '' : packageCity;
    const normalizedCountry = lookupCountry.trim().toLowerCase();
    const normalizedCity = lookupCity.trim().toLowerCase();
    const normalizedDestination = destinationCountry.trim().toLowerCase();
    const selectedServiceLabel = internationalServiceLabels[internationalService].toLowerCase();

    return AGENCIES.filter((agency) => {
      if (agency.scope !== 'international') return false;
      const countryMatch = !normalizedCountry || agency.country?.toLowerCase().includes(normalizedCountry);
      const cityMatch = !normalizedCity || agency.city?.toLowerCase().includes(normalizedCity);
      const destinationMatch = !normalizedDestination || agency.destinations?.some((destination) => destination.toLowerCase().includes(normalizedDestination));
      const transportMatch = !agency.transports || agency.transports.includes(internationalTransport);
      const serviceMatch = !agency.services || agency.services.some((service) => service.toLowerCase().includes(selectedServiceLabel));
      return countryMatch && cityMatch && destinationMatch && transportMatch && serviceMatch;
    });
  }, [
    destinationCountry,
    hasInternationalSearch,
    internationalSearchScope,
    internationalService,
    internationalTransport,
    packageCity,
    packageCountry,
    requesterCountry,
  ]);

  const filteredClientShipments = useMemo(() => {
    const queryValue = clientSearchQuery.trim().toLowerCase();
    if (!queryValue) return recentShipments;

    return recentShipments.filter((shipment) => [
      shipment.trackingNumber,
      shipment.destination,
      shipment.origin,
      shipment.status,
      shipment.operationLabel,
      shipment.transportLabel,
      shipment.agencyName,
      shipment.courierName,
      shipment.packageDescription,
      shipment.paymentLabel,
      ...shipment.detailLines,
    ].some((value) => value.toLowerCase().includes(queryValue)));
  }, [clientSearchQuery, recentShipments]);

  const filteredNationalAgencies = useMemo(() => {
    if (!hasNationalSearch) {
      return AGENCIES.filter((agency) => agency.scope === 'national');
    }

    const normalizedCity = nationalCity.trim().toLowerCase();
    const normalizedArea = nationalArea.trim().toLowerCase();
    const normalizedDestination = nationalDestination.trim().toLowerCase();

    return AGENCIES.filter((agency) => {
      if (agency.scope !== 'national') return false;
      const cityMatch = !normalizedCity || agency.city?.toLowerCase().includes(normalizedCity) || agency.province?.toLowerCase().includes(normalizedCity);
      const areaMatch = !normalizedArea || agency.zone.toLowerCase().includes(normalizedArea) || agency.address?.toLowerCase().includes(normalizedArea) || agency.name.toLowerCase().includes(normalizedArea);
      const destinationMatch = !normalizedDestination || agency.destinations?.some((destination) => destination.toLowerCase().includes(normalizedDestination));
      const transportMatch = !agency.nationalTransports || agency.nationalTransports.includes(nationalTransport);
      return cityMatch && areaMatch && destinationMatch && transportMatch;
    });
  }, [hasNationalSearch, nationalArea, nationalCity, nationalDestination, nationalTransport]);

  const filteredRelayAgencies = useMemo(() => {
    if (!hasRelaySearch) {
      return AGENCIES.filter((agency) => agency.scope === 'relay');
    }

    const normalizedCity = relayCity.trim().toLowerCase();
    const normalizedArea = relayArea.trim().toLowerCase();
    const normalizedDestination = relayDestination.trim().toLowerCase();

    return AGENCIES.filter((agency) => {
      if (agency.scope !== 'relay') return false;
      const cityMatch = !normalizedCity || agency.city?.toLowerCase().includes(normalizedCity) || agency.province?.toLowerCase().includes(normalizedCity);
      const areaMatch = !normalizedArea || agency.zone.toLowerCase().includes(normalizedArea) || agency.address?.toLowerCase().includes(normalizedArea) || agency.name.toLowerCase().includes(normalizedArea);
      const destinationMatch = !normalizedDestination || agency.destinations?.some((destination) => destination.toLowerCase().includes(normalizedDestination));
      const serviceMatch = !agency.relayServices || agency.relayServices.includes(relayDeliveryMode);
      return cityMatch && areaMatch && destinationMatch && serviceMatch;
    });
  }, [hasRelaySearch, relayArea, relayCity, relayDeliveryMode, relayDestination]);

  const availableAgencies = useMemo(
    () => {
      if (shipmentType === 'international') return filteredInternationalAgencies;
      if (shipmentType === 'relay') return filteredRelayAgencies;
      return filteredNationalAgencies;
    },
    [filteredInternationalAgencies, filteredNationalAgencies, filteredRelayAgencies, shipmentType]
  );

  const selectedAgency = availableAgencies.find((agency) => agency.id === selectedAgencyId) || null;
  const selectedCourier = COURIERS.find((courier) => courier.id === selectedCourierId) || null;
  const activeRouteTarget = mode === 'express' ? selectedCourier : selectedAgency;
  const routeStartPoint = tripStatus === 'running' ? userPosition : pickupPoint || userPosition;
  const activeDistance = activeRouteTarget ? distanceKm(routeStartPoint, activeRouteTarget) : null;
  const activeEtaMinutes = activeDistance ? Math.max(4, Math.round((activeDistance / (transportMode === 'walk' ? 4 : transportMode === 'bike' ? 12 : 24)) * 60)) : null;
  const deliveryRouteDistance = pickupPoint && dropoffPoint ? distanceKm(pickupPoint, dropoffPoint) : null;
  const deliveryWeight = Number(deliveryPackageWeight || '0');
  const deliveryBaseFare = selectedCourier?.fare || 0;
  const deliveryDistanceFee = deliveryRouteDistance ? Math.round(deliveryRouteDistance * 650) : 0;
  const deliveryWeightFee = Number.isFinite(deliveryWeight) && deliveryWeight > 1 ? Math.round((deliveryWeight - 1) * 1200) : 0;
  const deliveryInsuranceFee = Number(deliveryPackageValue || '0') > 0 ? 500 : 0;
  const deliveryTotal = deliveryBaseFare + deliveryDistanceFee + deliveryWeightFee + deliveryInsuranceFee;
  const defaultMapCenter = useMemo(() => {
    if (activeRouteTarget && isRouteReady) {
      return {
        lat: (routeStartPoint.lat + activeRouteTarget.lat) / 2,
        lon: (routeStartPoint.lon + activeRouteTarget.lon) / 2,
      };
    }
    return userPosition;
  }, [activeRouteTarget, isRouteReady, routeStartPoint, userPosition]);
  const mapCenter = mapViewCenter;
  const showAgencyMarkers = mode === 'send' && (
    shipmentType === 'international'
      ? hasInternationalSearch
      : shipmentType === 'relay'
        ? hasRelaySearch
        : hasNationalSearch
  );
  const showCourierMarkers =
    (mode === 'express' && pickupLocation && dropoffLocation && deliveryStep !== 'route') ||
    (mode === 'send' && shipmentType === 'relay' && Boolean(selectedAgency));
  const hasExpressRoute = Boolean(pickupLocation.trim() && dropoffLocation.trim());
  const routeLine = useMemo(() => {
    if (!activeRouteTarget) return null;
    const start = markerPercent(routeStartPoint, mapCenter, mapRadius);
    const end = markerPercent(activeRouteTarget, mapCenter, mapRadius);

    return {
      start,
      end,
    };
  }, [activeRouteTarget, mapCenter, mapRadius, routeStartPoint]);

  useEffect(() => {
    if (!hasUserMovedMap || tripStatus === 'running') {
      setMapViewCenter(defaultMapCenter);
    }
  }, [defaultMapCenter, hasUserMovedMap, tripStatus]);

  const startTrip = () => {
    if (!activeRouteTarget) {
      toast({ variant: 'destructive', title: 'Destination requise', description: 'Selectionnez une agence ou un livreur.' });
      return;
    }

    setTripStatus('running');
  };

  const pauseTrip = () => setTripStatus('paused');

  const stopTrip = () => {
    setTripStatus('idle');
  };

  const recenterMap = () => {
    setHasUserMovedMap(false);
    setMapViewCenter(defaultMapCenter);
  };

  const zoomMap = (direction: 'in' | 'out') => {
    if (!isRouteReady) {
      setMapViewCenter(userPosition);
      setHasUserMovedMap(false);
    }
    setMapRadius((current) => {
      const next = direction === 'in' ? current * 0.72 : current / 0.72;
      return Math.min(0.18, Math.max(0.012, next));
    });
  };

  const panMapByPixels = (deltaX: number, deltaY: number) => {
    const width = window.innerWidth || 1;
    const height = window.innerHeight || 1;
    setHasUserMovedMap(true);
    setMapViewCenter((current) => ({
      lat: current.lat + (deltaY / height) * mapRadius * 2,
      lon: current.lon - (deltaX / width) * mapRadius * 2,
    }));
  };

  const handleMapPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    mapGestureRef.current.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (mapGestureRef.current.pointers.size === 2) {
      const points = Array.from(mapGestureRef.current.pointers.values());
      mapGestureRef.current.pinchDistance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
    }
  };

  const handleMapPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const previous = mapGestureRef.current.pointers.get(event.pointerId);
    if (!previous) return;

    mapGestureRef.current.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const pointers = Array.from(mapGestureRef.current.pointers.values());

    if (pointers.length === 1) {
      panMapByPixels(event.clientX - previous.x, event.clientY - previous.y);
      return;
    }

    if (pointers.length === 2) {
      const nextDistance = Math.hypot(pointers[0].x - pointers[1].x, pointers[0].y - pointers[1].y);
      const previousDistance = mapGestureRef.current.pinchDistance || nextDistance;
      const ratio = nextDistance / previousDistance;
      mapGestureRef.current.pinchDistance = nextDistance;
      if (!isRouteReady) {
        setMapViewCenter(userPosition);
        setHasUserMovedMap(false);
      }
      setMapRadius((current) => Math.min(0.18, Math.max(0.012, current / ratio)));
    }
  };

  const handleMapPointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    mapGestureRef.current.pointers.delete(event.pointerId);
    if (mapGestureRef.current.pointers.size < 2) {
      mapGestureRef.current.pinchDistance = null;
    }
  };

  const handleMapWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    zoomMap(event.deltaY > 0 ? 'out' : 'in');
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

  const shareAgencyAddress = async () => {
    if (!selectedAgency) return;
    const text = [
      selectedAgency.name,
      `${selectedAgency.city || selectedAgency.zone}, ${selectedAgency.country || ''}`.trim(),
      selectedAgency.address,
      selectedAgency.phone ? `Contact: ${selectedAgency.phone}` : null,
      selectedAgency.landmarks ? `Repere: ${selectedAgency.landmarks}` : null,
      `GPS: ${selectedAgency.lat}, ${selectedAgency.lon}`,
    ].filter(Boolean).join('\n');

    if (navigator.share) {
      await navigator.share({ title: selectedAgency.name, text });
      return;
    }
    await navigator.clipboard?.writeText(text);
    toast({ title: 'Adresse partagee', description: 'Les informations de depot ont ete copiees.' });
  };

  const sendDepositInstructions = async () => {
    if (!selectedAgency) {
      toast({ variant: 'destructive', title: 'Agence requise', description: 'Choisissez une agence internationale.' });
      return;
    }
    if (!depositDescription.trim()) {
      toast({ variant: 'destructive', title: 'Description requise', description: 'Ajoutez une description du colis.' });
      return;
    }

    const provisionalCode = `ENK-DEP-${new Date().getFullYear()}-${(selectedAgency.country || 'INT').slice(0, 2).toUpperCase()}-${Date.now().toString().slice(-6)}`;
    const requesterName = user?.displayName || user?.email || 'Requerant eNKAMBA';
    const requesterPhone = user?.phoneNumber || 'Numero non renseigne';
    const instructions = [
      `Fiche depot eNKAMBA Logistique`,
      `Code provisoire: ${provisionalCode}`,
      `Requerant: ${requesterName}`,
      `Telephone requerant: ${requesterPhone}`,
      `Agence: ${selectedAgency.name}`,
      `Adresse: ${selectedAgency.address || selectedAgency.zone}`,
      `Contact agence: ${selectedAgency.phone || 'Non renseigne'}`,
      `Destination finale: ${destinationCountry} / ${destinationCity}`,
      `Transport: ${internationalTransportLabels[internationalTransport]}`,
      `Service: ${internationalServiceLabels[internationalService]}`,
      `Colis: ${depositDescription || 'Description a completer au depot'}`,
      `Date limite: ${depositDeadline || 'A definir'}`,
      `GPS: ${selectedAgency.lat}, ${selectedAgency.lon}`,
      `QR: ${provisionalCode}`,
    ].join('\n');

    setIsCreatingDepositInstruction(true);
    try {
      await addDoc(collection(db, 'ugaviRequests'), {
        userId: user?.uid || null,
        status: 'pending_deposit',
        paymentStatus: 'pending',
        logisticsStatus: 'draft',
        serviceMode: 'international',
        trackingNumber: provisionalCode,
        provisionalDepositCode: provisionalCode,
        senderName: requesterName,
        senderAddress: `${packageCity}, ${packageCountry}`,
        receiverName: 'Destinataire international',
        receiverAddress: `${destinationCity}, ${destinationCountry}`,
        packageWeight: 0,
        description: depositDescription,
        serviceInstructions: instructions,
        eta: selectedAgency.estimatedDelay || 'Selon trajet international',
        selectedAgency,
        internationalShipment: {
          requesterCountry,
          packageCountry,
          packageCity,
          destinationCountry,
          destinationCity,
          transport: internationalTransport,
          transportLabel: internationalTransportLabels[internationalTransport],
          service: internationalService,
          serviceLabel: internationalServiceLabels[internationalService],
          depositDeadline,
        },
        totalAmount: 0,
        statusHistory: [
          buildUgaviStatusEntry('draft', requesterName, `${packageCity}, ${packageCountry}`, 'Instructions de depot international creees'),
        ],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setDepositInstructionCode(provisionalCode);
      setDepositInstructions(instructions);
      await navigator.clipboard?.writeText(instructions);
      toast({ title: 'Instructions enregistrees', description: provisionalCode });
    } catch (error) {
      console.error('Erreur instructions depot international:', error);
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible d\'enregistrer les instructions.' });
    } finally {
      setIsCreatingDepositInstruction(false);
    }
  };

  const createNationalDepositIntent = async () => {
    if (!selectedAgency) {
      toast({ variant: 'destructive', title: 'Agence requise', description: 'Choisissez une agence nationale.' });
      return;
    }
    if (!nationalDepositDescription.trim()) {
      toast({ variant: 'destructive', title: 'Description requise', description: 'Ajoutez une description du colis.' });
      return;
    }

    const provisionalCode = `ENK-NAT-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    const requesterName = user?.displayName || user?.email || 'Client eNKAMBA';

    setIsCreatingNationalDeposit(true);
    try {
      await addDoc(collection(db, 'ugaviRequests'), {
        userId: user?.uid || null,
        status: 'pending_deposit',
        paymentStatus: 'pending',
        logisticsStatus: 'draft',
        serviceMode: 'national',
        trackingNumber: provisionalCode,
        provisionalDepositCode: provisionalCode,
        senderName: requesterName,
        senderAddress: `${nationalArea}, ${nationalCity}`,
        receiverName: 'Destinataire national',
        receiverAddress: nationalDestination,
        packageWeight: 0,
        description: nationalDepositDescription,
        serviceInstructions: `Depot national a effectuer chez ${selectedAgency.name}. Adresse: ${selectedAgency.address}. Destination: ${nationalDestination}. Transport: ${nationalTransportLabels[nationalTransport]}.`,
        eta: selectedAgency.estimatedDelay || 'Selon trajet national',
        selectedAgency,
        nationalShipment: {
          city: nationalCity,
          area: nationalArea,
          destination: nationalDestination,
          transport: nationalTransport,
          transportLabel: nationalTransportLabels[nationalTransport],
        },
        totalAmount: 0,
        statusHistory: [
          buildUgaviStatusEntry('draft', requesterName, `${nationalArea}, ${nationalCity}`, 'Depot national prepare'),
        ],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setNationalDepositCode(provisionalCode);
      await navigator.clipboard?.writeText(provisionalCode);
      toast({ title: 'Depot national prepare', description: provisionalCode });
    } catch (error) {
      console.error('Erreur depot national Ugavi:', error);
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de preparer le depot national.' });
    } finally {
      setIsCreatingNationalDeposit(false);
    }
  };

  const createRelayParcelIntent = async () => {
    if (!selectedAgency) {
      toast({ variant: 'destructive', title: 'Agence requise', description: 'Choisissez une agence relais.' });
      return;
    }
    if (!relayParcelDescription.trim()) {
      toast({ variant: 'destructive', title: 'Description requise', description: 'Ajoutez une description du colis.' });
      return;
    }

    const trackingNumber = `ENK-REL-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    const requesterName = user?.displayName || user?.email || 'Client eNKAMBA';

    setIsCreatingRelayParcel(true);
    try {
      await addDoc(collection(db, 'ugaviRequests'), {
        userId: user?.uid || null,
        status: 'registered',
        paymentStatus: 'pending',
        logisticsStatus: selectedCourier ? 'assigned' : 'registered',
        serviceMode: 'relay',
        trackingNumber,
        senderName: requesterName,
        senderAddress: `${relayArea}, ${relayCity}`,
        receiverName: 'Destinataire relais',
        receiverAddress: relayDestination,
        packageWeight: 0,
        description: relayParcelDescription,
        serviceInstructions: `Colis enregistre via ${selectedAgency.name}. Service: ${relayDeliveryLabels[relayDeliveryMode]}.`,
        eta: selectedAgency.estimatedDelay || 'Selon agence relais',
        selectedAgency,
        selectedCourier,
        relayShipment: {
          city: relayCity,
          area: relayArea,
          destination: relayDestination,
          service: relayDeliveryMode,
          serviceLabel: relayDeliveryLabels[relayDeliveryMode],
          couriersAvailable: selectedAgency.couriersAvailable || 0,
        },
        totalAmount: selectedCourier?.fare || 0,
        statusHistory: [
          buildUgaviStatusEntry('registered', requesterName, `${relayArea}, ${relayCity}`, 'Colis enregistre en agence relais'),
          ...(selectedCourier ? [buildUgaviStatusEntry('assigned', selectedCourier.name, selectedCourier.zone, 'Livreur relais assigne')] : []),
        ],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setRelayTrackingCode(trackingNumber);
      await navigator.clipboard?.writeText(trackingNumber);
      toast({ title: 'Colis relais enregistre', description: trackingNumber });
    } catch (error) {
      console.error('Erreur enregistrement relais Ugavi:', error);
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible d\'enregistrer le colis relais.' });
    } finally {
      setIsCreatingRelayParcel(false);
    }
  };

  const searchTracking = () => {
    if (!trackingQuery.trim()) {
      toast({ variant: 'destructive', title: 'Numero requis', description: 'Veuillez entrer un numero de suivi.' });
      return;
    }
    router.push(`/dashboard/ugavi/tracking?tracking=${encodeURIComponent(trackingQuery.trim())}`);
  };

  const prepareAgencyRoute = () => {
    if (shipmentType === 'international') {
      if (!hasInternationalSearch) {
        toast({ variant: 'destructive', title: 'Recherche requise', description: 'Recherchez une agence internationale avant de continuer.' });
        return;
      }
      if (!selectedAgency) {
        toast({ variant: 'destructive', title: 'Agence requise', description: 'Selectionnez une agence internationale.' });
        return;
      }
      setIsRouteReady(true);
      setTripStatus('idle');
      setMapViewCenter({ lat: selectedAgency.lat, lon: selectedAgency.lon });
      setHasUserMovedMap(true);
      toast({
        title: 'Agence internationale choisie',
        description: `${selectedAgency.name} · ${selectedAgency.city || selectedAgency.zone}`,
        className: 'bg-primary text-white border-none',
      });
      return;
    }

    if (!hasNationalSearch) {
      toast({ variant: 'destructive', title: 'Recherche requise', description: 'Recherchez une agence nationale avant de continuer.' });
      return;
    }
    if (!selectedAgency) {
      toast({ variant: 'destructive', title: 'Agence requise', description: 'Selectionnez une agence nationale.' });
      return;
    }
    setIsRouteReady(true);
    setTripStatus('idle');
    toast({
      title: 'Itineraire cree',
      description: `${selectedAgency.name} · ${activeDistance?.toFixed(1)} km`,
      className: 'bg-primary text-white border-none',
    });
  };

  const handleAgencyRouteButton = () => {
    if (shipmentType === 'international') {
      prepareAgencyRoute();
      return;
    }
    if (isRouteReady) {
      startTrip();
      return;
    }
    prepareAgencyRoute();
  };

  const searchAgenciesFromCompactFields = () => {
    if (!pickupLocation.trim() || !dropoffLocation.trim()) {
      toast({ variant: 'destructive', title: 'Recherche incomplete', description: 'Renseignez la zone de depot et la destination.' });
      return;
    }

    setSelectedAgencyId(null);
    setIsRouteReady(false);
    setTripStatus('idle');

    if (shipmentType === 'international') {
      setHasInternationalSearch(true);
      setDepositInstructions(null);
      setDepositInstructionCode(null);
      return;
    }

    if (shipmentType === 'relay') {
      setHasRelaySearch(true);
      setRelayTrackingCode(null);
      return;
    }

    setHasNationalSearch(true);
    setNationalDepositCode(null);
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
    if (!deliveryRecipientName.trim() || !deliveryRecipientPhone.trim() || !deliveryPackageType.trim()) {
      toast({ variant: 'destructive', title: 'Colis incomplet', description: 'Renseignez le destinataire et le type de colis.' });
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
      senderName: deliverySenderName || actorName,
      senderAddress: pickupLocation,
      senderPhone: deliverySenderPhone,
      receiverName: deliveryRecipientName || 'Destinataire',
      receiverPhone: deliveryRecipientPhone,
      receiverAddress: dropoffLocation,
      packageWeight: Number(deliveryPackageWeight || '1'),
      declaredValue: Number(deliveryPackageValue || '0'),
      packageType: deliveryPackageType,
      description: courierInstructions || deliveryPackageType || 'Livraison',
      serviceInstructions: courierInstructions,
      eta: selectedCourier.eta,
      selectedCourier,
      totalAmount: deliveryTotal || selectedCourier.fare,
      deliveryPricing: {
        baseFare: deliveryBaseFare,
        distanceFee: deliveryDistanceFee,
        weightFee: deliveryWeightFee,
        insuranceFee: deliveryInsuranceFee,
        total: deliveryTotal || selectedCourier.fare,
        distanceKm: deliveryRouteDistance || 0,
      },
      paymentChoice,
      trackingNumber,
      transactionId: options.transactionId || '',
      statusHistory: [
        buildUgaviStatusEntry('draft', actorName, pickupLocation, 'Demande livraison creee'),
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
      setConfirmedDeliveryTracking(trackingNumber);
      setDeliveryStep('confirmed');
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
      const amount = deliveryTotal || selectedCourier.fare;

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
        description: `Livraison Ugavi - ${selectedCourier.name}`,
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
        className: 'bg-primary text-white border-none',
      });
      setShowPinDialog(false);
      setConfirmedDeliveryTracking(trackingNumber);
      setDeliveryStep('confirmed');
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
    setDeliveryStep('route');
    setConfirmedDeliveryTracking(null);
    setActiveAddressField(null);
  };

  const selectAddressSuggestion = (field: AddressField, suggestion: AddressSuggestion) => {
    const label = suggestion.secondary ? `${suggestion.label}, ${suggestion.secondary}` : suggestion.label;
    const point = { lat: suggestion.lat, lon: suggestion.lon };

    if (field === 'pickup') {
      setPickupLocation(label);
      setPickupPoint(point);
      if (mode === 'send' && shipmentType === 'national') {
        setNationalCity(suggestion.label);
        setNationalArea(suggestion.label);
        setHasNationalSearch(false);
      }
      if (mode === 'send' && shipmentType === 'relay') {
        setRelayCity(suggestion.label);
        setRelayArea(suggestion.label);
        setHasRelaySearch(false);
      }
      if (mode === 'send' && shipmentType === 'international') {
        setPackageCity(suggestion.label);
        setPackageCountry(suggestion.secondary.split('·')[0]?.trim() || suggestion.label);
        setHasInternationalSearch(false);
      }
    } else {
      setDropoffLocation(label);
      setDropoffPoint(point);
      if (mode === 'send' && shipmentType === 'national') {
        setNationalDestination(suggestion.label);
        setHasNationalSearch(false);
      }
      if (mode === 'send' && shipmentType === 'relay') {
        setRelayDestination(suggestion.label);
        setHasRelaySearch(false);
      }
      if (mode === 'send' && shipmentType === 'international') {
        setDestinationCountry(suggestion.label);
        setDestinationCity(suggestion.label);
        setHasInternationalSearch(false);
      }
    }

    setActiveAddressField(null);
    setAddressSuggestions((current) => ({ ...current, [field]: [] }));
    setIsRouteReady(false);
    setTripStatus('idle');
  };

  const updatePickupLocation = (value: string) => {
    setPickupLocation(value);
    setPickupPoint(null);
    if (mode === 'send' && shipmentType === 'national') {
      setNationalCity(value);
      setNationalArea(value);
      setHasNationalSearch(false);
      setSelectedAgencyId(null);
    }
    if (mode === 'send' && shipmentType === 'relay') {
      setRelayCity(value);
      setRelayArea(value);
      setHasRelaySearch(false);
      setSelectedAgencyId(null);
    }
    if (mode === 'send' && shipmentType === 'international') {
      setPackageCity(value);
      setPackageCountry(value);
      setHasInternationalSearch(false);
      setSelectedAgencyId(null);
    }
    if (mode === 'express') {
      setSelectedCourierId(null);
      setCourierInstructions('');
      setInstructionsConfirmed(false);
      setPaymentChoice(null);
      setDeliveryStep('route');
      setConfirmedDeliveryTracking(null);
    }
    if (mode === 'send') setIsRouteReady(false);
  };

  const updateDropoffLocation = (value: string) => {
    setDropoffLocation(value);
    setDropoffPoint(null);
    if (mode === 'send' && shipmentType === 'national') {
      setNationalDestination(value);
      setHasNationalSearch(false);
      setSelectedAgencyId(null);
    }
    if (mode === 'send' && shipmentType === 'relay') {
      setRelayDestination(value);
      setHasRelaySearch(false);
      setSelectedAgencyId(null);
    }
    if (mode === 'send' && shipmentType === 'international') {
      setDestinationCountry(value);
      setDestinationCity(value);
      setHasInternationalSearch(false);
      setSelectedAgencyId(null);
    }
    if (mode === 'express') {
      setSelectedCourierId(null);
      setCourierInstructions('');
      setInstructionsConfirmed(false);
      setPaymentChoice(null);
      setDeliveryStep('route');
      setConfirmedDeliveryTracking(null);
    }
    if (mode === 'send') setIsRouteReady(false);
  };

  return (
    <div className="relative h-full min-h-0 touch-none overflow-hidden overscroll-none bg-white">
      <iframe
        title="Carte Ugavi"
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapCenter.lon - mapRadius},${mapCenter.lat - mapRadius},${mapCenter.lon + mapRadius},${mapCenter.lat + mapRadius}&layer=mapnik`}
        className="absolute inset-0 h-full w-full border-0"
        style={{ filter: 'grayscale(1) brightness(1.18) contrast(0.82) opacity(0.7)', pointerEvents: 'none' }}
      />
      <div
        className="absolute inset-0 z-[5] touch-none cursor-grab active:cursor-grabbing"
        onPointerDown={handleMapPointerDown}
        onPointerMove={handleMapPointerMove}
        onPointerUp={handleMapPointerEnd}
        onPointerCancel={handleMapPointerEnd}
        onWheel={handleMapWheel}
      />
      <div className="pointer-events-none absolute inset-0 bg-white/30 mix-blend-screen" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(50,187,120,0.08),transparent_45%),linear-gradient(to_bottom,rgba(255,255,255,0.1),rgba(255,255,255,0.45))]" />

      <button
        type="button"
        title="Ma localisation"
        className="absolute z-20 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-primary shadow-xl ring-4 ring-primary/25"
        style={markerPosition(userPosition, mapCenter, mapRadius)}
      >
        <span className="absolute h-12 w-12 animate-ping rounded-full bg-primary/25" />
        <MapPinIcon className="relative" size={22} />
      </button>

      {pickupPoint && (
        <button
          type="button"
          title={pickupLocation}
          className="absolute z-20 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full bg-primary px-2.5 py-1.5 text-xs font-semibold text-white shadow-lg ring-2 ring-white/80"
          style={markerPosition(pickupPoint, mapCenter, mapRadius)}
        >
          <MapPinIcon size={16} />
          Depart
        </button>
      )}

      {dropoffPoint && (
        <button
          type="button"
          title={dropoffLocation}
          className="absolute z-20 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full bg-orange-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-lg ring-2 ring-white/80"
          style={markerPosition(dropoffPoint, mapCenter, mapRadius)}
        >
          <MapPinIcon size={16} />
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
              selectedAgencyId === agency.id ? 'bg-primary text-white' : 'bg-white text-slate-800'
            }`}
            style={markerPosition(agency, mapCenter, mapRadius)}
          >
            {agency.scope === 'international' ? <FiveGoFlightIcon size={24} /> : agency.scope === 'relay' ? <LogisticsRelayIcon size={30} /> : <SendPackageIcon size={24} />}
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
            style={markerPosition(courier, mapCenter, mapRadius)}
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
            className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ring-4 ring-white/80"
            style={{ left: `${routeLine.start.left}%`, top: `${routeLine.start.top}%` }}
          />
          <span
            className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ring-4 ring-white/80"
            style={{ left: `${routeLine.end.left}%`, top: `${routeLine.end.top}%` }}
          />
        </div>
      )}

      <header className="absolute left-0 right-0 top-0 z-30 flex items-center justify-between px-4 py-3">
        <div className="rounded-full bg-white/88 px-4 py-2 shadow-lg backdrop-blur">
          <p className="flex items-center gap-2 text-sm font-black text-primary">
            <UgaviIcon size={22} />
            Ugavi
          </p>
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

      <div className="absolute right-4 top-24 z-30 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => zoomMap('in')}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/92 text-lg font-black text-primary shadow-lg backdrop-blur"
          title="Zoomer"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => zoomMap('out')}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/92 text-lg font-black text-primary shadow-lg backdrop-blur"
          title="Dezoomer"
        >
          -
        </button>
        <button
          type="button"
          onClick={recenterMap}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-lg"
          title="Recentrer"
        >
          <UgaviIcon size={20} />
        </button>
      </div>

      <section className="absolute left-3 right-3 top-16 z-30 mx-auto max-w-md">
        <div className="grid grid-cols-3 gap-1 rounded-[22px] border border-white/70 bg-white/70 p-1.5 shadow-2xl shadow-primary/10 backdrop-blur-2xl ring-1 ring-white/50">
          {[
            { id: 'send', label: 'Envoyer', icon: LogisticsStandardIcon },
            { id: 'track', label: 'Suivi', icon: LogisticsTrackingIcon },
            { id: 'express', label: 'Livraison', icon: LogisticsExpressIcon },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = mode === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => resetContextForMode(item.id as UgaviMode)}
                className={`flex items-center justify-center gap-1.5 rounded-2xl px-2 py-1.5 text-sm font-semibold transition ${
                  isActive ? 'bg-white text-primary shadow-lg shadow-primary/10' : 'text-slate-500 hover:bg-white/50 hover:text-slate-800'
                }`}
              >
                <Icon size={26} />
                {item.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="absolute bottom-24 left-3 right-3 z-30 mx-auto grid max-w-md gap-2 lg:left-4 lg:right-auto lg:mx-0 lg:w-[380px]">
        <div className="space-y-2">

          {mode === 'track' ? (
            <FloatingBadge tone="slate">
              <div className="space-y-2">
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <LogisticsTrackingIcon size={26} />
                </div>
                <Input
                  value={trackingQuery}
                  onChange={(event) => setTrackingQuery(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && searchTracking()}
                  placeholder="Numero de suivi"
                  className="h-12 rounded-2xl border-white/70 bg-white/86 pl-12 font-semibold shadow-inner"
                />
              </div>
              <Button onClick={searchTracking} className="h-11 w-full rounded-xl bg-primary hover:bg-primary">
                Rechercher
              </Button>
              </div>
            </FloatingBadge>
          ) : (
            <div className="space-y-3">
              {mode === 'express' && (
                <div className="space-y-2">
                  <AddressAutocompleteInput
                    value={pickupLocation}
                    onChange={updatePickupLocation}
                    onFocus={() => setActiveAddressField('pickup')}
                    onSelect={(suggestion) => selectAddressSuggestion('pickup', suggestion)}
                    placeholder="Point de depart"
                    Icon={MapPinIcon}
                    iconClassName="text-primary"
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
                    Icon={UgaviIcon}
                    iconClassName="text-orange-600"
                    suggestions={addressSuggestions.dropoff}
                    isLoading={isAddressSearchLoading && activeAddressField === 'dropoff'}
                    isOpen={activeAddressField === 'dropoff'}
                  />
                </div>
              )}

              {mode === 'send' && (
                <>
                  <FloatingBadge tone="slate">
                    <div className="grid grid-cols-3 gap-1">
                    {[
                      { id: 'relay', label: 'Relais', icon: LogisticsRelayIcon },
                      { id: 'national', label: 'National', icon: LogisticsAgencyIcon },
                      { id: 'international', label: 'International', icon: LogisticsInternationalIcon },
                    ].map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => {
                          setShipmentType(option.id as AgencyScope);
                          setSelectedAgencyId(null);
                          setSelectedCourierId(null);
                          setIsRouteReady(false);
                          setTripStatus('idle');
                          setHasRelaySearch(false);
                          setHasNationalSearch(false);
                          setHasInternationalSearch(false);
                          setPickupLocation('');
                          setDropoffLocation('');
                          setRelayTrackingCode(null);
                        }}
	                        className={`flex items-center justify-center gap-1 rounded-2xl px-2 py-1.5 text-xs font-semibold ${
	                          option.id === shipmentType
	                            ? 'bg-white text-primary shadow-lg shadow-primary/10'
	                            : 'text-slate-600 hover:bg-white/55'
	                        }`}
                      >
                        <option.icon size={24} />
                        {option.label}
                      </button>
                    ))}
                    </div>
                  </FloatingBadge>

                  <div className="space-y-2">
                    <AddressAutocompleteInput
                      value={pickupLocation}
                      onChange={updatePickupLocation}
                      onFocus={() => setActiveAddressField('pickup')}
                      onSelect={(suggestion) => selectAddressSuggestion('pickup', suggestion)}
                      placeholder={shipmentType === 'international' ? 'Pays ou ville du colis' : shipmentType === 'relay' ? 'Ville, commune ou agence relais' : 'Ville, commune, quartier ou agence'}
                      Icon={MapPinIcon}
                      iconClassName="text-primary"
                      suggestions={addressSuggestions.pickup}
                      isLoading={isAddressSearchLoading && activeAddressField === 'pickup'}
                      isOpen={activeAddressField === 'pickup'}
                    />
                    <AddressAutocompleteInput
                      value={dropoffLocation}
                      onChange={updateDropoffLocation}
                      onFocus={() => setActiveAddressField('dropoff')}
                      onSelect={(suggestion) => selectAddressSuggestion('dropoff', suggestion)}
                      placeholder={shipmentType === 'international' ? 'Pays ou ville destination' : shipmentType === 'relay' ? 'Point de livraison ou zone' : 'Ville de destination'}
                      Icon={UgaviIcon}
                      iconClassName="text-orange-600"
                      suggestions={addressSuggestions.dropoff}
                      isLoading={isAddressSearchLoading && activeAddressField === 'dropoff'}
                      isOpen={activeAddressField === 'dropoff'}
                    />
                    <FloatingBadge tone={shipmentType === 'international' ? 'orange' : 'emerald'}>
                    <div className="flex items-center gap-2">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
                        {shipmentType === 'international' ? <LogisticsInternationalIcon size={30} /> : shipmentType === 'relay' ? <LogisticsRelayIcon size={30} /> : <LogisticsAgencyIcon size={30} />}
                      </span>
                      <select
                        value={shipmentType === 'international' ? internationalTransport : shipmentType === 'relay' ? relayDeliveryMode : nationalTransport}
                        onChange={(event) => {
                          if (shipmentType === 'international') {
                            setInternationalTransport(event.target.value as InternationalTransportMode);
                            setHasInternationalSearch(false);
                          } else if (shipmentType === 'relay') {
                            setRelayDeliveryMode(event.target.value as RelayDeliveryMode);
                            setHasRelaySearch(false);
                          } else {
                            setNationalTransport(event.target.value as NationalTransportMode);
                            setHasNationalSearch(false);
                          }
                          setSelectedAgencyId(null);
                        }}
                        className="h-10 min-w-0 flex-1 rounded-2xl border border-white/70 bg-white/90 px-3 text-sm font-semibold text-slate-700 shadow-inner"
                      >
                        {Object.entries(shipmentType === 'international' ? internationalTransportLabels : shipmentType === 'relay' ? relayDeliveryLabels : nationalTransportLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                      <Button type="button" onClick={searchAgenciesFromCompactFields} className="h-10 rounded-2xl bg-primary px-4 shadow-lg shadow-primary/15 hover:bg-primary">
                        Rechercher
                      </Button>
                    </div>
                    </FloatingBadge>
                  </div>

                  {false && shipmentType === 'national' && (
                    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-black uppercase text-slate-700">1. Recherche agence nationale</p>
                        {hasNationalSearch && (
                          <button
                            type="button"
                            onClick={() => {
                              setHasNationalSearch(false);
                              setSelectedAgencyId(null);
                              setNationalDepositCode(null);
                            }}
                            className="text-xs font-semibold text-slate-500"
                          >
                            Modifier
                          </button>
                        )}
                      </div>

                      {!hasNationalSearch ? (
                        <>
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              value={nationalCity}
                              onChange={(event) => setNationalCity(event.target.value)}
                              placeholder="Ville actuelle"
                              className="h-10 rounded-xl bg-white text-sm"
                            />
                            <Input
                              value={nationalArea}
                              onChange={(event) => setNationalArea(event.target.value)}
                              placeholder="Commune, quartier, province"
                              className="h-10 rounded-xl bg-white text-sm"
                            />
                            <Input
                              value={nationalDestination}
                              onChange={(event) => setNationalDestination(event.target.value)}
                              placeholder="Destination"
                              className="h-10 rounded-xl bg-white text-sm"
                            />
                            <select
                              value={nationalTransport}
                              onChange={(event) => setNationalTransport(event.target.value as NationalTransportMode)}
                              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700"
                            >
                              {Object.entries(nationalTransportLabels).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                              ))}
                            </select>
                          </div>
                          <Button
                            type="button"
                            onClick={() => {
                              setHasNationalSearch(true);
                              setSelectedAgencyId(null);
                              setNationalDepositCode(null);
                            }}
                            className="h-10 w-full rounded-xl bg-primary hover:bg-primary"
                          >
                            Rechercher une agence nationale
                          </Button>
                        </>
                      ) : (
                        <div className="rounded-xl bg-white p-3 text-xs text-slate-600">
                          <p className="font-semibold text-slate-900">{nationalArea}, {nationalCity} {'->'} {nationalDestination}</p>
                          <p>{nationalTransportLabels[nationalTransport]} · {availableAgencies.length} agence(s) disponible(s)</p>
                        </div>
                      )}
                    </div>
                  )}

                  {false && shipmentType === 'international' && (
                    <div className="space-y-3 rounded-xl border border-primary/15 bg-primary/5/60 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-black uppercase text-primary">1. Recherche agence</p>
                        {hasInternationalSearch && (
                          <button
                            type="button"
                            onClick={() => {
                              setHasInternationalSearch(false);
                              setSelectedAgencyId(null);
                              setDepositInstructions(null);
                              setDepositInstructionCode(null);
                            }}
                            className="text-xs font-semibold text-slate-500"
                          >
                            Modifier
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'current_country', label: 'Agence dans mon pays' },
                          { id: 'foreign_country', label: 'Agence dans un autre pays' },
                        ].map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => {
                              setInternationalSearchScope(option.id as InternationalSearchScope);
                              setSelectedAgencyId(null);
                              setHasInternationalSearch(false);
                              setDepositInstructions(null);
                              setDepositInstructionCode(null);
                            }}
                            className={`rounded-xl border px-2 py-2 text-xs font-semibold ${
                              internationalSearchScope === option.id
                                ? 'border-primary bg-white text-primary shadow-sm'
                                : 'border-primary/15 bg-white/60 text-slate-600'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>

                      {!hasInternationalSearch ? (
                        <>
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              value={requesterCountry}
                              onChange={(event) => setRequesterCountry(event.target.value)}
                              placeholder="Pays actuel du requerant"
                              className="h-10 rounded-xl bg-white text-sm"
                            />
                            <Input
                              value={packageCountry}
                              onChange={(event) => setPackageCountry(event.target.value)}
                              placeholder="Pays ou se trouve le colis"
                              className="h-10 rounded-xl bg-white text-sm"
                            />
                            <Input
                              value={packageCity}
                              onChange={(event) => setPackageCity(event.target.value)}
                              placeholder="Ville de depot"
                              className="h-10 rounded-xl bg-white text-sm"
                            />
                            <Input
                              value={destinationCountry}
                              onChange={(event) => setDestinationCountry(event.target.value)}
                              placeholder="Pays de destination"
                              className="h-10 rounded-xl bg-white text-sm"
                            />
                            <Input
                              value={destinationCity}
                              onChange={(event) => setDestinationCity(event.target.value)}
                              placeholder="Ville de destination"
                              className="h-10 rounded-xl bg-white text-sm"
                            />
                            <select
                              value={internationalTransport}
                              onChange={(event) => setInternationalTransport(event.target.value as InternationalTransportMode)}
                              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700"
                            >
                              {Object.entries(internationalTransportLabels).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                              ))}
                            </select>
                            <select
                              value={internationalService}
                              onChange={(event) => setInternationalService(event.target.value as InternationalServiceType)}
                              className="col-span-2 h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700"
                            >
                              {Object.entries(internationalServiceLabels).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                              ))}
                            </select>
                          </div>

                          <Button
                            type="button"
                            onClick={() => {
                              setHasInternationalSearch(true);
                              setSelectedAgencyId(null);
                              setDepositInstructions(null);
                              setDepositInstructionCode(null);
                            }}
                            className="h-10 w-full rounded-xl bg-primary hover:bg-primary"
                          >
                            Rechercher une agence internationale
                          </Button>
                        </>
                      ) : (
                        <div className="rounded-xl bg-white p-3 text-xs text-slate-600">
                          <p className="font-semibold text-slate-900">
                            {internationalSearchScope === 'current_country' ? requesterCountry : `${packageCity}, ${packageCountry}`} {'->'} {destinationCity}, {destinationCountry}
                          </p>
                          <p>{internationalTransportLabels[internationalTransport]} · {internationalServiceLabels[internationalService]}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedAgency ? (
                    <div className="rounded-[24px] border border-white/70 bg-white/76 p-3 text-sm shadow-2xl shadow-primary/10 backdrop-blur-2xl ring-1 ring-white/55">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
                              {shipmentType === 'international' ? <LogisticsInternationalIcon size={34} /> : shipmentType === 'relay' ? <LogisticsRelayIcon size={34} /> : <LogisticsAgencyIcon size={34} />}
                            </span>
                            <span className="min-w-0">
                            <p className="truncate font-bold text-slate-900">{selectedAgency.name}</p>
                            <p className="text-xs text-slate-500">
                              {selectedAgency.city || selectedAgency.zone}{selectedAgency.country ? `, ${selectedAgency.country}` : ''} · {selectedAgency.eta}
                            </p>
                            </span>
                          </div>
                          <span className="shrink-0 rounded-full bg-primary/5 px-2 py-1 text-xs font-semibold text-primary ring-1 ring-primary/20">
                            {selectedAgency.country === requesterCountry ? `${activeDistance?.toFixed(1)} km` : selectedAgency.status === 'open' ? 'Ouverte' : 'Fermee'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                          <Button type="button" size="sm" onClick={prepareAgencyRoute} className="h-9 shrink-0 rounded-2xl bg-primary shadow-lg shadow-primary/15 hover:bg-primary">
                            Choisir
                          </Button>
                          <Button type="button" size="sm" variant="outline" onClick={handleAgencyRouteButton} className="h-9 shrink-0 rounded-2xl border-white/80 bg-white/76 shadow-sm">
                            Carte
                          </Button>
                          {shipmentType === 'international' && (
                            <Button type="button" size="sm" variant="outline" onClick={() => void shareAgencyAddress()} className="h-9 shrink-0 rounded-2xl border-white/80 bg-white/76 shadow-sm">
                              <Share2 className="mr-1 h-3.5 w-3.5" />
                              Partager
                            </Button>
                          )}
                          <Button type="button" size="sm" variant="outline" onClick={() => window.open(`tel:${selectedAgency.phone || ''}`)} className="h-9 shrink-0 rounded-2xl border-white/80 bg-white/76 shadow-sm">
                            <Phone className="mr-1 h-3.5 w-3.5" />
                            Appeler
                          </Button>
                          <Button type="button" size="sm" variant="outline" onClick={() => router.push('/dashboard/chat')} className="h-9 shrink-0 rounded-2xl border-white/80 bg-white/76 shadow-sm">
                            <MessageCircle className="mr-1 h-3.5 w-3.5" />
                            Ecrire
                          </Button>
                        </div>
                        <details className="rounded-2xl bg-white/66 px-3 py-2 text-xs text-slate-600 ring-1 ring-white/70">
                          <summary className="cursor-pointer font-semibold text-slate-800">Details agence</summary>
                          <div className="mt-2 space-y-1">
                            <p>{selectedAgency.address}</p>
                            <p>Horaires: {selectedAgency.hours} · Delai: {selectedAgency.estimatedDelay} · Frais: {selectedAgency.estimatedFees}</p>
                            <p>Destinations: {selectedAgency.destinations?.join(', ')}</p>
                            {shipmentType === 'international' ? (
                              <>
                                <p>Services: {selectedAgency.services?.join(', ')}</p>
                                <p>Transport: {selectedAgency.transports?.map((item) => internationalTransportLabels[item]).join(', ')}</p>
                                <p>Documents: {selectedAgency.documents?.join(', ')}</p>
                              </>
                            ) : shipmentType === 'relay' ? (
                              <>
                                <p>Services: {selectedAgency.relayServices?.map((item) => relayDeliveryLabels[item]).join(', ')}</p>
                                <p>Livreurs disponibles: {selectedAgency.couriersAvailable || 0}</p>
                                <p>Zone couverte: {selectedAgency.zoneCovered}</p>
                              </>
                            ) : (
                              <>
                                <p>Transport: {selectedAgency.nationalTransports?.map((item) => nationalTransportLabels[item]).join(', ')}</p>
                                <p>Capacite: {selectedAgency.capacity} · Fiabilite: {selectedAgency.reliability}</p>
                              </>
                            )}
                          </div>
                        </details>
                      </div>
                    </div>
                  ) : null}

                  {shipmentType === 'national' && hasNationalSearch && !selectedAgency && availableAgencies.length > 0 && (
                    <div className="max-h-36 space-y-1 overflow-y-auto pr-1">
                      {availableAgencies.map((agency) => (
                        <button
                          key={`${agency.id}-national-card`}
                          type="button"
                          onClick={() => {
                            setSelectedAgencyId(agency.id);
                            setNationalDepositCode(null);
                          }}
                          className="w-full rounded-2xl border border-white/70 bg-white/78 px-3 py-2 text-left text-sm shadow-lg shadow-primary/5 backdrop-blur-xl transition hover:border-primary/20 hover:bg-white/90"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-2">
                              <LogisticsAgencyIcon size={30} />
                              <span className="min-w-0">
                              <p className="truncate font-bold text-slate-900">{agency.name}</p>
                              <p className="text-xs text-slate-500">{agency.address}</p>
                              </span>
                            </div>
                            <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${agency.status === 'open' ? 'bg-primary/5 text-primary' : 'bg-slate-100 text-slate-600'}`}>
                              {agency.status === 'open' ? 'Ouverte' : 'Fermee'}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-600">
                            {agency.eta} · {agency.estimatedDelay} · {agency.estimatedFees} · {agency.reliability}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}

                  {shipmentType === 'relay' && hasRelaySearch && !selectedAgency && availableAgencies.length > 0 && (
                    <div className="max-h-40 space-y-1 overflow-y-auto pr-1">
                      {availableAgencies.map((agency) => (
                        <button
                          key={`${agency.id}-relay-card`}
                          type="button"
                          onClick={() => {
                            setSelectedAgencyId(agency.id);
                            setSelectedCourierId(null);
                            setRelayTrackingCode(null);
                          }}
                          className="w-full rounded-2xl border border-white/70 bg-white/78 px-3 py-2 text-left text-sm shadow-lg shadow-primary/5 backdrop-blur-xl transition hover:border-primary/20 hover:bg-white/90"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-2">
                              <LogisticsRelayIcon size={30} />
                              <span className="min-w-0">
                                <p className="truncate font-bold text-slate-900">{agency.name}</p>
                                <p className="truncate text-xs text-slate-500">{agency.address}</p>
                              </span>
                            </div>
                            <span className="rounded-full bg-primary/5 px-2 py-1 text-[11px] font-semibold text-primary">
                              {agency.couriersAvailable || 0} livreurs
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-600">
                            {agency.eta} · {agency.hours} · {agency.reliability}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}

                  {shipmentType === 'national' && selectedAgency && (
                    <div className="space-y-2 rounded-[24px] border border-primary/15/80 bg-primary/5/78 p-3 shadow-2xl shadow-primary/10 backdrop-blur-2xl ring-1 ring-white/55">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-black uppercase text-primary">3. Depot agence</p>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAgencyId(null);
                            setNationalDepositCode(null);
                          }}
                          className="text-xs font-semibold text-slate-500"
                        >
                          Changer agence
                        </button>
                      </div>
                      <Input
                        value={nationalDepositDescription}
                        onChange={(event) => setNationalDepositDescription(event.target.value)}
                        placeholder="Description du colis"
                        className="h-10 rounded-xl bg-white text-sm"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isCreatingNationalDeposit}
                          onClick={() => void createNationalDepositIntent()}
                          className="h-10 rounded-xl bg-white"
                        >
                          {isCreatingNationalDeposit ? 'Preparation...' : 'Deposer mon colis'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => router.push(`/dashboard/ugavi/tracking${nationalDepositCode ? `?tracking=${encodeURIComponent(nationalDepositCode)}` : ''}`)}
                          className="h-10 rounded-xl bg-white"
                        >
                          {nationalDepositCode ? 'Suivre ce depot' : 'Entrer code suivi'}
                        </Button>
                      </div>
                      {nationalDepositCode && (
                        <div className="rounded-xl bg-white p-3 text-xs text-slate-700">
                          <p className="font-mono font-black text-primary">{nationalDepositCode}</p>
                          <p className="mt-1">Code provisoire cree. L'agent national pourra enregistrer le colis officiellement et poursuivre le suivi.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {shipmentType === 'relay' && selectedAgency && (
                    <div className="space-y-2 rounded-[24px] border border-primary/15/80 bg-primary/5/78 p-3 shadow-2xl shadow-primary/10 backdrop-blur-2xl ring-1 ring-white/55">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-black uppercase text-primary">Enregistrer colis relais</p>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAgencyId(null);
                            setSelectedCourierId(null);
                            setRelayTrackingCode(null);
                          }}
                          className="text-xs font-semibold text-slate-500"
                        >
                          Changer agence
                        </button>
                      </div>
                      <Input
                        value={relayParcelDescription}
                        onChange={(event) => setRelayParcelDescription(event.target.value)}
                        placeholder="Description du colis"
                        className="h-10 rounded-2xl border-white/70 bg-white/86 text-sm shadow-inner"
                      />
                      <div className="grid grid-cols-3 gap-1">
                        {COURIERS.slice(0, 3).map((courier) => (
                          <button
                            key={`relay-courier-${courier.id}`}
                            type="button"
                            onClick={() => setSelectedCourierId(courier.id)}
                            className={`rounded-2xl border px-2 py-2 text-left text-xs shadow-sm ${
                              selectedCourierId === courier.id
                                ? 'border-primary bg-white text-primary'
                                : 'border-white/70 bg-white/70 text-slate-600'
                            }`}
                          >
                            <span className="mb-1 flex items-center gap-1">
                              <LocomotionIcon type={courier.locomotion} />
                              <span className="font-bold">{locomotionLabels[courier.locomotion]}</span>
                            </span>
                            <span className="block truncate">{courier.eta} · {courier.rating}/5</span>
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isCreatingRelayParcel}
                          onClick={() => void createRelayParcelIntent()}
                          className="h-10 rounded-2xl border-white/70 bg-white"
                        >
                          {isCreatingRelayParcel ? 'Enregistrement...' : 'Enregistrer'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => router.push(`/dashboard/ugavi/tracking${relayTrackingCode ? `?tracking=${encodeURIComponent(relayTrackingCode)}` : ''}`)}
                          className="h-10 rounded-2xl border-white/70 bg-white"
                        >
                          {relayTrackingCode ? 'Suivre' : 'Code suivi'}
                        </Button>
                      </div>
                      {relayTrackingCode && (
                        <div className="rounded-2xl bg-white/80 p-3 text-xs text-slate-700">
                          <p className="font-mono font-black text-primary">{relayTrackingCode}</p>
                          <p className="mt-1">Colis relais enregistre. Le suivi est actif.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {shipmentType === 'international' && hasInternationalSearch && !selectedAgency && availableAgencies.length > 0 && (
                    <div className="max-h-40 space-y-1 overflow-y-auto pr-1">
                      <p className="px-1 text-xs font-black uppercase text-slate-500">2. Choisir une agence</p>
                      {availableAgencies.map((agency) => (
                        <button
                          key={`${agency.id}-card`}
                          type="button"
                          onClick={() => {
                            setSelectedAgencyId(agency.id);
                            setDepositInstructions(null);
                            setDepositInstructionCode(null);
                          }}
                          className={`w-full rounded-2xl border bg-white/78 px-3 py-2 text-left text-sm shadow-lg shadow-orange-950/5 backdrop-blur-xl transition ${
	                            selectedAgencyId === agency.id ? 'border-primary' : 'border-white/70 hover:border-primary/20'
	                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-2">
                              <LogisticsInternationalIcon size={30} />
                              <span className="min-w-0">
                              <p className="font-bold text-slate-900">{agency.name}</p>
                              <p className="text-xs text-slate-500">{agency.city}, {agency.country} · {agency.address}</p>
                              </span>
                            </div>
                            <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${agency.status === 'open' ? 'bg-primary/5 text-primary' : 'bg-slate-100 text-slate-600'}`}>
                              {agency.status === 'open' ? 'Ouverte' : 'Fermee'}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {agency.transports?.map((transport) => (
                              <span key={transport} className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                                {internationalTransportLabels[transport]}
                              </span>
                            ))}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {shipmentType === 'international' && selectedAgency && (
                    <div className="space-y-2 rounded-[24px] border border-orange-100/80 bg-orange-50/78 p-3 shadow-2xl shadow-orange-950/10 backdrop-blur-2xl ring-1 ring-white/55">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-black uppercase text-orange-800">3. Instructions de depot</p>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAgencyId(null);
                            setDepositInstructions(null);
                            setDepositInstructionCode(null);
                          }}
                          className="text-xs font-semibold text-slate-500"
                        >
                          Changer agence
                        </button>
                      </div>
                      <Input
                        value={depositDescription}
                        onChange={(event) => setDepositDescription(event.target.value)}
                        placeholder="Description du colis"
                        className="h-10 rounded-xl bg-white text-sm"
                      />
                      <Input
                        value={depositDeadline}
                        onChange={(event) => setDepositDeadline(event.target.value)}
                        placeholder="Date limite de depot"
                        className="h-10 rounded-xl bg-white text-sm"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isCreatingDepositInstruction}
                          onClick={() => void sendDepositInstructions()}
                          className="h-10 rounded-xl bg-white"
                        >
                          {isCreatingDepositInstruction ? 'Enregistrement...' : 'Envoyer instructions'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => router.push(`/dashboard/ugavi/tracking${depositInstructionCode ? `?tracking=${encodeURIComponent(depositInstructionCode)}` : ''}`)}
                          className="h-10 rounded-xl bg-white"
                        >
                          {depositInstructionCode ? 'Suivre ce depot' : 'Entrer code suivi'}
                        </Button>
                      </div>
                      {depositInstructions && (
                        <div className="rounded-xl bg-white p-3 text-xs text-slate-700">
                          <p className="font-mono font-black text-primary">{depositInstructionCode}</p>
                          <p className="mt-1">Fiche enregistree et copiee. Elle est partageable au deposant et consultable dans le suivi Ugavi.</p>
                          <details className="mt-2">
                            <summary className="cursor-pointer font-semibold text-slate-800">Voir la fiche complete</summary>
                            <pre className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-[11px] text-slate-700">
                              {depositInstructions}
                            </pre>
                          </details>
                        </div>
                      )}
                    </div>
                  )}

                </>
              )}

              {mode === 'express' && (
                <>
                  {deliveryStep === 'route' && (
                    <>
                      {!hasExpressRoute && (
                        <div className="rounded-2xl border border-white/70 bg-white/78 p-3 text-sm text-slate-600 shadow-xl backdrop-blur-xl">
                          Renseignez le point de depart et la destination.
                        </div>
                      )}
                      {hasExpressRoute && (
                        <FloatingBadge tone="orange">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-xs font-black uppercase text-orange-800">Trajet analyse</p>
                                <p className="text-sm font-bold text-slate-900">{pickupLocation} → {dropoffLocation}</p>
                              </div>
                              <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-orange-700">
                                {deliveryRouteDistance ? `${deliveryRouteDistance.toFixed(1)} km` : 'Distance'}
                              </span>
                            </div>
                            <Button
                              type="button"
                              onClick={() => setDeliveryStep('options')}
                              className="h-10 w-full rounded-2xl bg-orange-600 hover:bg-orange-700"
                            >
                              Continuer
                            </Button>
                          </div>
                        </FloatingBadge>
                      )}
                    </>
                  )}

                  {deliveryStep === 'options' && (
                    <div className="grid max-h-56 grid-cols-2 gap-2 overflow-y-auto pr-1">
                      {COURIERS.map((courier) => (
                        <button
                          key={`delivery-${courier.id}`}
                          type="button"
                          onClick={() => {
                            setSelectedCourierId(courier.id);
                            setTransportMode(courier.locomotion === 'foot' ? 'walk' : courier.locomotion === 'bike' ? 'bike' : courier.locomotion === 'car' ? 'car' : 'taxi');
                            setPaymentChoice(null);
                            setConfirmedDeliveryTracking(null);
                            setDeliveryStep('parcel');
                          }}
                          className="rounded-2xl border border-white/70 bg-white/78 p-3 text-left shadow-xl backdrop-blur-xl transition hover:border-orange-200 hover:bg-white/90"
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <span className="rounded-2xl bg-orange-50 p-2 text-orange-700">
                              <LocomotionIcon type={courier.locomotion} />
                            </span>
                            <span className="text-xs font-bold text-primary">Disponible</span>
                          </div>
                          <p className="text-sm font-black text-slate-900">{courier.locomotion === 'foot' ? 'Pieton' : locomotionLabels[courier.locomotion]}</p>
                          <p className="mt-1 text-xs text-slate-500">{courier.eta} · {courier.zone}</p>
                          <p className="mt-2 text-sm font-bold text-slate-900">{(courier.fare + (deliveryRouteDistance ? Math.round(deliveryRouteDistance * 650) : 0)).toLocaleString('fr-FR')} FC</p>
                        </button>
                      ))}
                    </div>
                  )}

                  {deliveryStep === 'parcel' && selectedCourier && (
                    <div className="space-y-2 rounded-[24px] border border-orange-100/80 bg-orange-50/78 p-3 shadow-2xl shadow-orange-950/10 backdrop-blur-2xl ring-1 ring-white/55">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="rounded-2xl bg-white p-2 text-orange-700 shadow-sm">
                            <LocomotionIcon type={selectedCourier.locomotion} />
                          </span>
                          <div>
                            <p className="text-sm font-black text-slate-900">{locomotionLabels[selectedCourier.locomotion]} selectionne</p>
                            <p className="text-xs text-slate-500">{selectedCourier.eta} · {selectedCourier.rating}/5</p>
                          </div>
                        </div>
                        <button type="button" onClick={() => setDeliveryStep('options')} className="text-xs font-semibold text-slate-500">
                          Changer
                        </button>
                      </div>
                      <Input
                        value={deliveryRecipientName}
                        onChange={(event) => setDeliveryRecipientName(event.target.value)}
                        placeholder="Nom du destinataire"
                        className="h-10 rounded-2xl border-white/70 bg-white/86"
                      />
                      <Input
                        value={deliveryRecipientPhone}
                        onChange={(event) => setDeliveryRecipientPhone(event.target.value)}
                        placeholder="Telephone du destinataire"
                        className="h-10 rounded-2xl border-white/70 bg-white/86"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          value={deliveryPackageType}
                          onChange={(event) => setDeliveryPackageType(event.target.value)}
                          placeholder="Type de colis"
                          className="h-10 rounded-2xl border-white/70 bg-white/86"
                        />
                        <Input
                          value={deliveryPackageWeight}
                          onChange={(event) => setDeliveryPackageWeight(event.target.value)}
                          placeholder="Poids kg"
                          className="h-10 rounded-2xl border-white/70 bg-white/86"
                        />
                      </div>
                      <Input
                        value={deliveryPackageValue}
                        onChange={(event) => setDeliveryPackageValue(event.target.value)}
                        placeholder="Valeur declaree"
                        className="h-10 rounded-2xl border-white/70 bg-white/86"
                      />
                      <Input
                        value={courierInstructions}
                        onChange={(event) => setCourierInstructions(event.target.value)}
                        placeholder="Description, repere ou instruction"
                        className="h-10 rounded-2xl border-white/70 bg-white/86"
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          if (!deliveryRecipientName.trim() || !deliveryRecipientPhone.trim() || !deliveryPackageType.trim()) {
                            toast({ variant: 'destructive', title: 'Colis incomplet', description: 'Renseignez destinataire, telephone et type de colis.' });
                            return;
                          }
                          setInstructionsConfirmed(true);
                          setDeliveryStep('payment');
                        }}
                        className="h-10 w-full rounded-2xl bg-slate-900 hover:bg-slate-800"
                      >
                        Calculer le cout
                      </Button>
                    </div>
                  )}

                  {deliveryStep === 'payment' && selectedCourier && !paymentChoice && (
                    <div className="space-y-2 rounded-[24px] border border-white/70 bg-white/78 p-3 shadow-2xl backdrop-blur-2xl ring-1 ring-white/55">
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <p>Transport</p>
                          <p className="font-bold text-slate-900">{deliveryBaseFare.toLocaleString('fr-FR')} FC</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <p>Distance</p>
                          <p className="font-bold text-slate-900">{deliveryDistanceFee.toLocaleString('fr-FR')} FC</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <p>Poids / assurance</p>
                          <p className="font-bold text-slate-900">{(deliveryWeightFee + deliveryInsuranceFee).toLocaleString('fr-FR')} FC</p>
                        </div>
                        <div className="rounded-2xl bg-primary/5 p-3">
                          <p>Total</p>
                          <p className="font-black text-primary">{deliveryTotal.toLocaleString('fr-FR')} FC</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'wallet', label: 'eNkambapay' },
                        { id: 'cod', label: 'A la livraison' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setPaymentChoice(item.id as PaymentChoice)}
	                          className="rounded-xl border border-white/70 bg-white/78 px-3 py-2 text-sm font-semibold text-slate-600 shadow-xl backdrop-blur-xl"
                        >
                          {item.label}
                        </button>
                      ))}
                      </div>
                    </div>
                  )}

                  {deliveryStep === 'payment' && selectedCourier && paymentChoice && (
                    <Button onClick={confirmExpressDelivery} className="h-11 w-full rounded-2xl bg-orange-600 hover:bg-orange-700">
                      Confirmer et envoyer
                    </Button>
                  )}

                  {deliveryStep === 'confirmed' && confirmedDeliveryTracking && selectedCourier && (
                    <div className="space-y-2 rounded-[24px] border border-primary/15/80 bg-primary/5/82 p-3 shadow-2xl backdrop-blur-2xl">
                      <p className="text-xs font-black uppercase text-primary">Livraison confirmee</p>
                      <p className="font-mono text-lg font-black text-slate-900">{confirmedDeliveryTracking}</p>
                      <p className="text-sm text-slate-600">{selectedCourier.name} · {locomotionLabels[selectedCourier.locomotion]} · {selectedCourier.eta}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <Button type="button" onClick={() => router.push(`/dashboard/ugavi/tracking?tracking=${encodeURIComponent(confirmedDeliveryTracking)}`)} className="rounded-2xl bg-primary hover:bg-primary">
                          Suivre le colis
                        </Button>
                        <Button type="button" variant="outline" onClick={() => router.push('/dashboard/chat')} className="rounded-2xl bg-white">
                          Contacter
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

	        <div className="hidden">
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
                <UgaviPlayIcon size={20} />
              </Button>
              <Button type="button" size="icon" variant="outline" onClick={pauseTrip} disabled={tripStatus !== 'running'} title="Pause">
                <UgaviPauseIcon size={20} />
              </Button>
              <Button type="button" size="icon" variant="outline" onClick={stopTrip} disabled={tripStatus === 'idle'} title="Arreter">
                <UgaviStopIcon size={20} />
              </Button>
              <Button type="button" size="icon" variant="outline" onClick={() => void shareRoute()} disabled={!activeRouteTarget} title="Partager">
                <UgaviShareIcon size={20} />
              </Button>
              <span className="rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white">
                <UgaviIcon className="mr-1 inline" size={16} />
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
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Espace client</p>
                <h2 className="text-lg font-black text-slate-900">Mes colis</h2>
              </div>
              <Button type="button" size="icon" variant="ghost" onClick={() => setIsClientPanelOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              <div className="rounded-2xl border border-primary/15 bg-primary/5/70 p-3">
                <label className="relative block">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2">
                    <CustomSearchIcon size={22} />
                  </span>
                  <Input
                    value={clientSearchQuery}
                    onChange={(event) => setClientSearchQuery(event.target.value)}
                    placeholder="Rechercher colis, agence, transport..."
                    className="h-11 rounded-2xl border-white/80 bg-white pl-11 text-sm font-semibold shadow-inner"
                  />
                </label>
                <p className="mt-2 text-xs font-semibold text-primary">
                  Recherche dans vos livraisons, agences nationales, internationales, relais, paiements, factures et suivis.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Livraisons', value: recentShipments.length, tone: 'bg-primary/5 text-primary' },
                  { label: 'A deposer', value: recentShipments.filter((item) => item.status === 'En attente').length, tone: 'bg-amber-50 text-amber-700' },
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
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Operations logistiques</h3>
                    <p className="text-xs font-semibold text-slate-500">
                      {filteredClientShipments.length} resultat{filteredClientShipments.length > 1 ? 's' : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-xs font-semibold text-primary"
                    onClick={() => {
                      setIsClientPanelOpen(false);
                      resetContextForMode('track');
                    }}
                  >
                    Suivi
                  </button>
                </div>

                {filteredClientShipments.length ? (
                  filteredClientShipments.map((shipment) => (
                    <div
                      key={`${shipment.source}-${shipment.id}-side`}
                      className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-primary/30"
                    >
                      <button
                        type="button"
                        onClick={() => router.push(`/dashboard/ugavi/tracking?tracking=${encodeURIComponent(shipment.trackingNumber)}`)}
                        className="flex w-full items-start justify-between gap-3 text-left"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-mono text-xs font-black text-slate-900">{shipment.trackingNumber}</p>
                          <p className="mt-1 truncate text-xs font-semibold text-primary">{shipment.operationLabel}</p>
                          <p className="mt-1 truncate text-xs text-slate-500">{shipment.origin} → {shipment.destination}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                          {shipment.status}
                        </span>
                      </button>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-600">
                        <span className="rounded-xl bg-slate-50 px-2 py-1.5">Transport: {shipment.transportLabel}</span>
                        <span className="rounded-xl bg-slate-50 px-2 py-1.5">Paiement: {shipment.paymentLabel}</span>
                        <span className="rounded-xl bg-slate-50 px-2 py-1.5">Montant: {shipment.amountLabel}</span>
                        <span className="rounded-xl bg-slate-50 px-2 py-1.5">Maj: {shipment.updatedAtLabel}</span>
                      </div>
                      <details className="mt-2 rounded-xl bg-primary/5/70 px-3 py-2 text-xs text-slate-700">
                        <summary className="cursor-pointer font-bold text-primary">Details operation</summary>
                        <div className="mt-2 space-y-1">
                          <p>{shipment.packageDescription}</p>
                          {shipment.agencyName && <p>Agence: {shipment.agencyName}</p>}
                          {shipment.courierName && <p>Livreur: {shipment.courierName}</p>}
                          {shipment.detailLines.map((line) => (
                            <p key={line}>{line}</p>
                          ))}
                        </div>
                      </details>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                    {clientSearchQuery ? 'Aucune operation ne correspond a cette recherche.' : 'Aucun colis recent pour le moment.'}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900">Sections</h3>
                {[
                  { label: 'Livraison', count: recentShipments.filter((item) => item.operationLabel.toLowerCase().includes('livraison')).length },
                  { label: 'Agence nationale', count: recentShipments.filter((item) => item.operationLabel.toLowerCase().includes('nationale')).length },
                  { label: 'Agence internationale', count: recentShipments.filter((item) => item.operationLabel.toLowerCase().includes('internationale')).length },
                  { label: 'Agence relais', count: recentShipments.filter((item) => item.operationLabel.toLowerCase().includes('relais')).length },
                  { label: 'Incidents et retours', count: recentShipments.filter((item) => item.status === 'Incident').length },
                  { label: 'Recus et factures', count: recentShipments.filter((item) => item.detailLines.some((line) => line.toLowerCase().includes('facture'))).length },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setClientSearchQuery(item.label)}
                    className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700"
                  >
                    <span>{item.label}</span>
                    <span className="flex items-center gap-2 text-xs text-slate-500">
                      {item.count}
                      <ChevronLeft className="h-4 w-4 rotate-180 text-slate-400" />
                    </span>
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
          amount: (deliveryTotal || selectedCourier.fare).toLocaleString('fr-FR'),
          currency: 'CDF',
        } : undefined}
      />
    </div>
  );
}

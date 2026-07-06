'use client';

import { useEffect, useMemo, useRef, useState, type PointerEvent, type WheelEvent } from 'react';
import { Clock, LocateFixed, MapPin, Navigation, X, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { MapPinIcon, MobilityIcon, MotoRideIcon, RidePhoneIcon, RideShieldIcon, RideStarIcon } from '@/components/icons/service-icons';
import { DASHBOARD_LOCATION_EVENT, readDashboardLocation, toGeoPoint } from '@/lib/dashboard-location';

const KINSHASA_CENTER = { lat: -4.325, lon: 15.3222 };

type GeoPoint = typeof KINSHASA_CENTER;
type AddressField = 'pickup' | 'destination';

type AddressSuggestion = GeoPoint & {
  id: string;
  label: string;
  secondary: string;
  source: 'local' | 'photon';
};

type RideOption = GeoPoint & {
  id: string;
  name: string;
  type: 'standard' | 'comfort' | 'moto';
  driver: string;
  eta: string;
  price: number;
  rating: number;
};

type RideStatus = 'idle' | 'searching' | 'accepted' | 'arriving' | 'in_progress';

type RideOrder = {
  id: string;
  ride: RideOption;
  pickup: string;
  destination: string;
  status: RideStatus;
  createdAt: Date;
};

const rideOptions: RideOption[] = [
  { id: 'standard', name: 'Standard', type: 'standard', driver: 'Patrick M.', eta: '4 min', price: 8500, rating: 4.8, lat: -4.3181, lon: 15.3145 },
  { id: 'comfort', name: 'Confort', type: 'comfort', driver: 'Sarah N.', eta: '7 min', price: 12000, rating: 4.9, lat: -4.3195, lon: 15.2811 },
  { id: 'moto', name: 'Moto', type: 'moto', driver: 'Cedrick L.', eta: '3 min', price: 4000, rating: 4.7, lat: -4.3337, lon: 15.3374 },
];

function markerPercent(point: GeoPoint, center: GeoPoint, radius = 0.055) {
  const left = 50 + (point.lon - center.lon) * (38 / radius);
  const top = 50 - (point.lat - center.lat) * (34 / radius);
  return {
    left: Math.min(88, Math.max(12, left)),
    top: Math.min(82, Math.max(16, top)),
  };
}

function markerPosition(point: GeoPoint, center: GeoPoint, radius = 0.055) {
  const position = markerPercent(point, center, radius);
  return {
    left: `${position.left}%`,
    top: `${position.top}%`,
  };
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
      <Icon className={`absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 ${iconClassName}`} />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={onFocus}
        placeholder={placeholder}
        className="h-12 rounded-2xl border-slate-200 bg-slate-50 pl-11 text-sm shadow-none focus-visible:ring-[#0A8B46]"
      />
      {isOpen && (isLoading || suggestions.length > 0) && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
          {isLoading && (
            <div className="px-4 py-3 text-xs font-semibold text-slate-500">Recherche d'adresse...</div>
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
                className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-primary/5"
              >
                <MapPin className="mt-0.5 h-4 w-4 flex-none text-[#0A8B46]" />
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

export default function MobilityPage() {
  const { toast } = useToast();
  const mapGestureRef = useRef<{
    pointers: Map<number, { x: number; y: number }>;
    pinchDistance: number | null;
  }>({ pointers: new Map(), pinchDistance: null });

  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [pickupPoint, setPickupPoint] = useState<GeoPoint | null>(null);
  const [destinationPoint, setDestinationPoint] = useState<GeoPoint | null>(null);
  const [activeAddressField, setActiveAddressField] = useState<AddressField | null>(null);
  const [addressSuggestions, setAddressSuggestions] = useState<Record<AddressField, AddressSuggestion[]>>({ pickup: [], destination: [] });
  const [isAddressSearchLoading, setIsAddressSearchLoading] = useState(false);
  const [selectedRide, setSelectedRide] = useState('standard');
  const [userPosition, setUserPosition] = useState(KINSHASA_CENTER);
  const [mapViewCenter, setMapViewCenter] = useState(KINSHASA_CENTER);
  const [mapRadius, setMapRadius] = useState(0.055);
  const [hasUserMovedMap, setHasUserMovedMap] = useState(false);
  const [rideOrder, setRideOrder] = useState<RideOrder | null>(null);
  const [rideStatus, setRideStatus] = useState<RideStatus>('idle');

  const selectedRideOption = rideOptions.find((ride) => ride.id === selectedRide) || rideOptions[0];
  const routeCenter = useMemo(() => {
    if (pickupPoint && destinationPoint) {
      return {
        lat: (pickupPoint.lat + destinationPoint.lat) / 2,
        lon: (pickupPoint.lon + destinationPoint.lon) / 2,
      };
    }
    return pickupPoint || userPosition;
  }, [destinationPoint, pickupPoint, userPosition]);

  useEffect(() => {
    const syncStoredLocation = () => {
      const storedLocation = readDashboardLocation();
      const nextPosition = storedLocation ? toGeoPoint(storedLocation) : KINSHASA_CENTER;
      setUserPosition(nextPosition);
      setMapViewCenter(nextPosition);
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
    if (!hasUserMovedMap) setMapViewCenter(routeCenter);
  }, [hasUserMovedMap, routeCenter]);

  useEffect(() => {
    if (!activeAddressField) return;
    const query = activeAddressField === 'pickup' ? pickup : destination;
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
  }, [activeAddressField, destination, pickup]);

  useEffect(() => {
    if (!rideOrder || rideStatus === 'idle') return;

    const timers: Array<ReturnType<typeof setTimeout>> = [];
    if (rideStatus === 'searching') {
      timers.push(setTimeout(() => setRideStatus('accepted'), 1600));
      timers.push(setTimeout(() => setRideStatus('arriving'), 3400));
    }

    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [rideOrder, rideStatus]);

  const selectAddressSuggestion = (field: AddressField, suggestion: AddressSuggestion) => {
    const label = suggestion.secondary ? `${suggestion.label}, ${suggestion.secondary}` : suggestion.label;
    const point = { lat: suggestion.lat, lon: suggestion.lon };

    if (field === 'pickup') {
      setPickup(label);
      setPickupPoint(point);
    } else {
      setDestination(label);
      setDestinationPoint(point);
    }

    setActiveAddressField(null);
    setAddressSuggestions((current) => ({ ...current, [field]: [] }));
    setHasUserMovedMap(false);
  };

  const useCurrentPosition = () => {
    setPickup('Ma position actuelle');
    setPickupPoint(userPosition);
    setHasUserMovedMap(false);
  };

  const recenterMap = () => {
    setHasUserMovedMap(false);
    setMapViewCenter(routeCenter);
  };

  const zoomMap = (direction: 'in' | 'out') => {
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

  const handleMapPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    mapGestureRef.current.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (mapGestureRef.current.pointers.size === 2) {
      const points = Array.from(mapGestureRef.current.pointers.values());
      mapGestureRef.current.pinchDistance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
    }
  };

  const handleMapPointerMove = (event: PointerEvent<HTMLDivElement>) => {
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
      setMapRadius((current) => Math.min(0.18, Math.max(0.012, current / ratio)));
    }
  };

  const handleMapPointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    mapGestureRef.current.pointers.delete(event.pointerId);
    if (mapGestureRef.current.pointers.size < 2) {
      mapGestureRef.current.pinchDistance = null;
    }
  };

  const handleMapWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    zoomMap(event.deltaY > 0 ? 'out' : 'in');
  };

  const requestRide = () => {
    if (!pickup.trim() || !destination.trim()) {
      toast({
        variant: 'destructive',
        title: 'Trajet incomplet',
        description: 'Ajoutez le point de départ et la destination.',
      });
      return;
    }

    const nextOrder: RideOrder = {
      id: `MOB-${Date.now().toString().slice(-6)}`,
      ride: selectedRideOption,
      pickup,
      destination,
      status: 'searching',
      createdAt: new Date(),
    };

    setRideOrder(nextOrder);
    setRideStatus('searching');
    setActiveAddressField(null);
    setHasUserMovedMap(false);
  };

  const cancelRide = () => {
    setRideOrder(null);
    setRideStatus('idle');
    toast({
      title: 'Course annulée',
      description: 'Votre commande mobilité a été annulée.',
    });
  };

  const startRide = () => {
    setRideStatus('in_progress');
    toast({
      title: 'Course démarrée',
      description: 'Le trajet est maintenant en cours.',
      className: 'bg-[#0A8B46] text-white border-none',
    });
  };

  const rideStatusCopy: Record<RideStatus, { title: string; description: string; action: string }> = {
    idle: { title: '', description: '', action: '' },
    searching: {
      title: 'Recherche de chauffeur',
      description: 'Nous envoyons votre demande aux chauffeurs proches.',
      action: 'Recherche en cours...',
    },
    accepted: {
      title: 'Chauffeur trouvé',
      description: `${rideOrder?.ride.driver || selectedRideOption.driver} a accepté votre course.`,
      action: 'Préparer le départ',
    },
    arriving: {
      title: 'Chauffeur en route',
      description: `${rideOrder?.ride.driver || selectedRideOption.driver} arrive dans ${rideOrder?.ride.eta || selectedRideOption.eta}.`,
      action: 'Démarrer la course',
    },
    in_progress: {
      title: 'Course en cours',
      description: `Direction ${rideOrder?.destination || destination}. Paiement eNkamba à la fin du trajet.`,
      action: 'Course en cours',
    },
  };

  return (
    <div className="relative h-screen overflow-hidden bg-slate-100">
      <iframe
        title="Carte Mobilité"
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapViewCenter.lon - mapRadius},${mapViewCenter.lat - mapRadius},${mapViewCenter.lon + mapRadius},${mapViewCenter.lat + mapRadius}&layer=mapnik`}
        className="absolute inset-0 h-full w-full border-0"
        style={{ filter: 'grayscale(0.18) brightness(1.05) contrast(0.95)', pointerEvents: 'none' }}
      />
      <div
        className="absolute inset-0 z-[5] touch-none cursor-grab active:cursor-grabbing"
        onPointerDown={handleMapPointerDown}
        onPointerMove={handleMapPointerMove}
        onPointerUp={handleMapPointerEnd}
        onPointerCancel={handleMapPointerEnd}
        onWheel={handleMapWheel}
      />
      <div className="pointer-events-none absolute inset-0 z-[6] bg-gradient-to-b from-white/20 via-transparent to-white/70" />

      <div className="absolute left-4 right-4 top-[calc(env(safe-area-inset-top)+1rem)] z-30 mx-auto flex max-w-xl items-center justify-between gap-3 rounded-[1.4rem] bg-white/92 p-3 shadow-xl backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0A8B46] text-white">
            <MobilityIcon size={28} />
          </div>
          <div>
            <h1 className="font-headline text-lg font-bold text-slate-950">Mobilité</h1>
            <p className="text-xs font-medium text-slate-500">Taxi, moto et trajets urbains</p>
          </div>
        </div>
        <Badge className="rounded-full bg-[#0A8B46]/10 text-[#0A8B46] hover:bg-[#0A8B46]/10">eNkamba</Badge>
      </div>

      {rideOrder && rideStatus !== 'idle' && (
        <div className="absolute left-4 right-4 top-[calc(env(safe-area-inset-top)+5.8rem)] z-30 mx-auto max-w-xl rounded-[1.4rem] bg-white/95 p-4 shadow-xl backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#0A8B46]">{rideOrder.id}</p>
              <h2 className="mt-1 text-lg font-extrabold text-slate-950">{rideStatusCopy[rideStatus].title}</h2>
              <p className="mt-1 text-sm leading-5 text-slate-500">{rideStatusCopy[rideStatus].description}</p>
            </div>
            <button
              type="button"
              onClick={cancelRide}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600"
              aria-label="Annuler la course"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0A8B46] text-white">
              {rideOrder.ride.type === 'moto' ? <MotoRideIcon size={28} /> : <MobilityIcon size={28} />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-950">{rideOrder.ride.driver}</p>
              <p className="text-xs text-slate-500">{rideOrder.ride.name} · {rideOrder.ride.price.toLocaleString('fr-FR')} CDF</p>
            </div>
            <Button size="icon" className="rounded-full bg-[#0A8B46] hover:bg-[#0A8B46]">
              <RidePhoneIcon size={22} />
            </Button>
          </div>

          {rideStatus === 'searching' && (
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-2/3 animate-pulse rounded-full bg-[#0A8B46]" />
            </div>
          )}

          {(rideStatus === 'accepted' || rideStatus === 'arriving') && (
            <Button onClick={startRide} className="mt-4 h-11 w-full rounded-full bg-[#0A8B46] font-bold hover:bg-[#0A8B46]">
              {rideStatusCopy[rideStatus].action}
            </Button>
          )}
        </div>
      )}

      <button
        type="button"
        title="Ma localisation"
        className="absolute z-20 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#0A8B46] shadow-xl ring-4 ring-[#0A8B46]/20"
        style={markerPosition(userPosition, mapViewCenter, mapRadius)}
      >
        <span className="absolute h-12 w-12 animate-ping rounded-full bg-[#0A8B46]/20" />
        <Navigation className="relative h-5 w-5 fill-[#0A8B46]" />
      </button>

      {pickupPoint && (
        <div
          className="absolute z-20 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full bg-[#0A8B46] px-2.5 py-1.5 text-xs font-semibold text-white shadow-lg ring-2 ring-white"
          style={markerPosition(pickupPoint, mapViewCenter, mapRadius)}
        >
          <MapPin className="h-3.5 w-3.5" />
          Départ
        </div>
      )}

      {destinationPoint && (
        <div
          className="absolute z-20 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full bg-[#FFA500] px-2.5 py-1.5 text-xs font-semibold text-white shadow-lg ring-2 ring-white"
          style={markerPosition(destinationPoint, mapViewCenter, mapRadius)}
        >
          <LocateFixed className="h-3.5 w-3.5" />
          Arrivée
        </div>
      )}

      {rideOptions.map((ride) => (
        <button
          key={ride.id}
          type="button"
          onClick={() => setSelectedRide(ride.id)}
          className={`absolute z-20 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full shadow-lg ring-2 ring-white transition ${
            selectedRide === ride.id ? 'h-11 w-11 bg-[#0A8B46] text-white' : 'h-9 w-9 bg-white text-[#0A8B46]'
          }`}
          style={markerPosition(ride, mapViewCenter, mapRadius)}
          title={ride.driver}
        >
          {ride.type === 'moto' ? <MotoRideIcon size={22} /> : <MobilityIcon size={22} />}
        </button>
      ))}

      <div className="absolute right-4 top-28 z-30 flex flex-col gap-2">
        <Button size="icon" className="rounded-full bg-white text-slate-800 shadow-lg hover:bg-white" onClick={() => zoomMap('in')}>+</Button>
        <Button size="icon" className="rounded-full bg-white text-slate-800 shadow-lg hover:bg-white" onClick={() => zoomMap('out')}>-</Button>
        <Button size="icon" className="rounded-full bg-white text-[#0A8B46] shadow-lg hover:bg-white" onClick={recenterMap}>
          <LocateFixed className="h-5 w-5" />
        </Button>
      </div>

      <section className="absolute bottom-0 left-0 right-0 z-40 rounded-t-[2rem] bg-white p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-[0_-16px_40px_rgba(15,23,42,0.18)]">
        <div className="mx-auto max-w-xl space-y-4">
          <div className="mx-auto h-1.5 w-12 rounded-full bg-slate-200" />

          {rideOrder && rideStatus !== 'idle' ? (
            <div className="space-y-3">
              <div className="grid grid-cols-[20px_1fr] gap-x-3 gap-y-2 rounded-2xl bg-slate-50 p-4">
                <MapPinIcon size={18} />
                <p className="truncate text-sm font-semibold text-slate-900">{rideOrder.pickup}</p>
                <LocateFixed className="mt-0.5 h-4 w-4 text-[#FFA500]" />
                <p className="truncate text-sm font-semibold text-slate-900">{rideOrder.destination}</p>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-[#0A8B46]/10 px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-slate-950">{rideStatusCopy[rideStatus].action}</p>
                  <p className="text-xs text-slate-500">Suivi de la course actif</p>
                </div>
                <p className="text-sm font-extrabold text-[#0A8B46]">{rideOrder.ride.eta}</p>
              </div>
              {rideStatus === 'in_progress' && (
                <Button onClick={cancelRide} variant="outline" className="h-11 w-full rounded-full">
                  Terminer / fermer le suivi
                </Button>
              )}
            </div>
          ) : (
            <>
          <div className="space-y-2">
            <AddressAutocompleteInput
              value={pickup}
              placeholder="Point de départ"
              Icon={MapPin}
              iconClassName="text-[#0A8B46]"
              suggestions={addressSuggestions.pickup}
              isLoading={isAddressSearchLoading && activeAddressField === 'pickup'}
              isOpen={activeAddressField === 'pickup'}
              onChange={(value) => {
                setPickup(value);
                setPickupPoint(null);
              }}
              onFocus={() => setActiveAddressField('pickup')}
              onSelect={(suggestion) => selectAddressSuggestion('pickup', suggestion)}
            />
            <AddressAutocompleteInput
              value={destination}
              placeholder="Où allez-vous ?"
              Icon={LocateFixed}
              iconClassName="text-[#FFA500]"
              suggestions={addressSuggestions.destination}
              isLoading={isAddressSearchLoading && activeAddressField === 'destination'}
              isOpen={activeAddressField === 'destination'}
              onChange={(value) => {
                setDestination(value);
                setDestinationPoint(null);
              }}
              onFocus={() => setActiveAddressField('destination')}
              onSelect={(suggestion) => selectAddressSuggestion('destination', suggestion)}
            />
            <button type="button" onClick={useCurrentPosition} className="text-xs font-semibold text-[#0A8B46]">
              Utiliser ma position actuelle
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {rideOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelectedRide(option.id)}
                className={`min-w-[145px] rounded-2xl border p-3 text-left transition ${
                  selectedRide === option.id ? 'border-[#0A8B46] bg-[#0A8B46]/10' : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-950">{option.name}</span>
                  {option.type === 'moto' ? <MotoRideIcon size={24} /> : <MobilityIcon size={24} />}
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {option.eta}</span>
                  <span className="flex items-center gap-1"><RideStarIcon size={15} /> {option.rating}</span>
                </div>
                <p className="mt-2 text-sm font-extrabold text-slate-950">{option.price.toLocaleString('fr-FR')} CDF</p>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
            <div className="flex items-start gap-2">
              <RideShieldIcon size={18} />
              <div>
                <p className="text-sm font-bold text-slate-900">{selectedRideOption.driver}</p>
                <p className="text-xs text-slate-500">Paiement eNkamba disponible</p>
              </div>
            </div>
            <p className="text-sm font-extrabold text-[#0A8B46]">{selectedRideOption.eta}</p>
          </div>

          <Button onClick={requestRide} className="h-12 w-full rounded-full bg-[#0A8B46] text-base font-bold hover:bg-[#0A8B46]">
            Commander {selectedRideOption.name}
          </Button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

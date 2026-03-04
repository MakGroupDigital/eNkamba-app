'use client';

import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  ArrowRight,
  CheckCircle2,
  Bell,
  ShoppingCart,
  Search,
  Navigation,
  Volume2,
  VolumeX,
  SendHorizontal,
  HandCoins,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import {
  TrackPackageIcon,
  SearchIcon,
} from "@/components/icons/service-icons";
import {
  LogisticsAgencyIcon,
  LogisticsBikeModeIcon,
  LogisticsCarModeIcon,
  LogisticsCourierIcon,
  LogisticsExpressIcon,
  LogisticsInternationalIcon,
  LogisticsMotoModeIcon,
  LogisticsRelayIcon,
  LogisticsStandardIcon,
  LogisticsTrackingIcon,
  LogisticsTrainModeIcon,
  LogisticsWalkModeIcon,
} from "@/components/icons/logistics-generated-icons";

type TransportMode = 'walk' | 'bike' | 'moto' | 'car' | 'train';

type GeoPoint = {
  lat: number;
  lon: number;
};

type ItineraryPoint = GeoPoint & {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  ringColor: string;
  top: string;
  left: string;
  kind: 'centre' | 'relais' | 'livreur' | 'camion' | 'velo';
};

type RouteInfo = {
  distanceKm: number;
  durationMin: number;
  steps: string[];
  path: GeoPoint[];
  trafficLevel: 'Faible' | 'Moyenne' | 'Dense';
  trafficScore: number;
  source: 'osrm' | 'fallback';
};

const KINSHASA_CENTER: GeoPoint = { lat: -4.325, lon: 15.3222 };
type MapBounds = {
  west: number;
  east: number;
  south: number;
  north: number;
};

const ITINERARY_POINTS: ItineraryPoint[] = [
  {
    id: 'centre',
    title: 'Centre Logistique',
    subtitle: 'Hub principal',
    color: 'bg-blue-600',
    ringColor: 'ring-blue-300',
    top: '22%',
    left: '50%',
    kind: 'centre',
    lat: -4.3237,
    lon: 15.3102,
  },
  {
    id: 'relais',
    title: 'Agent Relais',
    subtitle: 'Point de dépôt',
    color: 'bg-green-600',
    ringColor: 'ring-green-300',
    top: '37%',
    left: '12%',
    kind: 'relais',
    lat: -4.3345,
    lon: 15.287,
  },
  {
    id: 'livreur',
    title: 'Livreur Proche',
    subtitle: 'Zone rapide',
    color: 'bg-amber-600',
    ringColor: 'ring-amber-300',
    top: '49%',
    left: '79%',
    kind: 'livreur',
    lat: -4.313,
    lon: 15.353,
  },
  {
    id: 'camion',
    title: 'Camion',
    subtitle: 'Plateforme transport',
    color: 'bg-orange-500',
    ringColor: 'ring-orange-300',
    top: '67%',
    left: '80%',
    kind: 'camion',
    lat: -4.3512,
    lon: 15.346,
  },
  {
    id: 'velo',
    title: 'Hub Vélo',
    subtitle: 'Micro livraison',
    color: 'bg-emerald-700',
    ringColor: 'ring-emerald-300',
    top: '62%',
    left: '12%',
    kind: 'velo',
    lat: -4.349,
    lon: 15.2895,
  },
];

const haversineDistanceKm = (from: GeoPoint, to: GeoPoint): number => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(to.lat - from.lat);
  const dLon = toRad(to.lon - from.lon);
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const estimateMinutes = (distanceKm: number, mode: TransportMode): number => {
  const avgSpeedByMode: Record<TransportMode, number> = {
    walk: 5,
    bike: 15,
    moto: 35,
    car: 28,
    train: 55,
  };
  return Math.max(1, Math.round((distanceKm / avgSpeedByMode[mode]) * 60));
};

const modeLabelMap: Record<TransportMode, string> = {
  walk: 'à pied',
  bike: 'à vélo',
  moto: 'en moto',
  car: 'en voiture',
  train: 'en train',
};

const isMissionPoint = (kind: ItineraryPoint['kind']): boolean => kind === 'livreur';

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const buildMapBounds = (points: GeoPoint[]): MapBounds => {
  const fallback = { west: 15.2, east: 15.42, south: -4.45, north: -4.25 };
  if (!points.length) return fallback;

  const lats = points.map((point) => point.lat);
  const lons = points.map((point) => point.lon);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const latSpan = Math.max(0.06, maxLat - minLat);
  const lonSpan = Math.max(0.06, maxLon - minLon);
  const latPad = latSpan * 0.45;
  const lonPad = lonSpan * 0.45;

  return {
    west: minLon - lonPad,
    east: maxLon + lonPad,
    south: minLat - latPad,
    north: maxLat + latPad,
  };
};

const toMapPercent = (point: GeoPoint, bounds: MapBounds): { x: number; y: number } => {
  const x = ((point.lon - bounds.west) / (bounds.east - bounds.west)) * 100;
  const y = ((bounds.north - point.lat) / (bounds.north - bounds.south)) * 100;
  return { x: clamp(x, 0, 100), y: clamp(y, 0, 100) };
};

const pointLabelByKind: Record<ItineraryPoint['kind'], string> = {
  centre: 'Centre logistique',
  relais: 'Agent relais',
  livreur: 'Livreur',
  camion: 'Camion',
  velo: 'Hub vélo',
};

const pointIconByKind: Record<ItineraryPoint['kind'], ComponentType<{ className?: string }>> = {
  centre: LogisticsAgencyIcon,
  relais: LogisticsRelayIcon,
  livreur: LogisticsCourierIcon,
  camion: LogisticsStandardIcon,
  velo: LogisticsBikeModeIcon,
};

export default function UgaviPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [trackingNumber, setTrackingNumber] = useState('');
  const [currentAddress, setCurrentAddress] = useState('Localisation en cours...');
  const [transportMode, setTransportMode] = useState<TransportMode>('moto');
  const [selectedPoint, setSelectedPoint] = useState<ItineraryPoint | null>(null);
  const [activePointInfoId, setActivePointInfoId] = useState<string | null>(null);
  const [isRouting, setIsRouting] = useState(false);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isRouteStarted, setIsRouteStarted] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const speechPrimedRef = useRef(false);
  const [userPosition, setUserPosition] = useState<GeoPoint>(KINSHASA_CENTER);
  const [missionNote, setMissionNote] = useState('');
  const [clientAddress, setClientAddress] = useState('Position du client en cours...');
  const [destinationAddress, setDestinationAddress] = useState('Destination en attente...');
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showTrackingResult, setShowTrackingResult] = useState(false);
  const [showCalculateDialog, setShowCalculateDialog] = useState(false);
  const [showRelayDialog, setShowRelayDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Calculate fees states
  const [weight, setWeight] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  
  // Form states
  const [senderName, setSenderName] = useState('');
  const [senderAddress, setSenderAddress] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverAddress, setReceiverAddress] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [packageWeight, setPackageWeight] = useState('');
  const [packageDescription, setPackageDescription] = useState('');
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!('geolocation' in navigator)) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserPosition({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      () => {
        setUserPosition(KINSHASA_CENTER);
      },
      { enableHighAccuracy: false, timeout: 7000, maximumAge: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const handleTrack = () => {
    if (!trackingNumber || !trackingNumber.trim()) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez entrer un numéro de suivi.",
      });
      return;
    }
    router.push(`/dashboard/ugavi/tracking?tracking=${encodeURIComponent(trackingNumber.trim())}`);
  };

  const handleSendPackage = async () => {
    if (!senderName || !senderAddress || !senderPhone || !receiverName || !receiverAddress || !receiverPhone || !packageWeight) {
      toast({
        variant: "destructive",
        title: "Informations manquantes",
        description: "Veuillez remplir tous les champs obligatoires.",
      });
      return;
    }

    setIsSubmitting(true);
    
    // Calculer le prix de livraison
    const basePrice = 5000;
    const weightPrice = parseFloat(packageWeight) * 1000;
    const distancePrice = shippingMethod === 'express' ? 25000 : 15000;
    const totalPrice = basePrice + weightPrice + distancePrice;

    // Préparer les données de paiement
    const paymentData = {
      context: 'ugavi',
      amount: totalPrice,
      description: `Livraison de ${parseFloat(packageWeight)}kg - ${shippingMethod === 'express' ? 'Express' : 'Standard'}`,
      metadata: {
        senderName,
        senderAddress,
        senderPhone,
        receiverName,
        receiverAddress,
        receiverPhone,
        packageWeight,
        packageDescription,
        shippingMethod,
        basePrice,
        weightPrice,
        distancePrice
      }
    };

    // Stocker les données de paiement
    sessionStorage.setItem('ugavi_payment_data', JSON.stringify(paymentData));
    
    // Rediriger vers la page de paiement
    router.push('/dashboard/ugavi/pay');
  };

  const pickFemaleVoice = (): SpeechSynthesisVoice | null => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;

    const femalePattern = /(female|femme|woman|zira|samantha|amelie|audrey|claire|julie|google fr)/i;
    const frenchFemaleVoice =
      voices.find((voice) => voice.lang.toLowerCase().startsWith('fr') && femalePattern.test(voice.name)) ??
      voices.find((voice) => femalePattern.test(voice.name));
    return frenchFemaleVoice ?? voices.find((voice) => voice.lang.toLowerCase().startsWith('fr')) ?? voices[0];
  };

  const isMobileSpeechRuntime = (): boolean => {
    if (typeof window === 'undefined') return false;
    const ua = window.navigator.userAgent || '';
    const isMobileUA = /iPhone|iPad|iPod|Android|Mobile/i.test(ua);
    const isCapacitorRuntime = Boolean((window as any).Capacitor);
    return isMobileUA || isCapacitorRuntime;
  };

  const primeSpeechIfNeeded = () => {
    if (!voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (speechPrimedRef.current) return;
    const synth = window.speechSynthesis;
    try {
      synth.getVoices();
      synth.resume();
      const unlockUtterance = new SpeechSynthesisUtterance('.');
      unlockUtterance.volume = 0.01;
      unlockUtterance.rate = 1;
      unlockUtterance.pitch = 1;
      synth.speak(unlockUtterance);
      speechPrimedRef.current = true;
    } catch {
      // noop
    }
  };

  const speakTextWithRetry = (text: string) => {
    if (!voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window) || !text.trim()) return;
    const synth = window.speechSynthesis;
    const voice = pickFemaleVoice();
    let retries = 0;

    const doSpeak = () => {
      try {
        synth.resume();
        synth.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = voice?.lang ?? 'fr-FR';
        utterance.rate = 0.98;
        utterance.pitch = 1.2;
        if (voice) utterance.voice = voice;
        synth.speak(utterance);

        window.setTimeout(() => {
          if (!synth.speaking && retries < 2) {
            retries += 1;
            doSpeak();
          }
        }, 420);
      } catch {
        // noop
      }
    };

    doSpeak();
  };

  const speakRoute = (destinationLabel: string, info: RouteInfo) => {
    if (!voiceEnabled) return;
    const startText = `Votre itinéraire a commencé ${modeLabelMap[transportMode]} vers ${destinationLabel}.`;
    const summaryText = `Distance ${info.distanceKm.toFixed(1)} kilomètres. Temps estimé ${info.durationMin} minutes.`;
    const firstStep = info.steps[0] ? `Première instruction: ${info.steps[0]}.` : '';
    speakTextWithRetry(`${startText} ${summaryText} ${firstStep}`.trim());
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const handler = () => primeSpeechIfNeeded();
    window.addEventListener('touchstart', handler, { passive: true });
    window.addEventListener('click', handler, { passive: true });
    window.speechSynthesis.getVoices();
    return () => {
      window.removeEventListener('touchstart', handler);
      window.removeEventListener('click', handler);
    };
  }, [voiceEnabled]); // eslint-disable-line react-hooks/exhaustive-deps

  const reverseGeocode = async (point: GeoPoint): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${point.lat}&lon=${point.lon}&zoom=18&addressdetails=1`
      );
      if (!response.ok) throw new Error(`Reverse geocoding HTTP ${response.status}`);
      const data = await response.json();
      if (data?.display_name) return data.display_name;
    } catch {
      // Fallback handled below
    }
    return `Lat ${point.lat.toFixed(5)}, Lon ${point.lon.toFixed(5)}`;
  };

  const refreshAddresses = async (destinationPoint: ItineraryPoint) => {
    const [fromAddress, toAddress] = await Promise.all([
      reverseGeocode(userPosition),
      reverseGeocode(destinationPoint),
    ]);
    setClientAddress(fromAddress);
    setDestinationAddress(toAddress);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const syncCurrentAddress = async () => {
      const resolvedAddress = await reverseGeocode(userPosition);
      setCurrentAddress(resolvedAddress);
      setClientAddress(resolvedAddress);
    };
    void syncCurrentAddress();
  }, [userPosition.lat, userPosition.lon]); // eslint-disable-line react-hooks/exhaustive-deps

  const estimateTrafficOnZone = async (samplePoint: GeoPoint): Promise<{ multiplier: number; level: RouteInfo['trafficLevel']; score: number }> => {
    const hour = new Date().getHours();
    const peakFactor = hour >= 7 && hour <= 9 ? 1.35 : hour >= 16 && hour <= 19 ? 1.42 : hour >= 11 && hour <= 14 ? 1.18 : 1.0;

    try {
      const query = `[out:json][timeout:8];(way(around:550,${samplePoint.lat},${samplePoint.lon})["highway"];node(around:550,${samplePoint.lat},${samplePoint.lon})["highway"="traffic_signals"];);out body;`;
      const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error(`Overpass HTTP ${response.status}`);
      const data = await response.json();
      const elements = Array.isArray(data?.elements) ? data.elements : [];
      const signalsCount = elements.filter((element: any) => element?.type === 'node').length;
      const roadsCount = elements.filter((element: any) => element?.type === 'way').length;
      const densityScore = Math.max(0.6, Math.min(2.2, (roadsCount / 90 + signalsCount / 24) * peakFactor));
      const level: RouteInfo['trafficLevel'] = densityScore > 1.45 ? 'Dense' : densityScore > 1.05 ? 'Moyenne' : 'Faible';
      return { multiplier: densityScore, level, score: densityScore };
    } catch {
      const fallbackScore = peakFactor;
      const level: RouteInfo['trafficLevel'] = fallbackScore > 1.35 ? 'Dense' : fallbackScore > 1.1 ? 'Moyenne' : 'Faible';
      return { multiplier: fallbackScore, level, score: fallbackScore };
    }
  };

  const calculateRoute = async (destinationPoint: ItineraryPoint): Promise<RouteInfo> => {
    const directDistanceKm = haversineDistanceKm(userPosition, destinationPoint);
    const profileByMode: Record<TransportMode, 'foot' | 'bike' | 'driving'> = {
      walk: 'foot',
      bike: 'bike',
      moto: 'driving',
      car: 'driving',
      train: 'driving',
    };

    try {
      const profile = profileByMode[transportMode];
      const endpoint = `https://router.project-osrm.org/route/v1/${profile}/${userPosition.lon},${userPosition.lat};${destinationPoint.lon},${destinationPoint.lat}?overview=full&geometries=geojson&steps=true&alternatives=false`;
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error(`OSRM HTTP ${response.status}`);

      const data = await response.json();
      const route = data?.routes?.[0];
      const stepsRaw = route?.legs?.[0]?.steps ?? [];
      const geometryCoordinates = route?.geometry?.coordinates ?? [];
      if (!route) throw new Error('No route returned');

      const normalizedSteps: string[] = stepsRaw.slice(0, 4).map((step: any) => {
        const maneuver = step?.maneuver?.type || 'continuez';
        const modifier = step?.maneuver?.modifier ? ` ${step.maneuver.modifier}` : '';
        const streetName = step?.name ? ` vers ${step.name}` : '';
        return `${maneuver}${modifier}${streetName}`;
      });

      const pathPoints: GeoPoint[] = geometryCoordinates.map((coordinate: [number, number]) => ({
        lon: coordinate[0],
        lat: coordinate[1],
      }));
      const densityPoint = pathPoints[Math.floor(pathPoints.length / 2)] ?? destinationPoint;
      const traffic = await estimateTrafficOnZone(densityPoint);
      const baseDurationMin = transportMode !== 'train'
        ? Math.max(1, Math.round(route.duration / 60))
        : Math.max(1, Math.round((route.distance / 1000 / 55) * 60));
      const impactByMode: Record<TransportMode, number> = {
        walk: 0.15,
        bike: 0.35,
        moto: 0.9,
        car: 1.0,
        train: 0.45,
      };
      const durationMin = Math.max(1, Math.round(baseDurationMin * (1 + (traffic.multiplier - 1) * impactByMode[transportMode])));

      return {
        distanceKm: Math.max(0.2, route.distance / 1000),
        durationMin,
        steps: normalizedSteps,
        path: pathPoints,
        trafficLevel: traffic.level,
        trafficScore: traffic.score,
        source: 'osrm',
      };
    } catch {
      const traffic = await estimateTrafficOnZone(destinationPoint);
      return {
        distanceKm: Math.max(0.2, directDistanceKm),
        durationMin: Math.max(1, Math.round(estimateMinutes(Math.max(0.2, directDistanceKm), transportMode) * traffic.multiplier)),
        steps: [
          `Dirigez-vous ${modeLabelMap[transportMode]} vers ${destinationPoint.title}`,
          'Suivez la route principale indiquée sur la carte',
          'Vous approchez de votre destination',
        ],
        path: [userPosition, destinationPoint],
        trafficLevel: traffic.level,
        trafficScore: traffic.score,
        source: 'fallback',
      };
    }
  };

  const handleStartItinerary = async () => {
    primeSpeechIfNeeded();
    if (isMobileSpeechRuntime() && voiceEnabled) {
      speakTextWithRetry('Itinéraire démarré. Calcul en cours.');
    }

    if (!selectedPoint) {
      toast({
        variant: 'destructive',
        title: 'Destination manquante',
        description: "Appuyez d'abord sur un point de la carte.",
      });
      return;
    }
    if (isMissionPoint(selectedPoint.kind)) {
      toast({
        title: 'Point livreur sélectionné',
        description: "Pour un livreur, utilisez l'action mission (express/standard).",
      });
      return;
    }

    setIsRouting(true);
    setIsRouteStarted(true);
    const info = await calculateRoute(selectedPoint);
    setRouteInfo(info);
    await refreshAddresses(selectedPoint);
    setIsRouting(false);

    toast({
      title: 'Itinéraire démarré',
      description: `${selectedPoint.title} · ${info.durationMin} min · ${info.distanceKm.toFixed(1)} km`,
    });
    speakRoute(selectedPoint.title, info);
  };

  const handleAssignMission = (mode: 'express' | 'standard') => {
    if (!selectedPoint || !isMissionPoint(selectedPoint.kind)) return;
    const params = new URLSearchParams({
      courierId: selectedPoint.id,
      courierName: selectedPoint.title,
      courierLat: String(selectedPoint.lat),
      courierLon: String(selectedPoint.lon),
      note: missionNote.trim(),
    });
    router.push(`/dashboard/ugavi/service/${mode}?${params.toString()}`);
  };

  const handleSelectPoint = (point: ItineraryPoint) => {
    setSelectedPoint(point);
    setActivePointInfoId(point.id);
    setRouteInfo(null);
    setIsRouteStarted(false);
    setDestinationAddress('Destination en cours de résolution...');
    void refreshAddresses(point);
  };

  useEffect(() => {
    if (!selectedPoint) return;
    if (!isRouteStarted) return;
    const intervalId = window.setInterval(async () => {
      const updatedRoute = await calculateRoute(selectedPoint);
      setRouteInfo(updatedRoute);
      await refreshAddresses(selectedPoint);
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, [isRouteStarted, selectedPoint, transportMode, userPosition.lat, userPosition.lon]); // eslint-disable-line react-hooks/exhaustive-deps

  const routePath = useMemo(
    () => (routeInfo?.path?.length ? routeInfo.path : selectedPoint ? [userPosition, selectedPoint] : []),
    [routeInfo?.path, selectedPoint, userPosition]
  );
  const mapBounds = useMemo(() => {
    const nearbyPoints = ITINERARY_POINTS
      .filter((point) => haversineDistanceKm(userPosition, point) <= 35)
      .map((point) => ({ lat: point.lat, lon: point.lon }));
    const pointsForBounds = [
      userPosition,
      ...(selectedPoint ? [selectedPoint] : []),
      ...routePath,
      ...nearbyPoints,
    ];
    return buildMapBounds(pointsForBounds);
  }, [userPosition, selectedPoint, routePath]);
  const mapEmbedSrc = useMemo(() => {
    const bbox = `${mapBounds.west.toFixed(6)}%2C${mapBounds.south.toFixed(6)}%2C${mapBounds.east.toFixed(6)}%2C${mapBounds.north.toFixed(6)}`;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik`;
  }, [mapBounds]);
  const routePolyline = routePath
    .map((point) => {
      const percent = toMapPercent(point, mapBounds);
      return `${percent.x},${percent.y}`;
    })
    .join(' ');
  const clientMarker = toMapPercent(userPosition, mapBounds);
  const destinationMarker = selectedPoint ? toMapPercent(selectedPoint, mapBounds) : null;

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-b from-emerald-50 via-white to-cyan-50 pb-8 md:pb-12">
      <main className="mx-auto flex h-[calc(100vh-6.1rem)] w-full max-w-5xl flex-col gap-1 px-2 pb-0 pt-1 md:h-[calc(100vh-7.3rem)] md:gap-2 md:px-3 md:pb-0 md:pt-1">
        <section className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-xl">
          <div className="h-24 bg-[url('https://images.unsplash.com/photo-1613486362292-4f5f6ebf6522?q=80&w=1600&auto=format&fit=crop')] bg-cover bg-center" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/55 to-white/95" />
          <div className="absolute inset-0 p-3">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-primary">eNKAMBA</h1>
                <p className="-mt-1 text-xs font-medium text-slate-700">Logistics Network</p>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button className="rounded-full bg-white/90 p-2 text-primary shadow">
                  <ShoppingCart className="h-4 w-4" />
                </button>
                <button className="rounded-full bg-white/90 p-2 text-primary shadow">
                  <Bell className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="mt-2 inline-flex max-w-full items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-700 shadow">
              Adresse actuelle: <span className="max-w-[220px] truncate text-slate-900">{currentAddress}</span>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-emerald-200 bg-white p-2 shadow">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                placeholder="Envoyer un colis..."
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
                className="h-10 rounded-xl border-slate-200 bg-slate-50 pl-10"
              />
            </div>
            <Button size="icon" className="h-10 w-10 rounded-xl bg-primary hover:bg-primary/90" onClick={handleTrack}>
              <SearchIcon size={18} className="text-white" />
            </Button>
          </div>
        </section>

        <section className="grid grid-cols-4 gap-1.5">
          {[
            { label: 'Livraison Express', icon: <LogisticsExpressIcon size={24} />, href: '/dashboard/ugavi/service/express' },
            { label: 'Livraison Standard', icon: <LogisticsStandardIcon size={24} />, href: '/dashboard/ugavi/service/standard' },
            { label: 'International', icon: <LogisticsInternationalIcon size={24} />, href: '/dashboard/ugavi/service/international' },
            { label: 'Suivi Colis', icon: <LogisticsTrackingIcon size={24} />, href: '/dashboard/ugavi/tracking' },
          ].map((item) => (
            <button
              key={item.label}
              className="rounded-xl border border-slate-200 bg-white p-1.5 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              onClick={() => router.push(item.href)}
            >
              <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                {item.icon}
              </div>
              <p className="text-[10px] font-semibold leading-tight text-slate-800">{item.label}</p>
            </button>
          ))}
        </section>

        <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-xl">
          <div className="border-b bg-white/95 px-2 py-1.5 backdrop-blur">
            <div className="flex items-center gap-1.5">
              <Button
                onClick={handleStartItinerary}
                disabled={!selectedPoint || isRouting || (selectedPoint ? isMissionPoint(selectedPoint.kind) : false)}
                className="h-8 flex-1 rounded-lg bg-gradient-to-r from-primary to-emerald-700 px-2 text-xs text-white"
              >
                <Navigation className="mr-1 h-3.5 w-3.5" />
                {isRouting ? 'Calcul...' : selectedPoint && isMissionPoint(selectedPoint.kind) ? 'Mission livreur' : 'Commencer itinéraire'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setVoiceEnabled((prev) => !prev)}
                className="h-8 w-8 rounded-lg border-slate-300 p-0"
              >
                {voiceEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowRelayDialog(true)}
                className="h-8 w-8 rounded-lg border-slate-300 p-0"
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="relative min-h-0 flex-1">
            <iframe
              title="OpenStreetMap Kinshasa"
              src={mapEmbedSrc}
              className="h-full w-full"
            />
            {routePath.length > 1 && (
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="pointer-events-none absolute inset-0 h-full w-full"
              >
                <polyline
                  points={routePolyline}
                  fill="none"
                  stroke="rgba(16,185,129,0.92)"
                  strokeWidth="0.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="2 1.6"
                />
                <circle cx={clientMarker.x} cy={clientMarker.y} r="1.2" fill="#2563eb" />
                {destinationMarker && <circle cx={destinationMarker.x} cy={destinationMarker.y} r="1.35" fill="#f97316" />}
              </svg>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white/45 via-transparent to-white/20" />
            <div
              className="pointer-events-none absolute z-20"
              style={{ top: `${clientMarker.y}%`, left: `${clientMarker.x}%`, transform: 'translate(-50%, -50%)' }}
            >
              <span className="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/35 animate-ping" />
              <span className="relative block h-4 w-4 rounded-full border-2 border-white bg-blue-600 shadow" />
              <span className="absolute left-1/2 top-full mt-1.5 w-max -translate-x-1/2 rounded-md bg-black/70 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur">
                Ma position
              </span>
            </div>
            {ITINERARY_POINTS.map((point) => {
              const isSelected = selectedPoint?.id === point.id;
              const showInfo = activePointInfoId === point.id;
              const MarkerIcon = pointIconByKind[point.kind];
              const mapPoint = toMapPercent(point, mapBounds);
              return (
                <div
                  key={point.id}
                  className="absolute z-10"
                  style={{ top: `${mapPoint.y}%`, left: `${mapPoint.x}%`, transform: 'translate(-50%, -50%)' }}
                >
                  {showInfo && (
                    <div className="pointer-events-none absolute -top-2 left-1/2 w-max max-w-[190px] -translate-x-1/2 -translate-y-full rounded-xl border border-white/70 bg-black/75 px-2 py-1.5 text-[10px] text-white shadow-lg backdrop-blur">
                      <p className="font-semibold leading-tight">{pointLabelByKind[point.kind]}</p>
                      <p className="opacity-90">{point.subtitle}</p>
                    </div>
                  )}
                  <button
                    type="button"
                    aria-label={pointLabelByKind[point.kind]}
                    onClick={() => handleSelectPoint(point)}
                    onMouseEnter={() => setActivePointInfoId(point.id)}
                    onMouseLeave={() => setActivePointInfoId((prev) => (prev === point.id ? null : prev))}
                    onFocus={() => setActivePointInfoId(point.id)}
                    onBlur={() => setActivePointInfoId((prev) => (prev === point.id ? null : prev))}
                    onTouchStart={() => setActivePointInfoId(point.id)}
                    className={`flex h-10 w-10 items-center justify-center rounded-full border border-white/80 text-white shadow-xl transition ${
                      isSelected ? `scale-105 ring-4 ${point.ringColor}` : 'hover:scale-[1.06]'
                    } ${point.color}`}
                  >
                    <MarkerIcon className="h-5 w-5" />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="border-t bg-white/95 p-2 backdrop-blur">
            <div className="mb-1 grid grid-cols-3 gap-1 text-[10px]">
              {[
                { id: 'relais', label: 'Agents Relais', icon: LogisticsRelayIcon },
                { id: 'centre', label: 'Agences', icon: LogisticsAgencyIcon },
                { id: 'livreur', label: 'Livreurs', icon: LogisticsCourierIcon },
              ].map((service) => {
                const Icon = service.icon;
                const linkedPoint = ITINERARY_POINTS.find((p) => p.kind === service.id);
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => linkedPoint && handleSelectPoint(linkedPoint)}
                    className={`inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-1.5 py-1 font-semibold text-slate-700 transition hover:border-primary/30 hover:bg-primary/5 ${
                      selectedPoint?.kind === service.id ? 'border-primary bg-primary/10 text-primary' : ''
                    }`}
                  >
                    <Icon size={14} />
                    {service.label}
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-5 gap-1">
              {[
                { id: 'walk', label: 'Pied', icon: <LogisticsWalkModeIcon size={18} /> },
                { id: 'bike', label: 'Vélo', icon: <LogisticsBikeModeIcon size={18} /> },
                { id: 'moto', label: 'Moto', icon: <LogisticsMotoModeIcon size={18} /> },
                { id: 'car', label: 'Voiture', icon: <LogisticsCarModeIcon size={18} /> },
                { id: 'train', label: 'Train', icon: <LogisticsTrainModeIcon size={18} /> },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setTransportMode(item.id as TransportMode);
                  }}
                    className={`rounded-lg border px-1 py-1 text-[10px] font-semibold transition ${
                      transportMode === item.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                >
                  <span className="mb-0.5 flex justify-center">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
            {selectedPoint && (
              <div className="mt-1 rounded-xl border border-slate-200 bg-slate-50 p-2 text-[11px]">
                <p className="font-semibold text-slate-800">
                  {isMissionPoint(selectedPoint.kind) ? 'Livreur sélectionné:' : 'Destination:'} {selectedPoint.title}
                </p>
                {isMissionPoint(selectedPoint.kind) ? (
                  <div className="mt-2 space-y-2">
                    <Label className="text-[10px] text-slate-600">Instructions mission (produit/service)</Label>
                    <Textarea
                      value={missionNote}
                      onChange={(e) => setMissionNote(e.target.value)}
                      placeholder="Ex: livrer documents urgents, fragile, contacter avant arrivée..."
                      className="min-h-12 text-[11px]"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Button size="sm" onClick={() => handleAssignMission('express')} className="h-8 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">
                        Mission Express
                      </Button>
                      <Button size="sm" onClick={() => handleAssignMission('standard')} className="h-8 rounded-lg bg-primary text-white hover:bg-primary/90">
                        Mission Standard
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-[11px] text-slate-600">Mode choisi: {modeLabelMap[transportMode]}</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <p className="text-[10px] text-slate-500">Utilisez le bouton en haut de la carte.</p>
                      <Button
                        size="sm"
                        onClick={handleStartItinerary}
                        disabled={isRouting}
                        className="h-7 rounded-lg bg-primary px-2 text-[10px] text-white hover:bg-primary/90"
                      >
                        <Navigation className="mr-1 h-3.5 w-3.5" />
                        Itinéraire
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
            {routeInfo && selectedPoint && (
              <div className="mt-1 rounded-xl border border-emerald-200 bg-emerald-50 p-2 text-[11px] text-slate-700">
                <p className="font-semibold text-emerald-800">
                  Itinéraire actif vers {selectedPoint.title}
                </p>
                <p>
                  {routeInfo.durationMin} min · {routeInfo.distanceKm.toFixed(1)} km ·{' '}
                  {routeInfo.source === 'osrm' ? 'Trajet réel' : 'Estimation'}
                </p>
                <p className="mt-1 text-slate-600">
                  <span className="font-semibold">Circulation:</span> {routeInfo.trafficLevel} (indice {routeInfo.trafficScore.toFixed(2)})
                </p>
                <p className="mt-1 text-slate-600"><span className="font-semibold">Client:</span> {clientAddress}</p>
                <p className="mt-1 text-slate-600"><span className="font-semibold">Destination:</span> {destinationAddress}</p>
                {routeInfo.steps.length > 0 && (
                  <p className="mt-1 text-slate-600">Instruction: {routeInfo.steps[0]}</p>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="hidden grid-cols-1 gap-2 sm:grid sm:grid-cols-3">
          <button
            onClick={() => setShowSendDialog(true)}
            className="overflow-hidden rounded-2xl border border-emerald-300 bg-gradient-to-b from-emerald-500 to-emerald-700 p-3 text-white shadow-lg"
          >
            <SendHorizontal className="mx-auto mb-2 h-6 w-6" />
            <p className="text-sm font-bold">Envoyer</p>
          </button>
          <button
            onClick={() => setShowHistoryDialog(true)}
            className="overflow-hidden rounded-2xl border border-green-300 bg-gradient-to-b from-green-500 to-green-700 p-3 text-white shadow-lg"
          >
            <HandCoins className="mx-auto mb-2 h-6 w-6" />
            <p className="text-sm font-bold">Recevoir</p>
          </button>
          <button
            onClick={() => router.push('/dashboard/ugavi/tracking')}
            className="overflow-hidden rounded-2xl border border-blue-300 bg-gradient-to-b from-blue-500 to-blue-700 p-3 text-white shadow-lg"
          >
            <TrackPackageIcon size={24} className="mx-auto mb-2 text-white" />
            <p className="text-sm font-bold">Suivi</p>
          </button>
        </section>

        {showTrackingResult && trackingNumber && (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Statut du colis : {trackingNumber}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Statut :</span><Badge className="bg-green-100 text-green-700">En transit</Badge></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Origine :</span><span className="font-semibold">Kinshasa, RDC</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Destination :</span><span className="font-semibold">Paris, France</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Dernière mise à jour :</span><span className="font-semibold">Il y a 2 heures</span></div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Send Package Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Envoyer un colis</DialogTitle>
            <DialogDescription>
              Remplissez les informations pour envoyer votre colis.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Sender Info */}
            <div className="space-y-4">
              <h3 className="font-semibold">Expéditeur</h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="sender-name">Nom complet *</Label>
                  <Input id="sender-name" value={senderName} onChange={(e) => setSenderName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sender-address">Adresse complète *</Label>
                  <Textarea id="sender-address" value={senderAddress} onChange={(e) => setSenderAddress(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sender-phone">Téléphone *</Label>
                  <Input id="sender-phone" value={senderPhone} onChange={(e) => setSenderPhone(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Receiver Info */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold">Destinataire</h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="receiver-name">Nom complet *</Label>
                  <Input id="receiver-name" value={receiverName} onChange={(e) => setReceiverName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="receiver-address">Adresse complète *</Label>
                  <Textarea id="receiver-address" value={receiverAddress} onChange={(e) => setReceiverAddress(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="receiver-phone">Téléphone *</Label>
                  <Input id="receiver-phone" value={receiverPhone} onChange={(e) => setReceiverPhone(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Package Info */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold">Informations du colis</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Poids (kg) *</Label>
                  <Input id="weight" type="number" value={packageWeight} onChange={(e) => setPackageWeight(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shipping-method">Mode de livraison</Label>
                  <Select value={shippingMethod} onValueChange={(value: 'standard' | 'express') => setShippingMethod(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard (5-7 jours)</SelectItem>
                      <SelectItem value="express">Express (1-3 jours)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description du contenu</Label>
                <Textarea id="description" value={packageDescription} onChange={(e) => setPackageDescription(e.target.value)} placeholder="Décrivez le contenu du colis..." />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendDialog(false)} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button onClick={handleSendPackage} disabled={isSubmitting} className="bg-gradient-to-r from-primary to-green-800">
              {isSubmitting ? "Enregistrement..." : "Créer l'envoi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Calculate Fees Dialog */}
      <Dialog open={showCalculateDialog} onOpenChange={setShowCalculateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Calculer les frais de livraison</DialogTitle>
            <DialogDescription>
              Obtenez une estimation des frais de livraison pour votre colis.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="calc-weight">Poids (kg) *</Label>
              <Input
                id="calc-weight"
                type="number"
                placeholder="Ex: 2.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="calc-origin">Ville d'origine *</Label>
              <Input
                id="calc-origin"
                placeholder="Ex: Kinshasa"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="calc-destination">Ville de destination *</Label>
              <Input
                id="calc-destination"
                placeholder="Ex: Paris"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={() => {
                if (!weight || !origin || !destination) {
                  toast({
                    variant: "destructive",
                    title: "Erreur",
                    description: "Veuillez remplir tous les champs.",
                  });
                  return;
                }
                // Calcul simple : base 5000 CDF + 1000 par kg + distance estimée
                const basePrice = 5000;
                const weightPrice = parseFloat(weight) * 1000;
                const distancePrice = 15000; // Prix fixe pour l'exemple
                setCalculatedPrice(basePrice + weightPrice + distancePrice);
                toast({
                  title: "Calcul effectué",
                  description: "Les frais estimés sont affichés ci-dessous.",
                });
              }}
            >
              Calculer
            </Button>
            {calculatedPrice !== null && (
              <Card className="p-4 bg-primary/10 border-primary/20">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Frais estimés :</span>
                  <span className="text-2xl font-bold text-primary">{calculatedPrice.toLocaleString('fr-FR')} CDF</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Prix indicatif. Les frais réels peuvent varier selon les options choisies.
                </p>
              </Card>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCalculateDialog(false);
              setWeight('');
              setOrigin('');
              setDestination('');
              setCalculatedPrice(null);
            }}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Find Relay Point Dialog */}
      <Dialog open={showRelayDialog} onOpenChange={setShowRelayDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trouver un point relais</DialogTitle>
            <DialogDescription>
              Recherchez un point relais près de chez vous.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="relay-location">Votre localisation</Label>
              <Input
                id="relay-location"
                placeholder="Ex: Kinshasa, Gombe"
                className="pl-10"
              />
            </div>
            <Button
              className="w-full"
              onClick={() => {
                toast({
                  title: "Recherche effectuée",
                  description: "10 points relais trouvés dans votre zone. Affichage de la carte...",
                });
              }}
            >
              Rechercher
            </Button>
            <div className="space-y-2 pt-4 border-t">
              <p className="font-semibold text-sm">Points relais à proximité :</p>
              <div className="space-y-2">
                {['Point Relais Kinshasa Centre', 'Point Relais Gombe', 'Point Relais Limete'].map((name, i) => (
                  <Card key={i} className="p-3">
                    <p className="font-semibold text-sm">{name}</p>
                    <p className="text-xs text-muted-foreground">Ouvert 7j/7, 8h-20h</p>
                    <p className="text-xs text-primary mt-1">📍 1.2 km</p>
                  </Card>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRelayDialog(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shipping History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Historique d'envoi</DialogTitle>
            <DialogDescription>
              Consultez l'historique de tous vos envois de colis.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {[
              { id: 'UGV-12345678', date: '15/05/2024', destination: 'Paris, France', status: 'Livré', amount: '125000 CDF' },
              { id: 'UGV-87654321', date: '10/05/2024', destination: 'Kinshasa, RDC', status: 'En transit', amount: '45000 CDF' },
              { id: 'UGV-11223344', date: '05/05/2024', destination: 'Bruxelles, Belgique', status: 'Livré', amount: '98000 CDF' },
            ].map((shipment) => (
              <Card key={shipment.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">{shipment.id}</p>
                      <p className="text-xs text-muted-foreground">{shipment.date}</p>
                    </div>
                    <Badge className={shipment.status === 'Livré' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                      {shipment.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">Vers : {shipment.destination}</p>
                  <p className="text-sm font-semibold text-primary">{shipment.amount}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHistoryDialog(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

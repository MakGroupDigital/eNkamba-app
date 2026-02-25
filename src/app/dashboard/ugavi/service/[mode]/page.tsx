'use client';

import { useEffect, useMemo, useState, type ComponentType } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Globe2, LocateFixed, Truck, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  LogisticsCourierIcon,
  LogisticsExpressIcon,
  LogisticsStandardIcon,
} from '@/components/icons/logistics-generated-icons';

type ServiceMode = 'express' | 'standard' | 'international';

type GeoPoint = {
  lat: number;
  lon: number;
};

type Courier = GeoPoint & {
  id: string;
  name: string;
  vehicle: 'moto' | 'camion' | 'velo';
};

type ServiceConfig = {
  mode: ServiceMode;
  title: string;
  subtitle: string;
  icon: ComponentType<{ className?: string }>;
  basePrice: number;
  eta: string;
};

const KINSHASA_CENTER: GeoPoint = { lat: -4.325, lon: 15.3222 };

const SERVICE_CONFIGS: Record<ServiceMode, ServiceConfig> = {
  express: {
    mode: 'express',
    title: 'Livraison Express',
    subtitle: 'Trouver un livreur proche puis envoyer une mission immédiate',
    icon: Zap,
    basePrice: 22000,
    eta: '30 à 180 minutes',
  },
  standard: {
    mode: 'standard',
    title: 'Livraison Standard',
    subtitle: 'Sélection du livreur sur carte puis planification de mission',
    icon: Truck,
    basePrice: 12000,
    eta: '4 à 24 heures',
  },
  international: {
    mode: 'international',
    title: 'Livraison Internationale',
    subtitle: 'Expédition transfrontalière avec formalités',
    icon: Globe2,
    basePrice: 60000,
    eta: '3 à 10 jours',
  },
};

const COURIERS: Courier[] = [
  { id: 'c1', name: 'Livreur Kasa-Vubu', vehicle: 'moto', lat: -4.3218, lon: 15.3364 },
  { id: 'c2', name: 'Livreur Gombe', vehicle: 'velo', lat: -4.3109, lon: 15.3021 },
  { id: 'c3', name: 'Livreur Limete', vehicle: 'camion', lat: -4.3402, lon: 15.3487 },
  { id: 'c4', name: 'Livreur Ngaliema', vehicle: 'moto', lat: -4.3186, lon: 15.2773 },
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

export default function UgaviServiceModePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const params = useParams<{ mode: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userPosition, setUserPosition] = useState<GeoPoint>(KINSHASA_CENTER);

  const [senderName, setSenderName] = useState('');
  const [senderAddress, setSenderAddress] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverAddress, setReceiverAddress] = useState('');
  const [packageWeight, setPackageWeight] = useState('');
  const [description, setDescription] = useState('');
  const [serviceInstructions, setServiceInstructions] = useState('');
  const [selectedCourierId, setSelectedCourierId] = useState<string | null>(null);

  const serviceConfig = useMemo(() => {
    const mode = (params?.mode || '').toLowerCase() as ServiceMode;
    return SERVICE_CONFIGS[mode] ?? SERVICE_CONFIGS.standard;
  }, [params?.mode]);

  const shouldSelectCourierFirst = serviceConfig.mode === 'express' || serviceConfig.mode === 'standard';

  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserPosition({ lat: position.coords.latitude, lon: position.coords.longitude });
      },
      () => {
        setUserPosition(KINSHASA_CENTER);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 10000 }
    );
  }, []);

  const couriersByDistance = useMemo(
    () =>
      COURIERS.map((courier) => ({
        ...courier,
        distanceKm: haversineDistanceKm(userPosition, courier),
      })).sort((a, b) => a.distanceKm - b.distanceKm),
    [userPosition]
  );

  const nearestCourier = couriersByDistance[0];

  useEffect(() => {
    const fromQueryId = searchParams.get('courierId');
    if (fromQueryId && COURIERS.some((courier) => courier.id === fromQueryId)) {
      setSelectedCourierId(fromQueryId);
      const note = searchParams.get('note');
      if (note) setServiceInstructions(note);
      return;
    }
    if (shouldSelectCourierFirst && nearestCourier) {
      setSelectedCourierId((prev) => prev ?? nearestCourier.id);
    }
  }, [searchParams, shouldSelectCourierFirst, nearestCourier]);

  const selectedCourier = useMemo(
    () => couriersByDistance.find((courier) => courier.id === selectedCourierId) ?? null,
    [couriersByDistance, selectedCourierId]
  );

  const totalAmount = useMemo(() => {
    const weight = Number(packageWeight || '0');
    const weightFee = Number.isFinite(weight) && weight > 0 ? weight * 1800 : 0;
    const customsFee = serviceConfig.mode === 'international' ? 20000 : 0;
    const courierDistanceFee = selectedCourier ? Math.round(selectedCourier.distanceKm * 900) : 0;
    return serviceConfig.basePrice + weightFee + customsFee + courierDistanceFee;
  }, [packageWeight, serviceConfig.basePrice, serviceConfig.mode, selectedCourier]);

  const handleContinueToPayment = () => {
    if (!senderName.trim() || !senderAddress.trim() || !receiverName.trim() || !receiverAddress.trim() || !packageWeight.trim()) {
      toast({
        variant: 'destructive',
        title: 'Champs requis',
        description: 'Veuillez compléter les informations obligatoires.',
      });
      return;
    }

    if (shouldSelectCourierFirst && !selectedCourier) {
      toast({
        variant: 'destructive',
        title: 'Livreur requis',
        description: 'Sélectionnez d\'abord un livreur sur la carte.',
      });
      return;
    }

    setIsSubmitting(true);
    const paymentData = {
      context: 'ugavi',
      amount: totalAmount,
      description: `${serviceConfig.title} · ${packageWeight}kg`,
      metadata: {
        serviceMode: serviceConfig.mode,
        senderName,
        senderAddress,
        receiverName,
        receiverAddress,
        packageWeight,
        description,
        serviceInstructions,
        eta: serviceConfig.eta,
        selectedCourier,
      },
    };

    sessionStorage.setItem('ugavi_payment_data', JSON.stringify(paymentData));
    router.push('/dashboard/ugavi/pay');
  };

  const ServiceIcon = serviceConfig.icon;

  return (
    <div className="mx-auto min-h-screen w-full max-w-4xl bg-gradient-to-b from-emerald-50 via-white to-cyan-50 p-3 md:p-4">
      <header className="mb-4 flex items-center gap-3">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/ugavi">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-primary/10 p-2 text-primary">
            <ServiceIcon className="h-4 w-4" />
          </span>
          <div>
            <h1 className="text-lg font-bold text-slate-900">{serviceConfig.title}</h1>
            <p className="text-xs text-slate-600">{serviceConfig.subtitle}</p>
          </div>
        </div>
      </header>

      {shouldSelectCourierFirst && (
        <Card className="mb-4 border-emerald-200">
          <CardHeader>
            <CardTitle className="text-base">1) Sélection du livreur sur la carte</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative h-64 overflow-hidden rounded-2xl border">
              <iframe
                title="Carte livreurs"
                src="https://www.openstreetmap.org/export/embed.html?bbox=15.2000%2C-4.4500%2C15.4200%2C-4.2500&layer=mapnik"
                className="h-full w-full"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white/30 via-transparent to-white/15" />
              {couriersByDistance.slice(0, 4).map((courier, index) => (
                <button
                  key={courier.id}
                  type="button"
                  onClick={() => setSelectedCourierId(courier.id)}
                  className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/70 p-1.5 shadow ${selectedCourierId === courier.id ? 'ring-4 ring-primary/40 bg-primary' : 'bg-emerald-600'}`}
                  style={{ left: `${18 + index * 20}%`, top: `${35 + (index % 2) * 22}%` }}
                >
                  <LogisticsCourierIcon size={20} />
                </button>
              ))}
              <div className="pointer-events-none absolute left-3 top-3 rounded-lg bg-white/90 px-2 py-1 text-[11px] font-semibold text-slate-700">
                <LocateFixed className="mr-1 inline h-3.5 w-3.5 text-blue-600" />
                Position utilisateur
              </div>
            </div>

            {selectedCourier ? (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm">
                <p className="font-semibold text-primary">Livreur sélectionné: {selectedCourier.name}</p>
                <p className="text-xs text-slate-600">Moyen: {selectedCourier.vehicle} · Distance: {selectedCourier.distanceKm.toFixed(2)} km</p>
              </div>
            ) : (
              <p className="text-xs text-slate-600">Sélectionnez un livreur pour continuer.</p>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="border-emerald-200">
        <CardHeader>
          <CardTitle className="text-base">2) Détails mission / envoi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Nom expéditeur *</Label>
              <Input value={senderName} onChange={(e) => setSenderName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Nom destinataire *</Label>
              <Input value={receiverName} onChange={(e) => setReceiverName(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Adresse expéditeur *</Label>
              <Textarea value={senderAddress} onChange={(e) => setSenderAddress(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Adresse destinataire *</Label>
              <Textarea value={receiverAddress} onChange={(e) => setReceiverAddress(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Poids (kg) *</Label>
              <Input type="number" min="0.1" step="0.1" value={packageWeight} onChange={(e) => setPackageWeight(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Délai estimé</Label>
              <Input value={serviceConfig.eta} readOnly />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description colis / service</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Contenu, fragilité, consignes de prise en charge..." />
          </div>

          {shouldSelectCourierFirst && (
            <div className="space-y-2">
              <Label>Instructions mission pour le livreur</Label>
              <Textarea
                value={serviceInstructions}
                onChange={(e) => setServiceInstructions(e.target.value)}
                placeholder="Ex: contacter à l'arrivée, retirer le produit au bureau, code d'accès..."
              />
            </div>
          )}

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm">
            <p className="font-semibold text-emerald-900">Montant estimé: {totalAmount.toLocaleString('fr-FR')} CDF</p>
            <p className="text-xs text-emerald-700">Calcul: base + poids + distance livreur (si express/standard) + formalités (si international).</p>
          </div>

          <Button
            onClick={handleContinueToPayment}
            disabled={isSubmitting || (shouldSelectCourierFirst && !selectedCourier)}
            className="h-11 w-full bg-primary hover:bg-primary/90"
          >
            {isSubmitting ? 'Traitement...' : 'Continuer vers le paiement'}
          </Button>
        </CardContent>
      </Card>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Card className="border-emerald-200">
          <CardContent className="flex items-center gap-2 p-3 text-xs text-slate-700">
            <LogisticsExpressIcon size={20} />
            <span>Priorité forte</span>
          </CardContent>
        </Card>
        <Card className="border-emerald-200">
          <CardContent className="flex items-center gap-2 p-3 text-xs text-slate-700">
            <LogisticsStandardIcon size={20} />
            <span>Tarif optimisé</span>
          </CardContent>
        </Card>
        <Card className="border-emerald-200">
          <CardContent className="flex items-center gap-2 p-3 text-xs text-slate-700">
            <LogisticsCourierIcon size={20} />
            <span>Suivi mission</span>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

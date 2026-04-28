'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  MapPin,
  Navigation,
  Package,
  Search,
  Clock,
  ArrowRight,
} from "lucide-react";
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/useAuth';
import {
  LogisticsCourierIcon,
  LogisticsExpressIcon,
  LogisticsInternationalIcon,
  LogisticsTrackingIcon,
} from "@/components/icons/logistics-generated-icons";

const KINSHASA_CENTER = { lat: -4.325, lon: 15.3222 };

export default function UgaviPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [activeTab, setActiveTab] = useState<'send' | 'track' | 'express' | 'international'>('send');
  const [userPosition, setUserPosition] = useState(KINSHASA_CENTER);
  const [trackingQuery, setTrackingQuery] = useState('');
  const [recentShipments, setRecentShipments] = useState<
    Array<{
      id: string;
      trackingNumber: string;
      destination: string;
      status: string;
      statusColor: string;
      source: 'ugavi' | 'nkampa';
    }>
  >([]);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserPosition({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        () => {
          setUserPosition(KINSHASA_CENTER);
        }
      );
    }
  }, []);

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

        const ugaviSnapshot = await getDocs(
          query(
            collection(db, 'ugaviRequests'),
            where('userId', '==', user.uid)
          )
        );

        const nkampaSnapshot = await getDocs(
          query(
            collection(db, 'nkampa_orders'),
            where('buyerId', '==', user.uid)
          )
        );

        const normalizeStatus = (status: string) => {
          const lowered = (status || '').toLowerCase();
          if (['delivered', 'livré', 'livre'].includes(lowered)) {
            return { label: 'Livré', color: 'bg-green-100 text-green-700' };
          }
          if (['assigned', 'registered', 'paid', 'processing', 'shipped', 'in_transit', 'out_for_delivery'].includes(lowered)) {
            return { label: 'En transit', color: 'bg-blue-100 text-blue-700' };
          }
          if (['blocked', 'failed', 'cancelled', 'returned'].includes(lowered)) {
            return { label: 'Incident', color: 'bg-red-100 text-red-700' };
          }
          return { label: 'En attente', color: 'bg-amber-100 text-amber-700' };
        };

        const ugaviItems = ugaviSnapshot.docs.map((shipmentDoc) => {
          const data = shipmentDoc.data() as any;
          const statusMeta = normalizeStatus(data.logisticsStatus || data.status || 'pending_payment');
          return {
            id: shipmentDoc.id,
            trackingNumber: data.trackingNumber || `UGV-${shipmentDoc.id.slice(0, 6).toUpperCase()}`,
            destination: data.receiverAddress || 'Destination Ugavi',
            status: statusMeta.label,
            statusColor: statusMeta.color,
            source: 'ugavi' as const,
            updatedAt: data.updatedAt?.toMillis?.() || 0,
          };
        });

        const nkampaItems = nkampaSnapshot.docs
          .map((orderDoc) => {
            const data = orderDoc.data() as any;
            if (!data.trackingNumber) return null;
            const statusMeta = normalizeStatus(data.status || 'pending');
            return {
              id: orderDoc.id,
              trackingNumber: data.trackingNumber,
              destination: data.shippingAddress || data.pickupRoute?.storeLocationLabel || 'Destination Nkampa',
              status: statusMeta.label,
              statusColor: statusMeta.color,
              source: 'nkampa' as const,
              updatedAt: data.updatedAt?.toMillis?.() || 0,
            };
          })
          .filter(Boolean) as Array<any>;

        const merged = [...ugaviItems, ...nkampaItems]
          .sort((left, right) => right.updatedAt - left.updatedAt)
          .slice(0, 4)
          .map(({ updatedAt, ...shipment }) => shipment);

        if (!isCancelled) {
          setRecentShipments(merged);
        }
      } catch (error) {
        console.error('Erreur chargement envois Ugavi:', error);
        if (!isCancelled) {
          setRecentShipments([]);
        }
      }
    };

    loadRecentShipments();

    return () => {
      isCancelled = true;
    };
  }, [user?.uid]);

  const navItems = [
    { id: 'send', label: 'Envoyer', icon: LogisticsCourierIcon, color: 'green' },
    { id: 'track', label: 'Suivre', icon: LogisticsTrackingIcon, color: 'blue' },
    { id: 'express', label: 'Express', icon: LogisticsExpressIcon, color: 'orange' },
    { id: 'international', label: 'International', icon: LogisticsInternationalIcon, color: 'purple' },
  ];

  const activeServiceMode = useMemo(() => {
    if (activeTab === 'express') return 'express';
    if (activeTab === 'international') return 'international';
    return 'standard';
  }, [activeTab]);

  const primaryButtonLabel = activeTab === 'track' ? 'Rechercher le colis' : 'Continuer';

  const handleContinue = () => {
    if (activeTab === 'track') {
      if (!trackingQuery.trim()) {
        toast({
          variant: 'destructive',
          title: 'Numéro requis',
          description: 'Veuillez entrer un numéro de suivi',
        });
        return;
      }

      router.push(`/dashboard/ugavi/tracking?tracking=${encodeURIComponent(trackingQuery.trim())}`);
      return;
    }

    if (!pickupLocation || !dropoffLocation) {
      toast({
        variant: 'destructive',
        title: 'Informations manquantes',
        description: 'Veuillez renseigner le point de départ et la destination',
      });
      return;
    }

    if (typeof window !== 'undefined') {
      sessionStorage.setItem(
        'ugavi_service_prefill',
        JSON.stringify({
          pickupQuery: pickupLocation,
          dropoffQuery: dropoffLocation,
        })
      );
    }

    router.push(
      `/dashboard/ugavi/service/${activeServiceMode}?senderAddress=${encodeURIComponent(pickupLocation)}&receiverAddress=${encodeURIComponent(dropoffLocation)}`
    );
  };

  const handleQuickTracking = (trackingNumber: string) => {
    router.push(`/dashboard/ugavi/tracking?tracking=${encodeURIComponent(trackingNumber)}`);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Carte OpenStreetMap en fond */}
      <div className="absolute inset-0 z-0">
        <iframe
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${userPosition.lon - 0.05},${userPosition.lat - 0.05},${userPosition.lon + 0.05},${userPosition.lat + 0.05}&layer=mapnik&marker=${userPosition.lat},${userPosition.lon}`}
          className="w-full h-full border-0"
          style={{ filter: 'grayscale(20%) brightness(0.95)' }}
        />
        {/* Overlay pour assombrir légèrement la carte */}
        <div className="absolute inset-0 bg-black/10"></div>
      </div>

      {/* Contenu par-dessus la carte */}
      <div className="relative z-10">
        {/* Header transparent */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-white/20 px-4 py-4 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl font-black bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                Ugavi Logistics
              </h1>
              <p className="text-sm text-gray-700 font-medium">Livraison rapide et fiable</p>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => router.push('/dashboard/settings/business-account')}
              className="shrink-0 rounded-full bg-gradient-to-r from-green-600 to-orange-500 px-4 text-white shadow-lg hover:from-green-700 hover:to-orange-600"
            >
              Business Account
            </Button>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
          {/* Carte principale - Style Yango avec transparence */}
          <Card className="border-white/30 shadow-2xl bg-white/90 backdrop-blur-xl">
            <CardContent className="p-6 space-y-4">
              {/* Point de départ */}
              {activeTab !== 'track' ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-4 h-4 rounded-full bg-green-600 ring-4 ring-green-100"></div>
                    </div>
                    <div className="flex-1 relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-600" />
                      <Input
                        value={pickupLocation}
                        onChange={(e) => setPickupLocation(e.target.value)}
                        placeholder={activeTab === 'international' ? 'Ville / pays de départ' : 'Point de départ'}
                        className="pl-10 h-12 bg-white/50 backdrop-blur-sm border-white/50 focus:bg-white/80 focus:border-green-500 font-medium"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-4 flex justify-center">
                      <div className="w-0.5 h-8 bg-gradient-to-b from-green-600 to-red-600"></div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-4 h-4 rounded-full bg-red-600 ring-4 ring-red-100"></div>
                    </div>
                    <div className="flex-1 relative">
                      <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-red-600" />
                      <Input
                        value={dropoffLocation}
                        onChange={(e) => setDropoffLocation(e.target.value)}
                        placeholder={activeTab === 'international' ? 'Ville / pays de destination' : 'Destination'}
                        className="pl-10 h-12 bg-white/50 backdrop-blur-sm border-white/50 focus:bg-white/80 focus:border-red-500 font-medium"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-4 h-4 rounded-full bg-blue-600 ring-4 ring-blue-100"></div>
                  </div>
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-600" />
                    <Input
                      value={trackingQuery}
                      onChange={(e) => setTrackingQuery(e.target.value)}
                      placeholder="Numéro de suivi Ugavi ou Nkampa"
                      className="pl-10 h-12 bg-white/50 backdrop-blur-sm border-white/50 focus:bg-white/80 focus:border-blue-500 font-medium"
                    />
                  </div>
                </div>
              )}

              {/* Bouton continuer */}
              <Button
                onClick={handleContinue}
                className="w-full h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
              >
                {primaryButtonLabel}
              </Button>
            </CardContent>
          </Card>

          {/* Barre de navigation horizontale avec transparence */}
          <div className="bg-white/90 backdrop-blur-xl rounded-xl shadow-lg p-2 overflow-x-auto border border-white/30">
            <div className="flex gap-2 min-w-max">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const colorClasses = {
                  green: isActive ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg shadow-green-500/30' : 'bg-green-50 text-green-700 hover:bg-green-100',
                  blue: isActive ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30' : 'bg-blue-50 text-blue-700 hover:bg-blue-100',
                  orange: isActive ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-lg shadow-orange-500/30' : 'bg-orange-50 text-orange-700 hover:bg-orange-100',
                  purple: isActive ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/30' : 'bg-purple-50 text-purple-700 hover:bg-purple-100',
                };
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm transition-all whitespace-nowrap ${colorClasses[item.color as keyof typeof colorClasses]}`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contenu selon l'onglet actif avec transparence */}
          <div className="space-y-4">
            {activeTab === 'send' && (
              <Card className="border-white/30 bg-white/90 backdrop-blur-xl shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-green-100 rounded-xl">
                      <LogisticsCourierIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-2">Envoyer un colis</h3>
                      <p className="text-sm text-gray-700 mb-4">
                        Livraison rapide et sécurisée dans toute la ville
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-gray-700">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium">24-48h</span>
                        </div>
                        <div className="flex items-center gap-1 text-green-600 font-bold">
                          <span>À partir de 5 000 FC</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="mt-4 bg-green-600 hover:bg-green-700"
                        onClick={() => setActiveTab('send')}
                      >
                        Ouvrir le flux
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'track' && (
              <Card className="border-white/30 bg-white/90 backdrop-blur-xl shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <LogisticsTrackingIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-2">Suivre un colis</h3>
                      <p className="text-sm text-gray-700 mb-4">
                        Localisez votre colis en temps réel
                      </p>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-600" />
                        <Input
                          value={trackingQuery}
                          onChange={(e) => setTrackingQuery(e.target.value)}
                          placeholder="Entrez le numéro de suivi"
                          className="h-10 pl-10 bg-white/50 backdrop-blur-sm border-white/50 focus:bg-white/80 focus:border-blue-500"
                        />
                      </div>
                      <Button
                        size="sm"
                        className="mt-4 bg-blue-600 hover:bg-blue-700"
                        onClick={handleContinue}
                      >
                        Rechercher
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'express' && (
              <Card className="border-white/30 bg-white/90 backdrop-blur-xl shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-orange-100 rounded-xl">
                      <LogisticsExpressIcon className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-2">Livraison Express</h3>
                      <p className="text-sm text-gray-700 mb-4">
                        Livraison en moins de 2 heures
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-gray-700">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium">Moins de 2h</span>
                        </div>
                        <div className="flex items-center gap-1 text-orange-600 font-bold">
                          <span>À partir de 15 000 FC</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="mt-4 bg-orange-600 hover:bg-orange-700"
                        onClick={() => setActiveTab('express')}
                      >
                        Commander express
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'international' && (
              <Card className="border-white/30 bg-white/90 backdrop-blur-xl shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-purple-100 rounded-xl">
                      <LogisticsInternationalIcon className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-2">Livraison Internationale</h3>
                      <p className="text-sm text-gray-700 mb-4">
                        Envoyez vos colis partout dans le monde
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-gray-700">
                          <Package className="h-4 w-4" />
                          <span className="font-medium">Selon destination</span>
                        </div>
                        <div className="flex items-center gap-1 text-purple-600 font-bold">
                          <span>Sur devis</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="mt-4 bg-purple-600 hover:bg-purple-700"
                        onClick={() => setActiveTab('international')}
                      >
                        Préparer l’envoi
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Envois récents avec transparence */}
          <Card className="border-white/30 bg-white/90 backdrop-blur-xl shadow-lg">
            <CardContent className="p-6">
              <h3 className="font-bold text-gray-900 mb-4">Envois récents</h3>
              <div className="space-y-3">
                {recentShipments.length ? (
                  recentShipments.map((shipment) => (
                    <button
                      key={`${shipment.source}-${shipment.id}`}
                      onClick={() => handleQuickTracking(shipment.trackingNumber)}
                      className="flex w-full items-center justify-between rounded-lg border border-white/30 bg-white/50 p-3 text-left backdrop-blur-sm transition hover:bg-white/70"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-white p-2 shadow-sm">
                          <Package className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-gray-900">{shipment.trackingNumber}</p>
                          <p className="text-xs text-gray-600">{shipment.destination}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block rounded px-2 py-1 text-xs font-semibold ${shipment.statusColor}`}>
                          {shipment.status}
                        </span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-white/40 bg-white/40 p-4 text-sm text-gray-600">
                    Aucun envoi récent disponible pour le moment.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

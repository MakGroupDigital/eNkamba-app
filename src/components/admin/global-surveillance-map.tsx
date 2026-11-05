'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Activity, Globe2, LocateFixed, MapPin, RadioTower, RefreshCw, Users, Wifi } from 'lucide-react';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import type { Map as LeafletMap, Marker } from 'leaflet';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase';

type LiveUserPoint = {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string | null;
  module?: string | null;
  path?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  ip?: string | null;
  latitude: number;
  longitude: number;
  active?: boolean;
  durationSeconds?: number;
  updatedAt?: any;
};

const DEFAULT_CENTER: [number, number] = [-4.325, 15.3222];

function toNumber(value: unknown) {
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function formatDuration(seconds?: number) {
  const safeSeconds = Math.max(0, Math.round(seconds || 0));
  if (safeSeconds < 60) return `${safeSeconds}s`;
  const minutes = Math.floor(safeSeconds / 60);
  if (minutes < 60) return `${minutes}m ${safeSeconds % 60}s`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function formatLastUpdate(value: any) {
  const date = value?.toDate?.() || (value ? new Date(value) : null);
  if (!date || Number.isNaN(date.getTime())) return 'temps réel';
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function normalizeActivity(id: string, data: any): LiveUserPoint | null {
  const latitude = toNumber(data.latitude ?? data.location?.latitude ?? data.currentLocation?.latitude);
  const longitude = toNumber(data.longitude ?? data.location?.longitude ?? data.currentLocation?.longitude);

  if (latitude === null || longitude === null) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;

  return {
    id,
    userId: String(data.userId || data.uid || id),
    userName: String(data.userName || data.displayName || data.userEmail || 'Utilisateur Kenz'),
    userEmail: data.userEmail || data.email || null,
    module: data.module || null,
    path: data.path || null,
    city: data.city || data.location?.city || null,
    region: data.region || data.location?.region || null,
    country: data.country || data.location?.country || null,
    ip: data.ip || null,
    latitude,
    longitude,
    active: data.active !== false,
    durationSeconds: Number(data.durationSeconds || 0),
    updatedAt: data.updatedAt,
  };
}

function buildPopup(point: LiveUserPoint) {
  const place = [point.city, point.region, point.country].filter(Boolean).join(', ') || `${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}`;
  const safeName = point.userName.replace(/[<>"']/g, '');
  const safeModule = String(point.module || 'Module inconnu').replace(/[<>"']/g, '');
  const safePlace = place.replace(/[<>"']/g, '');
  const profileHref = `/dashboard/makutano/profile/${encodeURIComponent(point.userId)}`;

  return `
    <div class="enkamba-admin-popup">
      <div class="enkamba-admin-popup__header">
        <span class="enkamba-admin-popup__avatar">${safeName.charAt(0).toUpperCase() || 'U'}</span>
        <div>
          <a class="enkamba-admin-popup__name" href="${profileHref}">${safeName}</a>
          <p>${safeModule}</p>
        </div>
      </div>
      <div class="enkamba-admin-popup__body">
        <span>📍 ${safePlace}</span>
        <span>⏱ ${formatDuration(point.durationSeconds)}</span>
        <span>🛰 ${point.ip || 'IP N/A'}</span>
      </div>
    </div>
  `;
}

export function GlobalSurveillanceMap() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Record<string, Marker>>({});
  const leafletRef = useRef<any>(null);

  const [points, setPoints] = useState<LiveUserPoint[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<LiveUserPoint | null>(null);
  const [streamStatus, setStreamStatus] = useState<'connexion' | 'connecte' | 'erreur'>('connexion');

  useEffect(() => {
    const activityQuery = query(collection(db, 'admin_user_activity'), orderBy('updatedAt', 'desc'), limit(240));

    return onSnapshot(
      activityQuery,
      (snapshot) => {
        const latestByUser = new Map<string, LiveUserPoint>();
        snapshot.docs.forEach((entry) => {
          const point = normalizeActivity(entry.id, entry.data());
          if (!point || !point.active) return;
          if (!latestByUser.has(point.userId)) latestByUser.set(point.userId, point);
        });
        const nextPoints = Array.from(latestByUser.values());
        setPoints(nextPoints);
        setSelectedPoint((current) => {
          if (!current) return nextPoints[0] || null;
          return nextPoints.find((point) => point.userId === current.userId) || nextPoints[0] || null;
        });
        setStreamStatus('connecte');
      },
      (error) => {
        console.warn('Carte admin utilisateurs indisponible:', error);
        setStreamStatus('erreur');
      },
    );
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      if (!mapContainerRef.current || mapRef.current) return;

      const L = await import('leaflet');
      if (cancelled || !mapContainerRef.current) return;

      leafletRef.current = L;
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
        minZoom: 2,
        maxZoom: 18,
        worldCopyJump: true,
      }).setView(DEFAULT_CENTER, 3);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapRef.current = map;
    }

    initMap();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markersRef.current = {};
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!map || !L) return;

    const currentIds = new Set(points.map((point) => point.userId));
    Object.entries(markersRef.current).forEach(([userId, marker]) => {
      if (!currentIds.has(userId)) {
        marker.remove();
        delete markersRef.current[userId];
      }
    });

    points.forEach((point) => {
      const icon = L.divIcon({
        className: '',
        html: `
          <span class="enkamba-live-marker ${selectedPoint?.userId === point.userId ? 'enkamba-live-marker--active' : ''}">
            <span class="enkamba-live-marker__pulse"></span>
            <span class="enkamba-live-marker__dot"></span>
          </span>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const existingMarker = markersRef.current[point.userId];
      if (existingMarker) {
        existingMarker.setLatLng([point.latitude, point.longitude]);
        existingMarker.setIcon(icon);
        existingMarker.setPopupContent(buildPopup(point));
        return;
      }

      const marker = L.marker([point.latitude, point.longitude], { icon }).addTo(map);
      marker.bindPopup(buildPopup(point), {
        closeButton: false,
        className: 'enkamba-admin-leaflet-popup',
        offset: [0, -10],
      });
      marker.on('mouseover', () => marker.openPopup());
      marker.on('click', () => {
        setSelectedPoint(point);
        marker.openPopup();
      });
      markersRef.current[point.userId] = marker;
    });
  }, [points, selectedPoint?.userId]);

  const moduleStats = useMemo(() => {
    const stats = new Map<string, number>();
    points.forEach((point) => stats.set(point.module || 'Inconnu', (stats.get(point.module || 'Inconnu') || 0) + 1));
    return Array.from(stats.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [points]);

  const focusSelectedPoint = () => {
    if (!mapRef.current || !selectedPoint) return;
    mapRef.current.flyTo([selectedPoint.latitude, selectedPoint.longitude], Math.max(mapRef.current.getZoom(), 10), { duration: 0.8 });
    markersRef.current[selectedPoint.userId]?.openPopup();
  };

  return (
    <section className="overflow-hidden rounded-[8px] border border-primary/10 bg-white text-slate-950 shadow-sm">
      <div className="space-y-4 p-4">
        <header className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-start">
          <div className="rounded-[8px] border border-primary/10 bg-[#FFFFFF] p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-primary hover:bg-primary">
                <Globe2 className="mr-1 h-3.5 w-3.5" />
                Carte live
              </Badge>
              <Badge className={streamStatus === 'connecte' ? 'bg-primary hover:bg-primary' : streamStatus === 'erreur' ? 'bg-red-500 hover:bg-red-500' : 'bg-[#F51B2B] hover:bg-[#F51B2B]'}>
                {streamStatus}
              </Badge>
            </div>

            <h2 className="mt-3 font-headline text-2xl font-black md:text-3xl">Centre d'administration global Kenz</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Centre de contrôle GPS en temps réel.</p>
          </div>

          <div className="grid grid-cols-3 gap-2 lg:min-w-[390px]">
            <div className="rounded-[8px] border border-primary/10 bg-white p-3">
              <Users className="h-5 w-5 text-primary" />
              <p className="mt-1 text-2xl font-black">{points.length}</p>
              <p className="text-[11px] font-semibold text-slate-500">connectés</p>
            </div>
            <div className="rounded-[8px] border border-[#F51B2B]/25 bg-[#F51B2B]/10 p-3">
              <Activity className="h-5 w-5 text-[#F51B2B]" />
              <p className="mt-1 text-2xl font-black">{moduleStats.length}</p>
              <p className="text-[11px] font-semibold text-slate-500">modules</p>
            </div>
            <div className="rounded-[8px] border border-primary/10 bg-white p-3">
              <RadioTower className="h-5 w-5 text-primary" />
              <p className="mt-1 text-2xl font-black">live</p>
              <p className="text-[11px] font-semibold text-slate-500">sync</p>
            </div>
          </div>
        </header>

        <div className="relative min-h-[620px] overflow-hidden rounded-[8px] border border-primary/10 bg-white">
          <div ref={mapContainerRef} className="absolute inset-0 z-0 bg-[#FFFFFF]" />
          <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0)_60%)]" />
          <div className="absolute left-4 top-4 z-20 rounded-full border border-primary/10 bg-white/95 px-4 py-2 text-sm font-black text-primary shadow-lg shadow-primary/10">
            {points.length} connectés
          </div>

          <Button
            type="button"
            size="sm"
            variant="outline"
            className="absolute right-4 top-4 z-20 rounded-[8px] border-primary/20 bg-white/95 text-primary shadow-xl shadow-primary/10 backdrop-blur-xl hover:bg-primary/10 hover:text-primary"
            onClick={() => {
              if (!mapRef.current) return;
              mapRef.current.flyTo(DEFAULT_CENTER, 3, { duration: 0.8 });
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Vue globale
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_1.25fr]">
          <aside className="rounded-[8px] border border-primary/10 bg-[#FFFFFF] p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-black">Modules actifs</p>
              <Wifi className="h-4 w-4 text-primary" />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {moduleStats.length === 0 ? (
                <div className="rounded-[8px] border border-dashed border-primary/20 bg-primary/5 p-3 text-sm text-slate-500 sm:col-span-2">Aucune position utilisateur disponible.</div>
              ) : moduleStats.map(([module, count]) => (
                <button
                  key={module}
                  type="button"
                  className="flex w-full items-center justify-between rounded-[8px] bg-white px-3 py-2 text-sm transition hover:bg-primary/5"
                  onClick={() => {
                    const point = points.find((entry) => (entry.module || 'Inconnu') === module);
                    if (point) setSelectedPoint(point);
                  }}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0 text-primary" />
                    <span className="truncate font-semibold">{module}</span>
                  </span>
                  <Badge className="bg-[#F51B2B]/15 text-[#F51B2B] hover:bg-[#F51B2B]/15">{count}</Badge>
                </button>
              ))}
            </div>
          </aside>

          <aside className="rounded-[8px] border border-primary/10 bg-[#FFFFFF] p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Utilisateur sélectionné</p>
                <h3 className="mt-1 truncate text-xl font-black">{selectedPoint?.userName || 'Aucun utilisateur'}</h3>
                <p className="mt-1 truncate text-sm text-slate-600">
                  {selectedPoint
                    ? [selectedPoint.city, selectedPoint.region, selectedPoint.country].filter(Boolean).join(', ') || `${selectedPoint.latitude.toFixed(5)}, ${selectedPoint.longitude.toFixed(5)}`
                    : 'Cliquez sur un point GPS'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedPoint && (
                  <>
                    <Button size="sm" className="rounded-[8px] bg-primary hover:bg-primary" onClick={focusSelectedPoint}>
                      <LocateFixed className="mr-2 h-4 w-4" />
                      Centrer
                    </Button>
                    <Button asChild size="sm" variant="outline" className="rounded-[8px] border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary">
                      <Link href={`/dashboard/makutano/profile/${selectedPoint.userId}`}>
                        Profil
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>

            {selectedPoint && (
              <div className="mt-4 grid gap-2 md:grid-cols-3">
                <div className="rounded-[8px] bg-white p-3">
                  <p className="text-xs text-slate-500">Module</p>
                  <p className="truncate font-bold">{selectedPoint.module || 'Inconnu'}</p>
                </div>
                <div className="rounded-[8px] bg-white p-3">
                  <p className="text-xs text-slate-500">GPS</p>
                  <p className="truncate font-bold">{selectedPoint.latitude.toFixed(4)}, {selectedPoint.longitude.toFixed(4)}</p>
                </div>
                <div className="rounded-[8px] bg-white p-3">
                  <p className="text-xs text-slate-500">Mise à jour</p>
                  <p className="font-bold">{formatLastUpdate(selectedPoint.updatedAt)}</p>
                </div>
              </div>
            )}
          </aside>
        </div>

        <div className="rounded-[8px] border border-primary/10 bg-[#FFFFFF] px-4 py-3 text-center text-xs font-semibold text-slate-500">
          Survolez un point pour voir le nom. Cliquez pour ouvrir le profil utilisateur.
        </div>
      </div>
    </section>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BadgeCheck,
  Banknote,
  Boxes,
  BrainCircuit,
  BriefcaseBusiness,
  Bug,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Database,
  Eye,
  EyeOff,
  Fingerprint,
  FileCheck2,
  FileText,
  KeyRound,
  Landmark,
  Layers3,
  LockKeyhole,
  Maximize2,
  MessageCircle,
  PackageCheck,
  RadioTower,
  RotateCcw,
  Save,
  Search,
  Server,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Store,
  Truck,
  UserCog,
  Users,
  Video,
  ZoomIn,
  ZoomOut,
  type LucideIcon,
} from 'lucide-react';
import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';

type AdminStat = {
  label: string;
  value: string;
  trend: string;
  icon: LucideIcon;
  tone: string;
};

type ModuleItem = {
  name: string;
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  color: string;
  health: number;
  users: string;
  submodules: string[];
};

const connectedCities = [
  { city: 'Kinshasa', country: 'RDC', continent: 'Afrique', x: 53, y: 57, users: 1284, module: 'Mbongo', status: 'Actif', latency: '38ms' },
  { city: 'Lubumbashi', country: 'RDC', continent: 'Afrique', x: 55, y: 70, users: 426, module: 'Ugavi', status: 'Actif', latency: '44ms' },
  { city: 'Goma', country: 'RDC', continent: 'Afrique', x: 57, y: 53, users: 312, module: 'Masolo', status: 'Actif', latency: '41ms' },
  { city: 'Paris', country: 'France', continent: 'Europe', x: 48, y: 32, users: 217, module: 'Makutano', status: 'Actif', latency: '52ms' },
  { city: 'Bruxelles', country: 'Belgique', continent: 'Europe', x: 49, y: 29, users: 144, module: 'Business Pro', status: 'Controle', latency: '56ms' },
  { city: 'Johannesburg', country: 'Afrique du Sud', continent: 'Afrique', x: 56, y: 82, users: 96, module: 'Nkampa', status: 'Actif', latency: '61ms' },
  { city: 'Dubai', country: 'EAU', continent: 'Asie', x: 63, y: 43, users: 88, module: 'Paiement', status: 'Actif', latency: '64ms' },
  { city: 'Montreal', country: 'Canada', continent: 'Amerique du Nord', x: 23, y: 27, users: 64, module: 'Masolo', status: 'Actif', latency: '71ms' },
  { city: 'New York', country: 'USA', continent: 'Amerique du Nord', x: 26, y: 36, users: 52, module: 'AI', status: 'Actif', latency: '69ms' },
  { city: 'Sao Paulo', country: 'Bresil', continent: 'Amerique du Sud', x: 35, y: 76, users: 39, module: 'Makutano', status: 'Actif', latency: '82ms' },
  { city: 'Guangzhou', country: 'Chine', continent: 'Asie', x: 78, y: 47, users: 33, module: 'Nkampa', status: 'Actif', latency: '93ms' },
  { city: 'Sydney', country: 'Australie', continent: 'Oceanie', x: 86, y: 80, users: 21, module: 'eStream', status: 'Actif', latency: '104ms' },
];

const ACCESS_CONFIG_REF = doc(db, 'app_config', 'access_control');

const modules: ModuleItem[] = [
  {
    name: 'Masolo',
    label: 'Chat',
    description: 'Messagerie, appels, groupes, stories et transferts contextuels.',
    href: '/dashboard/miyiki-chat',
    icon: MessageCircle,
    color: '#0A8B46',
    health: 96,
    users: '18.4k',
    submodules: ['Conversations', 'Groupes', 'Appels audio/video', 'Stories', 'Partage localisation'],
  },
  {
    name: 'Mbongo',
    label: 'Paiement',
    description: 'Wallet, QR, transferts, factures, epargne, credit et agents.',
    href: '/dashboard/mbongo-dashboard',
    icon: CircleDollarSign,
    color: '#0A8B46',
    health: 94,
    users: '12.9k',
    submodules: ['Portefeuille', 'Payer/recevoir', 'Historique', 'Epargne', 'Tontine', 'Factures'],
  },
  {
    name: 'Nkampa',
    label: 'E-commerce',
    description: 'Marketplace, boutiques, paniers, commandes et portail vendeurs.',
    href: '/dashboard/nkampa',
    icon: ShoppingBag,
    color: '#FFA500',
    health: 89,
    users: '7.2k',
    submodules: ['Catalogue', 'Boutiques', 'Panier', 'Commandes', 'Seller portal', 'Roles business'],
  },
  {
    name: 'Ugavi',
    label: 'Logistique',
    description: 'Expedition, tracking colis, flotte, relais et paiements logistiques.',
    href: '/dashboard/ugavi',
    icon: Truck,
    color: '#0A8B46',
    health: 91,
    users: '4.8k',
    submodules: ['Tracking', 'Expeditions', 'Fleet', 'Agent relais', 'Scan colis', 'Livraisons'],
  },
  {
    name: 'Makutano',
    label: 'Connexion',
    description: 'Reseau social, evenements, communaute et relations utilisateurs.',
    href: '/dashboard/makutano',
    icon: RadioTower,
    color: '#9C27B0',
    health: 87,
    users: '6.1k',
    submodules: ['Feed', 'Relations', 'Evenements', 'Invitations', 'Communautes'],
  },
  {
    name: 'eStream',
    label: 'Media',
    description: 'Creation video, diffusion, camera pro et contenus sociaux.',
    href: '/dashboard/estream',
    icon: Video,
    color: '#0EA5E9',
    health: 84,
    users: '2.7k',
    submodules: ['Recorder', 'Flux video', 'Camera pro', 'Publication', 'Moderation'],
  },
  {
    name: 'Miyiki AI',
    label: 'AI',
    description: 'Assistant, recherche augmentee, rapports et automatisations.',
    href: '/dashboard/ai',
    icon: BrainCircuit,
    color: '#7C3AED',
    health: 92,
    users: '3.5k',
    submodules: ['Chat AI', 'Rapports', 'Recherche web', 'Analyse finance', 'Suggestions'],
  },
  {
    name: 'Business Pro',
    label: 'Comptes pro',
    description: 'Validation business, roles commerce, paiement et logistique.',
    href: '/admin/business-requests',
    icon: BriefcaseBusiness,
    color: '#111827',
    health: 88,
    users: '986',
    submodules: ['Demandes', 'Validation KYC', 'Roles entreprise', 'Notifications', 'Audit'],
  },
];

const accessPolicies = [
  { label: 'Super admin', value: 'Controle total', icon: ShieldCheck, color: 'text-primary' },
  { label: 'Operations', value: 'Modules + support', icon: SlidersHorizontal, color: 'text-primary' },
  { label: 'Finance', value: 'Wallet + conformité', icon: Landmark, color: 'text-[#FFA500]' },
  { label: 'Support', value: 'Lecture + assistance', icon: UserCog, color: 'text-violet-600' },
];

const accountTypes = [
  { label: 'Particuliers', count: '73%', icon: Users, progress: 73 },
  { label: 'Business', count: '14%', icon: Store, progress: 14 },
  { label: 'Agents relais', count: '8%', icon: PackageCheck, progress: 8 },
  { label: 'Institutionnels', count: '5%', icon: Banknote, progress: 5 },
];

function formatCount(value?: number) {
  if (!value && value !== 0) return '--';
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return `${value}`;
}

async function hashAccessCode(code: string) {
  const encoded = new TextEncoder().encode(code);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export default function AdminDashboardPage() {
  const [counts, setCounts] = useState({
    users: undefined as number | undefined,
    businessPending: undefined as number | undefined,
    businessApproved: undefined as number | undefined,
  });
  const [selectedPoint, setSelectedPoint] = useState(connectedCities[0]);
  const [mapZoom, setMapZoom] = useState(1);
  const [mapRotation, setMapRotation] = useState(0);
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });
  const [isMapInverted, setIsMapInverted] = useState(false);
  const [isSortedByActivity, setIsSortedByActivity] = useState(false);
  const [newAccessCode, setNewAccessCode] = useState('');
  const [showAccessCode, setShowAccessCode] = useState(false);
  const [accessVersion, setAccessVersion] = useState<string | null>(null);
  const [accessStatus, setAccessStatus] = useState<string | null>(null);
  const [isSavingAccessCode, setIsSavingAccessCode] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadCounts() {
      try {
        const [usersSnapshot, pendingSnapshot, approvedSnapshot] = await Promise.all([
          getCountFromServer(collection(db, 'users')),
          getCountFromServer(query(collection(db, 'business_requests'), where('status', '==', 'PENDING'))),
          getCountFromServer(query(collection(db, 'business_requests'), where('status', '==', 'APPROVED'))),
        ]);

        if (!mounted) return;
        setCounts({
          users: usersSnapshot.data().count,
          businessPending: pendingSnapshot.data().count,
          businessApproved: approvedSnapshot.data().count,
        });
      } catch (error) {
        console.warn('Admin counts unavailable:', error);
      }
    }

    loadCounts();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadAccessVersion() {
      try {
        const snapshot = await getDoc(ACCESS_CONFIG_REF);
        if (!mounted) return;
        setAccessVersion(snapshot.exists() ? (snapshot.data().version as string | undefined) || null : null);
      } catch (error) {
        console.warn('Access control config unavailable:', error);
      }
    }

    loadAccessVersion();

    return () => {
      mounted = false;
    };
  }, []);

  const visibleCities = useMemo(() => {
    return isSortedByActivity
      ? [...connectedCities].sort((a, b) => b.users - a.users)
      : connectedCities;
  }, [isSortedByActivity]);

  const handleSaveAccessCode = async () => {
    if (newAccessCode.trim().length < 6) {
      setAccessStatus('Le code doit contenir au moins 6 caracteres.');
      return;
    }

    setIsSavingAccessCode(true);
    setAccessStatus(null);

    try {
      const version = `${Date.now()}`;
      await setDoc(
        ACCESS_CONFIG_REF,
        {
          codeHash: await hashAccessCode(newAccessCode.trim()),
          version,
          updatedAt: serverTimestamp(),
          source: 'admin-dashboard',
        },
        { merge: true },
      );

      setAccessVersion(version);
      setNewAccessCode('');
      setAccessStatus('Code global mis a jour. Les sessions verifiees avec l’ancien code seront redemandees au prochain chargement.');
    } catch (error: any) {
      setAccessStatus(error?.message || 'Impossible de mettre a jour le code global.');
    } finally {
      setIsSavingAccessCode(false);
    }
  };

  const stats = useMemo<AdminStat[]>(
    () => [
      {
        label: 'Utilisateurs',
        value: formatCount(counts.users),
        trend: 'Base globale',
        icon: Users,
        tone: 'bg-primary/10 text-primary',
      },
      {
        label: 'Demandes business',
        value: formatCount(counts.businessPending),
        trend: 'En attente',
        icon: Clock3,
        tone: 'bg-[#FFA500]/100/10 text-[#FFA500]',
      },
      {
        label: 'Comptes actifs',
        value: formatCount(counts.businessApproved),
        trend: 'Business approuves',
        icon: BadgeCheck,
        tone: 'bg-primary/10 text-primary',
      },
      {
        label: 'Modules',
        value: `${modules.length}`,
        trend: 'Ecosysteme',
        icon: Layers3,
        tone: 'bg-violet-500/10 text-violet-700',
      },
    ],
    [counts],
  );

  return (
    <main className="min-h-screen bg-[#F7FAF8] text-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[8px] border border-primary/10 bg-slate-950 text-white shadow-sm">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(50,187,120,0.32),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(255,165,0,0.2),transparent_28%),linear-gradient(135deg,rgba(14,90,89,0.42),rgba(2,6,23,0.94))]" />
          <div className="relative grid gap-5 p-4 lg:grid-cols-[1fr_310px] lg:p-5">
            <div className="min-w-0">
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <Badge className="bg-[#0A8B46]/15 text-[#0A8B46] hover:bg-[#0A8B46]/15">
                    Centre de controle mondial
                  </Badge>
                  <h1 className="mt-3 font-headline text-2xl font-bold md:text-4xl">
                    Carte operationnelle eNkamba
                  </h1>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">
                    Vue etalee par continents, presence utilisateur instantanee, latence et module dominant par point.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-[8px] border border-white/10 bg-white/5 px-3 py-2">
                    <p className="text-lg font-bold text-[#0A8B46]">99.8%</p>
                    <p className="text-[11px] text-white/55">Uptime</p>
                  </div>
                  <div className="rounded-[8px] border border-white/10 bg-white/5 px-3 py-2">
                    <p className="text-lg font-bold text-[#FFA500]">42ms</p>
                    <p className="text-[11px] text-white/55">Latence</p>
                  </div>
                  <div className="rounded-[8px] border border-white/10 bg-white/5 px-3 py-2">
                    <p className="text-lg font-bold">{visibleCities.length}</p>
                    <p className="text-[11px] text-white/55">Points</p>
                  </div>
                </div>
              </div>

              <div className={cn('admin-world-shell', isMapInverted && 'admin-world-inverted')}>
                <div
                  className="admin-world-transform"
                  style={{
                    transform: `translate(${mapOffset.x}px, ${mapOffset.y}px) scale(${mapZoom}) rotate(${mapRotation}deg)`,
                  }}
                >
                  <svg className="admin-world-map" viewBox="0 0 1000 520" role="img" aria-label="Carte mondiale des utilisateurs connectes">
                    <path className="admin-continent" d="M166 138c36-34 98-42 140-18 31 17 46 48 73 66 28 18 63 20 81 46 20 29 3 72-33 82-26 7-54-7-79 4-31 14-37 59-68 76-26 14-60 3-78-20-19-25-16-58-32-85-17-29-55-43-63-76-7-27 17-54 59-75z" />
                    <path className="admin-continent" d="M320 326c34 6 66 25 82 55 17 33 10 73-8 106-12 22-32 44-58 42-32-3-40-38-51-64-12-31-43-47-53-78-12-37 26-68 88-61z" />
                    <path className="admin-continent" d="M474 120c42-20 95-19 135 2 26 14 44 37 73 45 31 9 66-1 96 13 38 17 55 63 45 103-10 39-43 65-80 74-35 9-72 2-105 17-33 16-52 53-87 65-34 12-73-4-91-35-18-30-15-69 1-100 18-35 51-59 65-96 12-31-6-58-52-88z" />
                    <path className="admin-continent" d="M535 288c50 4 102 28 127 72 26 45 19 105-9 148-20 31-54 54-91 45-36-9-49-48-62-80-15-38-50-64-55-105-5-45 36-83 90-80z" />
                    <path className="admin-continent" d="M656 118c56-30 139-24 188 17 45 38 58 103 37 158-18 47-60 76-108 86-49 10-99 1-148 11-34 7-67 22-101 14 19-33 54-52 67-91 13-40-5-83 9-123 9-28 28-52 56-72z" />
                    <path className="admin-continent" d="M780 367c38-16 92-7 121 24 25 27 27 70 4 98-24 30-72 34-107 18-31-15-58-47-50-83 5-25 15-44 32-57z" />
                    <path className="admin-continent muted" d="M330 94c18-16 48-20 72-9 20 9 30 28 24 48-8 26-42 39-68 30-28-9-47-44-28-69z" />
                    <path className="admin-route" d="M530 575 C500 360 490 320 480 170" />
                    <path className="admin-route" d="M530 575 C420 430 320 350 230 250" />
                    <path className="admin-route" d="M530 575 C650 430 740 315 805 210" />
                    <path className="admin-route" d="M530 575 C635 500 740 455 860 430" />
                  </svg>

                  {visibleCities.map((point, index) => (
                    <button
                      key={point.city}
                      type="button"
                      onClick={() => setSelectedPoint(point)}
                      className={cn(
                        'admin-map-point',
                        selectedPoint.city === point.city && 'admin-map-point-active',
                      )}
                      style={{ left: `${point.x}%`, top: `${point.y}%`, zIndex: 20 + index }}
                      aria-label={`${point.city}, ${point.users} utilisateurs actifs`}
                    >
                      <span className="admin-map-ping" />
                      <span className="admin-map-dot" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <aside className="grid gap-3">
              <div className="rounded-[8px] border border-white/10 bg-white/[0.07] p-4 backdrop-blur">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0A8B46]">Point selectionne</p>
                    <h2 className="mt-2 text-2xl font-bold">{selectedPoint.city}</h2>
                    <p className="text-sm text-white/60">{selectedPoint.country} - {selectedPoint.continent}</p>
                  </div>
                  <Badge className="bg-[#0A8B46] hover:bg-[#0A8B46]">{selectedPoint.status}</Badge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-[8px] bg-white/5 p-3">
                    <p className="text-xs text-white/50">Utilisateurs</p>
                    <p className="text-2xl font-bold">{selectedPoint.users}</p>
                  </div>
                  <div className="rounded-[8px] bg-white/5 p-3">
                    <p className="text-xs text-white/50">Latence</p>
                    <p className="text-2xl font-bold">{selectedPoint.latency}</p>
                  </div>
                  <div className="col-span-2 rounded-[8px] bg-white/5 p-3">
                    <p className="text-xs text-white/50">Module dominant</p>
                    <p className="mt-1 font-semibold">{selectedPoint.module}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[8px] border border-white/10 bg-white/[0.07] p-4 backdrop-blur">
                <p className="mb-3 text-sm font-semibold">Manipulation carte</p>
                <div className="grid grid-cols-4 gap-2">
                  <Button size="icon" variant="secondary" onClick={() => setMapZoom((value) => Math.min(1.8, Number((value + 0.1).toFixed(2))))}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="secondary" onClick={() => setMapZoom((value) => Math.max(0.75, Number((value - 0.1).toFixed(2))))}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="secondary" onClick={() => setMapRotation((value) => value - 8)}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="secondary" onClick={() => {
                    setMapZoom(1);
                    setMapRotation(0);
                    setMapOffset({ x: 0, y: 0 });
                  }}>
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="secondary" onClick={() => setMapOffset((value) => ({ ...value, y: value.y - 18 }))}>
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="secondary" onClick={() => setMapOffset((value) => ({ ...value, x: value.x - 18 }))}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="secondary" onClick={() => setMapOffset((value) => ({ ...value, x: value.x + 18 }))}>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="secondary" onClick={() => setMapOffset((value) => ({ ...value, y: value.y + 18 }))}>
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white" onClick={() => setIsSortedByActivity((value) => !value)}>
                    Trier
                  </Button>
                  <Button variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white" onClick={() => setIsMapInverted((value) => !value)}>
                    Inverser
                  </Button>
                </div>
                <p className="mt-3 text-xs text-white/45">
                  Zoom {Math.round(mapZoom * 100)}% - rotation {mapRotation}deg
                </p>
              </div>
            </aside>
          </div>
        </section>

        <header className="flex flex-col gap-4 rounded-[8px] border border-primary/10 bg-white px-4 py-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-[#0A8B46]">
              <ShieldCheck className="h-4 w-4" />
              Module Admin eNkamba
            </div>
            <h1 className="mt-1 font-headline text-2xl font-bold tracking-normal md:text-4xl">
              Centre de controle de l'ecosysteme
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 md:text-base">
              Supervision des utilisateurs, comptes, acces, modules et sous-modules operationnels.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline" className="gap-2">
              <Link href="/admin/generate-accounts">
                <Database className="h-4 w-4" />
                Numeros comptes
              </Link>
            </Button>
            <Button asChild className="gap-2 bg-[#0A8B46] hover:bg-[#0A8B46]">
              <Link href="/admin/business-requests">
                <FileCheck2 className="h-4 w-4" />
                Demandes business
              </Link>
            </Button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="rounded-[8px] border-primary/10 shadow-sm">
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <p className="text-sm text-slate-500">{stat.label}</p>
                    <p className="mt-2 text-3xl font-bold">{stat.value}</p>
                    <p className="mt-1 text-xs font-medium text-slate-500">{stat.trend}</p>
                  </div>
                  <div className={cn('flex h-12 w-12 items-center justify-center rounded-[8px]', stat.tone)}>
                    <Icon className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="rounded-[8px] border border-primary/10 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-headline text-xl font-bold">Centres de supervision</h2>
              <p className="mt-1 text-sm text-slate-500">
                Le dashboard garde l'essentiel. Les fonctions de surveillance avancee sont dans leurs pages dediees.
              </p>
            </div>
            <Badge className="w-fit bg-[#0A8B46] hover:bg-[#0A8B46]">Pages dediees</Badge>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {[
              { title: 'Infrastructure', text: 'Carte mondiale, serveurs modules, pare-feu, agents et points GPS.', href: '/admin/infrastructure', icon: Server, tone: 'bg-primary/5 text-primary' },
              { title: 'Logs erreurs', text: 'Erreur exacte, module, page, utilisateur, copie et partage.', href: '/admin/logs', icon: Bug, tone: 'bg-red-50 text-red-700' },
              { title: 'Cyber intelligence', text: 'Actions utilisateurs, temps passe, IP, localisation et pages.', href: '/admin/cyber', icon: Fingerprint, tone: 'bg-sky-50 text-sky-700' },
              { title: 'Attaques', text: 'Signaux suspects, faille probable, methode et contre-mesure.', href: '/admin/attacks', icon: ShieldAlert, tone: 'bg-[#FFA500]/10 text-[#FFA500]' },
              { title: 'Rapports', text: 'Exports CSV, rapport operationnel, audit et donnees de supervision.', href: '/admin/reports', icon: FileText, tone: 'bg-slate-100 text-slate-800' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className="group rounded-[8px] border border-slate-200 p-4 transition hover:border-[#0A8B46]/50 hover:shadow-md">
                  <div className={cn('flex h-11 w-11 items-center justify-center rounded-[8px]', item.tone)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-3 font-bold">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{item.text}</p>
                  <span className="mt-4 flex items-center gap-1 text-sm font-semibold text-[#0A8B46]">
                    Ouvrir
                    <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <div className="grid gap-4">
            <Card className="rounded-[8px] border-primary/10 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <KeyRound className="h-5 w-5 text-[#0A8B46]" />
                  Acces et roles
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                {accessPolicies.map((policy) => {
                  const Icon = policy.icon;
                  return (
                    <div key={policy.label} className="flex items-center justify-between rounded-[8px] border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center gap-3">
                        <Icon className={cn('h-5 w-5', policy.color)} />
                        <div>
                          <p className="font-semibold">{policy.label}</p>
                          <p className="text-xs text-slate-500">{policy.value}</p>
                        </div>
                      </div>
                      <Badge variant="outline">Actif</Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="rounded-[8px] border-primary/10 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-[#0A8B46]" />
                  Types de comptes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {accountTypes.map((account) => {
                  const Icon = account.icon;
                  return (
                    <div key={account.label}>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 font-medium">
                          <Icon className="h-4 w-4 text-slate-500" />
                          {account.label}
                        </span>
                        <span className="font-bold">{account.count}</span>
                      </div>
                      <Progress value={account.progress} className="h-2" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-[8px] border-primary/10 shadow-sm xl:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <LockKeyhole className="h-5 w-5 text-[#0A8B46]" />
                Mot de passe global d'acces
              </CardTitle>
              <p className="text-sm text-slate-500">
                Ce code est stocke dans Firestore et lu par toute l'application. Il n'est plus dependant d'un redeploiement Vercel.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-[8px] border border-primary/10 bg-primary/5 p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-primary">Version active</p>
                    <p className="mt-1 font-mono text-xs text-primary">{accessVersion || 'Fallback environnement'}</p>
                  </div>
                  <Badge className="w-fit bg-[#0A8B46] hover:bg-[#0A8B46]">Propagation globale</Badge>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <div className="relative">
                  <Input
                    type={showAccessCode ? 'text' : 'password'}
                    value={newAccessCode}
                    onChange={(event) => setNewAccessCode(event.target.value)}
                    placeholder="Nouveau code global d'acces"
                    className="pr-11"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                    onClick={() => setShowAccessCode((value) => !value)}
                    aria-label={showAccessCode ? 'Masquer le code' : 'Afficher le code'}
                  >
                    {showAccessCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button
                  className="gap-2 bg-[#0A8B46] hover:bg-[#0A8B46]"
                  onClick={handleSaveAccessCode}
                  disabled={isSavingAccessCode}
                >
                  <Save className="h-4 w-4" />
                  {isSavingAccessCode ? 'Enregistrement...' : 'Changer le code'}
                </Button>
              </div>

              {accessStatus && (
                <div className="rounded-[8px] border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  {accessStatus}
                </div>
              )}

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-[8px] border border-slate-200 p-3">
                  <p className="font-semibold">Lecture client</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Le verrou d'acces charge `app_config/access_control` au demarrage.</p>
                </div>
                <div className="rounded-[8px] border border-slate-200 p-3">
                  <p className="font-semibold">Hash SHA-256</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Le code en clair n'est pas sauvegarde dans Firestore.</p>
                </div>
                <div className="rounded-[8px] border border-slate-200 p-3">
                  <p className="font-semibold">Invalidation</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Chaque changement publie une nouvelle version de verification.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
          <div className="space-y-4">
            <div className="rounded-[8px] border border-primary/10 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-headline text-xl font-bold">Gestion utilisateurs</h2>
                  <p className="mt-1 text-sm text-slate-500">Recherche, statut KYC, compte et acces.</p>
                </div>
                <Button size="icon" variant="outline">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input className="pl-9" placeholder="Nom, email, telephone, numero compte..." />
              </div>

              <div className="mt-4 space-y-3">
                {[
                  { name: 'Utilisateur particulier', meta: 'KYC verifie - wallet actif', badge: 'Standard' },
                  { name: 'Compte marchand', meta: 'Business approuve - boutique active', badge: 'Business' },
                  { name: 'Agent relais', meta: 'Relais Ugavi + Mbongo', badge: 'Agent' },
                ].map((user) => (
                  <div key={user.name} className="flex items-center justify-between rounded-[8px] border border-slate-200 p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0A8B46]/10 text-[#0A8B46]">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.meta}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">{user.badge}</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[8px] border border-primary/10 bg-white p-4 shadow-sm">
              <h2 className="font-headline text-xl font-bold">Operations sensibles</h2>
              <div className="mt-4 grid gap-3">
                <Button asChild variant="outline" className="justify-between">
                  <Link href="/admin/generate-accounts">
                    Generer les numeros manquants
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="justify-between">
                  <Link href="/admin/business-requests">
                    Valider les comptes entreprise
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" className="justify-between" disabled>
                  Audit des permissions
                  <LockKeyhole className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-[8px] border border-primary/10 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-headline text-xl font-bold">Modules et sous-modules</h2>
                <p className="mt-1 text-sm text-slate-500">Vue de controle par domaine fonctionnel.</p>
              </div>
              <Badge className="w-fit bg-[#0A8B46] hover:bg-[#0A8B46]">
                Architecture unifiee
              </Badge>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {modules.map((module) => {
                const Icon = module.icon;
                return (
                  <Link
                    key={module.name}
                    href={module.href}
                    className="group rounded-[8px] border border-slate-200 p-4 transition hover:border-[#0A8B46]/50 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-11 w-11 items-center justify-center rounded-[8px] text-white"
                          style={{ backgroundColor: module.color }}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold">{module.name}</p>
                          <p className="text-xs text-slate-500">{module.label}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#0A8B46]" />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{module.description}</p>
                    <div className="mt-4 flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-500">{module.users} utilisateurs</span>
                      <span className="flex items-center gap-1 font-semibold text-primary">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {module.health}%
                      </span>
                    </div>
                    <Progress value={module.health} className="mt-2 h-2" />
                    <div className="mt-4 flex flex-wrap gap-2">
                      {module.submodules.slice(0, 4).map((submodule) => (
                        <Badge key={submodule} variant="outline" className="rounded-[6px] text-[11px]">
                          {submodule}
                        </Badge>
                      ))}
                      {module.submodules.length > 4 && (
                        <Badge variant="secondary" className="rounded-[6px] text-[11px]">
                          +{module.submodules.length - 4}
                        </Badge>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            { title: 'Sante systeme', text: 'Firebase, wallet, notifications et routes critiques sous observation.', icon: Activity },
            { title: 'Catalogue modules', text: 'Chaque module reste administrable avec ses sous-modules et statuts.', icon: Boxes },
            { title: 'Conformite', text: 'KYC, comptes business et acces sensibles regroupes dans le module admin.', icon: ShieldCheck },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-[8px] border border-primary/10 bg-white p-4 shadow-sm">
                <Icon className="h-5 w-5 text-[#0A8B46]" />
                <h3 className="mt-3 font-bold">{item.title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">{item.text}</p>
              </div>
            );
          })}
        </section>
      </div>

      <style jsx>{`
        .admin-world-shell {
          position: relative;
          min-height: 430px;
          overflow: hidden;
          border-radius: 8px;
          border: 1px solid rgba(126, 231, 175, 0.22);
          background:
            linear-gradient(rgba(255, 255, 255, 0.045) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.045) 1px, transparent 1px),
            radial-gradient(circle at 50% 50%, rgba(50, 187, 120, 0.16), rgba(15, 23, 42, 0.16) 50%, rgba(2, 6, 23, 0.5));
          background-size: 44px 44px, 44px 44px, cover;
        }

        .admin-world-shell::before {
          content: '';
          position: absolute;
          inset: 9% 6%;
          border-radius: 50%;
          border: 1px solid rgba(126, 231, 175, 0.12);
          box-shadow: 0 0 80px rgba(50, 187, 120, 0.12);
        }

        .admin-world-inverted {
          filter: hue-rotate(150deg) invert(0.88);
        }

        .admin-world-transform {
          position: absolute;
          inset: 0;
          transform-origin: center;
          transition: transform 220ms ease, filter 220ms ease;
        }

        .admin-world-map {
          position: absolute;
          inset: 0;
          height: 100%;
          width: 100%;
          padding: 22px;
        }

        .admin-continent {
          fill: rgba(50, 187, 120, 0.3);
          stroke: rgba(126, 231, 175, 0.75);
          stroke-width: 2;
          filter: drop-shadow(0 0 12px rgba(50, 187, 120, 0.24));
        }

        .admin-continent.muted {
          fill: rgba(255, 255, 255, 0.12);
          stroke: rgba(255, 255, 255, 0.32);
        }

        .admin-route {
          fill: none;
          stroke: rgba(255,165,0, 0.32);
          stroke-dasharray: 7 10;
          stroke-linecap: round;
          stroke-width: 2;
          animation: admin-route-flow 18s linear infinite;
        }

        .admin-map-point {
          position: absolute;
          height: 24px;
          width: 24px;
          transform: translate(-50%, -50%);
          cursor: pointer;
        }

        .admin-map-dot,
        .admin-map-ping {
          position: absolute;
          left: 50%;
          top: 50%;
          display: block;
          height: 11px;
          width: 11px;
          border-radius: 9999px;
          background: #0A8B46;
          transform: translate(-50%, -50%);
          box-shadow: 0 0 18px rgba(126, 231, 175, 0.95);
        }

        .admin-map-point-active .admin-map-dot {
          background: #FFA500;
          box-shadow: 0 0 24px rgba(255,165,0, 1);
        }

        .admin-map-ping {
          animation: admin-ping 1.9s cubic-bezier(0, 0, 0.2, 1) infinite;
          opacity: 0.7;
        }

        @keyframes admin-ping {
          75%,
          100% {
            transform: translate(-50%, -50%) scale(3.8);
            opacity: 0;
          }
        }

        @keyframes admin-route-flow {
          from {
            stroke-dashoffset: 0;
          }
          to {
            stroke-dashoffset: -180;
          }
        }
      `}</style>
    </main>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
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
  MessageCircle,
  PackageCheck,
  RadioTower,
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
  type LucideIcon,
} from 'lucide-react';
import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
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
import { GlobalSurveillanceMap } from '@/components/admin/global-surveillance-map';

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
  submodules: string[];
};

type AdminModuleActivity = {
  id: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  module?: string;
  active?: boolean;
  durationSeconds?: number;
  updatedAt?: any;
};

const ACCESS_CONFIG_REF = doc(db, 'app_config', 'access_control');

const modules: ModuleItem[] = [
  {
    name: 'Masolo',
    label: 'Chat',
    description: 'Messagerie, appels, groupes, stories et transferts contextuels.',
    href: '/dashboard/miyiki-chat',
    icon: MessageCircle,
    color: '#009058',
    submodules: ['Conversations', 'Groupes', 'Appels audio/video', 'Stories', 'Partage localisation'],
  },
  {
    name: 'Mbongo',
    label: 'Paiement',
    description: 'Wallet, QR, transferts, factures, epargne, credit et agents.',
    href: '/dashboard/mbongo-dashboard',
    icon: CircleDollarSign,
    color: '#009058',
    submodules: ['Portefeuille', 'Payer/recevoir', 'Historique', 'Epargne', 'Tontine', 'Factures'],
  },
  {
    name: 'Nkampa',
    label: 'E-commerce',
    description: 'Marketplace, boutiques, paniers, commandes et portail vendeurs.',
    href: '/dashboard/nkampa',
    icon: ShoppingBag,
    color: '#FFA500',
    submodules: ['Catalogue', 'Boutiques', 'Panier', 'Commandes', 'Seller portal', 'Roles business'],
  },
  {
    name: 'Ugavi',
    label: 'Logistique',
    description: 'Expedition, tracking colis, flotte, relais et paiements logistiques.',
    href: '/dashboard/ugavi',
    icon: Truck,
    color: '#009058',
    submodules: ['Tracking', 'Expeditions', 'Fleet', 'Agent relais', 'Scan colis', 'Livraisons'],
  },
  {
    name: 'Makutano',
    label: 'Connexion',
    description: 'Reseau social, evenements, communaute et relations utilisateurs.',
    href: '/dashboard/makutano',
    icon: RadioTower,
    color: '#9C27B0',
    submodules: ['Feed', 'Relations', 'Evenements', 'Invitations', 'Communautes'],
  },
  {
    name: 'eStream',
    label: 'Media',
    description: 'Creation video, diffusion, camera pro et contenus sociaux.',
    href: '/dashboard/estream',
    icon: Video,
    color: '#0EA5E9',
    submodules: ['Recorder', 'Flux video', 'Camera pro', 'Publication', 'Moderation'],
  },
  {
    name: 'Miyiki AI',
    label: 'AI',
    description: 'Assistant, recherche augmentee, rapports et automatisations.',
    href: '/dashboard/ai',
    icon: BrainCircuit,
    color: '#7C3AED',
    submodules: ['Chat AI', 'Rapports', 'Recherche web', 'Analyse finance', 'Suggestions'],
  },
  {
    name: 'Business Pro',
    label: 'Comptes pro',
    description: 'Validation business, roles commerce, paiement et logistique.',
    href: '/admin/business-requests',
    icon: BriefcaseBusiness,
    color: '#111827',
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

function normalizeModuleName(value?: string) {
  const text = String(value || '').toLowerCase();
  if (text.includes('masolo') || text.includes('chat') || text.includes('message')) return 'Masolo';
  if (text.includes('mbongo') || text.includes('wallet') || text.includes('paiement') || text.includes('pay')) return 'Mbongo';
  if (text.includes('nkampa') || text.includes('commerce') || text.includes('march')) return 'Nkampa';
  if (text.includes('ugavi') || text.includes('logistique') || text.includes('tracking')) return 'Ugavi';
  if (text.includes('makutano') || text.includes('connexion') || text.includes('social') || text.includes('reseau')) return 'Makutano';
  if (text.includes('estream') || text.includes('media') || text.includes('video')) return 'eStream';
  if (text.includes('miyiki') || text.includes('ai') || text.includes('assistant')) return 'Miyiki AI';
  if (text.includes('business')) return 'Business Pro';
  return value || 'Inconnu';
}

function formatDurationLabel(seconds: number) {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.round(minutes / 60)} h`;
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
  const [moduleActivities, setModuleActivities] = useState<AdminModuleActivity[]>([]);
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
    const activityQuery = query(collection(db, 'admin_user_activity'), orderBy('updatedAt', 'desc'), limit(1000));

    return onSnapshot(
      activityQuery,
      (snapshot) => {
        setModuleActivities(
          snapshot.docs.map((entry) => ({
            id: entry.id,
            ...(entry.data() as Omit<AdminModuleActivity, 'id'>),
          })),
        );
      },
      (error) => {
        console.warn('Admin module activity unavailable:', error);
      },
    );
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

  const moduleMetrics = useMemo(() => {
    const metrics = new Map<
      string,
      {
        uniqueUsers: Set<string>;
        activeSessions: number;
        visits: number;
        durationSeconds: number;
      }
    >();

    moduleActivities.forEach((activity) => {
      const moduleName = normalizeModuleName(activity.module);
      const metric =
        metrics.get(moduleName) ||
        {
          uniqueUsers: new Set<string>(),
          activeSessions: 0,
          visits: 0,
          durationSeconds: 0,
        };

      metric.visits += 1;
      if (activity.active) metric.activeSessions += 1;
      metric.durationSeconds += Number(activity.durationSeconds || 0);

      const userKey = activity.userId || activity.userEmail || activity.userName;
      if (userKey) metric.uniqueUsers.add(String(userKey));

      metrics.set(moduleName, metric);
    });

    return metrics;
  }, [moduleActivities]);

  const getModuleStats = (moduleName: string) => {
    const metric = moduleMetrics.get(moduleName);
    const users = metric?.uniqueUsers.size || 0;
    const activeSessions = metric?.activeSessions || 0;
    const visits = metric?.visits || 0;
    const durationSeconds = metric?.durationSeconds || 0;
    const health =
      visits === 0
        ? 0
        : Math.min(
            100,
            Math.round(
              45 +
                Math.min(users * 4, 30) +
                Math.min(activeSessions * 6, 18) +
                Math.min(durationSeconds / 900, 7),
            ),
          );

    return {
      users,
      activeSessions,
      visits,
      durationSeconds,
      health,
    };
  };

  return (
    <main className="min-h-screen bg-[#F7FAF8] text-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <GlobalSurveillanceMap />

        <header className="flex flex-col gap-4 rounded-[8px] border border-primary/10 bg-white px-4 py-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-[#009058]">
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
            <Button asChild className="gap-2 bg-[#009058] hover:bg-[#009058]">
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
            <Badge className="w-fit bg-[#009058] hover:bg-[#009058]">Pages dediees</Badge>
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
                <Link key={item.href} href={item.href} className="group rounded-[8px] border border-slate-200 p-4 transition hover:border-[#009058]/50 hover:shadow-md">
                  <div className={cn('flex h-11 w-11 items-center justify-center rounded-[8px]', item.tone)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-3 font-bold">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{item.text}</p>
                  <span className="mt-4 flex items-center gap-1 text-sm font-semibold text-[#009058]">
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
                  <KeyRound className="h-5 w-5 text-[#009058]" />
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
                  <Users className="h-5 w-5 text-[#009058]" />
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
                <LockKeyhole className="h-5 w-5 text-[#009058]" />
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
                  <Badge className="w-fit bg-[#009058] hover:bg-[#009058]">Propagation globale</Badge>
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
                  className="gap-2 bg-[#009058] hover:bg-[#009058]"
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
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#009058]/10 text-[#009058]">
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
              <Badge className="w-fit bg-[#009058] hover:bg-[#009058]">
                Donnees temps reel
              </Badge>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {modules.map((module) => {
                const Icon = module.icon;
                const moduleStats = getModuleStats(module.name);
                return (
                  <Link
                    key={module.name}
                    href={module.href}
                    className="group rounded-[8px] border border-slate-200 p-4 transition hover:border-[#009058]/50 hover:shadow-md"
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
                      <ChevronRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#009058]" />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{module.description}</p>
                    <div className="mt-4 flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-500">
                        {formatCount(moduleStats.users)} utilisateurs reels
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-primary">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {moduleStats.health}%
                      </span>
                    </div>
                    <Progress value={moduleStats.health} className="mt-2 h-2" />
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-slate-500">
                      <span>{formatCount(moduleStats.visits)} visites</span>
                      <span>{formatCount(moduleStats.activeSessions)} actifs</span>
                      <span>{formatDurationLabel(moduleStats.durationSeconds)} cumule</span>
                    </div>
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
                <Icon className="h-5 w-5 text-[#009058]" />
                <h3 className="mt-3 font-bold">{item.title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">{item.text}</p>
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}

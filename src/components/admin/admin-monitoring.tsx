'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, Bug, Copy, Cpu, Crosshair, Database, Fingerprint, Globe2, HardDrive, MapPin, Server, Share2, ShieldAlert, Timer, Wifi } from 'lucide-react';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { GlobalSurveillanceMap } from '@/components/admin/global-surveillance-map';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';

export type AdminErrorLog = {
  id: string;
  message?: string;
  stack?: string;
  module?: string;
  page?: string;
  path?: string;
  userId?: string;
  userEmail?: string;
  ip?: string;
  location?: string;
  severity?: string;
  createdAt?: any;
};

export type AdminUserActivity = {
  id: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  module?: string;
  path?: string;
  ip?: string;
  city?: string;
  country?: string;
  active?: boolean;
  durationSeconds?: number;
  updatedAt?: any;
};

export type AdminSecurityEvent = {
  id: string;
  type?: string;
  severity?: string;
  module?: string;
  path?: string;
  userId?: string;
  userEmail?: string;
  ip?: string;
  location?: string;
  recommendation?: string;
  createdAt?: any;
};

type ClientContext = {
  ip?: string;
  ipType?: string;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  userAgent?: string | null;
};

function formatIp(value?: string) {
  if (!value || value === 'unknown') return 'IP non disponible';
  return value;
}

function formatLocation(context?: ClientContext | null) {
  const location = [context?.city, context?.region, context?.country].filter(Boolean).join(', ');
  if (location) return location;
  return context?.ipType === 'local' ? 'Environnement local' : 'Localisation N/A';
}

export function formatAdminDate(value: any) {
  const date = value?.toDate?.() || (value ? new Date(value) : null);
  if (!date || Number.isNaN(date.getTime())) return 'Temps reel';
  return date.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function formatDuration(seconds?: number) {
  const safeSeconds = Math.max(0, Math.round(seconds || 0));
  if (safeSeconds < 60) return `${safeSeconds}s`;
  const minutes = Math.floor(safeSeconds / 60);
  const rest = safeSeconds % 60;
  if (minutes < 60) return `${minutes}m ${rest}s`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export function useAdminMonitoring() {
  const [errorLogs, setErrorLogs] = useState<AdminErrorLog[]>([]);
  const [userActivities, setUserActivities] = useState<AdminUserActivity[]>([]);
  const [securityEvents, setSecurityEvents] = useState<AdminSecurityEvent[]>([]);
  const [telemetryStatus, setTelemetryStatus] = useState<Record<string, string>>({});

  useEffect(() => {
    const watchers = [
      { key: 'errors', queryRef: query(collection(db, 'admin_error_logs'), orderBy('createdAt', 'desc'), limit(50)), onData: setErrorLogs },
      { key: 'activity', queryRef: query(collection(db, 'admin_user_activity'), orderBy('updatedAt', 'desc'), limit(80)), onData: setUserActivities },
      { key: 'security', queryRef: query(collection(db, 'admin_security_events'), orderBy('createdAt', 'desc'), limit(50)), onData: setSecurityEvents },
    ];

    const unsubscribers = watchers.map((watcher) =>
      onSnapshot(
        watcher.queryRef,
        (snapshot) => {
          watcher.onData(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })) as any);
          setTelemetryStatus((current) => ({ ...current, [watcher.key]: 'connecte' }));
        },
        (error) => {
          setTelemetryStatus((current) => ({ ...current, [watcher.key]: error.message || 'indisponible' }));
        },
      ),
    );

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, []);

  const activeUsers = useMemo(() => userActivities.filter((activity) => activity.active), [userActivities]);

  const topModules = useMemo(() => {
    const moduleMap = new Map<string, { visits: number; seconds: number }>();
    userActivities.forEach((activity) => {
      const key = activity.module || 'Inconnu';
      const current = moduleMap.get(key) || { visits: 0, seconds: 0 };
      moduleMap.set(key, { visits: current.visits + 1, seconds: current.seconds + (activity.durationSeconds || 0) });
    });
    return Array.from(moduleMap.entries())
      .map(([module, value]) => ({ module, ...value }))
      .sort((a, b) => b.seconds - a.seconds)
      .slice(0, 10);
  }, [userActivities]);

  const attacks = useMemo(() => {
    const fromSecurity = securityEvents.map((event) => ({
      id: event.id,
      title: event.type || 'Signal cyber',
      module: event.module || 'Inconnu',
      path: event.path || 'Route inconnue',
      actor: event.userEmail || event.userId || 'Utilisateur inconnu',
      ip: event.ip || 'unknown',
      when: formatAdminDate(event.createdAt),
      how: 'Signal detecte par la telemetry client / route',
      breach: event.type === 'Path traversal' ? 'Tentative de remontee de chemin dans l URL' : event.type === 'Injection URL' ? 'Caracteres suspects dans l URL' : 'Comportement ou route sensible',
      counter: event.recommendation || 'Verifier les droits, durcir les routes et bloquer le motif au niveau middleware/WAF.',
      severity: event.severity || 'medium',
    }));

    const criticalErrors = errorLogs
      .filter((entry) => entry.severity === 'critical' || /permission|auth|token|unauthorized|forbidden/i.test(entry.message || ''))
      .map((entry) => ({
        id: `error-${entry.id}`,
        title: 'Anomalie applicative critique',
        module: entry.module || 'Inconnu',
        path: entry.path || entry.page || 'Page inconnue',
        actor: entry.userEmail || entry.userId || 'Utilisateur inconnu',
        ip: entry.ip || 'unknown',
        when: formatAdminDate(entry.createdAt),
        how: 'Erreur critique remontee par le navigateur',
        breach: entry.message || 'Erreur sans detail',
        counter: 'Corriger la cause applicative, verifier les regles Firestore et masquer les details sensibles cote client.',
        severity: 'critical',
      }));

    return [...fromSecurity, ...criticalErrors];
  }, [errorLogs, securityEvents]);

  return { errorLogs, userActivities, securityEvents, telemetryStatus, activeUsers, topModules, attacks };
}

function useClientContext() {
  const [clientContext, setClientContext] = useState<ClientContext | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadContext() {
      try {
        const response = await fetch('/api/admin/client-context/', { cache: 'no-store' });
        const data = await response.json();
        if (!cancelled) setClientContext(data);
      } catch {
        if (!cancelled) setClientContext({ ip: 'unknown', ipType: 'unknown' });
      }
    }
    loadContext();
    return () => {
      cancelled = true;
    };
  }, []);

  return clientContext;
}

async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}

async function shareText(text: string, title: string) {
  if (navigator.share) {
    await navigator.share({ title, text });
  } else {
    await copyText(text);
  }
}

export function AdminPageHeader({ title, description }: { title: string; description: string }) {
  return (
    <header className="flex flex-col gap-3 rounded-[8px] border border-primary/10 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
      <div>
        <Button asChild variant="outline" size="sm" className="mb-3 w-fit">
          <Link href="/admin">Retour admin</Link>
        </Button>
        <h1 className="font-headline text-3xl font-black">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">{description}</p>
      </div>
      <Badge className="w-fit bg-[#32BB78] hover:bg-[#32BB78]">
        <Activity className="mr-1 h-3.5 w-3.5" />
        Temps reel
      </Badge>
    </header>
  );
}

export function AdminInfrastructureView() {
  const { errorLogs, activeUsers, telemetryStatus } = useAdminMonitoring();
  const clientContext = useClientContext();
  const criticalErrors = errorLogs.filter((entry) => entry.severity === 'critical').length;
  const health = Math.max(72, 100 - errorLogs.length * 2 - criticalErrors * 5);
  const memory = typeof window !== 'undefined' ? (performance as any)?.memory : null;
  const usedMemoryMb = memory?.usedJSHeapSize ? Math.round(memory.usedJSHeapSize / 1024 / 1024) : null;

  const cards = [
    { label: 'Etat systeme', value: `${health}%`, detail: criticalErrors ? `${criticalErrors} critique(s)` : 'Stable', icon: Server, tone: health > 90 ? 'text-primary bg-primary/5' : 'text-orange-700 bg-orange-50' },
    { label: 'Sessions live', value: `${activeUsers.length}`, detail: 'utilisateurs actifs', icon: Wifi, tone: 'text-primary bg-primary/5' },
    { label: 'Logs erreurs', value: `${errorLogs.length}`, detail: telemetryStatus.errors === 'connecte' ? 'flux connecte' : telemetryStatus.errors || 'en attente', icon: Bug, tone: 'text-red-700 bg-red-50' },
    { label: 'Memoire client', value: usedMemoryMb ? `${usedMemoryMb}MB` : 'N/A', detail: 'mesure navigateur', icon: Cpu, tone: 'text-violet-700 bg-violet-50' },
    { label: 'IP admin', value: formatIp(clientContext?.ip), detail: formatLocation(clientContext), icon: Globe2, tone: 'text-slate-700 bg-slate-100' },
  ];

  return (
    <div className="space-y-4">
      <GlobalSurveillanceMap />
      <section className="grid gap-3 md:grid-cols-5">
        {cards.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="rounded-[8px] border-primary/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-[8px]', item.tone)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-2xl font-black">{item.value}</p>
                </div>
                <p className="mt-3 text-sm font-bold">{item.label}</p>
                <p className="text-xs text-slate-500">{item.detail}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>
      <section className="grid gap-3 md:grid-cols-3">
        {[
          { label: 'Firebase', status: telemetryStatus.activity === 'connecte' ? 'Connecte' : 'En attente', icon: Database },
          { label: 'Navigateur', status: typeof navigator !== 'undefined' && navigator.onLine ? 'En ligne' : 'Hors ligne', icon: Globe2 },
          { label: 'Stockage', status: 'Firestore live', icon: HardDrive },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex items-center gap-3 rounded-[8px] border border-slate-200 bg-white p-4">
              <Icon className="h-5 w-5 text-[#32BB78]" />
              <div>
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="text-xs text-slate-500">{item.status}</p>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}

export function AdminLogsView() {
  const { errorLogs, telemetryStatus } = useAdminMonitoring();
  return (
    <section className="rounded-[8px] border border-primary/10 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-headline text-xl font-bold">Logs erreurs applicatives</h2>
        <Badge variant="outline">{telemetryStatus.errors === 'connecte' ? 'Flux connecte' : 'Flux en attente'}</Badge>
      </div>
      <div className="mt-4 space-y-3">
        {errorLogs.length === 0 ? (
          <div className="rounded-[8px] border border-dashed border-slate-300 p-4 text-sm text-slate-500">Aucun log erreur pour le moment.</div>
        ) : errorLogs.map((entry) => {
          const errorText = [`Module: ${entry.module || 'Inconnu'}`, `Page: ${entry.page || entry.path || 'Inconnue'}`, `Utilisateur: ${entry.userEmail || entry.userId || 'Inconnu'}`, `IP: ${entry.ip || 'unknown'}`, `Erreur: ${entry.message || 'Sans message'}`, entry.stack ? `Stack: ${entry.stack}` : ''].filter(Boolean).join('\n');
          return (
            <div key={entry.id} className="rounded-[8px] border border-red-100 bg-red-50/60 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 truncate text-sm font-bold text-red-950"><AlertTriangle className="h-4 w-4 text-red-600" />{entry.message || 'Erreur inconnue'}</p>
                  <p className="mt-1 text-xs text-red-800">{entry.module || 'Module inconnu'} - {entry.path || entry.page || 'Page inconnue'}</p>
                </div>
                <Badge variant="destructive">{entry.severity || 'error'}</Badge>
              </div>
              <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                <span>{entry.userEmail || entry.userId || 'Utilisateur inconnu'}</span>
                <span>{entry.ip || 'IP inconnue'} - {entry.location || 'Localisation N/A'}</span>
              </div>
              {entry.stack && <pre className="mt-3 max-h-36 overflow-auto rounded-[8px] bg-slate-950 p-2 text-[11px] leading-5 text-white/80">{entry.stack}</pre>}
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" className="h-8 gap-2" onClick={() => void copyText(errorText)}><Copy className="h-3.5 w-3.5" />Copier</Button>
                <Button size="sm" variant="outline" className="h-8 gap-2" onClick={() => void shareText(errorText, 'Log erreur eNkamba')}><Share2 className="h-3.5 w-3.5" />Partager</Button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function AdminCyberView() {
  const { userActivities, topModules } = useAdminMonitoring();
  const clientContext = useClientContext();
  return (
    <div className="space-y-4">
      <section className="rounded-[8px] border border-primary/10 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-headline text-xl font-bold"><Fingerprint className="h-5 w-5 text-[#32BB78]" />Cyber intelligence</h2>
            <p className="mt-1 text-sm text-slate-500">IP admin actuelle: <span className="font-mono font-semibold text-slate-900">{formatIp(clientContext?.ip)}</span> - {formatLocation(clientContext)}</p>
          </div>
          <Badge variant="outline">{clientContext?.ipType === 'local' ? 'IP locale' : 'IP reseau'}</Badge>
        </div>
        <div className="mt-4 space-y-3">
          {topModules.length === 0 ? <div className="rounded-[8px] border border-dashed border-slate-300 p-4 text-sm text-slate-500">Aucune activite encore remontee.</div> : topModules.map((item) => (
            <div key={item.module}>
              <div className="mb-2 flex items-center justify-between text-sm"><span className="font-semibold">{item.module}</span><span className="text-slate-500">{formatDuration(item.seconds)} - {item.visits} visite(s)</span></div>
              <Progress value={Math.min(100, Math.max(8, item.seconds / 9))} className="h-2" />
            </div>
          ))}
        </div>
      </section>
      <section className="grid gap-3">
        {userActivities.map((activity) => (
          <div key={activity.id} className="rounded-[8px] border border-slate-200 bg-white p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{activity.userName || activity.userEmail || activity.userId || 'Utilisateur inconnu'}</p>
                <p className="mt-1 truncate text-xs text-slate-500">{activity.module} - {activity.path}</p>
              </div>
              <Badge variant={activity.active ? 'default' : 'secondary'} className={activity.active ? 'bg-[#32BB78] hover:bg-[#32BB78]' : ''}>{activity.active ? 'Actif' : formatDuration(activity.durationSeconds)}</Badge>
            </div>
            <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-3">
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{[activity.city, activity.country].filter(Boolean).join(', ') || 'Localisation N/A'}</span>
              <span className="flex items-center gap-1"><Wifi className="h-3.5 w-3.5" /><span className="font-mono">{formatIp(activity.ip)}</span></span>
              <span className="flex items-center gap-1"><Timer className="h-3.5 w-3.5" />{formatAdminDate(activity.updatedAt)}</span>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

export function AdminAttacksView() {
  const { attacks, securityEvents } = useAdminMonitoring();
  return (
    <section className="rounded-[8px] border border-primary/10 bg-slate-950 p-4 text-white shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-headline text-xl font-bold">Centre autonome d'attaques</h2>
          <p className="mt-1 text-sm text-white/60">Detection, origine, methode, faille probable et contre-mesure.</p>
        </div>
        <ShieldAlert className="h-6 w-6 text-[#FFB45C]" />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-[8px] border border-white/10 bg-white/5 p-3"><p className="text-xs text-white/55">Signaux cyber</p><p className="mt-1 text-2xl font-bold">{securityEvents.length}</p></div>
        <div className="rounded-[8px] border border-white/10 bg-white/5 p-3"><p className="text-xs text-white/55">Attaques probables</p><p className="mt-1 text-2xl font-bold">{attacks.length}</p></div>
        <div className="rounded-[8px] border border-white/10 bg-white/5 p-3"><p className="text-xs text-white/55">Mode</p><p className="mt-1 text-2xl font-bold">Auto</p></div>
      </div>
      <div className="mt-4 space-y-3">
        {attacks.length === 0 ? <div className="rounded-[8px] border border-white/10 bg-white/5 p-4 text-sm text-white/60">Aucun signal d'attaque detecte.</div> : attacks.map((attack) => {
          const attackText = [`Attaque: ${attack.title}`, `Quand: ${attack.when}`, `Par: ${attack.actor}`, `IP: ${attack.ip}`, `Module: ${attack.module}`, `Page: ${attack.path}`, `Comment: ${attack.how}`, `Faille probable: ${attack.breach}`, `Contre-mesure: ${attack.counter}`].join('\n');
          return (
            <div key={attack.id} className="rounded-[8px] border border-white/10 bg-white/[0.07] p-3">
              <div className="flex items-start justify-between gap-3">
                <div><p className="flex items-center gap-2 font-bold"><Crosshair className="h-4 w-4 text-[#FFB45C]" />{attack.title}</p><p className="mt-1 text-xs text-white/55">{attack.when} - {attack.module}</p></div>
                <Badge className={attack.severity === 'critical' ? 'bg-red-600 hover:bg-red-600' : 'bg-orange-500 hover:bg-orange-500'}>{attack.severity}</Badge>
              </div>
              <div className="mt-3 grid gap-2 text-xs text-white/70 md:grid-cols-2">
                <p><span className="text-white/40">Par:</span> {attack.actor}</p><p><span className="text-white/40">IP:</span> {attack.ip}</p><p className="md:col-span-2"><span className="text-white/40">Page:</span> {attack.path}</p><p className="md:col-span-2"><span className="text-white/40">Faille:</span> {attack.breach}</p><p className="md:col-span-2"><span className="text-white/40">Contrer:</span> {attack.counter}</p>
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="secondary" className="h-8 gap-2" onClick={() => void copyText(attackText)}><Copy className="h-3.5 w-3.5" />Copier</Button>
                <Button size="sm" variant="secondary" className="h-8 gap-2" onClick={() => void shareText(attackText, 'Rapport cyber eNkamba')}><Share2 className="h-3.5 w-3.5" />Partager</Button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, Bug, Clock3, Copy, Cpu, Crosshair, Database, Download, FileText, Fingerprint, Globe2, HardDrive, MapPin, Search, Server, Share2, ShieldAlert, Timer, Users, Wifi } from 'lucide-react';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { GlobalSurveillanceMap } from '@/components/admin/global-surveillance-map';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { downloadCsv, downloadTextFile } from '@/lib/admin-export';

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

export type AdminAttack = {
  id: string;
  title: string;
  module: string;
  path: string;
  actor: string;
  ip: string;
  when: string;
  how: string;
  breach: string;
  counter: string;
  severity: string;
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

  const attacks = useMemo<AdminAttack[]>(() => {
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

function normalizeAdminSearch(value: string) {
  return value.trim().toLowerCase();
}

function matchesAdminSearch(search: string, values: Array<string | number | undefined | null>) {
  const queryText = normalizeAdminSearch(search);
  if (!queryText) return true;
  return values.some((value) => String(value || '').toLowerCase().includes(queryText));
}

function exportDateSuffix() {
  return new Date().toISOString().slice(0, 16).replaceAll('-', '').replaceAll(':', '').replace('T', '');
}

function mapErrorLogForExport(entry: AdminErrorLog) {
  return {
    id: entry.id,
    severity: entry.severity || 'error',
    module: entry.module || '',
    page: entry.page || entry.path || '',
    user: entry.userEmail || entry.userId || '',
    ip: entry.ip || '',
    location: entry.location || '',
    message: entry.message || '',
    stack: entry.stack || '',
    createdAt: entry.createdAt,
  };
}

function mapActivityForExport(activity: AdminUserActivity) {
  return {
    id: activity.id,
    active: activity.active ? 'yes' : 'no',
    user: activity.userEmail || activity.userName || activity.userId || '',
    module: activity.module || '',
    path: activity.path || '',
    ip: activity.ip || '',
    city: activity.city || '',
    country: activity.country || '',
    durationSeconds: activity.durationSeconds || 0,
    updatedAt: activity.updatedAt,
  };
}

function mapSecurityEventForExport(event: AdminSecurityEvent) {
  return {
    id: event.id,
    type: event.type || '',
    severity: event.severity || '',
    module: event.module || '',
    path: event.path || '',
    user: event.userEmail || event.userId || '',
    ip: event.ip || '',
    location: event.location || '',
    recommendation: event.recommendation || '',
    createdAt: event.createdAt,
  };
}

function mapAttackForExport(attack: AdminAttack) {
  return {
    id: attack.id,
    title: attack.title,
    severity: attack.severity,
    module: attack.module,
    path: attack.path,
    actor: attack.actor,
    ip: attack.ip,
    when: attack.when,
    how: attack.how,
    breach: attack.breach,
    counter: attack.counter,
  };
}

function buildAdminOperationalReport(params: {
  errorLogs: AdminErrorLog[];
  userActivities: AdminUserActivity[];
  securityEvents: AdminSecurityEvent[];
  attacks: AdminAttack[];
  topModules: Array<{ module: string; visits: number; seconds: number }>;
}) {
  const criticalErrors = params.errorLogs.filter((entry) => entry.severity === 'critical').length;
  const activeUsers = params.userActivities.filter((activity) => activity.active).length;
  const uniqueIps = new Set(params.userActivities.map((activity) => activity.ip).filter(Boolean)).size;

  const lines = [
    'RAPPORT OPERATIONNEL ADMIN ENKAMBA',
    `Genere le: ${new Date().toLocaleString('fr-FR')}`,
    '',
    'SYNTHESE',
    `Utilisateurs actifs: ${activeUsers}`,
    `Sessions analysees: ${params.userActivities.length}`,
    `IP observees: ${uniqueIps}`,
    `Logs erreurs: ${params.errorLogs.length}`,
    `Erreurs critiques: ${criticalErrors}`,
    `Signaux cyber: ${params.securityEvents.length}`,
    `Attaques probables: ${params.attacks.length}`,
    '',
    'MODULES LES PLUS UTILISES',
    ...(params.topModules.length
      ? params.topModules.map((item, index) => `${index + 1}. ${item.module} - ${item.visits} visite(s), ${formatDuration(item.seconds)}`)
      : ['Aucune activite module remontee.']),
    '',
    'DERNIERES ERREURS',
    ...(params.errorLogs.slice(0, 8).map((entry, index) => `${index + 1}. [${entry.severity || 'error'}] ${entry.module || 'Module inconnu'} - ${entry.message || 'Sans message'}`)),
    '',
    'SIGNAUX ET CONTRE-MESURES',
    ...(params.attacks.slice(0, 8).map((attack, index) => `${index + 1}. ${attack.title} | ${attack.module} | ${attack.counter}`)),
  ];

  return lines.join('\n');
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
      <Badge className="w-fit bg-[#25543A] hover:bg-[#25543A]">
        <Activity className="mr-1 h-3.5 w-3.5" />
        Temps reel
      </Badge>
    </header>
  );
}

export function AdminInfrastructureView() {
  const { errorLogs, userActivities, securityEvents, telemetryStatus, activeUsers, topModules, attacks } = useAdminMonitoring();
  const clientContext = useClientContext();
  const criticalErrors = errorLogs.filter((entry) => entry.severity === 'critical').length;
  const health = Math.max(72, 100 - errorLogs.length * 2 - criticalErrors * 5);
  const memory = typeof window !== 'undefined' ? (performance as any)?.memory : null;
  const usedMemoryMb = memory?.usedJSHeapSize ? Math.round(memory.usedJSHeapSize / 1024 / 1024) : null;
  const trackedModules = new Set(userActivities.map((activity) => activity.module).filter(Boolean)).size;

  const cards = [
    { label: 'Etat systeme', value: `${health}%`, detail: criticalErrors ? `${criticalErrors} critique(s)` : 'Stable', icon: Server, tone: health > 90 ? 'text-primary bg-primary/5' : 'text-orange-700 bg-orange-50' },
    { label: 'Sessions live', value: `${activeUsers.length}`, detail: 'utilisateurs actifs', icon: Wifi, tone: 'text-primary bg-primary/5' },
    { label: 'Logs erreurs', value: `${errorLogs.length}`, detail: telemetryStatus.errors === 'connecte' ? 'flux connecte' : telemetryStatus.errors || 'en attente', icon: Bug, tone: 'text-red-700 bg-red-50' },
    { label: 'Signaux cyber', value: `${securityEvents.length}`, detail: `${attacks.length} attaque(s) probable(s)`, icon: ShieldAlert, tone: 'text-orange-700 bg-orange-50' },
    { label: 'Modules suivis', value: `${trackedModules}`, detail: 'telemetrie utilisateurs', icon: Activity, tone: 'text-sky-700 bg-sky-50' },
    { label: 'Memoire client', value: usedMemoryMb ? `${usedMemoryMb}MB` : 'N/A', detail: 'mesure navigateur', icon: Cpu, tone: 'text-violet-700 bg-violet-50' },
    { label: 'IP admin', value: formatIp(clientContext?.ip), detail: formatLocation(clientContext), icon: Globe2, tone: 'text-slate-700 bg-slate-100' },
  ];

  return (
    <div className="space-y-4">
      <section className="flex flex-col gap-3 rounded-[8px] border border-primary/10 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-headline text-xl font-bold">Etat operationnel</h2>
          <p className="mt-1 text-sm text-slate-500">Synthese temps reel basee sur les logs, activites, signaux cyber et points infrastructure.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => downloadTextFile(
              `enkamba-admin-infrastructure-${exportDateSuffix()}.txt`,
              buildAdminOperationalReport({ errorLogs, userActivities, securityEvents, attacks, topModules }),
            )}
          >
            <FileText className="h-4 w-4" />
            Rapport
          </Button>
          <Button
            className="gap-2 bg-[#25543A] hover:bg-[#25543A]"
            onClick={() => downloadCsv(`enkamba-admin-activity-${exportDateSuffix()}.csv`, userActivities.map(mapActivityForExport))}
          >
            <Download className="h-4 w-4" />
            Export activite
          </Button>
        </div>
      </section>
      <GlobalSurveillanceMap />
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
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
              <Icon className="h-5 w-5 text-[#25543A]" />
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
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'error'>('all');
  const filteredLogs = useMemo(() => {
    return errorLogs.filter((entry) => {
      const matchesSeverity = severityFilter === 'all' || (entry.severity || 'error') === severityFilter;
      return matchesSeverity && matchesAdminSearch(search, [
        entry.message,
        entry.module,
        entry.page,
        entry.path,
        entry.userEmail,
        entry.userId,
        entry.ip,
        entry.location,
      ]);
    });
  }, [errorLogs, search, severityFilter]);
  const criticalCount = errorLogs.filter((entry) => entry.severity === 'critical').length;
  const moduleCount = new Set(errorLogs.map((entry) => entry.module).filter(Boolean)).size;

  return (
    <section className="rounded-[8px] border border-primary/10 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-headline text-xl font-bold">Logs erreurs applicatives</h2>
          <p className="mt-1 text-sm text-slate-500">Recherche par message, module, page, utilisateur, IP ou localisation.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{telemetryStatus.errors === 'connecte' ? 'Flux connecte' : 'Flux en attente'}</Badge>
          <Button
            size="sm"
            variant="outline"
            className="h-9 gap-2"
            onClick={() => downloadTextFile(
              `enkamba-admin-logs-${exportDateSuffix()}.txt`,
              filteredLogs.map((entry) => [`Module: ${entry.module || 'Inconnu'}`, `Page: ${entry.page || entry.path || 'Inconnue'}`, `Utilisateur: ${entry.userEmail || entry.userId || 'Inconnu'}`, `IP: ${entry.ip || 'unknown'}`, `Erreur: ${entry.message || 'Sans message'}`, entry.stack ? `Stack: ${entry.stack}` : ''].filter(Boolean).join('\n')).join('\n\n---\n\n'),
            )}
          >
            <FileText className="h-4 w-4" />
            Rapport
          </Button>
          <Button
            size="sm"
            className="h-9 gap-2 bg-[#25543A] hover:bg-[#25543A]"
            onClick={() => downloadCsv(`enkamba-admin-logs-${exportDateSuffix()}.csv`, filteredLogs.map(mapErrorLogForExport))}
          >
            <Download className="h-4 w-4" />
            CSV
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        {[
          { label: 'Total logs', value: errorLogs.length, tone: 'text-slate-900' },
          { label: 'Critiques', value: criticalCount, tone: criticalCount ? 'text-red-700' : 'text-primary' },
          { label: 'Modules touches', value: moduleCount, tone: 'text-slate-900' },
          { label: 'Resultats filtres', value: filteredLogs.length, tone: 'text-primary' },
        ].map((item) => (
          <div key={item.label} className="rounded-[8px] border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs text-slate-500">{item.label}</p>
            <p className={cn('mt-1 text-2xl font-black', item.tone)}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative lg:max-w-md lg:flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher erreur, page, utilisateur, IP..." className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'Tous' },
            { key: 'critical', label: 'Critiques' },
            { key: 'error', label: 'Erreurs' },
          ].map((item) => (
            <Button
              key={item.key}
              size="sm"
              variant={severityFilter === item.key ? 'default' : 'outline'}
              className={cn('h-9', severityFilter === item.key && 'bg-[#25543A] hover:bg-[#25543A]')}
              onClick={() => setSeverityFilter(item.key as typeof severityFilter)}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="rounded-[8px] border border-dashed border-slate-300 p-4 text-sm text-slate-500">Aucun log erreur pour le moment.</div>
        ) : filteredLogs.map((entry) => {
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
  const [search, setSearch] = useState('');
  const [activityFilter, setActivityFilter] = useState<'all' | 'active' | 'closed'>('all');
  const filteredActivities = useMemo(() => {
    return userActivities.filter((activity) => {
      const matchesStatus =
        activityFilter === 'all' ||
        (activityFilter === 'active' ? activity.active : !activity.active);
      return matchesStatus && matchesAdminSearch(search, [
        activity.userName,
        activity.userEmail,
        activity.userId,
        activity.module,
        activity.path,
        activity.ip,
        activity.city,
        activity.country,
      ]);
    });
  }, [activityFilter, search, userActivities]);
  const activeCount = userActivities.filter((activity) => activity.active).length;
  const uniqueIps = new Set(userActivities.map((activity) => activity.ip).filter(Boolean)).size;
  const averageDuration = userActivities.length
    ? Math.round(userActivities.reduce((sum, activity) => sum + (activity.durationSeconds || 0), 0) / userActivities.length)
    : 0;

  return (
    <div className="space-y-4">
      <section className="rounded-[8px] border border-primary/10 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-headline text-xl font-bold"><Fingerprint className="h-5 w-5 text-[#25543A]" />Cyber intelligence</h2>
            <p className="mt-1 text-sm text-slate-500">IP admin actuelle: <span className="font-mono font-semibold text-slate-900">{formatIp(clientContext?.ip)}</span> - {formatLocation(clientContext)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{clientContext?.ipType === 'local' ? 'IP locale' : 'IP reseau'}</Badge>
            <Button
              size="sm"
              className="h-9 gap-2 bg-[#25543A] hover:bg-[#25543A]"
              onClick={() => downloadCsv(`enkamba-admin-cyber-activity-${exportDateSuffix()}.csv`, filteredActivities.map(mapActivityForExport))}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {[
            { label: 'Sessions suivies', value: userActivities.length, icon: Users },
            { label: 'Actifs maintenant', value: activeCount, icon: Wifi },
            { label: 'IP observees', value: uniqueIps, icon: Globe2 },
            { label: 'Duree moyenne', value: formatDuration(averageDuration), icon: Clock3 },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-[8px] border border-slate-200 bg-slate-50 p-3">
                <Icon className="h-4 w-4 text-[#25543A]" />
                <p className="mt-2 text-2xl font-black">{item.value}</p>
                <p className="text-xs text-slate-500">{item.label}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative lg:max-w-md lg:flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher utilisateur, module, page, IP..." className="pl-9" />
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'Toutes' },
              { key: 'active', label: 'Actives' },
              { key: 'closed', label: 'Terminees' },
            ].map((item) => (
              <Button
                key={item.key}
                size="sm"
                variant={activityFilter === item.key ? 'default' : 'outline'}
                className={cn('h-9', activityFilter === item.key && 'bg-[#25543A] hover:bg-[#25543A]')}
                onClick={() => setActivityFilter(item.key as typeof activityFilter)}
              >
                {item.label}
              </Button>
            ))}
          </div>
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
        {filteredActivities.length === 0 ? (
          <div className="rounded-[8px] border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">Aucune session ne correspond au filtre.</div>
        ) : filteredActivities.map((activity) => (
          <div key={activity.id} className="rounded-[8px] border border-slate-200 bg-white p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{activity.userName || activity.userEmail || activity.userId || 'Utilisateur inconnu'}</p>
                <p className="mt-1 truncate text-xs text-slate-500">{activity.module} - {activity.path}</p>
              </div>
              <Badge variant={activity.active ? 'default' : 'secondary'} className={activity.active ? 'bg-[#25543A] hover:bg-[#25543A]' : ''}>{activity.active ? 'Actif' : formatDuration(activity.durationSeconds)}</Badge>
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
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'high' | 'medium'>('all');
  const filteredAttacks = useMemo(() => {
    return attacks.filter((attack) => {
      const matchesSeverity = severityFilter === 'all' || attack.severity === severityFilter;
      return matchesSeverity && matchesAdminSearch(search, [
        attack.title,
        attack.module,
        attack.path,
        attack.actor,
        attack.ip,
        attack.breach,
        attack.counter,
      ]);
    });
  }, [attacks, search, severityFilter]);

  return (
    <section className="rounded-[8px] border border-primary/10 bg-slate-950 p-4 text-white shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="font-headline text-xl font-bold">Centre autonome d'attaques</h2>
          <p className="mt-1 text-sm text-white/60">Detection, origine, methode, faille probable et contre-mesure.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="h-9 gap-2"
            onClick={() => downloadTextFile(
              `enkamba-admin-attacks-${exportDateSuffix()}.txt`,
              filteredAttacks.map((attack) => [`Attaque: ${attack.title}`, `Quand: ${attack.when}`, `Par: ${attack.actor}`, `IP: ${attack.ip}`, `Module: ${attack.module}`, `Page: ${attack.path}`, `Comment: ${attack.how}`, `Faille probable: ${attack.breach}`, `Contre-mesure: ${attack.counter}`].join('\n')).join('\n\n---\n\n'),
            )}
          >
            <FileText className="h-4 w-4" />
            Rapport
          </Button>
          <Button
            size="sm"
            className="h-9 gap-2 bg-[#25543A] hover:bg-[#25543A]"
            onClick={() => downloadCsv(`enkamba-admin-attacks-${exportDateSuffix()}.csv`, filteredAttacks.map(mapAttackForExport))}
          >
            <Download className="h-4 w-4" />
            CSV
          </Button>
          <ShieldAlert className="h-9 w-9 rounded-[8px] bg-white/10 p-2 text-[#FFB45C]" />
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-[8px] border border-white/10 bg-white/5 p-3"><p className="text-xs text-white/55">Signaux cyber</p><p className="mt-1 text-2xl font-bold">{securityEvents.length}</p></div>
        <div className="rounded-[8px] border border-white/10 bg-white/5 p-3"><p className="text-xs text-white/55">Attaques probables</p><p className="mt-1 text-2xl font-bold">{attacks.length}</p></div>
        <div className="rounded-[8px] border border-white/10 bg-white/5 p-3"><p className="text-xs text-white/55">Resultats filtres</p><p className="mt-1 text-2xl font-bold">{filteredAttacks.length}</p></div>
      </div>
      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative lg:max-w-md lg:flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher attaque, module, IP, faille..." className="border-white/10 bg-white/10 pl-9 text-white placeholder:text-white/40" />
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'Toutes' },
            { key: 'critical', label: 'Critiques' },
            { key: 'high', label: 'Hautes' },
            { key: 'medium', label: 'Moyennes' },
          ].map((item) => (
            <Button
              key={item.key}
              size="sm"
              variant={severityFilter === item.key ? 'secondary' : 'outline'}
              className={cn('h-9', severityFilter !== item.key && 'border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white')}
              onClick={() => setSeverityFilter(item.key as typeof severityFilter)}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {filteredAttacks.length === 0 ? <div className="rounded-[8px] border border-white/10 bg-white/5 p-4 text-sm text-white/60">Aucun signal d'attaque detecte.</div> : filteredAttacks.map((attack) => {
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

export function AdminReportsView() {
  const { errorLogs, userActivities, securityEvents, activeUsers, topModules, attacks, telemetryStatus } = useAdminMonitoring();
  const criticalErrors = errorLogs.filter((entry) => entry.severity === 'critical').length;
  const uniqueIps = new Set(userActivities.map((activity) => activity.ip).filter(Boolean)).size;
  const health = Math.max(70, 100 - errorLogs.length * 2 - criticalErrors * 6 - attacks.length * 3);
  const operationalReport = buildAdminOperationalReport({ errorLogs, userActivities, securityEvents, attacks, topModules });

  const exportActions = [
    {
      label: 'Rapport complet',
      detail: 'Synthese operationnelle au format texte',
      icon: FileText,
      action: () => downloadTextFile(`enkamba-admin-report-${exportDateSuffix()}.txt`, operationalReport),
    },
    {
      label: 'Logs erreurs',
      detail: 'CSV erreurs, stacks, pages et utilisateurs',
      icon: Bug,
      action: () => downloadCsv(`enkamba-admin-logs-${exportDateSuffix()}.csv`, errorLogs.map(mapErrorLogForExport)),
    },
    {
      label: 'Activite utilisateurs',
      detail: 'CSV sessions, durees, IP et modules',
      icon: Users,
      action: () => downloadCsv(`enkamba-admin-activity-${exportDateSuffix()}.csv`, userActivities.map(mapActivityForExport)),
    },
    {
      label: 'Cyber events',
      detail: 'CSV signaux, routes et recommandations',
      icon: Fingerprint,
      action: () => downloadCsv(`enkamba-admin-security-${exportDateSuffix()}.csv`, securityEvents.map(mapSecurityEventForExport)),
    },
    {
      label: 'Attaques',
      detail: 'CSV attaques probables et contre-mesures',
      icon: ShieldAlert,
      action: () => downloadCsv(`enkamba-admin-attacks-${exportDateSuffix()}.csv`, attacks.map(mapAttackForExport)),
    },
  ];

  return (
    <div className="space-y-4">
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {[
          { label: 'Sante operationnelle', value: `${health}%`, detail: telemetryStatus.activity === 'connecte' ? 'Flux connectes' : 'Flux en observation', icon: Activity, tone: health > 88 ? 'text-primary bg-primary/5' : 'text-orange-700 bg-orange-50' },
          { label: 'Utilisateurs actifs', value: activeUsers.length, detail: `${userActivities.length} session(s) analysees`, icon: Users, tone: 'text-primary bg-primary/5' },
          { label: 'Erreurs critiques', value: criticalErrors, detail: `${errorLogs.length} log(s) total`, icon: Bug, tone: criticalErrors ? 'text-red-700 bg-red-50' : 'text-primary bg-primary/5' },
          { label: 'Signaux cyber', value: securityEvents.length, detail: `${attacks.length} attaque(s) probable(s)`, icon: Fingerprint, tone: 'text-orange-700 bg-orange-50' },
          { label: 'IP observees', value: uniqueIps, detail: 'sources actives ou recentes', icon: Globe2, tone: 'text-sky-700 bg-sky-50' },
        ].map((item) => {
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

      <section className="rounded-[8px] border border-primary/10 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-headline text-xl font-bold">Exports operationnels</h2>
            <p className="mt-1 text-sm text-slate-500">Telechargement direct des rapports admin pour audit, support, supervision et client.</p>
          </div>
          <Badge className="w-fit bg-[#25543A] hover:bg-[#25543A]">Export local</Badge>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {exportActions.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                onClick={item.action}
                className="rounded-[8px] border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-[#25543A]/50 hover:bg-[#25543A]/5"
              >
                <Icon className="h-5 w-5 text-[#25543A]" />
                <p className="mt-3 font-bold">{item.label}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{item.detail}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#25543A]">
                  <Download className="h-3.5 w-3.5" />
                  Telecharger
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[8px] border border-primary/10 bg-white p-4 shadow-sm">
          <h2 className="font-headline text-xl font-bold">Modules les plus utilises</h2>
          <div className="mt-4 space-y-3">
            {topModules.length === 0 ? (
              <div className="rounded-[8px] border border-dashed border-slate-300 p-4 text-sm text-slate-500">Aucune activite module disponible.</div>
            ) : topModules.map((item) => (
              <div key={item.module}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-semibold">{item.module}</span>
                  <span className="text-slate-500">{formatDuration(item.seconds)} - {item.visits} visite(s)</span>
                </div>
                <Progress value={Math.min(100, Math.max(8, item.seconds / 9))} className="h-2" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[8px] border border-primary/10 bg-white p-4 shadow-sm">
          <h2 className="font-headline text-xl font-bold">Apercu rapport</h2>
          <pre className="mt-4 max-h-[360px] overflow-auto rounded-[8px] bg-slate-950 p-4 text-xs leading-6 text-white/80">{operationalReport}</pre>
        </div>
      </section>
    </div>
  );
}

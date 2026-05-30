'use client';

import { useMemo, useState } from 'react';
import {
  Activity,
  Database,
  Globe2,
  LockKeyhole,
  RadioTower,
  Server,
  ShieldCheck,
  UserCog,
  Wifi,
  type LucideIcon,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

type SurveillancePoint = {
  city: string;
  country: string;
  continent: string;
  module: string;
  users: number;
  latency: string;
  status: string;
  x: number;
  y: number;
};

type InfrastructureNode = {
  id: string;
  label: string;
  category: 'server' | 'firewall' | 'agent' | 'database' | 'security';
  module: string;
  region: string;
  status: string;
  load: number;
  description: string;
  icon: LucideIcon;
};

const surveillancePoints: SurveillancePoint[] = [
  { city: 'Kinshasa', country: 'RDC', continent: 'Afrique', module: 'Mbongo', users: 1284, latency: '38ms', status: 'Actif', x: 53, y: 57 },
  { city: 'Lubumbashi', country: 'RDC', continent: 'Afrique', module: 'Ugavi', users: 426, latency: '44ms', status: 'Actif', x: 55, y: 70 },
  { city: 'Goma', country: 'RDC', continent: 'Afrique', module: 'Masolo', users: 312, latency: '41ms', status: 'Actif', x: 57, y: 53 },
  { city: 'Paris', country: 'France', continent: 'Europe', module: 'Makutano', users: 217, latency: '52ms', status: 'Actif', x: 48, y: 32 },
  { city: 'Bruxelles', country: 'Belgique', continent: 'Europe', module: 'Business Pro', users: 144, latency: '56ms', status: 'Controle', x: 49, y: 29 },
  { city: 'Johannesburg', country: 'Afrique du Sud', continent: 'Afrique', module: 'Nkampa', users: 96, latency: '61ms', status: 'Actif', x: 56, y: 82 },
  { city: 'Dubai', country: 'EAU', continent: 'Asie', module: 'Paiement', users: 88, latency: '64ms', status: 'Actif', x: 63, y: 43 },
  { city: 'Montreal', country: 'Canada', continent: 'Amerique du Nord', module: 'Masolo', users: 64, latency: '71ms', status: 'Actif', x: 23, y: 27 },
  { city: 'New York', country: 'USA', continent: 'Amerique du Nord', module: 'AI', users: 52, latency: '69ms', status: 'Actif', x: 26, y: 36 },
  { city: 'Sao Paulo', country: 'Bresil', continent: 'Amerique du Sud', module: 'Makutano', users: 39, latency: '82ms', status: 'Actif', x: 35, y: 76 },
  { city: 'Guangzhou', country: 'Chine', continent: 'Asie', module: 'Nkampa', users: 33, latency: '93ms', status: 'Actif', x: 78, y: 47 },
  { city: 'Sydney', country: 'Australie', continent: 'Oceanie', module: 'eStream', users: 21, latency: '104ms', status: 'Actif', x: 86, y: 80 },
];

const infrastructureNodes: InfrastructureNode[] = [
  { id: 'srv-masolo-01', label: 'MASOLO-CHAT-RT-01', category: 'server', module: 'Masolo', region: 'Kinshasa Edge', status: 'Stable', load: 42, description: 'Conversations, appels, presence et notifications temps reel.', icon: Server },
  { id: 'srv-mbongo-01', label: 'MBONGO-PAY-CORE-01', category: 'server', module: 'Mbongo', region: 'Finance Core', status: 'Surveille', load: 58, description: 'Paiements, wallet, QR, transferts et reconciliation.', icon: Server },
  { id: 'srv-nkampa-01', label: 'NKAMPA-CATALOG-01', category: 'server', module: 'Nkampa', region: 'Commerce Cluster', status: 'Stable', load: 49, description: 'Catalogue, recherche produit, commandes et boutiques.', icon: Server },
  { id: 'srv-ugavi-01', label: 'UGAVI-TRACKING-01', category: 'server', module: 'Ugavi', region: 'Logistics Core', status: 'Stable', load: 53, description: 'Tracking colis, agences, relais, scans et livraisons.', icon: Server },
  { id: 'srv-makutano-01', label: 'MAKUTANO-FEED-01', category: 'server', module: 'Makutano', region: 'Social Graph', status: 'Actif', load: 46, description: 'Feed social, profils publics, relations et stories.', icon: Server },
  { id: 'fw-edge-01', label: 'FIREWALL-EDGE-01', category: 'firewall', module: 'Global', region: 'Perimetre web', status: 'Protection active', load: 31, description: 'Filtrage routes sensibles, motifs URL suspects et acces anormaux.', icon: LockKeyhole },
  { id: 'fw-payment-01', label: 'FIREWALL-PAYMENT-01', category: 'firewall', module: 'Mbongo', region: 'Finance Zone', status: 'Protection haute', load: 38, description: 'Surveillance transactions, QR paiement et comportements sensibles.', icon: LockKeyhole },
  { id: 'db-firestore-01', label: 'DATASTORE-FIRESTORE-01', category: 'database', module: 'Global', region: 'Realtime Data', status: 'Synchronise', load: 44, description: 'Donnees temps reel, logs admin, activite et modules.', icon: Database },
  { id: 'agent-ops-01', label: 'OPS-AGENTS-LIVE', category: 'agent', module: 'Support', region: 'Centre operationnel', status: 'Connectes', load: 67, description: 'Agents admin, support, logistique et verification business.', icon: UserCog },
  { id: 'sec-cyber-01', label: 'CYBER-WATCH-AI-01', category: 'security', module: 'Admin', region: 'Security Desk', status: 'Analyse', load: 36, description: 'Classification signaux, erreurs critiques et attaques probables.', icon: ShieldCheck },
];

const categoryStyles: Record<InfrastructureNode['category'], string> = {
  server: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  firewall: 'border-orange-200 bg-orange-50 text-orange-800',
  agent: 'border-sky-200 bg-sky-50 text-sky-800',
  database: 'border-violet-200 bg-violet-50 text-violet-800',
  security: 'border-red-200 bg-red-50 text-red-800',
};

export function GlobalSurveillanceMap() {
  const [selectedPoint, setSelectedPoint] = useState(surveillancePoints[0]);
  const [selectedNode, setSelectedNode] = useState(infrastructureNodes[0]);
  const [selectedCategory, setSelectedCategory] = useState<InfrastructureNode['category'] | 'all'>('all');

  const filteredNodes = useMemo(
    () => selectedCategory === 'all' ? infrastructureNodes : infrastructureNodes.filter((node) => node.category === selectedCategory),
    [selectedCategory],
  );

  const totalUsers = surveillancePoints.reduce((sum, point) => sum + point.users, 0);
  const activeServers = infrastructureNodes.filter((node) => node.category === 'server').length;
  const activeSecurity = infrastructureNodes.filter((node) => node.category === 'firewall' || node.category === 'security').length;

  return (
    <section className="overflow-hidden rounded-[8px] border border-emerald-900/10 bg-slate-950 text-white shadow-sm">
      <div className="grid gap-0 xl:grid-cols-[1.12fr_0.88fr]">
        <div className="relative min-h-[420px] overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_50%_40%,rgba(50,187,120,0.18),rgba(2,6,23,0.25)_48%,rgba(2,6,23,0.96))] xl:border-b-0 xl:border-r">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:42px_42px]" />
          <div className="absolute left-4 top-4 z-20 flex flex-wrap items-center gap-2">
            <Badge className="bg-[#32BB78] hover:bg-[#32BB78]">
              <Globe2 className="mr-1 h-3.5 w-3.5" />
              Surveillance mondiale
            </Badge>
            <Badge className="bg-white/10 text-white hover:bg-white/10">{totalUsers.toLocaleString('fr-FR')} utilisateurs GPS</Badge>
          </div>

          <svg className="absolute inset-0 h-full w-full p-5" viewBox="0 0 1000 520" role="img" aria-label="Carte mondiale de surveillance eNkamba">
            <path className="fill-[#32BB78]/25 stroke-[#7EE7AF]/80 stroke-2" d="M166 138c36-34 98-42 140-18 31 17 46 48 73 66 28 18 63 20 81 46 20 29 3 72-33 82-26 7-54-7-79 4-31 14-37 59-68 76-26 14-60 3-78-20-19-25-16-58-32-85-17-29-55-43-63-76-7-27 17-54 59-75z" />
            <path className="fill-[#32BB78]/25 stroke-[#7EE7AF]/80 stroke-2" d="M320 326c34 6 66 25 82 55 17 33 10 73-8 106-12 22-32 44-58 42-32-3-40-38-51-64-12-31-43-47-53-78-12-37 26-68 88-61z" />
            <path className="fill-[#32BB78]/25 stroke-[#7EE7AF]/80 stroke-2" d="M474 120c42-20 95-19 135 2 26 14 44 37 73 45 31 9 66-1 96 13 38 17 55 63 45 103-10 39-43 65-80 74-35 9-72 2-105 17-33 16-52 53-87 65-34 12-73-4-91-35-18-30-15-69 1-100 18-35 51-59 65-96 12-31-6-58-52-88z" />
            <path className="fill-[#32BB78]/25 stroke-[#7EE7AF]/80 stroke-2" d="M535 288c50 4 102 28 127 72 26 45 19 105-9 148-20 31-54 54-91 45-36-9-49-48-62-80-15-38-50-64-55-105-5-45 36-83 90-80z" />
            <path className="fill-[#32BB78]/25 stroke-[#7EE7AF]/80 stroke-2" d="M656 118c56-30 139-24 188 17 45 38 58 103 37 158-18 47-60 76-108 86-49 10-99 1-148 11-34 7-67 22-101 14 19-33 54-52 67-91 13-40-5-83 9-123 9-28 28-52 56-72z" />
            <path className="fill-[#32BB78]/25 stroke-[#7EE7AF]/80 stroke-2" d="M780 367c38-16 92-7 121 24 25 27 27 70 4 98-24 30-72 34-107 18-31-15-58-47-50-83 5-25 15-44 32-57z" />
            <path className="fill-white/10 stroke-white/30 stroke-2" d="M330 94c18-16 48-20 72-9 20 9 30 28 24 48-8 26-42 39-68 30-28-9-47-44-28-69z" />
            <path className="fill-none stroke-[#FF8C00]/35 stroke-2 [stroke-dasharray:8_10]" d="M530 575 C500 360 490 320 480 170" />
            <path className="fill-none stroke-[#FF8C00]/35 stroke-2 [stroke-dasharray:8_10]" d="M530 575 C420 430 320 350 230 250" />
            <path className="fill-none stroke-[#FF8C00]/35 stroke-2 [stroke-dasharray:8_10]" d="M530 575 C650 430 740 315 805 210" />
          </svg>

          {surveillancePoints.map((point) => (
            <button
              key={`${point.city}-${point.module}`}
              type="button"
              onClick={() => setSelectedPoint(point)}
              className="absolute z-20 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
              aria-label={`Point GPS ${point.city}`}
            >
              <span className={cn('absolute inset-0 rounded-full bg-[#7EE7AF]/40 animate-ping', selectedPoint.city === point.city && 'bg-[#FFB45C]/45')} />
              <span className={cn('absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7EE7AF] shadow-[0_0_18px_rgba(126,231,175,0.95)]', selectedPoint.city === point.city && 'bg-[#FFB45C] shadow-[0_0_22px_rgba(255,180,92,0.95)]')} />
            </button>
          ))}

          <div className="absolute bottom-4 left-4 right-4 z-20 grid gap-3 rounded-[8px] border border-white/10 bg-slate-950/80 p-4 backdrop-blur md:grid-cols-4">
            <div className="md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7EE7AF]">Point selectionne</p>
              <h3 className="mt-1 text-2xl font-black">{selectedPoint.city}</h3>
              <p className="text-sm text-white/60">{selectedPoint.country} - {selectedPoint.continent}</p>
            </div>
            <div>
              <p className="text-xs text-white/45">Module</p>
              <p className="font-bold">{selectedPoint.module}</p>
            </div>
            <div>
              <p className="text-xs text-white/45">Utilisateurs / latence</p>
              <p className="font-bold">{selectedPoint.users} - {selectedPoint.latency}</p>
            </div>
          </div>
        </div>

        <aside className="p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[8px] border border-white/10 bg-white/[0.06] p-3">
              <Server className="h-5 w-5 text-[#7EE7AF]" />
              <p className="mt-2 text-2xl font-black">{activeServers}</p>
              <p className="text-xs text-white/50">serveurs modules</p>
            </div>
            <div className="rounded-[8px] border border-white/10 bg-white/[0.06] p-3">
              <LockKeyhole className="h-5 w-5 text-[#FFB45C]" />
              <p className="mt-2 text-2xl font-black">{activeSecurity}</p>
              <p className="text-xs text-white/50">pare-feu / cyber</p>
            </div>
            <div className="rounded-[8px] border border-white/10 bg-white/[0.06] p-3">
              <UserCog className="h-5 w-5 text-sky-300" />
              <p className="mt-2 text-2xl font-black">24</p>
              <p className="text-xs text-white/50">agents connectes</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {(['all', 'server', 'firewall', 'database', 'agent', 'security'] as const).map((category) => (
              <Button
                key={category}
                size="sm"
                variant={selectedCategory === category ? 'default' : 'outline'}
                className={cn('h-8 rounded-[8px]', selectedCategory !== category && 'border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white')}
                onClick={() => setSelectedCategory(category)}
              >
                {category === 'all' ? 'Tout' : category}
              </Button>
            ))}
          </div>

          <div className="mt-4 max-h-[318px] space-y-2 overflow-y-auto pr-1">
            {filteredNodes.map((node) => {
              const Icon = node.icon;
              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => setSelectedNode(node)}
                  className={cn(
                    'w-full rounded-[8px] border p-3 text-left transition hover:scale-[1.01]',
                    selectedNode.id === node.id ? 'border-[#32BB78] bg-[#32BB78]/12' : 'border-white/10 bg-white/[0.06]',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={cn('flex h-10 w-10 items-center justify-center rounded-[8px] border', categoryStyles[node.category])}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black">{node.label}</p>
                        <p className="truncate text-xs text-white/50">{node.module} - {node.region}</p>
                      </div>
                    </div>
                    <Badge className="bg-white/10 text-white hover:bg-white/10">{node.status}</Badge>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <Progress value={node.load} className="h-1.5 bg-white/10" />
                    <span className="text-xs font-semibold text-white/70">{node.load}%</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 rounded-[8px] border border-[#32BB78]/25 bg-[#32BB78]/10 p-4">
            <div className="flex items-start gap-3">
              <RadioTower className="mt-1 h-5 w-5 text-[#7EE7AF]" />
              <div>
                <p className="font-black">{selectedNode.label}</p>
                <p className="mt-1 text-sm leading-6 text-white/65">{selectedNode.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge className="bg-[#32BB78] hover:bg-[#32BB78]">{selectedNode.module}</Badge>
                  <Badge className="bg-white/10 text-white hover:bg-white/10">{selectedNode.region}</Badge>
                  <Badge className="bg-white/10 text-white hover:bg-white/10">{selectedNode.status}</Badge>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <div className="grid gap-3 border-t border-white/10 bg-white/[0.04] p-4 md:grid-cols-4">
        {[
          ['Flux temps reel', 'Collecte activite, erreurs et signaux cyber', Activity],
          ['GPS utilisateurs', 'Points monde par zone et module dominant', Globe2],
          ['Protection active', 'Pare-feu applicatif et paiement', ShieldCheck],
          ['Reseau surveille', 'Latence, charge et agents en ligne', Wifi],
        ].map(([title, text, Icon]) => (
          <div key={title as string} className="rounded-[8px] border border-white/10 bg-white/[0.05] p-3">
            <Icon className="h-5 w-5 text-[#7EE7AF]" />
            <p className="mt-2 text-sm font-bold">{title as string}</p>
            <p className="mt-1 text-xs leading-5 text-white/50">{text as string}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

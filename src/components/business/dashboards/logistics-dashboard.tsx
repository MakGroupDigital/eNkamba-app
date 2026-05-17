'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { BusinessUser } from '@/types/business-dashboard.types';
import { BusinessDashboardIcons } from '@/components/icons/business-dashboard-icons';
import {
  MapPinIcon,
  SendPackageIcon,
  TrackPackageIcon,
  UgaviIcon,
  UgaviPlayIcon,
  UgaviShareIcon,
} from '@/components/icons/service-icons';
import { addDoc, collection, doc, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { uploadToCloudinary } from '@/lib/cloudinary-upload';
import {
  UGAVI_STATUS_LABELS,
  buildUgaviStatusEntry,
  type UgaviLogisticsStatus,
} from '@/lib/ugavi-requests';

interface LogisticsDashboardProps {
  businessUser: BusinessUser;
}

type LogisticsTab = {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
};

type LogisticsStat = {
  label: string;
  value: string;
  icon: React.ComponentType<any>;
  color: 'orange' | 'blue' | 'green' | 'yellow' | 'purple';
};

type LogisticsRoleConfig = {
  title: string;
  summary: string;
  tabs: LogisticsTab[];
  stats: LogisticsStat[];
  capabilities: string[];
  fleetTitle: string;
  fleetEmptyState: string;
  shipmentsTitle: string;
  shipmentsEmptyState: string;
  relayTitle: string;
  relayDescription: string;
};

type QuickAction = {
  label: string;
  description: string;
  tab: string;
  icon: React.ComponentType<any>;
  tone: 'emerald' | 'orange' | 'blue' | 'slate';
};

type AgencyShipment = {
  id: string;
  trackingNumber: string;
  senderName: string;
  receiverName: string;
  origin: string;
  destination: string;
  weight: number;
  description: string;
  logisticsStatus: UgaviLogisticsStatus;
  statusHistory: any[];
  updatedAtMs: number;
};

type AgencyResource = {
  id: string;
  name: string;
  type: string;
  zone: string;
  status: 'available' | 'inactive';
};

type AgencyZone = {
  name: string;
  radius: string;
};

const AGENCY_STATUS_OPTIONS: UgaviLogisticsStatus[] = [
  'registered',
  'assigned',
  'in_transit',
  'arrived_depot',
  'out_for_delivery',
  'delivered',
  'returned',
  'blocked',
];

const BASE_STATS: LogisticsStat[] = [
  { label: 'Missions actives', value: '0', icon: BusinessDashboardIcons.Truck, color: 'orange' },
  { label: 'Trajets du jour', value: '0', icon: BusinessDashboardIcons.MapPin, color: 'blue' },
  { label: 'Taux de succès', value: '0%', icon: BusinessDashboardIcons.CheckCircle, color: 'green' },
];

const OVERVIEW_TAB: LogisticsTab = { id: 'overview', label: 'Vue d’ensemble', icon: BusinessDashboardIcons.TrendingUp };
const FLEET_TAB: LogisticsTab = { id: 'fleet', label: 'Ressources', icon: BusinessDashboardIcons.Truck };
const SHIPMENTS_TAB: LogisticsTab = { id: 'shipments', label: 'Colis & missions', icon: BusinessDashboardIcons.MapPin };
const RELAY_TAB: LogisticsTab = { id: 'relay', label: 'Scanner QR', icon: BusinessDashboardIcons.QRCode };
const REGISTER_TAB: LogisticsTab = { id: 'register', label: 'Enregistrer colis', icon: BusinessDashboardIcons.QRCode };

const TAB_ICON_MAP: Record<string, React.ComponentType<any>> = {
  overview: UgaviIcon,
  fleet: SendPackageIcon,
  shipments: TrackPackageIcon,
  relay: UgaviShareIcon,
  register: SendPackageIcon,
};

const ROLE_CONFIGS: Record<string, LogisticsRoleConfig> = {
  RELAY: {
    title: 'Dashboard Ugavi — Point relais',
    summary: 'Réception, stockage court, scans QR et remise colis.',
    tabs: [OVERVIEW_TAB, SHIPMENTS_TAB, RELAY_TAB],
    stats: [...BASE_STATS, { label: 'Colis en stock', value: '0', icon: BusinessDashboardIcons.AlertCircle, color: 'yellow' }],
    capabilities: ['Réception colis', 'Enregistrement colis', 'Ticket QR / Code-barres', 'Paiements et remises'],
    fleetTitle: 'Moyens de service',
    fleetEmptyState: 'Aucun poste relais ou moyen mobile enregistré',
    shipmentsTitle: 'Colis en stock',
    shipmentsEmptyState: 'Aucun colis reçu pour le moment',
    relayTitle: 'Scanner relais',
    relayDescription: 'Scannez les colis entrants, sortants et les tickets de remise.',
  },
  RELAY_AGENT: {
    title: 'Dashboard Ugavi — Agent relais terrain',
    summary: 'Opérations mobiles, scans terrain, encaissement et proximité.',
    tabs: [OVERVIEW_TAB, SHIPMENTS_TAB, RELAY_TAB],
    stats: [...BASE_STATS, { label: 'Encaissements', value: '0', icon: BusinessDashboardIcons.AlertCircle, color: 'yellow' }],
    capabilities: ['Collecte terrain', 'Encaissement', 'Remise colis', 'Validation client'],
    fleetTitle: 'Moyens mobiles',
    fleetEmptyState: 'Aucun moyen mobile relié à ce profil',
    shipmentsTitle: 'Missions terrain',
    shipmentsEmptyState: 'Aucune mission terrain pour le moment',
    relayTitle: 'Scanner terrain',
    relayDescription: 'Scannez les colis, tickets et preuves terrain.',
  },
  LOCAL_AGENCY: {
    title: 'Dashboard Ugavi — Agence locale',
    summary: 'Livraison urbaine, dispatch local, flotte et SLA.',
    tabs: [OVERVIEW_TAB, FLEET_TAB, SHIPMENTS_TAB],
    stats: [...BASE_STATS, { label: 'Livreurs disponibles', value: '0', icon: BusinessDashboardIcons.Truck, color: 'purple' }],
    capabilities: ['Gestion livreurs', 'Affectation missions', 'Tarification locale', 'Suivi urbain'],
    fleetTitle: 'Livreurs & véhicules locaux',
    fleetEmptyState: 'Aucun livreur ou véhicule local enregistré',
    shipmentsTitle: 'Expéditions locales',
    shipmentsEmptyState: 'Aucune expédition locale pour le moment',
    relayTitle: 'Scanner agence',
    relayDescription: 'Scanner disponible pour les opérations locales.',
  },
  TRANSPORT_COMPANY: {
    title: 'Dashboard Ugavi — Entreprise de transport',
    summary: 'Flotte multi-véhicules, hubs et itinéraires réguliers.',
    tabs: [OVERVIEW_TAB, FLEET_TAB, SHIPMENTS_TAB],
    stats: [...BASE_STATS, { label: 'Véhicules actifs', value: '0', icon: BusinessDashboardIcons.Truck, color: 'purple' }],
    capabilities: ['Flotte', 'Chauffeurs', 'Lignes régulières', 'Hubs et dépôts'],
    fleetTitle: 'Parc logistique',
    fleetEmptyState: 'Aucun véhicule ou chauffeur enregistré',
    shipmentsTitle: 'Trajets et chargements',
    shipmentsEmptyState: 'Aucun trajet planifié pour le moment',
    relayTitle: 'Scanner logistique',
    relayDescription: 'Scanner secondaire pour hubs et points de collecte.',
  },
  NATIONAL_AGENCY: {
    title: 'Dashboard Ugavi — Agence nationale',
    summary: 'Transport inter-ville avec dépôts, hubs et relais de réception.',
    tabs: [OVERVIEW_TAB, FLEET_TAB, SHIPMENTS_TAB],
    stats: [...BASE_STATS, { label: 'Dépôts actifs', value: '0', icon: BusinessDashboardIcons.AlertCircle, color: 'yellow' }],
    capabilities: ['Trajets inter-ville', 'Dépôts', 'Relais réception', 'Transport train / bateau / camion'],
    fleetTitle: 'Réseau national',
    fleetEmptyState: 'Aucun dépôt ou moyen national enregistré',
    shipmentsTitle: 'Flux nationaux',
    shipmentsEmptyState: 'Aucun flux national en cours',
    relayTitle: 'Scanner hub',
    relayDescription: 'Scanner pour dépôts, hubs et relais partenaires.',
  },
  INTERNATIONAL_AGENCY: {
    title: 'Dashboard Ugavi — Agence internationale',
    summary: 'Cross-border, douane, partenaires et suivi multi-pays.',
    tabs: [OVERVIEW_TAB, FLEET_TAB, SHIPMENTS_TAB],
    stats: [...BASE_STATS, { label: 'Corridors actifs', value: '0', icon: BusinessDashboardIcons.AlertCircle, color: 'yellow' }],
    capabilities: ['Douane', 'Partenaires', 'Multi-pays', 'Cargo premium'],
    fleetTitle: 'Partenaires & moyens internationaux',
    fleetEmptyState: 'Aucun partenaire ou corridor international enregistré',
    shipmentsTitle: 'Expéditions internationales',
    shipmentsEmptyState: 'Aucune expédition internationale pour le moment',
    relayTitle: 'Scanner international',
    relayDescription: 'Scanner pour hubs internationaux et relais transfrontaliers.',
  },
  WAREHOUSE_HUB: {
    title: 'Dashboard Ugavi — Hub / entrepôt',
    summary: 'Réception, tri, inventaire et dispatch.',
    tabs: [OVERVIEW_TAB, SHIPMENTS_TAB, RELAY_TAB],
    stats: [...BASE_STATS, { label: 'Emplacements actifs', value: '0', icon: BusinessDashboardIcons.AlertCircle, color: 'yellow' }],
    capabilities: ['Inventaire', 'Réception', 'Tri', 'Dispatch'],
    fleetTitle: 'Infrastructure hub',
    fleetEmptyState: 'Aucun espace, quai ou zone déclaré',
    shipmentsTitle: 'Stock et mouvements',
    shipmentsEmptyState: 'Aucun colis stocké pour le moment',
    relayTitle: 'Scanner dépôt',
    relayDescription: 'Scannez les colis entrants, sortants et zones de stockage.',
  },
  LAST_MILE: {
    title: 'Dashboard Ugavi — Coordination last-mile',
    summary: 'Pilotage des agents proches et de la livraison finale.',
    tabs: [OVERVIEW_TAB, FLEET_TAB, SHIPMENTS_TAB],
    stats: [...BASE_STATS, { label: 'Agents disponibles', value: '0', icon: BusinessDashboardIcons.Truck, color: 'purple' }],
    capabilities: ['Dispatch rapide', 'ETA', 'Zone GPS', 'Suivi livraison finale'],
    fleetTitle: 'Agents last-mile',
    fleetEmptyState: 'Aucun agent last-mile enregistré',
    shipmentsTitle: 'Courses finales',
    shipmentsEmptyState: 'Aucune course finale active',
    relayTitle: 'Scanner remise',
    relayDescription: 'Scanner utilisé pour les remises finales.',
  },
};

const DEFAULT_ROLE_CONFIG: LogisticsRoleConfig = ROLE_CONFIGS.TRANSPORT_COMPANY;

function getCourierConfig(): LogisticsRoleConfig {
  return {
    title: 'Dashboard Ugavi — Livreur',
    summary: 'Missions, disponibilité, transport et navigation terrain.',
    tabs: [OVERVIEW_TAB, FLEET_TAB, SHIPMENTS_TAB],
    stats: [...BASE_STATS, { label: 'Disponibilité', value: 'Actif', icon: BusinessDashboardIcons.AlertCircle, color: 'yellow' }],
    capabilities: ['Accepter missions', 'Navigation GPS', 'Disponibilité live', 'Preuve de remise'],
    fleetTitle: 'Moyen de déplacement',
    fleetEmptyState: 'Aucun moyen de déplacement enregistré',
    shipmentsTitle: 'Missions à exécuter',
    shipmentsEmptyState: 'Aucune mission attribuée pour le moment',
    relayTitle: 'Scanner mission',
    relayDescription: 'Scanner utilisé au pickup et à la remise.',
  };
}

function getLogisticsRoleConfig(subCategory?: string): LogisticsRoleConfig {
  if (subCategory && ROLE_CONFIGS[subCategory]) {
    return ROLE_CONFIGS[subCategory];
  }

  if (typeof subCategory === 'string' && subCategory.startsWith('COURIER_')) {
    return getCourierConfig();
  }

  return DEFAULT_ROLE_CONFIG;
}

export function LogisticsDashboard({ businessUser }: LogisticsDashboardProps) {
  const roleConfig = getLogisticsRoleConfig(businessUser.subCategory);
  const canRegisterPackages = !businessUser.subCategory?.startsWith('COURIER_');
  const tabs = canRegisterPackages && !roleConfig.tabs.some((tab) => tab.id === 'register')
    ? [...roleConfig.tabs, REGISTER_TAB]
    : roleConfig.tabs;
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || 'overview');
  const [shipments, setShipments] = useState<AgencyShipment[]>([]);
  const [isShipmentsLoading, setIsShipmentsLoading] = useState(true);
  const liveStats = useMemo(() => {
    const activeCount = shipments.filter((shipment) => !['delivered', 'returned', 'blocked'].includes(shipment.logisticsStatus)).length;
    const deliveredCount = shipments.filter((shipment) => shipment.logisticsStatus === 'delivered').length;
    const issueCount = shipments.filter((shipment) => ['returned', 'blocked'].includes(shipment.logisticsStatus)).length;
    const successRate = shipments.length ? Math.round((deliveredCount / shipments.length) * 100) : 0;

    return [
      { label: 'Missions actives', value: String(activeCount), icon: TrackPackageIcon, color: 'orange' as const },
      { label: 'Colis suivis', value: String(shipments.length), icon: SendPackageIcon, color: 'blue' as const },
      { label: 'Taux de succès', value: `${successRate}%`, icon: BusinessDashboardIcons.CheckCircle, color: 'green' as const },
      { label: 'Incidents', value: String(issueCount), icon: BusinessDashboardIcons.AlertCircle, color: 'yellow' as const },
    ];
  }, [shipments]);

  useEffect(() => {
    const agencyQuery = query(
      collection(db, 'ugaviRequests'),
      where('agencyUserId', '==', businessUser.uid)
    );

    const unsubscribe = onSnapshot(
      agencyQuery,
      (snapshot) => {
        const items = snapshot.docs.map((shipmentDoc) => {
          const data = shipmentDoc.data() as any;
          const updatedAtMs = data.updatedAt?.toMillis?.() || data.createdAt?.toMillis?.() || 0;
          return {
            id: shipmentDoc.id,
            trackingNumber: data.trackingNumber || data.packageNumber || `UGV-${shipmentDoc.id.slice(0, 6).toUpperCase()}`,
            senderName: data.senderName || 'Expediteur',
            receiverName: data.receiverName || 'Destinataire',
            origin: data.senderAddress || 'Origine',
            destination: data.receiverAddress || 'Destination',
            weight: Number(data.packageWeight || 0),
            description: data.description || '',
            logisticsStatus: (data.logisticsStatus || 'registered') as UgaviLogisticsStatus,
            statusHistory: Array.isArray(data.statusHistory) ? data.statusHistory : [],
            updatedAtMs,
          };
        });
        setShipments(items.sort((left, right) => right.updatedAtMs - left.updatedAtMs));
        setIsShipmentsLoading(false);
      },
      (error) => {
        console.error('Erreur chargement colis agence:', error);
        setShipments([]);
        setIsShipmentsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [businessUser.uid]);
  const quickActions: QuickAction[] = [
    {
      label: canRegisterPackages ? 'Enregistrer colis' : 'Voir missions',
      description: canRegisterPackages ? 'Créer un suivi et QR code' : 'Consulter les courses assignées',
      tab: canRegisterPackages ? 'register' : 'shipments',
      icon: canRegisterPackages ? SendPackageIcon : MapPinIcon,
      tone: 'emerald',
    },
    {
      label: 'Scanner',
      description: 'Pickup, depot ou remise',
      tab: tabs.some((tab) => tab.id === 'relay') ? 'relay' : 'shipments',
      icon: UgaviShareIcon,
      tone: 'orange',
    },
    {
      label: 'Ressources',
      description: 'Livreurs, vehicules, moyens',
      tab: tabs.some((tab) => tab.id === 'fleet') ? 'fleet' : 'overview',
      icon: UgaviIcon,
      tone: 'blue',
    },
    {
      label: 'Flux actifs',
      description: 'Colis, missions et priorites',
      tab: 'shipments',
      icon: TrackPackageIcon,
      tone: 'slate',
    },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(50,187,120,0.14),transparent_34%),linear-gradient(180deg,#f7fbf8_0%,#eef8f1_54%,#f8faf8_100%)] pb-24 text-[#122116]">
      <div className="sticky top-0 z-30 rounded-b-[32px] bg-gradient-to-r from-[#32BB78] via-[#22945d] to-[#0E5A59] px-4 pb-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] text-white shadow-lg shadow-[#0E5A59]/20">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border border-white/30 bg-white shadow-md">
                <UgaviIcon size={38} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/70">Ugavi Business</p>
                <h1 className="truncate text-xl font-black leading-tight">{businessUser.businessName}</h1>
                <p className="truncate text-xs font-medium text-white/75">{roleConfig.title.replace('Dashboard Ugavi — ', '')}</p>
              </div>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-2 text-xs font-bold backdrop-blur sm:flex">
              <BusinessDashboardIcons.CheckCircle className="h-4 w-4" />
              Compte actif
            </div>
          </div>

          <div className="mt-4 grid grid-cols-4 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => setActiveTab(action.tab)}
                  className="group flex min-w-0 flex-col items-center gap-2 rounded-2xl bg-white/12 p-2.5 text-center ring-1 ring-white/18 transition hover:bg-white/20"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-md transition group-hover:scale-105">
                    <Icon size={32} />
                  </span>
                  <span className="line-clamp-2 text-[11px] font-bold leading-tight text-white">{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-5 px-4 py-5">
        <section className="overflow-hidden rounded-3xl border border-white bg-white shadow-sm">
          <div className="relative bg-gradient-to-br from-[#32BB78] via-[#22945d] to-[#0E5A59] p-5 text-white">
            <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/15 blur-2xl" />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/14 px-3 py-1 text-xs font-bold text-white/80">
                  <span className="h-2 w-2 rounded-full bg-[#FF8C00]" />
                  Operations logistiques
                </div>
                <h2 className="mt-4 max-w-2xl text-2xl font-black leading-tight sm:text-3xl">
                  Pilotez colis, scans, relais et ressources depuis un seul espace.
                </h2>
                <p className="mt-2 max-w-xl text-sm text-white/75">{roleConfig.summary}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:min-w-72">
                <MetricPill label="Colis" value={String(shipments.length)} />
                <MetricPill label="Actifs" value={liveStats[0].value} />
                <MetricPill label="SLA" value={liveStats[2].value} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
            {liveStats.map((stat) => (
              <BusinessMetricCard key={stat.label} stat={stat} />
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-[#dbe8df] bg-white shadow-sm">
          <div className="flex gap-2 overflow-x-auto p-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {tabs.map((tab) => {
              const Icon = TAB_ICON_MAP[tab.id] || tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex min-w-fit items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                    activeTab === tab.id
                      ? 'bg-[#32BB78] text-white shadow-md shadow-[#32BB78]/20'
                      : 'bg-[#f4faf6] text-[#52635a] hover:bg-[#e8f4ec] hover:text-[#22945d]'
                  }`}
                >
                  <Icon size={22} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </section>

        {activeTab === 'overview' && <LogisticsOverview stats={liveStats} capabilities={roleConfig.capabilities} shipments={shipments} setActiveTab={setActiveTab} />}
        {activeTab === 'fleet' && <LogisticsFleet title={roleConfig.fleetTitle} emptyState={roleConfig.fleetEmptyState} businessUser={businessUser} />}
        {activeTab === 'shipments' && <LogisticsShipments title={roleConfig.shipmentsTitle} emptyState={roleConfig.shipmentsEmptyState} businessUser={businessUser} shipments={shipments} isLoading={isShipmentsLoading} />}
        {activeTab === 'relay' && <RelayScanner title={roleConfig.relayTitle} description={roleConfig.relayDescription} />}
        {activeTab === 'register' && <AgencyPackageRegistration businessUser={businessUser} />}
      </div>
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/18 bg-white/14 p-3 text-center backdrop-blur">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/65">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function BusinessMetricCard({ stat }: { stat: LogisticsStat }) {
  const Icon = stat.icon;
  const colorClasses = {
    orange: 'bg-[#fff7ed] text-[#9a4a00] border-[#fed7aa]',
    blue: 'bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]',
    green: 'bg-[#ecfdf3] text-[#0E5A59] border-[#b8efd2]',
    yellow: 'bg-[#fffbeb] text-[#92400e] border-[#fde68a]',
    purple: 'bg-[#f5f3ff] text-[#6d28d9] border-[#ddd6fe]',
  };

  return (
    <div className={`rounded-2xl border p-4 ${colorClasses[stat.color]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold opacity-75">{stat.label}</p>
          <p className="mt-2 text-2xl font-black">{stat.value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/70">
          <Icon className="h-6 w-6 opacity-80" size={28} />
        </div>
      </div>
    </div>
  );
}

function generateBarcodeDataUrl(payload: string, label: string) {
  const encoded = Array.from(payload)
    .map((char) => char.charCodeAt(0).toString(2).padStart(8, '0'))
    .join('');
  const bars = encoded
    .slice(0, 180)
    .split('')
    .map((bit, index) => {
      const width = bit === '1' ? 3 : 1;
      const x = 12 + index * 2;
      return `<rect x="${x}" y="12" width="${width}" height="72" fill="#0f8f5f" />`;
    })
    .join('');
  const safeLabel = label.replace(/[<>&"]/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="430" height="140" viewBox="0 0 430 140"><rect width="430" height="140" rx="16" fill="#ffffff"/><rect x="8" y="8" width="414" height="124" rx="12" fill="#f0fdf4" stroke="#bbf7d0"/>${bars}<text x="215" y="114" text-anchor="middle" font-family="monospace" font-size="18" font-weight="700" fill="#0f5132">${safeLabel}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

function downloadPackageLabel(packageData: {
  trackingNumber: string;
  qrCodeUrl: string;
  barcodeUrl: string;
  payload: string;
}) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Ugavi ${packageData.trackingNumber}</title></head><body style="font-family:Arial,sans-serif;color:#0f5132;padding:24px"><section style="border:2px solid #32BB78;border-radius:18px;padding:24px;max-width:680px"><h1 style="margin:0 0 8px">Ugavi</h1><p style="font-family:monospace;font-size:22px;font-weight:800">${packageData.trackingNumber}</p><img src="${packageData.qrCodeUrl}" style="width:220px;height:220px"><img src="${packageData.barcodeUrl}" style="width:390px;max-width:100%"><pre style="white-space:pre-wrap;background:#f0fdf4;border-radius:12px;padding:12px">${packageData.payload.replace(/[<>&]/g, '')}</pre></section></body></html>`;
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  downloadDataUrl(url, `${packageData.trackingNumber}-etiquette.html`);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function printPackageLabel(packageData: {
  trackingNumber: string;
  qrCodeUrl: string;
  barcodeUrl: string;
  payload: string;
}) {
  const printWindow = window.open('', '_blank', 'width=760,height=900');
  if (!printWindow) return;

  printWindow.document.write(`
    <html>
      <head>
        <title>Etiquette ${packageData.trackingNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #0f5132; }
          .label { border: 2px solid #32BB78; border-radius: 18px; padding: 24px; max-width: 620px; }
          h1 { margin: 0 0 8px; font-size: 28px; }
          .tracking { font-family: monospace; font-size: 22px; font-weight: 800; margin-bottom: 18px; }
          .grid { display: grid; grid-template-columns: 220px 1fr; gap: 20px; align-items: center; }
          img { max-width: 100%; }
          pre { white-space: pre-wrap; background: #f0fdf4; border-radius: 12px; padding: 12px; font-size: 11px; color: #166534; }
        </style>
      </head>
      <body>
        <div class="label">
          <h1>Ugavi</h1>
          <div class="tracking">${packageData.trackingNumber}</div>
          <div class="grid">
            <img src="${packageData.qrCodeUrl}" alt="QR" />
            <div>
              <img src="${packageData.barcodeUrl}" alt="Barcode" />
              <pre>${packageData.payload.replace(/[<>&]/g, '')}</pre>
            </div>
          </div>
        </div>
        <script>window.onload = () => { window.print(); };</script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

function AgencyPackageRegistration({ businessUser }: { businessUser: BusinessUser }) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [weight, setWeight] = useState('');
  const [description, setDescription] = useState('');
  const [packagePhoto, setPackagePhoto] = useState<File | null>(null);
  const [packagePhotoPreview, setPackagePhotoPreview] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [registeredPackage, setRegisteredPackage] = useState<{
    trackingNumber: string;
    qrCodeUrl: string;
    barcodeUrl: string;
    payload: string;
    requestId: string;
  } | null>(null);

  const canSubmit = senderName && receiverName && receiverPhone && origin && destination && weight && packagePhoto;

  useEffect(() => {
    return () => {
      if (packagePhotoPreview) URL.revokeObjectURL(packagePhotoPreview);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [packagePhotoPreview]);

  useEffect(() => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!isCameraOpen || !video || !stream) return;

    video.srcObject = stream;
    void video.play().catch((error) => {
      console.error('Erreur lecture camera colis:', error);
      setCameraError('Camera ouverte, mais le flux ne demarre pas.');
    });
  }, [isCameraOpen]);

  const updatePackagePhoto = (file: File | null) => {
    setPackagePhoto(file);
    setPackagePhotoPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return file ? URL.createObjectURL(file) : '';
    });
  };

  const openCamera = async () => {
    setCameraError('');
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Camera non disponible sur cet appareil.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      setIsCameraOpen(true);
    } catch (error) {
      console.error('Erreur camera colis:', error);
      setCameraError('Impossible d’ouvrir la camera.');
    }
  };

  const closeCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsCameraOpen(false);
  };

  const capturePackagePhoto = async () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const context = canvas.getContext('2d');
    if (!context) return;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
    if (!blob) return;

    updatePackagePhoto(new File([blob], `ugavi-colis-${Date.now()}.jpg`, { type: 'image/jpeg' }));
    closeCamera();
  };

  const registerPackage = async () => {
    if (!canSubmit || isSaving) return;
    if (!packagePhoto) return;

    setIsSaving(true);
    try {
      const cleanOrigin = origin.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, '') || 'ORG';
      const cleanDestination = destination.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, '') || 'DST';
      const trackingNumber = `UGV-${new Date().getFullYear()}-${cleanOrigin}-${cleanDestination}-${Date.now().toString().slice(-5)}`;
      const photoUpload = await uploadToCloudinary(packagePhoto, 'image');
      const qrPayload = JSON.stringify({
        type: 'UGAVI_PACKAGE',
        packageNumber: trackingNumber,
        trackingNumber,
        senderName,
        senderPhone,
        receiverName,
        receiverPhone,
        origin,
        destination,
        weight,
        description,
        packagePhotoUrl: photoUpload.secureUrl,
        agencyName: businessUser.businessName,
        agencyId: businessUser.businessId,
      });
      const barcodeUrl = generateBarcodeDataUrl(qrPayload, trackingNumber);

      const QRCode = await import('qrcode');
      const qrCodeUrl = await (QRCode as any).toDataURL(qrPayload, {
        margin: 1,
        width: 220,
        color: { dark: '#0f8f5f', light: '#ffffff' },
      });

      const requestDoc = await addDoc(collection(db, 'ugaviRequests'), {
        source: 'agency_registration',
        agencyId: businessUser.businessId || businessUser.uid,
        agencyUserId: businessUser.uid,
        agencyName: businessUser.businessName,
        agencySubCategory: businessUser.subCategory || null,
        userId: null,
        senderName,
        senderPhone,
        receiverName,
        receiverPhone,
        senderAddress: origin,
        receiverAddress: destination,
        packageWeight: Number(weight),
        description,
        packagePhotoUrl: photoUpload.secureUrl,
        packagePhotoPublicId: photoUpload.publicId,
        serviceMode: businessUser.subCategory === 'INTERNATIONAL_AGENCY' ? 'international' : 'national',
        status: 'registered',
        paymentStatus: 'agency_pending',
        logisticsStatus: 'registered',
        packageNumber: trackingNumber,
        trackingNumber,
        qrPayload,
        barcodePayload: qrPayload,
        statusHistory: [
          buildUgaviStatusEntry('registered', businessUser.businessName, origin, 'Colis enregistre en agence'),
        ],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setRegisteredPackage({ trackingNumber, qrCodeUrl, barcodeUrl, payload: qrPayload, requestId: requestDoc.id });
      setSenderName('');
      setSenderPhone('');
      setReceiverName('');
      setReceiverPhone('');
      setOrigin('');
      setDestination('');
      setWeight('');
      setDescription('');
      updatePackagePhoto(null);
    } catch (error) {
      console.error('Erreur enregistrement colis Ugavi:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-2xl font-bold text-emerald-950">Enregistrement agence</h2>
          <p className="mt-1 text-sm text-slate-500">
            Le personnel valide le colis, puis Ugavi genere le QR code et le numero de suivi a transmettre au proprietaire et au destinataire.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Expediteur" value={senderName} onChange={setSenderName} placeholder="Nom complet" />
          <Field label="Telephone expediteur" value={senderPhone} onChange={setSenderPhone} placeholder="+243..." />
          <Field label="Destinataire" value={receiverName} onChange={setReceiverName} placeholder="Nom complet" />
          <Field label="Telephone destinataire" value={receiverPhone} onChange={setReceiverPhone} placeholder="+243..." />
          <Field label="Agence / origine" value={origin} onChange={setOrigin} placeholder="Agence Gombe, Kinshasa" />
          <Field label="Destination" value={destination} onChange={setDestination} placeholder="Ville, quartier, point relais" />
          <Field label="Poids kg" value={weight} onChange={setWeight} placeholder="2.5" type="number" />
          <Field label="Description" value={description} onChange={setDescription} placeholder="Contenu, fragilite, note" />
          <div className="space-y-2 md:col-span-2">
            <span className="text-sm font-semibold text-slate-700">Photo du colis *</span>
            {!isCameraOpen && (
              <button
                type="button"
                onClick={() => void openCamera()}
                className="flex h-11 w-full items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100"
              >
                Capturer la photo
              </button>
            )}
            {cameraError && <p className="text-sm font-semibold text-red-600">{cameraError}</p>}
            {isCameraOpen && (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-emerald-800">Camera active</p>
                  <span className="rounded-full bg-emerald-600 px-2 py-1 text-xs font-bold text-white">LIVE</span>
                </div>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  onLoadedMetadata={() => void videoRef.current?.play()}
                  className="h-64 w-full rounded-xl bg-emerald-950 object-cover"
                />
                <p className="mt-2 text-xs font-semibold text-emerald-700">
                  Placez le colis dans le cadre puis prenez la photo.
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => void capturePackagePhoto()}
                    className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-bold text-white"
                  >
                    Prendre photo
                  </button>
                  <button
                    type="button"
                    onClick={closeCamera}
                    className="rounded-xl bg-white px-3 py-2 text-sm font-bold text-emerald-700 ring-1 ring-emerald-100"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
            {packagePhotoPreview && (
              <div className="rounded-xl border border-emerald-100 bg-white p-2">
                <img
                  src={packagePhotoPreview}
                  alt="Apercu colis"
                  className="h-36 w-full rounded-xl object-cover"
                />
                <button
                  type="button"
                  onClick={() => void openCamera()}
                  className="mt-2 w-full rounded-xl bg-orange-50 px-3 py-2 text-sm font-bold text-orange-700"
                >
                  Reprendre la photo
                </button>
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={registerPackage}
          disabled={!canSubmit || isSaving}
          className="mt-5 w-full rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSaving ? 'Upload et enregistrement...' : 'Valider et generer QR'}
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-emerald-950">Transmission instantanee</h3>
        <p className="mt-1 text-sm text-slate-500">
          Le code sert a verifier le colis au scan, au depart, au depot et a la remise.
        </p>

        {registeredPackage ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Numero de suivi</p>
              <p className="mt-2 font-mono text-lg font-bold text-emerald-950">{registeredPackage.trackingNumber}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-100 bg-white p-3 text-center">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">QR Code</p>
                <img
                  src={registeredPackage.qrCodeUrl}
                  alt={`QR ${registeredPackage.trackingNumber}`}
                  className="mx-auto h-44 w-44 rounded-xl bg-white p-2"
                />
                <button
                  type="button"
                  onClick={() => downloadDataUrl(registeredPackage.qrCodeUrl, `${registeredPackage.trackingNumber}-qr.png`)}
                  className="mt-3 w-full rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700"
                >
                  Telecharger QR
                </button>
              </div>
              <div className="rounded-xl border border-orange-100 bg-white p-3 text-center">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-orange-700">Code-barres</p>
                <img
                  src={registeredPackage.barcodeUrl}
                  alt={`Barcode ${registeredPackage.trackingNumber}`}
                  className="mx-auto h-44 w-full rounded-xl bg-white object-contain p-2"
                />
                <button
                  type="button"
                  onClick={() => downloadDataUrl(registeredPackage.barcodeUrl, `${registeredPackage.trackingNumber}-barcode.svg`)}
                  className="mt-3 w-full rounded-xl bg-orange-50 px-3 py-2 text-xs font-bold text-orange-700"
                >
                  Telecharger barcode
                </button>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => printPackageLabel(registeredPackage)}
                className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-bold text-white"
              >
                Imprimer
              </button>
              <button
                type="button"
                onClick={() => downloadPackageLabel(registeredPackage)}
                className="rounded-xl bg-orange-500 px-3 py-2 text-sm font-bold text-white"
              >
                Telecharger
              </button>
              <button
                type="button"
                onClick={() => {
                  const text = `Colis Ugavi ${registeredPackage.trackingNumber}. Suivi: ${window.location.origin}/dashboard/ugavi/tracking?tracking=${registeredPackage.trackingNumber}`;
                  if (navigator.share) void navigator.share({ title: 'Colis Ugavi', text });
                  else void navigator.clipboard?.writeText(text);
                }}
                className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700"
              >
                Partager
              </button>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              Demande creee: {registeredPackage.requestId}. Le numero, le QR et le code-barres pointent vers le meme colis.
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
            Aucun colis valide pour le moment.
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
      />
    </label>
  );
}

function LogisticsOverview({
  stats,
  capabilities,
  shipments,
  setActiveTab,
}: {
  stats: LogisticsStat[];
  capabilities: string[];
  shipments: AgencyShipment[];
  setActiveTab: (tab: string) => void;
}) {
  const registeredCount = shipments.filter((shipment) => shipment.logisticsStatus === 'registered').length;
  const inTransitCount = shipments.filter((shipment) => ['assigned', 'in_transit', 'arrived_depot', 'out_for_delivery'].includes(shipment.logisticsStatus)).length;
  const finalCount = shipments.filter((shipment) => ['out_for_delivery'].includes(shipment.logisticsStatus)).length;

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          const colorClasses = {
            orange: 'bg-orange-50 text-orange-700 ring-orange-100',
            blue: 'bg-blue-50 text-blue-700 ring-blue-100',
            green: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
            yellow: 'bg-amber-50 text-amber-700 ring-amber-100',
            purple: 'bg-violet-50 text-violet-700 ring-violet-100',
          };

          return (
            <div key={`${stat.label}-${idx}`} className={`${colorClasses[stat.color]} rounded-2xl p-4 shadow-sm ring-1`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] opacity-75">{stat.label}</p>
                  <p className="mt-2 text-3xl font-black">{stat.value}</p>
                </div>
                <Icon className="h-10 w-10 opacity-25" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {capabilities.map((capability) => (
          <div key={capability} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-emerald-600 p-2 text-white">
                <BusinessDashboardIcons.CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-emerald-950">{capability}</p>
                <p className="mt-1 text-sm text-slate-500">
                  Disponible pour ce profil. Les données se rempliront au fil des opérations UGAVI.
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-emerald-950">Pipeline du jour</p>
              <p className="text-xs text-slate-500">Vue rapide des flux</p>
            </div>
            <BusinessDashboardIcons.TrendingUp className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="mt-5 space-y-4">
            {[
              { label: 'A enregistrer', value: registeredCount, tone: 'bg-emerald-700' },
              { label: 'En transit', value: inTransitCount, tone: 'bg-emerald-600' },
              { label: 'A remettre', value: finalCount, tone: 'bg-orange-500' },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setActiveTab(item.label === 'A enregistrer' ? 'register' : 'shipments')}
                className="flex w-full items-center justify-between rounded-xl bg-slate-50 px-3 py-3 text-left"
              >
                <span className="flex items-center gap-3">
                  <span className={`h-2.5 w-2.5 rounded-full ${item.tone}`} />
                  <span className="text-sm font-semibold text-slate-700">{item.label}</span>
                </span>
                <span className="text-lg font-black text-emerald-950">{item.value}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-bold text-emerald-950">Activite recente</p>
          <div className="mt-4 space-y-3">
            {['Aucune anomalie signalee', 'Aucun colis en retard', 'Scanner pret'].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-sm text-slate-600">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function LogisticsFleet({ title, emptyState, businessUser }: { title: string; emptyState: string; businessUser: BusinessUser }) {
  const [resources, setResources] = useState<AgencyResource[]>([]);
  const [agencyZone, setAgencyZone] = useState<AgencyZone | null>(null);
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [showZoneForm, setShowZoneForm] = useState(false);
  const [resourceName, setResourceName] = useState('');
  const [resourceType, setResourceType] = useState('Livreur');
  const [resourceZone, setResourceZone] = useState('');
  const [zoneName, setZoneName] = useState('');
  const [zoneRadius, setZoneRadius] = useState('5');
  const [isSavingResource, setIsSavingResource] = useState(false);
  const [isSavingZone, setIsSavingZone] = useState(false);

  useEffect(() => {
    const resourceQuery = query(
      collection(db, 'ugaviAgencyResources'),
      where('agencyUserId', '==', businessUser.uid)
    );

    const unsubscribeResources = onSnapshot(resourceQuery, (snapshot) => {
      setResources(snapshot.docs.map((resourceDoc) => {
        const data = resourceDoc.data() as any;
        return {
          id: resourceDoc.id,
          name: data.name || 'Ressource',
          type: data.type || 'Livreur',
          zone: data.zone || 'Zone',
          status: data.status || 'available',
        };
      }));
    });

    const unsubscribeZone = onSnapshot(doc(db, 'ugaviAgencyZones', businessUser.uid), (zoneDoc) => {
      if (!zoneDoc.exists()) {
        setAgencyZone(null);
        return;
      }
      const data = zoneDoc.data() as any;
      const nextZone = { name: data.name || '', radius: String(data.radius || '5') };
      setAgencyZone(nextZone);
      setZoneName(nextZone.name);
      setZoneRadius(nextZone.radius);
    });

    return () => {
      unsubscribeResources();
      unsubscribeZone();
    };
  }, [businessUser.uid]);

  const addResource = async () => {
    if (!resourceName.trim() || !resourceZone.trim()) return;
    setIsSavingResource(true);
    try {
      await addDoc(collection(db, 'ugaviAgencyResources'), {
        agencyId: businessUser.businessId || businessUser.uid,
        agencyUserId: businessUser.uid,
        agencyName: businessUser.businessName,
        name: resourceName.trim(),
        type: resourceType,
        zone: resourceZone.trim(),
        status: 'available',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setResourceName('');
      setResourceZone('');
      setShowResourceForm(false);
    } finally {
      setIsSavingResource(false);
    }
  };

  const saveZone = async () => {
    if (!zoneName.trim()) return;
    setIsSavingZone(true);
    try {
      await setDoc(doc(db, 'ugaviAgencyZones', businessUser.uid), {
        agencyId: businessUser.businessId || businessUser.uid,
        agencyUserId: businessUser.uid,
        agencyName: businessUser.businessName,
        name: zoneName.trim(),
        radius: Number(zoneRadius || 0),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setShowZoneForm(false);
    } finally {
      setIsSavingZone(false);
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-emerald-950">{title}</h2>
            <p className="text-sm text-slate-500">Ajoutez les moyens et agents qui executent les missions.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowResourceForm((current) => !current)}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Ajouter
          </button>
        </div>
        {showResourceForm && (
          <div className="mb-5 grid gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 md:grid-cols-[1fr_150px_1fr_auto]">
            <input
              value={resourceName}
              onChange={(event) => setResourceName(event.target.value)}
              placeholder="Nom ressource"
              className="h-11 rounded-xl border border-emerald-100 bg-white px-3 text-sm outline-none focus:border-emerald-500"
            />
            <select
              value={resourceType}
              onChange={(event) => setResourceType(event.target.value)}
              className="h-11 rounded-xl border border-emerald-100 bg-white px-3 text-sm outline-none focus:border-emerald-500"
            >
              {['Livreur', 'Moto', 'Voiture', 'Camion', 'Depot', 'Drone'].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <input
              value={resourceZone}
              onChange={(event) => setResourceZone(event.target.value)}
              placeholder="Zone"
              className="h-11 rounded-xl border border-emerald-100 bg-white px-3 text-sm outline-none focus:border-emerald-500"
            />
            <button
              type="button"
              onClick={addResource}
              disabled={isSavingResource}
              className="h-11 rounded-xl bg-orange-500 px-4 text-sm font-bold text-white"
            >
              {isSavingResource ? '...' : 'Valider'}
            </button>
          </div>
        )}
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { label: 'Livreurs', value: resources.filter((item) => item.type === 'Livreur').length, icon: UgaviIcon },
            { label: 'Vehicules', value: resources.filter((item) => ['Moto', 'Voiture', 'Camion', 'Drone'].includes(item.type)).length, icon: SendPackageIcon },
            { label: 'Zones', value: agencyZone ? 1 : 0, icon: MapPinIcon },
          ].map((item) => {
            const Icon = item.icon;
            return (
            <div key={item.label} className="rounded-2xl bg-slate-50 p-4">
              <Icon className="mb-4" size={32} />
              <p className="text-2xl font-black text-emerald-950">{item.value}</p>
              <p className="text-sm font-semibold text-slate-500">{item.label}</p>
            </div>
          );
          })}
        </div>
        {resources.length > 0 ? (
          <div className="mt-5 grid gap-2">
            {resources.map((resource) => (
              <div key={resource.id} className="flex items-center justify-between rounded-2xl bg-white p-3 ring-1 ring-emerald-100">
                <div>
                  <p className="font-bold text-emerald-950">{resource.name}</p>
                  <p className="text-sm text-slate-500">{resource.type} · {resource.zone}</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Disponible</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
            {emptyState}
          </div>
        )}
      </div>
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-emerald-100">
        <p className="text-sm font-bold text-emerald-950">Disponibilite live</p>
        <p className="mt-2 text-sm text-slate-500">Activez les ressources pour les voir sur la carte client et dans le dispatch.</p>
        {showZoneForm && (
          <div className="mt-4 space-y-3">
            <input
              value={zoneName}
              onChange={(event) => setZoneName(event.target.value)}
              placeholder="Nom de zone"
              className="h-11 w-full rounded-xl border border-emerald-100 bg-emerald-50 px-3 text-sm outline-none focus:border-emerald-500"
            />
            <input
              value={zoneRadius}
              onChange={(event) => setZoneRadius(event.target.value)}
              placeholder="Rayon km"
              type="number"
              className="h-11 w-full rounded-xl border border-emerald-100 bg-emerald-50 px-3 text-sm outline-none focus:border-emerald-500"
            />
          </div>
        )}
        {agencyZone && (
          <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">
            Zone active: <strong>{agencyZone.name}</strong> · {agencyZone.radius || 0} km
          </div>
        )}
        <button
          type="button"
          onClick={showZoneForm ? saveZone : () => setShowZoneForm(true)}
          disabled={isSavingZone}
          className="mt-5 w-full rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white"
        >
          {showZoneForm ? (isSavingZone ? 'Sauvegarde...' : 'Sauvegarder la zone') : 'Configurer la zone'}
        </button>
      </div>
    </div>
  );
}

function LogisticsShipments({
  title,
  emptyState,
  businessUser,
  shipments,
  isLoading,
}: {
  title: string;
  emptyState: string;
  businessUser: BusinessUser;
  shipments: AgencyShipment[];
  isLoading: boolean;
}) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'issue'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const filteredShipments = shipments.filter((shipment) => {
    if (statusFilter === 'active') return !['delivered', 'returned', 'blocked'].includes(shipment.logisticsStatus);
    if (statusFilter === 'issue') return ['returned', 'blocked'].includes(shipment.logisticsStatus);
    return true;
  });

  const updateShipmentStatus = async (shipment: AgencyShipment, nextStatus: UgaviLogisticsStatus) => {
    setUpdatingId(shipment.id);
    try {
      await updateDoc(doc(db, 'ugaviRequests', shipment.id), {
        logisticsStatus: nextStatus,
        status: nextStatus,
        statusHistory: [
          ...shipment.statusHistory,
          buildUgaviStatusEntry(nextStatus, businessUser.businessName, shipment.origin),
        ],
        updatedAt: serverTimestamp(),
        ...(nextStatus === 'delivered' ? { deliveredAt: serverTimestamp() } : {}),
      });
    } catch (error) {
      console.error('Erreur mise a jour statut colis:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-emerald-950">{title}</h2>
          <p className="text-sm text-slate-500">Suivez les colis, missions et statuts critiques.</p>
        </div>
        <div className="flex gap-2">
          {[
            { id: 'all', label: 'Tous' },
            { id: 'active', label: 'Actifs' },
            { id: 'issue', label: 'Incidents' },
          ].map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setStatusFilter(filter.id as any)}
              className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                statusFilter === filter.id ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="mt-5 rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-500">
          Chargement des colis...
        </div>
      ) : filteredShipments.length ? (
        <div className="mt-5 grid gap-3">
          {filteredShipments.map((shipment) => (
            <div key={shipment.id} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-mono text-sm font-black text-emerald-950">{shipment.trackingNumber}</p>
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
                      {UGAVI_STATUS_LABELS[shipment.logisticsStatus] || shipment.logisticsStatus}
                    </span>
                  </div>
                  <p className="mt-2 font-bold text-emerald-950">{shipment.senderName} vers {shipment.receiverName}</p>
                  <p className="mt-1 text-sm text-slate-500">{shipment.origin} vers {shipment.destination}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {shipment.weight || 0} kg {shipment.description ? `· ${shipment.description}` : ''}
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-[1fr_auto] lg:min-w-80">
                  <select
                    value={shipment.logisticsStatus}
                    onChange={(event) => void updateShipmentStatus(shipment, event.target.value as UgaviLogisticsStatus)}
                    disabled={updatingId === shipment.id}
                    className="h-11 rounded-xl border border-emerald-100 bg-white px-3 text-sm font-semibold text-emerald-900 outline-none focus:border-emerald-500"
                  >
                    {AGENCY_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {UGAVI_STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => window.open(`/dashboard/ugavi/tracking?tracking=${encodeURIComponent(shipment.trackingNumber)}`, '_blank')}
                    className="h-11 rounded-xl bg-orange-500 px-4 text-sm font-bold text-white"
                  >
                    Suivre
                  </button>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {AGENCY_STATUS_OPTIONS.slice(0, 6).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => void updateShipmentStatus(shipment, status)}
                    disabled={updatingId === shipment.id || shipment.logisticsStatus === status}
                    className="rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100 disabled:opacity-45"
                  >
                    {UGAVI_STATUS_LABELS[status]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
          {emptyState}
        </div>
      )}
    </div>
  );
}

function RelayScanner({ title, description }: { title: string; description: string }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
      <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-orange-500 p-6 text-white shadow-sm">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10">
          <UgaviShareIcon size={48} />
        </div>
        <h2 className="mt-6 text-2xl font-black">{title}</h2>
        <p className="mt-2 text-sm text-slate-300">{description}</p>
        <button className="mt-6 w-full rounded-xl bg-white px-4 py-3 font-bold text-emerald-700 transition hover:bg-emerald-50">
          Ouvrir le scanner
        </button>
      </div>
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-bold text-emerald-950">Modes de scan</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {['Reception', 'Depart', 'Remise'].map((mode) => (
            <button key={mode} className="rounded-2xl bg-slate-50 p-4 text-left">
              <UgaviShareIcon className="mb-4" size={32} />
              <p className="font-bold text-emerald-950">{mode}</p>
              <p className="text-sm text-slate-500">Scanner et valider</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

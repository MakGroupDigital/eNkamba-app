'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { BusinessUser } from '@/types/business-dashboard.types';
import { BusinessDashboardIcons } from '@/components/icons/business-dashboard-icons';
import {
  MapPinIcon,
  SendPackageIcon,
  TrackPackageIcon,
  UgaviIcon,
  UgaviShareIcon,
} from '@/components/icons/service-icons';
import {
  Bell,
  Box,
  Boxes,
  Building2,
  ChartNoAxesColumnIncreasing,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  ClipboardList,
  FileText,
  KeyRound,
  LayoutDashboard,
  Menu,
  PackagePlus,
  PackageCheck,
  PackageOpen,
  PieChart,
  QrCode,
  ScanLine,
  Settings,
  ShieldAlert,
  Truck,
  UsersRound,
  Warehouse,
  X,
} from 'lucide-react';
import { addDoc, arrayUnion, collection, doc, getDocs, limit, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { uploadToCloudinary } from '@/lib/cloudinary-upload';
import { useDashboardLocation } from '@/hooks/useDashboardLocation';
import {
  UGAVI_STATUS_LABELS,
  UGAVI_SCAN_LABELS,
  UGAVI_SCAN_STATUS_MAP,
  buildUgaviStatusEntry,
  extractUgaviTrackingCode,
  type UgaviScanMode,
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

type LogisticsSidebarItem = {
  id: string;
  label: string;
  tab: string;
  icon: React.ComponentType<any>;
};

type LogisticsSidebarSection = {
  title: string;
  items: LogisticsSidebarItem[];
};

type AgencyShipment = {
  id: string;
  trackingNumber: string;
  senderName: string;
  receiverName: string;
  origin: string;
  destination: string;
  weight: number;
  amountPaid: number;
  currency: string;
  description: string;
  logisticsStatus: UgaviLogisticsStatus;
  statusHistory: any[];
  deliveryProof?: {
    receiverName?: string;
    otp?: string;
    note?: string;
    actor?: string;
    confirmedAtIso?: string;
  };
  lastScanMode?: UgaviScanMode;
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
    tabs: [OVERVIEW_TAB, FLEET_TAB, SHIPMENTS_TAB, RELAY_TAB],
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
    tabs: [OVERVIEW_TAB, FLEET_TAB, SHIPMENTS_TAB, RELAY_TAB],
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
    tabs: [OVERVIEW_TAB, FLEET_TAB, SHIPMENTS_TAB, RELAY_TAB],
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
    tabs: [OVERVIEW_TAB, FLEET_TAB, SHIPMENTS_TAB, RELAY_TAB],
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
    tabs: [OVERVIEW_TAB, FLEET_TAB, SHIPMENTS_TAB, RELAY_TAB],
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
    tabs: [OVERVIEW_TAB, FLEET_TAB, SHIPMENTS_TAB, RELAY_TAB],
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
  const { location } = useDashboardLocation();
  const canRegisterPackages = !businessUser.subCategory?.startsWith('COURIER_');
  const tabs = canRegisterPackages && !roleConfig.tabs.some((tab) => tab.id === 'register')
    ? [...roleConfig.tabs, REGISTER_TAB]
    : roleConfig.tabs;
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || 'overview');
  const [activeSidebarItem, setActiveSidebarItem] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
            amountPaid: Number(data.quoteTotal || data.totalAmount || data.amountPaid || data.amount || 0),
            currency: data.currency || 'USD',
            description: data.description || '',
            logisticsStatus: (data.logisticsStatus || 'registered') as UgaviLogisticsStatus,
            statusHistory: Array.isArray(data.statusHistory) ? data.statusHistory : [],
            deliveryProof: data.deliveryProof || undefined,
            lastScanMode: data.lastScanMode || undefined,
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
  const locationLabel = location?.label || 'Yuexiu, Guangzhou, Chine';
  const hubCode = businessUser.businessId || 'CN-GZ-YX-001';
  const hubType = roleConfig.title.replace('Dashboard Ugavi — ', '') || 'Hub logistique international';
  const scannerTab = tabs.some((tab) => tab.id === 'relay') ? 'relay' : 'shipments';
  const inventoryTab = tabs.some((tab) => tab.id === 'fleet') ? 'fleet' : 'shipments';
  const selectLogisticsTab = (tab: string, sidebarItem = tab) => {
    setActiveTab(tab);
    setActiveSidebarItem(sidebarItem);
  };
  const dashboardTabs = [
    { id: 'overview', label: 'Vue d’ensemble' },
    { id: 'shipments', label: 'Colis' },
    { id: 'missions', label: 'Missions' },
    { id: 'payments', label: 'Paiements' },
    { id: 'reports', label: 'Rapports' },
  ];
  const visibleQuickActions = [
    {
      label: 'Nouveau colis',
      description: 'Créer un colis',
      tab: canRegisterPackages ? 'register' : 'shipments',
      id: 'new-package',
      icon: PackagePlus,
      accent: 'orange',
    },
    {
      label: 'Scanner QR',
      description: 'Scanner un code',
      tab: scannerTab,
      id: 'labels',
      icon: ScanLine,
      accent: 'green',
    },
    {
      label: 'Missions',
      description: 'Voir missions',
      tab: 'missions',
      id: 'orders',
      icon: ClipboardCheck,
      accent: 'slate',
    },
    {
      label: 'Inventaire',
      description: 'Stock & produits',
      tab: inventoryTab,
      id: 'stock',
      icon: Warehouse,
      accent: 'green',
    },
  ];
  const sidebarSections: LogisticsSidebarSection[] = [
    {
      title: 'Pilotage',
      items: [
        { id: 'overview', label: 'Tableau de bord', tab: 'overview', icon: LayoutDashboard },
        { id: 'reports', label: 'Rapports', tab: 'reports', icon: ChartNoAxesColumnIncreasing },
      ],
    },
    {
      title: 'Entrepôts & stock',
      items: [
        { id: 'warehouses', label: 'Entrepôts', tab: inventoryTab, icon: Building2 },
        { id: 'stock', label: 'Stock', tab: inventoryTab, icon: Boxes },
        { id: 'inventory', label: 'Inventaires', tab: inventoryTab, icon: ClipboardList },
        { id: 'movements', label: 'Mouvements', tab: 'shipments', icon: PackageOpen },
      ],
    },
    {
      title: 'Opérations',
      items: [
        { id: 'receptions', label: 'Réceptions', tab: scannerTab, icon: PackageOpen },
        { id: 'orders', label: 'Commandes', tab: 'missions', icon: ClipboardCheck },
        { id: 'deliveries', label: 'Livraisons', tab: 'shipments', icon: Truck },
        { id: 'clients', label: 'Clients', tab: 'reports', icon: UsersRound },
        { id: 'labels', label: 'Étiquettes & QR', tab: scannerTab, icon: QrCode },
      ],
    },
    {
      title: 'Administration',
      items: [
        { id: 'settings', label: 'Paramètres', tab: 'reports', icon: Settings },
        { id: 'roles', label: 'Rôles & accès', tab: 'reports', icon: KeyRound },
        { id: 'audit', label: "Journal d'audit", tab: 'reports', icon: FileText },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#f7fbf9] pb-24 text-slate-950">
      <div className="sticky top-0 z-30 bg-primary text-white shadow-[0_14px_34px_rgba(50,187,120,0.28)]">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4">
          <button type="button" className="flex min-w-0 items-center gap-2 rounded-full bg-white/10 px-2.5 py-2 text-left ring-1 ring-white/12">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/16">
              <MapPinIcon size={18} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-black">{locationLabel}</span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-white/85" />
          </button>

          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-full bg-white/12 ring-1 ring-white/15 transition hover:bg-white/18"
              aria-label="Ouvrir le menu logistique"
            >
              <Menu className="h-5 w-5" />
            </button>
            <button type="button" className="relative grid h-10 w-10 place-items-center rounded-full bg-white/12 ring-1 ring-white/15">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-primary bg-[#f59e0b]" />
            </button>
            <button type="button" className="flex items-center gap-1">
              <span className="grid h-11 w-11 place-items-center rounded-full border-2 border-white bg-white text-base font-black text-primary shadow-sm">
                {businessUser.businessName?.slice(0, 1)?.toUpperCase() || 'U'}
              </span>
              <ChevronDown className="h-4 w-4 text-white/85" />
            </button>
          </div>
        </div>
      </div>

      <LogisticsSideDrawer
        open={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        businessName={businessUser.businessName}
        hubType={hubType}
        hubCode={hubCode}
        activeItem={activeSidebarItem}
        sections={sidebarSections}
        onSelect={(item) => {
          selectLogisticsTab(item.tab, item.id);
          setIsSidebarOpen(false);
        }}
      />

      <div className="mx-auto max-w-5xl space-y-4 px-4 py-4">
        <LogisticsHubCard
          businessName={businessUser.businessName}
          hubType={hubType}
          hubCode={hubCode}
          onScan={() => selectLogisticsTab(scannerTab, 'labels')}
        />

        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {visibleQuickActions.map((action) => (
            <LogisticsActionCard
              key={action.label}
              label={action.label}
              description={action.description}
              icon={action.icon}
              accent={action.accent}
              onClick={() => selectLogisticsTab(action.tab, action.id)}
            />
          ))}
        </div>

        <LogisticsSegmentTabs tabs={dashboardTabs} activeTab={activeTab} setActiveTab={(tab) => selectLogisticsTab(tab, tab)} />

        {activeTab === 'overview' && <LogisticsOverview stats={liveStats} capabilities={roleConfig.capabilities} shipments={shipments} setActiveTab={setActiveTab} />}
        {activeTab === 'fleet' && <LogisticsFleet title={roleConfig.fleetTitle} emptyState={roleConfig.fleetEmptyState} businessUser={businessUser} mode={activeSidebarItem} />}
        {activeTab === 'shipments' && <LogisticsShipments title={roleConfig.shipmentsTitle} emptyState={roleConfig.shipmentsEmptyState} businessUser={businessUser} shipments={shipments} isLoading={isShipmentsLoading} mode={activeSidebarItem} />}
        {activeTab === 'missions' && <LogisticsShipments title="Missions actives" emptyState="Aucune mission active pour le moment" businessUser={businessUser} shipments={shipments} isLoading={isShipmentsLoading} mode={activeSidebarItem} />}
        {activeTab === 'payments' && <LogisticsPaymentsPanel shipments={shipments} />}
        {activeTab === 'reports' && <LogisticsReportsPanel shipments={shipments} setActiveTab={setActiveTab} mode={activeSidebarItem} />}
        {activeTab === 'relay' && <RelayScanner title={roleConfig.relayTitle} description={roleConfig.relayDescription} businessUser={businessUser} />}
        {activeTab === 'register' && <AgencyPackageRegistration businessUser={businessUser} />}
      </div>
    </div>
  );
}

function LogisticsSideDrawer({
  open,
  onClose,
  businessName,
  hubType,
  hubCode,
  activeItem,
  sections,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  businessName: string;
  hubType: string;
  hubCode: string;
  activeItem: string;
  sections: LogisticsSidebarSection[];
  onSelect: (item: LogisticsSidebarItem) => void;
}) {
  return (
    <div
      className={`fixed inset-0 z-[90] transition ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="Fermer le menu logistique"
        onClick={onClose}
        className={`absolute inset-0 bg-slate-950/30 backdrop-blur-[2px] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
      />

      <aside
        className={`absolute left-0 top-0 flex h-full w-[min(88vw,390px)] flex-col overflow-hidden bg-white shadow-[26px_0_70px_rgba(15,23,42,0.18)] transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="h-1.5 bg-[linear-gradient(90deg,#009058_0%,#009058_42%,#f59e0b_72%,#e11d48_100%)]" />

        <header className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl bg-primary/10 shadow-sm ring-1 ring-primary/10">
              <UgaviIcon size={64} className="h-16 w-16" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.32em] text-slate-400">Logistique</p>
              <h2 className="mt-1 truncate text-xl font-black leading-tight text-slate-950">{businessName || 'Logistique WMS'}</h2>
              <p className="mt-1 truncate text-xs font-bold text-primary">{hubType}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-50 text-slate-500 ring-1 ring-slate-100 transition hover:bg-primary/10 hover:text-primary"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="border-b border-slate-100 px-5 py-3">
          <div className="inline-flex max-w-full items-center gap-2 rounded-full bg-primary/8 px-3 py-1.5 text-xs font-black text-primary ring-1 ring-primary/10">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span className="truncate">{hubCode}</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-5">
          <div className="space-y-7">
            {sections.map((section) => (
              <section key={section.title}>
                <p className="px-2 text-[11px] font-black uppercase tracking-[0.32em] text-slate-400">{section.title}</p>
                <div className="mt-3 space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeItem === item.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onSelect(item)}
                        className={`relative flex h-12 w-full items-center gap-4 rounded-xl px-3 text-left transition ${
                          isActive
                            ? 'bg-primary/8 text-primary shadow-sm ring-1 ring-primary/10'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                        }`}
                      >
                        <Icon className={`h-8 w-8 shrink-0 ${isActive ? 'text-primary' : 'text-slate-500'}`} />
                        <span className="truncate text-[15px] font-bold">{item.label}</span>
                        {isActive && <span className="ml-auto h-7 w-1 rounded-full bg-primary" />}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </nav>
      </aside>
    </div>
  );
}

function LogisticsHubCard({
  businessName,
  hubType,
  hubCode,
  onScan,
}: {
  businessName: string;
  hubType: string;
  hubCode: string;
  onScan: () => void;
}) {
  return (
    <section className="relative overflow-hidden rounded-[1.6rem] bg-[linear-gradient(135deg,#007a3d_0%,#006b3a_48%,#00582f_100%)] p-5 text-white shadow-[0_18px_40px_rgba(0,122,61,0.22)] sm:p-6">
      <div className="absolute inset-y-0 right-0 w-[58%] opacity-28">
        <LogisticsWorldMap />
      </div>
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-4">
          <div className="grid h-[110px] w-[110px] shrink-0 place-items-center rounded-[1.65rem] bg-white shadow-[0_14px_28px_rgba(0,0,0,0.16)]">
            <UgaviIcon size={86} className="h-[86px] w-[86px]" />
          </div>
          <div className="min-w-0 pt-1">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#009058]">UGAVI BUSINESS</p>
            <h1 className="mt-1 line-clamp-2 text-[1.55rem] font-black leading-[1.05] tracking-tight text-white sm:text-3xl">
              {businessName || 'FIVE GOO Logistics Hub'}
            </h1>
            <p className="mt-2 truncate text-sm font-semibold text-white/78">{hubType || 'Hub logistique international'}</p>
            <span className="mt-3 inline-flex rounded-xl bg-white/10 px-3 py-1 text-xs font-bold text-white/82 ring-1 ring-white/12">
              {hubCode}
            </span>
          </div>
        </div>
        <span className="hidden shrink-0 items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 text-sm font-black text-white ring-1 ring-white/12 sm:inline-flex">
          <span className="h-2.5 w-2.5 rounded-full bg-[#009058]" />
          Hub actif
        </span>
      </div>

      <div className="relative z-10 mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onScan}
          className="inline-flex h-14 min-w-[13rem] items-center justify-center gap-3 rounded-2xl bg-white px-5 text-sm font-black text-primary shadow-[0_14px_24px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_32px_rgba(0,0,0,0.2)]"
        >
          <ScanLine className="h-8 w-8" />
          Scanner QR
        </button>
        <span className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 text-xs font-bold text-white/85 ring-1 ring-white/12 sm:hidden">
          <span className="h-2.5 w-2.5 rounded-full bg-[#009058]" />
          Hub actif
        </span>
      </div>
    </section>
  );
}

function LogisticsWorldMap() {
  return (
    <svg className="h-full w-full" viewBox="0 0 420 240" fill="none" aria-hidden="true">
      <path d="M42 86c24-24 64-28 96-13 18 8 27 23 49 19 34-6 58-32 93-24 32 7 52 32 80 47" stroke="white" strokeWidth="2" strokeDasharray="4 7" opacity=".72" />
      <path d="M66 65c37-33 88-27 113 0 18 20 20 45 53 42 31-3 44-29 74-22 24 6 43 27 61 44" stroke="white" strokeWidth="1.2" opacity=".14" />
      <path d="M76 102c14-15 40-15 56-5 22 14 30 39 64 35 44-5 66-48 112-34 27 8 45 32 62 51" stroke="white" strokeWidth="1.2" opacity=".12" />
      <circle cx="118" cy="79" r="12" fill="white" opacity=".12" />
      <circle cx="118" cy="79" r="5" fill="white" opacity=".68" />
      <circle cx="324" cy="130" r="14" fill="white" opacity=".12" />
      <circle cx="324" cy="130" r="5" fill="white" opacity=".68" />
      <g transform="translate(206 112)">
        <rect x="0" y="0" width="30" height="24" rx="6" fill="#f59e0b" />
        <path d="M3 8h24M15 0v24" stroke="#fff7ed" strokeWidth="2" opacity=".75" />
      </g>
      <path d="M34 150c25 10 56 12 87 2 22-7 38-8 57 3 27 16 56 17 86 2 24-12 55-12 92 4" stroke="white" strokeWidth="1" opacity=".1" />
    </svg>
  );
}

function LogisticsActionCard({
  label,
  description,
  icon: Icon,
  accent,
  onClick,
}: {
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  accent: string;
  onClick: () => void;
}) {
  const tone = accent === 'orange'
    ? 'bg-[#fff7ed] text-[#FFA500]'
    : accent === 'slate'
      ? 'bg-slate-100 text-slate-700'
      : 'bg-primary/10 text-primary';

  return (
    <button
      type="button"
      onClick={onClick}
      className="group min-h-[8.9rem] rounded-[1.35rem] bg-white p-3 text-center shadow-[0_10px_24px_rgba(15,23,42,0.07)] ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(15,23,42,0.1)] sm:min-h-[9.5rem] sm:p-4"
    >
      <span className={`mx-auto grid h-[78px] w-[78px] place-items-center rounded-[24px] ${tone} transition group-hover:scale-105 sm:h-[88px] sm:w-[88px]`}>
        <Icon className="h-[58px] w-[58px] sm:h-[66px] sm:w-[66px]" />
      </span>
      <span className="mt-3 block text-[12px] font-black leading-tight text-slate-950 sm:text-sm">{label}</span>
      <span className="mt-1 block text-[10px] font-semibold leading-tight text-slate-500 sm:text-xs">{description}</span>
    </button>
  );
}

function LogisticsSegmentTabs({
  tabs,
  activeTab,
  setActiveTab,
}: {
  tabs: { id: string; label: string }[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => setActiveTab(tab.id)}
          className={`h-11 rounded-full px-2 text-[11px] font-black shadow-[0_8px_18px_rgba(15,23,42,0.06)] transition sm:text-sm ${
            activeTab === tab.id
              ? 'bg-primary text-white'
              : 'bg-white text-slate-500 ring-1 ring-slate-100 hover:text-primary'
          }`}
        >
          <span className="block truncate">{tab.label}</span>
        </button>
      ))}
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
      return `<rect x="${x}" y="12" width="${width}" height="72" fill="#009058" />`;
    })
    .join('');
  const safeLabel = label.replace(/[<>&"]/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="430" height="140" viewBox="0 0 430 140"><rect width="430" height="140" rx="16" fill="#ffffff"/><rect x="8" y="8" width="414" height="124" rx="12" fill="#009058" stroke="#009058"/>${bars}<text x="215" y="114" text-anchor="middle" font-family="monospace" font-size="18" font-weight="700" fill="#009058">${safeLabel}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

function escapeReceiptValue(value: unknown) {
  return String(value ?? '').replace(/[<>&"]/g, '');
}

function parsePackagePayload(payload: string) {
  try {
    return JSON.parse(payload) as Record<string, any>;
  } catch {
    return {};
  }
}

function buildMaritimeReceiptHtml(packageData: {
  trackingNumber: string;
  qrCodeUrl: string;
  barcodeUrl: string;
  payload: string;
}) {
  const payload = parsePackagePayload(packageData.payload);
  const paidAt = new Date().toLocaleDateString('fr-FR');
  const money = (value: unknown) => `${escapeReceiptValue(value || 0)} ${escapeReceiptValue(payload.currency || 'USD')}`;
  const row = (label: string, value: unknown) => `
    <tr>
      <td>${label}</td>
      <td>${money(value)}</td>
    </tr>
  `;
  const importantMarks = [
    payload.parcelCategory === 'Fragile' ? 'FRAGILE' : '',
    'HAUT / BAS',
    'NE PAS MOUILLER',
    'À MANIPULER AVEC SOIN',
    'À VÉRIFIER À L’ARRIVÉE',
  ].filter(Boolean);

  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>Reçu maritime ${packageData.trackingNumber}</title>
      <style>
        * { box-sizing: border-box; }
        body { margin: 0; padding: 24px; font-family: Arial, sans-serif; color: #0f172a; background: #f8fafc; }
        .sheet { max-width: 860px; margin: 0 auto 22px; border: 1px solid #dbe7df; border-radius: 22px; background: #ffffff; overflow: hidden; }
        .header { padding: 22px 26px; color: #ffffff; background: linear-gradient(135deg, #009058, #009058); }
        .header h1 { margin: 0; font-size: 24px; letter-spacing: .02em; }
        .header p { margin: 7px 0 0; font-size: 13px; opacity: .9; }
        .content { padding: 22px 26px; }
        .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
        .box { border: 1px solid #e2e8f0; border-radius: 16px; padding: 14px; background: #fff; }
        .box h2 { margin: 0 0 10px; font-size: 13px; color: #009058; text-transform: uppercase; letter-spacing: .08em; }
        .line { margin: 6px 0; font-size: 12px; line-height: 1.45; }
        .line strong { color: #111827; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        td { padding: 9px 10px; border-bottom: 1px solid #e2e8f0; }
        td:last-child { text-align: right; font-weight: 800; color: #009058; }
        .total td { background: #009058; font-size: 13px; font-weight: 900; }
        .signatures { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 18px; }
        .signature { min-height: 70px; border: 1px dashed #94a3b8; border-radius: 14px; padding: 10px; font-size: 11px; color: #475569; }
        .label-sheet { max-width: 560px; }
        .label-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 18px; color: #ffffff; background: #009058; }
        .tracking { font-family: monospace; font-size: 18px; font-weight: 900; }
        .code-grid { display: grid; grid-template-columns: 170px 1fr; gap: 14px; align-items: center; }
        .qr { width: 160px; height: 160px; border: 1px solid #e2e8f0; border-radius: 16px; padding: 8px; background: #fff; }
        .barcode { width: 100%; max-height: 110px; object-fit: contain; border: 1px solid #e2e8f0; border-radius: 14px; padding: 8px; background: #fff; }
        .marks { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-top: 12px; }
        .mark { border: 1px solid #009058; border-radius: 12px; background: #009058; padding: 8px; font-size: 11px; font-weight: 800; color: #009058; }
        .note { margin-top: 14px; border-radius: 14px; background: #f8fafc; padding: 12px; font-size: 11px; line-height: 1.5; color: #475569; }
        @media print {
          body { padding: 0; background: #fff; }
          .sheet { break-inside: avoid; page-break-inside: avoid; border-radius: 0; margin: 0 auto 18px; }
          .label-sheet { width: 10cm; min-height: 15cm; }
        }
      </style>
    </head>
    <body>
      <section class="sheet">
        <div class="header">
          <h1>FACTURE / REÇU DE PAIEMENT</h1>
          <p>Entrepôt Logistique International – Expédition Maritime</p>
        </div>
        <div class="content">
          <div class="grid">
            <div class="box">
              <h2>Références</h2>
              <p class="line"><strong>N° Facture / Reçu:</strong> ${escapeReceiptValue(payload.invoiceNumber)}</p>
              <p class="line"><strong>N° Enregistrement Colis:</strong> ${escapeReceiptValue(packageData.trackingNumber)}</p>
              <p class="line"><strong>Date de paiement:</strong> ${paidAt}</p>
              <p class="line"><strong>Nom de l’agent:</strong> ${escapeReceiptValue(payload.agentName || payload.agencyName)}</p>
              <p class="line"><strong>Entrepôt / Ville:</strong> ${escapeReceiptValue(payload.warehouseSite || payload.origin)}</p>
            </div>
            <div class="box">
              <h2>Client</h2>
              <p class="line"><strong>Nom complet / Société:</strong> ${escapeReceiptValue(payload.senderName)}</p>
              <p class="line"><strong>Téléphone:</strong> ${escapeReceiptValue(payload.senderPhone)}</p>
              <p class="line"><strong>Email:</strong> ${escapeReceiptValue(payload.senderEmail)}</p>
              <p class="line"><strong>Pays / Ville:</strong> ${escapeReceiptValue(payload.senderCountry)} / ${escapeReceiptValue(payload.senderCity)}</p>
            </div>
          </div>

          <div class="box" style="margin-top:14px">
            <h2>Informations du colis</h2>
            <div class="grid">
              <p class="line"><strong>Nombre de colis:</strong> ${escapeReceiptValue(payload.quantity)}</p>
              <p class="line"><strong>Type de colis:</strong> ${escapeReceiptValue(payload.packagingType || payload.parcelCategory)}</p>
              <p class="line"><strong>Poids total:</strong> ${escapeReceiptValue(payload.weight)} kg</p>
              <p class="line"><strong>Volume / CBM:</strong> ${escapeReceiptValue(payload.totalVolume)}</p>
              <p class="line"><strong>Description courte:</strong> ${escapeReceiptValue(payload.description || payload.parcelName)}</p>
              <p class="line"><strong>Destination:</strong> ${escapeReceiptValue(payload.finalDestination || payload.destination)}</p>
              <p class="line"><strong>Port d’arrivée:</strong> ${escapeReceiptValue(payload.arrivalPort)}</p>
            </div>
          </div>

          <div class="box" style="margin-top:14px">
            <h2>Détails du paiement</h2>
            <table>
              ${row('Frais d’enregistrement', payload.registrationFee)}
              ${row('Frais d’entreposage', payload.storageFee)}
              ${row('Frais d’emballage / renforcement', payload.packagingFee)}
              ${row('Frais d’expédition maritime', payload.freight)}
              ${row('Frais de manutention', payload.handlingFee)}
              ${row('Autres frais', payload.otherFees)}
              <tr class="total"><td>Total à payer</td><td>${money(payload.quoteTotal)}</td></tr>
              <tr><td>Montant payé</td><td>${money(payload.amountPaid)}</td></tr>
              <tr><td>Solde restant</td><td>${money(payload.remainingBalance)}</td></tr>
            </table>
            <p class="line"><strong>Devise:</strong> ${escapeReceiptValue(payload.currency)}</p>
            <p class="line"><strong>Mode de paiement:</strong> ${escapeReceiptValue(payload.paymentMethod)}</p>
            <p class="line"><strong>Référence paiement:</strong> ${escapeReceiptValue(payload.paymentReference)}</p>
          </div>

          <div class="box" style="margin-top:14px">
            <h2>Observation et déclaration</h2>
            <p class="line">${escapeReceiptValue(payload.agentRemarks || 'Aucune observation particulière.')}</p>
            <p class="note">Le client reconnaît avoir payé les frais mentionnés ci-dessus pour l’enregistrement, l’entreposage ou l’expédition maritime de son colis. Les frais de douane, taxes, surestaries, pénalités portuaires ou frais supplémentaires à destination restent à la charge du client, sauf accord écrit contraire.</p>
            <div class="signatures">
              <div class="signature">Signature client<br/><br/>${escapeReceiptValue(payload.clientSignatureName || payload.senderName)}</div>
              <div class="signature">Signature agent<br/><br/>${escapeReceiptValue(payload.agentName || payload.agencyName)}</div>
              <div class="signature">Cachet de l’entrepôt</div>
            </div>
          </div>
        </div>
      </section>

      <section class="sheet label-sheet">
        <div class="label-header">
          <div>
            <h1 style="margin:0;font-size:18px">ÉTIQUETTE COLIS</h1>
            <p style="margin:4px 0 0;font-size:12px">EXPÉDITION MARITIME</p>
          </div>
          <div class="tracking">${escapeReceiptValue(packageData.trackingNumber)}</div>
        </div>
        <div class="content">
          <div class="grid">
            <div class="box">
              <h2>Expéditeur</h2>
              <p class="line"><strong>Nom / Société:</strong> ${escapeReceiptValue(payload.senderName)}</p>
              <p class="line"><strong>Téléphone:</strong> ${escapeReceiptValue(payload.senderPhone)}</p>
              <p class="line"><strong>Ville / Pays:</strong> ${escapeReceiptValue(payload.senderCity)} / ${escapeReceiptValue(payload.senderCountry)}</p>
            </div>
            <div class="box">
              <h2>Destinataire</h2>
              <p class="line"><strong>Nom / Société:</strong> ${escapeReceiptValue(payload.receiverName)}</p>
              <p class="line"><strong>Téléphone:</strong> ${escapeReceiptValue(payload.receiverPhone)}</p>
              <p class="line"><strong>Adresse:</strong> ${escapeReceiptValue(payload.receiverAddress)}</p>
              <p class="line"><strong>Ville / Pays:</strong> ${escapeReceiptValue(payload.receiverCity)} / ${escapeReceiptValue(payload.receiverCountry)}</p>
            </div>
          </div>
          <div class="box" style="margin-top:14px">
            <h2>Détails colis</h2>
            <p class="line"><strong>Nombre:</strong> Colis ${escapeReceiptValue(payload.quantity)} / ${escapeReceiptValue(payload.quantity)}</p>
            <p class="line"><strong>Poids:</strong> ${escapeReceiptValue(payload.weight)} kg | <strong>Volume:</strong> ${escapeReceiptValue(payload.totalVolume)} CBM</p>
            <p class="line"><strong>Dimensions:</strong> L ${escapeReceiptValue(payload.lengthCm)} cm × l ${escapeReceiptValue(payload.widthCm)} cm × H ${escapeReceiptValue(payload.heightCm)} cm</p>
            <p class="line"><strong>Type:</strong> ${escapeReceiptValue(payload.packagingType || payload.parcelCategory)}</p>
            <p class="line"><strong>Description:</strong> ${escapeReceiptValue(payload.description || payload.parcelName)}</p>
          </div>
          <div class="box" style="margin-top:14px">
            <h2>Transport</h2>
            <p class="line"><strong>Mode:</strong> Bateau / Maritime</p>
            <p class="line"><strong>Port de départ:</strong> ${escapeReceiptValue(payload.departurePort)}</p>
            <p class="line"><strong>Port d’arrivée:</strong> ${escapeReceiptValue(payload.arrivalPort)}</p>
            <p class="line"><strong>Destination finale:</strong> ${escapeReceiptValue(payload.finalDestination || payload.destination)}</p>
            <div class="marks">${importantMarks.map((mark) => `<div class="mark">☐ ${escapeReceiptValue(mark)}</div>`).join('')}</div>
          </div>
          <div class="box" style="margin-top:14px">
            <h2>Code de suivi</h2>
            <div class="code-grid">
              <img class="qr" src="${packageData.qrCodeUrl}" alt="QR Code" />
              <img class="barcode" src="${packageData.barcodeUrl}" alt="Code-barres" />
            </div>
            <p class="line"><strong>Contact entrepôt:</strong> ${escapeReceiptValue(payload.warehouseContact || payload.warehouseSite)}</p>
            <p class="line"><strong>Téléphone:</strong> ${escapeReceiptValue(payload.warehousePhone)}</p>
            <p class="note">Format recommandé: A6 ou 10 cm × 15 cm. Protéger l’étiquette contre l’humidité pendant le transport maritime.</p>
          </div>
        </div>
      </section>
    </body>
  </html>`;
}

function downloadPackageLabel(packageData: {
  trackingNumber: string;
  qrCodeUrl: string;
  barcodeUrl: string;
  payload: string;
}) {
  const html = buildMaritimeReceiptHtml(packageData);
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  downloadDataUrl(url, `${packageData.trackingNumber}-recu-et-etiquette.html`);
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
  printWindow.document.write(
    buildMaritimeReceiptHtml(packageData).replace('</body>', '<script>window.onload = () => { window.print(); };</script></body>'),
  );
  printWindow.document.close();
}

const SHIPMENT_TYPES = [
  { value: 'national', label: 'National' },
  { value: 'international', label: 'International' },
] as const;

const TRANSPORT_CATEGORIES = [
  { value: 'boat', label: 'Bateau', method: 'CBM', baseRate: 120 },
  { value: 'air', label: 'Avion', method: 'Kg volumetrique', baseRate: 8.5 },
  { value: 'train', label: 'Train', method: 'Kg + distance', baseRate: 3.2 },
  { value: 'bus', label: 'Bus', method: 'Kg', baseRate: 2.2 },
  { value: 'vehicle', label: 'Vehicule', method: 'Distance + poids', baseRate: 2.8 },
  { value: 'moto', label: 'Moto', method: 'Petit colis', baseRate: 1.6 },
  { value: 'bike', label: 'Velo', method: 'Livraison locale', baseRate: 1.1 },
  { value: 'foot', label: 'Pieton', method: 'Ultra local', baseRate: 0.8 },
] as const;

const PARCEL_CATEGORIES = ['Document', 'Aliment', 'Electronique', 'Vetement', 'Marchandise', 'Fragile'];
const PACKAGING_TYPES = ['Carton', 'Sac', 'Palette', 'Conteneur'];
const CURRENCIES = ['USD', 'CDF', 'RMB', 'EUR'];
const MARITIME_SERVICE_TYPES = [
  'Groupage maritime',
  'Conteneur complet',
  'Livraison jusqu’au port',
  'Livraison jusqu’à l’entrepôt de destination',
  'Livraison à domicile',
  'Autre',
];
const PACKAGE_CONDITION_OPTIONS = [
  'Bon état',
  'Carton abîmé',
  'Colis ouvert',
  'Colis fragile',
  'Emballage insuffisant',
  'À renforcer avant expédition',
  'Autre observation',
];
const WAREHOUSE_PAYMENT_METHODS = ['Espèces', 'Virement bancaire', 'Mobile Money', 'WeChat Pay', 'Alipay', 'Autre'];
const SHIPPING_DOCUMENTS = [
  'Facture commerciale',
  'Liste de colisage',
  'Reçu d’achat',
  'Copie pièce d’identité',
  'Document douanier',
  'Aucun document',
  'Autre',
];
const CONTAINER_TYPES = [
  { value: 'none', label: 'Sans conteneur', volume: 0 },
  { value: '20ft', label: '20 pieds', volume: 33 },
  { value: '40ft', label: '40 pieds', volume: 67 },
  { value: '40hc', label: '40 HC', volume: 76 },
] as const;

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundMetric(value: number, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function calculateFreightQuote(params: {
  transportCategory: string;
  cbm: number;
  volumetricWeight: number;
  realWeight: number;
  distanceKm: number;
  insuranceEnabled: boolean;
  homeDeliveryEnabled: boolean;
}) {
  const chargeableWeight = Math.max(params.realWeight, params.volumetricWeight);
  let freight = 0;

  if (params.transportCategory === 'boat') freight = params.cbm * 120;
  else if (params.transportCategory === 'air') freight = chargeableWeight * 8.5;
  else if (params.transportCategory === 'train') freight = params.realWeight * 3.2 + params.distanceKm * 0.08;
  else if (params.transportCategory === 'bus') freight = params.realWeight * 2.2;
  else if (params.transportCategory === 'vehicle') freight = params.distanceKm * 0.45 + params.realWeight * 2.8;
  else if (params.transportCategory === 'moto') freight = 4 + params.realWeight * 1.6;
  else if (params.transportCategory === 'bike') freight = 2.5 + params.realWeight * 1.1;
  else freight = 1.5 + params.realWeight * 0.8;

  const insurance = params.insuranceEnabled ? Math.max(freight * 0.05, 1) : 0;
  const homeDelivery = params.homeDeliveryEnabled ? 3 : 0;
  const taxes = freight * 0.08;
  return {
    freight: roundMetric(freight),
    insurance: roundMetric(insurance),
    homeDelivery: roundMetric(homeDelivery),
    taxes: roundMetric(taxes),
    total: roundMetric(freight + insurance + homeDelivery + taxes),
    chargeableWeight: roundMetric(chargeableWeight),
  };
}

function AgencyPackageRegistration({ businessUser }: { businessUser: BusinessUser }) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const defaultShipmentType = businessUser.subCategory === 'INTERNATIONAL_AGENCY' ? 'international' : 'national';
  const defaultTransportCategory = businessUser.subCategory === 'INTERNATIONAL_AGENCY' ? 'boat' : 'vehicle';
  const [shipmentType, setShipmentType] = useState(defaultShipmentType);
  const [transportCategory, setTransportCategory] = useState(defaultTransportCategory);
  const [agencyName, setAgencyName] = useState(businessUser.businessName || '');
  const [agentName, setAgentName] = useState('');
  const [warehouseSite, setWarehouseSite] = useState(businessUser.businessName || '');
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [senderAddress, setSenderAddress] = useState('');
  const [senderCountry, setSenderCountry] = useState('');
  const [senderCity, setSenderCity] = useState('');
  const [senderIdFile, setSenderIdFile] = useState<File | null>(null);
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [receiverEmail, setReceiverEmail] = useState('');
  const [receiverAddress, setReceiverAddress] = useState('');
  const [receiverCountry, setReceiverCountry] = useState('');
  const [receiverCity, setReceiverCity] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [parcelName, setParcelName] = useState('');
  const [parcelCategory, setParcelCategory] = useState(PARCEL_CATEGORIES[0]);
  const [quantity, setQuantity] = useState('1');
  const [declaredValue, setDeclaredValue] = useState('');
  const [declaredValueCurrency, setDeclaredValueCurrency] = useState('USD');
  const [packagingType, setPackagingType] = useState(PACKAGING_TYPES[0]);
  const [weight, setWeight] = useState('');
  const [lengthCm, setLengthCm] = useState('');
  const [widthCm, setWidthCm] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [distanceKm, setDistanceKm] = useState('');
  const [containerType, setContainerType] = useState('none');
  const [billingCurrency, setBillingCurrency] = useState('USD');
  const [insuranceEnabled, setInsuranceEnabled] = useState(false);
  const [homeDeliveryEnabled, setHomeDeliveryEnabled] = useState(false);
  const [paymentAtDestinationEnabled, setPaymentAtDestinationEnabled] = useState(false);
  const [digitalSignatureRequired, setDigitalSignatureRequired] = useState(true);
  const [idScanRequired, setIdScanRequired] = useState(true);
  const [trackingHistoryEnabled, setTrackingHistoryEnabled] = useState(true);
  const [description, setDescription] = useState('');
  const [packageCondition, setPackageCondition] = useState(PACKAGE_CONDITION_OPTIONS[0]);
  const [photosTakenAtReception, setPhotosTakenAtReception] = useState(true);
  const [agentRemarks, setAgentRemarks] = useState('');
  const [maritimeServiceType, setMaritimeServiceType] = useState(MARITIME_SERVICE_TYPES[0]);
  const [departurePort, setDeparturePort] = useState('');
  const [arrivalPort, setArrivalPort] = useState('');
  const [finalDestination, setFinalDestination] = useState('');
  const [registrationFee, setRegistrationFee] = useState('');
  const [storageFee, setStorageFee] = useState('');
  const [packagingFee, setPackagingFee] = useState('');
  const [otherFees, setOtherFees] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(WAREHOUSE_PAYMENT_METHODS[0]);
  const [paymentReference, setPaymentReference] = useState('');
  const [providedDocuments, setProvidedDocuments] = useState<string[]>([]);
  const [otherDocument, setOtherDocument] = useState('');
  const [clientDeclarationAccepted, setClientDeclarationAccepted] = useState(false);
  const [clientSignatureName, setClientSignatureName] = useState('');
  const [warehouseReceiverName, setWarehouseReceiverName] = useState('');
  const [warehouseReceiverRole, setWarehouseReceiverRole] = useState('');
  const [warehouseContact, setWarehouseContact] = useState('');
  const [warehousePhone, setWarehousePhone] = useState('');
  const [warehouseEmail, setWarehouseEmail] = useState('');
  const [warehouseAddress, setWarehouseAddress] = useState('');
  const [packagePhoto, setPackagePhoto] = useState<File | null>(null);
  const [packagePhotoPreview, setPackagePhotoPreview] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [registeredPackage, setRegisteredPackage] = useState<{
    trackingNumber: string;
    invoiceNumber: string;
    totalLabel: string;
    parcelLabel: string;
    qrCodeUrl: string;
    barcodeUrl: string;
    payload: string;
    requestId: string;
  } | null>(null);

  const lengthValue = toNumber(lengthCm);
  const widthValue = toNumber(widthCm);
  const heightValue = toNumber(heightCm);
  const weightValue = toNumber(weight);
  const quantityValue = Math.max(1, toNumber(quantity) || 1);
  const cbm = roundMetric((lengthValue * widthValue * heightValue) / 1000000, 3);
  const volumetricWeight = roundMetric((lengthValue * widthValue * heightValue) / 6000, 2);
  const selectedContainer = CONTAINER_TYPES.find((container) => container.value === containerType) || CONTAINER_TYPES[0];
  const totalVolume = roundMetric(cbm * quantityValue, 3);
  const totalWeight = roundMetric(weightValue * quantityValue, 2);
  const containerOccupancy = selectedContainer.volume ? roundMetric((totalVolume / selectedContainer.volume) * 100, 1) : 0;
  const containerRemaining = selectedContainer.volume ? roundMetric(Math.max(selectedContainer.volume - totalVolume, 0), 3) : 0;
  const selectedTransport = TRANSPORT_CATEGORIES.find((transport) => transport.value === transportCategory) || TRANSPORT_CATEGORIES[4];
  const quote = calculateFreightQuote({
    transportCategory,
    cbm: totalVolume,
    volumetricWeight,
    realWeight: totalWeight,
    distanceKm: toNumber(distanceKm),
    insuranceEnabled,
    homeDeliveryEnabled,
  });
  const extraFeesTotal = roundMetric(toNumber(registrationFee) + toNumber(storageFee) + toNumber(packagingFee) + toNumber(otherFees));
  const quoteTotal = roundMetric(quote.total + extraFeesTotal);
  const remainingBalance = roundMetric(Math.max(quoteTotal - toNumber(amountPaid), 0));
  const isMaritimeWarehouseForm = shipmentType === 'international' && transportCategory === 'boat';

  const canSubmit = senderName && senderPhone && receiverName && receiverPhone && origin && destination && parcelName && weight && lengthCm && widthCm && heightCm && packagePhoto && (!isMaritimeWarehouseForm || clientDeclarationAccepted);

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
      const invoiceNumber = `FAC-${trackingNumber}`;
      const photoUpload = await uploadToCloudinary(packagePhoto, 'image');
      const senderIdUpload = senderIdFile ? await uploadToCloudinary(senderIdFile, 'image') : null;
      const qrPayload = JSON.stringify({
        type: 'UGAVI_PACKAGE',
        packageNumber: trackingNumber,
        trackingNumber,
        invoiceNumber,
        shipmentType,
        transportCategory,
        transportLabel: selectedTransport.label,
        senderName,
        senderPhone,
        senderEmail,
        senderAddress,
        senderCountry,
        senderCity,
        receiverName,
        receiverPhone,
        receiverEmail,
        receiverAddress,
        receiverCountry,
        receiverCity,
        origin,
        destination,
        parcelName,
        parcelCategory,
        packagingType,
        quantity: quantityValue,
        weight: totalWeight,
        lengthCm: lengthValue,
        widthCm: widthValue,
        heightCm: heightValue,
        cbm,
        totalVolume,
        volumetricWeight,
        quoteTotal,
        freight: quote.freight,
        registrationFee: toNumber(registrationFee),
        storageFee: toNumber(storageFee),
        packagingFee: toNumber(packagingFee),
        handlingFee: 0,
        otherFees: toNumber(otherFees),
        amountPaid: toNumber(amountPaid),
        remainingBalance,
        paymentMethod,
        paymentReference,
        currency: billingCurrency,
        description,
        agentName,
        clientSignatureName,
        agentRemarks,
        warehouseSite,
        warehouseContact,
        warehousePhone,
        maritimeServiceType: isMaritimeWarehouseForm ? maritimeServiceType : null,
        departurePort: isMaritimeWarehouseForm ? departurePort : null,
        arrivalPort: isMaritimeWarehouseForm ? arrivalPort : null,
        finalDestination: isMaritimeWarehouseForm ? finalDestination || destination : destination,
        packagePhotoUrl: photoUpload.secureUrl,
        agencyName: businessUser.businessName,
        agencyId: businessUser.businessId,
      });
      const barcodeUrl = generateBarcodeDataUrl(qrPayload, trackingNumber);

      const QRCode = await import('qrcode');
      const qrCodeUrl = await (QRCode as any).toDataURL(qrPayload, {
        margin: 1,
        width: 220,
        color: { dark: '#009058', light: '#ffffff' },
      });

      const requestDoc = await addDoc(collection(db, 'ugaviRequests'), {
        source: 'agency_registration',
        agencyId: businessUser.businessId || businessUser.uid,
        agencyUserId: businessUser.uid,
        agencyName: businessUser.businessName,
        agencySubCategory: businessUser.subCategory || null,
        registrationAgent: agentName || businessUser.businessName,
        registrationAgency: agencyName || businessUser.businessName,
        warehouseSite: warehouseSite || agencyName || businessUser.businessName,
        userId: null,
        senderName,
        senderPhone,
        senderEmail,
        senderCountry,
        senderCity,
        senderFullAddress: senderAddress,
        senderIdDocumentUrl: senderIdUpload?.secureUrl || null,
        senderIdDocumentPublicId: senderIdUpload?.publicId || null,
        receiverName,
        receiverPhone,
        receiverEmail,
        receiverCountry,
        receiverCity,
        receiverFullAddress: receiverAddress,
        senderAddress: origin,
        receiverAddress: destination,
        shipmentType,
        transportCategory,
        transportCategoryLabel: selectedTransport.label,
        transportPricingMethod: selectedTransport.method,
        parcelName,
        parcelCategory,
        quantity: quantityValue,
        declaredValue: toNumber(declaredValue),
        declaredValueCurrency,
        packagingType,
        packageWeight: totalWeight,
        realWeightKg: weightValue,
        dimensions: {
          lengthCm: lengthValue,
          widthCm: widthValue,
          heightCm: heightValue,
        },
        cbm,
        totalVolumeCbm: totalVolume,
        volumetricWeightKg: volumetricWeight,
        chargeableWeightKg: quote.chargeableWeight,
        distanceKm: toNumber(distanceKm),
        container: {
          type: containerType,
          label: selectedContainer.label,
          capacityCbm: selectedContainer.volume,
          parcelCount: quantityValue,
          volumeTotalCbm: totalVolume,
          weightTotalKg: totalWeight,
          occupancyPercent: containerOccupancy,
          remainingCbm: containerRemaining,
        },
        pricing: {
          currency: billingCurrency,
          freight: quote.freight,
          insurance: quote.insurance,
          homeDelivery: quote.homeDelivery,
          taxes: quote.taxes,
          registrationFee: toNumber(registrationFee),
          storageFee: toNumber(storageFee),
          packagingFee: toNumber(packagingFee),
          otherFees: toNumber(otherFees),
          total: quoteTotal,
          method: selectedTransport.method,
        },
        payment: {
          method: paymentMethod,
          reference: paymentReference,
          amountPaid: toNumber(amountPaid),
          balance: remainingBalance,
          currency: billingCurrency,
        },
        invoice: {
          invoiceNumber,
          printable: true,
          qrCodeIncluded: true,
          barcodeIncluded: true,
        },
        options: {
          insurance: insuranceEnabled,
          homeDelivery: homeDeliveryEnabled,
          paymentAtDestination: paymentAtDestinationEnabled,
          digitalSignature: digitalSignatureRequired,
          idScan: idScanRequired,
          trackingHistory: trackingHistoryEnabled,
        },
        description,
        reception: {
          condition: packageCondition,
          photosTaken: photosTakenAtReception,
          agentRemarks,
        },
        maritimeShipping: isMaritimeWarehouseForm
          ? {
              mode: 'Expédition maritime par bateau',
              serviceType: maritimeServiceType,
              departurePort,
              arrivalPort,
              finalDestination: finalDestination || destination,
            }
          : null,
        providedDocuments,
        otherDocument,
        clientDeclaration: {
          accepted: clientDeclarationAccepted,
          clientName: clientSignatureName || senderName,
          statement: 'Le client declare que les informations fournies sont exactes et que le colis ne contient aucun produit interdit, dangereux, illicite ou non declare.',
        },
        warehouseValidation: {
          receivedBy: warehouseReceiverName,
          role: warehouseReceiverRole,
          contact: warehouseContact,
          phone: warehousePhone,
          email: warehouseEmail,
          address: warehouseAddress,
        },
        packagePhotoUrl: photoUpload.secureUrl,
        packagePhotoPublicId: photoUpload.publicId,
        serviceMode: businessUser.subCategory === 'INTERNATIONAL_AGENCY' ? 'international' : 'national',
        status: 'registered',
        paymentStatus: remainingBalance > 0 ? 'partial' : 'paid',
        amountPaid: toNumber(amountPaid),
        balanceDue: remainingBalance,
        currency: billingCurrency,
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

      setRegisteredPackage({
        trackingNumber,
        invoiceNumber,
        totalLabel: `${quoteTotal.toFixed(2)} ${billingCurrency}`,
        parcelLabel: parcelName,
        qrCodeUrl,
        barcodeUrl,
        payload: qrPayload,
        requestId: requestDoc.id,
      });
      setShipmentType(defaultShipmentType);
      setTransportCategory(defaultTransportCategory);
      setAgencyName(businessUser.businessName || '');
      setAgentName('');
      setWarehouseSite(businessUser.businessName || '');
      setSenderName('');
      setSenderPhone('');
      setSenderEmail('');
      setSenderAddress('');
      setSenderCountry('');
      setSenderCity('');
      setSenderIdFile(null);
      setReceiverName('');
      setReceiverPhone('');
      setReceiverEmail('');
      setReceiverAddress('');
      setReceiverCountry('');
      setReceiverCity('');
      setOrigin('');
      setDestination('');
      setParcelName('');
      setParcelCategory(PARCEL_CATEGORIES[0]);
      setQuantity('1');
      setDeclaredValue('');
      setDeclaredValueCurrency('USD');
      setPackagingType(PACKAGING_TYPES[0]);
      setWeight('');
      setLengthCm('');
      setWidthCm('');
      setHeightCm('');
      setDistanceKm('');
      setContainerType('none');
      setBillingCurrency('USD');
      setInsuranceEnabled(false);
      setHomeDeliveryEnabled(false);
      setPaymentAtDestinationEnabled(false);
      setDigitalSignatureRequired(true);
      setIdScanRequired(true);
      setTrackingHistoryEnabled(true);
      setDescription('');
      setPackageCondition(PACKAGE_CONDITION_OPTIONS[0]);
      setPhotosTakenAtReception(true);
      setAgentRemarks('');
      setMaritimeServiceType(MARITIME_SERVICE_TYPES[0]);
      setDeparturePort('');
      setArrivalPort('');
      setFinalDestination('');
      setRegistrationFee('');
      setStorageFee('');
      setPackagingFee('');
      setOtherFees('');
      setAmountPaid('');
      setPaymentMethod(WAREHOUSE_PAYMENT_METHODS[0]);
      setPaymentReference('');
      setProvidedDocuments([]);
      setOtherDocument('');
      setClientDeclarationAccepted(false);
      setClientSignatureName('');
      setWarehouseReceiverName('');
      setWarehouseReceiverRole('');
      setWarehouseContact('');
      setWarehousePhone('');
      setWarehouseEmail('');
      setWarehouseAddress('');
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
          <h2 className="text-2xl font-bold text-primary">Formulaire d’enregistrement de colis</h2>
          <p className="mt-1 text-sm text-slate-500">
            Entrepôt logistique international, expédition maritime, CBM, facture, QR code et code-barres.
          </p>
        </div>

        <div className="grid gap-5">
          <div className="rounded-2xl border border-primary/15 bg-primary/5/60 p-4">
            <p className="text-sm font-black text-primary">Informations generales</p>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <MetricCard label="Date" value="Auto" />
              <MetricCard label="No colis" value="Auto" />
              <MetricCard label="QR / Barcode" value="Auto" />
              <SelectField label="Type expedition" value={shipmentType} onChange={setShipmentType} options={SHIPMENT_TYPES} />
              <SelectField label="Categorie transport" value={transportCategory} onChange={setTransportCategory} options={TRANSPORT_CATEGORIES} />
              <Field label="Agent d'enregistrement" value={agentName} onChange={setAgentName} placeholder="Nom de l'agent" />
              <Field label="Agence" value={agencyName} onChange={setAgencyName} placeholder="Agence selectionnee" />
              <Field label="Site / Entrepôt" value={warehouseSite} onChange={setWarehouseSite} placeholder="Entrepôt Guangzhou, port, dépôt..." />
              <Field label="Agence / point depart" value={origin} onChange={setOrigin} placeholder="Agence Gombe, Kinshasa" />
              <Field label="Destination" value={destination} onChange={setDestination} placeholder="Ville, quartier, point relais" />
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-black text-slate-900">Expediteur</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Nom complet / Société" value={senderName} onChange={setSenderName} placeholder="Nom complet ou societe" />
                <Field label="Telephone" value={senderPhone} onChange={setSenderPhone} placeholder="+243..." />
                <Field label="Email" value={senderEmail} onChange={setSenderEmail} placeholder="email@exemple.com" />
                <Field label="Pays" value={senderCountry} onChange={setSenderCountry} placeholder="RDC" />
                <Field label="Ville" value={senderCity} onChange={setSenderCity} placeholder="Kinshasa" />
                <label className="space-y-1.5">
                  <span className="text-sm font-semibold text-slate-700">Piece / passeport / RCCM</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(event) => setSenderIdFile(event.target.files?.[0] || null)}
                    className="block h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-primary/5 file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-primary"
                  />
                </label>
                <div className="sm:col-span-2">
                  <Field label="Adresse complete" value={senderAddress} onChange={setSenderAddress} placeholder="Adresse physique de l'expediteur" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-black text-slate-900">Destinataire</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Nom complet / Société" value={receiverName} onChange={setReceiverName} placeholder="Nom complet ou societe" />
                <Field label="Telephone" value={receiverPhone} onChange={setReceiverPhone} placeholder="+243..." />
                <Field label="Email" value={receiverEmail} onChange={setReceiverEmail} placeholder="email@exemple.com" />
                <Field label="Pays" value={receiverCountry} onChange={setReceiverCountry} placeholder="RDC" />
                <Field label="Ville" value={receiverCity} onChange={setReceiverCity} placeholder="Lubumbashi" />
                <div />
                <div className="sm:col-span-2">
                  <Field label="Adresse de livraison" value={receiverAddress} onChange={setReceiverAddress} placeholder="Adresse ou agence de retrait" />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-black text-slate-900">Colis, dimensions et calcul automatique</p>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <Field label="Nom du colis" value={parcelName} onChange={setParcelName} placeholder="Documents, telephone, cartons..." />
              <SelectField label="Categorie colis" value={parcelCategory} onChange={setParcelCategory} options={PARCEL_CATEGORIES.map((item) => ({ value: item, label: item }))} />
              <SelectField label="Emballage" value={packagingType} onChange={setPackagingType} options={PACKAGING_TYPES.map((item) => ({ value: item, label: item }))} />
              <Field label="Quantite" value={quantity} onChange={setQuantity} placeholder="1" type="number" />
              <Field label="Valeur declaree" value={declaredValue} onChange={setDeclaredValue} placeholder="100" type="number" />
              <SelectField label="Devise valeur" value={declaredValueCurrency} onChange={setDeclaredValueCurrency} options={CURRENCIES.map((item) => ({ value: item, label: item }))} />
              <Field label="Longueur cm" value={lengthCm} onChange={setLengthCm} placeholder="100" type="number" />
              <Field label="Largeur cm" value={widthCm} onChange={setWidthCm} placeholder="50" type="number" />
              <Field label="Hauteur cm" value={heightCm} onChange={setHeightCm} placeholder="40" type="number" />
              <Field label="Poids reel kg" value={weight} onChange={setWeight} placeholder="2.5" type="number" />
              <Field label="Distance km" value={distanceKm} onChange={setDistanceKm} placeholder="0 si inconnu" type="number" />
              <SelectField label="Conteneur" value={containerType} onChange={setContainerType} options={CONTAINER_TYPES} />
              <div className="md:col-span-3">
                <Field label="Description" value={description} onChange={setDescription} placeholder="Contenu, fragilite, documents commerciaux, note agence" />
              </div>
            </div>
          </div>

          {isMaritimeWarehouseForm && (
            <div className="grid gap-5 xl:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-black text-slate-900">État du colis à la réception</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <SelectField
                    label="État constaté"
                    value={packageCondition}
                    onChange={setPackageCondition}
                    options={PACKAGE_CONDITION_OPTIONS.map((item) => ({ value: item, label: item }))}
                  />
                  <OptionToggle label="Photos prises" checked={photosTakenAtReception} onChange={setPhotosTakenAtReception} />
                  <div className="sm:col-span-2">
                    <Field label="Remarques de l’agent" value={agentRemarks} onChange={setAgentRemarks} placeholder="Observation, emballage à renforcer, réserve..." />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
                <p className="text-sm font-black text-primary">Mode d’expédition maritime</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <MetricCard label="Transport" value="Bateau" />
                  <SelectField
                    label="Type de service"
                    value={maritimeServiceType}
                    onChange={setMaritimeServiceType}
                    options={MARITIME_SERVICE_TYPES.map((item) => ({ value: item, label: item }))}
                  />
                  <Field label="Port de départ" value={departurePort} onChange={setDeparturePort} placeholder="Guangzhou, Shenzhen..." />
                  <Field label="Port d’arrivée" value={arrivalPort} onChange={setArrivalPort} placeholder="Matadi, Boma..." />
                  <div className="sm:col-span-2">
                    <Field label="Destination finale" value={finalDestination} onChange={setFinalDestination} placeholder="Ville, entrepôt, adresse finale" />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-4">
            <MetricCard label="CBM unitaire" value={`${cbm.toFixed(3)} CBM`} />
            <MetricCard label="Poids volumetrique" value={`${volumetricWeight.toFixed(2)} kg`} />
            <MetricCard label="Volume total" value={`${totalVolume.toFixed(3)} CBM`} />
            <MetricCard label="Poids facture" value={`${quote.chargeableWeight.toFixed(2)} kg`} />
          </div>

          <div className="rounded-2xl border border-[#FFA500]/20 bg-[#FFA500]/10 p-4">
            <div className="grid gap-3 md:grid-cols-3">
              <SelectField label="Devise facture" value={billingCurrency} onChange={setBillingCurrency} options={CURRENCIES.map((item) => ({ value: item, label: item }))} />
              <MetricCard label="Methode tarifaire" value={selectedTransport.method} />
              <MetricCard label="Total estime" value={`${quoteTotal.toFixed(2)} ${billingCurrency}`} />
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-4">
              <p className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-600">Transport: {quote.freight.toFixed(2)} {billingCurrency}</p>
              <p className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-600">Assurance: {quote.insurance.toFixed(2)} {billingCurrency}</p>
              <p className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-600">Domicile: {quote.homeDelivery.toFixed(2)} {billingCurrency}</p>
              <p className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-600">Taxes: {quote.taxes.toFixed(2)} {billingCurrency}</p>
              <p className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-600 md:col-span-2">Frais entrepôt: {extraFeesTotal.toFixed(2)} {billingCurrency}</p>
              <p className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-600 md:col-span-2">Solde restant: {remainingBalance.toFixed(2)} {billingCurrency}</p>
            </div>
            {selectedContainer.volume > 0 && (
              <div className="mt-3 rounded-xl bg-white p-3 text-sm text-slate-700">
                Occupation conteneur {selectedContainer.label}: <strong>{containerOccupancy}%</strong>, reste disponible <strong>{containerRemaining} CBM</strong>.
              </div>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <OptionToggle label="Assurance colis" checked={insuranceEnabled} onChange={setInsuranceEnabled} />
            <OptionToggle label="Livraison domicile" checked={homeDeliveryEnabled} onChange={setHomeDeliveryEnabled} />
            <OptionToggle label="Paiement destination" checked={paymentAtDestinationEnabled} onChange={setPaymentAtDestinationEnabled} />
            <OptionToggle label="Signature numerique" checked={digitalSignatureRequired} onChange={setDigitalSignatureRequired} />
            <OptionToggle label="Scan piece identite" checked={idScanRequired} onChange={setIdScanRequired} />
            <OptionToggle label="Historique tracking" checked={trackingHistoryEnabled} onChange={setTrackingHistoryEnabled} />
          </div>

          {isMaritimeWarehouseForm && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-black text-slate-900">Frais, paiement et documents</p>
              <div className="mt-3 grid gap-3 md:grid-cols-4">
                <Field label="Frais d’enregistrement" value={registrationFee} onChange={setRegistrationFee} placeholder="0" type="number" />
                <Field label="Frais d’entreposage" value={storageFee} onChange={setStorageFee} placeholder="0" type="number" />
                <Field label="Frais emballage" value={packagingFee} onChange={setPackagingFee} placeholder="0" type="number" />
                <Field label="Autres frais" value={otherFees} onChange={setOtherFees} placeholder="0" type="number" />
                <Field label="Montant payé" value={amountPaid} onChange={setAmountPaid} placeholder="0" type="number" />
                <MetricCard label="Solde" value={`${remainingBalance.toFixed(2)} ${billingCurrency}`} />
                <SelectField
                  label="Mode paiement"
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                  options={WAREHOUSE_PAYMENT_METHODS.map((item) => ({ value: item, label: item }))}
                />
                <Field label="Référence paiement" value={paymentReference} onChange={setPaymentReference} placeholder="Transaction, reçu, banque..." />
              </div>
              <div className="mt-4">
                <p className="text-sm font-semibold text-slate-700">Documents fournis</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {SHIPPING_DOCUMENTS.map((documentName) => {
                    const checked = providedDocuments.includes(documentName);
                    return (
                      <button
                        key={documentName}
                        type="button"
                        onClick={() =>
                          setProvidedDocuments((current) =>
                            checked ? current.filter((item) => item !== documentName) : [...current, documentName],
                          )
                        }
                        className={`rounded-xl border px-3 py-2 text-left text-xs font-black transition ${
                          checked ? 'border-primary/25 bg-primary/5 text-primary' : 'border-slate-200 bg-white text-slate-600'
                        }`}
                      >
                        {documentName}
                      </button>
                    );
                  })}
                </div>
                {providedDocuments.includes('Autre') && (
                  <div className="mt-3">
                    <Field label="Autre document" value={otherDocument} onChange={setOtherDocument} placeholder="Nom du document fourni" />
                  </div>
                )}
              </div>
            </div>
          )}

          {isMaritimeWarehouseForm && (
            <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
              <p className="text-sm font-black text-primary">Déclaration client et validation entrepôt</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <OptionToggle
                  label="Le client confirme la déclaration du contenu"
                  checked={clientDeclarationAccepted}
                  onChange={setClientDeclarationAccepted}
                />
                <Field label="Nom du client signataire" value={clientSignatureName} onChange={setClientSignatureName} placeholder="Nom du client" />
                <Field label="Colis reçu par" value={warehouseReceiverName} onChange={setWarehouseReceiverName} placeholder="Nom agent entrepôt" />
                <Field label="Fonction" value={warehouseReceiverRole} onChange={setWarehouseReceiverRole} placeholder="Réceptionnaire, superviseur..." />
                <Field label="Contact entrepôt" value={warehouseContact} onChange={setWarehouseContact} placeholder="Nom ou service" />
                <Field label="Téléphone entrepôt" value={warehousePhone} onChange={setWarehousePhone} placeholder="+86..." />
                <Field label="Email entrepôt" value={warehouseEmail} onChange={setWarehouseEmail} placeholder="contact@entrepot.com" />
                <Field label="Adresse entrepôt" value={warehouseAddress} onChange={setWarehouseAddress} placeholder="Adresse complète" />
              </div>
              <div className="mt-4 rounded-xl bg-white p-3 text-xs font-semibold leading-5 text-slate-600">
                Conditions: déclaration correcte obligatoire, produits interdits refusés, frais de douane à destination à la charge du client sauf accord écrit, délais maritimes variables selon port, compagnie maritime et douane.
              </div>
            </div>
          )}

          <div className="space-y-2 md:col-span-2">
            <span className="text-sm font-semibold text-slate-700">Photo du colis *</span>
            {!isCameraOpen && (
              <button
                type="button"
                onClick={() => void openCamera()}
                className="flex h-11 w-full items-center justify-center rounded-lg border border-primary/20 bg-primary/5 px-3 text-sm font-bold text-primary transition hover:bg-primary/10"
              >
                Capturer la photo
              </button>
            )}
            {cameraError && <p className="text-sm font-semibold text-red-600">{cameraError}</p>}
            {isCameraOpen && (
              <div className="rounded-xl border border-primary/15 bg-primary/5 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-primary">Camera active</p>
                  <span className="rounded-full bg-primary px-2 py-1 text-xs font-bold text-white">LIVE</span>
                </div>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  onLoadedMetadata={() => void videoRef.current?.play()}
                  className="h-64 w-full rounded-xl bg-primary object-cover"
                />
                <p className="mt-2 text-xs font-semibold text-primary">
                  Placez le colis dans le cadre puis prenez la photo.
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => void capturePackagePhoto()}
                    className="rounded-xl bg-primary px-3 py-2 text-sm font-bold text-white"
                  >
                    Prendre photo
                  </button>
                  <button
                    type="button"
                    onClick={closeCamera}
                    className="rounded-xl bg-white px-3 py-2 text-sm font-bold text-primary ring-1 ring-primary/20"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
            {packagePhotoPreview && (
              <div className="rounded-xl border border-primary/15 bg-white p-2">
                <img
                  src={packagePhotoPreview}
                  alt="Apercu colis"
                  className="h-36 w-full rounded-xl object-cover"
                />
                <button
                  type="button"
                  onClick={() => void openCamera()}
                  className="mt-2 w-full rounded-xl bg-[#FFA500]/10 px-3 py-2 text-sm font-bold text-[#FFA500]"
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
          className="mt-5 w-full rounded-lg bg-primary px-4 py-3 font-semibold text-white transition hover:bg-primary disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSaving ? 'Upload et enregistrement...' : 'Valider et generer QR'}
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-primary">Transmission instantanee</h3>
        <p className="mt-1 text-sm text-slate-500">
          Le code sert a verifier le colis au scan, au depart, au depot et a la remise.
        </p>

        {registeredPackage ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Numero de suivi</p>
              <p className="mt-2 font-mono text-lg font-bold text-primary">{registeredPackage.trackingNumber}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <p className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-600">Facture: {registeredPackage.invoiceNumber}</p>
                <p className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-600">Total: {registeredPackage.totalLabel}</p>
                <p className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-600 sm:col-span-2">Colis: {registeredPackage.parcelLabel}</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-primary/15 bg-white p-3 text-center">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-primary">QR Code</p>
                <img
                  src={registeredPackage.qrCodeUrl}
                  alt={`QR ${registeredPackage.trackingNumber}`}
                  className="mx-auto h-44 w-44 rounded-xl bg-white p-2"
                />
                <button
                  type="button"
                  onClick={() => downloadDataUrl(registeredPackage.qrCodeUrl, `${registeredPackage.trackingNumber}-qr.png`)}
                  className="mt-3 w-full rounded-xl bg-primary/5 px-3 py-2 text-xs font-bold text-primary"
                >
                  Telecharger QR
                </button>
              </div>
              <div className="rounded-xl border border-[#FFA500]/20 bg-white p-3 text-center">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[#FFA500]">Code-barres</p>
                <img
                  src={registeredPackage.barcodeUrl}
                  alt={`Barcode ${registeredPackage.trackingNumber}`}
                  className="mx-auto h-44 w-full rounded-xl bg-white object-contain p-2"
                />
                <button
                  type="button"
                  onClick={() => downloadDataUrl(registeredPackage.barcodeUrl, `${registeredPackage.trackingNumber}-barcode.svg`)}
                  className="mt-3 w-full rounded-xl bg-[#FFA500]/10 px-3 py-2 text-xs font-bold text-[#FFA500]"
                >
                  Telecharger barcode
                </button>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => printPackageLabel(registeredPackage)}
                className="rounded-xl bg-primary px-3 py-2 text-sm font-bold text-white"
              >
                Imprimer
              </button>
              <button
                type="button"
                onClick={() => downloadPackageLabel(registeredPackage)}
                className="rounded-xl bg-[#FFA500]/100 px-3 py-2 text-sm font-bold text-white"
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
                className="rounded-xl bg-primary/5 px-3 py-2 text-sm font-bold text-primary"
              >
                Partager
              </button>
            </div>
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm text-primary">
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
        className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-primary/15 bg-white p-3 shadow-sm">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-primary">{label}</p>
      <p className="mt-1 text-lg font-black text-primary">{value}</p>
    </div>
  );
}

function OptionToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-bold transition ${
        checked
          ? 'border-primary/20 bg-primary/5 text-primary'
          : 'border-slate-200 bg-white text-slate-600 hover:border-primary/15'
      }`}
    >
      <span>{label}</span>
      <span className={`h-5 w-9 rounded-full p-0.5 transition ${checked ? 'bg-primary' : 'bg-slate-200'}`}>
        <span className={`block h-4 w-4 rounded-full bg-white transition ${checked ? 'translate-x-4' : ''}`} />
      </span>
    </button>
  );
}

function LogisticsOverview({
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
  const stockCount = shipments.filter((shipment) => ['registered', 'arrived_depot'].includes(shipment.logisticsStatus)).length;
  const deliveredCount = shipments.filter((shipment) => shipment.logisticsStatus === 'delivered').length;
  const issueCount = shipments.filter((shipment) => ['returned', 'blocked'].includes(shipment.logisticsStatus)).length;
  const successRate = shipments.length ? Math.round((deliveredCount / shipments.length) * 100) : 0;
  const receivedAmount = shipments.reduce((total, shipment) => total + (Number.isFinite(shipment.amountPaid) ? shipment.amountPaid : 0), 0);
  const currency = shipments.find((shipment) => shipment.currency)?.currency || 'USD';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <LogisticsKpiCard icon={Box} label="Colis enregistrés" value={String(shipments.length || registeredCount)} note="Aujourd’hui" tone="green" />
        <LogisticsKpiCard icon={ClipboardCheck} label="Missions actives" value={String(inTransitCount)} note="En cours" tone="orange" />
        <LogisticsKpiCard icon={Warehouse} label="En stock" value={String(stockCount)} note="Unités" tone="green" />
        <LogisticsKpiCard icon={ShieldAlert} label="Incidents" value={String(issueCount)} note={issueCount ? 'À traiter' : 'Aucun'} tone="orange" />
        <LogisticsKpiCard icon={PieChart} label="Taux de livraison" value={`${successRate}%`} note="Ce mois" tone="green" />
        <LogisticsKpiCard icon={CircleDollarSign} label="Paiements reçus" value={`${formatCompactMoney(receivedAmount)} ${currency}`} note="Ce mois" tone="green" />
      </div>

      <section className="overflow-hidden rounded-[1.35rem] bg-white shadow-[0_12px_28px_rgba(15,23,42,0.07)] ring-1 ring-slate-100">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
          <h2 className="text-base font-black text-slate-950">Colis récents</h2>
          <button
            type="button"
            onClick={() => setActiveTab('shipments')}
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-primary"
          >
            Voir tout
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="divide-y divide-slate-100">
          {shipments.slice(0, 3).map((shipment) => (
            <LogisticsRecentShipmentRow key={shipment.id} shipment={shipment} />
          ))}
          {!shipments.length && (
            <div className="px-4 py-7 text-center text-sm font-semibold text-slate-500">
              Aucun colis récent pour le moment.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function LogisticsKpiCard({
  icon: Icon,
  label,
  value,
  note,
  tone,
}: {
  icon: React.ComponentType<any>;
  label: string;
  value: string;
  note: string;
  tone: 'green' | 'orange';
}) {
  const color = tone === 'orange' ? 'bg-[#fff7ed] text-[#FFA500]' : 'bg-primary/10 text-primary';

  return (
    <article className="min-h-[7.1rem] rounded-[1.25rem] bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.06)] ring-1 ring-slate-100">
      <div className="flex items-start gap-3">
        <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${color}`}>
          <Icon className="h-7 w-7" />
        </span>
        <div className="min-w-0">
          <p className="line-clamp-2 text-xs font-bold leading-tight text-slate-700">{label}</p>
          <p className="mt-1 text-2xl font-black leading-tight text-slate-950">{value}</p>
          <p className={`mt-1 text-xs font-bold ${tone === 'orange' ? 'text-[#FFA500]' : 'text-primary'}`}>{note}</p>
        </div>
      </div>
    </article>
  );
}

function LogisticsRecentShipmentRow({ shipment }: { shipment: AgencyShipment }) {
  const status = getShipmentStatusMeta(shipment.logisticsStatus);

  return (
    <button
      type="button"
      onClick={() => window.open(`/dashboard/ugavi/tracking?tracking=${encodeURIComponent(shipment.trackingNumber)}`, '_blank')}
      className="grid w-full grid-cols-[3rem_1fr_auto_auto] items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
    >
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fff7ed] text-[#FFA500]">
        <Box className="h-7 w-7" />
      </span>
      <span className="min-w-0">
        <span className="block truncate font-mono text-sm font-black text-slate-950">{shipment.trackingNumber}</span>
        <span className="mt-0.5 block truncate text-xs font-semibold text-slate-600">{shipment.senderName}</span>
        <span className="mt-1 flex min-w-0 items-center gap-1 text-[11px] font-semibold text-slate-500">
          <MapPinIcon size={13} />
          <span className="truncate">{shipment.origin} → {shipment.destination}</span>
        </span>
      </span>
      <span className="hidden text-right text-xs font-bold text-slate-500 sm:block">
        {shipment.weight || 0} kg
      </span>
      <span className="flex items-center justify-end gap-2">
        <span className={`hidden items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-bold sm:inline-flex ${status.className}`}>
          <span className={`h-2 w-2 rounded-full ${status.dot}`} />
          {status.label}
        </span>
        <ChevronRight className="h-5 w-5 text-slate-300" />
      </span>
    </button>
  );
}

function formatCompactMoney(amount: number) {
  if (!amount) return '0';
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(amount);
}

function getShipmentStatusMeta(status: UgaviLogisticsStatus) {
  const meta: Record<string, { label: string; className: string; dot: string }> = {
    registered: { label: 'En entrepôt', className: 'bg-primary/10 text-primary', dot: 'bg-primary' },
    assigned: { label: 'Prêt pour expédition', className: 'bg-blue-50 text-blue-700', dot: 'bg-blue-500' },
    in_transit: { label: 'En transit', className: 'bg-[#fff7ed] text-[#FFA500]', dot: 'bg-[#f59e0b]' },
    arrived_depot: { label: 'Arrivé dépôt', className: 'bg-primary/10 text-primary', dot: 'bg-primary' },
    out_for_delivery: { label: 'En livraison', className: 'bg-blue-50 text-blue-700', dot: 'bg-blue-500' },
    delivered: { label: 'Livré', className: 'bg-primary/10 text-primary', dot: 'bg-primary' },
    returned: { label: 'Retourné', className: 'bg-red-50 text-red-700', dot: 'bg-red-500' },
    blocked: { label: 'Incident', className: 'bg-red-50 text-red-700', dot: 'bg-red-500' },
    draft: { label: 'Brouillon', className: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
    pending_payment: { label: 'Paiement attendu', className: 'bg-[#fff7ed] text-[#FFA500]', dot: 'bg-[#f59e0b]' },
    paid: { label: 'Payé', className: 'bg-primary/10 text-primary', dot: 'bg-primary' },
  };

  return meta[status] || { label: UGAVI_STATUS_LABELS[status] || status, className: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' };
}

function LogisticsPaymentsPanel({ shipments }: { shipments: AgencyShipment[] }) {
  const totalReceived = shipments.reduce((total, shipment) => total + (Number.isFinite(shipment.amountPaid) ? shipment.amountPaid : 0), 0);
  const paidShipments = shipments.filter((shipment) => shipment.amountPaid > 0).length;
  const currency = shipments.find((shipment) => shipment.currency)?.currency || 'USD';

  return (
    <section className="rounded-[1.35rem] bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.07)] ring-1 ring-slate-100">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-950">Paiements</h2>
          <p className="text-sm font-semibold text-slate-500">Synthèse des paiements reçus par le hub.</p>
        </div>
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <CircleDollarSign className="h-7 w-7" />
        </span>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <LogisticsKpiCard icon={CircleDollarSign} label="Paiements reçus" value={`${formatCompactMoney(totalReceived)} ${currency}`} note="Ce mois" tone="green" />
        <LogisticsKpiCard icon={ClipboardCheck} label="Colis payés" value={String(paidShipments)} note="Validés" tone="green" />
        <LogisticsKpiCard icon={ShieldAlert} label="À rapprocher" value={String(Math.max(0, shipments.length - paidShipments))} note="Contrôle" tone="orange" />
      </div>
    </section>
  );
}

function LogisticsReportsPanel({ shipments, setActiveTab, mode = 'reports' }: { shipments: AgencyShipment[]; setActiveTab: (tab: string) => void; mode?: string }) {
  const deliveredCount = shipments.filter((shipment) => shipment.logisticsStatus === 'delivered').length;
  const issueCount = shipments.filter((shipment) => ['returned', 'blocked'].includes(shipment.logisticsStatus)).length;
  const modeConfig: Record<string, { title: string; subtitle: string; icon: React.ComponentType<any>; items: Array<{ label: string; value: number | string; action: string }> }> = {
    reports: {
      title: 'Rapports',
      subtitle: 'Lecture rapide de l’activité logistique.',
      icon: PieChart,
      items: [
        { label: 'Total colis suivis', value: shipments.length, action: 'shipments' },
        { label: 'Colis livrés', value: deliveredCount, action: 'shipments' },
        { label: 'Incidents ouverts', value: issueCount, action: 'shipments' },
      ],
    },
    clients: {
      title: 'Clients',
      subtitle: 'Expéditeurs et destinataires liés aux opérations du hub.',
      icon: UsersRound,
      items: [
        { label: 'Expéditeurs uniques', value: new Set(shipments.map((item) => item.senderName).filter(Boolean)).size, action: 'shipments' },
        { label: 'Destinataires uniques', value: new Set(shipments.map((item) => item.receiverName).filter(Boolean)).size, action: 'shipments' },
        { label: 'Clients avec colis actifs', value: shipments.filter((item) => !['delivered', 'returned', 'blocked'].includes(item.logisticsStatus)).length, action: 'shipments' },
      ],
    },
    settings: {
      title: 'Paramètres',
      subtitle: 'Configuration opérationnelle du hub logistique.',
      icon: Settings,
      items: [
        { label: 'Code hub actif', value: 'Actif', action: 'overview' },
        { label: 'Zone de service', value: 'Configurable', action: 'fleet' },
        { label: 'Scanner colis', value: 'Disponible', action: 'relay' },
      ],
    },
    roles: {
      title: 'Rôles & accès',
      subtitle: 'Contrôle des agents, scanners et ressources de livraison.',
      icon: KeyRound,
      items: [
        { label: 'Agents / ressources', value: 'Gérer', action: 'fleet' },
        { label: 'Scanner agence', value: 'Autorisé', action: 'relay' },
        { label: 'Journal colis', value: shipments.length, action: 'shipments' },
      ],
    },
    audit: {
      title: "Journal d'audit",
      subtitle: 'Dernières opérations, scans et changements de statut.',
      icon: FileText,
      items: [
        { label: 'Colis avec historique', value: shipments.filter((item) => item.statusHistory?.length).length, action: 'shipments' },
        { label: 'Derniers scans', value: shipments.filter((item) => item.lastScanMode).length, action: 'relay' },
        { label: 'Preuves de livraison', value: shipments.filter((item) => item.deliveryProof).length, action: 'shipments' },
      ],
    },
  };
  const config = modeConfig[mode] || modeConfig.reports;
  const HeaderIcon = config.icon;

  return (
    <section className="rounded-[1.35rem] bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.07)] ring-1 ring-slate-100">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-950">{config.title}</h2>
          <p className="text-sm font-semibold text-slate-500">{config.subtitle}</p>
        </div>
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <HeaderIcon className="h-7 w-7" />
        </span>
      </div>
      <div className="mt-5 space-y-3">
        {config.items.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => setActiveTab(item.action)}
            className="flex w-full items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-left ring-1 ring-slate-100"
          >
            <span className="font-bold text-slate-700">{item.label}</span>
            <span className="text-xl font-black text-primary">{item.value}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function LogisticsFleet({ title, emptyState, businessUser, mode = 'fleet' }: { title: string; emptyState: string; businessUser: BusinessUser; mode?: string }) {
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
  const modeConfig: Record<string, { title: string; subtitle: string; actionLabel: string; defaultType: string; emptyState: string }> = {
    warehouses: {
      title: 'Entrepôts',
      subtitle: 'Déclarez les dépôts, hubs et espaces colis exploités par votre agence.',
      actionLabel: 'Ajouter un entrepôt',
      defaultType: 'Depot',
      emptyState: 'Aucun entrepôt ou dépôt déclaré pour le moment.',
    },
    stock: {
      title: 'Stock',
      subtitle: 'Suivez les unités, zones et capacités disponibles dans le hub.',
      actionLabel: 'Ajouter un stock',
      defaultType: 'Stock',
      emptyState: 'Aucun stock logistique déclaré pour le moment.',
    },
    inventory: {
      title: 'Inventaires',
      subtitle: 'Organisez les inventaires physiques et les contrôles périodiques.',
      actionLabel: 'Créer un inventaire',
      defaultType: 'Inventaire',
      emptyState: 'Aucun inventaire enregistré pour le moment.',
    },
    fleet: {
      title,
      subtitle: 'Ajoutez les moyens et agents qui exécutent les missions.',
      actionLabel: 'Ajouter',
      defaultType: 'Livreur',
      emptyState,
    },
  };
  const config = modeConfig[mode] || modeConfig.fleet;

  useEffect(() => {
    setResourceType(config.defaultType);
  }, [config.defaultType]);

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
            <h2 className="text-xl font-black text-primary">{config.title}</h2>
            <p className="text-sm text-slate-500">{config.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowResourceForm((current) => !current)}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary"
          >
            {config.actionLabel}
          </button>
        </div>
        {showResourceForm && (
          <div className="mb-5 grid gap-3 rounded-2xl border border-primary/15 bg-primary/5 p-4 md:grid-cols-[1fr_150px_1fr_auto]">
            <input
              value={resourceName}
              onChange={(event) => setResourceName(event.target.value)}
              placeholder="Nom ressource"
              className="h-11 rounded-xl border border-primary/15 bg-white px-3 text-sm outline-none focus:border-primary"
            />
            <select
              value={resourceType}
              onChange={(event) => setResourceType(event.target.value)}
              className="h-11 rounded-xl border border-primary/15 bg-white px-3 text-sm outline-none focus:border-primary"
            >
              {['Livreur', 'Moto', 'Voiture', 'Camion', 'Depot', 'Stock', 'Inventaire', 'Drone'].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <input
              value={resourceZone}
              onChange={(event) => setResourceZone(event.target.value)}
              placeholder="Zone"
              className="h-11 rounded-xl border border-primary/15 bg-white px-3 text-sm outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={addResource}
              disabled={isSavingResource}
              className="h-11 rounded-xl bg-[#FFA500]/100 px-4 text-sm font-bold text-white"
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
              <p className="text-2xl font-black text-primary">{item.value}</p>
              <p className="text-sm font-semibold text-slate-500">{item.label}</p>
            </div>
          );
          })}
        </div>
        {resources.length > 0 ? (
          <div className="mt-5 grid gap-2">
            {resources.map((resource) => (
              <div key={resource.id} className="flex items-center justify-between rounded-2xl bg-white p-3 ring-1 ring-primary/20">
                <div>
                  <p className="font-bold text-primary">{resource.name}</p>
                  <p className="text-sm text-slate-500">{resource.type} · {resource.zone}</p>
                </div>
                <span className="rounded-full bg-primary/5 px-3 py-1 text-xs font-bold text-primary">Disponible</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
            {config.emptyState}
          </div>
        )}
      </div>
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-primary/20">
        <p className="text-sm font-bold text-primary">Disponibilite live</p>
        <p className="mt-2 text-sm text-slate-500">Activez les ressources pour les voir sur la carte client et dans le dispatch.</p>
        {showZoneForm && (
          <div className="mt-4 space-y-3">
            <input
              value={zoneName}
              onChange={(event) => setZoneName(event.target.value)}
              placeholder="Nom de zone"
              className="h-11 w-full rounded-xl border border-primary/15 bg-primary/5 px-3 text-sm outline-none focus:border-primary"
            />
            <input
              value={zoneRadius}
              onChange={(event) => setZoneRadius(event.target.value)}
              placeholder="Rayon km"
              type="number"
              className="h-11 w-full rounded-xl border border-primary/15 bg-primary/5 px-3 text-sm outline-none focus:border-primary"
            />
          </div>
        )}
        {agencyZone && (
          <div className="mt-4 rounded-2xl bg-primary/5 p-4 text-sm text-primary">
            Zone active: <strong>{agencyZone.name}</strong> · {agencyZone.radius || 0} km
          </div>
        )}
        <button
          type="button"
          onClick={showZoneForm ? saveZone : () => setShowZoneForm(true)}
          disabled={isSavingZone}
          className="mt-5 w-full rounded-xl bg-[#FFA500]/100 px-4 py-2 text-sm font-bold text-white"
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
  mode = 'shipments',
}: {
  title: string;
  emptyState: string;
  businessUser: BusinessUser;
  shipments: AgencyShipment[];
  isLoading: boolean;
  mode?: string;
}) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'issue'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const modeConfig: Record<string, { title: string; subtitle: string; emptyState: string; statuses?: UgaviLogisticsStatus[] }> = {
    movements: {
      title: 'Mouvements',
      subtitle: 'Colis qui entrent, sortent ou changent de statut dans le hub.',
      emptyState: 'Aucun mouvement colis pour le moment.',
      statuses: ['registered', 'assigned', 'in_transit', 'arrived_depot'],
    },
    deliveries: {
      title: 'Livraisons',
      subtitle: 'Colis à remettre, livrés ou prêts pour le destinataire.',
      emptyState: 'Aucune livraison à traiter pour le moment.',
      statuses: ['arrived_depot', 'out_for_delivery', 'delivered'],
    },
    orders: {
      title: 'Commandes',
      subtitle: 'Demandes et missions actives liées à votre agence.',
      emptyState: 'Aucune commande active pour le moment.',
      statuses: ['pending_payment', 'paid', 'registered', 'assigned', 'in_transit'],
    },
    missions: {
      title,
      subtitle: 'Suivez les colis, missions et statuts critiques.',
      emptyState,
    },
    shipments: {
      title,
      subtitle: 'Suivez les colis, missions et statuts critiques.',
      emptyState,
    },
  };
  const config = modeConfig[mode] || modeConfig.shipments;
  const filteredShipments = shipments.filter((shipment) => {
    if (config.statuses?.length && !config.statuses.includes(shipment.logisticsStatus)) return false;
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
        statusHistory: arrayUnion(buildUgaviStatusEntry(nextStatus, businessUser.businessName, shipment.origin)),
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
          <h2 className="text-xl font-black text-primary">{config.title}</h2>
          <p className="text-sm text-slate-500">{config.subtitle}</p>
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
                statusFilter === filter.id ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'
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
                    <p className="font-mono text-sm font-black text-primary">{shipment.trackingNumber}</p>
                    <span className="rounded-full bg-primary/5 px-2 py-1 text-xs font-bold text-primary">
                      {UGAVI_STATUS_LABELS[shipment.logisticsStatus] || shipment.logisticsStatus}
                    </span>
                  </div>
                  <p className="mt-2 font-bold text-primary">{shipment.senderName} vers {shipment.receiverName}</p>
                  <p className="mt-1 text-sm text-slate-500">{shipment.origin} vers {shipment.destination}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {shipment.weight || 0} kg {shipment.description ? `· ${shipment.description}` : ''}
                  </p>
                  {shipment.deliveryProof && (
                    <p className="mt-2 rounded-xl bg-primary/5 px-3 py-2 text-xs font-semibold text-primary">
                      Preuve: {shipment.deliveryProof.receiverName || 'Destinataire confirme'} · {shipment.deliveryProof.otp || 'Scan valide'}
                    </p>
                  )}
                </div>
                <div className="grid gap-2 sm:grid-cols-[1fr_auto] lg:min-w-80">
                  <select
                    value={shipment.logisticsStatus}
                    onChange={(event) => void updateShipmentStatus(shipment, event.target.value as UgaviLogisticsStatus)}
                    disabled={updatingId === shipment.id}
                    className="h-11 rounded-xl border border-primary/15 bg-white px-3 text-sm font-semibold text-primary outline-none focus:border-primary"
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
                    className="h-11 rounded-xl bg-[#FFA500]/100 px-4 text-sm font-bold text-white"
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
                    className="rounded-full bg-white px-3 py-1 text-xs font-bold text-primary ring-1 ring-primary/20 disabled:opacity-45"
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
          {config.emptyState}
        </div>
      )}
    </div>
  );
}

function RelayScanner({ title, description, businessUser }: { title: string; description: string; businessUser: BusinessUser }) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const scannerStreamRef = React.useRef<MediaStream | null>(null);
  const scannerFrameRef = React.useRef<number | null>(null);
  const [scanMode, setScanMode] = useState<UgaviScanMode>('reception');
  const [manualCode, setManualCode] = useState('');
  const [scanMessage, setScanMessage] = useState('');
  const [scanError, setScanError] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isScannerReady, setIsScannerReady] = useState(false);
  const [isProcessingScan, setIsProcessingScan] = useState(false);
  const [lastShipment, setLastShipment] = useState<AgencyShipment | null>(null);
  const [receiverName, setReceiverName] = useState('');
  const [deliveryOtp, setDeliveryOtp] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');

  const stopScanner = React.useCallback(() => {
    if (scannerFrameRef.current !== null) {
      cancelAnimationFrame(scannerFrameRef.current);
      scannerFrameRef.current = null;
    }
    scannerStreamRef.current?.getTracks().forEach((track) => track.stop());
    scannerStreamRef.current = null;
    setIsScannerReady(false);
  }, []);

  const findShipmentByTrackingCode = React.useCallback(async (trackingCode: string) => {
    const primaryQuery = query(collection(db, 'ugaviRequests'), where('trackingNumber', '==', trackingCode), limit(1));
    const primarySnapshot = await getDocs(primaryQuery);
    if (!primarySnapshot.empty) return primarySnapshot.docs[0];

    const packageQuery = query(collection(db, 'ugaviRequests'), where('packageNumber', '==', trackingCode), limit(1));
    const packageSnapshot = await getDocs(packageQuery);
    return packageSnapshot.empty ? null : packageSnapshot.docs[0];
  }, []);

  const processScannedCode = React.useCallback(async (rawCode: string) => {
    const trackingCode = extractUgaviTrackingCode(rawCode);
    setScanError('');
    setScanMessage('');

    if (!trackingCode) {
      setScanError('Code colis invalide.');
      return;
    }

    if (scanMode === 'delivery' && !receiverName.trim()) {
      setScanError('Ajoutez le nom de la personne qui reçoit le colis avant la remise.');
      return;
    }

    setManualCode(trackingCode);
    setIsProcessingScan(true);

    try {
      const shipmentDoc = await findShipmentByTrackingCode(trackingCode);
      if (!shipmentDoc) {
        setScanError(`Aucun colis trouve pour ${trackingCode}.`);
        return;
      }

      const data = shipmentDoc.data() as any;
      const nextStatus = UGAVI_SCAN_STATUS_MAP[scanMode];
      const actor = businessUser.businessName || businessUser.uid;
      const location = businessUser.businessName || data.receiverAddress || data.senderAddress || 'Agence Ugavi';
      const proof =
        scanMode === 'delivery'
          ? {
              type: 'delivery_scan',
              receiverName: receiverName.trim(),
              otp: deliveryOtp.trim(),
              note: deliveryNote.trim(),
              actor,
              agencyId: businessUser.businessId || businessUser.uid,
              confirmedAtIso: new Date().toISOString(),
            }
          : null;

      const scanEvent = {
        mode: scanMode,
        modeLabel: UGAVI_SCAN_LABELS[scanMode],
        status: nextStatus,
        trackingNumber: trackingCode,
        actor,
        agencyId: businessUser.businessId || businessUser.uid,
        agencyUserId: businessUser.uid,
        location,
        createdAtIso: new Date().toISOString(),
      };

      await updateDoc(doc(db, 'ugaviRequests', shipmentDoc.id), {
        logisticsStatus: nextStatus,
        status: nextStatus,
        currentLocation: location,
        lastScanMode: scanMode,
        lastScanAt: serverTimestamp(),
        lastScanBy: actor,
        scanEvents: arrayUnion(scanEvent),
        statusHistory: arrayUnion(
          buildUgaviStatusEntry(nextStatus, actor, location, UGAVI_SCAN_LABELS[scanMode], scanMode),
        ),
        updatedAt: serverTimestamp(),
        ...(scanMode === 'delivery'
          ? {
              deliveredAt: serverTimestamp(),
              proofOfDelivery: true,
              deliveryProof: proof,
            }
          : {}),
      });

      const nextShipment: AgencyShipment = {
        id: shipmentDoc.id,
        trackingNumber: data.trackingNumber || data.packageNumber || trackingCode,
        senderName: data.senderName || 'Expediteur',
        receiverName: data.receiverName || receiverName || 'Destinataire',
        origin: data.senderAddress || 'Origine',
        destination: data.receiverAddress || 'Destination',
        weight: Number(data.packageWeight || 0),
        amountPaid: Number(data.quoteTotal || data.totalAmount || data.amountPaid || data.amount || 0),
        currency: data.currency || 'USD',
        description: data.description || data.parcelName || '',
        logisticsStatus: nextStatus,
        statusHistory: Array.isArray(data.statusHistory) ? data.statusHistory : [],
        deliveryProof: proof || data.deliveryProof || undefined,
        lastScanMode: scanMode,
        updatedAtMs: Date.now(),
      };

      setLastShipment(nextShipment);
      setScanMessage(`${UGAVI_SCAN_LABELS[scanMode]} confirmee pour ${trackingCode}.`);
      if (scanMode === 'delivery') {
        setReceiverName('');
        setDeliveryOtp('');
        setDeliveryNote('');
      }
    } catch (error) {
      console.error('Erreur scan colis Ugavi:', error);
      setScanError('Impossible de valider ce scan. Verifiez la connexion ou les droits Firestore.');
    } finally {
      setIsProcessingScan(false);
    }
  }, [businessUser.businessId, businessUser.businessName, businessUser.uid, deliveryNote, deliveryOtp, findShipmentByTrackingCode, receiverName, scanMode]);

  const startScanner = React.useCallback(async () => {
    setScanError('');
    setIsScannerReady(false);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera indisponible sur cet appareil.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      scannerStreamRef.current = stream;

      const video = videoRef.current;
      if (!video) return;

      video.srcObject = stream;
      await video.play();
      setIsScannerReady(true);

      const scanFrame = async () => {
        const currentVideo = videoRef.current;
        const canvas = canvasRef.current;
        if (!currentVideo || !canvas || currentVideo.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
          scannerFrameRef.current = requestAnimationFrame(scanFrame);
          return;
        }

        canvas.width = currentVideo.videoWidth;
        canvas.height = currentVideo.videoHeight;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) {
          scannerFrameRef.current = requestAnimationFrame(scanFrame);
          return;
        }

        context.drawImage(currentVideo, 0, 0, canvas.width, canvas.height);

        try {
          const BarcodeDetectorCtor = (window as any).BarcodeDetector;
          if (BarcodeDetectorCtor) {
            const detector = new BarcodeDetectorCtor({ formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e'] });
            const codes = await detector.detect(canvas);
            const rawValue = codes?.[0]?.rawValue;
            if (rawValue) {
              stopScanner();
              setIsScannerOpen(false);
              void processScannedCode(rawValue);
              return;
            }
          } else {
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const jsQR = (await import('jsqr')).default;
            const result = jsQR(imageData.data, imageData.width, imageData.height);
            if (result?.data) {
              stopScanner();
              setIsScannerOpen(false);
              void processScannedCode(result.data);
              return;
            }
          }
        } catch (error) {
          console.error('Erreur lecture scanner Ugavi:', error);
        }

        scannerFrameRef.current = requestAnimationFrame(scanFrame);
      };

      scannerFrameRef.current = requestAnimationFrame(scanFrame);
    } catch (error: any) {
      setScanError(error?.message || 'Impossible d ouvrir la camera.');
      stopScanner();
    }
  }, [processScannedCode, stopScanner]);

  useEffect(() => {
    if (!isScannerOpen) {
      stopScanner();
      return;
    }

    void startScanner();
    return () => stopScanner();
  }, [isScannerOpen, startScanner, stopScanner]);

  return (
    <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
      <div className="rounded-2xl bg-gradient-to-br from-primary to-[#FFA500] p-6 text-white shadow-sm">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10">
          <UgaviShareIcon size={48} />
        </div>
        <h2 className="mt-6 text-2xl font-black">{title}</h2>
        <p className="mt-2 text-sm text-slate-300">{description}</p>
        <button
          type="button"
          onClick={() => setIsScannerOpen(true)}
          disabled={isProcessingScan}
          className="mt-6 w-full rounded-xl bg-white px-4 py-3 font-bold text-primary transition hover:bg-primary/5 disabled:opacity-60"
        >
          {isProcessingScan ? 'Validation...' : 'Ouvrir le scanner'}
        </button>
        <div className="mt-4 rounded-2xl border border-white/15 bg-white/10 p-3 text-xs leading-5 text-white/80">
          Le scan met a jour le tracking, ajoute un journal d'action et cree une preuve si le mode remise finale est choisi.
        </div>
      </div>
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-bold text-primary">Modes de scan</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {([
            { key: 'reception', label: 'Reception', helper: 'Colis entre en agence' },
            { key: 'departure', label: 'Depart', helper: 'Colis sort en transit' },
            { key: 'delivery', label: 'Remise', helper: 'Preuve de livraison' },
          ] as Array<{ key: UgaviScanMode; label: string; helper: string }>).map((mode) => (
            <button
              key={mode.key}
              type="button"
              onClick={() => setScanMode(mode.key)}
              className={`rounded-2xl p-4 text-left transition ${
                scanMode === mode.key ? 'bg-primary text-white shadow-sm' : 'bg-slate-50 text-primary hover:bg-primary/5'
              }`}
            >
              <UgaviShareIcon className="mb-4" size={32} />
              <p className="font-bold">{mode.label}</p>
              <p className={`text-sm ${scanMode === mode.key ? 'text-white/75' : 'text-slate-500'}`}>{mode.helper}</p>
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <label className="space-y-1.5">
            <span className="text-sm font-bold text-primary">Numero ou contenu QR</span>
            <input
              value={manualCode}
              onChange={(event) => setManualCode(event.target.value)}
              placeholder="UGV-2026-KIN-LUB-12345 ou payload QR"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>

          {scanMode === 'delivery' && (
            <div className="grid gap-3 md:grid-cols-3">
              <label className="space-y-1.5">
                <span className="text-xs font-bold text-slate-600">Recu par *</span>
                <input
                  value={receiverName}
                  onChange={(event) => setReceiverName(event.target.value)}
                  placeholder="Nom destinataire"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-primary"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-bold text-slate-600">OTP / reference</span>
                <input
                  value={deliveryOtp}
                  onChange={(event) => setDeliveryOtp(event.target.value)}
                  placeholder="Code OTP"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-primary"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-bold text-slate-600">Observation</span>
                <input
                  value={deliveryNote}
                  onChange={(event) => setDeliveryNote(event.target.value)}
                  placeholder="Signature, etat colis..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-primary"
                />
              </label>
            </div>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="h-11 rounded-xl bg-white px-4 text-sm font-bold text-primary ring-1 ring-primary/20"
            >
              Scanner camera
            </button>
            <button
              type="button"
              onClick={() => void processScannedCode(manualCode)}
              disabled={isProcessingScan || !manualCode.trim()}
              className="h-11 rounded-xl bg-primary px-4 text-sm font-bold text-white disabled:bg-slate-300"
            >
              Valider le scan
            </button>
          </div>

          {scanError && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{scanError}</p>}
          {scanMessage && <p className="rounded-xl bg-primary/5 px-3 py-2 text-sm font-bold text-primary">{scanMessage}</p>}
        </div>

        {lastShipment && (
          <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-primary">Dernier scan</p>
            <p className="mt-2 font-mono text-sm font-black text-primary">{lastShipment.trackingNumber}</p>
            <p className="mt-1 text-sm font-bold text-slate-900">{lastShipment.senderName} vers {lastShipment.receiverName}</p>
            <p className="mt-1 text-xs text-slate-500">{UGAVI_STATUS_LABELS[lastShipment.logisticsStatus]} · {lastShipment.destination}</p>
            {lastShipment.deliveryProof && (
              <p className="mt-3 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-primary">
                Preuve: {lastShipment.deliveryProof.receiverName} · {lastShipment.deliveryProof.otp || 'scan confirme'}
              </p>
            )}
          </div>
        )}
      </div>

      {isScannerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 p-3 sm:items-center">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div>
                <p className="text-sm font-bold text-slate-900">Scanner Ugavi</p>
                <p className="text-xs text-slate-500">{UGAVI_SCAN_LABELS[scanMode]}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  stopScanner();
                  setIsScannerOpen(false);
                }}
                className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-600"
              >
                Fermer
              </button>
            </div>
            <div className="space-y-3 p-4">
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-slate-950">
                <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
                <canvas ref={canvasRef} className="hidden" />
                <div className="pointer-events-none absolute inset-10 rounded-2xl border-2 border-primary shadow-[0_0_0_999px_rgba(15,23,42,0.35)]" />
                <div className="pointer-events-none absolute left-12 right-12 top-1/2 h-0.5 bg-primary/40 shadow-[0_0_18px_rgba(52,211,153,0.95)]" />
                {!isScannerReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 text-sm font-semibold text-white">
                    Ouverture de la camera...
                  </div>
                )}
              </div>
              <p className="text-xs leading-5 text-slate-500">
                Scannez le QR code ou le code-barres imprime sur le colis. Le numero est extrait automatiquement meme si le QR contient une fiche complete.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

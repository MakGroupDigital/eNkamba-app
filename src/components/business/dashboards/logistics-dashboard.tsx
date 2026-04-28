'use client';

import React, { useState } from 'react';
import { BusinessUser } from '@/types/business-dashboard.types';
import { BusinessDashboardIcons } from '@/components/icons/business-dashboard-icons';

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

const BASE_STATS: LogisticsStat[] = [
  { label: 'Missions actives', value: '0', icon: BusinessDashboardIcons.Truck, color: 'orange' },
  { label: 'Trajets du jour', value: '0', icon: BusinessDashboardIcons.MapPin, color: 'blue' },
  { label: 'Taux de succès', value: '0%', icon: BusinessDashboardIcons.CheckCircle, color: 'green' },
];

const OVERVIEW_TAB: LogisticsTab = { id: 'overview', label: 'Vue d’ensemble', icon: BusinessDashboardIcons.TrendingUp };
const FLEET_TAB: LogisticsTab = { id: 'fleet', label: 'Ressources', icon: BusinessDashboardIcons.Truck };
const SHIPMENTS_TAB: LogisticsTab = { id: 'shipments', label: 'Colis & missions', icon: BusinessDashboardIcons.MapPin };
const RELAY_TAB: LogisticsTab = { id: 'relay', label: 'Scanner QR', icon: BusinessDashboardIcons.QRCode };

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
  const [activeTab, setActiveTab] = useState(roleConfig.tabs[0]?.id || 'overview');

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-orange-50">
      <div className="sticky top-0 z-10 border-b border-emerald-100 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Ugavi Business
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">{businessUser.businessName}</h1>
                <p className="mt-1 text-slate-600">{roleConfig.title}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Profil activé</p>
                <p className="mt-1 text-sm text-slate-600">{roleConfig.summary}</p>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-green-800">
                <BusinessDashboardIcons.CheckCircle className="h-5 w-5" />
                <span className="font-semibold">Compte approuvé</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-emerald-100 bg-white/85 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex gap-6 overflow-x-auto">
            {roleConfig.tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 border-b-2 px-2 py-4 font-semibold transition-colors ${
                  activeTab === tab.id
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {activeTab === 'overview' && <LogisticsOverview stats={roleConfig.stats} capabilities={roleConfig.capabilities} />}
        {activeTab === 'fleet' && <LogisticsFleet title={roleConfig.fleetTitle} emptyState={roleConfig.fleetEmptyState} />}
        {activeTab === 'shipments' && <LogisticsShipments title={roleConfig.shipmentsTitle} emptyState={roleConfig.shipmentsEmptyState} />}
        {activeTab === 'relay' && <RelayScanner title={roleConfig.relayTitle} description={roleConfig.relayDescription} />}
      </div>
    </div>
  );
}

function LogisticsOverview({
  stats,
  capabilities,
}: {
  stats: LogisticsStat[];
  capabilities: string[];
}) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          const colorClasses = {
            orange: 'bg-orange-50 text-orange-600 border-orange-200',
            blue: 'bg-blue-50 text-blue-600 border-blue-200',
            green: 'bg-green-50 text-green-600 border-green-200',
            yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
            purple: 'bg-purple-50 text-purple-600 border-purple-200',
          };

          return (
            <div key={`${stat.label}-${idx}`} className={`${colorClasses[stat.color]} rounded-xl border-2 p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold opacity-75">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold">{stat.value}</p>
                </div>
                <Icon className="h-12 w-12 opacity-20" />
              </div>
            </div>
          );
        })}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {capabilities.map((capability) => (
          <div key={capability} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-emerald-50 p-2 text-emerald-700">
                <BusinessDashboardIcons.CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">{capability}</p>
                <p className="mt-1 text-sm text-slate-500">
                  Cette section s’activera selon les actions Ugavi et les données validées pour ce profil.
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LogisticsFleet({ title, emptyState }: { title: string; emptyState: string }) {
  return (
    <div className="rounded-xl border-2 border-gray-200 bg-white p-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <button className="rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-orange-700">
          + Ajouter
        </button>
      </div>
      <div className="py-12 text-center">
        <BusinessDashboardIcons.Truck className="mx-auto mb-4 h-16 w-16 text-gray-300" />
        <p className="text-gray-500">{emptyState}</p>
      </div>
    </div>
  );
}

function LogisticsShipments({ title, emptyState }: { title: string; emptyState: string }) {
  return (
    <div className="rounded-xl border-2 border-gray-200 bg-white p-8">
      <h2 className="mb-6 text-2xl font-bold text-gray-900">{title}</h2>
      <div className="py-12 text-center">
        <BusinessDashboardIcons.MapPin className="mx-auto mb-4 h-16 w-16 text-gray-300" />
        <p className="text-gray-500">{emptyState}</p>
      </div>
    </div>
  );
}

function RelayScanner({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border-2 border-gray-200 bg-white p-8">
      <h2 className="mb-6 text-2xl font-bold text-gray-900">{title}</h2>
      <div className="flex flex-col items-center justify-center py-12">
        <div className="mb-6 rounded-lg bg-gray-100 p-8">
          <BusinessDashboardIcons.QRCode className="h-24 w-24 text-gray-400" />
        </div>
        <button className="rounded-lg bg-orange-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-orange-700">
          Ouvrir le scanner
        </button>
        <p className="mt-4 text-gray-500">{description}</p>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { BusinessUser } from '@/types/business-dashboard.types';
import { BusinessDashboardIcons } from '@/components/icons/business-dashboard-icons';

interface LogisticsDashboardProps {
  businessUser: BusinessUser;
}

export function LogisticsDashboard({ businessUser }: LogisticsDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'fleet' | 'shipments' | 'relay'>('overview');
  const isRelay = businessUser.subCategory === 'RELAY';

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {businessUser.businessName}
              </h1>
              <p className="text-gray-600 mt-1">
                Dashboard Logistique - {isRelay ? 'Agent Relais' : 'Entreprise de Transport'}
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full">
              <BusinessDashboardIcons.CheckCircle className="w-5 h-5" />
              <span className="font-semibold">Compte Actif</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8">
            {[
              { id: 'overview', label: 'Vue d\'ensemble', icon: BusinessDashboardIcons.TrendingUp },
              !isRelay && { id: 'fleet', label: 'Flotte', icon: BusinessDashboardIcons.Truck },
              { id: 'shipments', label: 'Colis', icon: BusinessDashboardIcons.MapPin },
              isRelay && { id: 'relay', label: 'Scanner QR', icon: BusinessDashboardIcons.QRCode },
            ]
              .filter(Boolean)
              .map((tab: any) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-2 border-b-2 font-semibold flex items-center gap-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-orange-600 text-orange-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' && <LogisticsOverview isRelay={isRelay} />}
        {activeTab === 'fleet' && !isRelay && <LogisticsFleet />}
        {activeTab === 'shipments' && <LogisticsShipments isRelay={isRelay} />}
        {activeTab === 'relay' && isRelay && <RelayScanner />}
      </div>
    </div>
  );
}

function LogisticsOverview({ isRelay }: { isRelay: boolean }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {[
        { label: 'Colis en transit', value: '0', icon: BusinessDashboardIcons.Truck, color: 'orange' },
        { label: 'Livraisons du jour', value: '0', icon: BusinessDashboardIcons.MapPin, color: 'blue' },
        { label: 'Taux de succès', value: '0%', icon: BusinessDashboardIcons.CheckCircle, color: 'green' },
        isRelay
          ? { label: 'Colis en stock', value: '0', icon: BusinessDashboardIcons.AlertCircle, color: 'yellow' }
          : { label: 'Véhicules actifs', value: '0', icon: BusinessDashboardIcons.Truck, color: 'purple' },
      ]
        .filter(Boolean)
        .map((stat: any, idx) => {
          const Icon = stat.icon;
          const colorClasses = {
            orange: 'bg-orange-50 text-orange-600 border-orange-200',
            blue: 'bg-blue-50 text-blue-600 border-blue-200',
            green: 'bg-green-50 text-green-600 border-green-200',
            yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
            purple: 'bg-purple-50 text-purple-600 border-purple-200',
          };
          return (
            <div key={idx} className={`${colorClasses[stat.color as keyof typeof colorClasses]} border-2 rounded-xl p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold opacity-75">{stat.label}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                </div>
                <Icon className="w-12 h-12 opacity-20" />
              </div>
            </div>
          );
        })}
    </div>
  );
}

function LogisticsFleet() {
  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Gestion de Flotte</h2>
        <button className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
          + Ajouter un véhicule
        </button>
      </div>
      <div className="text-center py-12">
        <BusinessDashboardIcons.Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Aucun véhicule enregistré</p>
      </div>
    </div>
  );
}

function LogisticsShipments({ isRelay }: { isRelay: boolean }) {
  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {isRelay ? 'Colis en Stock' : 'Suivi des Colis'}
      </h2>
      <div className="text-center py-12">
        <BusinessDashboardIcons.MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Aucun colis pour le moment</p>
      </div>
    </div>
  );
}

function RelayScanner() {
  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Scanner QR Code</h2>
      <div className="flex flex-col items-center justify-center py-12">
        <div className="bg-gray-100 rounded-lg p-8 mb-6">
          <BusinessDashboardIcons.QRCode className="w-24 h-24 text-gray-400" />
        </div>
        <button className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
          Ouvrir le Scanner
        </button>
        <p className="text-gray-500 mt-4">Scannez les codes QR des colis</p>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { BusinessUser } from '@/types/business-dashboard.types';
import { BusinessDashboardIcons } from '@/components/icons/business-dashboard-icons';

interface PaymentDashboardProps {
  businessUser: BusinessUser;
}

export function PaymentDashboard({ businessUser }: PaymentDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'api' | 'transactions' | 'balance'>('overview');
  const isIntegrator = businessUser.subCategory === 'INTEGRATOR';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {businessUser.businessName}
              </h1>
              <p className="text-gray-600 mt-1">
                Dashboard Paiement - {isIntegrator ? 'Intégrateur API' : 'Agent Agréé'}
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
              { id: 'overview', label: 'Vue d\'ensemble', icon: BusinessDashboardIcons.BarChart },
              isIntegrator && { id: 'api', label: 'Clés API', icon: BusinessDashboardIcons.CreditCard },
              { id: 'transactions', label: 'Transactions', icon: BusinessDashboardIcons.DollarSign },
              !isIntegrator && { id: 'balance', label: 'Solde', icon: BusinessDashboardIcons.DollarSign },
            ]
              .filter(Boolean)
              .map((tab: any) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-2 border-b-2 font-semibold flex items-center gap-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-600 text-purple-600'
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
        {activeTab === 'overview' && <PaymentOverview isIntegrator={isIntegrator} />}
        {activeTab === 'api' && isIntegrator && <PaymentAPI />}
        {activeTab === 'transactions' && <PaymentTransactions />}
        {activeTab === 'balance' && !isIntegrator && <AgentBalance />}
      </div>
    </div>
  );
}

function PaymentOverview({ isIntegrator }: { isIntegrator: boolean }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {[
        { label: 'Volume du jour', value: '0 FC', icon: BusinessDashboardIcons.DollarSign, color: 'purple' },
        { label: 'Transactions', value: '0', icon: BusinessDashboardIcons.BarChart, color: 'blue' },
        { label: 'Taux de succès', value: '0%', icon: BusinessDashboardIcons.CheckCircle, color: 'green' },
        isIntegrator
          ? { label: 'Appels API', value: '0', icon: BusinessDashboardIcons.CreditCard, color: 'pink' }
          : { label: 'Commissions', value: '0 FC', icon: BusinessDashboardIcons.DollarSign, color: 'yellow' },
      ]
        .filter(Boolean)
        .map((stat: any, idx) => {
          const Icon = stat.icon;
          const colorClasses = {
            purple: 'bg-purple-50 text-purple-600 border-purple-200',
            blue: 'bg-blue-50 text-blue-600 border-blue-200',
            green: 'bg-green-50 text-green-600 border-green-200',
            pink: 'bg-pink-50 text-pink-600 border-pink-200',
            yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
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

function PaymentAPI() {
  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Gestion des Clés API</h2>
        <button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
          + Générer une clé
        </button>
      </div>

      <div className="space-y-4 mb-8">
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Clé Publique</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white p-2 rounded border border-gray-300 text-sm font-mono text-gray-700">
              pk_live_xxxxxxxxxxxxx
            </code>
            <button className="text-blue-600 hover:text-blue-700 font-semibold">Copier</button>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Clé Secrète</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white p-2 rounded border border-gray-300 text-sm font-mono text-gray-700">
              sk_live_xxxxxxxxxxxxx
            </code>
            <button className="text-blue-600 hover:text-blue-700 font-semibold">Copier</button>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <p className="text-sm text-blue-700">
          <strong>Sécurité:</strong> Ne partagez jamais votre clé secrète. Utilisez uniquement la clé publique côté client.
        </p>
      </div>
    </div>
  );
}

function PaymentTransactions() {
  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Historique des Transactions</h2>
      <div className="text-center py-12">
        <BusinessDashboardIcons.BarChart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Aucune transaction pour le moment</p>
      </div>
    </div>
  );
}

function AgentBalance() {
  return (
    <div className="space-y-6">
      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-8 text-white">
          <p className="text-sm opacity-90 mb-2">Solde Total</p>
          <p className="text-4xl font-bold">0 FC</p>
        </div>
        <div className="bg-gradient-to-br from-pink-600 to-pink-700 rounded-xl p-8 text-white">
          <p className="text-sm opacity-90 mb-2">Commissions Gagnées</p>
          <p className="text-4xl font-bold">0 FC</p>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Transactions Récentes</h3>
        <div className="text-center py-12">
          <BusinessDashboardIcons.DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucune transaction pour le moment</p>
        </div>
      </div>

      {/* Daily Report */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Relevé du Jour</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
            <span className="text-gray-700">Dépôts</span>
            <span className="font-semibold">0 FC</span>
          </div>
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
            <span className="text-gray-700">Retraits</span>
            <span className="font-semibold">0 FC</span>
          </div>
          <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
            <span className="text-purple-700 font-semibold">Net du jour</span>
            <span className="font-bold text-purple-700">0 FC</span>
          </div>
        </div>
      </div>
    </div>
  );
}

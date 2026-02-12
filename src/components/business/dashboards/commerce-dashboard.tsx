'use client';

import React, { useState } from 'react';
import { BusinessUser } from '@/types/business-dashboard.types';
import { BusinessDashboardIcons } from '@/components/icons/business-dashboard-icons';

interface CommerceDashboardProps {
  businessUser: BusinessUser;
}

export function CommerceDashboard({ businessUser }: CommerceDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'marketing'>('overview');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {businessUser.businessName}
              </h1>
              <p className="text-gray-600 mt-1">Dashboard Commerce</p>
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
              { id: 'products', label: 'Catalogue', icon: BusinessDashboardIcons.Product },
              { id: 'orders', label: 'Commandes', icon: BusinessDashboardIcons.ShoppingCart },
              { id: 'marketing', label: 'Marketing', icon: BusinessDashboardIcons.TrendingUp },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`py-4 px-2 border-b-2 font-semibold flex items-center gap-2 transition-colors ${
                  activeTab === id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' && <CommerceOverview />}
        {activeTab === 'products' && <CommerceProducts />}
        {activeTab === 'orders' && <CommerceOrders />}
        {activeTab === 'marketing' && <CommerceMarketing />}
      </div>
    </div>
  );
}

function CommerceOverview() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {[
        { label: 'Chiffre d\'affaires', value: '0 FC', icon: BusinessDashboardIcons.DollarSign, color: 'blue' },
        { label: 'Commandes en attente', value: '0', icon: BusinessDashboardIcons.ShoppingCart, color: 'yellow' },
        { label: 'Produits', value: '0', icon: BusinessDashboardIcons.Product, color: 'green' },
        { label: 'Ruptures de stock', value: '0', icon: BusinessDashboardIcons.AlertCircle, color: 'red' },
      ].map((stat, idx) => {
        const Icon = stat.icon;
        const colorClasses = {
          blue: 'bg-blue-50 text-blue-600 border-blue-200',
          yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
          green: 'bg-green-50 text-green-600 border-green-200',
          red: 'bg-red-50 text-red-600 border-red-200',
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

function CommerceProducts() {
  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Gestion du Catalogue</h2>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
          + Ajouter un produit
        </button>
      </div>
      <div className="text-center py-12">
        <BusinessDashboardIcons.Product className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Aucun produit pour le moment</p>
      </div>
    </div>
  );
}

function CommerceOrders() {
  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Gestion des Commandes</h2>
      <div className="text-center py-12">
        <BusinessDashboardIcons.ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Aucune commande pour le moment</p>
      </div>
    </div>
  );
}

function CommerceMarketing() {
  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Promotions & Coupons</h2>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
          + Créer une promo
        </button>
      </div>
      <div className="text-center py-12">
        <BusinessDashboardIcons.TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Aucune promotion pour le moment</p>
      </div>
    </div>
  );
}

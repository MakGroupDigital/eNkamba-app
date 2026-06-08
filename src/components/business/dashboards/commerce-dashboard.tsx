'use client';

import React, { useState } from 'react';
import { BusinessUser } from '@/types/business-dashboard.types';
import { BusinessDashboardIcons } from '@/components/icons/business-dashboard-icons';
import {
  NkampaIcon,
  ShopNavIcon,
  TrackPackageIcon,
} from '@/components/icons/service-icons';
import {
  B2BProductIcon,
  PriceIcon,
  TrackingIcon,
} from '@/components/icons/nkampa-ecommerce-icons';
import { ProductIcon } from '@/components/icons/nkampa-category-icons';

interface CommerceDashboardProps {
  businessUser: BusinessUser;
}

export function CommerceDashboard({ businessUser }: CommerceDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'marketing'>('overview');
  const tabs = [
    { id: 'overview', label: 'Vue d’ensemble', icon: NkampaIcon },
    { id: 'products', label: 'Catalogue', icon: ProductIcon },
    { id: 'orders', label: 'Commandes', icon: TrackPackageIcon },
    { id: 'marketing', label: 'Marketing', icon: PriceIcon },
  ] as const;
  const quickActions = [
    { label: 'Catalogue', description: 'Produits et services', tab: 'products' as const, icon: ProductIcon },
    { label: 'Commandes', description: 'Suivi et préparation', tab: 'orders' as const, icon: TrackPackageIcon },
    { label: 'Promos', description: 'Offres et coupons', tab: 'marketing' as const, icon: PriceIcon },
    { label: 'Boutique', description: 'Espace vendeur', tab: 'overview' as const, icon: ShopNavIcon },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(50,187,120,0.14),transparent_34%),linear-gradient(180deg,rgba(50,187,120,0.05)_0%,rgba(50,187,120,0.08)_54%,rgba(50,187,120,0.04)_100%)] pb-24 text-foreground">
      <div className="sticky top-0 z-30 rounded-b-[32px] bg-gradient-to-r from-[#32BB78] via-[#32BB78] to-[#32BB78] px-4 pb-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] text-white shadow-lg shadow-[#32BB78]/20">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border border-white/30 bg-white shadow-md">
                <NkampaIcon size={38} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/70">Nkampa Business</p>
                <h1 className="truncate text-xl font-black leading-tight">{businessUser.businessName}</h1>
                <p className="truncate text-xs font-medium text-white/75">Dashboard Commerce</p>
              </div>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-2 text-xs font-bold backdrop-blur sm:flex">
              <BusinessDashboardIcons.CheckCircle className="w-5 h-5" />
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
          <div className="relative bg-gradient-to-br from-[#32BB78] via-[#32BB78] to-[#32BB78] p-5 text-white">
            <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/15 blur-2xl" />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/14 px-3 py-1 text-xs font-bold text-white/80">
                  <span className="h-2 w-2 rounded-full bg-[#FF8C00]" />
                  Commerce & e-commerce
                </div>
                <h2 className="mt-4 max-w-2xl text-2xl font-black leading-tight sm:text-3xl">
                  Gérez boutique, catalogue, commandes et promotions dans un seul espace.
                </h2>
                <p className="mt-2 max-w-xl text-sm text-white/75">
                  Suivi vendeur, visibilité produits, offres commerciales et pilotage B2B/B2C.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:min-w-72">
                <CommercePill label="Ventes" value="0 FC" />
                <CommercePill label="Commandes" value="0" />
                <CommercePill label="Stock" value="0" />
              </div>
            </div>
          </div>
          <CommerceOverview />
        </section>

        <section className="overflow-hidden rounded-3xl border border-[#32BB78] bg-white shadow-sm">
          <div className="flex gap-2 overflow-x-auto p-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex min-w-fit items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                  activeTab === id
                    ? 'bg-[#32BB78] text-white shadow-md shadow-[#32BB78]/20'
                    : 'bg-primary/5 text-muted-foreground hover:bg-primary/10 hover:text-[#32BB78]'
                }`}
              >
                <Icon size={22} />
                {label}
              </button>
            ))}
          </div>
        </section>

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
    <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
      {[
        { label: 'Chiffre d\'affaires', value: '0 FC', icon: PriceIcon, color: 'blue' },
        { label: 'Commandes en attente', value: '0', icon: TrackPackageIcon, color: 'yellow' },
        { label: 'Produits', value: '0', icon: ProductIcon, color: 'green' },
        { label: 'Ruptures de stock', value: '0', icon: BusinessDashboardIcons.AlertCircle, color: 'red' },
      ].map((stat, idx) => {
        const Icon = stat.icon;
        const colorClasses = {
          blue: 'bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]',
          yellow: 'bg-[#fffbeb] text-[#92400e] border-[#fde68a]',
          green: 'bg-[#32BB78] text-[#32BB78] border-[#32BB78]',
          red: 'bg-[#fef2f2] text-[#b91c1c] border-[#fecaca]',
        };
        return (
          <div key={idx} className={`${colorClasses[stat.color as keyof typeof colorClasses]} rounded-2xl border p-4`}>
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
      })}
    </div>
  );
}

function CommerceProducts() {
  return (
    <div className="rounded-3xl border border-[#32BB78] bg-white p-5 shadow-sm">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-foreground">Gestion du Catalogue</h2>
          <p className="text-sm text-muted-foreground">Ajoutez vos produits, services et offres B2B/B2C.</p>
        </div>
        <button className="rounded-2xl bg-[#32BB78] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#32BB78]">
          + Ajouter un produit
        </button>
      </div>
      <EmptyCommerceState icon={B2BProductIcon} title="Aucun produit pour le moment" text="Votre catalogue apparaîtra ici dès que vous publiez vos premiers articles." />
    </div>
  );
}

function CommerceOrders() {
  return (
    <div className="rounded-3xl border border-[#32BB78] bg-white p-5 shadow-sm">
      <h2 className="mb-1 text-xl font-black text-foreground">Gestion des Commandes</h2>
      <p className="mb-6 text-sm text-muted-foreground">Préparation, paiement, livraison et suivi client.</p>
      <EmptyCommerceState icon={TrackingIcon} title="Aucune commande pour le moment" text="Les commandes Nkampa apparaîtront dans cette section." />
    </div>
  );
}

function CommerceMarketing() {
  return (
    <div className="rounded-3xl border border-[#32BB78] bg-white p-5 shadow-sm">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-foreground">Promotions & Coupons</h2>
          <p className="text-sm text-muted-foreground">Animez les offres, réductions et campagnes boutique.</p>
        </div>
        <button className="rounded-2xl bg-[#FF8C00] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#E67E00]">
          + Créer une promo
        </button>
      </div>
      <EmptyCommerceState icon={PriceIcon} title="Aucune promotion pour le moment" text="Créez une offre pour la pousser dans l’écosystème eNkamba." />
    </div>
  );
}

function CommercePill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/18 bg-white/14 p-3 text-center backdrop-blur">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/65">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function EmptyCommerceState({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-[#32BB78] bg-[#32BB78] px-5 py-12 text-center">
      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-sm">
        <Icon size={48} />
      </div>
      <p className="font-black text-foreground">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

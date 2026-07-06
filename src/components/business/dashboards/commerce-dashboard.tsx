'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { BarChart3, Share2 } from 'lucide-react';
import { BusinessUser } from '@/types/business-dashboard.types';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { BusinessDashboardIcons } from '@/components/icons/business-dashboard-icons';
import { CommerceProductBuilder } from '@/components/business/dashboards/commerce-product-builder';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'marketing' | 'newProduct'>('overview');
  const [commerceProducts, setCommerceProducts] = useState<any[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState(true);

  useEffect(() => {
    if (!businessUser.uid) return;
    setIsProductsLoading(true);
    const q = query(collection(db, 'nkampa_products'), where('sellerId', '==', businessUser.uid));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const products = snapshot.docs
          .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
          .filter((product: any) => (
            product.businessProductType === 'commerce-pro' ||
            product.marketplaceSource === 'business-commerce' ||
            (businessUser.businessId && product.businessId === businessUser.businessId)
          ));
        setCommerceProducts(products);
        setIsProductsLoading(false);
      },
      (error) => {
        console.error('Erreur chargement produits commerce pro:', error);
        setCommerceProducts([]);
        setIsProductsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [businessUser.businessId, businessUser.uid]);

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
      <div className="sticky top-0 z-30 rounded-b-[32px] bg-gradient-to-r from-[#009058] via-[#009058] to-[#009058] px-4 pb-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] text-white shadow-lg shadow-[#009058]/20">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-3xl border border-white/30 bg-white shadow-md">
                <NkampaIcon size={62} className="h-[62px] w-[62px]" />
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
                  <span className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-white shadow-md transition group-hover:scale-105">
                    <Icon size={58} className="h-[58px] w-[58px]" />
                  </span>
                  <span className="line-clamp-2 text-[11px] font-bold leading-tight text-white">{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-5 px-4 py-5">
        <section className="overflow-hidden rounded-3xl border border-[#009058] bg-white shadow-sm">
          <div className="flex gap-2 overflow-x-auto p-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex min-w-fit items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                  activeTab === id
                    ? 'bg-[#009058] text-white shadow-md shadow-[#009058]/20'
                    : 'bg-primary/5 text-muted-foreground hover:bg-primary/10 hover:text-[#009058]'
                }`}
              >
                <Icon size={34} className="h-[34px] w-[34px]" />
                {label}
              </button>
            ))}
          </div>
        </section>

        {activeTab === 'overview' && <CommerceOverview productCount={commerceProducts.length} />}
        {activeTab === 'products' && (
          <CommerceProducts
            products={commerceProducts}
            isLoading={isProductsLoading}
            onAdd={() => setActiveTab('newProduct')}
          />
        )}
        {activeTab === 'orders' && <CommerceOrders />}
        {activeTab === 'marketing' && <CommerceMarketing />}
        {activeTab === 'newProduct' && (
          <CommerceProductBuilder
            businessUser={businessUser}
            onBack={() => setActiveTab('products')}
            onCreated={() => setActiveTab('products')}
          />
        )}
      </div>
    </div>
  );
}

function CommerceOverview({ productCount }: { productCount: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
      {[
        { label: 'Chiffre d\'affaires', value: '0 FC', icon: PriceIcon, color: 'blue' },
        { label: 'Commandes en attente', value: '0', icon: TrackPackageIcon, color: 'yellow' },
        { label: 'Produits', value: String(productCount), icon: ProductIcon, color: 'green' },
        { label: 'Ruptures de stock', value: '0', icon: BusinessDashboardIcons.AlertCircle, color: 'red' },
      ].map((stat, idx) => {
        const Icon = stat.icon;
        const colorClasses = {
          blue: 'bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]',
          yellow: 'bg-[#fffbeb] text-[#92400e] border-[#fde68a]',
          green: 'bg-[#009058] text-[#009058] border-[#009058]',
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

function CommerceProducts({
  products,
  isLoading,
  onAdd,
}: {
  products: any[];
  isLoading: boolean;
  onAdd: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const shareProduct = async (product: any) => {
    const storeSlug = product.storeSlug || 'boutique';
    const url = `${window.location.origin}/shop/${storeSlug}/product/${product.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name || 'Produit eNkamba', url });
      } else {
        await navigator.clipboard.writeText(url);
        toast({ title: 'Lien copié', description: 'Lien du produit copié.', className: 'bg-primary text-white border-none' });
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        toast({ title: 'Lien copié', description: 'Lien du produit copié.', className: 'bg-primary text-white border-none' });
      } catch {
        toast({ variant: 'destructive', title: 'Partage impossible', description: 'Impossible de partager ce produit.' });
      }
    }
  };

  return (
    <div className="rounded-3xl border border-[#009058] bg-white p-5 shadow-sm">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-foreground">Gestion du Catalogue</h2>
          <p className="text-sm text-muted-foreground">Catalogue e-commerce entreprise synchronisé avec le marché.</p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="rounded-2xl bg-[#009058] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#009058]"
        >
          + Ajouter un produit
        </button>
      </div>
      {isLoading ? (
        <div className="rounded-3xl border border-dashed border-[#009058]/30 bg-[#009058]/5 px-5 py-12 text-center text-sm font-bold text-muted-foreground">
          Chargement du catalogue...
        </div>
      ) : products.length === 0 ? (
        <EmptyCommerceState icon={B2BProductIcon} title="Aucun produit pour le moment" text="Votre catalogue commerce pro apparaîtra ici dès que vous publiez vos premiers articles." />
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <div
              key={product.id}
              role="button"
              tabIndex={0}
              onClick={() => router.push(`/dashboard/business-pro/commerce/product/${product.id}`)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  router.push(`/dashboard/business-pro/commerce/product/${product.id}`);
                }
              }}
              className="overflow-hidden rounded-[24px] border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#009058]/40 hover:shadow-md"
            >
              <div className="relative aspect-square bg-slate-100">
                <Image
                  src={product.image || product.images?.[0] || 'https://picsum.photos/seed/business-commerce/500/500'}
                  alt={product.name || 'Produit'}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 240px"
                />
                <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[10px] font-black text-[#009058] shadow">
                  {product.businessAudience || product.category || 'COMMERCE'}
                </span>
              </div>
              <div className="space-y-1.5 p-3">
                <p className="line-clamp-2 text-sm font-black text-slate-950">{product.name}</p>
                <p className="text-sm font-black text-[#009058]">
                  {Number(product.price || 0).toLocaleString('fr-FR')} {product.currency || 'CDF'}
                </p>
                <p className="line-clamp-1 text-[11px] font-semibold text-slate-500">
                  {product.storeCategory || 'rayon'} · {product.storeSubcategory || 'marché'}
                </p>
                {product.stock !== null && product.stock !== undefined ? (
                  <p className="text-[11px] font-bold text-slate-600">Stock: {Number(product.stock || 0).toLocaleString('fr-FR')}</p>
                ) : (
                  <p className="text-[11px] font-bold text-slate-600">Service / digital</p>
                )}
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <span className="inline-flex items-center justify-center gap-1 rounded-xl bg-[#009058]/10 px-2 py-2 text-[11px] font-black text-[#009058]">
                    <BarChart3 className="h-3.5 w-3.5" />
                    Stats
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                      event.stopPropagation();
                      void shareProduct(product);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        event.stopPropagation();
                        void shareProduct(product);
                      }
                    }}
                    className="inline-flex items-center justify-center gap-1 rounded-xl bg-slate-100 px-2 py-2 text-[11px] font-black text-slate-700"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    Partager
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CommerceOrders() {
  return (
    <div className="rounded-3xl border border-[#009058] bg-white p-5 shadow-sm">
      <h2 className="mb-1 text-xl font-black text-foreground">Gestion des Commandes</h2>
      <p className="mb-6 text-sm text-muted-foreground">Préparation, paiement, livraison et suivi client.</p>
      <EmptyCommerceState icon={TrackingIcon} title="Aucune commande pour le moment" text="Les commandes Nkampa apparaîtront dans cette section." />
    </div>
  );
}

function CommerceMarketing() {
  return (
    <div className="rounded-3xl border border-[#009058] bg-white p-5 shadow-sm">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-foreground">Promotions & Coupons</h2>
          <p className="text-sm text-muted-foreground">Animez les offres, réductions et campagnes boutique.</p>
        </div>
        <button className="rounded-2xl bg-[#FFA500] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#FFA500]">
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
    <div className="rounded-3xl border border-dashed border-[#009058] bg-[#009058] px-5 py-12 text-center">
      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-sm">
        <Icon size={48} />
      </div>
      <p className="font-black text-foreground">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

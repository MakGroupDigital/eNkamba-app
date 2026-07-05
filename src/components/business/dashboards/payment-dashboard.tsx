'use client';

import React, { useState } from 'react';
import { BusinessUser } from '@/types/business-dashboard.types';
import { BusinessDashboardIcons } from '@/components/icons/business-dashboard-icons';
import {
  CreditIcon,
  LinkAccountIcon,
  PaymentNavIcon,
  ReportNavIcon,
  SecurityIcon,
  WalletNavIcon,
} from '@/components/icons/service-icons';

interface PaymentDashboardProps {
  businessUser: BusinessUser;
}

type PaymentTab = 'overview' | 'api' | 'tokens' | 'generation' | 'integration' | 'docs' | 'transactions' | 'balance';

const tabs: Array<{ id: PaymentTab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = [
  { id: 'overview', label: 'Vue d’ensemble', icon: PaymentNavIcon },
  { id: 'api', label: 'API', icon: LinkAccountIcon },
  { id: 'tokens', label: 'Tokens', icon: SecurityIcon },
  { id: 'generation', label: 'Génération', icon: CreditIcon },
  { id: 'integration', label: 'Intégration', icon: WalletNavIcon },
  { id: 'docs', label: 'Documentation', icon: ReportNavIcon },
  { id: 'transactions', label: 'Transactions', icon: BusinessDashboardIcons.BarChart },
  { id: 'balance', label: 'Solde', icon: WalletNavIcon },
];

export function PaymentDashboard({ businessUser }: PaymentDashboardProps) {
  const [activeTab, setActiveTab] = useState<PaymentTab>('overview');
  const isIntegrator = businessUser.subCategory === 'INTEGRATOR';
  const quickActions = [
    { label: 'API', tab: 'api' as const, icon: LinkAccountIcon },
    { label: 'Tokens', tab: 'tokens' as const, icon: SecurityIcon },
    { label: 'Générer', tab: 'generation' as const, icon: CreditIcon },
    { label: 'Docs', tab: 'docs' as const, icon: ReportNavIcon },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(50,187,120,0.14),transparent_34%),linear-gradient(180deg,rgba(50,187,120,0.05)_0%,rgba(50,187,120,0.08)_54%,rgba(50,187,120,0.04)_100%)] pb-24 text-foreground">
      <div className="sticky top-0 z-30 rounded-b-[32px] bg-gradient-to-r from-[#25543A] via-[#25543A] to-[#25543A] px-4 pb-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] text-white shadow-lg shadow-[#25543A]/20">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border border-white/30 bg-white shadow-md">
                <PaymentNavIcon size={38} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/70">Mbongo Business</p>
                <h1 className="truncate text-xl font-black leading-tight">{businessUser.businessName}</h1>
                <p className="truncate text-xs font-medium text-white/75">
                  {isIntegrator ? 'Intégrateur API' : 'Agent agréé / compte paiement'}
                </p>
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
        <section className="overflow-hidden rounded-3xl border border-[#25543A] bg-white shadow-sm">
          <div className="flex gap-2 overflow-x-auto p-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex min-w-fit items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                  activeTab === id
                    ? 'bg-[#25543A] text-white shadow-md shadow-[#25543A]/20'
                    : 'bg-primary/5 text-muted-foreground hover:bg-primary/10 hover:text-[#25543A]'
                }`}
              >
                <Icon size={22} />
                {label}
              </button>
            ))}
          </div>
        </section>

        {activeTab === 'overview' && <PaymentOverview isIntegrator={isIntegrator} />}
        {activeTab === 'api' && <PaymentAPI />}
        {activeTab === 'tokens' && <PaymentTokens />}
        {activeTab === 'generation' && <PaymentGeneration />}
        {activeTab === 'integration' && <PaymentIntegration />}
        {activeTab === 'docs' && <PaymentDocumentation />}
        {activeTab === 'transactions' && <PaymentTransactions />}
        {activeTab === 'balance' && <AgentBalance />}
      </div>
    </div>
  );
}

function PaymentOverview({ isIntegrator }: { isIntegrator: boolean }) {
  const stats = [
    { label: 'Volume du jour', value: '0 FC', icon: CreditIcon, color: 'green' },
    { label: 'Transactions', value: '0', icon: BusinessDashboardIcons.BarChart, color: 'blue' },
    { label: 'Taux de succès', value: '0%', icon: BusinessDashboardIcons.CheckCircle, color: 'emerald' },
    isIntegrator
      ? { label: 'Appels API', value: '0', icon: LinkAccountIcon, color: 'orange' }
      : { label: 'Commissions', value: '0 FC', icon: WalletNavIcon, color: 'orange' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
      {stats.map((stat, idx) => (
        <PaymentMetricCard key={`${stat.label}-${idx}`} stat={stat} />
      ))}
    </div>
  );
}

function PaymentAPI() {
  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <Panel title="Clés API" subtitle="Séparez toujours les environnements test et production." action="+ Générer une clé">
        <ApiCredential label="Clé publique" value="pk_live_xxxxxxxxxxxxx" />
        <ApiCredential label="Clé secrète" value="sk_live_xxxxxxxxxxxxx" sensitive />
        <ApiCredential label="Webhook secret" value="whsec_xxxxxxxxxxxxx" sensitive />
      </Panel>
      <Panel title="Statut API" subtitle="Préparation du trafic technique Mbongo.">
        <div className="grid gap-3">
          {[
            ['Environnement', 'Live + Sandbox'],
            ['Version API', 'v1'],
            ['Webhooks', 'Non configurés'],
            ['Dernier appel', 'Aucun'],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between rounded-2xl bg-[#25543A] px-4 py-3">
              <span className="text-sm font-semibold text-muted-foreground">{label}</span>
              <span className="text-sm font-black text-foreground">{value}</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function PaymentTokens() {
  return (
    <Panel title="Tokens d’accès" subtitle="Créez des tokens limités par usage, durée et module." action="+ Nouveau token">
      <div className="grid gap-3 md:grid-cols-3">
        {[
          { title: 'Token checkout', scope: 'Paiement client', status: 'Prêt' },
          { title: 'Token wallet', scope: 'Solde & mouvements', status: 'À générer' },
          { title: 'Token reporting', scope: 'Rapports & exports', status: 'À générer' },
        ].map((token) => (
          <div key={token.title} className="rounded-3xl border border-[#25543A] bg-[#25543A] p-4">
            <SecurityIcon size={34} />
            <p className="mt-3 font-black text-foreground">{token.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{token.scope}</p>
            <span className="mt-4 inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold text-[#25543A]">
              {token.status}
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function PaymentGeneration() {
  const [generatedKey, setGeneratedKey] = useState('pk_test_demo_xxxxxxxx');
  const generateKey = () => {
    const suffix = Math.random().toString(36).slice(2, 12);
    setGeneratedKey(`pk_test_${suffix}`);
  };

  return (
    <Panel title="Génération" subtitle="Génération locale de prévisualisation. La clé réelle doit être créée côté serveur sécurisé.">
      <div className="rounded-3xl bg-[#25543A] p-5 text-white">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">Nouvelle clé test</p>
        <code className="mt-3 block overflow-x-auto rounded-2xl bg-white/10 p-4 text-sm font-bold text-white">{generatedKey}</code>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <button onClick={generateKey} className="rounded-2xl bg-[#25543A] px-4 py-3 text-sm font-bold text-white">Générer</button>
          <button className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#25543A]">Copier</button>
          <button className="rounded-2xl bg-[#FF8C00] px-4 py-3 text-sm font-bold text-white">Révoquer</button>
        </div>
      </div>
    </Panel>
  );
}

function PaymentIntegration() {
  return (
    <Panel title="Intégration" subtitle="Points d’intégration recommandés pour vos apps, sites et boutiques.">
      <div className="grid gap-3 md:grid-cols-2">
        {[
          ['Checkout web', 'Redirection sécurisée ou composant embarqué.'],
          ['Mobile money', 'Encaissements client et confirmation de statut.'],
          ['Wallet business', 'Solde, commissions et mouvements.'],
          ['Webhooks', 'Notifications paiement réussi, échoué, remboursé.'],
        ].map(([title, text]) => (
          <div key={title} className="rounded-3xl border border-[#25543A] bg-white p-4">
            <LinkAccountIcon size={34} />
            <p className="mt-3 font-black text-foreground">{title}</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function PaymentDocumentation() {
  return (
    <Panel title="Documentation" subtitle="Guides rapides pour brancher Mbongo dans un produit.">
      <div className="space-y-3">
        {[
          ['Démarrage rapide', 'Créer une clé test, appeler le checkout, vérifier le statut.'],
          ['Référence API', 'Endpoints paiement, wallet, remboursement, reporting.'],
          ['Webhooks', 'Signature, retry, idempotence et événements.'],
          ['Sécurité', 'Rotation des secrets, scopes, tokens courts et logs.'],
        ].map(([title, text]) => (
          <button key={title} className="flex w-full items-center justify-between gap-4 rounded-2xl bg-[#25543A] px-4 py-4 text-left">
            <span>
              <span className="block font-black text-foreground">{title}</span>
              <span className="mt-1 block text-sm text-muted-foreground">{text}</span>
            </span>
            <ReportNavIcon size={28} />
          </button>
        ))}
      </div>
    </Panel>
  );
}

function PaymentTransactions() {
  return (
    <Panel title="Historique des transactions" subtitle="Les paiements, remboursements et encaissements apparaîtront ici.">
      <EmptyPaymentState icon={BusinessDashboardIcons.BarChart} text="Aucune transaction pour le moment" />
    </Panel>
  );
}

function AgentBalance() {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-3xl bg-gradient-to-br from-[#25543A] to-[#25543A] p-6 text-white">
          <p className="text-sm font-bold text-white/70">Solde total</p>
          <p className="mt-2 text-4xl font-black">0 FC</p>
        </div>
        <div className="rounded-3xl bg-gradient-to-br from-[#FF8C00] to-[#E67E00] p-6 text-white">
          <p className="text-sm font-bold text-white/70">Commissions gagnées</p>
          <p className="mt-2 text-4xl font-black">0 FC</p>
        </div>
      </div>
      <Panel title="Relevé du jour" subtitle="Synthèse des dépôts, retraits et net business.">
        {['Dépôts', 'Retraits', 'Net du jour'].map((item) => (
          <div key={item} className="mb-3 flex items-center justify-between rounded-2xl bg-[#25543A] px-4 py-3">
            <span className="text-sm font-bold text-muted-foreground">{item}</span>
            <span className="font-black text-foreground">0 FC</span>
          </div>
        ))}
      </Panel>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle: string;
  action?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-[#25543A] bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {action && (
          <button className="rounded-2xl bg-[#25543A] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#25543A]">
            {action}
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

function ApiCredential({ label, value, sensitive = false }: { label: string; value: string; sensitive?: boolean }) {
  return (
    <div className="mb-3 rounded-2xl border border-[#25543A] bg-[#25543A] p-4">
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <code className="min-w-0 flex-1 overflow-x-auto rounded-xl bg-white p-3 text-sm font-bold text-foreground">
          {sensitive ? value.replace(/x/g, '•') : value}
        </code>
        <button className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#25543A] ring-1 ring-[#25543A]">Copier</button>
      </div>
    </div>
  );
}

function PaymentMetricCard({ stat }: { stat: { label: string; value: string; icon: React.ComponentType<any>; color: string } }) {
  const Icon = stat.icon;
  const colorClasses = {
    green: 'bg-[#25543A] text-[#25543A] border-[#25543A]',
    blue: 'bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]',
    emerald: 'bg-[#25543A] text-[#25543A] border-[#25543A]',
    orange: 'bg-[#fff7ed] text-[#9a4a00] border-[#fed7aa]',
  };
  const className = colorClasses[stat.color as keyof typeof colorClasses] || colorClasses.green;

  return (
    <div className={`rounded-2xl border p-4 ${className}`}>
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

function PaymentPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/18 bg-white/14 p-3 text-center backdrop-blur">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/65">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function EmptyPaymentState({ icon: Icon, text }: { icon: React.ComponentType<any>; text: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-[#25543A] bg-[#25543A] px-5 py-12 text-center">
      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-sm">
        <Icon className="h-12 w-12 text-[#25543A]" size={48} />
      </div>
      <p className="font-black text-foreground">{text}</p>
    </div>
  );
}

'use client';

import type { ComponentType } from 'react';
import { useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAgentRelayStatus } from '@/hooks/useAgentRelayStatus';
import {
  AgentIcon,
  CreditIcon,
  LogisticsNavIcon,
  PhoneCreditIcon,
  ReferralIcon,
  ShopNavIcon,
  WalletNavIcon,
} from '@/components/icons/service-icons';
import {
  BulkPaymentTransactionIcon,
  DepositTransactionIcon,
  PaymentTransactionIcon,
  ReceiveTransactionIcon,
  TransferTransactionIcon,
  WithdrawalTransactionIcon,
} from '@/components/icons/transaction-icons';
import { VerifiedIcon } from '@/components/icons/seller-portal-icons';

type AgentRelayAccountType = 'agent-relais' | 'cabinet' | 'point-service';

type DashboardAction = {
  key: string;
  title: string;
  description: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  href?: string;
  comingSoon?: boolean;
  badge?: string;
};

type DashboardModule = {
  key: string;
  title: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  href: string;
};

const typeLabels: Record<AgentRelayAccountType, string> = {
  'agent-relais': 'Agent Relais',
  cabinet: 'Cabiniste',
  'point-service': 'Point de Service',
};

const typeThemes: Record<
  AgentRelayAccountType,
  {
    gradient: string;
    accent: string;
    accentSoft: string;
    accentText: string;
    heroIcon: ComponentType<{ size?: number; className?: string }>;
  }
> = {
  'agent-relais': {
    gradient: 'from-[#479B67] via-[#479B67] to-[#479B67]',
    accent: '#479B67',
    accentSoft: 'bg-[#479B67]/10',
    accentText: 'text-[#479B67]',
    heroIcon: AgentIcon,
  },
  cabinet: {
    gradient: 'from-[#479B67] via-[#479B67] to-[#479B67]',
    accent: '#479B67',
    accentSoft: 'bg-[#479B67]/10',
    accentText: 'text-[#479B67]',
    heroIcon: AgentIcon,
  },
  'point-service': {
    gradient: 'from-[#479B67] via-[#479B67] to-[#479B67]',
    accent: '#479B67',
    accentSoft: 'bg-[#479B67]/10',
    accentText: 'text-[#479B67]',
    heroIcon: LogisticsNavIcon,
  },
};

const actionsByType: Record<AgentRelayAccountType, DashboardAction[]> = {
  cabinet: [
    {
      key: 'credit',
      title: 'Créditer mon compte',
      description: 'Ajouter des fonds sur votre solde',
      icon: DepositTransactionIcon,
      href: '/dashboard/agent-relay/ops/credit',
    },
    {
      key: 'withdraw',
      title: 'Retrait',
      description: 'Retirer des fonds en caisse',
      icon: WithdrawalTransactionIcon,
      href: '/dashboard/agent-relay/ops/withdraw',
    },
    {
      key: 'collect',
      title: 'Encaisser',
      description: 'Recevoir un paiement (QR / lien)',
      icon: ReceiveTransactionIcon,
      href: '/dashboard/agent-relay/ops/collect',
    },
    {
      key: 'transfer',
      title: 'Transfert',
      description: 'Envoyer de l’argent à un client',
      icon: TransferTransactionIcon,
      href: '/dashboard/agent-relay/ops/transfer',
    },
    {
      key: 'airtime',
      title: 'Airtime',
      description: 'Vendre du crédit téléphonique',
      icon: PhoneCreditIcon,
      href: '/dashboard/agent-relay/ops/airtime',
    },
    {
      key: 'referral',
      title: 'Parrainage',
      description: 'Inviter et gagner des bonus',
      icon: ReferralIcon,
      href: '/dashboard/agent-relay/ops/referral',
    },
  ],
  'agent-relais': [
    {
      key: 'deposit_withdraw',
      title: 'Dépôt & Retrait',
      description: 'Opérations cash avec les clients',
      icon: BulkPaymentTransactionIcon,
      href: '/dashboard/agent-relay/ops/deposit-withdraw',
    },
    {
      key: 'transfer',
      title: 'Transfert d’argent',
      description: 'Envoyer / recevoir pour un client',
      icon: TransferTransactionIcon,
      href: '/dashboard/agent-relay/ops/transfer',
    },
    {
      key: 'collect',
      title: 'Encaisser',
      description: 'Paiement par QR ou lien',
      icon: ReceiveTransactionIcon,
      href: '/dashboard/agent-relay/ops/collect',
    },
    {
      key: 'qr_scan',
      title: 'QR Scan',
      description: 'Scanner un code pour payer',
      icon: PaymentTransactionIcon,
      href: '/dashboard/agent-relay/ops/collect?mode=scan',
    },
    {
      key: 'create_account',
      title: 'Créer compte',
      description: 'Onboarder un nouveau client',
      icon: CreditIcon,
      href: '/dashboard/agent-relay/ops/create-account',
      badge: 'Nouveau',
    },
    {
      key: 'clients',
      title: 'Mes clients',
      description: 'Gérer les clients servis',
      icon: AgentIcon,
      href: '/dashboard/agent-relay/ops/clients',
    },
  ],
  'point-service': [
    {
      key: 'ecommerce',
      title: 'E‑Commerce',
      description: 'Accéder aux commandes',
      icon: ShopNavIcon,
      href: '/dashboard/nkampa',
    },
    {
      key: 'logistics',
      title: 'Logistique',
      description: 'Suivre et gérer les colis',
      icon: LogisticsNavIcon,
      href: '/dashboard/ugavi',
    },
    {
      key: 'scan_colis',
      title: 'Scannez colis',
      description: 'Scanner / vérifier un colis',
      icon: PaymentTransactionIcon,
      href: '/dashboard/ugavi',
    },
    {
      key: 'collect',
      title: 'Encaisser',
      description: 'Recevoir un paiement (QR / lien)',
      icon: ReceiveTransactionIcon,
      href: '/dashboard/agent-relay/ops/collect',
    },
    {
      key: 'airtime',
      title: 'Airtime',
      description: 'Vendre du crédit téléphonique',
      icon: PhoneCreditIcon,
      href: '/dashboard/agent-relay/ops/airtime',
    },
    {
      key: 'referral',
      title: 'Parrainage',
      description: 'Inviter et gagner des bonus',
      icon: ReferralIcon,
      href: '/dashboard/agent-relay/ops/referral',
    },
  ],
};

const modulesByType: Record<AgentRelayAccountType, DashboardModule[]> = {
  'agent-relais': [
    { key: 'mobile_money', title: 'Mobile Money', icon: WalletNavIcon, href: '/dashboard/wallet' },
  ],
  cabinet: [
    { key: 'mobile_money', title: 'Mobile Money', icon: WalletNavIcon, href: '/dashboard/wallet' },
  ],
  'point-service': [
    { key: 'ecommerce', title: 'E‑Commerce', icon: ShopNavIcon, href: '/dashboard/nkampa' },
    { key: 'logistique', title: 'Logistique', icon: LogisticsNavIcon, href: '/dashboard/ugavi' },
    { key: 'mobile_money', title: 'Mobile Money', icon: WalletNavIcon, href: '/dashboard/wallet' },
  ],
};

const getInitials = (fullName?: string) => {
  const trimmed = (fullName || '').trim();
  if (!trimmed) return 'AR';
  const parts = trimmed.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join('');
};

export default function AgentRelayTypeDashboardPage() {
  const router = useRouter();
  const params = useParams() as { type?: string };
  const { toast } = useToast();
  const { status, application, isLoading } = useAgentRelayStatus();

  const accountType = (params?.type ?? '') as AgentRelayAccountType;

  const isKnownType = accountType in typeThemes;

  const theme = isKnownType ? typeThemes[accountType] : typeThemes['agent-relais'];
  const actions = isKnownType ? actionsByType[accountType] : actionsByType['agent-relais'];
  const modules = isKnownType ? modulesByType[accountType] : modulesByType['agent-relais'];

  useEffect(() => {
    if (!isLoading && status !== 'approved') {
      router.replace('/dashboard/agent-relay');
    }
  }, [status, isLoading, router]);

  useEffect(() => {
    if (isLoading) return;
    if (!isKnownType) {
      router.replace('/dashboard/agent-relay/dashboard');
      return;
    }
    if (application?.agentType && application.agentType !== accountType) {
      router.replace(`/dashboard/agent-relay/dashboard/${application.agentType}`);
    }
  }, [accountType, application?.agentType, isKnownType, isLoading, router]);

  const headerSubtitle = useMemo(() => {
    if (!application?.agentType) return typeLabels[accountType] ?? 'Agent';
    return typeLabels[application.agentType as AgentRelayAccountType] ?? 'Agent';
  }, [accountType, application?.agentType]);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <div className="h-10 w-10 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (status !== 'approved' || !application) {
    return null;
  }

  const HeroIcon = theme.heroIcon;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className={`bg-gradient-to-r ${theme.gradient} px-4 pt-6 pb-16`}>
        <div className="mx-auto w-full max-w-5xl">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/dashboard')}
              className="text-white hover:bg-white/20 rounded-full"
            >
              <ArrowLeft size={20} />
            </Button>

            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm p-2 shadow-lg">
                <Image
                  src="/enkamba-logo.png"
                  alt="eNkamba Logo"
                  width={40}
                  height={40}
                  className="object-contain rounded-full"
                />
              </div>
              <div className="text-left leading-tight">
                <div className="text-white text-lg font-bold tracking-tight">eNkamba</div>
                <div className="text-white/85 text-xs font-medium">{headerSubtitle}</div>
              </div>
            </div>

            <div className="h-10 w-10" />
          </div>
        </div>
      </div>

      {/* Profile Card (inspired by capture) */}
      <div className="-mt-10 px-4">
        <div className="mx-auto w-full max-w-5xl">
          <Card className="rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div
                  className="h-14 w-14 rounded-2xl flex items-center justify-center text-white font-bold shadow-sm"
                  style={{ backgroundColor: theme.accent }}
                >
                  {getInitials(application.fullName)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 truncate">
                      {application.fullName || 'Agent'}
                    </p>
                    <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/10">
                      <span className="mr-1 grid h-4 w-4 place-items-center">
                        <VerifiedIcon size={16} />
                      </span>
                      Validé
                    </Badge>
                  </div>

                  <div className="mt-2 flex items-center gap-3 flex-wrap">
                    <div className={`px-3 py-1 rounded-full ${theme.accentSoft} ${theme.accentText} text-sm font-semibold`}>
                      Solde: <span className="tabular-nums">0 CDF</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Type: <span className="font-medium text-gray-700">{typeLabels[application.agentType as AgentRelayAccountType]}</span>
                    </div>
                  </div>
                </div>

                <div className={`h-12 w-12 rounded-2xl ${theme.accentSoft} flex items-center justify-center`}>
                  <HeroIcon size={22} className={theme.accentText} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-6">
        <div className="mx-auto w-full max-w-5xl space-y-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Bienvenue !</h1>
              <p className="text-sm text-gray-600">Choisis une action pour continuer.</p>
            </div>
            <Badge variant="outline" className="rounded-full">
              {typeLabels[accountType]}
            </Badge>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-semibold text-gray-900">Vous représentez</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {modules.map((module) => {
                const Icon = module.icon;
                return (
                  <button
                    key={module.key}
                    type="button"
                    onClick={() => router.push(module.href)}
                    className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-center hover:shadow-md hover:border-gray-300 transition-all"
                  >
                    <div className={`h-12 w-12 mx-auto rounded-2xl ${theme.accentSoft} flex items-center justify-center`}>
                      <Icon size={22} className={theme.accentText} />
                    </div>
                    <div className="mt-3 text-xs font-semibold text-gray-900">{module.title}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {actions.map((action) => {
              const Icon = action.icon;
              const disabled = !!action.comingSoon;

              return (
                <button
                  key={action.key}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    if (action.href) {
                      router.push(action.href);
                      return;
                    }

                    toast({
                      title: 'Bientôt disponible',
                      description: 'Cette fonctionnalité arrive dans une prochaine mise à jour.',
                    });
                  }}
                  className={[
                    'text-left w-full rounded-2xl border bg-white p-4 transition-all',
                    'hover:shadow-md hover:border-gray-300',
                    disabled ? 'opacity-75 cursor-not-allowed hover:shadow-none hover:border-gray-200' : '',
                  ].join(' ')}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className={`h-12 w-12 rounded-2xl ${theme.accentSoft} flex items-center justify-center`}>
                      <Icon size={22} className={theme.accentText} />
                    </div>
                    {action.badge && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-900 text-white">
                        {action.badge}
                      </span>
                    )}
                  </div>
                  <div className="mt-3">
                    <div className="font-semibold text-gray-900">{action.title}</div>
                    <div className="text-xs text-gray-600 mt-1">{action.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

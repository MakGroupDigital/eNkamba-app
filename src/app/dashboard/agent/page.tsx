'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  Loader2,
  ShieldCheck,
  Store,
  UserPlus,
  XCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAgentRelayStatus } from '@/hooks/useAgentRelayStatus';
import { useBusinessStatus } from '@/hooks/useBusinessStatus';

const agentTypeLabels: Record<string, string> = {
  'agent-relais': 'Agent Relais',
  cabinet: 'Cabiniste',
  'point-service': 'Point de Service',
};

const AgentGatewayIcon = ({ className = 'h-6 w-6' }: { className?: string }) => (
  <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
    <circle cx="24" cy="24" r="18" fill="#25543A" />
    <path d="M15 25h18M27 18l7 7-7 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="16" cy="15" r="4" fill="#FFB545" />
    <circle cx="33" cy="35" r="4" fill="#25543A" />
  </svg>
);

export default function AgentPage() {
  const router = useRouter();
  const { status, application, isLoading } = useAgentRelayStatus();
  const { businessUser, isLoading: isBusinessLoading, isApproved: hasApprovedPaymentBusiness } = useBusinessStatus('PAYMENT');
  const [remainingSeconds, setRemainingSeconds] = useState(3);

  const agentType = application?.agentType || 'agent-relais';
  const agentLabel = agentTypeLabels[agentType] || 'Agent';

  const destination = useMemo(() => {
    if (status === 'approved') return `/dashboard/agent-relay/dashboard/${agentType}`;
    if (status === 'submitted') return '/dashboard/agent-relay/status';
    if (status === 'in_progress') return `/dashboard/agent-relay/signup?type=${agentType}`;
    return '/dashboard/agent-relay';
  }, [agentType, status]);

  const view = useMemo(() => {
    if (status === 'approved') {
      return {
        badge: 'Compte actif',
        title: `Compte ${agentLabel} détecté`,
        description: 'Votre espace agent est prêt. Vous allez être redirigé vers votre tableau de bord professionnel.',
        actionLabel: 'Accéder maintenant',
        icon: CheckCircle2,
        tone: 'green',
      };
    }

    if (status === 'submitted') {
      return {
        badge: 'En examen',
        title: 'Demande agent en cours',
        description: 'Votre candidature est déjà soumise. Vous allez être redirigé vers le suivi de votre demande.',
        actionLabel: 'Voir le statut',
        icon: Clock3,
        tone: 'orange',
      };
    }

    if (status === 'in_progress') {
      return {
        badge: `Étape ${application?.currentStep || 1}`,
        title: 'Inscription agent à terminer',
        description: 'Votre dossier existe déjà. Vous allez reprendre exactement là où vous vous êtes arrêté.',
        actionLabel: 'Continuer l’inscription',
        icon: UserPlus,
        tone: 'orange',
      };
    }

    if (status === 'rejected') {
      return {
        badge: 'Nouvelle demande',
        title: 'Créer un nouveau compte agent',
        description: application?.rejectionReason || 'Votre dernière demande n’a pas été approuvée. Vous pouvez démarrer une nouvelle demande.',
        actionLabel: 'Recommencer',
        icon: XCircle,
        tone: 'red',
      };
    }

    return {
      badge: 'Création',
      title: 'Devenir Agent eNkamba-Pay',
      description: 'Aucun compte agent actif n’a été trouvé. Vous allez être redirigé vers la création de compte agent.',
      actionLabel: 'Créer mon compte agent',
      icon: UserPlus,
      tone: 'green',
    };
  }, [agentLabel, application?.currentStep, application?.rejectionReason, status]);

  useEffect(() => {
    if (isLoading) return;

    setRemainingSeconds(status === 'approved' ? 3 : 4);
    const interval = window.setInterval(() => {
      setRemainingSeconds((value) => Math.max(0, value - 1));
    }, 1000);

    const timeout = window.setTimeout(() => {
      router.replace(destination);
    }, status === 'approved' ? 3000 : 4000);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [destination, isLoading, router, status]);

  const StatusIcon = view.icon;
  const progress = status === 'approved'
    ? ((3 - remainingSeconds) / 3) * 100
    : ((4 - remainingSeconds) / 4) * 100;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f7faf8]">
        <div className="container mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center p-4">
          <div className="text-center">
            <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin text-[#25543A]" />
            <p className="text-sm font-semibold text-muted-foreground">Vérification de votre compte agent...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7faf8]">
      <style>{`
        @keyframes gateway-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes gateway-pulse {
          0% { transform: scale(0.94); opacity: 0.5; }
          70% { transform: scale(1.18); opacity: 0; }
          100% { opacity: 0; }
        }
        .gateway-float { animation: gateway-float 3s ease-in-out infinite; }
        .gateway-pulse::before,
        .gateway-pulse::after {
          content: "";
          position: absolute;
          inset: -14px;
          border-radius: 999px;
          border: 1px solid rgba(50,187,120,0.35);
          animation: gateway-pulse 2s ease-out infinite;
        }
        .gateway-pulse::after { animation-delay: 0.8s; }
      `}</style>

      <div className="container mx-auto max-w-4xl p-3 sm:p-4">
        <Card className="overflow-hidden border-0 bg-white shadow-sm">
          <CardContent className="p-0">
            <div className="relative overflow-hidden bg-gradient-to-br from-[#25543A] to-[#25543A] px-4 py-6 text-white">
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.24),transparent_34%,rgba(0,0,0,0.08))]" />
              <div className="relative flex flex-col items-center gap-4 text-center">
                <div className="gateway-pulse gateway-float relative flex h-20 w-20 items-center justify-center rounded-3xl bg-white/16 ring-1 ring-white/25">
                  <AgentGatewayIcon className="h-12 w-12" />
                </div>
                <div>
                  <Badge className="mb-3 rounded-full bg-white/16 text-white hover:bg-white/16">
                    {view.badge}
                  </Badge>
                  <h1 className="font-headline text-2xl font-black sm:text-3xl">{view.title}</h1>
                  <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-white/78">{view.description}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 p-4 md:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-2xl border border-[#25543A]/10 bg-[#f7faf8] p-4">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#25543A]/10">
                    <StatusIcon className={`h-5 w-5 ${view.tone === 'red' ? 'text-red-600' : view.tone === 'orange' ? 'text-[#FFB545]' : 'text-[#25543A]'}`} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Destination</p>
                    <p className="font-bold text-[#25543A]">{destination}</p>
                  </div>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-[#25543A]/10">
                  <div
                    className="h-full rounded-full bg-[#25543A] transition-all duration-700"
                    style={{ width: `${Math.min(100, Math.max(8, progress))}%` }}
                  />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  Redirection automatique dans <span className="font-black text-[#25543A]">{remainingSeconds}</span> seconde{remainingSeconds > 1 ? 's' : ''}.
                </p>

                <Button
                  className="mt-4 h-11 w-full rounded-xl bg-[#25543A] font-bold hover:bg-[#25543A]"
                  onClick={() => router.replace(destination)}
                >
                  {view.actionLabel}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-[#25543A]/10 bg-white p-4 shadow-sm">
                  <ShieldCheck className="mb-2 h-5 w-5 text-[#25543A]" />
                  <p className="text-sm font-bold text-[#25543A]">Statut vérifié</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Lecture directe du dossier `agentRelayApplications`.
                  </p>
                </div>

                <div className="rounded-2xl border border-[#25543A]/10 bg-white p-4 shadow-sm">
                  {hasApprovedPaymentBusiness ? (
                    <>
                      <Building2 className="mb-2 h-5 w-5 text-[#25543A]" />
                      <p className="text-sm font-bold text-[#25543A]">Compte entreprise paiement lié</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {businessUser?.businessName || 'Compte entreprise'} est approuvé côté module paiement.
                      </p>
                    </>
                  ) : (
                    <>
                      <Store className="mb-2 h-5 w-5 text-[#FFB545]" />
                      <p className="text-sm font-bold text-[#25543A]">Compte agent dédié</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        Le compte agent se crée via le parcours Agent Relais eNkamba-Pay.
                      </p>
                    </>
                  )}
                  {isBusinessLoading && (
                    <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Vérification entreprise...
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Handshake, ChevronRight, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAgentRelayStatus } from '@/hooks/useAgentRelayStatus';
import { useRouter } from 'next/navigation';

// Agent Relay Icon
const AgentRelayIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="agentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0A8B46" />
        <stop offset="100%" stopColor="#0A8B46" />
      </linearGradient>
    </defs>
    <circle cx="24" cy="24" r="20" fill="url(#agentGrad)" />
    <path d="M16 20L24 28L32 20" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="18" cy="18" r="2" fill="#fff" />
    <circle cx="30" cy="18" r="2" fill="#fff" />
  </svg>
);

const SettingsItem = ({
  icon: IconComponent,
  title,
  description,
  action,
  badge,
}: {
  icon: React.ComponentType<{ size?: number }>;
  title: string;
  description: string;
  action: React.ReactNode;
  badge?: React.ReactNode;
}) => {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-all group">
      <div className="flex items-center gap-4 flex-1">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center group-hover:scale-105 transition-transform">
          <IconComponent size={28} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-foreground">{title}</p>
            {badge}
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div>{action}</div>
    </div>
  );
};

const agentTypeLabels: Record<string, string> = {
  'agent-relais': 'Agent Relais',
  'cabinet': 'Cabiniste',
  'point-service': 'Point de Service'
};

export function AgentRelaySection() {
  const { status, application, isLoading } = useAgentRelayStatus();
  const router = useRouter();

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-2 border-primary/20">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent">
          <CardTitle className="font-headline text-lg flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Agent Relais eNkamba-Pay
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Chargement...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Si approuvé, rediriger vers le compte agent
  if (status === 'approved') {
    return (
      <Card className="overflow-hidden border-2 border-primary/30 bg-primary/5/50">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent">
          <CardTitle className="font-headline text-lg flex items-center gap-2">
            <CheckCircle2 size={20} className="text-primary" />
            Compte Agent Relais Actif
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <SettingsItem
            icon={AgentRelayIcon}
            title={`Compte ${agentTypeLabels[application?.agentType || ''] || 'Agent'}`}
            description="Votre compte agent est actif. Accédez à votre espace professionnel."
            action={
                <Button 
                  size="sm" 
                  className="rounded-xl bg-primary hover:bg-primary" 
                  onClick={() =>
                    router.push(
                      `/dashboard/agent-relay/dashboard/${application?.agentType || 'agent-relais'}`
                    )
                  }
                >
                  Accéder
                </Button>
              }
            badge={
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                Actif
              </span>
            }
          />
        </CardContent>
      </Card>
    );
  }

  // Si demande en cours ou soumise
  if (status === 'in_progress' || status === 'submitted') {
    const isSubmitted = status === 'submitted';
    
    return (
      <Card className="overflow-hidden border-2 border-[#0A8B46]/30 bg-[#0A8B46]/5">
        <CardHeader className="bg-gradient-to-r from-[#0A8B46]/10 to-transparent">
          <CardTitle className="font-headline text-lg flex items-center gap-2">
            <Clock size={20} className="text-[#0A8B46]" />
            Demande Agent Relais
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <SettingsItem
            icon={AgentRelayIcon}
            title={isSubmitted ? 'Demande en cours de traitement' : 'Demande en cours'}
            description={
              isSubmitted 
                ? `Votre demande ${agentTypeLabels[application?.agentType || '']} est en cours d'examen.`
                : `Complétez votre inscription ${agentTypeLabels[application?.agentType || '']}.`
            }
            action={
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-xl" 
                onClick={() => {
                  if (isSubmitted) {
                    router.push('/dashboard/agent-relay/status');
                  } else {
                    router.push(`/dashboard/agent-relay/signup?type=${application?.agentType}`);
                  }
                }}
              >
                {isSubmitted ? 'Voir statut' : 'Continuer'}
              </Button>
            }
            badge={
              <span className="px-2 py-0.5 rounded-full bg-[#FFA500]/15 text-[#FFA500] text-xs font-medium">
                {isSubmitted ? 'En examen' : `Étape ${application?.currentStep || 1}/5`}
              </span>
            }
          />
        </CardContent>
      </Card>
    );
  }

  // Si rejetée
  if (status === 'rejected') {
    return (
      <Card className="overflow-hidden border-2 border-red-500/30 bg-red-50/50">
        <CardHeader className="bg-gradient-to-r from-red-500/10 to-transparent">
          <CardTitle className="font-headline text-lg flex items-center gap-2">
            <XCircle size={20} className="text-red-600" />
            Demande Agent Relais
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <SettingsItem
            icon={AgentRelayIcon}
            title="Demande non approuvée"
            description={application?.rejectionReason || "Votre demande n'a pas été approuvée. Vous pouvez soumettre une nouvelle demande."}
            action={
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-xl" 
                asChild
              >
                <Link href="/dashboard/agent-relay">
                  Nouvelle demande
                </Link>
              </Button>
            }
            badge={
              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                Rejetée
              </span>
            }
          />
        </CardContent>
      </Card>
    );
  }

  // Aucune demande
  return (
    <Card className="overflow-hidden border-2 border-primary/20">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent">
        <CardTitle className="font-headline text-lg flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary" />
          Devenir Agent Relais eNkamba-Pay
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <SettingsItem
          icon={AgentRelayIcon}
          title="Devenir Agent Relais"
          description="Rejoignez notre réseau de partenaires et développez votre activité avec eNkamba"
          action={
            <Button variant="outline" size="sm" className="rounded-xl" asChild>
              <Link href="/dashboard/agent-relay">
                <ChevronRight size={16} />
              </Link>
            </Button>
          }
        />
      </CardContent>
    </Card>
  );
}

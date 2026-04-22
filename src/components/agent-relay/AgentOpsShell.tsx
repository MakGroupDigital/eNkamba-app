'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';
import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BadgeCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAgentRelayStatus } from '@/hooks/useAgentRelayStatus';

type AgentRelayAccountType = 'agent-relais' | 'cabinet' | 'point-service';

const typeLabels: Record<AgentRelayAccountType, string> = {
  'agent-relais': 'Agent Relais',
  cabinet: 'Cabiniste',
  'point-service': 'Point de Service',
};

const typeThemes: Record<
  AgentRelayAccountType,
  { gradient: string; accent: string; accentSoft: string; accentText: string }
> = {
  'agent-relais': {
    gradient: 'from-[#32BB78] via-[#2BA86A] to-[#32BB78]',
    accent: '#32BB78',
    accentSoft: 'bg-[#32BB78]/10',
    accentText: 'text-[#32BB78]',
  },
  cabinet: {
    gradient: 'from-[#FF6B35] via-[#FF5722] to-[#FF6B35]',
    accent: '#FF6B35',
    accentSoft: 'bg-[#FF6B35]/10',
    accentText: 'text-[#FF6B35]',
  },
  'point-service': {
    gradient: 'from-[#FF6B35] via-[#FF5722] to-[#FF6B35]',
    accent: '#FF6B35',
    accentSoft: 'bg-[#FF6B35]/10',
    accentText: 'text-[#FF6B35]',
  },
};

export function AgentOpsShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const { status, application, isLoading } = useAgentRelayStatus();

  const agentType = (application?.agentType || 'agent-relais') as AgentRelayAccountType;
  const theme = typeThemes[agentType] ?? typeThemes['agent-relais'];

  const backHref = useMemo(() => {
    if (!application?.agentType) return '/dashboard/agent-relay/dashboard';
    return `/dashboard/agent-relay/dashboard/${application.agentType}`;
  }, [application?.agentType]);

  useEffect(() => {
    if (!isLoading && status !== 'approved') {
      router.replace('/dashboard/agent-relay');
    }
  }, [status, isLoading, router]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`bg-gradient-to-r ${theme.gradient} px-4 pt-6 pb-10`}>
        <div className="mx-auto w-full max-w-5xl">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(backHref)}
              className="text-white hover:bg-white/20 rounded-full"
            >
              <ArrowLeft size={20} />
            </Button>

            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-white/20 backdrop-blur-sm p-2 shadow-lg">
                <Image
                  src="/enkamba-logo.png"
                  alt="eNkamba Logo"
                  width={36}
                  height={36}
                  className="object-contain rounded-full"
                />
              </div>
              <div className="leading-tight">
                <div className="text-white text-base font-bold tracking-tight">eNkamba</div>
                <div className="text-white/85 text-[11px] font-medium">
                  {typeLabels[agentType] ?? 'Agent'}
                </div>
              </div>
            </div>

            <Badge className="rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
              <BadgeCheck size={14} className="mr-1" />
              Actif
            </Badge>
          </div>

          <div className="mt-6">
            <div className="text-white text-2xl font-bold">{title}</div>
            {subtitle && <div className="text-white/90 text-sm mt-1">{subtitle}</div>}
          </div>
        </div>
      </div>

      <div className="-mt-6 px-4 pb-10">
        <div className="mx-auto w-full max-w-5xl">{children}</div>
      </div>
    </div>
  );
}


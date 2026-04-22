'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAgentRelayStatus } from '@/hooks/useAgentRelayStatus';

export default function AgentRelayDashboardPage() {
  const router = useRouter();
  const { status, application, isLoading } = useAgentRelayStatus();

  useEffect(() => {
    if (isLoading) return;

    if (status !== 'approved' || !application) {
      router.replace('/dashboard/agent-relay');
      return;
    }

    router.replace(`/dashboard/agent-relay/dashboard/${application.agentType}`);
  }, [status, application, isLoading, router]);

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

  return null;
}

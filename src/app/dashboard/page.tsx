'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAgentRelayStatus } from '@/hooks/useAgentRelayStatus';
import { useBusinessStatus } from '@/hooks/useBusinessStatus';
import { getBusinessDashboardPath } from '@/lib/business-routing';

export default function HubPage() {
  const router = useRouter();
  const { businessUser, isLoading: isBusinessLoading } = useBusinessStatus();
  const { status: agentStatus, application, isLoading: isAgentLoading } = useAgentRelayStatus();

  useEffect(() => {
    if (isBusinessLoading || isAgentLoading) return;

    if (businessUser?.status === 'APPROVED') {
      router.replace(getBusinessDashboardPath(businessUser.businessType));
      return;
    }

    if (agentStatus === 'approved' && application?.agentType) {
      router.replace(`/dashboard/agent-relay/dashboard/${application.agentType}`);
      return;
    }

    router.replace('/dashboard/mbongo-dashboard');
  }, [agentStatus, application?.agentType, businessUser?.businessType, businessUser?.status, isAgentLoading, isBusinessLoading, router]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Ouverture du bon espace...</p>
      </div>
    </div>
  );
}

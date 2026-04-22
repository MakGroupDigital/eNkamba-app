'use client';

import { HandCoins } from 'lucide-react';

import { AgentOpsShell } from '@/components/agent-relay/AgentOpsShell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function AgentOpsDepositWithdrawPage() {
  const { toast } = useToast();

  return (
    <AgentOpsShell title="Dépôt & Retrait" subtitle="Opérations cash (agent relais).">
      <Card className="rounded-2xl border border-gray-200">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-lg font-semibold text-gray-900">Cash-in / Cash-out</div>
              <div className="text-sm text-gray-600">
                Ici on mettra le flux agent relais (dépôt client, retrait client, commissions, justificatifs).
              </div>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-[#32BB78]/10 flex items-center justify-center">
              <HandCoins className="text-[#32BB78]" />
            </div>
          </div>

          <Button
            className="h-12 rounded-xl bg-[#32BB78] hover:bg-[#2BA86A] text-white"
            onClick={() =>
              toast({
                title: 'À définir',
                description: 'Donne-moi les règles: limites, frais, et validation (PIN/OTP).',
              })
            }
          >
            Continuer
          </Button>
        </CardContent>
      </Card>
    </AgentOpsShell>
  );
}


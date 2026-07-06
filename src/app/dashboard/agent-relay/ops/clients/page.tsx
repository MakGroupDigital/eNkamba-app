'use client';

import { Users } from 'lucide-react';

import { AgentOpsShell } from '@/components/agent-relay/AgentOpsShell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function AgentOpsClientsPage() {
  const { toast } = useToast();

  return (
    <AgentOpsShell title="Mes clients" subtitle="Clients servis et historique (agent).">
      <Card className="rounded-2xl border border-gray-200">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-lg font-semibold text-gray-900">Base clients</div>
              <div className="text-sm text-gray-600">
                Liste des clients servis, fréquence, volumes, et accès rapide aux opérations.
              </div>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-[#0A8B46]/10 flex items-center justify-center">
              <Users className="text-[#0A8B46]" />
            </div>
          </div>

          <Button
            variant="outline"
            className="h-12 rounded-xl"
            onClick={() =>
              toast({
                title: 'À définir',
                description: 'Tu veux trier par volume, par date, ou par statut KYC ?',
              })
            }
          >
            Configurer
          </Button>
        </CardContent>
      </Card>
    </AgentOpsShell>
  );
}


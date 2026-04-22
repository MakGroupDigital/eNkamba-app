'use client';

import { CreditCard } from 'lucide-react';

import { AgentOpsShell } from '@/components/agent-relay/AgentOpsShell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function AgentOpsCreateAccountPage() {
  const { toast } = useToast();

  return (
    <AgentOpsShell title="Créer compte" subtitle="Onboarder un nouveau client (agent).">
      <Card className="rounded-2xl border border-gray-200">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-lg font-semibold text-gray-900">Création de compte client</div>
              <div className="text-sm text-gray-600">
                Flux agent: création rapide + KYC minimum + génération QR / carte.
              </div>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-[#32BB78]/10 flex items-center justify-center">
              <CreditCard className="text-[#32BB78]" />
            </div>
          </div>

          <Button
            className="h-12 rounded-xl bg-[#32BB78] hover:bg-[#2BA86A] text-white"
            onClick={() =>
              toast({
                title: 'Bientôt',
                description: 'Je le branche dès que tu confirmes le formulaire minimum (nom/tel/pièce).',
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


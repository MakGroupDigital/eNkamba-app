'use client';

import { useState } from 'react';
import { useKycStatus } from '@/hooks/useKycStatus';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface KycGateProps {
  moduleName: string;
  moduleIcon?: React.ReactNode;
  children: React.ReactNode;
}

// Modules qui ne nécessitent pas KYC
const FREE_MODULES = ['miyiki-chat', 'ai'];

export function KycGate({ moduleName, moduleIcon, children }: KycGateProps) {
  const { isKycCompleted, isLoading } = useKycStatus();
  const [showDialog, setShowDialog] = useState(false);

  // Si le module est gratuit, afficher directement
  if (FREE_MODULES.includes(moduleName)) {
    return <>{children}</>;
  }

  // Si KYC est complété, afficher le contenu
  if (isKycCompleted) {
    return <>{children}</>;
  }

  // Si en cours de chargement, afficher le contenu (éviter le flash)
  if (isLoading) {
    return <>{children}</>;
  }

  // Sinon, afficher le modal de KYC
  return (
    <>
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto" />
          <h2 className="text-xl font-semibold">Vérification requise</h2>
          <p className="text-sm text-muted-foreground">
            Vous devez compléter votre vérification KYC pour accéder à ce module.
          </p>
          <Button onClick={() => setShowDialog(true)}>
            Commencer la vérification
          </Button>
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vérification KYC requise</DialogTitle>
            <DialogDescription>
              Pour accéder à {moduleName}, vous devez d'abord compléter votre vérification d'identité.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">Chat & IA</p>
                  <p className="text-xs text-muted-foreground">Disponibles sans KYC</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Étapes de vérification:</p>
              <ol className="text-sm space-y-1 text-muted-foreground list-decimal list-inside">
                <li>Télécharger votre pièce d'identité</li>
                <li>Prendre une photo de vous</li>
                <li>Ajouter un code de parrainage (optionnel)</li>
                <li>Lier un compte bancaire ou mobile money</li>
              </ol>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDialog(false)}
                className="flex-1"
              >
                Plus tard
              </Button>
              <Link href="/kyc" className="flex-1">
                <Button className="w-full">
                  Commencer maintenant
                </Button>
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

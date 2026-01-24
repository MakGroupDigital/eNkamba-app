'use client';

import { usePathname } from 'next/navigation';
import { useKycStatus } from '@/hooks/useKycStatus';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Modules qui ne nécessitent pas KYC
const FREE_MODULES = ['/dashboard/miyiki-chat', '/dashboard/ai', '/dashboard/settings'];

interface ModuleKycGateProps {
  children: React.ReactNode;
}

export function ModuleKycGate({ children }: ModuleKycGateProps) {
  const pathname = usePathname();
  const { isKycCompleted, isLoading } = useKycStatus();

  // Vérifier si le module actuel nécessite KYC
  const requiresKyc = !FREE_MODULES.some(module => pathname.startsWith(module));

  // Si le module ne nécessite pas KYC, afficher le contenu
  if (!requiresKyc) {
    return <>{children}</>;
  }

  // Si on charge, afficher le contenu (éviter les flashs)
  if (isLoading) {
    return <>{children}</>;
  }

  // Si KYC est complété, afficher le contenu
  if (isKycCompleted) {
    return <>{children}</>;
  }

  // Sinon, afficher le message de restriction
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-6 max-w-md mx-auto p-6">
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-amber-100 dark:bg-amber-900/30">
            <AlertCircle className="w-12 h-12 text-amber-600" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold font-headline">Accès restreint</h2>
          <p className="text-muted-foreground">
            Vous devez compléter votre vérification KYC pour accéder à ce module.
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-left space-y-2">
          <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">Pourquoi KYC ?</p>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>✓ Sécurité de votre compte</li>
            <li>✓ Conformité réglementaire</li>
            <li>✓ Accès à tous les services</li>
          </ul>
        </div>

        <div className="space-y-3">
          <Button className="w-full h-12 text-base" asChild>
            <Link href="/kyc">
              Vérifier mon identité
            </Link>
          </Button>
          <Button variant="outline" className="w-full h-12" asChild>
            <Link href="/dashboard/settings">
              Retour aux paramètres
            </Link>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Modules accessibles sans KYC: Chat, AI
        </p>
      </div>
    </div>
  );
}

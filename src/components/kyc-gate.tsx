'use client';

// KYC est maintenant optionnel - tous les modules sont accessibles
// Les utilisateurs peuvent toujours compléter le KYC s'ils le souhaitent
// mais ce n'est plus obligatoire pour accéder aux fonctionnalités

interface KycGateProps {
  moduleName: string;
  moduleIcon?: React.ReactNode;
  children: React.ReactNode;
}

export function KycGate({ moduleName, moduleIcon, children }: KycGateProps) {
  // Tous les modules sont maintenant accessibles sans restriction KYC
  // Le KYC reste disponible pour ceux qui souhaitent le compléter
  return <>{children}</>;
}

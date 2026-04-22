import type { ReactNode } from 'react';

export default function SellerLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Layout sans navigation pour la page vendeur
  return <>{children}</>;
}

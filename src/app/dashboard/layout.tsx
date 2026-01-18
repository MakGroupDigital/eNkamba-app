'use client';

import MasoloFloatingButton from '@/components/masolo/masolo-floating-button';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import HubNavigation from '@/components/dashboard/hub-navigation';
import MbongoNavigation from '@/components/dashboard/mbongo-navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState('Paiement');

  useEffect(() => {
    if (pathname.includes('/miyiki-chat')) setActiveTab('Chat');
    else if (pathname.includes('/nkampa')) setActiveTab('E-comm');
    else if (pathname.includes('/ugavi')) setActiveTab('Logistique');
    else if (pathname.includes('/mbongo-dashboard') || pathname.endsWith('/dashboard')) setActiveTab('Paiement');
    else if (pathname.includes('/makutano')) setActiveTab('Connexion');
    else if (pathname.includes('/ai')) setActiveTab('AI');
    else if (pathname.includes('/settings')) setActiveTab('Paramètres');
    else if (pathname.includes('/wallet')) setActiveTab('Paiement');
    else if (pathname.includes('/history')) setActiveTab('Paiement');
    else if (pathname.includes('/report')) setActiveTab('Paiement');
    else if (pathname.includes('/send')) setActiveTab('Paiement');
    else if (pathname.includes('/pay-receive')) setActiveTab('Paiement');
    else if (pathname.includes('/scanner')) setActiveTab('Paiement');
    else if (pathname.includes('/savings')) setActiveTab('Paiement');
    else if (pathname.includes('/credit')) setActiveTab('Paiement');
    else if (pathname.includes('/tontine')) setActiveTab('Paiement');
    else if (pathname.includes('/conversion')) setActiveTab('Paiement');
    else if (pathname.includes('/referral')) setActiveTab('Paiement');
    else if (pathname.includes('/agent')) setActiveTab('Paiement');
    else if (pathname.includes('/link-account')) setActiveTab('Paiement');
    else if (pathname.includes('/bonus')) setActiveTab('Paiement');
    else setActiveTab('Paiement');
  }, [pathname]);

  const showMasoloButton = !pathname.includes('/miyiki-chat') && !pathname.includes('/ai');
  const showMbongoNav = activeTab === 'Paiement';

  return (
    <div className="flex h-screen flex-col bg-background">
      <main className="flex-grow overflow-y-auto pb-40">
        {children}
      </main>
      
      {showMasoloButton && (
        <div className="fixed bottom-24 right-4 z-50 flex items-center gap-3">
          <MasoloFloatingButton />
        </div>
      )}

      {showMbongoNav && <MbongoNavigation />}
      
      <HubNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

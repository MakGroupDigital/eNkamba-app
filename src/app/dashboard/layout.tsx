'use client';

import MasoloFloatingButton from '@/components/masolo/masolo-floating-button';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import HubNavigation from '@/components/dashboard/hub-navigation';
import AuthGuard from '@/components/auth-guard';
import { ModuleKycGate } from '@/components/module-kyc-gate';
import { TransferNotificationModal } from '@/components/transfer-notification-modal';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { ChevronRight } from 'lucide-react';
// import { useSupabaseNotifications } from '@/hooks/useSupabaseNotifications'; // Disabled - Supabase realtime not needed

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Paiement');
  usePushNotifications();
  // useSupabaseNotifications(); // Disabled - Supabase realtime not needed

  useEffect(() => {
    if (pathname.includes('/miyiki-chat')) setActiveTab('Chat');
    else if (pathname.includes('/nkampa')) setActiveTab('E-comm');
    else if (pathname.includes('/ugavi')) setActiveTab('Logistique');
    else if (pathname.includes('/mbongo-dashboard') || pathname.endsWith('/dashboard')) setActiveTab('Paiement');
    else if (pathname.includes('/estream')) setActiveTab('eStream');
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

  useEffect(() => {
    const highTrafficRoutes = [
      '/dashboard/mbongo-dashboard',
      '/dashboard/wallet',
      '/dashboard/pay-receive',
      '/dashboard/history',
      '/dashboard/scanner-simple',
      '/dashboard/miyiki-chat',
      '/dashboard/nkampa',
      '/dashboard/ugavi',
      '/dashboard/settings',
    ];

    highTrafficRoutes.forEach((route) => router.prefetch(route));
  }, [router]);

  const showMasoloButton = !pathname.includes('/miyiki-chat');
  const isChatSubpage = pathname.startsWith('/dashboard/miyiki-chat/') && pathname !== '/dashboard/miyiki-chat';
  const isUgaviHome = pathname === '/dashboard/ugavi';
  const isCallPage = pathname.includes('/dashboard/miyiki-chat/audiocall/') || pathname.includes('/dashboard/miyiki-chat/call/');
  const showLogisticsClientButton = !isCallPage && !isUgaviHome;

  return (
    <AuthGuard>
      <ModuleKycGate>
        <div className="flex h-screen flex-col bg-background">
          <main className={isCallPage ? 'fixed inset-0 z-[200] overflow-hidden bg-black' : isChatSubpage || isUgaviHome ? 'flex-grow overflow-hidden pb-0' : 'flex-grow overflow-y-auto pb-40'}>
            {children}
          </main>

          {showMasoloButton && !isCallPage && (
            <div className="fixed bottom-24 right-4 z-50 flex items-center gap-3">
              <MasoloFloatingButton />
            </div>
          )}

          {showLogisticsClientButton && (
            <button
              type="button"
              onClick={() => router.push('/dashboard/ugavi?panel=client')}
              className="fixed left-0 top-1/2 z-50 flex -translate-y-1/2 items-center gap-1 rounded-r-2xl bg-slate-950/90 px-2 py-4 text-xs font-semibold text-white shadow-2xl backdrop-blur transition hover:bg-slate-900"
            >
              <ChevronRight className="h-4 w-4" />
              <span className="hidden [writing-mode:vertical-rl] sm:inline">Mes colis</span>
            </button>
          )}

          {!isCallPage && <HubNavigation activeTab={activeTab} setActiveTab={setActiveTab} />}
          
          {/* Modal de notification de transfert reçu */}
          <TransferNotificationModal />
        </div>
      </ModuleKycGate>
    </AuthGuard>
  );
}

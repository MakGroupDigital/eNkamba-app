'use client';

import MasoloFloatingButton from '@/components/masolo/masolo-floating-button';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import HubNavigation from '@/components/dashboard/hub-navigation';
import AuthGuard from '@/components/auth-guard';
import { ModuleKycGate } from '@/components/module-kyc-gate';
import { TransferNotificationModal } from '@/components/transfer-notification-modal';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { AgeRestrictionGate } from '@/components/security/AgeRestrictionGate';
import { useIsKeyboardOpen } from '@/hooks/useIsKeyboardOpen';
// import { useSupabaseNotifications } from '@/hooks/useSupabaseNotifications'; // Disabled - Supabase realtime not needed

// Screens with a bottom CTA, a map or a sensitive input flow: the floating AI button must never cover them (ENK-014).
const AI_BUTTON_HIDDEN_PREFIXES = [
  '/dashboard/miyiki-chat',
  '/dashboard/ugavi',
  '/dashboard/makutano/create',
  '/dashboard/nkampa/product',
  '/dashboard/send',
  '/dashboard/pay',
  '/dashboard/withdraw',
  '/dashboard/add-funds',
  '/dashboard/request',
  '/dashboard/receive',
  '/dashboard/scanner',
  '/dashboard/conversion',
  '/dashboard/facepaie',
  '/dashboard/school-fees',
  '/dashboard/academic-fees',
  '/dashboard/tax-declaration',
  '/dashboard/esim/purchase',
  '/dashboard/flights/booking',
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Chat');
  const [hideHubNavigation, setHideHubNavigation] = useState(false);
  usePushNotifications();
  useRealtimeNotifications();
  // useSupabaseNotifications(); // Disabled - Supabase realtime not needed

  useEffect(() => {
    if (pathname.includes('/miyiki-chat')) setActiveTab('Chat');
    else if (pathname.includes('/nkampa')) setActiveTab('Marché');
    else if (pathname.includes('/ugavi')) setActiveTab('Logistique');
    else if (pathname.includes('/mbongo-dashboard')) setActiveTab('Paiement');
    else if (pathname.endsWith('/dashboard')) setActiveTab('Chat');
    else if (pathname.includes('/estream')) setActiveTab('eStream');
    else if (pathname.includes('/makutano')) setActiveTab('Connexion');
    else if (pathname.includes('/ai')) setActiveTab('AI');
    else if (pathname.includes('/settings')) setActiveTab('Paramètres');
    else if (pathname.includes('/business-pro')) {
      // Détection du type de business via le paramètre module dans l'URL
      const searchParams = new URLSearchParams(window.location.search);
      const businessModule = searchParams.get('module');
      if (businessModule === 'COMMERCE') setActiveTab('Marché');
      else if (businessModule === 'LOGISTICS') setActiveTab('Logistique');
      else if (businessModule === 'PAYMENT') setActiveTab('Paiement');
      else setActiveTab('Paiement'); // Par défaut
    }
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

  const isChatSubpage = pathname.startsWith('/dashboard/miyiki-chat/') && pathname !== '/dashboard/miyiki-chat';
  const isAiPage = pathname.startsWith('/dashboard/ai');
  const isKeyboardOpen = useIsKeyboardOpen();
  const showMasoloButton = !isAiPage && !isKeyboardOpen && !AI_BUTTON_HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isUgaviHome = pathname === '/dashboard/ugavi' || pathname === '/dashboard/ugavi/';
  const isCallPage = pathname.includes('/dashboard/miyiki-chat/audiocall/') || pathname.includes('/dashboard/miyiki-chat/call/');

  useEffect(() => {
    const handleHubNavigationVisibility = (event: Event) => {
      const customEvent = event as CustomEvent<{ hidden?: boolean }>;
      setHideHubNavigation(Boolean(customEvent.detail?.hidden));
    };

    window.addEventListener('enkamba:hub-navigation-visibility', handleHubNavigationVisibility);
    return () => {
      window.removeEventListener('enkamba:hub-navigation-visibility', handleHubNavigationVisibility);
    };
  }, []);

  useEffect(() => {
    setHideHubNavigation(false);
  }, [pathname]);

  return (
    <AuthGuard>
      <ModuleKycGate>
        <AgeRestrictionGate>
          <div className="flex h-dvh overflow-hidden flex-col bg-background">
          <main className={isCallPage ? 'fixed inset-0 z-[200] overflow-hidden bg-black' : isUgaviHome ? 'min-h-0 flex-1 touch-none overflow-hidden overscroll-none pb-0' : isChatSubpage || isAiPage ? 'min-h-0 flex-1 overflow-hidden pb-0' : 'flex-grow overflow-y-auto pb-40'}>
            {children}
          </main>

          {showMasoloButton && !isCallPage && (
            <div className="fixed right-4 z-30 flex items-center gap-3" style={{ bottom: 'calc(7rem + env(safe-area-inset-bottom))' }}>
              <MasoloFloatingButton />
            </div>
          )}

          {!isCallPage && !hideHubNavigation && <HubNavigation activeTab={activeTab} setActiveTab={setActiveTab} />}
          
          {/* Modal de notification de transfert reçu */}
          <TransferNotificationModal />
          </div>
        </AgeRestrictionGate>
      </ModuleKycGate>
    </AuthGuard>
  );
}

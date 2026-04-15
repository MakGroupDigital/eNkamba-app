'use client';

import { useEffect, useState } from 'react';
import EnkambaCard from '@/components/EnkambaCard';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import {
  ArrowLeft,
  Shield,
  Zap,
  TrendingUp,
  CreditCard,
} from 'lucide-react';
import { getTransactionIconConfig } from '@/lib/transaction-icons';
import Link from 'next/link';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useWalletTransactions } from '@/hooks/useWalletTransactions';
import { Button } from '@/components/ui/button';

// Icônes personnalisées pour les actions
const DepositIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6">
    <path d="M12 2L2 12h4v8h12v-8h4L12 2Z" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" opacity="0.2"/>
    <path d="M9 14v4h6v-4M12 8v6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const WithdrawIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6">
    <path d="M12 22L2 12v-8h20v8l-10 10Z" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" opacity="0.2"/>
    <path d="M15 10v4H9v-4M12 10V4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const HistoryIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="12 7 12 12 16 14" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CardsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6">
    <rect x="3" y="6" width="18" height="12" rx="2" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" opacity="0.15" />
    <path d="M3 10h18" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 15h6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M18 7v3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16.5 8.5h3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Actions rapides du wallet
const walletActions = [
  { icon: DepositIcon, label: 'Dépôt', href: '/dashboard/add-funds' },
  { icon: WithdrawIcon, label: 'Retrait', href: '/dashboard/withdraw' },
  { icon: HistoryIcon, label: 'Historique', href: '/dashboard/history' },
  { icon: CardsIcon, label: 'Mes Cartes', href: '/dashboard/cards' },
];

export default function WalletPage() {
  const { profile } = useUserProfile();
  const { balance: walletBalance, transactions: walletTransactions } = useWalletTransactions();
  const [cardsCarouselApi, setCardsCarouselApi] = useState<CarouselApi | null>(null);
  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardHolderName: '',
    accountNumber: '',
    balance: '0',
    currency: 'CDF',
    photoUrl: ''
  });

  useEffect(() => {
    if (profile?.uid) {
      const hash = profile.uid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const accountNum = `ENK${String(hash).padStart(12, '0')}`;
      const cardNum = `${String(hash % 10000).padStart(4, '0')} ${String((hash * 7) % 10000).padStart(4, '0')} ${String((hash * 13) % 10000).padStart(4, '0')} ${String((hash * 19) % 10000).padStart(4, '0')}`;
      
      setCardData({
        cardNumber: cardNum,
        cardHolderName: (profile.fullName || profile.name || 'eNkamba User').toUpperCase(),
        accountNumber: accountNum,
        balance: walletBalance.toLocaleString('fr-FR'),
        currency: 'CDF',
        photoUrl: profile.photoURL || profile.profileImage || '',
      });
    }
  }, [profile?.uid, profile?.fullName, profile?.name, profile?.photoURL, profile?.profileImage, walletBalance]);

  useEffect(() => {
    if (!cardsCarouselApi) return;
    const id = window.setInterval(() => {
      cardsCarouselApi.scrollNext();
    }, 4500);

    return () => window.clearInterval(id);
  }, [cardsCarouselApi]);

  const getTransactionStatusUI = (status: string) => {
    if (status === 'failed') {
      return {
        label: 'Échoué',
        badgeClassName: 'bg-red-100 text-red-700',
        amountClassName: 'text-red-600',
      };
    }

    if (status === 'pending') {
      return {
        label: 'En attente',
        badgeClassName: 'bg-yellow-100 text-yellow-700',
        amountClassName: 'text-yellow-600',
      };
    }

    return {
      label: 'Terminé',
      badgeClassName: 'bg-green-100 text-green-700',
      amountClassName: 'text-[#32BB78]',
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#32BB78]/5 to-background">
      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .slide-up {
          animation: slide-up 0.6s ease-out;
        }
      `}</style>

      <div className="container mx-auto max-w-4xl p-4 space-y-12 animate-in fade-in duration-500">
        {/* Header */}
        <header className="flex items-center gap-4 pt-4 slide-up">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/mbongo-dashboard">
              <ArrowLeft />
            </Link>
          </Button>
          <div>
            <h1 className="font-headline text-3xl font-bold bg-gradient-to-r from-[#32BB78] to-[#2a9d63] bg-clip-text text-transparent">
              Mon Portefeuille
            </h1>
            <p className="text-sm text-muted-foreground">La vie simplifiée et meilleure</p>
          </div>
        </header>

        {/* Hero Section - Card Centered */}
        <div className="flex flex-col items-center gap-8 slide-up" style={{ animationDelay: '0.1s' }}>
          {/* EnkambaCard Component */}
          <div className="w-full flex justify-center overflow-x-auto px-4">
            <Carousel
              className="w-[500px] shrink-0"
              opts={{ align: 'center', loop: true }}
              setApi={(api) => setCardsCarouselApi(api)}
            >
              <CarouselContent>
                <CarouselItem className="flex justify-center">
                  <EnkambaCard {...cardData} brand="visa" />
                </CarouselItem>
                <CarouselItem className="flex justify-center">
                  <EnkambaCard {...cardData} brand="mastercard" />
                </CarouselItem>
              </CarouselContent>
            </Carousel>
          </div>

          {/* Actions Wallet - Below Card */}
          <div className="w-full slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex justify-between items-center gap-2 px-2 max-w-sm mx-auto">
              {walletActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.label} href={action.href} className="flex-1">
                    <div className="group relative flex flex-col items-center gap-2 cursor-pointer">
                      <div className="absolute -inset-4 bg-gradient-to-br from-[#32BB78]/20 to-[#2a9d63]/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                      <div className="absolute -inset-6 rounded-full border border-[#32BB78]/10 opacity-0 group-hover:opacity-60 transition-all duration-500"></div>
                      
                      <div className="relative">
                        <div className="absolute inset-0 -m-2 rounded-full bg-[#32BB78]/15 opacity-0 group-hover:opacity-100 transition-all duration-300 blur-lg"></div>
                        
                        <div className="relative bg-gradient-to-br from-[#32BB78] via-[#2a9d63] to-[#1f7a4a] rounded-full p-3 sm:p-5 shadow-lg hover:shadow-2xl transition-all duration-300 transform group-hover:scale-110 sm:group-hover:scale-125 border border-[#32BB78]/60 group-hover:border-[#32BB78]/100 group-hover:-rotate-12">
                          <div className="absolute inset-2 rounded-full border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="relative text-white drop-shadow-lg">
                            <Icon />
                          </div>
                        </div>
                      </div>
                      
                      <span className="text-[0.65rem] sm:text-sm font-semibold text-foreground group-hover:text-[#32BB78] transition-colors duration-300 text-center leading-tight">
                        {action.label}
                      </span>
                      
                      <div className="h-1 w-6 bg-gradient-to-r from-[#32BB78]/0 via-[#32BB78] to-[#32BB78]/0 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 slide-up" style={{ animationDelay: '0.3s' }}>
          {/* Balance Overview */}
          <Card className="border-0 bg-white shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Solde Total</p>
                  <p className="text-3xl font-bold text-[#32BB78]">{walletBalance.toLocaleString('fr-FR')}</p>
                  <p className="text-xs text-muted-foreground mt-1">CDF</p>
                </div>
                <div className="p-3 rounded-lg bg-[#32BB78]/10">
                  <Zap className="w-6 h-6 text-[#32BB78]" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#32BB78] font-medium mb-4">
                <TrendingUp className="w-4 h-4" />
                <span>+12.5% ce mois</span>
              </div>
            </CardContent>
          </Card>

          {/* Account Status */}
          <Card className="border-0 bg-white shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Compte</p>
                  <p className="text-lg font-mono font-bold text-foreground">{cardData.accountNumber}</p>
                </div>
                <div className="p-3 rounded-lg bg-[#FFA500]/10">
                  <CreditCard className="w-6 h-6 text-[#FFA500]" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#32BB78]"></div>
                <span className="text-sm font-medium text-[#32BB78]">Actif</span>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="border-0 bg-white shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Sécurité</p>
                  <p className="text-lg font-bold text-foreground">Protégé</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <Shield className="w-6 h-6 text-blue-500" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-sm font-medium text-blue-500">2FA Activé</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Timeline */}
        <div className="slide-up" style={{ animationDelay: '0.4s' }}>
          <Card className="border-[#32BB78]/20">
            <CardHeader>
              <CardTitle className="font-headline text-xl">Transactions Récentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {walletTransactions.length > 0 ? (
                  walletTransactions.map((tx) => {
                    const isIncoming = tx.type === 'deposit' || tx.type === 'transfer_received' || tx.type === 'money_request_received';
                    const iconConfig = getTransactionIconConfig(tx.type as any);
                    const Icon = iconConfig.icon;
                    const statusUI = getTransactionStatusUI(tx.status);
                    const formattedDate = tx.timestamp?.toDate?.() 
                      ? new Date(tx.timestamp.toDate()).toLocaleDateString('fr-FR')
                      : 'Date inconnue';
                    
                    return (
                      <div key={tx.id} className="flex items-center gap-4 p-4 rounded-xl hover:bg-muted/50 transition-colors group cursor-pointer">
                        <div className={`p-3 rounded-full ${iconConfig.bgColor}`}>
                          <Icon className={`w-5 h-5 ${iconConfig.iconColor}`} size={20} />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{tx.description}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <p className="text-xs text-muted-foreground">{formattedDate}</p>
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusUI.badgeClassName}`}>
                              {statusUI.label}
                            </span>
                          </div>
                        </div>
                        <p className={`font-bold text-sm ${tx.status === 'failed' || tx.status === 'pending' ? statusUI.amountClassName : isIncoming ? 'text-[#32BB78]' : 'text-foreground'}`}>
                          {isIncoming ? '+' : '-'} {tx.amount.toLocaleString('fr-FR')} CDF
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Aucune transaction pour le moment</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>


      </div>
    </div>
  );
}

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
import { useCurrencyConversion } from '@/hooks/useCurrencyConversion';
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

// Composant de conversion de devises
function CurrencyConversionDisplay({ balance }: { balance: number }) {
  const { conversions, isLoading } = useCurrencyConversion(balance);

  const currencies = [
    { code: 'EUR', symbol: '€', label: 'Euro' },
    { code: 'USD', symbol: '$', label: 'Dollar US' },
    { code: 'CNY', symbol: '¥', label: 'Yuan' },
    { code: 'XOF', symbol: 'Fr', label: 'FCFA' },
  ];

  return (
    <div className="flex justify-center gap-4 sm:gap-6 flex-wrap">
      {currencies.map((currency) => (
        <div
          key={currency.code}
          className="group relative flex flex-col items-center gap-2 cursor-pointer"
        >
          <div className="relative">
            <div className="absolute inset-0 -m-2 rounded-full bg-[#FFA500]/20 opacity-0 group-hover:opacity-100 transition-all duration-300 blur-lg"></div>
            
            <div className="relative bg-gradient-to-br from-[#FFA500] to-[#FF8C00] rounded-full p-4 shadow-md hover:shadow-xl transition-all duration-300 transform group-hover:scale-110 border border-[#FFA500]/60 group-hover:border-[#FFA500]/100 min-w-[80px] h-20 flex flex-col items-center justify-center">
              <span className="text-white font-bold text-lg leading-none">{currency.symbol}</span>
              
              <div className="mt-1 text-center">
                {isLoading ? (
                  <div className="h-3 w-10 bg-white/20 rounded animate-pulse"></div>
                ) : (
                  <p className="text-white font-bold text-xs leading-tight">
                    {conversions[currency.code as keyof typeof conversions].toLocaleString('fr-FR', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <span className="text-xs font-semibold text-foreground group-hover:text-[#32BB78] transition-colors duration-300">
            {currency.code}
          </span>
        </div>
      ))}
    </div>
  );
}

// Actions rapides du wallet
const walletActions = [
  { icon: DepositIcon, label: 'Dépôt', href: '/dashboard/add-funds' },
  { icon: WithdrawIcon, label: 'Retrait', href: '/dashboard/withdraw' },
  { icon: HistoryIcon, label: 'Historique', href: '/dashboard/history' },
];

export default function WalletPage() {
  const { profile } = useUserProfile();
  const { balance: walletBalance, transactions: walletTransactions } = useWalletTransactions();
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
          <div className="w-full flex justify-center px-4 sm:px-0">
            <EnkambaCard {...cardData} />
          </div>

          {/* Actions Wallet - Below Card */}
          <div className="w-full slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex justify-center gap-8 sm:gap-12">
              {walletActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.label} href={action.href}>
                    <div className="group relative flex flex-col items-center gap-3 cursor-pointer">
                      <div className="absolute -inset-4 bg-gradient-to-br from-[#32BB78]/20 to-[#2a9d63]/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                      <div className="absolute -inset-6 rounded-full border border-[#32BB78]/10 opacity-0 group-hover:opacity-60 transition-all duration-500"></div>
                      
                      <div className="relative">
                        <div className="absolute inset-0 -m-2 rounded-full bg-[#32BB78]/15 opacity-0 group-hover:opacity-100 transition-all duration-300 blur-lg"></div>
                        
                        <div className="relative bg-gradient-to-br from-[#32BB78] via-[#2a9d63] to-[#1f7a4a] rounded-full p-5 shadow-lg hover:shadow-2xl transition-all duration-300 transform group-hover:scale-125 border border-[#32BB78]/60 group-hover:border-[#32BB78]/100 group-hover:-rotate-12">
                          <div className="absolute inset-2 rounded-full border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="relative text-white drop-shadow-lg">
                            <Icon />
                          </div>
                        </div>
                      </div>
                      
                      <span className="text-sm font-semibold text-foreground group-hover:text-[#32BB78] transition-colors duration-300 text-center">
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
          <Card className="bg-gradient-to-br from-[#32BB78]/10 to-[#2a9d63]/5 border-[#32BB78]/20 border-l-4 border-l-[#FFA500] overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Solde Total</p>
                  <p className="text-3xl font-bold text-[#32BB78]">{walletBalance.toLocaleString('fr-FR')} CDF</p>
                </div>
                <div className="p-3 rounded-full bg-[#32BB78]/20">
                  <Zap className="w-6 h-6 text-[#32BB78]" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-green-600">
                <TrendingUp className="w-4 h-4" />
                <span>+12.5% ce mois</span>
              </div>
            </CardContent>
          </Card>

          {/* Account Status */}
          <Card className="bg-gradient-to-br from-[#32BB78]/10 to-[#2a9d63]/5 border-[#32BB78]/20 border-l-4 border-l-[#FFA500] overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Compte</p>
                  <p className="text-lg font-bold">{cardData.accountNumber}</p>
                </div>
                <div className="p-3 rounded-full bg-[#32BB78]/20">
                  <CreditCard className="w-6 h-6 text-[#32BB78]" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#32BB78]"></div>
                <span className="text-sm font-semibold text-[#32BB78]">Actif</span>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="bg-gradient-to-br from-[#32BB78]/10 to-[#2a9d63]/5 border-[#32BB78]/20 border-l-4 border-l-[#FFA500] overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Sécurité</p>
                  <p className="text-lg font-bold">Protégé</p>
                </div>
                <div className="p-3 rounded-full bg-[#32BB78]/20">
                  <Shield className="w-6 h-6 text-[#32BB78]" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-[#32BB78]"></div>
                <span className="text-[#32BB78] font-semibold">2FA Activé</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Currency Conversion Section */}
        <div className="slide-up" style={{ animationDelay: '0.35s' }}>
          <Card className="border-[#32BB78]/20 bg-gradient-to-br from-[#32BB78]/5 to-[#2a9d63]/5">
            <CardHeader>
              <CardTitle className="font-headline text-xl">Solde en Différentes Devises</CardTitle>
            </CardHeader>
            <CardContent>
              <CurrencyConversionDisplay balance={walletBalance} />
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

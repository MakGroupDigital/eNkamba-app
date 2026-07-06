'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import EnkambaCard from '@/components/EnkambaCard';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import {
  ArrowLeft,
  Shield,
  TrendingUp,
  CreditCard,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';
import { getTransactionIconConfig } from '@/lib/transaction-icons';
import Link from 'next/link';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useWalletTransactions } from '@/hooks/useWalletTransactions';
import { useSecureBalanceVisibility } from '@/hooks/useSecureBalanceVisibility';
import { Button } from '@/components/ui/button';
import { PinVerification } from '@/components/payment/PinVerification';

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
  const {
    isBalanceVisible,
    isBiometricChecking,
    isPinOpen,
    setIsPinOpen,
    requestUnlock,
    lockBalance,
    handlePinSuccess,
  } = useSecureBalanceVisibility();
  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardHolderName: '',
    accountNumber: '',
    balance: '0',
    currency: 'CDF',
    photoUrl: ''
  });

  // Taux de change approximatifs (CDF vers autres devises)
  const exchangeRates = {
    USD: 0.00037, // 1 CDF = 0.00037 USD (environ 2700 CDF = 1 USD)
    EUR: 0.00034, // 1 CDF = 0.00034 EUR (environ 2940 CDF = 1 EUR)
    GBP: 0.00029, // 1 CDF = 0.00029 GBP (environ 3450 CDF = 1 GBP)
    CNY: 0.0027,  // 1 CDF = 0.0027 CNY (environ 370 CDF = 1 CNY)
  };

  // Calcul des montants convertis
  const convertedAmounts = {
    USD: walletBalance * exchangeRates.USD,
    EUR: walletBalance * exchangeRates.EUR,
    GBP: walletBalance * exchangeRates.GBP,
    CNY: walletBalance * exchangeRates.CNY,
  };

  // Fonction pour formater les montants
  const formatAmount = (amount: number, currency: string) => {
    if (currency === 'FC') {
      return amount.toLocaleString('fr-FR', { maximumFractionDigits: 0 });
    }
    if (amount >= 100) {
      return amount.toFixed(0);
    } else if (amount >= 1) {
      return amount.toFixed(1);
    } else {
      return amount.toFixed(2);
    }
  };

  useEffect(() => {
    if (profile?.uid) {
      const hash = profile.uid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const accountNum = `ENK${String(hash).padStart(12, '0')}`;
      const cardNum = `${String(hash % 10000).padStart(4, '0')} ${String((hash * 7) % 10000).padStart(4, '0')} ${String((hash * 13) % 10000).padStart(4, '0')} ${String((hash * 19) % 10000).padStart(4, '0')}`;
      
      setCardData({
        cardNumber: cardNum,
        cardHolderName: (profile.fullName || profile.name || 'eNkamba User').toUpperCase(),
        accountNumber: accountNum,
        balance: isBalanceVisible ? walletBalance.toLocaleString('fr-FR') : '••••••',
        currency: 'CDF',
        photoUrl: profile.photoURL || profile.profileImage || '',
      });
    }
  }, [isBalanceVisible, profile?.uid, profile?.fullName, profile?.name, profile?.photoURL, profile?.profileImage, walletBalance]);

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
      badgeClassName: 'bg-primary/10 text-primary',
      amountClassName: 'text-[#009058]',
    };
  };

  return (
    <div className="min-h-screen bg-[#f7faf8]">
      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .slide-up {
          animation: slide-up 0.6s ease-out;
        }
      `}</style>

      <div className="container mx-auto max-w-4xl p-3 sm:p-4 space-y-3 animate-in fade-in duration-500">
        {/* Header */}
        <header className="flex items-center gap-3 pt-1 slide-up">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/mbongo-dashboard">
              <ArrowLeft />
            </Link>
          </Button>
          <div>
            <h1 className="font-headline text-xl font-bold text-[#009058] sm:text-2xl">
              Mon Portefeuille
            </h1>
            <p className="text-xs text-muted-foreground">La vie simplifiée et meilleure</p>
          </div>
        </header>

        {/* Hero Section - Card Centered */}
        <div className="-mt-1 flex flex-col items-center gap-1 slide-up sm:-mt-2" style={{ animationDelay: '0.1s' }}>
          {/* EnkambaCard Component */}
          <div className="flex w-full max-w-[500px] justify-end px-1">
            <button
              type="button"
              onClick={isBalanceVisible ? lockBalance : requestUnlock}
              disabled={isBiometricChecking}
              aria-label={isBalanceVisible ? 'Masquer le solde' : 'Afficher le solde'}
              title={isBalanceVisible ? 'Masquer le solde' : 'Afficher le solde'}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#009058]/20 bg-white text-[#009058] shadow-sm transition hover:border-[#009058]/40 hover:bg-[#009058]/5 disabled:opacity-60"
            >
              {isBiometricChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : isBalanceVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="flex h-[208px] w-full justify-center overflow-hidden px-1 sm:h-[258px] md:h-[280px]">
            <div className="origin-top scale-[0.66] sm:scale-[0.82] md:scale-90">
              <Carousel
                className="w-[500px] shrink-0"
                opts={{ align: 'center', loop: true }}
              >
                <CarouselContent className="-ml-2">
                  <CarouselItem className="flex justify-center">
                    <EnkambaCard {...cardData} brand="visa" />
                  </CarouselItem>
                  <CarouselItem className="flex justify-center">
                    <EnkambaCard {...cardData} brand="mastercard" />
                  </CarouselItem>
                </CarouselContent>
              </Carousel>
            </div>
          </div>

          {/* Actions Wallet - Below Card */}
          <div className="w-full slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="mx-auto flex max-w-sm items-center justify-between gap-2 rounded-2xl border border-[#009058]/10 bg-white px-3 py-2 shadow-sm">
              {walletActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.label} href={action.href} className="flex-1">
                    <div className="group relative flex cursor-pointer flex-col items-center gap-1.5">
                      <div className="relative">
                        <div className="relative rounded-xl border border-[#009058]/20 bg-[#009058]/10 p-2.5 text-[#009058] transition duration-200 group-hover:-translate-y-0.5 group-hover:bg-[#009058] group-hover:text-white sm:p-3">
                          <div className="absolute inset-2 rounded-full border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="relative">
                            <Icon />
                          </div>
                        </div>
                      </div>
                      
                      <span className="text-[0.65rem] sm:text-xs font-semibold text-foreground group-hover:text-[#009058] transition-colors duration-300 text-center leading-tight">
                        {action.label}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <Card className="slide-up overflow-hidden border border-[#009058]/10 bg-white shadow-sm" style={{ animationDelay: '0.25s' }}>
          <CardContent className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#009058]/15 bg-[#009058]/10">
                <Image
                  src="/enkamba-logo.png"
                  alt="eNkamba AI"
                  width={30}
                  height={30}
                  className="h-7 w-7 rounded-lg object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#009058]">Assistant financier IA</p>
                <h2 className="mt-0.5 text-base font-black text-[#009058] sm:text-lg">Analyse intelligente du portefeuille</h2>
                <p className="mt-0.5 max-w-xl text-xs leading-5 text-muted-foreground sm:text-sm">
                  Analysez votre historique, repérez les anomalies et générez des recommandations financières.
                </p>
              </div>
            </div>
            <Button className="h-8 shrink-0 rounded-xl bg-[#009058] px-3 text-xs font-bold text-white hover:bg-[#009058] sm:h-9" asChild>
              <Link href="/dashboard/report">Générer un rapport</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Stats Section */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 slide-up" style={{ animationDelay: '0.3s' }}>
          {/* Balance Overview */}
          <Card className="border-0 bg-[#009058] text-white shadow-sm transition-shadow hover:shadow-md">
            <CardContent className="p-3 sm:p-4">
              <div className="mb-2 flex items-start justify-between">
                <div className="flex-1">
                  <p className="mb-1 text-xs font-medium text-white/75">Solde principal</p>
                  <p className="text-2xl font-bold text-white">
                    {isBalanceVisible ? walletBalance.toLocaleString('fr-FR') : '••••••'}
                  </p>
                  <p className="mt-0.5 text-xs text-white/70">FC</p>
                </div>
              </div>
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-white/85">
                <TrendingUp className="w-4 h-4" />
                <span>+12.5% ce mois</span>
              </div>
              
              {/* Currency Bubbles */}
              <div className="mt-2 flex justify-between gap-1">
                {/* FC Bubble */}
                <div className="group relative flex flex-col items-center gap-1 cursor-pointer flex-1">
                  <div className="relative flex h-10 w-10 flex-col items-center justify-center rounded-full border border-white/30 bg-white/15 shadow-sm transition duration-200 group-hover:scale-105 group-hover:bg-white/20">
                    <div className="relative text-white text-[0.4rem] font-bold leading-tight">FC</div>
                    <div className="relative text-white text-[0.35rem] font-medium leading-tight px-1 text-center overflow-hidden">
                      {isBalanceVisible ? formatAmount(walletBalance, 'FC') : '••••'}
                    </div>
                  </div>
                  <span className="text-[0.45rem] font-medium text-white/70 text-center">Franc</span>
                </div>

                {/* USD Bubble */}
                <div className="group relative flex flex-col items-center gap-1 cursor-pointer flex-1">
                  <div className="relative flex h-10 w-10 flex-col items-center justify-center rounded-full border border-blue-500/60 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 shadow-sm transition duration-200 group-hover:scale-105 group-hover:shadow-md">
                    <div className="relative text-white text-[0.4rem] font-bold leading-tight">USD</div>
                    <div className="relative text-white text-[0.35rem] font-medium leading-tight px-1 text-center overflow-hidden">
                      {isBalanceVisible ? formatAmount(convertedAmounts.USD, 'USD') : '••••'}
                    </div>
                  </div>
                  <span className="text-[0.45rem] font-medium text-white/70 text-center">Dollar</span>
                </div>

                {/* EUR Bubble */}
                <div className="group relative flex flex-col items-center gap-1 cursor-pointer flex-1">
                  <div className="relative flex h-10 w-10 flex-col items-center justify-center rounded-full border border-purple-500/60 bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 shadow-sm transition duration-200 group-hover:scale-105 group-hover:shadow-md">
                    <div className="relative text-white text-[0.4rem] font-bold leading-tight">EUR</div>
                    <div className="relative text-white text-[0.35rem] font-medium leading-tight px-1 text-center overflow-hidden">
                      {isBalanceVisible ? formatAmount(convertedAmounts.EUR, 'EUR') : '••••'}
                    </div>
                  </div>
                  <span className="text-[0.45rem] font-medium text-white/70 text-center">Euro</span>
                </div>

                {/* GBP Bubble */}
                <div className="group relative flex flex-col items-center gap-1 cursor-pointer flex-1">
                  <div className="relative flex h-10 w-10 flex-col items-center justify-center rounded-full border border-[#FFA500]/60 bg-gradient-to-br from-[#FFA500] via-[#FFA500] to-[#FFA500] shadow-sm transition duration-200 group-hover:scale-105 group-hover:shadow-md">
                    <div className="relative text-white text-[0.4rem] font-bold leading-tight">GBP</div>
                    <div className="relative text-white text-[0.35rem] font-medium leading-tight px-1 text-center overflow-hidden">
                      {isBalanceVisible ? formatAmount(convertedAmounts.GBP, 'GBP') : '••••'}
                    </div>
                  </div>
                  <span className="text-[0.45rem] font-medium text-white/70 text-center">Livre</span>
                </div>

                {/* CNY Bubble */}
                <div className="group relative flex flex-col items-center gap-1 cursor-pointer flex-1">
                  <div className="relative flex h-10 w-10 flex-col items-center justify-center rounded-full border border-red-500/60 bg-gradient-to-br from-red-500 via-red-600 to-red-700 shadow-sm transition duration-200 group-hover:scale-105 group-hover:shadow-md">
                    <div className="relative text-white text-[0.4rem] font-bold leading-tight">CNY</div>
                    <div className="relative text-white text-[0.35rem] font-medium leading-tight px-1 text-center overflow-hidden">
                      {isBalanceVisible ? formatAmount(convertedAmounts.CNY, 'CNY') : '••••'}
                    </div>
                  </div>
                  <span className="text-[0.45rem] font-medium text-white/70 text-center">Yuan</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Status */}
          <Card className="border border-[#009058]/10 bg-white shadow-sm transition-shadow hover:shadow-md">
            <CardContent className="p-3 sm:p-4">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Compte</p>
                  <p className="text-base font-mono font-bold text-foreground sm:text-lg">{cardData.accountNumber}</p>
                </div>
                <div className="rounded-xl bg-[#FFA500]/10 p-2.5">
                  <CreditCard className="w-6 h-6 text-[#FFA500]" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#009058]"></div>
                <span className="text-sm font-medium text-[#009058]">Actif</span>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="border border-[#009058]/10 bg-white shadow-sm transition-shadow hover:shadow-md">
            <CardContent className="p-3 sm:p-4">
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Sécurité</p>
                  <p className="text-lg font-bold text-foreground">Protégé</p>
                </div>
                <div className="rounded-xl bg-blue-500/10 p-2.5">
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
          <Card className="border-[#009058]/20 shadow-sm">
            <CardHeader className="px-4 py-2.5">
              <CardTitle className="font-headline text-base">Transactions Récentes</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="max-h-[360px] space-y-1.5 overflow-y-auto pr-1">
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
                      <div key={tx.id} className="group flex cursor-pointer items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-muted/50">
                        <div className={`rounded-full p-2.5 ${iconConfig.bgColor}`}>
                          <Icon className={`w-5 h-5 ${iconConfig.iconColor}`} size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm">{tx.description}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <p className="text-xs text-muted-foreground">{formattedDate}</p>
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusUI.badgeClassName}`}>
                              {statusUI.label}
                            </span>
                          </div>
                        </div>
                        <p className={`shrink-0 text-right text-sm font-bold ${tx.status === 'failed' || tx.status === 'pending' ? statusUI.amountClassName : isIncoming ? 'text-[#009058]' : 'text-foreground'}`}>
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

        <PinVerification
          isOpen={isPinOpen}
          onClose={() => setIsPinOpen(false)}
          onSuccess={handlePinSuccess}
          purpose="balance"
          paymentDetails={{
            recipient: 'Affichage du solde',
            amount: 'Confidentiel',
            currency: 'CDF',
          }}
        />
      </div>
    </div>
  );
}

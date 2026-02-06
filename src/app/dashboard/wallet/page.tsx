'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Shield,
  ArrowUpRight,
  ArrowDownLeft,
  Zap,
  TrendingUp,
  CreditCard,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useWalletTransactions } from '@/hooks/useWalletTransactions';
import Image from 'next/image';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import html2canvas from 'html2canvas';

// Icônes personnalisées pour les actions - Style moderne eNkamba
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

// Actions rapides du wallet
const walletActions = [
  { icon: DepositIcon, label: 'Dépôt', href: '/dashboard/add-funds' },
  { icon: WithdrawIcon, label: 'Retrait', href: '/dashboard/withdraw' },
  { icon: HistoryIcon, label: 'Historique', href: '/dashboard/history' },
];

export default function WalletPage() {
  const { profile } = useUserProfile();
  const { balance: walletBalance, transactions: walletTransactions } = useWalletTransactions();
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [qrCode, setQrCode] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [isFlipped, setIsFlipped] = useState(false);
  const [cvv, setCvv] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [cardNumber, setCardNumber] = useState<string>('');
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    if (profile?.uid) {
      const hash = profile.uid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const accountNum = `ENK${String(hash).padStart(12, '0')}`;
      setAccountNumber(accountNum);

      const cardNum = `${String(hash % 10000).padStart(4, '0')} ${String((hash * 7) % 10000).padStart(4, '0')} ${String((hash * 13) % 10000).padStart(4, '0')} ${String((hash * 19) % 10000).padStart(4, '0')}`;
      setCardNumber(cardNum);

      const cvvCode = String((hash * 23) % 1000).padStart(3, '0');
      setCvv(cvvCode);

      const now = new Date();
      const expiry = new Date(now.getFullYear() + 2, now.getMonth());
      setExpiryDate(`${String(expiry.getMonth() + 1).padStart(2, '0')}/${String(expiry.getFullYear()).slice(-2)}`);

      // Générer QR code avec données complètes: ENK{accountNumber}|{fullName}|{email}
      const fullName = profile.name || profile.fullName || 'eNkamba User';
      const email = profile.email || '';
      const qrData = `${accountNum}|${fullName}|${email}`;

      QRCode.toDataURL(qrData, {
        width: 200,
        margin: 1,
        color: {
          dark: '#32BB78',
          light: '#ffffff',
        },
      }).then(setQrCode);
    }
  }, [profile?.uid, profile?.name, profile?.fullName, profile?.email]);

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(accountNumber);
  };

  // Long press handler pour télécharger la carte
  const handleCardMouseDown = () => {
    const timer = setTimeout(async () => {
      if (cardRef.current) {
        try {
          setDownloadProgress(1);
          const canvas = await html2canvas(cardRef.current, {
            backgroundColor: null,
            scale: 2,
            logging: false,
          });
          
          setDownloadProgress(50);
          const link = document.createElement('a');
          link.href = canvas.toDataURL('image/png');
          link.download = `enkamba-card-${new Date().getTime()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          setDownloadProgress(100);
          setTimeout(() => setDownloadProgress(0), 1000);
        } catch (error) {
          console.error('Erreur téléchargement carte:', error);
          setDownloadProgress(0);
        }
      }
    }, 3000);
    
    setLongPressTimer(timer);
  };

  const handleCardMouseUp = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleCardMouseLeave = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const displayBalance = isBalanceVisible 
    ? walletBalance.toLocaleString('fr-FR') 
    : '••••••••';

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
        .card-container {
          perspective: 1000px;
          cursor: pointer;
          width: 100%;
          max-width: 100%;
          aspect-ratio: 1.585;
        }
        .card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transition: transform 0.6s;
          transform-style: preserve-3d;
        }
        .card-inner.flipped {
          transform: rotateY(180deg);
        }
        .card-front, .card-back {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
        }
        .card-back {
          transform: rotateY(180deg);
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
          {/* Card with Glow */}
          <div className="w-full">
            <div 
              className="card-container mx-auto" 
              onClick={() => setIsFlipped(!isFlipped)}
              onMouseDown={handleCardMouseDown}
              onMouseUp={handleCardMouseUp}
              onMouseLeave={handleCardMouseLeave}
              onTouchStart={handleCardMouseDown}
              onTouchEnd={handleCardMouseUp}
              ref={cardRef}
            >
              {/* Download Progress Indicator */}
              {downloadProgress > 0 && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 rounded-3xl">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full border-4 border-white/20 border-t-[#32BB78] animate-spin mb-3"></div>
                    <p className="text-white text-sm font-semibold">{downloadProgress}%</p>
                  </div>
                </div>
              )}
              
              {/* Long Press Indicator */}
              {longPressTimer && (
                <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <p className="text-white text-xs font-semibold opacity-70">Maintenez 3 secondes...</p>
                  </div>
                </div>
              )}
              <div className={`card-inner ${isFlipped ? 'flipped' : ''}`}>
                {/* FRONT - FUTURISTIC MODERN DESIGN */}
                <div className="card-front">
                  <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl">
                    {/* Animated Gradient Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#32BB78] via-[#2a9d63] to-[#1f7a4a]"></div>
                    
                    {/* Futuristic Grid Pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute inset-0" style={{
                        backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(255,255,255,.05) 25%, rgba(255,255,255,.05) 26%, transparent 27%, transparent 74%, rgba(255,255,255,.05) 75%, rgba(255,255,255,.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(255,255,255,.05) 25%, rgba(255,255,255,.05) 26%, transparent 27%, transparent 74%, rgba(255,255,255,.05) 75%, rgba(255,255,255,.05) 76%, transparent 77%, transparent)',
                        backgroundSize: '50px 50px'
                      }}></div>
                    </div>

                    {/* Modern Decorative Circles - Multiple Layers */}
                    <div className="absolute top-8 right-12 w-32 h-32 bg-white rounded-full opacity-10 blur-2xl"></div>
                    <div className="absolute top-20 right-20 w-24 h-24 bg-white rounded-full opacity-[0.08] blur-xl"></div>
                    <div className="absolute bottom-16 left-8 w-40 h-40 bg-white rounded-full opacity-5 blur-3xl"></div>
                    <div className="absolute bottom-8 right-16 w-28 h-28 bg-white rounded-full opacity-[0.07] blur-2xl"></div>
                    <div className="absolute top-1/2 left-1/4 w-20 h-20 bg-white rounded-full opacity-[0.06] blur-xl"></div>

                    <div className="relative w-full h-full p-4 sm:p-6 flex flex-col text-white overflow-hidden">
                      {/* Gradient Background - Modern Design */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[#32BB78] via-[#2a9d63] to-[#1f7a4a]"></div>
                      
                      {/* Decorative Elements - Circles like Visa/Mastercard */}
                      <div className="absolute top-10 right-0 w-40 h-40 rounded-full bg-white opacity-[0.08] blur-3xl -mr-10"></div>
                      <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-orange-400 opacity-[0.12] blur-3xl -mb-10 -ml-10"></div>
                      <div className="absolute top-1/3 right-1/4 w-24 h-24 rounded-full bg-white opacity-[0.06] blur-2xl"></div>

                      <div className="relative z-10 flex flex-col h-full">
                        {/* TOP - Logo and Brand */}
                        <div className="flex items-start justify-between mb-3 sm:mb-4">
                          <div>
                            <p className="text-[10px] sm:text-xs font-bold opacity-70 tracking-widest uppercase">eNkamba</p>
                            <p className="text-xl sm:text-2xl font-bold tracking-wider">PAY</p>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Image src="/enkamba-logo.png" alt="eNkamba" width={40} height={40} className="drop-shadow-lg w-12 h-12 sm:w-14 sm:h-14" />
                          </div>
                        </div>

                        {/* MIDDLE - Vertical Layout for Mobile, Two Columns for Desktop */}
                        <div className="flex-1 flex flex-col gap-3 sm:gap-4">
                          {/* TOP ROW - Card Number & QR Code Side by Side */}
                          <div className="flex gap-3 items-start justify-between">
                            {/* LEFT - Card Number */}
                            <div className="flex-1 min-w-0">
                              <p className="text-[9px] sm:text-xs opacity-60 mb-0.5 uppercase tracking-widest font-semibold">Numéro</p>
                              <p className="text-xs sm:text-lg font-mono font-bold tracking-wider break-all sm:break-normal">
                                {cardNumber ? cardNumber.split(' ').map((group, i) => (
                                  <span key={i}>{group}{i < 3 ? ' ' : ''}</span>
                                )) : '•••• •••• •••• ••••'}
                              </p>
                            </div>

                            {/* RIGHT - QR Code (Always Visible) */}
                            {qrCode && (
                              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                                <div className="bg-white p-1.5 sm:p-2 rounded-lg shadow-lg">
                                  <Image src={qrCode} alt="QR Code" width={80} height={80} className="w-14 h-14 sm:w-20 sm:h-20" />
                                </div>
                                <p className="text-[8px] sm:text-xs opacity-60 uppercase tracking-widest font-semibold">Scan</p>
                              </div>
                            )}
                          </div>

                          {/* MIDDLE ROW - Holder & Expiry */}
                          <div className="grid grid-cols-2 gap-2 sm:gap-3">
                            <div>
                              <p className="text-[9px] sm:text-xs opacity-60 mb-0.5 uppercase tracking-widest font-semibold">Titulaire</p>
                              <p className="text-[10px] sm:text-xs font-semibold truncate">{profile?.fullName?.substring(0, 12).toUpperCase() || 'UTILISATEUR'}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] sm:text-xs opacity-60 mb-0.5 uppercase tracking-widest font-semibold">Valide</p>
                              <p className="text-[10px] sm:text-xs font-mono font-semibold">{expiryDate}</p>
                            </div>
                          </div>

                          {/* BOTTOM ROW - Account & Balance */}
                          <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-2 border-t border-white/20">
                            <div>
                              <p className="text-[9px] sm:text-xs opacity-60 mb-0.5 uppercase tracking-widest font-semibold">Compte</p>
                              <p className="text-[10px] sm:text-xs font-mono font-bold">{accountNumber?.slice(-8) || '00000000'}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] sm:text-xs opacity-60 mb-0.5 uppercase tracking-widest font-semibold">Solde</p>
                              <div className="flex items-center justify-end gap-1">
                                <p className="text-[10px] sm:text-xs font-mono font-bold">{displayBalance}</p>
                                <button onClick={(e) => { e.stopPropagation(); setIsBalanceVisible(!isBalanceVisible); }} className="p-0.5 hover:bg-white/20 rounded transition-colors">
                                  {isBalanceVisible ? <Eye className="w-3 h-3 sm:w-4 sm:h-4" /> : <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" />}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* BACK - MODERN DESIGN */}
                <div className="card-back">
                  <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl">
                    {/* Gradient Background - Same as Front */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#32BB78] via-[#2a9d63] to-[#1f7a4a]"></div>
                    
                    {/* Decorative Elements */}
                    <div className="absolute bottom-0 right-0 w-40 h-40 rounded-full bg-orange-400 opacity-[0.12] blur-3xl -mr-10 -mb-10"></div>
                    <div className="absolute top-1/2 left-0 w-32 h-32 rounded-full bg-white opacity-[0.06] blur-2xl -ml-10"></div>

                    <div className="relative w-full h-full p-4 sm:p-6 flex flex-col justify-between text-white">
                      {/* Magnetic Strip */}
                      <div className="w-full h-12 bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg shadow-inner mb-6 border border-white/10" style={{
                        backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px)'
                      }}></div>

                      {/* CVV Section - Main Focus */}
                      <div className="flex-1 flex flex-col items-end justify-center pr-4 mb-6">
                        <div className="w-full sm:w-3/4">
                          <p className="text-xs opacity-60 mb-2 uppercase tracking-widest font-semibold text-right">CVV</p>
                          <div className="bg-white text-[#1f7a4a] rounded-lg p-3 sm:p-4 shadow-lg">
                            <p className="text-2xl sm:text-3xl font-mono font-bold tracking-widest text-center">{cvv}</p>
                          </div>
                        </div>
                      </div>

                      {/* Card Details - Minimal */}
                      <div className="space-y-3 text-sm">
                        {/* Row 1 */}
                        <div className="flex items-center justify-between pb-3 border-t border-white/20">
                          <div>
                            <p className="text-xs opacity-60 uppercase tracking-widest font-semibold mb-1">Valide</p>
                            <p className="font-mono font-bold">{expiryDate}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs opacity-60 uppercase tracking-widest font-semibold mb-1">Titulaire</p>
                            <p className="font-bold">{profile?.fullName?.toUpperCase().substring(0, 20) || 'UTILISATEUR'}</p>
                          </div>
                        </div>

                        {/* Row 2 - Account Number */}
                        <div>
                          <p className="text-xs opacity-60 uppercase tracking-widest font-semibold mb-1">Compte eNkamba</p>
                          <p className="font-mono font-bold">{accountNumber || 'ENK000000000000'}</p>
                        </div>

                        {/* Row 3 - Footer Info */}
                        <div className="text-center text-xs opacity-50 pt-2 border-t border-white/20 mt-2">
                          <p>Cliquez pour voir le recto</p>
                          <p className="mt-1">eNkamba © Digital Wallet</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions Wallet - Below Card */}
          <div className="w-full slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex justify-center gap-8 sm:gap-12">
              {walletActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.label} href={action.href}>
                    <div className="group relative flex flex-col items-center gap-3 cursor-pointer">
                      {/* Animated Background Circles */}
                      <div className="absolute -inset-4 bg-gradient-to-br from-[#32BB78]/20 to-[#2a9d63]/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                      <div className="absolute -inset-6 rounded-full border border-[#32BB78]/10 opacity-0 group-hover:opacity-60 transition-all duration-500"></div>
                      
                      {/* Icon Container - Modern Design */}
                      <div className="relative">
                        {/* Outer glow circle */}
                        <div className="absolute inset-0 -m-2 rounded-full bg-[#32BB78]/15 opacity-0 group-hover:opacity-100 transition-all duration-300 blur-lg"></div>
                        
                        {/* Icon background with gradient */}
                        <div className="relative bg-gradient-to-br from-[#32BB78] via-[#2a9d63] to-[#1f7a4a] rounded-full p-5 shadow-lg hover:shadow-2xl transition-all duration-300 transform group-hover:scale-125 border border-[#32BB78]/60 group-hover:border-[#32BB78]/100 group-hover:-rotate-12">
                          {/* Inner circle animation */}
                          <div className="absolute inset-2 rounded-full border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="relative text-white drop-shadow-lg">
                            <Icon />
                          </div>
                        </div>
                      </div>
                      
                      {/* Label with enhanced styling */}
                      <span className="text-sm font-semibold text-foreground group-hover:text-[#32BB78] transition-colors duration-300 text-center">
                        {action.label}
                      </span>
                      
                      {/* Subtle animation indicator */}
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
                  <p className="text-lg font-bold">{accountNumber}</p>
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
                    const isDeposit = tx.type === 'deposit';
                    const Icon = isDeposit ? ArrowDownLeft : ArrowUpRight;
                    const formattedDate = tx.timestamp?.toDate?.() 
                      ? new Date(tx.timestamp.toDate()).toLocaleDateString('fr-FR')
                      : 'Date inconnue';
                    
                    return (
                      <div key={tx.id} className="flex items-center gap-4 p-4 rounded-xl hover:bg-muted/50 transition-colors group cursor-pointer">
                        <div className={`p-3 rounded-full ${isDeposit ? 'bg-[#32BB78]/20' : 'bg-red-100'}`}>
                          <Icon className={`w-5 h-5 ${isDeposit ? 'text-[#32BB78]' : 'text-red-600'}`} />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{tx.description}</p>
                          <p className="text-xs text-muted-foreground">{formattedDate}</p>
                        </div>
                        <p className={`font-bold text-sm ${isDeposit ? 'text-[#32BB78]' : 'text-foreground'}`}>
                          {isDeposit ? '+' : '-'} {tx.amount.toLocaleString('fr-FR')} CDF
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

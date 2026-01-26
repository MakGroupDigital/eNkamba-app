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
  Lock,
  Shield,
  Plus,
  Minus,
  HandCoins,
  QrCode,
  UserPlus,
  TrendingUp,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Zap,
  Send,
  Wallet,
  Watch,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useWalletTransactions } from '@/hooks/useWalletTransactions';
import Image from 'next/image';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';

const actionIcons = [
  {
    icon: Plus,
    label: 'Ajouter',
    href: '/dashboard/add-funds',
    color: 'from-[#32BB78] to-[#2a9d63]',
  },
  {
    icon: Minus,
    label: 'Retirer',
    href: '/dashboard/withdraw',
    color: 'from-red-500 to-red-600',
  },
  {
    icon: HandCoins,
    label: 'Demander',
    href: '/dashboard/request',
    color: 'from-[#2a9d63] to-[#1f7a4a]',
  },
  {
    icon: QrCode,
    label: 'Encaisser',
    href: '/dashboard/receive',
    color: 'from-[#32BB78] to-[#2a9d63]',
  },
  {
    icon: Send,
    label: 'Envoyer',
    href: '/dashboard/send',
    color: 'from-[#2a9d63] to-[#1f7a4a]',
  },
  {
    icon: UserPlus,
    label: 'Inviter',
    href: '/dashboard/invite',
    color: 'from-[#32BB78] to-[#2a9d63]',
  },
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

      QRCode.toDataURL(accountNum, {
        width: 200,
        margin: 1,
        color: {
          dark: '#32BB78',
          light: '#ffffff',
        },
      }).then(setQrCode);
    }
  }, [profile?.uid]);

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(accountNumber);
  };

  const displayBalance = isBalanceVisible 
    ? walletBalance.toLocaleString('fr-FR') 
    : '••••••••';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#32BB78]/5 to-background">
      <style>{`
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        @keyframes float-card {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(50, 187, 120, 0.3); }
          50% { box-shadow: 0 0 40px rgba(50, 187, 120, 0.5); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .card-shimmer {
          animation: shimmer 3s infinite;
          background: linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.1) 100%);
          background-size: 1000px 100%;
        }
        .float-card {
          animation: float-card 3s ease-in-out infinite;
        }
        .glow-effect {
          animation: glow 3s ease-in-out infinite;
        }
        .slide-up {
          animation: slide-up 0.6s ease-out;
        }
        .card-container {
          perspective: 1000px;
          cursor: pointer;
          width: 100%;
          max-width: 500px;
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

      <div className="container mx-auto max-w-7xl p-4 space-y-12 animate-in fade-in duration-500">
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
          <div className="float-card glow-effect w-full flex justify-center">
            <div className="card-container" onClick={() => setIsFlipped(!isFlipped)}>
              <div className={`card-inner ${isFlipped ? 'flipped' : ''}`}>
                {/* FRONT */}
                <div className="card-front">
                  <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#32BB78] via-[#2a9d63] to-[#1f7a4a]"></div>
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -ml-16 -mb-16"></div>
                    <div className="absolute inset-0 card-shimmer"></div>

                    <div className="relative w-full h-full p-6 flex flex-col justify-between text-white">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-semibold opacity-80 tracking-widest">eNkamba</p>
                          <p className="text-lg font-bold">PAY</p>
                        </div>
                        <Image src="/enkamba-logo.png" alt="eNkamba" width={32} height={32} className="drop-shadow-lg w-8 h-8 sm:w-10 sm:h-10" />
                      </div>

                      <div className="flex items-end justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs opacity-70 mb-0.5">Titulaire</p>
                          <p className="text-sm sm:text-base font-bold truncate">{profile?.fullName || 'Utilisateur'}</p>
                          <p className="text-xs opacity-70 mt-1">{accountNumber || 'ENK000000000000'}</p>
                        </div>
                        {qrCode && (
                          <div className="bg-white p-1 sm:p-2 rounded-lg shadow-lg flex-shrink-0">
                            <Image src={qrCode} alt="QR Code" width={50} height={50} className="w-12 h-12 sm:w-16 sm:h-16" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div>
                          <p className="text-xs opacity-70 mb-0.5">Numéro de carte</p>
                          <p className="text-xs sm:text-sm font-mono font-bold tracking-widest">{cardNumber}</p>
                        </div>
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-xs opacity-70 mb-0.5">Solde</p>
                            <div className="flex items-center gap-1">
                              <p className="text-base sm:text-xl font-bold font-mono">{displayBalance} CDF</p>
                              <button onClick={(e) => { e.stopPropagation(); setIsBalanceVisible(!isBalanceVisible); }} className="p-1 hover:bg-white/20 rounded transition-colors">
                                {isBalanceVisible ? <Eye className="w-3 h-3 sm:w-4 sm:h-4" /> : <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" />}
                              </button>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs opacity-70 mb-0.5">Valide jusqu'au</p>
                            <p className="text-xs sm:text-sm font-mono font-bold">{expiryDate}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* BACK */}
                <div className="card-back">
                  <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black"></div>
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>

                    <div className="relative w-full h-full p-6 flex flex-col justify-between text-white text-xs sm:text-sm">
                      <div className="w-full h-8 sm:h-12 bg-black rounded shadow-inner mb-3"></div>

                      <div className="space-y-3 flex-1">
                        <div>
                          <p className="text-xs opacity-60 mb-1">CVV / CVC</p>
                          <div className="bg-white/10 rounded-lg p-2 sm:p-3 backdrop-blur-sm border border-white/20">
                            <p className="text-lg sm:text-2xl font-mono font-bold tracking-widest">{cvv}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-xs opacity-60 mb-1">Valide jusqu'au</p>
                            <p className="text-sm sm:text-base font-mono font-bold">{expiryDate}</p>
                          </div>
                          <div>
                            <p className="text-xs opacity-60 mb-1">Titulaire</p>
                            <p className="text-xs sm:text-sm font-bold truncate">{profile?.fullName || 'UTILISATEUR'}</p>
                          </div>
                        </div>

                        <div className="border-t border-white/20 pt-2">
                          <p className="text-xs opacity-60 mb-1">Sécurité</p>
                          <div className="space-y-0.5 text-xs opacity-80">
                            <div className="flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              <span>3D Secure</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              <span>Chiffrement EMV</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="text-center text-xs opacity-60 border-t border-white/20 pt-2">
                        <p>Cliquez pour voir le recto</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Icons - Below Card */}
          <div className="grid grid-cols-6 gap-3 w-full max-w-2xl slide-up" style={{ animationDelay: '0.2s' }}>
            {actionIcons.map((action) => (
              <Link key={action.label} href={action.href}>
                <div className="group cursor-pointer h-full">
                  <div className={`bg-gradient-to-br ${action.color} rounded-2xl p-4 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-110 h-full flex flex-col items-center justify-center gap-2 relative overflow-hidden border border-white/10`}>
                    <div className="bg-white/20 rounded-full p-3 group-hover:bg-white/30 transition-colors">
                      <action.icon className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-white text-xs font-semibold text-center">{action.label}</p>
                  </div>
                </div>
              </Link>
            ))}
            
            {/* Payer Button */}
            <Link href="/dashboard/pay">
              <div className="group cursor-pointer h-full">
                <div className="bg-gradient-to-br from-[#FFA500] to-[#FF8C00] rounded-2xl p-4 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-110 h-full flex flex-col items-center justify-center gap-2 relative overflow-hidden border border-white/10">
                  <div className="bg-white/20 rounded-full p-3 group-hover:bg-white/30 transition-colors">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-white text-xs font-semibold text-center">Payer</p>
                </div>
              </div>
            </Link>

            {/* Wearables Button */}
            <Link href="/dashboard/wearables">
              <div className="group cursor-pointer h-full">
                <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-4 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-110 h-full flex flex-col items-center justify-center gap-2 relative overflow-hidden border border-white/10">
                  <div className="bg-white/20 rounded-full p-3 group-hover:bg-white/30 transition-colors">
                    <Watch className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-white text-xs font-semibold text-center">Wearables</p>
                </div>
              </div>
            </Link>

            {/* Bills Button */}
            <Link href="/dashboard/bills">
              <div className="group cursor-pointer h-full">
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-4 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-110 h-full flex flex-col items-center justify-center gap-2 relative overflow-hidden border border-white/10">
                  <div className="bg-white/20 rounded-full p-3 group-hover:bg-white/30 transition-colors">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-white text-xs font-semibold text-center">Factures</p>
                </div>
              </div>
            </Link>

            {/* Services Button */}
            <Link href="/dashboard/partner-services">
              <div className="group cursor-pointer h-full">
                <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl p-4 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-110 h-full flex flex-col items-center justify-center gap-2 relative overflow-hidden border border-white/10">
                  <div className="bg-white/20 rounded-full p-3 group-hover:bg-white/30 transition-colors">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-white text-xs font-semibold text-center">Services</p>
                </div>
              </div>
            </Link>
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

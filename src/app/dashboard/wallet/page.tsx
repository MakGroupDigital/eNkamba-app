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
  Zap,
  TrendingUp,
  CreditCard,
} from 'lucide-react';
import { getTransactionIconConfig } from '@/lib/transaction-icons';
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

const LeopardAfricaArtwork = () => (
  <svg viewBox="0 0 520 320" className="h-full w-full" aria-hidden="true">
    <defs>
      <linearGradient id="africaGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fff4c4" />
        <stop offset="22%" stopColor="#f7d87b" />
        <stop offset="45%" stopColor="#cf9833" />
        <stop offset="68%" stopColor="#8c5f16" />
        <stop offset="100%" stopColor="#f6d879" />
      </linearGradient>
      <radialGradient id="furGold" cx="35%" cy="30%" r="75%">
        <stop offset="0%" stopColor="#fff8d1" />
        <stop offset="28%" stopColor="#f1cd6a" />
        <stop offset="58%" stopColor="#c88e27" />
        <stop offset="100%" stopColor="#5c390c" />
      </radialGradient>
      <radialGradient id="furShadow" cx="50%" cy="50%" r="80%">
        <stop offset="0%" stopColor="rgba(0,0,0,0)" />
        <stop offset="100%" stopColor="rgba(0,0,0,0.28)" />
      </radialGradient>
      <filter id="goldGlow" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="6" result="blur" />
        <feColorMatrix
          in="blur"
          type="matrix"
          values="1 0 0 0 0.7  0 1 0 0 0.45  0 0 1 0 0.05  0 0 0 1 0"
        />
      </filter>
      <linearGradient id="metalLine" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fff6cf" />
        <stop offset="35%" stopColor="#efca66" />
        <stop offset="62%" stopColor="#a26d19" />
        <stop offset="100%" stopColor="#fff0bd" />
      </linearGradient>
      <filter id="emboss" x="-20%" y="-20%" width="140%" height="140%">
        <feOffset dx="0" dy="2" />
        <feGaussianBlur stdDeviation="2.5" result="offset-blur" />
        <feColorMatrix
          in="offset-blur"
          type="matrix"
          values="0 0 0 0 0.12  0 0 0 0 0.07  0 0 0 0 0.01  0 0 0 0.65 0"
        />
      </filter>
    </defs>

    <path
      d="M328 10l46 14 22 30-10 40 24 38-18 54 18 46-26 48-6 40-28-10-10-48-18-14-10-36-24-18-4-38-18-22 8-44 20-24 8-26 26-30z"
      fill="url(#africaGold)"
      opacity="0.9"
      filter="url(#goldGlow)"
    />
    <path
      d="M324 18l43 12 20 28-9 35 21 35-16 51 17 40-22 42-7 34-22-9-9-40-19-15-8-32-22-16-4-34-16-22 8-38 18-21 8-24 20-26z"
      fill="url(#africaGold)"
      opacity="0.98"
    />

    <g transform="translate(36 20)">
      <path
        d="M115 92c22-34 61-60 109-60 49 0 95 24 123 65 24 34 32 76 19 113-11 32-34 53-62 71-18 11-30 33-52 40-20 6-43-1-58-15-16-16-18-39-34-54-16-16-39-21-58-36-24-17-40-43-42-72-3-20 3-37 12-52 11-18 24-33 43-48z"
        fill="url(#furGold)"
        filter="url(#emboss)"
      />
      <path
        d="M138 104c21-31 51-49 87-54 40-5 82 11 109 42 22 25 32 61 25 92-9 38-39 59-67 82-17 14-28 34-49 40-21 7-41-7-53-21-16-18-40-26-62-37-25-12-43-32-49-57-9-38 3-65 23-87 10-12 18-20 36-30z"
        fill="rgba(40,22,1,0.16)"
      />
      <path
        d="M130 120c12-37 46-74 86-88 31-10 73-6 105 12 25 14 48 40 57 70 9 29 4 56-5 74-13 25-36 46-63 57-23 9-49 10-72 5-26-5-49-17-70-35-31-26-50-71-38-118z"
        fill="none"
        stroke="url(#metalLine)"
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0.85"
      />
      <path
        d="M173 140c22-31 56-47 90-44 31 3 60 20 78 46 13 19 18 40 12 58-6 17-17 26-30 35-15 9-31 18-51 16-16-1-28-8-41-14-20-10-40-9-58-1-13 5-24 15-39 15-14 0-26-9-34-22-14-22-7-52 10-75 14-18 24-27 44-37 6-4 12-6 19-8z"
        fill="url(#furGold)"
      />
      <path
        d="M185 156c18-24 44-37 73-38 31-1 62 13 81 35 16 19 22 48 10 67-11 16-31 25-49 29-17 3-31-2-47-7-18-6-35-5-51 2-11 4-21 12-33 11-12 0-21-8-27-18-10-18-6-42 7-59 12-15 20-23 36-31z"
        fill="#f4d37a"
        opacity="0.86"
      />
      <path d="M212 115c3-18 0-39-11-58-8-15-23-28-40-28-13 0-24 8-29 18-7 15-4 31 3 45 11 20 31 34 51 46" fill="url(#furGold)" filter="url(#emboss)" />
      <path d="M206 126c-5-26-17-46-34-61-10-9-23-14-34-12-8 1-15 7-18 14-5 11-3 24 1 35 9 21 30 35 47 48" fill="rgba(33,18,1,0.18)" />
      <path d="M229 133c8-10 20-16 34-17 16-1 31 7 40 19" stroke="#3a2100" strokeWidth="5" strokeLinecap="round" opacity="0.75" />
      <path d="M203 146c-8 6-15 13-18 23" stroke="#3a2100" strokeWidth="5" strokeLinecap="round" opacity="0.65" />
      <ellipse cx="294" cy="159" rx="8" ry="11" fill="#201202" />
      <circle cx="297" cy="155" r="2.2" fill="#fff8d1" />
      <path d="M305 170c13 4 31 16 42 28" stroke="#2a1700" strokeWidth="5" strokeLinecap="round" opacity="0.82" />
      <path d="M224 189c17 5 31 11 42 20" stroke="#2a1700" strokeWidth="4" strokeLinecap="round" opacity="0.8" />
      <path d="M260 190c12 7 28 9 40 7" stroke="#2a1700" strokeWidth="4" strokeLinecap="round" opacity="0.78" />
      <path d="M269 202c8 11 22 17 36 19" stroke="#74480e" strokeWidth="4" strokeLinecap="round" />
      <path d="M257 199c-8 9-21 14-34 15" stroke="#74480e" strokeWidth="4" strokeLinecap="round" />
      <path d="M271 211c7 6 15 9 25 9 11 0 19-5 24-10" stroke="#2f1800" strokeWidth="4" strokeLinecap="round" />
      {[
        [226, 104], [252, 110], [281, 111], [197, 129], [230, 138], [260, 138],
        [289, 139], [318, 131], [206, 165], [236, 168], [267, 169], [297, 166],
        [327, 157], [198, 192], [228, 201], [260, 204], [293, 201], [323, 191],
        [212, 223], [246, 228], [279, 228], [307, 220], [339, 180], [183, 176],
        [171, 145], [345, 141]
      ].map(([cx, cy], index) => (
        <ellipse
          key={index}
          cx={cx}
          cy={cy}
          rx={index % 4 === 0 ? 9 : 7}
          ry={index % 3 === 0 ? 5 : 4}
          fill="#2a1600"
          opacity="0.8"
          transform={`rotate(${index % 2 === 0 ? 22 : -18} ${cx} ${cy})`}
        />
      ))}
      <path d="M176 194c-18 29-39 52-68 66" stroke="#fff1bb" strokeWidth="3" strokeLinecap="round" opacity="0.78" />
      <path d="M163 201c-28 29-62 54-102 68" stroke="#fff1bb" strokeWidth="2.4" strokeLinecap="round" opacity="0.6" />
      <path d="M170 214c-16 15-35 28-59 39" stroke="#fff1bb" strokeWidth="2.2" strokeLinecap="round" opacity="0.58" />
    </g>
  </svg>
);

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
  const cardFrontRef = useRef<HTMLDivElement>(null);
  const cardBackRef = useRef<HTMLDivElement>(null);
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

      // Générer QR code avec données complètes
      const fullName = profile.name || profile.fullName || 'eNkamba User';
      const email = profile.email || '';
      const phone = profile.phone || profile.phoneNumber || '';
      // Format: PAYMENT|accountNumber|name|email|uid
      const qrData = `PAYMENT|${accountNum}|${fullName}|${email}|${profile.uid}`;

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

  const captureCardFace = async (element: HTMLDivElement) => {
    const canvas = await html2canvas(element, {
      backgroundColor: null,
      scale: 2,
      logging: false,
    });

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Impossible de generer l image de la carte'));
          return;
        }

        resolve(blob);
      }, 'image/png');
    });
  };

  // Long press handler pour télécharger la carte
  const handleCardMouseDown = () => {
    const timer = setTimeout(async () => {
      if (cardFrontRef.current && cardBackRef.current) {
        try {
          const { default: JSZip } = await import('jszip');
          const timestamp = new Date().getTime();

          setDownloadProgress(1);
          const frontBlob = await captureCardFace(cardFrontRef.current);
          setDownloadProgress(40);

          const backBlob = await captureCardFace(cardBackRef.current);
          setDownloadProgress(75);

          const zip = new JSZip();
          zip.file(`enkamba-card-recto-${timestamp}.png`, frontBlob);
          zip.file(`enkamba-card-verso-${timestamp}.png`, backBlob);

          const zipBlob = await zip.generateAsync({ type: 'blob' });
          setDownloadProgress(92);

          const link = document.createElement('a');
          link.href = URL.createObjectURL(zipBlob);
          link.download = `enkamba-card-${timestamp}.zip`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(link.href);

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
                {/* FRONT - PREMIUM ENKAMBA PAY */}
                <div className="card-front">
                  <div ref={cardFrontRef} className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_#1c7a50_0%,_#0f5739_36%,_#083624_100%)]"></div>
                    <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(255,236,170,0.13)_0%,rgba(255,236,170,0)_22%,rgba(255,255,255,0.03)_48%,rgba(212,160,58,0.12)_78%,rgba(88,50,3,0.25)_100%)]"></div>
                    <div className="absolute inset-0 opacity-[0.14]" style={{
                      backgroundImage: 'linear-gradient(90deg, rgba(255,216,124,0.09) 1px, transparent 1px), linear-gradient(rgba(255,216,124,0.07) 1px, transparent 1px)',
                      backgroundSize: '36px 36px'
                    }}></div>

                    <div className="absolute -left-16 -top-14 h-44 w-44 rounded-full bg-[#f7d87b]/12 blur-3xl"></div>
                    <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[#f7d87b]/10 blur-3xl"></div>
                    <div className="absolute bottom-0 left-10 h-44 w-44 rounded-full bg-[#a36f19]/18 blur-3xl"></div>

                    <div className="absolute left-[8%] top-[38%] h-[2px] w-[72%] rotate-[12deg] bg-gradient-to-r from-transparent via-[#ffd97a] to-transparent opacity-90 shadow-[0_0_22px_rgba(255,215,132,0.9)]"></div>
                    <div className="absolute left-[24%] top-[55%] h-[2px] w-[58%] -rotate-[16deg] bg-gradient-to-r from-transparent via-[#ffd97a] to-transparent opacity-80 shadow-[0_0_18px_rgba(255,215,132,0.8)]"></div>
                    <div className="absolute left-[15%] top-[64%] h-3 w-3 rounded-full bg-[#ffdf8f] shadow-[0_0_20px_rgba(255,223,143,0.95)]"></div>
                    <div className="absolute right-[18%] top-[42%] h-3.5 w-3.5 rounded-full bg-[#ffdf8f] shadow-[0_0_22px_rgba(255,223,143,0.95)]"></div>

                    <div className="relative z-10 flex h-full flex-col p-4 sm:p-6 text-white">
                      <div className="flex items-start justify-between">
                        <div className="rounded-2xl border border-[#f7d87b]/40 bg-[linear-gradient(145deg,#fff7cf_0%,#f1d06b_42%,#ba8020_74%,#fff0bf_100%)] p-2 shadow-[0_12px_28px_rgba(0,0,0,0.28),inset_0_1px_2px_rgba(255,255,255,0.9)]">
                          <div className="grid grid-cols-3 gap-1">
                            <span className="h-3 w-3 rounded-sm border border-[#8a6516]/60 bg-[#fff6d2]/90"></span>
                            <span className="h-3 w-3 rounded-sm border border-[#8a6516]/60 bg-[#e6bc57]/80"></span>
                            <span className="h-3 w-3 rounded-sm border border-[#8a6516]/60 bg-[#fff6d2]/90"></span>
                            <span className="h-3 w-3 rounded-sm border border-[#8a6516]/60 bg-[#e6bc57]/80"></span>
                            <span className="h-3 w-3 rounded-sm border border-[#8a6516]/60 bg-[#fff6d2]/90"></span>
                            <span className="h-3 w-3 rounded-sm border border-[#8a6516]/60 bg-[#e6bc57]/80"></span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-2">
                            <div className="overflow-hidden rounded-full border border-[#f7d87b]/35 shadow-[0_8px_18px_rgba(0,0,0,0.35)]">
                              <Image src="/enkamba-logo.png" alt="eNkamba" width={48} height={48} className="h-10 w-10 object-cover sm:h-12 sm:w-12" />
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold tracking-[0.24em] text-[#f5d27a] [text-shadow:0_2px_10px_rgba(0,0,0,0.45)] sm:text-xl">eNKAMBA</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="relative flex-1 min-h-0">
                        <div className="absolute inset-x-[14%] top-[4%] bottom-[20%] sm:inset-x-[12%] sm:top-[2%] sm:bottom-[11%]">
                          <LeopardAfricaArtwork />
                        </div>
                      </div>

                      <div className="relative z-10 max-w-[88%] space-y-2 sm:max-w-[68%] sm:space-y-4">
                        <div>
                          <p className="mb-1 text-[10px] uppercase tracking-[0.35em] text-[#fff1bf]/65">Numéro de carte</p>
                          <p className="font-mono text-[0.92rem] tracking-[0.14em] text-[#f7d87b] drop-shadow-[0_2px_10px_rgba(0,0,0,0.52)] sm:text-[1.95rem] sm:tracking-[0.18em]">
                            {cardNumber || '•••• •••• •••• ••••'}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-[#fff1bf]/95 drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)] sm:text-sm">
                            {profile?.fullName || profile?.name || 'Utilisateur eNkamba'}
                          </p>
                          <p className="mt-1 text-[11px] uppercase tracking-[0.3em] text-[#fff1bf]/72">
                            eNkambaPay
                          </p>
                        </div>
                      </div>

                      <div className="mt-2 grid grid-cols-2 gap-2 border-t border-[#f7d87b]/20 pt-2 text-[10px] sm:mt-4 sm:gap-4 sm:pt-4 sm:text-xs">
                        <div className="min-w-0">
                          <p className="uppercase tracking-[0.25em] text-[#fff1bf]/60">Compte</p>
                          <p className="mt-1 truncate font-mono text-[11px] font-semibold text-[#f7d87b] sm:text-sm">{accountNumber || 'ENK000000000000'}</p>
                        </div>
                        <div className="min-w-0 text-right">
                          <p className="uppercase tracking-[0.25em] text-[#fff1bf]/60">Solde</p>
                          <div className="mt-1 flex items-center justify-end gap-1.5">
                            <p className="truncate font-mono text-[11px] font-semibold text-[#f7d87b] sm:text-sm">{displayBalance} CDF</p>
                            <button onClick={(e) => { e.stopPropagation(); setIsBalanceVisible(!isBalanceVisible); }} className="rounded-full p-0.5 text-[#f7d87b] transition-colors hover:bg-white/10 sm:p-1">
                              {isBalanceVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* BACK - PREMIUM INFO PANEL */}
                <div className="card-back">
                  <div ref={cardBackRef} className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#185f3f_0%,_#0d432c_42%,_#071f14_100%)]"></div>
                    <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(224,182,85,0.14)_0%,rgba(224,182,85,0)_35%,rgba(255,255,255,0.03)_100%)]"></div>

                    <div className="absolute left-0 top-8 h-12 w-full bg-gradient-to-r from-black/85 via-[#2d2d2d] to-black/85 shadow-inner"></div>
                    <div className="absolute right-0 bottom-0 h-40 w-40 rounded-full bg-[#e0b655]/10 blur-3xl"></div>

                    <div className="relative flex h-full flex-col justify-between p-4 text-white sm:p-6">
                      <div className="pt-24">
                        <p className="text-[10px] uppercase tracking-[0.35em] text-[#fff1bf]/65">eNkambaPay</p>
                        <p className="mt-2 text-sm font-semibold text-[#ffe9a3] sm:text-base">Carte portefeuille digitale</p>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1.15fr_0.85fr] sm:gap-4">
                        <div className="space-y-4">
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.3em] text-[#fff1bf]/60">Titulaire</p>
                            <p className="mt-1 font-semibold text-[#ffe9a3]">
                              {(profile?.fullName || profile?.name || 'Utilisateur eNkamba').toUpperCase()}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.3em] text-[#fff1bf]/60">Numéro de compte</p>
                            <p className="mt-1 font-mono text-sm font-semibold text-[#ffe9a3] sm:text-base">{accountNumber || 'ENK000000000000'}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-[10px] uppercase tracking-[0.3em] text-[#fff1bf]/60">Validité</p>
                              <p className="mt-1 font-mono font-semibold text-[#ffe9a3]">{expiryDate}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-[0.3em] text-[#fff1bf]/60">CVV</p>
                              <p className="mt-1 font-mono font-semibold text-[#ffe9a3]">{cvv}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 sm:items-end sm:justify-between">
                          {qrCode && (
                            <div className="w-fit rounded-2xl border border-[#ffd784]/25 bg-white p-2 shadow-[0_10px_25px_rgba(0,0,0,0.25)] sm:self-end">
                              <Image src={qrCode} alt="QR Code" width={104} height={104} className="h-16 w-16 rounded-md sm:h-20 sm:w-20" />
                            </div>
                          )}
                          <div className="w-full rounded-2xl border border-[#ffd784]/20 bg-white/5 p-3 sm:text-right">
                            <p className="text-[10px] uppercase tracking-[0.3em] text-[#fff1bf]/60">Numéro de carte</p>
                            <p className="mt-1 font-mono text-xs font-semibold text-[#ffe9a3] sm:text-sm">{cardNumber || '•••• •••• •••• ••••'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-[#ffd784]/35 pt-2 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-[#fff2bd] drop-shadow-[0_1px_6px_rgba(0,0,0,0.5)]">
                        Touchez la carte pour revenir au recto
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

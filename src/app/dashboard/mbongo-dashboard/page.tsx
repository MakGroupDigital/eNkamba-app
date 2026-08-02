'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";
import DashboardHeader from "@/components/dashboard/dashboard-header";
import { SavingsIcon, CreditIcon, TontineIcon, ConversionIcon, ReferralIcon, AgentIcon, LinkAccountIcon, BonusIcon, TaxIcon, WaterIcon, TvIcon, AcademicIcon, SchoolIcon, EventIcon, PhoneCreditIcon, InsuranceIcon, ESimIcon, HealthIcon, FiveGoIcon, EChurchIcon } from "@/components/icons/service-icons";
import { useWalletTransactions } from '@/hooks/useWalletTransactions';
import { useSecureBalanceVisibility } from '@/hooks/useSecureBalanceVisibility';
import { PinVerification } from '@/components/payment/PinVerification';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

type DashboardCopy = Record<string, string>;

const DEFAULT_COPY: DashboardCopy = {
  scanner: 'Scanner',
  payReceive: 'Payer/Recevoir',
  invest: 'Investir',
  wallet: 'Portefeuille',
  facePaie: 'FacePaie',
  aiAssistant: 'Assistant Financier IA',
  aiAssistantText: 'Analysez votre historique pour détecter des anomalies et obtenir des recommandations.',
  generateReport: 'Générer un rapport',
  financialServices: 'Services Financiers',
  billsServices: 'Factures et autres Services',
  savings: 'Épargne',
  credit: 'Crédit',
  tontine: 'Tontine',
  conversion: 'Bureau de change',
  referral: 'Parrainage',
  agentAccount: 'Compte Agent',
  linkAccount: 'Lier un compte',
  bonus: 'Bonus',
  esim: 'eSIM-eNkamba',
  tax: 'Taxe et Impôt',
  regideso: 'Regideso',
  canal: 'Canal+',
  academicFees: 'Frais Académiques',
  schoolFees: 'Frais Scolaires',
  flight: "Billet d'avion",
  hotel: 'Hôtel',
  health: 'Santé',
  fivego: '5go',
  echurch: 'eChurch',
  events: 'Événements',
  phoneCredit: 'Crédit Téléphone',
  insurance: 'Assurance',
};

const LOCAL_LANGUAGE_COPY: Record<string, Partial<DashboardCopy>> = {
  fr: DEFAULT_COPY,
  tsh: {
    scanner: 'Scanner',
    payReceive: 'Payer/Recevoir',
    invest: 'Investir',
    wallet: 'Portefeuille',
    facePaie: 'FacePaie',
    aiAssistant: 'Assistant Financier IA',
    aiAssistantText: DEFAULT_COPY.aiAssistantText,
    generateReport: 'Générer un rapport',
    financialServices: 'Services Financiers',
    billsServices: 'Factures et autres Services',
  },
};

function MbongoActionImageIcon({
  src,
  className,
}: {
  src: string;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <Image
      src={src}
      alt=""
      width={64}
      height={64}
      className={cn("h-11 w-11 object-contain sm:h-14 sm:w-14", className)}
    />
  );
}

function ScannerActionIcon(props: { className?: string; strokeWidth?: number }) {
  return <MbongoActionImageIcon src="/mbongo-scanner-icon.svg" {...props} />;
}

function PayReceiveActionIcon(props: { className?: string; strokeWidth?: number }) {
  return <MbongoActionImageIcon src="/mbongo-pay-receive-icon.svg" {...props} />;
}

function InvestActionIcon(props: { className?: string; strokeWidth?: number }) {
  return <MbongoActionImageIcon src="/mbongo-invest-icon.svg" {...props} />;
}

function WalletActionIcon(props: { className?: string; strokeWidth?: number }) {
  return <MbongoActionImageIcon src="/mbongo-wallet-icon.svg" {...props} />;
}

function FacePaieIcon(props: { className?: string; strokeWidth?: number }) {
  return <MbongoActionImageIcon src="/facepaie-icon.svg" {...props} />;
}

const quickActions = [
  { 
    icon: ScannerActionIcon,
    labelKey: 'scanner',
    href: '/dashboard/scanner-simple',
    aliases: ['qr', 'qrcode', 'code qr', 'scan', 'scanner paiement']
  },
  { 
    icon: PayReceiveActionIcon,
    labelKey: 'payReceive',
    href: '/dashboard/pay-receive',
    aliases: ['payer', 'recevoir', 'envoyer argent', 'transfert', 'retrait']
  },
  { 
    icon: InvestActionIcon,
    labelKey: 'invest',
    href: '/dashboard/invest',
    aliases: ['investissement', 'placement', 'rendement']
  },
  { 
    icon: WalletActionIcon,
    labelKey: 'wallet',
    href: '/dashboard/wallet',
    aliases: ['solde', 'portemonnaie', 'compte', 'historique']
  },
  {
    icon: FacePaieIcon,
    labelKey: 'facePaie',
    href: '/dashboard/facepaie',
    aliases: ['facepaie', 'face paie', 'paiement visage', 'visage', 'biometrie', 'biométrie']
  },
];

const financialServices = [
  { icon: SavingsIcon, labelKey: 'savings', href: '/dashboard/savings', aliases: ['epargner', 'argent de cote'] },
  { icon: CreditIcon, labelKey: 'credit', href: '/dashboard/credit', aliases: ['pret', 'emprunt', 'microcredit'] },
  { icon: TontineIcon, labelKey: 'tontine', href: '/dashboard/tontine', aliases: ['ristourne', 'cotisation', 'groupe'] },
  { icon: ConversionIcon, labelKey: 'conversion', href: '/dashboard/conversion', aliases: ['bureau de change', 'devise', 'usd', 'eur', 'rmb', 'fcfa', 'changer argent'] },
  { icon: ReferralIcon, labelKey: 'referral', href: '/dashboard/referral', aliases: ['inviter', 'parrain', 'commission'] },
  { icon: AgentIcon, labelKey: 'agentAccount', href: '/dashboard/agent', aliases: ['agent', 'compte agent', 'cash in', 'cash out'] },
  { icon: LinkAccountIcon, labelKey: 'linkAccount', href: '/dashboard/link-account', aliases: ['banque', 'lier banque', 'compte bancaire'] },
  { icon: BonusIcon, labelKey: 'bonus', href: '/dashboard/bonus', aliases: ['recompense', 'cadeau', 'promotion'] },
];

const bills = [
  { icon: ESimIcon, labelKey: 'esim', href: '/dashboard/partner-services', aliases: ['sim', 'internet', 'data'] },
  { icon: TaxIcon, labelKey: 'tax', href: '/dashboard/tax-declaration', aliases: ['impot', 'declaration', 'fiscalite'] },
  { icon: WaterIcon, labelKey: 'regideso', href: '/dashboard/pay-bill?type=water', aliases: ['eau', 'facture eau'] },
  { icon: TvIcon, labelKey: 'canal', href: '/dashboard/pay-bill?type=tv', aliases: ['television', 'tv', 'abonnement'] },
  { icon: AcademicIcon, labelKey: 'academicFees', href: '/dashboard/academic-fees', aliases: ['universite', 'academique', 'etudiant'] },
  { icon: SchoolIcon, labelKey: 'schoolFees', href: '/dashboard/school-fees', aliases: ['ecole', 'scolarite', 'frais scolaire'] },
  { icon: HealthIcon, labelKey: 'health', href: '/dashboard/health', aliases: ['hopital', 'clinique', 'medical'] },
  { icon: FiveGoIcon, labelKey: 'fivego', href: '/dashboard/5go', aliases: ['transport', 'mobilite', 'course'] },
  { icon: EChurchIcon, labelKey: 'echurch', href: '/dashboard/echurch', aliases: ['eglise', 'offrande', 'don'] },
  { icon: EventIcon, labelKey: 'events', href: '/dashboard/events', aliases: ['evenement', 'ticket', 'billet'] },
  { icon: PhoneCreditIcon, labelKey: 'phoneCredit', href: '/dashboard/pay-bill?type=phone', aliases: ['airtime', 'telephone', 'unite', 'credit appel'] },
  { icon: InsuranceIcon, labelKey: 'insurance', href: '/dashboard/insurance', aliases: ['assurer', 'protection'] },
];

const FALLBACK_DAILY_RATES = {
  USD: 0.00035,
  EUR: 0.00032,
  CNY: 0.0027,
  XAF: 0.21,
};

type CurrencyWallets = Record<string, { balance?: number; updatedAt?: unknown }>;
type PaymentDashboardItem = {
  icon: any;
  labelKey: string;
  href: string;
  aliases?: string[];
};

function normalizePaymentSearch(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export default function MbongoDashboard() {
  const router = useRouter();
  const { balance: walletBalance } = useWalletTransactions();
  const [copy, setCopy] = useState<DashboardCopy>(DEFAULT_COPY);
  const [language, setLanguage] = useState('fr');
  const [isTranslating, setIsTranslating] = useState(false);
  const [dailyRates, setDailyRates] = useState(FALLBACK_DAILY_RATES);
  const [currencyWallets, setCurrencyWallets] = useState<CurrencyWallets>({});
  const [searchQuery, setSearchQuery] = useState('');
  const {
    isBalanceVisible,
    isBiometricChecking,
    isPinOpen,
    setIsPinOpen,
    requestUnlock,
    lockBalance,
    handlePinSuccess,
  } = useSecureBalanceVisibility();
  useEffect(() => {
    let cancelled = false;

    const loadDailyRates = async () => {
      try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/CDF');
        if (!response.ok) throw new Error('Taux indisponibles');
        const data = await response.json();

        if (!cancelled && data?.rates) {
          setDailyRates({
            USD: data.rates.USD || FALLBACK_DAILY_RATES.USD,
            EUR: data.rates.EUR || FALLBACK_DAILY_RATES.EUR,
            CNY: data.rates.CNY || FALLBACK_DAILY_RATES.CNY,
            XAF: data.rates.XAF || FALLBACK_DAILY_RATES.XAF,
          });
        }
      } catch (error) {
        console.error('Erreur taux du jour paiement:', error);
        if (!cancelled) setDailyRates(FALLBACK_DAILY_RATES);
      }
    };

    void loadDailyRates();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let unsubscribeWallet: (() => void) | undefined;
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      unsubscribeWallet?.();
      if (!currentUser) {
        setCurrencyWallets({});
        return;
      }
      unsubscribeWallet = onSnapshot(doc(db, 'users', currentUser.uid), (snapshot) => {
        setCurrencyWallets((snapshot.data()?.currencyWallets || {}) as CurrencyWallets);
      });
    });

    return () => {
      unsubscribeWallet?.();
      unsubscribeAuth();
    };
  }, []);

  useEffect(() => {
    const storedLanguage = window.localStorage.getItem('enkamba-dashboard-language') || 'fr';
    setLanguage(storedLanguage);

    const handleLanguageChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ language?: string }>;
      setLanguage(customEvent.detail?.language || 'fr');
    };

    window.addEventListener('enkamba-dashboard-language-change', handleLanguageChange);
    return () => window.removeEventListener('enkamba-dashboard-language-change', handleLanguageChange);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const translateDashboard = async () => {
      const localCopy = LOCAL_LANGUAGE_COPY[language];
      if (language === 'fr' || localCopy) {
        setCopy({ ...DEFAULT_COPY, ...(localCopy || {}) } as DashboardCopy);
        setIsTranslating(false);
        return;
      }

      setIsTranslating(true);
      try {
        const entries = Object.entries(DEFAULT_COPY);
        const translatedEntries = await Promise.all(
          entries.map(async ([key, text]) => {
            const response = await fetch('/api/chat/translate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text, targetLanguage: language }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data?.error || 'Traduction impossible');
            return [key, data.translatedText || text] as const;
          })
        );

        if (!cancelled) {
          setCopy(Object.fromEntries(translatedEntries) as DashboardCopy);
        }
      } catch (error) {
        console.error('Erreur traduction dashboard paiement:', error);
        if (!cancelled) setCopy(DEFAULT_COPY);
      } finally {
        if (!cancelled) setIsTranslating(false);
      }
    };

    void translateDashboard();
    return () => {
      cancelled = true;
    };
  }, [language]);

  const searchText = normalizePaymentSearch(searchQuery);
  const matchesSearch = (item: PaymentDashboardItem) => {
    if (!searchText) return true;
    const values = [copy[item.labelKey], item.labelKey, ...(item.aliases || [])];
    return values.some((value) => normalizePaymentSearch(value || '').includes(searchText));
  };
  const filteredQuickActions = quickActions.filter(matchesSearch);
  const filteredFinancialServices = financialServices.filter(matchesSearch);
  const filteredBills = bills.filter(matchesSearch);
  const paymentSearchResults = [
    ...filteredQuickActions,
    ...filteredFinancialServices,
    ...filteredBills,
  ];
  const hasSearchQuery = searchText.length > 0;
  const hasSearchResults = paymentSearchResults.length > 0;

  const openFirstSearchResult = () => {
    if (paymentSearchResults.length === 1) {
      router.push(paymentSearchResults[0].href);
    }
  };

  return (
    <>
      <DashboardHeader
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchKeyDown={(event) => {
          if (event.key === 'Enter') openFirstSearchResult();
        }}
        searchPlaceholder="Rechercher paiement, facture, devise..."
      />
      <div className="min-h-screen bg-white pt-24 animate-in fade-in duration-500">
        <main className="container mx-auto max-w-5xl space-y-5 px-4 pb-8 pt-2">
          <div className="grid grid-cols-5 gap-2 sm:gap-6">
            {filteredQuickActions.map((action) => {
              const IconComponent = action.icon;
              const label = copy[action.labelKey] || DEFAULT_COPY[action.labelKey] || action.labelKey;
              return (
                <Link key={action.labelKey} href={action.href} className="group flex flex-col items-center gap-2.5">
                  <div className="flex h-[62px] w-[62px] items-center justify-center rounded-full bg-[#0A8B46] text-white shadow-xl shadow-[#0A8B46]/20 transition-all duration-300 hover:scale-105 sm:h-24 sm:w-24">
                    <IconComponent className="h-9 w-9 text-white sm:h-14 sm:w-14" strokeWidth={2.4} />
                  </div>
                  <p className="text-center text-[12px] font-black leading-tight text-slate-800 sm:text-sm">{label}</p>
                </Link>
              );
            })}
          </div>

          <section className="space-y-4">
            <div className="relative flex min-h-[118px] items-center justify-between overflow-hidden rounded-2xl bg-[#0A8B46] px-6 py-5 text-white shadow-xl shadow-[#0A8B46]/20">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_86%_20%,rgba(255,255,255,0.16),transparent_34%)]" />
              <Link href="/dashboard/wallet" className="relative min-w-0 flex-1">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/75">Solde principal</p>
                <p className="mt-5 truncate text-2xl font-black text-white">
                  {isBalanceVisible ? walletBalance.toLocaleString('fr-FR') : '••••••'}
                  <span className="ml-2 text-lg font-black text-white">CDF</span>
                </p>
              </Link>
              <button
                type="button"
                onClick={isBalanceVisible ? lockBalance : requestUnlock}
                disabled={isBiometricChecking}
                aria-label={isBalanceVisible ? 'Masquer le solde' : 'Afficher le solde'}
                className="relative ml-3 inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-white/28 bg-white/8 text-white transition hover:bg-white/14 disabled:opacity-60"
              >
                {isBiometricChecking ? (
                  <Loader2 className="h-7 w-7 animate-spin" />
                ) : isBalanceVisible ? (
                  <Eye className="h-7 w-7" />
                ) : (
                  <EyeOff className="h-7 w-7" />
                )}
              </button>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-center gap-4">
                <span className="h-px w-14 bg-[#0A8B46]/20" />
                <p className="text-center text-[12px] font-black uppercase tracking-[0.22em] text-[#0A8B46]">Autres devises</p>
                <span className="h-px w-14 bg-[#0A8B46]/20" />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { code: 'USD', symbol: '$', estimated: walletBalance * dailyRates.USD },
                  { code: 'EUR', symbol: '€', estimated: walletBalance * dailyRates.EUR },
                  { code: 'RMB', symbol: '¥', estimated: walletBalance * dailyRates.CNY },
                  { code: 'FCFA', symbol: 'FCFA', estimated: walletBalance * dailyRates.XAF },
                ].map((item) => (
                  <Link key={item.code} href="/dashboard/conversion" className="relative min-h-[74px] overflow-hidden rounded-xl bg-[#0A8B46] p-2.5 text-white shadow-md shadow-[#0A8B46]/12 transition hover:-translate-y-0.5 hover:shadow-lg">
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,rgba(255,255,255,0.14),transparent_58%)]" />
                    <div className="relative flex items-start justify-between gap-1">
                      <p className="text-sm font-black">{item.code}</p>
                      <span className="flex h-6 min-w-6 max-w-[38px] items-center justify-center rounded-full bg-white/14 px-1 text-[10px] font-black text-white/80">
                        {item.symbol}
                      </span>
                    </div>
                    <p className="relative mt-2 truncate text-base font-black">
                      {isBalanceVisible ? Number(currencyWallets[item.code]?.balance || 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 }) : '••••'}
                    </p>
                    <p className="relative mt-0.5 truncate text-[9px] font-bold text-white/68">
                      ≈ {isBalanceVisible ? item.estimated.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) : '••••'} si CDF
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          <Card className="overflow-hidden rounded-3xl border-[#0A8B46]/10 bg-white shadow-xl shadow-black/5">
            <CardHeader className="px-5 pb-2 pt-5">
              <CardTitle className="font-headline flex items-center gap-2 text-2xl text-slate-950">
                <span className="h-3 w-3 rounded-full bg-[#0A8B46]" />
                {copy.financialServices}
                {isTranslating && <span className="text-xs font-normal text-muted-foreground">...</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-6 pt-2">
              <div className="grid grid-cols-4 gap-3 text-center sm:gap-5">
              {filteredFinancialServices.map(service => {
                const IconComponent = service.icon;
                return (
                  <Link href={service.href} key={service.labelKey} className="flex flex-col items-center gap-2 text-sm font-semibold text-slate-950 transition-all hover:text-[#0A8B46] group">
                    <div className={cn("mbongo-service-icon flex h-[82px] w-full max-w-[92px] items-center justify-center overflow-visible rounded-2xl bg-white", "border border-[#0A8B46]/10 shadow-sm group-hover:shadow-md group-hover:scale-[1.02] transition-all duration-300")}>
                      <IconComponent size={58} className="h-[58px] w-[58px]" />
                    </div>
                    <span className="text-center text-[12px] font-bold leading-tight">{copy[service.labelKey]}</span>
                  </Link>
                );
              })}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-3xl border-[#0A8B46]/10 bg-white shadow-xl shadow-black/5">
            <CardHeader className="px-5 pb-2 pt-5">
              <CardTitle className="font-headline flex items-center gap-2 text-xl text-slate-950">
                <span className="h-3 w-3 rounded-full bg-[#0A8B46]" />
                {copy.billsServices}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-6 pt-2">
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4">
              {filteredBills.map(bill => {
                const IconComponent = bill.icon;
                return (
                  <Link href={bill.href} key={bill.labelKey} className={cn("flex min-h-[118px] flex-col items-center justify-center gap-2.5 rounded-2xl p-3 text-center", "bg-white border border-[#0A8B46]/10", "text-sm font-semibold text-slate-950", "hover:shadow-md hover:scale-[1.02] transition-all duration-300", "group")}>
                    <div className="mbongo-service-icon group-hover:scale-105 transition-transform duration-300">
                      <IconComponent size={62} className="h-[62px] w-[62px]" />
                    </div>
                    <span className="text-center text-[12px] font-bold leading-tight">{copy[bill.labelKey]}</span>
                  </Link>
                );
              })}
              </div>
              {hasSearchQuery && !hasSearchResults && (
                <div className="mt-4 rounded-2xl border border-dashed border-[#0A8B46]/20 bg-[#0A8B46]/5 px-4 py-5 text-center">
                  <p className="text-sm font-black text-slate-900">Aucun service trouvé</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">Essayez avec paiement, tontine, bureau de change, facture ou QR.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
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
        <style jsx global>{`
          .mbongo-service-icon svg [fill='#FFA500'] {
            fill: #0A8B46 !important;
          }

          .mbongo-service-icon svg [stroke='#FFA500'] {
            stroke: #0A8B46 !important;
          }

          .mbongo-service-icon svg [stop-color='#FFA500'] {
            stop-color: #0A8B46 !important;
          }

          .mbongo-service-icon svg [fill='#009058'],
          .mbongo-service-icon svg [fill='#25543A'],
          .mbongo-service-icon svg [fill='#479B67'] {
            fill: #0A8B46 !important;
          }

          .mbongo-service-icon svg [stroke='#009058'],
          .mbongo-service-icon svg [stroke='#25543A'],
          .mbongo-service-icon svg [stroke='#479B67'] {
            stroke: #0A8B46 !important;
          }
        `}</style>
      </div>
    </>
  );
}

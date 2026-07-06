'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QrCode, ArrowLeftRight, TrendingUp, Wallet, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import DashboardHeader from "@/components/dashboard/dashboard-header";
import { SavingsIcon, CreditIcon, TontineIcon, ConversionIcon, ReferralIcon, AgentIcon, LinkAccountIcon, BonusIcon, TaxIcon, WaterIcon, TvIcon, AcademicIcon, SchoolIcon, EventIcon, PhoneCreditIcon, InsuranceIcon, ESimIcon, HealthIcon, FiveGoIcon, MobilityIcon } from "@/components/icons/service-icons";
import { useWalletTransactions } from '@/hooks/useWalletTransactions';
import { useSecureBalanceVisibility } from '@/hooks/useSecureBalanceVisibility';
import { PinVerification } from '@/components/payment/PinVerification';

type DashboardCopy = Record<string, string>;

const DEFAULT_COPY: DashboardCopy = {
  scanner: 'Scanner',
  payReceive: 'Payer/Recevoir',
  invest: 'Investir',
  wallet: 'Portefeuille',
  aiAssistant: 'Assistant Financier IA',
  aiAssistantText: 'Analysez votre historique pour détecter des anomalies et obtenir des recommandations.',
  generateReport: 'Générer un rapport',
  financialServices: 'Services Financiers',
  billsServices: 'Factures et autres Services',
  savings: 'Épargne',
  credit: 'Crédit',
  tontine: 'Tontine',
  conversion: 'Conversion',
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
  mobility: 'Mobilité',
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
    aiAssistant: 'Assistant Financier IA',
    aiAssistantText: DEFAULT_COPY.aiAssistantText,
    generateReport: 'Générer un rapport',
    financialServices: 'Services Financiers',
    billsServices: 'Factures et autres Services',
  },
};

const quickActions = [
  { 
    icon: QrCode,
    labelKey: 'scanner',
    href: '/dashboard/scanner-simple'
  },
  { 
    icon: ArrowLeftRight,
    labelKey: 'payReceive',
    href: '/dashboard/pay-receive'
  },
  { 
    icon: TrendingUp,
    labelKey: 'invest',
    href: '/dashboard/invest'
  },
  { 
    icon: Wallet,
    labelKey: 'wallet',
    href: '/dashboard/wallet'
  },
];

const financialServices = [
  { icon: SavingsIcon, labelKey: 'savings', href: '/dashboard/savings' },
  { icon: CreditIcon, labelKey: 'credit', href: '/dashboard/credit' },
  { icon: TontineIcon, labelKey: 'tontine', href: '/dashboard/tontine' },
  { icon: ConversionIcon, labelKey: 'conversion', href: '/dashboard/conversion' },
  { icon: ReferralIcon, labelKey: 'referral', href: '/dashboard/referral' },
  { icon: AgentIcon, labelKey: 'agentAccount', href: '/dashboard/agent' },
  { icon: LinkAccountIcon, labelKey: 'linkAccount', href: '/dashboard/link-account' },
  { icon: BonusIcon, labelKey: 'bonus', href: '/dashboard/bonus' },
];

const bills = [
  { icon: ESimIcon, labelKey: 'esim', href: '/dashboard/partner-services' },
  { icon: TaxIcon, labelKey: 'tax', href: '/dashboard/tax-declaration' },
  { icon: WaterIcon, labelKey: 'regideso', href: '/dashboard/pay-bill?type=water' },
  { icon: TvIcon, labelKey: 'canal', href: '/dashboard/pay-bill?type=tv' },
  { icon: AcademicIcon, labelKey: 'academicFees', href: '/dashboard/academic-fees' },
  { icon: SchoolIcon, labelKey: 'schoolFees', href: '/dashboard/school-fees' },
  { icon: HealthIcon, labelKey: 'health', href: '/dashboard/health' },
  { icon: FiveGoIcon, labelKey: 'fivego', href: '/dashboard/5go' },
  { icon: MobilityIcon, labelKey: 'mobility', href: '/dashboard/mobility' },
  { icon: EventIcon, labelKey: 'events', href: '/dashboard/events' },
  { icon: PhoneCreditIcon, labelKey: 'phoneCredit', href: '/dashboard/pay-bill?type=phone' },
  { icon: InsuranceIcon, labelKey: 'insurance', href: '/dashboard/insurance' },
];

const FALLBACK_DAILY_RATES = {
  USD: 0.00035,
  EUR: 0.00032,
  CNY: 0.0027,
};

export default function MbongoDashboard() {
  const { balance: walletBalance } = useWalletTransactions();
  const [copy, setCopy] = useState<DashboardCopy>(DEFAULT_COPY);
  const [language, setLanguage] = useState('fr');
  const [isTranslating, setIsTranslating] = useState(false);
  const [dailyRates, setDailyRates] = useState(FALLBACK_DAILY_RATES);
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

  return (
    <>
      <DashboardHeader />
      <div className="container mx-auto max-w-4xl p-4 space-y-6 animate-in fade-in duration-500 pt-24">
        {/* Quick Actions - 4 Circles */}
        <div className="grid grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const IconComponent = action.icon;
            
            return (
              <Link key={action.labelKey} href={action.href} className="flex flex-col items-center gap-2 group">
                {/* Icon Circle - Green background */}
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#0A8B46] hover:bg-[#0A8B46] transition-all duration-300 hover:scale-110 flex-shrink-0 shadow-md text-white">
                  <IconComponent size={32} className="text-white" />
                </div>
                {/* Label */}
                <p className="text-xs font-medium text-gray-800 text-center">{copy[action.labelKey]}</p>
              </Link>
            );
          })}
        </div>

        <section className="space-y-3">
          <div className="group relative mx-auto flex w-full max-w-[500px] items-center justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-[#0A8B46] to-[#0A8B46] px-4 py-3 text-white shadow-lg shadow-[#0A8B46]/20 ring-1 ring-white/20 animate-in fade-in-50 slide-in-from-bottom-3 duration-500">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.28),transparent_32%,transparent_68%,rgba(0,0,0,0.10))]" />
            <div className="pointer-events-none absolute inset-y-0 -left-20 w-16 skew-x-[-18deg] bg-white/25 blur-sm transition-transform duration-1000 group-hover:translate-x-[620px]" />
            <Link href="/dashboard/wallet" className="relative min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/75">
                Solde principal
              </p>
              <p className="mt-1 truncate text-2xl font-black text-white drop-shadow-sm">
                {isBalanceVisible ? walletBalance.toLocaleString('fr-FR') : '••••••'}
                <span className="ml-1 text-xs font-bold text-white/75">CDF</span>
              </p>
            </Link>
            <button
              type="button"
              onClick={isBalanceVisible ? lockBalance : requestUnlock}
              disabled={isBiometricChecking}
              aria-label={isBalanceVisible ? 'Masquer le solde' : 'Afficher le solde'}
              className="relative ml-3 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/35 bg-white/18 text-white shadow-sm backdrop-blur transition hover:scale-105 hover:bg-white/25 active:scale-95 disabled:opacity-60"
            >
              {isBiometricChecking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isBalanceVisible ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </button>
          </div>

          <div className="mx-auto max-w-[500px] animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
            <p className="mb-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              Conversion au taux du jour
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { code: 'USD', value: walletBalance * dailyRates.USD },
                { code: 'EUR', value: walletBalance * dailyRates.EUR },
                { code: 'RMB', value: walletBalance * dailyRates.CNY },
              ].map((item, index) => (
                <div
                  key={item.code}
                  className="group relative overflow-hidden rounded-xl bg-primary px-2.5 py-2 text-center text-primary-foreground shadow-md shadow-primary/15 ring-1 ring-white/20 transition duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/25 animate-in fade-in-50 slide-in-from-bottom-2"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,rgba(255,255,255,0.20),transparent_46%,rgba(0,0,0,0.08))]" />
                  <p className="relative text-[10px] font-black tracking-[0.14em] text-white/75">{item.code}</p>
                  <p className="relative mt-1 truncate text-sm font-black text-white">
                    {isBalanceVisible ? item.value.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) : '••••'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
            <CardTitle className="font-headline flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              {copy.financialServices}
              {isTranslating && <span className="text-xs font-normal text-muted-foreground">...</span>}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-4 gap-x-4 gap-y-6 text-center">
              {financialServices.map(service => {
                const IconComponent = service.icon;
                return (
                  <Link href={service.href} key={service.labelKey} className="flex flex-col items-center gap-3 text-sm font-medium text-foreground hover:text-primary transition-all group">
                    <div className={cn("flex h-14 w-14 items-center justify-center rounded-2xl", "bg-gradient-to-br from-muted to-muted/50", "group-hover:shadow-lg group-hover:scale-105 transition-all duration-300", "border border-transparent group-hover:border-primary/20")}>
                      <IconComponent size={32} />
                    </div>
                    <span className="text-center text-xs leading-tight">{copy[service.labelKey]}</span>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-accent/10 to-transparent">
            <CardTitle className="font-headline flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              {copy.billsServices}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {bills.map(bill => {
                const IconComponent = bill.icon;
                return (
                  <Link href={bill.href} key={bill.labelKey} className={cn("flex flex-col items-center gap-2 rounded-xl p-4 text-center", "bg-gradient-to-br from-background to-muted/30", "border border-border/50 hover:border-primary/30", "text-sm font-medium text-foreground", "hover:shadow-md hover:scale-[1.02] transition-all duration-300", "group")}>
                    <div className="group-hover:scale-110 transition-transform duration-300">
                      <IconComponent size={36} />
                    </div>
                    <span className="text-center text-xs leading-tight">{copy[bill.labelKey]}</span>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
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
    </>
  );
}

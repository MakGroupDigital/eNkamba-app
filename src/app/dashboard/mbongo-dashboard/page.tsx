'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, QrCode, ArrowLeftRight, TrendingUp, Wallet } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import DashboardHeader from "@/components/dashboard/dashboard-header";
import { SavingsIcon, CreditIcon, TontineIcon, ConversionIcon, ReferralIcon, AgentIcon, LinkAccountIcon, BonusIcon, TaxIcon, WaterIcon, TvIcon, AcademicIcon, SchoolIcon, EventIcon, PhoneCreditIcon, InsuranceIcon, ESimIcon, HealthIcon, FiveGoIcon, MobilityIcon } from "@/components/icons/service-icons";
import { useUserProfile } from '@/hooks/useUserProfile';

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

export default function MbongoDashboard() {
  const { profile } = useUserProfile();
  const [copy, setCopy] = useState<DashboardCopy>(DEFAULT_COPY);
  const [language, setLanguage] = useState('fr');
  const [isTranslating, setIsTranslating] = useState(false);

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
      <div className="container mx-auto max-w-4xl p-4 space-y-6 animate-in fade-in duration-500 pt-20">
        {/* Quick Actions - 4 Circles */}
        <div className="grid grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const IconComponent = action.icon;
            
            return (
              <Link key={action.labelKey} href={action.href} className="flex flex-col items-center gap-2 group">
                {/* Icon Circle - Green background */}
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#32BB78] hover:bg-[#2a9d63] transition-all duration-300 hover:scale-110 flex-shrink-0 shadow-md text-white">
                  <IconComponent size={32} className="text-white" />
                </div>
                {/* Label */}
                <p className="text-xs font-medium text-gray-800 text-center">{copy[action.labelKey]}</p>
              </Link>
            );
          })}
        </div>

        {/* Section QR Code Personnel - REMOVED */}
        {/* Assistant Financier IA */}
        <Card className="bg-gradient-to-r from-primary to-green-800 text-primary-foreground shadow-lg overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
          <CardHeader className="relative">
            <CardTitle className="font-headline flex items-center gap-2">
              <Sparkles className="text-accent" />
              {copy.aiAssistant}
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <p className="mb-4 text-sm">{copy.aiAssistantText}</p>
            <Button variant="secondary" asChild><Link href="/dashboard/report">{copy.generateReport}</Link></Button>
          </CardContent>
        </Card>
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
      </div>
    </>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, QrCode, ArrowLeftRight, TrendingUp, Wallet } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import DashboardHeader from "@/components/dashboard/dashboard-header";
import { SavingsIcon, CreditIcon, TontineIcon, ConversionIcon, ReferralIcon, AgentIcon, LinkAccountIcon, BonusIcon, TaxIcon, YangoIcon, WaterIcon, TvIcon, AcademicIcon, SchoolIcon, FlightIcon, HotelIcon, EventIcon, PhoneCreditIcon, InsuranceIcon, DonationIcon } from "@/components/icons/service-icons";
import { useUserProfile } from '@/hooks/useUserProfile';

const quickActions = [
  { 
    icon: QrCode,
    label: 'Scanner',
    href: '/dashboard/scanner-simple'
  },
  { 
    icon: ArrowLeftRight,
    label: 'Payer/Recevoir',
    href: '/dashboard/pay-receive'
  },
  { 
    icon: TrendingUp,
    label: 'Investir',
    href: '/dashboard/invest'
  },
  { 
    icon: Wallet,
    label: 'Portefeuille',
    href: '/dashboard/wallet'
  },
];

const financialServices = [
  { icon: SavingsIcon, label: 'Épargne', href: '/dashboard/savings' },
  { icon: CreditIcon, label: 'Crédit', href: '/dashboard/credit' },
  { icon: TontineIcon, label: 'Tontine', href: '/dashboard/tontine' },
  { icon: ConversionIcon, label: 'Conversion', href: '/dashboard/conversion' },
  { icon: ReferralIcon, label: 'Parrainage', href: '/dashboard/referral' },
  { icon: AgentIcon, label: 'Compte Agent', href: '/dashboard/agent' },
  { icon: LinkAccountIcon, label: 'Lier un compte', href: '/dashboard/link-account' },
  { icon: BonusIcon, label: 'Bonus', href: '/dashboard/bonus' },
];

const bills = [
  { icon: TaxIcon, label: 'Impôts', href: '/dashboard/pay-bill?type=tax' },
  { icon: YangoIcon, label: 'Yango', href: '/dashboard/pay-bill?type=yango' },
  { icon: WaterIcon, label: 'Regideso', href: '/dashboard/pay-bill?type=water' },
  { icon: TvIcon, label: 'Canal+', href: '/dashboard/pay-bill?type=tv' },
  { icon: AcademicIcon, label: 'Frais Académiques', href: '/dashboard/pay-bill?type=academic' },
  { icon: SchoolIcon, label: 'Frais Scolaires', href: '/dashboard/pay-bill?type=school' },
  { icon: FlightIcon, label: 'Billet d\'avion', href: '/dashboard/pay-bill?type=flight' },
  { icon: HotelIcon, label: 'Hôtel', href: '/dashboard/pay-bill?type=hotel' },
  { icon: EventIcon, label: 'Événements', href: '/dashboard/pay-bill?type=event' },
  { icon: PhoneCreditIcon, label: 'Crédit Téléphone', href: '/dashboard/pay-bill?type=phone' },
  { icon: InsuranceIcon, label: 'Assurance', href: '/dashboard/pay-bill?type=insurance' },
  { icon: DonationIcon, label: 'Donation', href: '/dashboard/pay-bill?type=donation' },
];

export default function MbongoDashboard() {
  const { profile } = useUserProfile();

  return (
    <>
      <DashboardHeader />
      <div className="container mx-auto max-w-4xl p-4 space-y-6 animate-in fade-in duration-500 pt-20">
        {/* Quick Actions - 4 Circles */}
        <div className="grid grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const IconComponent = action.icon;
            
            return (
              <Link key={action.label} href={action.href} className="flex flex-col items-center gap-2 group">
                {/* Icon Circle - Green background */}
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#32BB78] hover:bg-[#2a9d63] transition-all duration-300 hover:scale-110 flex-shrink-0 shadow-md text-white">
                  <IconComponent size={32} className="text-white" />
                </div>
                {/* Label */}
                <p className="text-xs font-medium text-gray-800 text-center">{action.label}</p>
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
              Assistant Financier IA
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <p className="mb-4 text-sm">Analysez votre historique pour détecter des anomalies et obtenir des recommandations.</p>
            <Button variant="secondary" asChild><Link href="/dashboard/report">Générer un rapport</Link></Button>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
            <CardTitle className="font-headline flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Services Financiers
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-4 gap-x-4 gap-y-6 text-center">
              {financialServices.map(service => {
                const IconComponent = service.icon;
                return (
                  <Link href={service.href} key={service.label} className="flex flex-col items-center gap-3 text-sm font-medium text-foreground hover:text-primary transition-all group">
                    <div className={cn("flex h-14 w-14 items-center justify-center rounded-2xl", "bg-gradient-to-br from-muted to-muted/50", "group-hover:shadow-lg group-hover:scale-105 transition-all duration-300", "border border-transparent group-hover:border-primary/20")}>
                      <IconComponent size={32} />
                    </div>
                    <span className="text-center text-xs leading-tight">{service.label}</span>
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
              Factures et Services Partenaires
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {bills.map(bill => {
                const IconComponent = bill.icon;
                return (
                  <Link href={bill.href} key={bill.label} className={cn("flex flex-col items-center gap-2 rounded-xl p-4 text-center", "bg-gradient-to-br from-background to-muted/30", "border border-border/50 hover:border-primary/30", "text-sm font-medium text-foreground", "hover:shadow-md hover:scale-[1.02] transition-all duration-300", "group")}>
                    <div className="group-hover:scale-110 transition-transform duration-300">
                      <IconComponent size={36} />
                    </div>
                    <span className="text-center text-xs leading-tight">{bill.label}</span>
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

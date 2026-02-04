'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Scan, Mail, Phone, CreditCard as CreditCardIcon, Hash, Smartphone, QrCode, ArrowUpRight, ArrowDownLeft, Download, Share2, Wallet } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import DashboardHeader from "@/components/dashboard/dashboard-header";
import { SavingsIcon, CreditIcon, TontineIcon, ConversionIcon, ReferralIcon, AgentIcon, LinkAccountIcon, BonusIcon, TaxIcon, YangoIcon, WaterIcon, TvIcon, AcademicIcon, SchoolIcon, FlightIcon, HotelIcon, EventIcon, PhoneCreditIcon, InsuranceIcon, DonationIcon } from "@/components/icons/service-icons";
import { useUserProfile } from '@/hooks/useUserProfile';
import QRCodeLib from 'qrcode';

// Icônes personnalisées avec strokeWidth 2.5
const ScannerIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6">
    <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M3 12h18M9 3v18M15 3v18" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PayReceiveIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6">
    <path d="M7 16V4m0 12l-3-3m3 3l3-3M17 8v12m0-12l3 3m-3-3l-3 3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const RequestIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3v6M9 12h6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const WalletIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6">
    <path d="M21 12a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6zM3 6h18a2 2 0 0 1 2 2v1H1V8a2 2 0 0 1 2-2zm16 9h-1" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Actions rapides principales (3 boutons simples)
const quickActions = [
  { icon: PayReceiveIcon, label: 'Payer/Recevoir', href: '/dashboard/pay-receive', gradient: 'from-[#32BB78] to-[#2a9d63]' },
  { icon: RequestIcon, label: 'Envoi', href: '/dashboard/send', gradient: 'from-[#32BB78] to-[#2a9d63]' },
  { icon: WalletIcon, label: 'Portefeuille', href: '/dashboard/wallet', gradient: 'from-[#32BB78] to-[#2a9d63]' },
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
  { icon: FlightIcon, label: 'Billet d avion', href: '/dashboard/pay-bill?type=flight' },
  { icon: HotelIcon, label: 'Hôtel', href: '/dashboard/pay-bill?type=hotel' },
  { icon: EventIcon, label: 'Événements', href: '/dashboard/pay-bill?type=event' },
  { icon: PhoneCreditIcon, label: 'Crédit Téléphone', href: '/dashboard/pay-bill?type=phone' },
  { icon: InsuranceIcon, label: 'Assurance', href: '/dashboard/pay-bill?type=insurance' },
  { icon: DonationIcon, label: 'Donation', href: '/dashboard/pay-bill?type=donation' },
];

export default function MbongoDashboard() {
  const [qrCode, setQrCode] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const { profile } = useUserProfile();

  useEffect(() => {
    if (profile?.uid) {
      const hash = profile.uid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const accountNum = `ENK${String(hash).padStart(12, '0')}`;
      const fullName = profile.name || profile.fullName || 'eNkamba User';
      const email = profile.email || '';
      
      setAccountNumber(accountNum);

      const qrData = `${accountNum}|${fullName}|${email}`;

      QRCodeLib.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#32BB78',
          light: '#ffffff',
        },
      }).then(setQrCode);
    }
  }, [profile?.uid, profile?.name, profile?.fullName, profile?.email]);

  const handleDownloadQR = () => {
    if (!qrCode) return;
    const link = document.createElement('a');
    link.download = `enkamba-qr-${accountNumber}.png`;
    link.href = qrCode;
    link.click();
  };

  const handleShareQR = async () => {
    if (!qrCode) return;
    try {
      const blob = await (await fetch(qrCode)).blob();
      const file = new File([blob], `enkamba-qr-${accountNumber}.png`, { type: 'image/png' });
      
      if (navigator.share) {
        await navigator.share({
          title: 'Mon QR Code eNkamba',
          text: `Mon compte eNkamba: ${accountNumber}`,
          files: [file],
        });
      } else {
        handleDownloadQR();
      }
    } catch (error) {
      console.error('Erreur de partage:', error);
      handleDownloadQR();
    }
  };

  return (
    <>
      <DashboardHeader />
      <div className="container mx-auto max-w-4xl p-4 space-y-6 animate-in fade-in duration-500 pt-20">
        {/* Section QR Code */}
        <div className="grid grid-cols-1 gap-3">
          {/* QR Code */}
          <Card className="bg-gradient-to-br from-[#32BB78]/10 via-[#32BB78]/5 to-transparent border-[#32BB78]/20 overflow-hidden">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="relative group flex-shrink-0">
                  <div className="bg-white p-2 rounded-xl shadow-lg border-2 border-[#32BB78]/20 group-hover:border-[#32BB78]/40 transition-all duration-300">
                    {qrCode ? (
                      <img src={qrCode} alt="Mon QR Code" className="w-20 h-20" />
                    ) : (
                      <div className="w-20 h-20 bg-gray-100 rounded-lg animate-pulse" />
                    )}
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#32BB78] rounded-full flex items-center justify-center shadow-lg">
                    <QrCode className="w-2.5 h-2.5 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-xs text-foreground mb-0.5 truncate">Mon QR Code</h3>
                  <p className="text-[10px] text-muted-foreground mb-2 truncate">{accountNumber || 'Chargement...'}</p>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={handleDownloadQR} disabled={!qrCode} className="flex-1 h-7 text-[10px] px-2 border-[#32BB78]/30 hover:bg-[#32BB78]/10">
                      <Download className="w-3 h-3" />
                    </Button>
                    <Button size="sm" onClick={handleShareQR} disabled={!qrCode} className="flex-1 h-7 text-[10px] px-2 bg-[#32BB78] hover:bg-[#2a9d63]">
                      <Share2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Actions Rapides Principales */}
          <div className="grid grid-cols-3 gap-4 sm:gap-6">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.label} href={action.href}>
                  <div className="group flex flex-col items-center gap-3 text-center">
                    {/* Icon Container with Glow Effect */}
                    <div className="relative">
                      {/* Glow Effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[#32BB78]/40 to-[#2a9d63]/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Icon Background */}
                      <div className={`relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br ${action.gradient} shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
                        <Icon />
                      </div>
                    </div>
                    
                    {/* Label */}
                    <p className="text-xs font-semibold text-foreground group-hover:text-[#32BB78] transition-colors duration-300">{action.label}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

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

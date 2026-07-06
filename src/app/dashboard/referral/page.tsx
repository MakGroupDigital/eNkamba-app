
'use client';
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, QrCode, Users, Award, Loader2, Mail, ShieldCheck, Share2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import QRCode from 'qrcode';
import { useReferralCode } from '@/hooks/useReferralCode';

// Custom hook for WhatsApp and Telegram icons
const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
);
const TelegramIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M22 2 11 13H2l2.64-5.36L22 2zM22 2l-7 20-4-9-4-2 15-9z"></path></svg>
);

const ReferralGiftIcon = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
    <rect x="10" y="19" width="28" height="20" rx="6" fill="#009058" />
    <path d="M24 19v20M10 26h28" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.85" />
    <path d="M23 18c-7-1-10-5-8-8 3-4 8 1 8 8ZM25 18c7-1 10-5 8-8-3-4-8 1-8 8Z" fill="#FFA500" />
    <circle cx="36" cy="14" r="4" fill="#009058" />
  </svg>
);

const NetworkRewardIcon = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
    <circle cx="24" cy="14" r="6" fill="#009058" />
    <circle cx="14" cy="32" r="5" fill="#009058" />
    <circle cx="34" cy="32" r="5" fill="#FFA500" />
    <path d="M21 19l-5 8M27 19l5 8M19 32h10" stroke="#009058" strokeWidth="3" strokeLinecap="round" opacity="0.65" />
  </svg>
);

export default function ReferralPage() {
  const { toast } = useToast();
  const { referralCode, isLoading, getOrCreateReferralCode } = useReferralCode();
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [isLoadingQr, setIsLoadingQr] = useState(false);
  const referralLink = referralCode ? `https://enkamba.io/signup?ref=${referralCode}` : '';

  useEffect(() => {
    if (!isLoading && !referralCode) {
      getOrCreateReferralCode();
    }
  }, [getOrCreateReferralCode, isLoading, referralCode]);

  useEffect(() => {
    setQrCodeDataUrl('');
  }, [referralLink]);

  const handleCopy = (textToCopy: string, toastMessage: string) => {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    toast({
      title: "Copié !",
      description: toastMessage,
    });
  };

  const generateQrCode = async () => {
    if (!referralLink) return;
    setIsLoadingQr(true);
    try {
        const dataUrl = await QRCode.toDataURL(referralLink, {
            width: 200,
            margin: 2,
            color: { dark: '#009058', light: '#FFFFFF' }
        });
        setQrCodeDataUrl(dataUrl);
    } catch (err) {
        console.error("Failed to generate QR code", err);
        toast({
            variant: "destructive",
            title: "Erreur de QR Code",
            description: "Impossible de générer le QR code. Veuillez réessayer."
        })
    } finally {
        setIsLoadingQr(false);
    }
  };

  const handleShare = (platform: 'whatsapp' | 'telegram' | 'email') => {
    if (!referralCode || !referralLink) {
      toast({
        variant: "destructive",
        title: "Code indisponible",
        description: "Votre code de parrainage n'est pas encore prêt.",
      });
      return;
    }

    const text = `Rejoignez-moi sur eNkamba.io et bénéficiez d'avantages exclusifs ! Utilisez mon code de parrainage: ${referralCode} ou cliquez sur le lien: ${referralLink}`;
    let url = '';

    switch (platform) {
        case 'whatsapp':
            url = `https://wa.me/?text=${encodeURIComponent(text)}`;
            break;
        case 'telegram':
            url = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`;
            break;
        case 'email':
             url = `mailto:?subject=${encodeURIComponent("Invitation à rejoindre eNkamba.io")}&body=${encodeURIComponent(text)}`;
             break;
    }
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#f7faf8]">
    <div className="container mx-auto max-w-4xl p-3 space-y-4 animate-in fade-in duration-500 sm:p-4">
      <header className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#009058] to-[#009058] p-4 text-white shadow-lg shadow-[#009058]/20">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/16 ring-1 ring-white/25">
              <ReferralGiftIcon className="h-8 w-8" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/70">Invitation eNkamba</p>
              <h1 className="font-headline text-xl font-black text-white sm:text-2xl">
                Parrainage
              </h1>
              <p className="mt-1 max-w-xl text-xs leading-5 text-white/78 sm:text-sm">
                Partagez votre code réel, invitez vos proches et suivez les gains quand le suivi est connecté.
              </p>
            </div>
          </div>
          <Button
            className="hidden h-10 shrink-0 rounded-xl bg-white px-3 text-xs font-bold text-[#009058] hover:bg-white/90 sm:inline-flex"
            onClick={() => referralLink && handleCopy(referralLink, "Votre lien de partage a été copié.")}
            disabled={!referralLink}
          >
            <Share2 className="mr-1.5 h-4 w-4" />
            Copier le lien
          </Button>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Card className="overflow-hidden border-[#009058]/10 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-[#009058]">Amis Parrainés</CardTitle>
            <Users className="h-4 w-4 text-[#009058]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-[#009058]">Non disponible</div>
            <p className="text-xs text-muted-foreground">Aucune source réelle de filleuls connectée.</p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-[#009058]/10 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-[#009058]">Gains Totaux</CardTitle>
            <Award className="h-4 w-4 text-[#FFA500]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-[#009058]">Non disponible</div>
            <p className="text-xs text-muted-foreground">Aucun montant réel de bonus chargé.</p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Code and Link */}
      <Card className="overflow-hidden border-[#009058]/10 bg-white shadow-sm">
        <CardHeader className="border-b border-[#009058]/10 px-4 py-3">
          <CardTitle className="font-headline flex items-center gap-2 text-lg text-[#009058]">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#009058]/10">
              <NetworkRewardIcon className="h-6 w-6" />
            </span>
            Votre Code de Parrainage
          </CardTitle>
          <CardDescription>Partagez ce code avec vos amis. Ils obtiennent un bonus, et vous aussi !</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          <div>
            <label htmlFor="referral-code" className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Votre Code</label>
            <div className="flex gap-2 mt-1">
              <Input id="referral-code" value={isLoading ? 'Chargement...' : referralCode || ''} readOnly className="h-12 rounded-xl border-[#009058]/20 bg-[#f7faf8] font-mono text-lg font-black" />
              <Button size="icon" className="h-12 w-12 rounded-xl bg-[#009058] hover:bg-[#009058]" disabled={!referralCode} onClick={() => handleCopy(referralCode || '', "Votre code a été copié.")}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
           <div>
            <label htmlFor="referral-link" className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Votre Lien de Partage</label>
            <div className="flex gap-2 mt-1">
              <Input id="referral-link" value={referralLink} readOnly className="h-12 rounded-xl border-[#009058]/20 bg-[#f7faf8]" />
              <Button size="icon" className="h-12 w-12 rounded-xl bg-[#009058] hover:bg-[#009058]" disabled={!referralLink} onClick={() => handleCopy(referralLink, "Votre lien de partage a été copié.")}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-2 border-t border-[#009058]/10 px-4 py-3 sm:flex-row">
            <Button className="w-full rounded-xl bg-[#009058] hover:bg-[#009058] sm:w-auto" onClick={() => handleShare('whatsapp')}><WhatsAppIcon/> Partager sur WhatsApp</Button>
            <Button className="w-full rounded-xl border-[#009058]/20 text-[#009058] hover:bg-[#009058]/5 sm:w-auto" variant="outline" onClick={() => handleShare('telegram')}><TelegramIcon/> Partager sur Telegram</Button>
            <Button className="w-full rounded-xl border-[#009058]/20 text-[#009058] hover:bg-[#009058]/5 sm:w-auto" variant="outline" onClick={() => handleShare('email')}><Mail className="h-4 w-4"/> Partager par e-mail</Button>
        </CardFooter>
      </Card>

      {/* QR Code */}
      <Card className="overflow-hidden border-[#009058]/10 bg-white shadow-sm">
        <CardHeader className="border-b border-[#009058]/10 px-4 py-3">
          <CardTitle className="font-headline flex items-center gap-2 text-lg text-[#009058]">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#009058]/10">
              <QrCode className="h-5 w-5 text-[#009058]" />
            </span>
            Partage par QR Code
          </CardTitle>
          <CardDescription>Vos amis peuvent scanner ce code pour s'inscrire directement avec votre parrainage.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-4 p-4 text-center">
          {qrCodeDataUrl ? (
            <img src={qrCodeDataUrl} alt="QR Code de parrainage" className="rounded-2xl border border-[#009058]/20 bg-white p-2 shadow-sm" />
          ) : (
            <div className="flex h-[200px] w-[200px] items-center justify-center rounded-2xl border-2 border-dashed border-[#009058]/25 bg-[#f7faf8]">
              <p className="text-sm text-muted-foreground">Cliquez pour générer</p>
            </div>
          )}
          <Button onClick={generateQrCode} disabled={isLoadingQr || !referralLink} className="rounded-xl bg-[#009058] hover:bg-[#009058]">
            {isLoadingQr ? <Loader2 className="animate-spin" /> : (qrCodeDataUrl ? "Regénérer le QR Code" : "Générer le QR Code")}
          </Button>
          <div className="flex items-center gap-2 rounded-full bg-[#009058]/10 px-3 py-1 text-xs font-semibold text-[#009058]">
            <ShieldCheck className="h-3.5 w-3.5 text-[#009058]" />
            Code généré localement, sans statistique fictive
          </div>
        </CardContent>
      </Card>
    </div>
    </div>
  );
}


'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gift, Copy, Share2, QrCode, Users, Award, Loader2, Mail, Send } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import QRCode from 'qrcode';

// Custom hook for WhatsApp and Telegram icons
const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
);
const TelegramIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M22 2 11 13H2l2.64-5.36L22 2zM22 2l-7 20-4-9-4-2 15-9z"></path></svg>
);


export default function ReferralPage() {
  const { toast } = useToast();
  const referralCode = "ENKAMBA-A4B8C";
  const referralLink = `https://enkamba.io/signup?ref=${referralCode}`;
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [isLoadingQr, setIsLoadingQr] = useState(false);

  const handleCopy = (textToCopy: string, toastMessage: string) => {
    navigator.clipboard.writeText(textToCopy);
    toast({
      title: "Copié !",
      description: toastMessage,
    });
  };
  
  const generateQrCode = async () => {
    setIsLoadingQr(true);
    try {
        const dataUrl = await QRCode.toDataURL(referralLink, { 
            width: 200, 
            margin: 2, 
            color: { dark: '#0E5A59', light: '#FFFFFF' } 
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
    <div className="container mx-auto max-w-4xl p-4 space-y-6 animate-in fade-in duration-500">
      <header className="flex items-center gap-2">
        <Gift className="h-6 w-6 text-primary" />
        <h1 className="font-headline text-xl font-bold text-primary">
          Parrainage
        </h1>
      </header>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Amis Parrainés</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+2 ce mois-ci</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Gains Totaux</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+75.00$</div>
            <p className="text-xs text-muted-foreground">Bonus de parrainage cumulés</p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Code and Link */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Votre Code de Parrainage</CardTitle>
          <CardDescription>Partagez ce code avec vos amis. Ils obtiennent un bonus, et vous aussi !</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="referral-code" className="text-sm font-medium">Votre Code</label>
            <div className="flex gap-2 mt-1">
              <Input id="referral-code" value={referralCode} readOnly className="font-mono text-lg h-12" />
              <Button size="icon" className="h-12 w-12" onClick={() => handleCopy(referralCode, "Votre code a été copié.")}>
                <Copy />
              </Button>
            </div>
          </div>
           <div>
            <label htmlFor="referral-link" className="text-sm font-medium">Votre Lien de Partage</label>
            <div className="flex gap-2 mt-1">
              <Input id="referral-link" value={referralLink} readOnly className="h-12" />
              <Button size="icon" className="h-12 w-12" onClick={() => handleCopy(referralLink, "Votre lien de partage a été copié.")}>
                <Copy />
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row items-center gap-2">
            <Button className="w-full sm:w-auto" onClick={() => handleShare('whatsapp')}><WhatsAppIcon/> Partager sur WhatsApp</Button>
            <Button className="w-full sm:w-auto" variant="outline" onClick={() => handleShare('telegram')}><TelegramIcon/> Partager sur Telegram</Button>
            <Button className="w-full sm:w-auto" variant="outline" onClick={() => handleShare('email')}><Mail/> Partager par e-mail</Button>
        </CardFooter>
      </Card>
      
      {/* QR Code */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <QrCode /> Partage par QR Code
          </CardTitle>
          <CardDescription>Vos amis peuvent scanner ce code pour s'inscrire directement avec votre parrainage.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-4 text-center">
          {qrCodeDataUrl ? (
            <img src={qrCodeDataUrl} alt="QR Code de parrainage" className="rounded-lg border p-2" />
          ) : (
            <div className="h-[200px] w-[200px] bg-muted rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground text-sm">Cliquez pour générer</p>
            </div>
          )}
          <Button onClick={generateQrCode} disabled={isLoadingQr}>
            {isLoadingQr ? <Loader2 className="animate-spin" /> : (qrCodeDataUrl ? "Regénérer le QR Code" : "Générer le QR Code")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

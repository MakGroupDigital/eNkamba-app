'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Loader2, Copy, Share2, QrCode, Link as LinkIcon, Zap, CheckCircle2, Download, Wifi, Bluetooth, AlertTriangle } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import QRCode from 'qrcode';
import Image from 'next/image';

type ReceiveMethod = 'link' | 'qr' | 'phone' | 'code' | 'nfc' | 'bluetooth' | 'wifi' | null;

interface PaymentLink {
  id: string;
  code: string;
  amount?: number;
  description?: string;
  expiresAt?: string;
  url: string;
  qrCode?: string;
}

interface UnifiedReceiveFlowProps {
  context?: string;
  onSuccess?: (linkId: string) => void;
  onError?: (error: Error) => void;
  onBack?: () => void;
}

export function UnifiedReceiveFlow({
  context = 'wallet',
  onSuccess,
  onError,
  onBack,
}: UnifiedReceiveFlowProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile } = useUserProfile();

  const [step, setStep] = useState<'method' | 'details' | 'generated'>('method');
  const [receiveMethod, setReceiveMethod] = useState<ReceiveMethod>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [paymentLink, setPaymentLink] = useState<PaymentLink | null>(null);
  const [qrCodeImage, setQrCodeImage] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [nfcSupported, setNfcSupported] = useState(false);
  const [bluetoothSupported, setBluetoothSupported] = useState(false);
  const [codeTimeLeft, setCodeTimeLeft] = useState(300);

  const handleMethodSelect = (method: ReceiveMethod) => {
    setReceiveMethod(method);
    setStep('details');
  };

  useEffect(() => {
    if ('NDEFReader' in window) {
      setNfcSupported(true);
    }
    if ('bluetooth' in navigator) {
      setBluetoothSupported(true);
    }
  }, []);

  const generatePaymentLink = async () => {
    if (!user) return;

    setIsGenerating(true);
    try {
      const createLinkFn = httpsCallable(functions, 'createPaymentLink');
      const result = await createLinkFn({
        userId: user.uid,
        amount: amount ? parseFloat(amount) : undefined,
        description: description || undefined,
        method: receiveMethod,
        context,
      });

      const data = result.data as any;

      if (data.success) {
        const link: PaymentLink = {
          id: data.linkId,
          code: data.code,
          amount: amount ? parseFloat(amount) : undefined,
          description,
          url: `https://enkamba.io/pay/${data.code}`,
          qrCode: data.qrCode,
        };

        setPaymentLink(link);

        if (receiveMethod === 'qr' || receiveMethod === 'link') {
          const qrImage = await QRCode.toDataURL(link.url, {
            width: 300,
            margin: 2,
            color: {
              dark: '#32BB78',
              light: '#ffffff',
            },
          });
          setQrCodeImage(qrImage);
        }

        if (receiveMethod === 'code') {
          setCodeTimeLeft(300);
        }

        setStep('generated');

        toast({
          title: 'Succès',
          description: `${receiveMethod === 'code' ? 'Code unique généré' : 'Lien d\'encaissement généré'} avec succès`,
          className: 'bg-green-600 text-white border-none',
        });

        if (onSuccess) {
          onSuccess(data.linkId);
        }
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Erreur lors de la génération',
      });
      if (onError) {
        onError(error);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (step === 'generated' && receiveMethod === 'code' && codeTimeLeft > 0) {
      const timer = setTimeout(() => setCodeTimeLeft(codeTimeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [codeTimeLeft, step, receiveMethod]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'Copié',
      description: 'Lien copié dans le presse-papiers',
    });
  };

  const shareLink = async () => {
    if (!paymentLink) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Paiement eNkamba',
          text: `Payez ${amount ? amount + ' CDF' : 'un montant'} à ${profile?.fullName}`,
          url: paymentLink.url,
        });
      } catch (error) {
        console.log('Partage annulé');
      }
    } else {
      copyToClipboard(paymentLink.url);
    }
  };

  const downloadQR = async () => {
    if (!qrCodeImage) return;

    const link = document.createElement('a');
    link.href = qrCodeImage;
    link.download = `payment-qr-${paymentLink?.code}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Succès',
      description: 'Code QR téléchargé',
    });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Step 1: Method Selection */}
      {step === 'method' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card
            className="cursor-pointer border-2 hover:border-[#32BB78] transition-colors"
            onClick={() => handleMethodSelect('link')}
          >
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="p-4 rounded-full bg-[#32BB78]/20">
                  <LinkIcon className="w-8 h-8 text-[#32BB78]" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Lien de Paiement</h3>
                  <p className="text-sm text-muted-foreground">Partagez un lien unique</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer border-2 hover:border-[#32BB78] transition-colors"
            onClick={() => handleMethodSelect('qr')}
          >
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="p-4 rounded-full bg-[#32BB78]/20">
                  <QrCode className="w-8 h-8 text-[#32BB78]" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Code QR</h3>
                  <p className="text-sm text-muted-foreground">Scannez pour payer</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer border-2 hover:border-[#32BB78] transition-colors"
            onClick={() => handleMethodSelect('code')}
          >
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="p-4 rounded-full bg-[#32BB78]/20">
                  <Zap className="w-8 h-8 text-[#32BB78]" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Code Unique</h3>
                  <p className="text-sm text-muted-foreground">Code à 6 chiffres</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer border-2 hover:border-[#32BB78] transition-colors"
            onClick={() => handleMethodSelect('bluetooth')}
          >
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="p-4 rounded-full bg-[#32BB78]/20">
                  <Bluetooth className="w-8 h-8 text-[#32BB78]" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Paiement Bluetooth</h3>
                  <p className="text-sm text-muted-foreground">Proximité sans fil</p>
                </div>
                {!bluetoothSupported && (
                  <div className="text-xs text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Non supporté
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer border-2 hover:border-[#32BB78] transition-colors"
            onClick={() => handleMethodSelect('nfc')}
          >
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="p-4 rounded-full bg-[#32BB78]/20">
                  <Wifi className="w-8 h-8 text-[#32BB78]" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Paiement NFC</h3>
                  <p className="text-sm text-muted-foreground">Technologie sans contact</p>
                </div>
                {!nfcSupported && (
                  <div className="text-xs text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Non supporté
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer border-2 hover:border-[#32BB78] transition-colors"
            onClick={() => handleMethodSelect('wifi')}
          >
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="p-4 rounded-full bg-[#32BB78]/20">
                  <Wifi className="w-8 h-8 text-[#32BB78]" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Paiement WiFi</h3>
                  <p className="text-sm text-muted-foreground">Connexion locale</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Details */}
      {step === 'details' && (
        <Card>
          <CardHeader>
            <CardTitle>
              {receiveMethod === 'link' && 'Lien de Paiement'}
              {receiveMethod === 'qr' && 'Code QR'}
              {receiveMethod === 'code' && 'Code Unique (6 chiffres)'}
              {receiveMethod === 'nfc' && 'Paiement NFC'}
              {receiveMethod === 'bluetooth' && 'Paiement Bluetooth'}
              {receiveMethod === 'wifi' && 'Paiement WiFi'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Montant (optionnel)</label>
              <Input
                type="number"
                placeholder="Laissez vide pour montant flexible"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-lg"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Description (optionnel)</label>
              <Input
                type="text"
                placeholder="Ex: Paiement de facture, Partage de frais..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <p>
                {receiveMethod === 'link' && '✓ Partagez le lien par email, SMS ou messagerie'}
                {receiveMethod === 'qr' && '✓ Affichez le code QR pour que les autres le scannent'}
                {receiveMethod === 'code' && '✓ Partagez le code à 6 chiffres (valide 5 minutes)'}
                {receiveMethod === 'nfc' && '✓ Utilisez la technologie NFC pour les paiements rapides'}
                {receiveMethod === 'bluetooth' && '✓ Approchez deux téléphones pour recevoir'}
                {receiveMethod === 'wifi' && '✓ Connectez-vous au même réseau WiFi'}
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setStep('method');
                  setAmount('');
                  setDescription('');
                  if (onBack) onBack();
                }}
                className="flex-1"
              >
                Retour
              </Button>
              <Button
                onClick={generatePaymentLink}
                disabled={isGenerating}
                className="flex-1 bg-[#32BB78] hover:bg-[#2a9d63]"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Génération...
                  </>
                ) : (
                  'Générer'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Generated */}
      {step === 'generated' && paymentLink && (
        <div className="space-y-4">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900">Généré avec succès!</p>
                  <p className="text-sm text-green-700">Prêt à recevoir des paiements</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {(receiveMethod === 'qr' || receiveMethod === 'link') && qrCodeImage && (
            <Card>
              <CardHeader>
                <CardTitle>Code QR</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center">
                  <Image
                    src={qrCodeImage}
                    alt="Payment QR Code"
                    width={300}
                    height={300}
                    className="border-4 border-[#32BB78] rounded-lg"
                  />
                </div>
                <Button
                  onClick={downloadQR}
                  className="w-full bg-[#32BB78] hover:bg-[#2a9d63]"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger le Code QR
                </Button>
              </CardContent>
            </Card>
          )}

          {receiveMethod === 'link' && (
            <Card>
              <CardHeader>
                <CardTitle>Lien de Paiement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-4 rounded-lg break-all font-mono text-sm">
                  {paymentLink.url}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => copyToClipboard(paymentLink.url)}
                    variant="outline"
                    className="flex-1"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    {copied ? 'Copié!' : 'Copier'}
                  </Button>
                  <Button
                    onClick={shareLink}
                    className="flex-1 bg-[#32BB78] hover:bg-[#2a9d63]"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Partager
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {receiveMethod === 'code' && (
            <Card>
              <CardHeader>
                <CardTitle>Code Unique - Valide 5 minutes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gradient-to-r from-[#32BB78] to-[#2a9d63] p-8 rounded-lg text-center">
                  <p className="text-white text-sm mb-2">Votre code unique</p>
                  <p className="text-white text-5xl font-bold font-mono tracking-widest mb-4">
                    {paymentLink.code}
                  </p>
                  <div className="flex items-center justify-center gap-2 text-white">
                    <div className="w-3 h-3 rounded-full bg-white/80 animate-pulse"></div>
                    <p className="text-sm font-semibold">
                      Expire dans {Math.floor(codeTimeLeft / 60)}:{String(codeTimeLeft % 60).padStart(2, '0')}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => copyToClipboard(paymentLink.code)}
                  className="w-full bg-[#32BB78] hover:bg-[#2a9d63]"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copier le Code
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Détails</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Montant</span>
                <span className="font-semibold">
                  {amount ? `${parseFloat(amount).toLocaleString('fr-FR')} CDF` : 'Flexible'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Description</span>
                <span className="font-semibold">{description || 'Aucune'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Code</span>
                <span className="font-mono font-semibold">{paymentLink.code}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

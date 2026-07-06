'use client';

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import {
  Camera,
  Copy,
  Download,
  Loader2,
  QrCode,
  Send,
  Share2,
  Wallet,
} from 'lucide-react';
import QRCodeLib from 'qrcode';
import jsQR from 'jsqr';
import { useSearchParams } from 'next/navigation';

import { AgentOpsShell } from '@/components/agent-relay/AgentOpsShell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useMoneyTransfer } from '@/hooks/useMoneyTransfer';
import { PinVerification } from '@/components/payment/PinVerification';

type Currency = 'CDF' | 'USD' | 'EUR';

type ScannedQRData = {
  accountNumber: string;
  fullName: string;
  email?: string;
  uid?: string;
  isValid: boolean;
};

const buildAccountNumber = (uid: string) => {
  const hash = uid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return `ENK${String(hash).padStart(12, '0')}`;
};

const parseQRData = (data: string): ScannedQRData | null => {
  if (!data.startsWith('ENK')) return null;
  const parts = data.split('|');
  if (parts.length < 2) return null;
  return {
    accountNumber: parts[0],
    fullName: parts[1],
    email: parts[2] || undefined,
    uid: parts[3] || undefined,
    isValid: true,
  };
};

export default function AgentOpsCollectPage() {
  const searchParams = useSearchParams();
  const defaultMode = searchParams?.get('mode') === 'scan' ? 'scan' : 'receive';

  const { toast } = useToast();
  const { profile } = useUserProfile();
  const { sendMoney, isProcessing, balance } = useMoneyTransfer();

  const [activeTab, setActiveTab] = useState<'receive' | 'scan'>(defaultMode);
  const [qrCode, setQrCode] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanned, setScanned] = useState<ScannedQRData | null>(null);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('CDF');
  const [showPinDialog, setShowPinDialog] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const accountNumber = useMemo(() => {
    if (!profile?.uid) return '';
    return buildAccountNumber(profile.uid);
  }, [profile?.uid]);

  const ownerName = useMemo(() => profile?.name || profile?.fullName || 'Agent', [profile?.name, profile?.fullName]);
  const ownerEmail = useMemo(() => profile?.email || '', [profile?.email]);

  useEffect(() => {
    const run = async () => {
      if (!profile?.uid) return;
      setIsGenerating(true);
      try {
        const qrData = `${accountNumber}|${ownerName}|${ownerEmail}|${profile.uid}`;
        const dataUrl = await QRCodeLib.toDataURL(qrData, {
          width: 320,
          margin: 2,
          color: { dark: '#0A8B46', light: '#ffffff' },
        });
        setQrCode(dataUrl);
      } catch (err) {
        console.error('Erreur génération QR:', err);
        toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de générer le QR code.' });
      } finally {
        setIsGenerating(false);
      }
    };

    void run();
  }, [accountNumber, ownerEmail, ownerName, profile?.uid, toast]);

  const copyText = (value: string) => {
    navigator.clipboard.writeText(value);
    toast({ title: 'Copié', description: 'Copié dans le presse‑papiers.' });
  };

  const downloadQr = () => {
    if (!qrCode) return;
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = 'enkamba-agent-qr.png';
    link.click();
  };

  const shareQr = async () => {
    if (!qrCode) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'QR eNkamba (Agent)',
          text: 'Scannez ce QR pour encaisser sur mon compte eNkamba.',
        });
      } catch {
        // ignore
      }
    } else {
      copyText(accountNumber);
    }
  };

  const stopScan = () => {
    setIsScanning(false);
    setScanError(null);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    const video = videoRef.current;
    if (video?.srcObject) {
      (video.srcObject as MediaStream).getTracks().forEach((track) => track.stop());
      video.srcObject = null;
    }
  };

  const scanLoop = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const tick = () => {
      if (!isScanning) return;
      if (video.readyState >= 2) {
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, canvas.width, canvas.height);
        if (code) {
          const parsed = parseQRData(code.data);
          if (parsed?.isValid) {
            setScanned(parsed);
            toast({ title: 'QR scanné', description: parsed.fullName });
            stopScan();
            return;
          }
        }
      }
      animationFrameRef.current = requestAnimationFrame(tick);
    };

    tick();
  };

  const startScan = async () => {
    setScanError(null);
    setScanned(null);
    setIsScanning(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      const video = videoRef.current;
      if (!video) return;

      video.srcObject = stream;
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.autoplay = true;

      await video.play();
      scanLoop();
    } catch (err) {
      console.error('Erreur caméra scan:', err);
      setScanError('Accès caméra refusé ou indisponible.');
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'scan') {
      stopScan();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const confirmPay = () => {
    if (!scanned?.uid) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'QR invalide (UID manquant).' });
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast({ variant: 'destructive', title: 'Montant invalide', description: 'Entrez un montant.' });
      return;
    }
    setShowPinDialog(true);
  };

  const handlePay = async () => {
    if (!scanned?.uid) return;
    const ok = await sendMoney({
      amount: Number(amount),
      senderCurrency: currency,
      transferMethod: 'account',
      recipientId: scanned.uid,
      description: `Paiement agent vers ${scanned.fullName}`,
    });
    setShowPinDialog(false);
    if (ok) {
      setScanned(null);
      setAmount('');
      toast({ title: 'Paiement réussi', description: 'Transaction effectuée.' });
    }
  };

  return (
    <AgentOpsShell title="Encaisser" subtitle="Deux méthodes: QR à présenter ou scanner un QR.">
      <div className="space-y-4">
        <Card className="rounded-2xl border border-gray-200 overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm text-gray-500">Solde</div>
                <div className="text-2xl font-bold text-gray-900 tabular-nums">
                  {balance.toLocaleString('fr-FR')} CDF
                </div>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-[#0A8B46]/10 flex items-center justify-center">
                <Wallet className="text-[#0A8B46]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'receive' | 'scan')}>
          <TabsList className="grid w-full grid-cols-2 rounded-xl">
            <TabsTrigger value="receive" className="rounded-lg">
              Présenter QR
            </TabsTrigger>
            <TabsTrigger value="scan" className="rounded-lg">
              Scanner QR
            </TabsTrigger>
          </TabsList>

          <TabsContent value="receive">
            <Card className="rounded-2xl border border-gray-200">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-gray-100 flex items-center justify-center">
                      <Image src="/enkamba-logo.png" alt="eNkamba" width={32} height={32} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">{ownerName}</div>
                      <div className="text-xs text-gray-500 font-mono truncate">{accountNumber}</div>
                    </div>
                  </div>
                  <Button variant="outline" className="rounded-xl" onClick={() => copyText(accountNumber)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copier
                  </Button>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4 flex items-center justify-center">
                  {isGenerating ? (
                    <div className="text-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin text-[#0A8B46] mx-auto mb-2" />
                      <div className="text-sm text-gray-600">Génération du QR...</div>
                    </div>
                  ) : qrCode ? (
                    <img src={qrCode} alt="QR code" className="w-64 h-64" />
                  ) : (
                    <div className="text-sm text-gray-600">QR indisponible</div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button onClick={downloadQr} variant="outline" className="h-12 rounded-xl">
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger
                  </Button>
                  <Button onClick={shareQr} className="h-12 rounded-xl bg-[#0A8B46] hover:bg-[#0A8B46] text-white">
                    <Share2 className="h-4 w-4 mr-2" />
                    Partager
                  </Button>
                </div>

                <div className="text-xs text-gray-500">
                  Astuce: demande au client de scanner ce QR depuis eNkamba pour te payer.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scan">
            <Card className="rounded-2xl border border-gray-200">
              <CardContent className="p-5 space-y-4">
                {!isScanning && !scanned && (
                  <Button
                    onClick={startScan}
                    className="w-full h-12 rounded-xl bg-[#0A8B46] hover:bg-[#0A8B46] text-white"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Démarrer le scan
                  </Button>
                )}

                {scanError && <div className="text-sm text-red-600">{scanError}</div>}

                {isScanning && (
                  <div className="space-y-3">
                    <div className="relative w-full overflow-hidden rounded-2xl bg-black">
                      <video ref={videoRef} className="w-full h-auto min-h-[280px] object-cover" muted playsInline />
                      <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
                        <QrCode className="h-4 w-4" />
                        Scan en cours...
                      </div>
                    </div>
                    <canvas ref={canvasRef} className="hidden" />
                    <Button variant="outline" className="w-full h-12 rounded-xl" onClick={stopScan}>
                      Arrêter
                    </Button>
                  </div>
                )}

                {scanned && (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      <div className="text-sm text-gray-500">Scanné</div>
                      <div className="text-lg font-semibold text-gray-900">{scanned.fullName}</div>
                      <div className="text-xs text-gray-500 font-mono">{scanned.accountNumber}</div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="amount">Montant</Label>
                      <Input
                        id="amount"
                        inputMode="decimal"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
                        placeholder="Ex: 5000"
                        className="h-12 rounded-xl"
                      />
                      <div className="text-xs text-gray-500">Devise: {currency}</div>
                    </div>

                    <Button
                      onClick={confirmPay}
                      disabled={isProcessing}
                      className="w-full h-12 rounded-xl bg-[#0A8B46] hover:bg-[#0A8B46] text-white"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Payer
                    </Button>

                    <Button variant="outline" className="w-full h-12 rounded-xl" onClick={() => setScanned(null)}>
                      Scanner un autre
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <PinVerification
          isOpen={showPinDialog}
          onClose={() => setShowPinDialog(false)}
          onSuccess={handlePay}
          paymentDetails={
            scanned
              ? {
                  recipient: scanned.fullName,
                  amount: amount || '0',
                  currency,
                }
              : undefined
          }
        />
      </div>
    </AgentOpsShell>
  );
}


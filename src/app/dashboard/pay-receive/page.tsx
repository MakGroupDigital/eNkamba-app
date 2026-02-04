'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, QrCode, Mail, Phone, CreditCard, Hash, Download, Share2,
  AlertCircle, Loader2, User, Upload
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/hooks/use-toast';
import QRCodeLib from 'qrcode';
import jsQR from 'jsqr';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Currency = 'CDF' | 'USD' | 'EUR';

interface ScannedQRData {
  accountNumber: string;
  fullName: string;
  email?: string;
  isValid: boolean;
}

export default function PayReceivePage() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { toast } = useToast();
  
  const [mode, setMode] = useState<'receive' | 'pay' | 'scanner' | 'payment-method'>('receive');
  const [payMethod, setPayMethod] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [accountName, setAccountName] = useState<string>('');
  const [scannedData, setScannedData] = useState<ScannedQRData | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importedImageData, setImportedImageData] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentCurrency, setPaymentCurrency] = useState<Currency>('CDF');
  const [paymentDestination, setPaymentDestination] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (profile?.uid) {
      const hash = profile.uid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const accountNum = `ENK${String(hash).padStart(12, '0')}`;
      const fullName = profile.name || profile.fullName || 'eNkamba User';
      const email = profile.email || '';
      
      setAccountNumber(accountNum);
      setAccountName(fullName);

      const qrData = `${accountNum}|${fullName}|${email}`;
      
      QRCodeLib.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: { dark: '#32BB78', light: '#ffffff' },
      }).then(setQrCode);
    }
  }, [profile?.uid, profile?.name, profile?.fullName, profile?.email]);

  useEffect(() => {
    if (mode !== 'scanner' || !isScanning) return;

    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => scanQRFromVideo();
        }
      } catch (error) {
        setHasCameraPermission(false);
        setScanError('Accès caméra refusé.');
      }
    };

    getCameraPermission();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [mode, isScanning]);

  const parseQRData = (data: string): ScannedQRData | null => {
    try {
      if (data.startsWith('ENK')) {
        const parts = data.split('|');
        if (parts.length >= 2) {
          return {
            accountNumber: parts[0],
            fullName: parts[1],
            email: parts[2] || undefined,
            isValid: true,
          };
        }
        return {
          accountNumber: parts[0],
          fullName: 'Compte eNkamba',
          isValid: true,
        };
      }
      return { accountNumber: data, fullName: 'QR code invalide', isValid: false };
    } catch (error) {
      return null;
    }
  };

  const scanQRFromVideo = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(scanQRFromVideo);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, canvas.width, canvas.height);

    if (code) {
      const qrData = parseQRData(code.data);
      if (qrData?.isValid) {
        setScannedData(qrData);
        setIsScanning(false);
        setScanError(null);
        setPaymentDestination(qrData.accountNumber);
        toast({ title: 'QR Code Détecté ✅', description: `Destinataire: ${qrData.fullName}` });
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanQRFromVideo);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageDataUrl = e.target?.result as string;
      setImportedImageData(imageDataUrl);
      setIsImporting(true);
      setImportProgress(0);

      const progressInterval = setInterval(() => {
        setImportProgress(prev => (prev >= 85 ? prev : prev + Math.random() * 25));
      }, 100);

      setTimeout(() => {
        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current;
          if (!canvas || !canvas.getContext('2d')) return;

          const ctx = canvas.getContext('2d')!;
          let width = img.width, height = img.height;
          const maxSize = 500;
          if (width > maxSize || height > maxSize) {
            const ratio = Math.min(maxSize / width, maxSize / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          let imageData = ctx.getImageData(0, 0, width, height);
          let code = jsQR(imageData.data, width, height);

          if (!code) {
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
              const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
              const bw = gray > 128 ? 255 : 0;
              data[i] = data[i + 1] = data[i + 2] = bw;
            }
            ctx.putImageData(imageData, 0, 0);
            code = jsQR(data, width, height);
          }

          setImportProgress(100);

          if (code) {
            const qrData = parseQRData(code.data);
            if (qrData?.isValid) {
              setScannedData(qrData);
              setPaymentDestination(qrData.accountNumber);
            }
          }

          setTimeout(() => {
            setIsImporting(false);
            setImportedImageData(null);
          }, 500);
        };
        img.src = imageDataUrl;
      }, 1000);
    };
    reader.readAsDataURL(file);
  };

  const downloadQRCode = async () => {
    if (!qrCode) return;
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `eNkamba-QR-${accountNumber}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'QR Code Téléchargé ✅' });
  };

  const shareQRCode = async () => {
    if (!qrCode) return;
    if (navigator.share) {
      navigator.share({
        title: 'Mon QR Code eNkamba',
        text: `Envoyez-moi de l\'argent via eNkamba. Compte: ${accountNumber}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(accountNumber);
      toast({ title: 'Compte copié dans le presse-papiers' });
    }
  };

  const handlePayment = async () => {
    if (!paymentDestination || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs.',
      });
      return;
    }

    setIsPaying(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsPaying(false);

    toast({
      title: 'Paiement réussi ! ✅',
      description: `${paymentAmount} ${paymentCurrency} envoyé à ${scannedData?.fullName || paymentDestination}`,
    });

    setMode('receive');
    setScannedData(null);
    setPaymentDestination('');
    setPaymentAmount('');
  };

  if (!user) return null;

  return (
    <div className="container mx-auto max-w-md p-4 flex flex-col min-h-screen bg-muted/20">
      <style>{`
        @keyframes scanLine {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>

      <header className="flex items-center gap-4 mb-4 pt-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/mbongo-dashboard">
            <ArrowLeft />
          </Link>
        </Button>
        <h1 className="font-headline text-xl font-bold text-primary">
          {mode === 'receive' ? 'Recevoir de l\'argent' : 'Scanner QR'}
        </h1>
      </header>

      <Card className="flex-1 flex flex-col">
        <CardContent className="p-4 flex-1 flex flex-col items-center justify-center gap-4">
          <canvas ref={canvasRef} className="hidden" />

          {mode === 'receive' && (
            <>
              <div className="w-full max-w-sm space-y-4">
                <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-2xl p-6 flex flex-col items-center gap-4">
                  <h3 className="font-bold text-lg">Votre QR Code eNkamba</h3>
                  {qrCode && (
                    <div className="bg-white p-4 rounded-2xl shadow-lg border-2 border-blue-500/20">
                      <img src={qrCode} alt="Mon QR Code" className="w-40 h-40" />
                    </div>
                  )}
                  <div className="text-center text-sm">
                    <p className="font-semibold text-primary">{accountName}</p>
                    <p className="text-muted-foreground">{accountNumber}</p>
                  </div>

                  <div className="flex gap-2 w-full">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={downloadQRCode}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Télécharger
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={shareQRCode}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Partager
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    Les gens peuvent scanner ce code pour vous envoyer de l'argent
                  </p>
                </div>

                <Button 
                  className="w-full bg-gradient-to-r from-primary to-green-800 hover:from-primary/90 hover:to-green-800/90 h-12 text-base font-bold"
                  onClick={() => setMode('scanner')}
                >
                  Payer quelqu'un
                </Button>
              </div>
            </>
          )}

          {mode === 'scanner' && !scannedData && (
            <div className="w-full max-w-sm space-y-4">
              {isImporting && importedImageData ? (
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-2xl bg-white flex items-center justify-center">
                  <img 
                    src={importedImageData} 
                    alt="Imported QR" 
                    className="w-full h-full object-contain p-2 bg-white"
                  />
                  <div className="absolute inset-0 bg-black/30">
                    <div 
                      className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#32BB78] to-transparent shadow-lg shadow-[#32BB78]"
                      style={{ top: `${importProgress}%`, transition: 'top 0.1s linear' }}
                    />
                  </div>
                </div>
              ) : (
                <div className="relative w-full aspect-square bg-black rounded-2xl overflow-hidden shadow-lg">
                  <video 
                    ref={videoRef} 
                    className="w-full h-full object-cover" 
                    autoPlay 
                    playsInline 
                    muted 
                  />
                  {hasCameraPermission === false && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-4">
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Accès Caméra Requis</AlertTitle>
                        <AlertDescription>Veuillez autoriser l'accès à la caméra.</AlertDescription>
                      </Alert>
                    </div>
                  )}
                  {isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-3/4 h-3/4 border-4 border-dashed border-green-500/70 rounded-2xl animate-pulse" />
                    </div>
                  )}
                  {isScanning && (
                    <div className="absolute bottom-4 left-0 right-0 text-center text-white text-xs">
                      <p className="animate-pulse">🔍 Recherche de QR Code...</p>
                    </div>
                  )}
                </div>
              )}

              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
              >
                <Upload className="mr-2" />
                {isImporting ? 'Scan en cours...' : 'Importer une Image'}
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/png, image/jpeg"
                onChange={handleFileChange}
              />

              <div className="border-t pt-4">
                <p className="text-sm text-center text-muted-foreground mb-3">QR code introuvable ?</p>
                <div className="space-y-2">
                  {[
                    { id: 'account', icon: Hash, label: 'Numéro de Compte' },
                    { id: 'phone', icon: Phone, label: 'Numéro de Téléphone' },
                    { id: 'card', icon: CreditCard, label: 'Numéro de Carte' },
                    { id: 'email', icon: Mail, label: 'Adresse Email' },
                  ].map(({ id, icon: Icon, label }) => (
                    <Button
                      key={id}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        setPayMethod(id);
                        setMode('payment-method');
                      }}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => {
                  setMode('receive');
                  setIsScanning(true);
                }}
              >
                Retour
              </Button>
            </div>
          )}

          {mode === 'payment-method' && !scannedData && (
            <div className="w-full max-w-sm space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <Label className="text-base font-bold">Entrez le {payMethod === 'account' ? 'numéro de compte' : payMethod === 'phone' ? 'numéro de téléphone' : payMethod === 'card' ? 'numéro de carte' : 'email'}</Label>
                <Input
                  placeholder={payMethod === 'account' ? 'ENK000000000000' : payMethod === 'phone' ? '+243...' : payMethod === 'card' ? '1234 5678 9012 3456' : 'user@example.com'}
                  value={paymentDestination}
                  onChange={(e) => setPaymentDestination(e.target.value)}
                />
              </div>

              <Button
                className="w-full"
                onClick={() => {
                  if (paymentDestination) {
                    setScannedData({
                      accountNumber: paymentDestination,
                      fullName: paymentDestination,
                      isValid: true,
                    });
                  }
                }}
              >
                Continuer
              </Button>

              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => {
                  setMode('scanner');
                  setPayMethod(null);
                }}
              >
                Retour
              </Button>
            </div>
          )}

          {(mode === 'scanner' || mode === 'payment-method') && scannedData && (
            <div className="w-full max-w-sm space-y-4">
              <div className="bg-primary/10 rounded-full p-4 flex justify-center">
                <User className="h-16 w-16 text-primary" />
              </div>

              <div className="text-center space-y-1">
                <p className="text-muted-foreground">Vous payez à :</p>
                <p className="font-bold text-lg text-primary">{scannedData.fullName}</p>
                <p className="text-xs text-muted-foreground">{scannedData.accountNumber}</p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div>
                  <Label htmlFor="amount" className="text-sm">Montant</Label>
                  <div className="flex gap-2 mt-2">
                    <Input 
                      id="amount"
                      type="number" 
                      placeholder="0.00" 
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="text-center text-2xl h-14 font-bold flex-1"
                    />
                    <Select value={paymentCurrency} onValueChange={(value) => setPaymentCurrency(value as Currency)}>
                      <SelectTrigger className="w-[100px] h-14 font-semibold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CDF">CDF</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Button 
                className="w-full bg-gradient-to-r from-primary to-green-800 hover:from-primary/90 hover:to-green-800/90 h-12 text-base font-bold"
                onClick={handlePayment}
                disabled={isPaying || !paymentAmount}
              >
                {isPaying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {isPaying ? 'Paiement en cours...' : 'Envoyer l\'argent'}
              </Button>

              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  setScannedData(null);
                  setPaymentDestination('');
                  setPaymentAmount('');
                  setMode('scanner');
                  setIsScanning(true);
                }}
              >
                Annuler
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

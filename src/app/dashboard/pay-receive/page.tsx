'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, QrCode, Mail, Phone, CreditCard, Hash, Download, Share2,
  AlertCircle, Loader2, User, Upload, X, ArrowRightLeft
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useMoneyTransfer } from '@/hooks/useMoneyTransfer';
import { useToast } from '@/hooks/use-toast';
import { PinVerification } from '@/components/payment/PinVerification';
import { TransferByIdentifier } from '@/components/payment/TransferByIdentifier';
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
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { toast } = useToast();
  const { sendMoney, isProcessing: isTransferring, balance } = useMoneyTransfer();
  
  const [mode, setMode] = useState<'receive' | 'pay' | 'scanner' | 'payment-method' | 'multi-pay' | 'transfer'>('receive');
  const [previousMode, setPreviousMode] = useState<'receive' | 'pay' | 'scanner' | 'payment-method' | 'multi-pay' | 'transfer'>('receive');
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
  const [showPinDialog, setShowPinDialog] = useState(false);
  
  // États pour paiement multiple
  const [multiPayRecipients, setMultiPayRecipients] = useState<Array<{id: string; accountNumber: string; fullName: string; amount: string}>>([]);
  const [multiPayTotalAmount, setMultiPayTotalAmount] = useState(0);
  const [isProcessingMultiPay, setIsProcessingMultiPay] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Lire le paramètre mode de l'URL au chargement
  useEffect(() => {
    const modeParam = searchParams.get('mode');
    if (modeParam === 'transfer') {
      setMode('transfer');
    }
  }, [searchParams]);

  useEffect(() => {
    if (profile?.uid) {
      const hash = profile.uid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const accountNum = `ENK${String(hash).padStart(12, '0')}`;
      const fullName = profile.name || profile.fullName || 'eNkamba User';
      const email = profile.email || '';
      
      setAccountNumber(accountNum);
      setAccountName(fullName);

      // Format: accountNumber|fullName|email|uid
      const qrData = `${accountNum}|${fullName}|${email}|${profile.uid}`;
      
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
        
        // Si on vient du mode multi-pay, ajouter directement à la liste
        if (previousMode === 'multi-pay') {
          handleAddRecipientToMultiPay(qrData);
        } else {
          setPaymentDestination(qrData.accountNumber);
          toast({ title: 'QR Code Détecté ✅', description: `Destinataire: ${qrData.fullName}` });
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanQRFromVideo);
  };

  const handleAddRecipientToMultiPay = (qrData: ScannedQRData) => {
    // Vérifier si le destinataire n'est pas déjà dans la liste
    const alreadyAdded = multiPayRecipients.some(r => r.accountNumber === qrData.accountNumber);
    if (alreadyAdded) {
      toast({
        variant: 'destructive',
        title: 'Destinataire déjà ajouté',
        description: `${qrData.fullName} est déjà dans la liste`,
      });
      return;
    }

    // Ajouter le destinataire
    const newRecipient = {
      id: Date.now().toString(),
      accountNumber: qrData.accountNumber,
      fullName: qrData.fullName,
      amount: '',
    };
    
    setMultiPayRecipients([...multiPayRecipients, newRecipient]);
    toast({
      title: 'Destinataire ajouté ✅',
      description: `${qrData.fullName} ajouté à la liste`,
    });
    
    // Retourner au mode multi-pay
    setScannedData(null);
    setPaymentDestination('');
    setMode('multi-pay');
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
              
              // Si on vient du mode multi-pay, ajouter directement à la liste
              if (previousMode === 'multi-pay') {
                handleAddRecipientToMultiPay(qrData);
              } else {
                setPaymentDestination(qrData.accountNumber);
              }
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
    
    try {
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
      }, 100);
      
      toast({ title: 'QR Code Téléchargé ✅' });
    } catch (error) {
      console.error('Erreur téléchargement QR:', error);
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
    }
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
    console.log('=== handlePayment APPELÉE ===');
    console.log('paymentDestination:', paymentDestination);
    console.log('paymentAmount:', paymentAmount);
    console.log('paymentCurrency:', paymentCurrency);
    console.log('scannedData:', scannedData);
    
    if (!paymentDestination || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      console.log('Validation échouée');
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs.',
      });
      return;
    }

    // Ouvrir la vérification PIN
    setShowPinDialog(true);
  };

  const handlePinSuccess = async () => {
    // PIN vérifié, procéder au paiement
    setShowPinDialog(false);
    
    // Petit délai pour laisser le dialog se fermer proprement
    await new Promise(resolve => setTimeout(resolve, 100));
    
    setIsPaying(true);
    console.log('Appel de sendMoney...');
    
    // Effectuer le vrai transfert
    const success = await sendMoney({
      amount: parseFloat(paymentAmount),
      senderCurrency: paymentCurrency,
      transferMethod: payMethod === 'account' ? 'account' : payMethod === 'phone' ? 'phone' : payMethod === 'card' ? 'card' : 'email',
      recipientIdentifier: paymentDestination,
      description: `Paiement de ${paymentAmount} ${paymentCurrency} à ${scannedData?.fullName || paymentDestination}`,
    });

    setIsPaying(false);
    console.log('Résultat de sendMoney:', success);

    if (success) {
      console.log('Paiement réussi');
      toast({
        title: 'Paiement réussi ! ✅',
        description: `${paymentAmount} ${paymentCurrency} envoyé à ${scannedData?.fullName || paymentDestination}`,
      });

      setMode('receive');
      setScannedData(null);
      setPaymentDestination('');
      setPaymentAmount('');
    } else {
      console.log('Paiement échoué');
      // Le toast d'erreur est déjà affiché par sendMoney
    }
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

      <header className="flex items-center justify-between gap-4 mb-4 pt-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/mbongo-dashboard">
              <ArrowLeft />
            </Link>
          </Button>
          <h1 className="font-headline text-xl font-bold text-primary">
            {mode === 'receive' ? 'Recevoir de l\'argent' : 'Scanner QR'}
          </h1>
        </div>
        {mode === 'receive' && (
          <Button 
            size="icon" 
            className="bg-[#32BB78] hover:bg-[#2a9d63] text-white"
            onClick={() => {
              setPreviousMode('receive');
              setMode('scanner');
              setIsScanning(true);
            }}
          >
            <QrCode className="w-5 h-5" />
          </Button>
        )}
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
                  onClick={() => {
                    setPreviousMode('receive');
                    setMode('scanner');
                  }}
                >
                  Payer quelqu'un
                </Button>

                <Button 
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 h-12 text-base font-bold"
                  onClick={() => setMode('multi-pay')}
                >
                  <User className="w-5 h-5 mr-2" />
                  Payer à plusieurs
                </Button>

                <Button 
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 h-12 text-base font-bold"
                  onClick={() => setMode('transfer')}
                >
                  <ArrowRightLeft className="w-5 h-5 mr-2" />
                  Transfer
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

              {previousMode !== 'multi-pay' && (
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
              )}

              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => {
                  if (previousMode === 'multi-pay') {
                    setMode('multi-pay');
                  } else {
                    setMode('receive');
                  }
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

          {mode === 'multi-pay' && (
            <div className="w-full max-w-sm space-y-4">
              <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-2xl p-4">
                <h3 className="font-bold text-lg mb-3">Paiement Multiple</h3>
                
                {multiPayRecipients.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Aucun destinataire ajouté</p>
                    <p className="text-xs mt-1">Scannez un QR code pour commencer</p>
                  </div>
                ) : (
                  <div className="space-y-2 mb-4">
                    {multiPayRecipients.map((recipient) => (
                      <div key={recipient.id} className="bg-white rounded-lg p-3 flex items-center gap-3">
                        <div className="bg-primary/10 rounded-full p-2">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{recipient.fullName}</p>
                          <p className="text-xs text-muted-foreground truncate">{recipient.accountNumber}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            placeholder="0"
                            value={recipient.amount}
                            onChange={(e) => {
                              const newRecipients = multiPayRecipients.map(r => 
                                r.id === recipient.id ? { ...r, amount: e.target.value } : r
                              );
                              setMultiPayRecipients(newRecipients);
                              const total = newRecipients.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
                              setMultiPayTotalAmount(total);
                            }}
                            className="w-20 h-8 text-right text-sm"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              const newRecipients = multiPayRecipients.filter(r => r.id !== recipient.id);
                              setMultiPayRecipients(newRecipients);
                              const total = newRecipients.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
                              setMultiPayTotalAmount(total);
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="bg-primary/5 rounded-lg p-3 mb-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-primary">
                        {multiPayTotalAmount.toLocaleString('fr-FR')}
                      </span>
                      <Select value={paymentCurrency} onValueChange={(value) => setPaymentCurrency(value as Currency)}>
                        <SelectTrigger className="w-[80px] h-8 text-sm font-semibold">
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
                  {multiPayTotalAmount > balance && (
                    <p className="text-xs text-red-500 mt-2">
                      ⚠️ Solde insuffisant (disponible: {balance.toLocaleString('fr-FR')} CDF)
                    </p>
                  )}
                </div>

                <Button
                  className="w-full mb-2"
                  variant="outline"
                  onClick={() => {
                    setPreviousMode('multi-pay');
                    setMode('scanner');
                    setIsScanning(true);
                  }}
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Ajouter un destinataire
                </Button>

                {multiPayRecipients.length > 0 && (
                  <Button
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 h-12 text-base font-bold"
                    onClick={async () => {
                      console.log('=== DÉBUT PAIEMENT MULTIPLE ===');
                      
                      // Validation
                      const invalidRecipients = multiPayRecipients.filter(r => !r.amount || parseFloat(r.amount) <= 0);
                      if (invalidRecipients.length > 0) {
                        toast({
                          variant: 'destructive',
                          title: 'Erreur',
                          description: 'Tous les destinataires doivent avoir un montant valide',
                        });
                        return;
                      }

                      if (multiPayTotalAmount > balance) {
                        toast({
                          variant: 'destructive',
                          title: 'Solde insuffisant',
                          description: `Vous avez ${balance.toLocaleString('fr-FR')} CDF. Total requis: ${multiPayTotalAmount.toLocaleString('fr-FR')} CDF`,
                        });
                        return;
                      }

                      setIsProcessingMultiPay(true);
                      let successCount = 0;
                      let failCount = 0;
                      const results: Array<{recipient: string; success: boolean; error?: string}> = [];

                      for (let i = 0; i < multiPayRecipients.length; i++) {
                        const recipient = multiPayRecipients[i];
                        console.log(`Paiement ${i + 1}/${multiPayRecipients.length} à ${recipient.fullName}`);
                        
                        toast({
                          title: `Paiement ${i + 1}/${multiPayRecipients.length}`,
                          description: `Envoi à ${recipient.fullName}...`,
                        });

                        try {
                          const success = await sendMoney({
                            amount: parseFloat(recipient.amount),
                            senderCurrency: paymentCurrency,
                            transferMethod: 'account',
                            recipientIdentifier: recipient.accountNumber,
                            description: `Paiement multiple de ${recipient.amount} ${paymentCurrency}`,
                          });

                          if (success) {
                            successCount++;
                            results.push({ recipient: recipient.fullName, success: true });
                          } else {
                            failCount++;
                            results.push({ recipient: recipient.fullName, success: false, error: 'Échec du transfert' });
                          }
                        } catch (error: any) {
                          failCount++;
                          results.push({ recipient: recipient.fullName, success: false, error: error.message });
                          console.error(`Erreur paiement à ${recipient.fullName}:`, error);
                        }

                        // Petite pause entre les paiements
                        if (i < multiPayRecipients.length - 1) {
                          await new Promise(resolve => setTimeout(resolve, 500));
                        }
                      }

                      setIsProcessingMultiPay(false);

                      // Afficher le résumé
                      if (failCount === 0) {
                        toast({
                          title: 'Tous les paiements réussis ! ✅',
                          description: `${successCount} paiement(s) effectué(s) avec succès`,
                          className: 'bg-green-600 text-white border-none',
                        });
                        setMultiPayRecipients([]);
                        setMultiPayTotalAmount(0);
                        setMode('receive');
                      } else {
                        toast({
                          variant: 'destructive',
                          title: 'Paiements terminés avec erreurs',
                          description: `Réussis: ${successCount}, Échoués: ${failCount}`,
                        });
                        
                        // Retirer les destinataires payés avec succès
                        const failedRecipients = multiPayRecipients.filter((r, idx) => !results[idx].success);
                        setMultiPayRecipients(failedRecipients);
                        const newTotal = failedRecipients.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
                        setMultiPayTotalAmount(newTotal);
                      }

                      console.log('=== FIN PAIEMENT MULTIPLE ===');
                      console.log('Résultats:', results);
                    }}
                    disabled={isProcessingMultiPay || multiPayRecipients.length === 0 || multiPayTotalAmount <= 0 || multiPayTotalAmount > balance}
                  >
                    {isProcessingMultiPay ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    {isProcessingMultiPay ? 'Paiements en cours...' : `Payer ${multiPayRecipients.length} personne(s)`}
                  </Button>
                )}
              </div>

              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => {
                  setMode('receive');
                  setMultiPayRecipients([]);
                  setMultiPayTotalAmount(0);
                }}
              >
                Retour
              </Button>
            </div>
          )}

          {mode === 'transfer' && (
            <TransferByIdentifier
              onCancel={() => setMode('receive')}
              onTransferComplete={(userInfo, transferAmount, transferCurrency) => {
                // Préparer les données pour le paiement
                setScannedData({
                  accountNumber: userInfo.enkNumber,
                  fullName: userInfo.fullName,
                  email: userInfo.email,
                  isValid: true,
                });
                setPaymentDestination(userInfo.enkNumber);
                setPaymentAmount(transferAmount);
                setPaymentCurrency(transferCurrency);
                setPayMethod('account');
                
                // Ouvrir directement la vérification PIN
                setShowPinDialog(true);
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Dialog Vérification PIN */}
      {showPinDialog && (
        <PinVerification
          key={`pin-${Date.now()}`}
          isOpen={showPinDialog}
          onClose={() => setShowPinDialog(false)}
          onSuccess={handlePinSuccess}
          paymentDetails={scannedData ? {
            recipient: scannedData.fullName,
            amount: paymentAmount,
            currency: paymentCurrency,
          } : undefined}
        />
      )}
    </div>
  );
}

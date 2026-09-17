'use client';
/* eslint-disable @next/next/no-img-element */

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  QrCode, Upload, ArrowLeft, Loader2, User, AlertCircle, 
  Scan
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import jsQR from 'jsqr';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useMoneyTransfer } from '@/hooks/useMoneyTransfer';
import { PinVerification } from '@/components/payment/PinVerification';
import { useDevicePermission } from '@/hooks/useDevicePermission';

type Currency = 'CDF' | 'USD' | 'EUR';
type ViewMode = 'default' | 'camera-scan';

interface ScannedQRData {
  accountNumber: string;
  fullName: string;
  email?: string;
  uid?: string;
  isValid: boolean;
}

export default function ScannerPage() {
  const router = useRouter();
  const cameraPermission = useDevicePermission('camera');
  const [viewMode, setViewMode] = useState<ViewMode>('default');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scannedData, setScannedData] = useState<ScannedQRData | null>(null);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('CDF');
  const [isPaying, setIsPaying] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importedImageData, setImportedImageData] = useState<string | null>(null);
  const [showPinDialog, setShowPinDialog] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const { toast } = useToast();
  const { profile } = useUserProfile();
  const { sendMoney } = useMoneyTransfer();

  // Extraire et valider les données du QR code Kenz
  const parseQRData = (data: string): ScannedQRData | null => {
    try {
      // Vérifier si c'est un format Kenz valide
      if (data.startsWith('ENK')) {
        // Format avec infos: ENK{accountNumber}|{fullName}|{email}|{uid}
        const parts = data.split('|');
        
        if (parts.length >= 4) {
          // Format complet avec nom, email et UID
          return {
            accountNumber: parts[0],
            fullName: parts[1],
            email: parts[2] || undefined,
            uid: parts[3],
            isValid: true,
          };
        } else if (parts.length >= 2) {
          // Format ancien avec nom et email (sans UID)
          return {
            accountNumber: parts[0],
            fullName: parts[1],
            email: parts[2] || undefined,
            isValid: true,
          };
        } else if (parts.length === 1) {
          // Format avec juste le compte Kenz
          const accountNum = parts[0];
          return {
            accountNumber: accountNum,
            fullName: 'Compte Kenz',
            isValid: true,
          };
        }
      }
      
      // QR code non valide (ne commence pas par ENK)
      return {
        accountNumber: data,
        fullName: 'QR code invalide',
        isValid: false,
      };
    } catch (error) {
      console.error('Error parsing QR data:', error);
      return null;
    }
  };

  // Scanner QR en temps réel depuis la vidéo
  const scanQRFromVideo = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(scanQRFromVideo);
      return;
    }

    // Dessiner la vidéo sur le canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    // Récupérer les données de l'image
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Scanner le QR code avec jsQR
    const code = jsQR(imageData.data, canvas.width, canvas.height);

    if (code) {
      const qrData = parseQRData(code.data);
      if (qrData) {
        if (qrData.isValid) {
          setScannedData(qrData);
          setIsScanning(false);
          setScanError(null);
          toast({
            title: 'QR Code Détecté ✅',
            description: `Compte: ${qrData.accountNumber}`,
          });
        } else {
          setScanError('QR code invalide. Ce n\'est pas un code Kenz.');
          toast({
            variant: 'destructive',
            title: 'QR Code Invalide ❌',
            description: 'Ce QR code n\'appartient pas à Kenz.',
          });
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanQRFromVideo);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (viewMode !== 'camera-scan' || !isScanning) return;
    const currentVideo = videoRef.current;

    const getCameraPermission = async () => {
      try {
        // Vérifier et demander la permission caméra si nécessaire
        if (!cameraPermission.isGranted && cameraPermission.shouldPrompt) {
          const granted = await cameraPermission.requestPermission();
          if (!granted) {
            setHasCameraPermission(false);
            setScanError('Accès caméra refusé. Veuillez autoriser l\'accès dans les paramètres.');
            toast({
              variant: 'destructive',
              title: 'Accès Caméra Refusé',
              description: 'Veuillez autoriser l\'accès à la caméra.',
            });
            return;
          }
        }

        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
        setHasCameraPermission(true);

        if (currentVideo) {
          currentVideo.srcObject = stream;
          // Commencer à scanner une fois la vidéo chargée
          currentVideo.onloadedmetadata = () => {
            setIsScanning(true);
            scanQRFromVideo();
          };
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        setScanError('Accès caméra refusé. Veuillez autoriser l\'accès dans les paramètres.');
        toast({
          variant: 'destructive',
          title: 'Accès Caméra Refusé',
          description: 'Veuillez autoriser l\'accès à la caméra.',
        });
      }
    };

    getCameraPermission();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (currentVideo && currentVideo.srcObject) {
        const stream = currentVideo.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [viewMode, isScanning, toast, cameraPermission]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        // Afficher l'image IMMÉDIATEMENT
        const imageDataUrl = e.target?.result as string;
        setImportedImageData(imageDataUrl);
        setIsImporting(true);
        setImportProgress(0);

        const img = new Image();
        img.onload = () => {
          // Simuler une animation de scan progressive (0 à 100%)
          const progressInterval = setInterval(() => {
            setImportProgress(prev => {
              if (prev >= 85) {
                clearInterval(progressInterval);
                return prev;
              }
              return prev + Math.random() * 25;
            });
          }, 100);

          // Traiter l'image après une courte animation
          setTimeout(() => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Redimensionner l'image pour mieux la traiter
            let width = img.width;
            let height = img.height;
            
            // Limiter la taille pour de meilleures performances
            const maxSize = 500;
            if (width > maxSize || height > maxSize) {
              const ratio = Math.min(maxSize / width, maxSize / height);
              width = Math.round(width * ratio);
              height = Math.round(height * ratio);
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // Dessiner l'image redimensionnée
            ctx.drawImage(img, 0, 0, width, height);

            // Obtenir les données d'image
            let imageData = ctx.getImageData(0, 0, width, height);
            
            // Première tentative
            let code = jsQR(imageData.data, width, height);

            // Si pas détecté, améliorer le contraste et réessayer
            if (!code) {
              const data = imageData.data;
              for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const gray = (r + g + b) / 3;
                const threshold = 128;
                const bw = gray > threshold ? 255 : 0;
                data[i] = bw;
                data[i + 1] = bw;
                data[i + 2] = bw;
              }
              ctx.putImageData(imageData, 0, 0);
              imageData = ctx.getImageData(0, 0, width, height);
              code = jsQR(imageData.data, width, height);
            }

            setImportProgress(90);

            if (code) {
              const qrData = parseQRData(code.data);
              if (qrData) {
                setImportProgress(100);
                
                setTimeout(() => {
                  setIsImporting(false);
                  setImportedImageData(null);
                  
                  if (qrData.isValid) {
                    setScannedData(qrData);
                    setScanError(null);
                    toast({
                      title: 'QR Code Scanné ✅',
                      description: `Destinataire: ${qrData.fullName}`,
                    });
                  } else {
                    setScanError('QR code invalide. Ce n\'est pas un code Kenz.');
                    toast({
                      variant: 'destructive',
                      title: 'QR Code Invalide ❌',
                      description: 'Ce QR code n\'appartient pas à Kenz.',
                    });
                  }
                }, 500);
              }
            } else {
              setImportProgress(100);
              setTimeout(() => {
                setIsImporting(false);
                setImportedImageData(null);
                setScanError('Aucun QR code détecté dans l\'image.');
                toast({
                  variant: 'destructive',
                  title: 'Erreur ⚠️',
                  description: 'Aucun QR code trouvé.',
                });
              }, 500);
            }
          }, 1000);
        };
        img.onerror = () => {
          setScanError('Erreur de lecture d\'image.');
          setIsImporting(false);
          setImportedImageData(null);
          toast({
            variant: 'destructive',
            title: 'Erreur ⚠️',
            description: 'Impossible de lire l\'image.',
          });
        };
        img.src = imageDataUrl;
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePayment = () => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Veuillez entrer un montant valide.',
      });
      return;
    }
    // Ouvrir d'abord la vérification PIN
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
    // Si on a l'UID, on l'utilise directement (plus fiable)
    // Sinon on utilise l'accountNumber
    const success = await sendMoney({
      amount: parseFloat(amount),
      senderCurrency: currency,
      transferMethod: scannedData?.uid ? 'account' : 'account',
      recipientIdentifier: scannedData?.uid ? undefined : scannedData?.accountNumber,
      recipientId: scannedData?.uid || undefined,
      description: `Paiement de ${amount} ${currency} à ${scannedData?.fullName}`,
    });

    setIsPaying(false);
    console.log('Résultat de sendMoney:', success);
    
    if (success) {
      console.log('Paiement réussi');
      toast({
        title: 'Paiement réussi ! ✅',
        description: `Vous avez payé ${amount} ${currency} à ${scannedData?.fullName}.`,
      });

      // Reset et retour à l'écran par défaut
      setAmount('');
      setScannedData(null);
      setViewMode('default');
    } else {
      console.log('Paiement échoué');
      // Le toast d'erreur est déjà affiché par sendMoney
    }
  };

  return (
    <div className="container mx-auto max-w-md p-4 flex flex-col min-h-screen bg-muted/20 overflow-y-auto">
      <style>{`
        @keyframes scanLine {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 5px rgba(7, 59, 154, 0.5); }
          50% { box-shadow: 0 0 15px rgba(7, 59, 154, 0.8); }
        }
        
        .scan-animation {
          animation: scanLine 2s linear infinite;
        }
      `}</style>

      <header className="flex items-center gap-4 mb-4 flex-shrink-0">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/mbongo-dashboard">
            <ArrowLeft />
          </Link>
        </Button>
        <h1 className="font-headline text-xl font-bold text-primary flex-1">
          {viewMode === 'default' ? 'Scanner' : 'Payer'}
        </h1>
      </header>

      <Card className="flex-1 flex flex-col">
        <CardContent className="p-4 flex-1 flex flex-col items-center justify-center gap-4">
          <canvas ref={canvasRef} className="hidden" />
          
          {/* MODE PAR DÉFAUT: Scanner uniquement */}
          {viewMode === 'default' && (
            <div className="w-full max-w-sm flex flex-col items-center justify-center gap-4">
              <Button
                className="w-full h-14 bg-gradient-to-r from-[#073B9A] to-primary hover:from-[#073B9A] hover:to-primary text-white font-bold text-base shadow-lg"
                onClick={() => {
                  setViewMode('camera-scan');
                  setIsScanning(true);
                }}
              >
                <Scan className="w-5 h-5 mr-3" />
                Scanner
              </Button>
            </div>
          )}

          {/* MODE PAYER: Scanner caméra */}
          {viewMode === 'camera-scan' && !scannedData && (
            <div className="w-full space-y-4 flex flex-col items-center">
              {isImporting && importedImageData ? (
                <div className="relative w-full max-w-sm aspect-square rounded-2xl overflow-hidden shadow-2xl bg-white flex items-center justify-center">
                  <img 
                    src={importedImageData} 
                    alt="Imported QR" 
                    className="w-full h-full object-contain p-2 bg-white"
                  />
                  <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center">
                    <div 
                      className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#073B9A] to-transparent shadow-lg shadow-[#073B9A]"
                      style={{
                        top: `${importProgress}%`,
                        transition: 'top 0.1s linear'
                      }}
                    />
                    <div className="absolute bottom-8 left-0 right-0 text-center text-white text-sm font-semibold">
                      <p className="drop-shadow-lg">⚡ Scan en cours: {Math.round(importProgress)}%</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative w-full max-w-sm aspect-square bg-black rounded-2xl overflow-hidden shadow-lg">
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
                        <AlertDescription>
                          {scanError || 'Veuillez autoriser l\'accès à la caméra.'}
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}

                  {scanError && hasCameraPermission && (
                    <div className="absolute inset-0 flex items-center justify-center bg-red-500/20 p-4">
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 h-4" />
                        <AlertTitle>⚠️ QR Code Invalide</AlertTitle>
                        <AlertDescription>{scanError}</AlertDescription>
                      </Alert>
                    </div>
                  )}

                  {isScanning && hasCameraPermission && !scanError && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-3/4 h-3/4 border-4 border-dashed border-primary/70 rounded-2xl animate-pulse" />
                    </div>
                  )}

                  {isScanning && (
                    <div className="absolute bottom-4 left-0 right-0 text-center text-white text-xs">
                      <p className="animate-pulse">🔍 Recherche de QR Code...</p>
                    </div>
                  )}
                </div>
              )}

              <div className="relative w-full max-w-sm">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Ou</span>
                </div>
              </div>

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

              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => {
                  setViewMode('default');
                  setIsScanning(false);
                  setScanError(null);
                }}
              >
                Retour
              </Button>
            </div>
          )}

          {/* MODE PAYER: Confirmation paiement */}
          {viewMode === 'camera-scan' && scannedData && (
            <div className="w-full max-w-sm text-center flex flex-col items-center gap-4 animate-in fade-in-up">
              <div className="bg-primary/10 rounded-full p-4">
                <User className="h-16 w-16 text-primary"/>
              </div>
              
              {scannedData.isValid ? (
                <>
                  <p className="text-muted-foreground">Vous payez à :</p>
                  <div className="space-y-1">
                    <p className="font-headline text-2xl font-bold text-primary">{scannedData.fullName}</p>
                    <p className="text-xs text-muted-foreground">Compte: {scannedData.accountNumber}</p>
                    {scannedData.email && (
                      <p className="text-xs text-muted-foreground">Email: {scannedData.email}</p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-destructive font-bold">❌ QR Code Invalide</p>
                  <p className="text-sm text-muted-foreground">Ce n\'est pas un code Kenz valide</p>
                </>
              )}
              
              {scannedData.isValid && (
                <>
                  <div className="w-full space-y-2 pt-4 border-t">
                    <Label htmlFor="amount">Montant à envoyer</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="amount" 
                        type="number" 
                        placeholder="0.00" 
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="text-center text-2xl h-14 font-bold flex-1"
                      />
                      <Select value={currency} onValueChange={(value) => setCurrency(value as Currency)}>
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

                  <Button 
                    className="w-full bg-gradient-to-r from-primary to-primary hover:from-primary/90 hover:to-primary/90" 
                    size="lg" 
                    onClick={handlePayment}
                    disabled={!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0 || isPaying}
                  >
                    {isPaying ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Paiement en cours...
                      </>
                    ) : (
                      'Envoyer l\'argent'
                    )}
                  </Button>
                </>
              )}

              <Button 
                variant="link" 
                onClick={() => {
                  setScannedData(null);
                  setAmount('');
                  setScanError(null);
                  setIsScanning(true);
                }}
              >
                Scanner un autre code
              </Button>
            </div>
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
            amount: amount,
            currency: currency,
          } : undefined}
        />
      )}
    </div>
  );
}

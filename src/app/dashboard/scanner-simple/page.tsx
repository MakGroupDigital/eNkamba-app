'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  QrCode, Upload, ArrowLeft, Loader2, AlertCircle, 
  Download, Share2, Copy, Check, Mail, Phone, CreditCard, Hash
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import jsQR from 'jsqr';
import QRCodeLib from 'qrcode';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useRouter } from 'next/navigation';

interface ScannedQRData {
  accountNumber: string;
  fullName: string;
  email?: string;
  uid?: string;
  isValid: boolean;
}

export default function ScannerSimplePage() {
  const router = useRouter();
  const { profile } = useUserProfile();
  const { toast } = useToast();

  const [myQrCode, setMyQrCode] = useState<string>('');
  const [myAccountNumber, setMyAccountNumber] = useState<string>('');
  const [myCardNumber, setMyCardNumber] = useState<string>('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scannedData, setScannedData] = useState<ScannedQRData | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importedImageData, setImportedImageData] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Générer le QR code de l'utilisateur
  useEffect(() => {
    if (profile?.uid) {
      const hash = profile.uid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const accountNum = `ENK${String(hash).padStart(12, '0')}`;
      const cardNum = String(hash).padStart(16, '0');
      const formattedCardNum = cardNum.match(/.{1,4}/g)?.join(' ') || cardNum;
      const fullName = profile.name || profile.fullName || 'eNkamba User';
      const email = profile.email || '';
      
      setMyAccountNumber(accountNum);
      setMyCardNumber(formattedCardNum);

      const qrData = `${accountNum}|${fullName}|${email}|${profile.uid}`;

      QRCodeLib.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#32BB78',
          light: '#ffffff',
        },
      }).then(setMyQrCode);
    }
  }, [profile?.uid, profile?.name, profile?.fullName, profile?.email]);

  const parseQRData = (data: string): ScannedQRData | null => {
    try {
      if (data.startsWith('ENK')) {
        const parts = data.split('|');
        
        if (parts.length >= 4) {
          return {
            accountNumber: parts[0],
            fullName: parts[1],
            email: parts[2] || undefined,
            uid: parts[3],
            isValid: true,
          };
        } else if (parts.length >= 2) {
          return {
            accountNumber: parts[0],
            fullName: parts[1],
            email: parts[2] || undefined,
            isValid: true,
          };
        } else if (parts.length === 1) {
          return {
            accountNumber: parts[0],
            fullName: 'Compte eNkamba',
            isValid: true,
          };
        }
      }
      
      return {
        accountNumber: data,
        fullName: 'QR code invalide',
        isValid: false,
      };
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
      if (qrData && qrData.isValid) {
        setScannedData(qrData);
        setIsScanning(false);
        setScanError(null);
        toast({
          title: 'QR Code Détecté ✅',
          description: `Compte: ${qrData.accountNumber}`,
        });
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanQRFromVideo);
  };

  useEffect(() => {
    if (!isScanning) return;

    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            scanQRFromVideo();
          };
        }
      } catch (error) {
        setHasCameraPermission(false);
        setScanError('Accès caméra refusé.');
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
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isScanning, toast]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageDataUrl = e.target?.result as string;
      setImportedImageData(imageDataUrl);
      setIsImporting(true);
      setImportProgress(0);

      const img = new Image();
      img.onload = () => {
        const progressInterval = setInterval(() => {
          setImportProgress(prev => (prev >= 85 ? prev : prev + Math.random() * 25));
        }, 100);

        setTimeout(() => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          let width = img.width;
          let height = img.height;
          
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
            imageData = ctx.getImageData(0, 0, width, height);
            code = jsQR(imageData.data, width, height);
          }

          setImportProgress(100);

          if (code) {
            const qrData = parseQRData(code.data);
            if (qrData && qrData.isValid) {
              setScannedData(qrData);
              setScanError(null);
            }
          }

          setTimeout(() => {
            setIsImporting(false);
            setImportedImageData(null);
          }, 500);
        }, 1000);
      };
      img.src = imageDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleCopy = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast({
        title: 'Copié ! ✅',
        description: `${fieldName} copié`,
      });
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de copier',
      });
    }
  };

  return (
    <div className="container mx-auto max-w-md p-4 flex flex-col min-h-screen bg-muted/20">
      <style>{`
        @keyframes scanLine {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
      `}</style>

      <header className="flex items-center gap-4 mb-4 pt-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/mbongo-dashboard">
            <ArrowLeft />
          </Link>
        </Button>
        <h1 className="font-headline text-xl font-bold text-primary">Scanner</h1>
      </header>

      <Card className="flex-1 flex flex-col">
        <CardContent className="p-4 flex-1 flex flex-col gap-4">
          <canvas ref={canvasRef} className="hidden" />

          {/* Section Mon QR Code - Petit et compact */}
          <div className="bg-gradient-to-br from-[#32BB78]/10 to-green-600/5 border border-[#32BB78]/20 rounded-xl p-4">
            <div className="flex items-center gap-4">
              {/* QR Code */}
              <div className="flex-shrink-0">
                <div className="bg-white p-2 rounded-lg shadow-md border border-[#32BB78]/20">
                  {myQrCode ? (
                    <img src={myQrCode} alt="Mon QR Code" className="w-24 h-24" />
                  ) : (
                    <div className="w-24 h-24 bg-gray-100 rounded animate-pulse flex items-center justify-center">
                      <QrCode className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>

              {/* Infos et boutons */}
              <div className="flex-1 min-w-0 space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Votre compte</p>
                  <p className="font-bold text-sm text-primary truncate">{myAccountNumber}</p>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-8 text-xs"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = myQrCode;
                      link.download = `eNkamba-QR-${myAccountNumber}.png`;
                      document.body.appendChild(link);
                      link.click();
                      setTimeout(() => document.body.removeChild(link), 100);
                      toast({ title: 'QR Code téléchargé ✅' });
                    }}
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Télécharger
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-8 text-xs"
                    onClick={() => handleCopy(myAccountNumber, 'Compte')}
                  >
                    {copiedField === 'Compte' ? (
                      <Check className="w-3 h-3 mr-1 text-green-600" />
                    ) : (
                      <Copy className="w-3 h-3 mr-1" />
                    )}
                    Copier
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Scanner principal */}
          <div className="flex-1 flex flex-col gap-3">
            {!scannedData ? (
              <>
                {isImporting && importedImageData ? (
                  <div className="relative flex-1 rounded-2xl overflow-hidden shadow-lg bg-white flex items-center justify-center">
                    <img 
                      src={importedImageData} 
                      alt="Imported QR" 
                      className="w-full h-full object-contain p-2"
                    />
                    <div className="absolute inset-0 bg-black/30">
                      <div 
                        className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#32BB78] to-transparent shadow-lg shadow-[#32BB78]"
                        style={{ top: `${importProgress}%`, transition: 'top 0.1s linear' }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="relative flex-1 bg-black rounded-2xl overflow-hidden shadow-lg">
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
                      <>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-3/4 h-3/4 border-4 border-dashed border-green-500/70 rounded-2xl animate-pulse" />
                        </div>
                        <div className="absolute bottom-4 left-0 right-0 text-center text-white text-xs">
                          <p className="animate-pulse">🔍 Recherche de QR Code...</p>
                        </div>
                      </>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isImporting ? 'Scan...' : 'Importer'}
                  </Button>
                  <Button 
                    className="flex-1 bg-[#32BB78] hover:bg-[#2a9d63]"
                    onClick={() => {
                      setIsScanning(!isScanning);
                    }}
                  >
                    {isScanning ? 'Arrêter' : 'Démarrer'}
                  </Button>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/png, image/jpeg"
                  onChange={handleFileChange}
                />
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-6">
                <div className="bg-[#32BB78]/10 rounded-full p-4">
                  <QrCode className="w-12 h-12 text-[#32BB78]" />
                </div>
                <div className="text-center space-y-2">
                  <p className="font-bold text-lg text-primary">{scannedData.fullName}</p>
                  <p className="text-sm text-muted-foreground font-mono">{scannedData.accountNumber}</p>
                </div>
                <Button
                  className="w-full bg-gradient-to-r from-[#32BB78] to-green-800 hover:from-[#2a9d63] hover:to-green-700"
                  onClick={() => {
                    router.push(`/dashboard/pay-receive?recipient=${scannedData.accountNumber}&name=${scannedData.fullName}`);
                  }}
                >
                  Payer maintenant
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setScannedData(null);
                    setIsScanning(true);
                  }}
                >
                  Scanner un autre
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

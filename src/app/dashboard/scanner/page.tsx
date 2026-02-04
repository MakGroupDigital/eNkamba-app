
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { QrCode, Upload, Camera, ArrowLeft, Loader2, User, AlertCircle, User as UserIcon, Download, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import Link from 'next/link';
import jsQR from 'jsqr';
import QRCodeLib from 'qrcode';
import { useUserProfile } from '@/hooks/useUserProfile';

type Currency = 'CDF' | 'USD' | 'EUR';

interface ScannedQRData {
  accountNumber: string;
  fullName: string;
  email?: string;
  isValid: boolean;
}

export default function ScannerPage() {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scannedData, setScannedData] = useState<ScannedQRData | null>(null);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('CDF');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importedImageData, setImportedImageData] = useState<string | null>(null);
  const [myQrCode, setMyQrCode] = useState<string>('');
  const [myAccountNumber, setMyAccountNumber] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const { toast } = useToast();
  const { profile } = useUserProfile();

  // Générer le QR code de l'utilisateur avec logo
  useEffect(() => {
    if (profile?.uid) {
      const hash = profile.uid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const accountNum = `ENK${String(hash).padStart(12, '0')}`;
      const fullName = profile.name || profile.fullName || 'eNkamba User';
      const email = profile.email || '';
      
      setMyAccountNumber(accountNum);

      const qrData = `${accountNum}|${fullName}|${email}`;

      QRCodeLib.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#32BB78',
          light: '#ffffff',
        },
      }).then((qrImageUrl) => {
        // Ajouter le logo officiel eNkamba au centre du QR code
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const qrImage = new Image();
        qrImage.onload = () => {
          canvas.width = 300;
          canvas.height = 300;

          // Dessiner le QR code
          ctx.drawImage(qrImage, 0, 0);

          // Charger et dessiner le logo officiel
          const logoImg = new Image();
          logoImg.onload = () => {
            const logoSize = 60;
            const x = 150 - logoSize / 2;
            const y = 150 - logoSize / 2;

            // Fond blanc pour le logo
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.roundRect(x - 5, y - 5, logoSize + 10, logoSize + 10, 6);
            ctx.fill();

            // Dessiner le logo
            ctx.drawImage(logoImg, x, y, logoSize, logoSize);

            const finalQrCode = canvas.toDataURL();
            setMyQrCode(finalQrCode);
          };
          logoImg.src = '/enkamba-logo.png';
        };
        qrImage.src = qrImageUrl;
      });
    }
  }, [profile?.uid, profile?.name, profile?.fullName, profile?.email]);

  // Extraire et valider les données du QR code eNkamba
  const parseQRData = (data: string): ScannedQRData | null => {
    try {
      // Vérifier si c'est un format eNkamba valide
      if (data.startsWith('ENK')) {
        // Format avec infos: ENK{accountNumber}|{fullName}|{email}
        const parts = data.split('|');
        
        if (parts.length >= 2) {
          // Format complet avec nom et email
          return {
            accountNumber: parts[0],
            fullName: parts[1],
            email: parts[2] || undefined,
            isValid: true,
          };
        } else if (parts.length === 1) {
          // Format avec juste le compte eNkamba
          const accountNum = parts[0];
          return {
            accountNumber: accountNum,
            fullName: 'Compte eNkamba',
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
          setScanError('QR code invalide. Ce n\'est pas un code eNkamba.');
          toast({
            variant: 'destructive',
            title: 'QR Code Invalide ❌',
            description: 'Ce QR code n\'appartient pas à eNkamba.',
          });
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanQRFromVideo);
  };

  useEffect(() => {
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
          // Commencer à scanner une fois la vidéo chargée
          videoRef.current.onloadedmetadata = () => {
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
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [toast]);

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
            
            console.log('Canvas size:', width, 'x', height);
            console.log('Tentative 1: détection du QR code...');

            // Première tentative
            let code = jsQR(imageData.data, width, height);

            // Si pas détecté, améliorer le contraste et réessayer
            if (!code) {
              console.log('Tentative 2: amélioration du contraste...');
              
              // Améliorer le contraste de l'image
              const data = imageData.data;
              for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                
                // Convertir en grayscale
                const gray = (r + g + b) / 3;
                
                // Augmenter le contraste (seuil binaire)
                const threshold = 128;
                const bw = gray > threshold ? 255 : 0;
                
                data[i] = bw;
                data[i + 1] = bw;
                data[i + 2] = bw;
              }
              
              // Redessiner avec image traitée
              ctx.putImageData(imageData, 0, 0);
              imageData = ctx.getImageData(0, 0, width, height);
              
              // Deuxième tentative
              code = jsQR(imageData.data, width, height);
            }

            // Si toujours pas détecté, essayer une autre approche
            if (!code) {
              console.log('Tentative 3: rotation/zoom...');
              
              // Réinitialiser et redessiner l'image originale
              canvas.width = width;
              canvas.height = height;
              ctx.drawImage(img, 0, 0, width, height);
              
              // Appliquer un filtre de clarté
              const imageData2 = ctx.getImageData(0, 0, width, height);
              const data = imageData2.data;
              
              for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const gray = (r * 0.299 + g * 0.587 + b * 0.114);
                
                data[i] = gray > 200 ? 255 : gray < 100 ? 0 : gray;
                data[i + 1] = gray > 200 ? 255 : gray < 100 ? 0 : gray;
                data[i + 2] = gray > 200 ? 255 : gray < 100 ? 0 : gray;
              }
              
              ctx.putImageData(imageData2, 0, 0);
              code = jsQR(data, width, height);
            }

            console.log('QR Code détecté:', code?.data);

            setImportProgress(90);

            if (code) {
              const qrData = parseQRData(code.data);
              if (qrData) {
                console.log('QR Data parsée:', qrData);
                
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
                    setScanError('QR code invalide. Ce n\'est pas un code eNkamba.');
                    toast({
                      variant: 'destructive',
                      title: 'QR Code Invalide ❌',
                      description: 'Ce QR code n\'appartient pas à eNkamba.',
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
                  description: 'Aucun QR code trouvé. Assurez-vous que:\n• L\'image contient un QR code clair\n• Le QR code est bien éclairé\n• L\'image est nette',
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
    setShowConfirmDialog(true);
  };

  const handleConfirmPayment = async () => {
    setIsPaying(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsPaying(false);
    setShowConfirmDialog(false);
    
    toast({
      title: 'Paiement réussi ! ✅',
      description: `Vous avez payé ${amount} ${currency} à ${scannedData?.fullName}.`,
    });

    // Reset
    setAmount('');
    setScannedData(null);
    setIsScanning(true);
  };

  // Télécharger mon QR code
  const handleDownloadMyQR = () => {
    const link = document.createElement('a');
    link.href = myQrCode;
    link.download = `mon-qrcode-${myAccountNumber}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'QR Code téléchargé!', description: 'Enregistré avec succès' });
  };

  // Partager mon QR code
  const handleShareMyQR = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mon QR Code eNkamba',
          text: `Scannez mon code QR pour m'envoyer de l'argent: ${myAccountNumber}`,
          url: window.location.href,
        });
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          handleDownloadMyQR();
        }
      }
    } else {
      handleDownloadMyQR();
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
          0%, 100% { box-shadow: 0 0 5px rgba(50, 187, 120, 0.5); }
          50% { box-shadow: 0 0 15px rgba(50, 187, 120, 0.8); }
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
            <h1 className="font-headline text-xl font-bold text-primary">Scanner QR Code eNkamba</h1>
        </header>

        {/* Mon QR Code - Compact et Visible */}
        <Card className="bg-gradient-to-br from-[#32BB78]/10 via-[#32BB78]/5 to-transparent border-2 border-[#32BB78]/30 overflow-visible mb-4 shadow-lg flex-shrink-0">
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground">
              <QrCode className="w-4 h-4 text-[#32BB78]" />
              Mes informations de reçu
            </h3>
            
            {/* QR Code et Infos */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                {/* Glow Effect */}
                <div className="absolute -inset-2 bg-gradient-to-r from-[#32BB78]/30 to-[#2a9d63]/20 rounded-xl blur-lg animate-pulse" />
                
                {/* QR Code Container */}
                <div className="relative bg-white p-3 rounded-xl shadow-lg border-2 border-[#32BB78]/20">
                  {myQrCode ? (
                    <img src={myQrCode} alt="Mon QR Code" className="w-40 h-40" />
                  ) : (
                    <div className="w-40 h-40 bg-gray-100 rounded-lg animate-pulse" />
                  )}
                </div>
              </div>

              {/* Numéro et Boutons */}
              <div className="w-full text-center space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Compte</p>
                  <p className="font-mono font-bold text-sm text-foreground">{myAccountNumber || 'Chargement...'}</p>
                </div>
                <div className="flex gap-2 justify-center w-full">
                  <Button 
                    onClick={handleDownloadMyQR} 
                    disabled={!myQrCode} 
                    variant="outline"
                    className="flex-1 border-[#32BB78]/30 hover:bg-[#32BB78]/10 hover:border-[#32BB78]/50"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger
                  </Button>
                  <Button 
                    onClick={handleShareMyQR} 
                    disabled={!myQrCode}
                    className="flex-1 bg-[#32BB78] hover:bg-[#2a9d63] text-white"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Partager
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      <Card className="flex-1 flex flex-col">
        <CardContent className="p-4 flex-1 flex flex-col items-center justify-center gap-4">
          <canvas ref={canvasRef} className="hidden" />
          
          {!scannedData ? (
             <>
                {/* Écran d'import avec animation */}
                {isImporting && importedImageData ? (
                  <div className="relative w-full max-w-sm aspect-square rounded-2xl overflow-hidden shadow-2xl bg-white flex items-center justify-center">
                    {/* Image importée */}
                    <img 
                      src={importedImageData} 
                      alt="Imported QR" 
                      className="w-full h-full object-contain p-2 bg-white"
                    />
                    
                    {/* Overlay sombre avec scan */}
                    <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center">
                      {/* Ligne de scan horizontale futuriste */}
                      <div 
                        className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#32BB78] to-transparent shadow-lg shadow-[#32BB78]"
                        style={{
                          top: `${importProgress}%`,
                          animation: 'none',
                          transition: 'top 0.1s linear'
                        }}
                      />
                      
                      {/* Grille de scan */}
                      <div className="absolute inset-0 pointer-events-none opacity-30">
                        <svg width="100%" height="100%" className="w-full h-full">
                          <defs>
                            <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#32BB78" strokeWidth="0.5"/>
                            </pattern>
                          </defs>
                          <rect width="100%" height="100%" fill="url(#grid)" />
                        </svg>
                      </div>

                      {/* Cadre de scan avec coins lumineux */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative w-4/5 h-4/5 border-2 border-[#32BB78]/50">
                          {/* Coins lumineux */}
                          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#32BB78] shadow-lg shadow-[#32BB78]/50"></div>
                          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#32BB78] shadow-lg shadow-[#32BB78]/50"></div>
                          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#32BB78] shadow-lg shadow-[#32BB78]/50"></div>
                          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#32BB78] shadow-lg shadow-[#32BB78]/50"></div>
                        </div>
                      </div>

                      {/* Points de scan animés */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="absolute w-2 h-2 rounded-full bg-[#32BB78] shadow-lg shadow-[#32BB78]"
                            style={{
                              left: `${20 + i * 15}%`,
                              top: `${importProgress}%`,
                              opacity: Math.max(0, 1 - Math.abs(importProgress - 50) / 30),
                              animation: 'pulse 1.5s ease-in-out infinite'
                            }}
                          />
                        ))}
                      </div>

                      {/* Texte de scan */}
                      <div className="absolute bottom-8 left-0 right-0 text-center text-white text-sm font-semibold">
                        <p className="drop-shadow-lg">⚡ Scan en cours: {Math.round(importProgress)}%</p>
                      </div>

                      {/* Effet de flash final */}
                      {importProgress >= 95 && (
                        <div className="absolute inset-0 bg-[#32BB78]/20 animate-pulse"></div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Camera Preview - affichage normal */
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
                                  <AlertCircle className="h-4 w-4" />
                                  <AlertTitle>⚠️ QR Code Invalide</AlertTitle>
                                  <AlertDescription>
                                      {scanError}
                                  </AlertDescription>
                              </Alert>
                           </div>
                      )}

                      {isScanning && hasCameraPermission && !scanError && (
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
                  className="w-full max-w-sm" 
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
            </>
          ) : (
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
                    <p className="text-sm text-muted-foreground">Ce n\'est pas un code eNkamba valide</p>
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
                        {currency !== 'CDF' && amount && !isNaN(parseFloat(amount)) && (
                            <p className="text-xs text-muted-foreground text-center">
                                ≈ {(parseFloat(amount) * (currency === 'USD' ? 2500 : 3000)).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} CDF
                            </p>
                        )}
                    </div>

                     <Button 
                       className="w-full bg-gradient-to-r from-primary to-green-800 hover:from-primary/90 hover:to-green-800/90" 
                       size="lg" 
                       onClick={handlePayment}
                       disabled={!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0}
                     >
                        Envoyer l'argent
                    </Button>
                  </>
                )}
                
                {/* Confirmation Dialog */}
                <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirmer le paiement</DialogTitle>
                      <DialogDescription>
                        Vérifiez les détails avant de confirmer le paiement.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="p-4 rounded-lg bg-muted space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Destinataire :</span>
                          <span className="font-bold">{scannedData.fullName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Compte :</span>
                          <span className="text-xs font-mono">{scannedData.accountNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Montant :</span>
                          <span className="font-bold text-primary">{amount} {currency}</span>
                        </div>
                        {currency !== 'CDF' && (
                          <div className="flex justify-between pt-2 border-t">
                            <span className="text-xs text-muted-foreground">En CDF :</span>
                            <span className="text-xs font-semibold">
                              ≈ {(parseFloat(amount) * (currency === 'USD' ? 2500 : 3000)).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} CDF
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={isPaying}>
                        Annuler
                      </Button>
                      <Button 
                        onClick={handleConfirmPayment} 
                        disabled={isPaying}
                        className="bg-gradient-to-r from-primary to-green-800"
                      >
                        {isPaying ? "Paiement en cours..." : "Confirmer"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

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
    </div>
  );
}

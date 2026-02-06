'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  QrCode, Upload, ArrowLeft, Loader2, User, AlertCircle, 
  Download, Share2, Scan, ArrowRightLeft, Copy, Check,
  Mail, Phone, CreditCard, Hash
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import jsQR from 'jsqr';
import QRCodeLib from 'qrcode';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useMoneyTransfer } from '@/hooks/useMoneyTransfer';
import { PinVerification } from '@/components/payment/PinVerification';

type Currency = 'CDF' | 'USD' | 'EUR';
type ViewMode = 'default' | 'receive-details' | 'camera-scan';

interface ScannedQRData {
  accountNumber: string;
  fullName: string;
  email?: string;
  uid?: string;
  isValid: boolean;
}

export default function ScannerPage() {
  const router = useRouter();
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
  const [myQrCode, setMyQrCode] = useState<string>('');
  const [myAccountNumber, setMyAccountNumber] = useState<string>('');
  const [myCardNumber, setMyCardNumber] = useState<string>('');
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const { toast } = useToast();
  const { profile } = useUserProfile();
  const { sendMoney } = useMoneyTransfer();

  // Générer le QR code de l'utilisateur avec logo
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

      // Format: accountNumber|fullName|email|uid
      const qrData = `${accountNum}|${fullName}|${email}|${profile.uid}`;

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
    if (viewMode !== 'camera-scan' || !isScanning) return;

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
  }, [viewMode, isScanning, toast]);

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

  // Copier dans le presse-papiers
  const handleCopy = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast({
        title: 'Copié ! ✅',
        description: `${fieldName} copié dans le presse-papiers`,
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
        <h1 className="font-headline text-xl font-bold text-primary flex-1">
          {viewMode === 'default' ? 'Scanner' : viewMode === 'receive-details' ? 'Recevoir' : 'Payer'}
        </h1>
      </header>

      <Card className="flex-1 flex flex-col">
        <CardContent className="p-4 flex-1 flex flex-col items-center justify-center gap-4">
          <canvas ref={canvasRef} className="hidden" />
          
          {/* MODE PAR DÉFAUT: QR Code + 3 boutons */}
          {viewMode === 'default' && (
            <div className="w-full max-w-sm space-y-6">
              {/* QR Code de l'utilisateur */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="absolute -inset-3 bg-gradient-to-r from-[#32BB78]/30 to-[#2a9d63]/20 rounded-2xl blur-xl animate-pulse" />
                  <div className="relative bg-white p-6 rounded-2xl shadow-2xl border-2 border-[#32BB78]/30">
                    {myQrCode ? (
                      <img src={myQrCode} alt="Mon QR Code" className="w-56 h-56" />
                    ) : (
                      <div className="w-56 h-56 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
                        <QrCode className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-center space-y-1">
                  <p className="font-bold text-lg text-primary">
                    {profile?.name || profile?.fullName || 'eNkamba User'}
                  </p>
                  <p className="text-sm text-muted-foreground font-mono">{myAccountNumber}</p>
                </div>
              </div>

              {/* 3 Boutons principaux */}
              <div className="space-y-3">
                {/* Bouton Recevoir */}
                <Button
                  className="w-full h-14 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-bold text-base shadow-lg"
                  onClick={() => setViewMode('receive-details')}
                >
                  <Download className="w-5 h-5 mr-3" />
                  Recevoir
                </Button>

                {/* Bouton Transférer */}
                <Button
                  className="w-full h-14 bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white font-bold text-base shadow-lg"
                  onClick={() => router.push('/dashboard/pay-receive?mode=transfer')}
                >
                  <ArrowRightLeft className="w-5 h-5 mr-3" />
                  Transférer
                </Button>

                {/* Bouton Payer */}
                <Button
                  className="w-full h-14 bg-gradient-to-r from-[#32BB78] to-green-800 hover:from-[#2a9d63] hover:to-green-700 text-white font-bold text-base shadow-lg"
                  onClick={() => {
                    setViewMode('camera-scan');
                    setIsScanning(true);
                  }}
                >
                  <Scan className="w-5 h-5 mr-3" />
                  Payer
                </Button>
              </div>
            </div>
          )}

          {/* MODE RECEVOIR: Page détails complète */}
          {viewMode === 'receive-details' && (
            <div className="w-full max-w-sm space-y-6">
              {/* QR Code téléchargeable */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="absolute -inset-3 bg-gradient-to-r from-[#32BB78]/30 to-[#2a9d63]/20 rounded-2xl blur-xl animate-pulse" />
                  <div className="relative bg-white p-6 rounded-2xl shadow-2xl border-2 border-[#32BB78]/30">
                    {myQrCode && <img src={myQrCode} alt="Mon QR Code" className="w-48 h-48" />}
                  </div>
                </div>

                <div className="text-center space-y-1">
                  <p className="font-bold text-xl text-primary">
                    {profile?.name || profile?.fullName || 'eNkamba User'}
                  </p>
                  <p className="text-xs text-muted-foreground">Partagez ces informations pour recevoir de l'argent</p>
                </div>
              </div>

              {/* Toutes les informations avec boutons copier */}
              <div className="space-y-3 bg-muted/50 rounded-xl p-4">
                {/* Numéro eNkamba */}
                <div className="flex items-center gap-3 bg-white rounded-lg p-3">
                  <div className="bg-[#32BB78]/10 rounded-full p-2 flex-shrink-0">
                    <Hash className="w-5 h-5 text-[#32BB78]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Numéro eNkamba</p>
                    <p className="font-semibold font-mono text-sm truncate">{myAccountNumber}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-shrink-0"
                    onClick={() => handleCopy(myAccountNumber, 'Numéro eNkamba')}
                  >
                    {copiedField === 'Numéro eNkamba' ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {/* Numéro de carte */}
                <div className="flex items-center gap-3 bg-white rounded-lg p-3">
                  <div className="bg-blue-500/10 rounded-full p-2 flex-shrink-0">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Numéro de Carte</p>
                    <p className="font-semibold font-mono text-sm truncate">{myCardNumber}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-shrink-0"
                    onClick={() => handleCopy(myCardNumber, 'Numéro de Carte')}
                  >
                    {copiedField === 'Numéro de Carte' ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {/* Email */}
                {profile?.email && (
                  <div className="flex items-center gap-3 bg-white rounded-lg p-3">
                    <div className="bg-orange-500/10 rounded-full p-2 flex-shrink-0">
                      <Mail className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-semibold text-sm truncate">{profile.email}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-shrink-0"
                      onClick={() => handleCopy(profile.email!, 'Email')}
                    >
                      {copiedField === 'Email' ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                )}

                {/* Téléphone */}
                {profile?.phoneNumber && (
                  <div className="flex items-center gap-3 bg-white rounded-lg p-3">
                    <div className="bg-purple-500/10 rounded-full p-2 flex-shrink-0">
                      <Phone className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Téléphone</p>
                      <p className="font-semibold text-sm truncate">{profile.phoneNumber}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-shrink-0"
                      onClick={() => handleCopy(profile.phoneNumber!, 'Téléphone')}
                    >
                      {copiedField === 'Téléphone' ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {/* Boutons d'action */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 border-[#32BB78]/30 hover:bg-[#32BB78]/10"
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
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger QR
                </Button>
                <Button
                  className="flex-1 bg-[#32BB78] hover:bg-[#2a9d63]"
                  onClick={async () => {
                    if (navigator.share) {
                      try {
                        await navigator.share({
                          title: 'Mon QR Code eNkamba',
                          text: `Envoyez-moi de l'argent via eNkamba. Compte: ${myAccountNumber}`,
                        });
                      } catch (error) {
                        // Utilisateur a annulé
                      }
                    } else {
                      handleCopy(myAccountNumber, 'Numéro de compte');
                    }
                  }}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Partager
                </Button>
              </div>

              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setViewMode('default')}
              >
                Retour
              </Button>
            </div>
          )}

          {/* MODE PAYER: Scanner caméra */}
          {viewMode === 'camera-scan' && !scannedData && (
            <div className="w-full max-w-sm space-y-4">
              {isImporting && importedImageData ? (
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-2xl bg-white flex items-center justify-center">
                  <img 
                    src={importedImageData} 
                    alt="Imported QR" 
                    className="w-full h-full object-contain p-2 bg-white"
                  />
                  <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center">
                    <div 
                      className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#32BB78] to-transparent shadow-lg shadow-[#32BB78]"
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
                  </div>

                  <Button 
                    className="w-full bg-gradient-to-r from-primary to-green-800 hover:from-primary/90 hover:to-green-800/90" 
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

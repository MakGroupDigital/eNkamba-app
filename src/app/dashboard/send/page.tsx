'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, QrCode, Copy, Share2, Download, Camera, Upload, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useUserProfile } from '@/hooks/useUserProfile';
import { useMoneyTransfer } from '@/hooks/useMoneyTransfer';
import QRCodeLib from 'qrcode';
import jsQR from 'jsqr';
import { useToast } from "@/hooks/use-toast";

type Mode = 'demand' | 'collect' | null;
type ViewMode = 'menu' | 'scanning' | 'recipient_found' | 'sent';

interface ScannedUser {
  accountNumber: string;
  fullName: string;
  email?: string;
  isValid?: boolean;
}

export default function SendPage() {
  const { profile } = useUserProfile();
  const { toast } = useToast();
  const { sendMoney, isProcessing } = useMoneyTransfer();
  const [mode, setMode] = useState<Mode>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('menu');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('CDF');
  const [scannedUser, setScannedUser] = useState<ScannedUser | null>(null);
  const [collectionLink, setCollectionLink] = useState('');
  const [collectionQR, setCollectionQR] = useState('');
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Générer accountNumber à partir du UID
  const accountNumber = profile?.uid ? `ENK${String(profile.uid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)).padStart(12, '0')}` : '';
  const fullName = profile?.fullName || '';

  // Scanner QR code en temps réel
  useEffect(() => {
    if (!isScanning || mode !== 'demand' || !videoRef.current) return;

    const getMediaStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          scanQRFromVideo();
        }
      } catch (error) {
        toast({ title: "Erreur", description: "Impossible d'accéder à la caméra", variant: "destructive" });
        setIsScanning(false);
      }
    };

    getMediaStream();

    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, [isScanning, mode, toast]);

  const scanQRFromVideo = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scanLoop = () => {
      if (videoRef.current && isScanning) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, canvas.width, canvas.height);

        if (code) {
          const data = parseQRData(code.data);
          if (data?.isValid) {
            setScannedUser(data);
            setIsScanning(false);
            setViewMode('recipient_found');
            toast({ title: "QR code scanné!", description: `${data.fullName} trouvé(e)`, variant: "default" });
          }
        }
      }

      if (isScanning) requestAnimationFrame(scanLoop);
    };

    scanLoop();
  };

  const parseQRData = (data: string): (ScannedUser & { isValid: boolean }) | null => {
    if (data.startsWith('ENK')) {
      const parts = data.split('|');
      if (parts.length >= 2) {
        return {
          accountNumber: parts[0],
          fullName: parts[1] || 'Utilisateur eNkamba',
          email: parts[2],
          isValid: true
        };
      }
    }
    return null;
  };

  const handleFileImport = async (file: File) => {
    setIsLoading(true);
    setImportProgress(0);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const img = new Image();
        img.onload = async () => {
          setImportProgress(30);

          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            toast({ title: "Erreur", description: "Impossible de traiter l'image", variant: "destructive" });
            setIsLoading(false);
            return;
          }

          // Tentative 1: Direct
          ctx.drawImage(img, 0, 0);
          let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          let code = jsQR(imageData.data, canvas.width, canvas.height);

          if (!code) {
            setImportProgress(60);
            // Tentative 2: Grayscale + binary threshold
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
              const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
              const binary = gray > 128 ? 255 : 0;
              data[i] = data[i + 1] = data[i + 2] = binary;
            }
            code = jsQR(data, canvas.width, canvas.height);
          }

          if (!code) {
            setImportProgress(80);
            // Tentative 3: Advanced grayscale
            ctx.filter = 'grayscale(100%) contrast(1.5)';
            ctx.drawImage(img, 0, 0);
            imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            code = jsQR(imageData.data, canvas.width, canvas.height);
          }

          setImportProgress(100);

          if (code) {
            const data = parseQRData(code.data);
            if (data?.isValid) {
              setScannedUser(data);
              setViewMode('recipient_found');
              toast({ title: "QR code lu!", description: `${data.fullName} trouvé(e)` });
            } else {
              toast({ title: "QR code invalide", description: "Ce n'est pas un code eNkamba", variant: "destructive" });
            }
          } else {
            toast({ title: "Aucun QR code trouvé", description: "Essayez une image plus claire", variant: "destructive" });
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible d'importer l'image", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const generateCollectionLink = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({ title: "Erreur", description: "Veuillez saisir un montant valide", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      // Générer un lien d'encaissement unique
      const linkId = Math.random().toString(36).substring(7);
      const link = `${window.location.origin}/dashboard/pay-receive?collect=${linkId}&amount=${amount}&currency=${currency}&from=${accountNumber}`;
      setCollectionLink(link);

      // Générer le QR code pour ce lien
      QRCodeLib.toDataURL(link, {
        width: 300,
        margin: 2,
        color: { dark: '#32BB78', light: '#ffffff' }
      }).then(qrCodeUrl => {
        setCollectionQR(qrCodeUrl);
      });

      toast({ title: "Lien généré!", description: "Partagez le lien ou le QR code" });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de générer le lien", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const sendDemandMessage = async () => {
    console.log('=== sendDemandMessage APPELÉE ===');
    console.log('scannedUser:', scannedUser);
    console.log('amount:', amount);
    console.log('currency:', currency);
    
    if (!scannedUser || !amount || parseFloat(amount) <= 0) {
      console.log('Validation échouée');
      toast({ title: "Erreur", description: "Tous les champs sont requis", variant: "destructive" });
      return;
    }

    console.log('Appel de sendMoney...');
    // Utiliser la Cloud Function sendMoney pour envoyer l'argent
    const success = await sendMoney({
      amount: parseFloat(amount),
      senderCurrency: currency,
      transferMethod: 'account', // Utiliser 'account' car on scanne l'accountNumber
      recipientIdentifier: scannedUser.accountNumber,
      description: `Demande de ${amount} ${currency} à ${scannedUser.fullName}`,
    });

    console.log('Résultat de sendMoney:', success);
    
    if (success) {
      console.log('Transfert réussi, affichage de la confirmation');
      setConfirmationMessage(`Envoi de ${amount} ${currency} à ${scannedUser.fullName} effectué avec succès`);
      setViewMode('sent');
    } else {
      console.log('Transfert échoué');
    }
  };

  const downloadCollectionQR = () => {
    const link = document.createElement('a');
    link.href = collectionQR;
    link.download = `encaissement-${amount}${currency}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const shareCollectionLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Lien d\'encaissement eNkamba',
          text: `Payez-moi ${amount} ${currency}`,
          url: collectionLink
        });
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          copyToClipboard();
        }
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(collectionLink);
    toast({ title: "Copié!", description: "Le lien a été copié" });
  };

  // Menu Principal
  if (mode === null) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/50">
        <div className="container mx-auto max-w-4xl p-4 space-y-6 pt-20">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/dashboard/mbongo-dashboard">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Demander / Encaisser</h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mode Demander */}
            <Card className="border-2 border-[#32BB78]/20 hover:border-[#32BB78]/50 cursor-pointer transition-all hover:shadow-lg"
              onClick={() => { setMode('demand'); setViewMode('menu'); }}>
              <CardHeader className="bg-gradient-to-r from-[#32BB78]/10 to-transparent">
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-[#32BB78]" />
                  Demander de l'argent
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-4">
                  Entrez le montant et scannez le QR code de la personne qui vous devra vous payer.
                </p>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p>✓ Saisir le montant demandé</p>
                  <p>✓ Scanner le QR code</p>
                  <p>✓ Confirmer et envoyer</p>
                </div>
              </CardContent>
            </Card>

            {/* Mode Encaisser */}
            <Card className="border-2 border-[#32BB78]/20 hover:border-[#32BB78]/50 cursor-pointer transition-all hover:shadow-lg"
              onClick={() => { setMode('collect'); setViewMode('menu'); }}>
              <CardHeader className="bg-gradient-to-r from-[#32BB78]/10 to-transparent">
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-[#32BB78]" />
                  Encaisser
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-4">
                  Générez un lien ou un QR code que vous pouvez partager pour recevoir de l'argent.
                </p>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p>✓ Saisir le montant à recevoir</p>
                  <p>✓ Générer lien ou QR code</p>
                  <p>✓ Partager ou télécharger</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Mode DEMANDER
  if (mode === 'demand') {
    if (viewMode === 'menu') {
      return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/50">
          <div className="container mx-auto max-w-4xl p-4 space-y-6 pt-20">
            <div className="flex items-center gap-3 mb-6">
              <Button variant="ghost" size="icon" onClick={() => setMode(null)} className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-2xl font-bold">Demander de l'argent</h1>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Montant à demander</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="demand-amount">Montant</Label>
                  <div className="flex gap-2">
                    <Input
                      id="demand-amount"
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="flex-1"
                    />
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="px-3 py-2 border rounded-md bg-background"
                    >
                      <option>CDF</option>
                      <option>USD</option>
                      <option>EUR</option>
                    </select>
                  </div>
                </div>

                <Button
                  onClick={() => { setScannedUser(null); setIsScanning(true); setViewMode('scanning'); }}
                  className="w-full bg-[#32BB78] hover:bg-[#2a9d63]"
                  disabled={!amount || parseFloat(amount) <= 0}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Scanner le QR code
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    // Vue Scanning - Demander
    if (viewMode === 'scanning') {
      return (
        <div className="min-h-screen bg-black">
          <div className="container mx-auto max-w-4xl p-4 pt-20">
            <div className="flex items-center gap-3 mb-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { setIsScanning(false); setViewMode('menu'); }}
                className="rounded-full bg-white/10 hover:bg-white/20 text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-2xl font-bold text-white">Scanner le QR code</h1>
            </div>

            <Card className="overflow-hidden">
              <CardContent className="p-0 relative">
                <video
                  ref={videoRef}
                  className="w-full bg-black rounded-lg"
                  style={{ maxHeight: '400px', objectFit: 'cover' }}
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Overlay scanner */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 border-2 border-[#32BB78] opacity-50 rounded-lg" />
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-4 border-[#32BB78]" />
                </div>
              </CardContent>
            </Card>

            <div className="mt-6 space-y-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Importer une image
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleFileImport(e.target.files[0])}
                className="hidden"
              />
            </div>
          </div>
        </div>
      );
    }

    // Vue Recipient Found - Demander
    if (viewMode === 'recipient_found') {
      return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/50">
          <div className="container mx-auto max-w-4xl p-4 space-y-6 pt-20">
            <div className="flex items-center gap-3 mb-6">
              <Button variant="ghost" size="icon" onClick={() => { setScannedUser(null); setViewMode('menu'); }} className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-2xl font-bold">Demande de paiement</h1>
            </div>

            <Card className="border-[#32BB78]/50 bg-[#32BB78]/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#32BB78]" />
                  Bénéficiaire trouvé
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Nom</p>
                  <p className="text-xl font-semibold">{scannedUser?.fullName}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Compte</p>
                  <p className="font-mono text-sm">{scannedUser?.accountNumber}</p>
                </div>
                {scannedUser?.email && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="text-sm">{scannedUser.email}</p>
                  </div>
                )}

                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <p className="text-sm font-semibold">Montant à demander</p>
                  <p className="text-2xl font-bold text-[#32BB78]">{amount} {currency}</p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => { setScannedUser(null); setViewMode('menu'); }}
                    className="flex-1"
                  >
                    Retour
                  </Button>
                  <Button
                    onClick={sendDemandMessage}
                    className="flex-1 bg-[#32BB78] hover:bg-[#2a9d63]"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Envoi...</>
                    ) : (
                      <>Envoyer</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    // Vue Sent - Demander
    if (viewMode === 'sent') {
      return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/50">
          <div className="container mx-auto max-w-4xl p-4 space-y-6 pt-20">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#32BB78]/20 flex items-center justify-center mx-auto animate-pulse">
                <CheckCircle2 className="w-8 h-8 text-[#32BB78]" />
              </div>
              <h1 className="text-2xl font-bold">Demande envoyée!</h1>
              <p className="text-muted-foreground">{confirmationMessage}</p>
            </div>

            <Button
              onClick={() => { setMode(null); setViewMode('menu'); setAmount(''); setScannedUser(null); setConfirmationMessage(''); }}
              className="w-full bg-[#32BB78] hover:bg-[#2a9d63]"
            >
              Terminer
            </Button>
          </div>
        </div>
      );
    }
  }

  // Mode ENCAISSER
  if (mode === 'collect') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/50">
        <div className="container mx-auto max-w-4xl p-4 space-y-6 pt-20">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" onClick={() => setMode(null)} className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold">Encaisser de l'argent</h1>
          </div>

          {!collectionLink ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Créer un lien d'encaissement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="collect-amount">Montant à recevoir</Label>
                  <div className="flex gap-2">
                    <Input
                      id="collect-amount"
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="flex-1"
                    />
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="px-3 py-2 border rounded-md bg-background"
                    >
                      <option>CDF</option>
                      <option>USD</option>
                      <option>EUR</option>
                    </select>
                  </div>
                </div>

                <Alert>
                  <AlertDescription className="text-xs">
                    Le montant peut être changé par la personne qui paie, mais vous pouvez suggérer ce montant.
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={generateCollectionLink}
                  className="w-full bg-[#32BB78] hover:bg-[#2a9d63]"
                  disabled={isLoading || !amount || parseFloat(amount) <= 0}
                >
                  {isLoading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Génération...</>
                  ) : (
                    <>Générer le lien et QR code</>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="border-[#32BB78]/50 bg-[#32BB78]/5">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#32BB78]" />
                    Lien généré avec succès!
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Montant: {amount} {currency}</p>
                    <p className="text-xs text-muted-foreground">ID: {collectionLink.split('=')[1]}</p>
                  </div>
                </CardContent>
              </Card>

              {collectionQR && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">QR Code d'encaissement</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-center bg-white p-4 rounded-lg">
                      <img src={collectionQR} alt="QR Code" className="w-40 h-40" />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={downloadCollectionQR}
                        variant="outline"
                        className="flex-1"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Télécharger
                      </Button>
                      <Button
                        onClick={shareCollectionLink}
                        className="flex-1 bg-[#32BB78] hover:bg-[#2a9d63]"
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        Partager
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {collectionLink && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Lien d'encaissement</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 bg-muted p-2 rounded text-xs">
                      <code className="flex-1 break-all">{collectionLink}</code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={copyToClipboard}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button
                onClick={() => { setMode(null); setViewMode('menu'); setAmount(''); setCollectionLink(''); setCollectionQR(''); }}
                variant="outline"
                className="w-full"
              >
                Créer un autre lien
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
}

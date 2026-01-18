
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { QrCode, Upload, Camera, ArrowLeft, Loader2, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import Link from 'next/link';

type Currency = 'CDF' | 'USD' | 'EUR';

export default function ScannerPage() {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('CDF');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Accès Caméra Refusé',
          description: 'Veuillez autoriser l\'accès à la caméra dans les paramètres de votre navigateur.',
        });
      }
    };

    getCameraPermission();

    // Cleanup function to stop camera stream
    return () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    };
  }, [toast]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Placeholder for QR code scanning from file
      setIsLoading(true);
      setTimeout(() => {
        setScannedData('Destinataire Fictif (Fichier)');
        setIsLoading(false);
        toast({ title: "QR Code importé", description: "Le QR code a été lu avec succès." });
      }, 1500);
    }
  };

  const handleManualScan = () => {
    // Placeholder for manual scan from video
    setIsLoading(true);
    setTimeout(() => {
        setScannedData('Destinataire Fictif (Caméra)');
        setIsLoading(false);
        toast({ title: "QR Code scanné", description: "Le destinataire a été identifié." });
    }, 1500);
  }

  const handlePayment = () => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez entrer un montant valide.",
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
      title: "Paiement réussi !",
      description: `Vous avez payé ${amount} ${currency} à ${scannedData}.`,
    });

    // Reset
    setAmount('');
    setScannedData(null);
  };

  return (
    <div className="container mx-auto max-w-md p-4 flex flex-col h-screen bg-muted/20">
       <header className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="icon" asChild>
                <Link href="/dashboard/mbongo-dashboard">
                    <ArrowLeft />
                </Link>
            </Button>
            <h1 className="font-headline text-xl font-bold text-primary">Paiement par QR Code</h1>
        </header>

      <Card className="flex-1 flex flex-col">
        <CardContent className="p-4 flex-1 flex flex-col items-center justify-center gap-4">
          {!scannedData ? (
             <>
                <div className="relative w-full max-w-sm aspect-square bg-black rounded-2xl overflow-hidden shadow-lg">
                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                    {hasCameraPermission === false && (
                         <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                            <Alert variant="destructive" className="w-4/5">
                                <Camera className="h-4 w-4" />
                                <AlertTitle>Accès Caméra Requis</AlertTitle>
                                <AlertDescription>
                                    Veuillez autoriser la caméra.
                                </AlertDescription>
                            </Alert>
                         </div>
                    )}
                     <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-3/4 h-3/4 border-4 border-dashed border-white/50 rounded-2xl animate-pulse"/>
                    </div>
                </div>
                
                 <Button onClick={handleManualScan} className="w-full max-w-sm" disabled={isLoading || !hasCameraPermission}>
                     {isLoading ? <Loader2 className="animate-spin"/> : <><Camera className="mr-2"/> Simuler un Scan</>}
                 </Button>

                <div className="relative w-full max-w-sm">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Ou</span>
                    </div>
                </div>

                <Button variant="outline" className="w-full max-w-sm" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2" />
                    Importer un QR Code
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
                <p className="text-muted-foreground">Vous payez à :</p>
                <p className="font-headline text-2xl font-bold text-primary">{scannedData}</p>
                
                <div className="w-full space-y-2 pt-4">
                    <Label htmlFor="amount">Montant</Label>
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

                 <Button className="w-full bg-gradient-to-r from-primary to-green-800 hover:from-primary/90 hover:to-green-800/90" size="lg" onClick={handlePayment}>
                    Payer maintenant
                </Button>
                
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
                          <span className="font-bold">{scannedData}</span>
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
                        {isPaying ? "Paiement en cours..." : "Confirmer le paiement"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button variant="link" onClick={() => setScannedData(null)}>
                    Scanner un autre code
                </Button>

            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

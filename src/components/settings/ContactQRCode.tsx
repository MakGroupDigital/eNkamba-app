'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Share2, QrCode as QrCodeIcon } from 'lucide-react';
import QRCode from 'qrcode';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

interface ContactQRCodeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userData: {
    name: string;
    email: string;
    phone?: string;
    uid: string;
  };
}

export function ContactQRCode({ open, onOpenChange, userData }: ContactQRCodeProps) {
  const [qrCode, setQrCode] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    if (!open || !userData.uid) return;

    const generateQR = async () => {
      try {
        // Format: CONTACT|uid|name|email|phone
        const qrData = `CONTACT|${userData.uid}|${userData.name}|${userData.email}|${userData.phone || ''}`;
        
        const qrDataUrl = await QRCode.toDataURL(qrData, {
          width: 800,
          margin: 4,
          errorCorrectionLevel: 'H',
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        });
        
        setQrCode(qrDataUrl);
      } catch (error) {
        console.error('Erreur génération QR:', error);
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Impossible de générer le QR code',
        });
      }
    };

    generateQR();
  }, [open, userData, toast]);

  const handleDownloadQR = () => {
    if (!qrCode) return;

    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `enkamba-contact-${userData.name.replace(/\s+/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Succès',
      description: 'QR code téléchargé',
      className: 'bg-green-600 text-white border-none',
    });
  };

  const handleShareQR = async () => {
    if (!qrCode) return;

    try {
      // Convertir le data URL en blob
      const response = await fetch(qrCode);
      const blob = await response.blob();
      const file = new File([blob], `enkamba-contact-${userData.name}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Mon contact eNkamba',
          text: `Ajoutez-moi sur eNkamba: ${userData.name}`,
          files: [file],
        });
        
        toast({
          title: 'Succès',
          description: 'QR code partagé',
          className: 'bg-green-600 text-white border-none',
        });
      } else {
        // Fallback: copier le lien
        const contactInfo = `${userData.name}\nEmail: ${userData.email}${userData.phone ? `\nTél: ${userData.phone}` : ''}`;
        await navigator.clipboard.writeText(contactInfo);
        
        toast({
          title: 'Copié',
          description: 'Informations de contact copiées',
          className: 'bg-green-600 text-white border-none',
        });
      }
    } catch (error) {
      console.error('Erreur partage QR:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de partager le QR code',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCodeIcon className="h-5 w-5 text-primary" />
            Mon QR Code de Contact
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* QR Code Display */}
          <div className="flex flex-col items-center gap-4 p-6 bg-gradient-to-br from-primary/10 to-green-800/5 rounded-lg border border-primary/20">
            <p className="text-sm font-semibold text-center">Scannez pour m'ajouter</p>
            {qrCode && (
              <div className="bg-white p-4 rounded-lg shadow-lg">
                <Image src={qrCode} alt="QR Code Contact" width={300} height={300} />
              </div>
            )}
          </div>

          {/* Contact Info */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm">
              <span className="font-semibold">Nom:</span> {userData.name}
            </p>
            <p className="text-sm break-all">
              <span className="font-semibold">Email:</span> {userData.email}
            </p>
            {userData.phone && (
              <p className="text-sm">
                <span className="font-semibold">Téléphone:</span> {userData.phone}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleDownloadQR}
              variant="outline"
              className="flex-1 gap-2"
              disabled={!qrCode}
            >
              <Download className="h-4 w-4" />
              Télécharger
            </Button>
            <Button
              onClick={handleShareQR}
              variant="default"
              className="flex-1 gap-2"
              disabled={!qrCode}
            >
              <Share2 className="h-4 w-4" />
              Partager
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Partagez ce QR code pour que d'autres puissent vous ajouter facilement
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

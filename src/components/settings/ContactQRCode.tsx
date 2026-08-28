'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Share2, QrCode as QrCodeIcon, ScanLine } from 'lucide-react';
import { ChatNavIcon } from '@/components/icons/service-icons';
import { BrandedQRCodeCard, createBrandedQRCodeDataUrl } from '@/components/qrcode/branded-qr-code-card';
import { ContactQRScanner } from '@/components/contacts/ContactQRScanner';
import QRCode from 'qrcode';
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
  const [scannerOpen, setScannerOpen] = useState(false);
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
            dark: '#073B9A',
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

  const handleDownloadQR = async () => {
    if (!qrCode) return;

    const brandedQRCode = await createBrandedQRCodeDataUrl({
      qrCode,
      title: 'QR contact Masolo',
      name: userData.name,
      subtitle: "Scannez pour m'ajouter",
      details: [],
      centerLabel: 'Chat',
      variant: 'contact',
      outputType: 'image/jpeg',
      quality: 0.95,
    });

    const link = document.createElement('a');
    link.href = brandedQRCode;
    link.download = `enkamba-contact-${userData.name.replace(/\s+/g, '-')}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Succès',
      description: 'QR code téléchargé',
      className: 'bg-primary text-white border-none',
    });
  };

  const handleShareQR = async () => {
    if (!qrCode) return;

    try {
      const brandedQRCode = await createBrandedQRCodeDataUrl({
        qrCode,
        title: 'QR contact Masolo',
        name: userData.name,
        subtitle: "Scannez pour m'ajouter",
        details: [],
        centerLabel: 'Chat',
        variant: 'contact',
        outputType: 'image/jpeg',
        quality: 0.95,
      });

      const response = await fetch(brandedQRCode);
      const blob = await response.blob();
      const file = new File([blob], `enkamba-contact-${userData.name}.jpg`, { type: 'image/jpeg' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Mon contact Kenz',
          text: `Ajoutez-moi sur Kenz: ${userData.name}`,
          files: [file],
        });
        
        toast({
          title: 'Succès',
          description: 'QR code partagé',
          className: 'bg-primary text-white border-none',
        });
      } else {
        // Fallback: copier le lien
        const contactInfo = `${userData.name}\nEmail: ${userData.email}${userData.phone ? `\nTél: ${userData.phone}` : ''}`;
        await navigator.clipboard.writeText(contactInfo);
        
        toast({
          title: 'Copié',
          description: 'Informations de contact copiées',
          className: 'bg-primary text-white border-none',
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
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCodeIcon className="h-5 w-5 text-primary" />
              Mon QR Code de Contact
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {qrCode && (
              <BrandedQRCodeCard
                qrCode={qrCode}
                title="QR contact Masolo"
                name={userData.name}
                subtitle="Scannez pour m'ajouter"
                details={[]}
                centerIcon={<ChatNavIcon size={28} className="text-white" />}
                variant="contact"
                qrAlt="QR Code Contact"
              />
            )}

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

            <section className="rounded-[8px] border border-primary/15 bg-primary/5 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-950">Scanner</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Scanner un QR contact pour ajouter ou écrire à une personne.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    setScannerOpen(true);
                  }}
                  className="shrink-0 gap-2"
                >
                  <ScanLine className="h-4 w-4" />
                  Ouvrir
                </Button>
              </div>
            </section>

            <p className="text-center text-xs text-muted-foreground">
              Partagez ce QR code pour que d'autres puissent vous ajouter facilement.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <ContactQRScanner
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onContactFound={() => {
          setScannerOpen(false);
        }}
      />
    </>
  );
}

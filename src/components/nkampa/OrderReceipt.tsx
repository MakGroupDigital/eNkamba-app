'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Download, Share2, CheckCircle, DownloadCloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';
import type { NkampaOrder } from '@/lib/nkampa-orders';

interface OrderReceiptProps {
  order: NkampaOrder;
  onClose?: () => void;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
}

export function OrderReceipt({ order, onClose, primaryActionLabel, onPrimaryAction }: OrderReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleDownload = async () => {
    if (!receiptRef.current) return;

    try {
      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `recu-nkampa-${order.orderId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Reçu téléchargé',
        description: 'Le reçu a été téléchargé avec succès',
        className: 'bg-primary text-white border-none',
      });
    } catch (error) {
      console.error('Erreur téléchargement reçu:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de télécharger le reçu',
        variant: 'destructive',
      });
    }
  };

  const handleShare = async () => {
    if (!receiptRef.current) return;

    try {
      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const file = new File([blob], `recu-${order.orderId}.png`, { type: 'image/png' });

        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'Reçu de commande Kenz',
            text: `Reçu de commande - ${order.orderId}`,
            files: [file],
          });
        } else {
          // Fallback: télécharger
          handleDownload();
        }
      });
    } catch (error) {
      console.error('Erreur partage reçu:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-white sm:bg-black/50 sm:p-4">
      <div className="mx-auto flex min-h-dvh w-full max-w-full flex-col bg-white sm:my-6 sm:min-h-0 sm:max-w-2xl sm:rounded-3xl">
        {/* Reçu */}
        <div ref={receiptRef} className="w-full max-w-full flex-1 overflow-hidden bg-white sm:rounded-3xl">
          {/* Header vert */}
          <div className="bg-gradient-to-r from-primary to-primary p-4 text-white sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white sm:h-12 sm:w-12">
                  <Image
                    src="/kenz-logo.png"
                    alt="Kenz"
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-black sm:text-2xl">Kenz Shop</h2>
                  <p className="text-sm opacity-90">Reçu de commande</p>
                </div>
              </div>
              <CheckCircle className="h-9 w-9 shrink-0 sm:h-12 sm:w-12" />
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90">Référence</p>
              <p className="break-all font-mono text-sm font-bold sm:text-lg">{order.orderId}</p>
            </div>
          </div>

          {/* Montant principal */}
          <div className="border-b p-4 text-center sm:p-6">
            <p className="text-sm text-muted-foreground mb-2">Montant payé</p>
            <p className="break-words text-3xl font-black text-primary sm:text-4xl">
              {order.totalAmount.toLocaleString()} CDF
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {order.paidAt ? new Date(order.paidAt.toDate ? order.paidAt.toDate() : order.paidAt).toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }) : 'En attente'}
            </p>
          </div>

          {/* Détails boutique */}
          <div className="border-b p-4 sm:p-6">
            <h3 className="font-bold text-lg mb-3">Boutique</h3>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="break-words text-lg font-bold">{order.storeName}</p>
              <p className="break-words text-sm text-muted-foreground">Vendeur: {order.sellerName}</p>
            </div>
          </div>

          {/* Détails produit */}
          <div className="border-b p-4 sm:p-6">
            <h3 className="font-bold text-lg mb-3">Produit commandé</h3>
            <div className="flex min-w-0 gap-3 sm:gap-4">
              <div className="relative h-20 w-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                <Image
                  src={order.productImage || '/placeholder-product.png'}
                  alt={order.productName}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="break-words font-semibold">{order.productName}</p>
                <div className="mt-2 space-y-1 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-muted-foreground">Quantité:</span>
                    <span className="font-semibold">{order.quantity}</span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-muted-foreground">Prix unitaire:</span>
                    <span className="break-words text-right font-semibold">{order.priceInCDF.toLocaleString()} CDF</span>
                  </div>
                  {order.originalCurrency !== 'CDF' && order.originalCurrency !== 'FC' && (
                    <div className="flex items-start justify-between gap-3 text-xs">
                      <span className="text-muted-foreground">Prix original:</span>
                      <span className="break-words text-right">{order.pricePerUnit.toLocaleString()} {order.originalCurrency}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Livraison */}
          <div className="border-b p-4 sm:p-6">
            <h3 className="font-bold text-lg mb-3">Informations de livraison</h3>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
                <span className="text-muted-foreground">Mode:</span>
                <span className="text-right font-semibold">
                  {order.deliveryOption === 'pickup' ? 'Retrait en boutique' : 'Livraison'}
                </span>
              </div>
              <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
                <span className="text-muted-foreground">Adresse:</span>
                <span className="break-words text-right font-semibold">{order.shippingAddress}</span>
              </div>
              <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
                <span className="text-muted-foreground">Téléphone:</span>
                <span className="break-words text-right font-semibold">{order.shippingPhone}</span>
              </div>
              {order.trackingNumber && (
                <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
                  <span className="text-muted-foreground">Suivi:</span>
                  <span className="break-all text-right font-mono font-semibold">{order.trackingNumber}</span>
                </div>
              )}
              {order.pickupRoute?.enabled && (
                <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
                  <span className="text-muted-foreground">Trajet:</span>
                  <span className="break-words text-right font-semibold">{order.pickupRoute.storeLocationLabel}</span>
                </div>
              )}
            </div>
          </div>

          {order.digitalDelivery?.files?.length ? (
            <div className="border-b p-4 sm:p-6">
              <h3 className="mb-3 flex items-center gap-2 text-lg font-bold">
                <DownloadCloud className="h-5 w-5 text-primary" />
                Accès digital
              </h3>
              <div className="rounded-xl border border-primary/15 bg-primary/5 p-4 text-sm">
                <p className="font-semibold text-primary">Téléchargement disponible après paiement</p>
                {order.digitalDelivery.instructions && (
                  <p className="mt-2 break-words text-muted-foreground">{order.digitalDelivery.instructions}</p>
                )}
                <p className="mt-3 text-xs font-semibold text-muted-foreground">
                  {order.digitalDelivery.files.length} fichier(s) associé(s) à cette commande.
                </p>
              </div>
            </div>
          ) : null}

          {/* Statut */}
          <div className="border-b p-4 sm:p-6">
            <h3 className="font-bold text-lg mb-3">Statut de la commande</h3>
            <div className="flex items-center gap-2">
              <div className={`px-4 py-2 rounded-full font-semibold text-sm ${
                order.status === 'paid' ? 'bg-primary/10 text-primary' :
                order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                order.status === 'shipped' ? 'bg-purple-100 text-purple-700' :
                order.status === 'delivered' ? 'bg-primary/10 text-primary' :
                'bg-gray-100 text-gray-700'
              }`}>
                {order.status === 'paid' ? 'Payée' :
                 order.status === 'processing' ? 'En traitement' :
                 order.status === 'shipped' ? 'Expédiée' :
                 order.status === 'delivered' ? 'Livrée' :
                 'En attente'}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 p-4 text-center sm:p-6">
            <p className="text-xs text-muted-foreground">
              Merci pour votre achat sur Kenz Shop
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Pour toute question, contactez le vendeur via la messagerie
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 grid grid-cols-2 gap-2 border-t bg-white/95 p-3 backdrop-blur sm:flex sm:gap-3 sm:p-4">
          <Button
            onClick={handleDownload}
            variant="outline"
            className="min-w-0 flex-1 text-xs sm:text-sm"
          >
            <Download className="mr-2 h-4 w-4 shrink-0" />
            Télécharger
          </Button>
          <Button
            onClick={handleShare}
            variant="outline"
            className="min-w-0 flex-1 text-xs sm:text-sm"
          >
            <Share2 className="mr-2 h-4 w-4 shrink-0" />
            Partager
          </Button>
          {primaryActionLabel && onPrimaryAction && (
            <Button
              onClick={onPrimaryAction}
              className="col-span-2 min-w-0 flex-1 bg-[#F51B2B]/100 text-xs hover:bg-[#F51B2B] sm:col-span-1 sm:text-sm"
            >
              {primaryActionLabel}
            </Button>
          )}
          {onClose && (
            <Button
              onClick={onClose}
              className="min-w-0 flex-1 bg-primary text-xs hover:bg-primary sm:text-sm"
            >
              Fermer
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

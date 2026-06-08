'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Download, Share2, CheckCircle } from 'lucide-react';
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
            title: 'Reçu de commande eNkamba',
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
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full my-8">
        {/* Reçu */}
        <div ref={receiptRef} className="bg-white rounded-2xl overflow-hidden">
          {/* Header vert */}
          <div className="bg-gradient-to-r from-primary to-primary p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center">
                  <Image
                    src="/enkamba-logo.png"
                    alt="eNkamba"
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-black">eNkamba Shop</h2>
                  <p className="text-sm opacity-90">Reçu de commande</p>
                </div>
              </div>
              <CheckCircle className="h-12 w-12" />
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90">Référence</p>
              <p className="font-mono font-bold text-lg">{order.orderId}</p>
            </div>
          </div>

          {/* Montant principal */}
          <div className="p-6 text-center border-b">
            <p className="text-sm text-muted-foreground mb-2">Montant payé</p>
            <p className="text-4xl font-black text-primary">
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
          <div className="p-6 border-b">
            <h3 className="font-bold text-lg mb-3">Boutique</h3>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="font-bold text-lg">{order.storeName}</p>
              <p className="text-sm text-muted-foreground">Vendeur: {order.sellerName}</p>
            </div>
          </div>

          {/* Détails produit */}
          <div className="p-6 border-b">
            <h3 className="font-bold text-lg mb-3">Produit commandé</h3>
            <div className="flex gap-4">
              <div className="relative h-20 w-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                <Image
                  src={order.productImage || '/placeholder-product.png'}
                  alt={order.productName}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="font-semibold">{order.productName}</p>
                <div className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Quantité:</span>
                    <span className="font-semibold">{order.quantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prix unitaire:</span>
                    <span className="font-semibold">{order.priceInCDF.toLocaleString()} CDF</span>
                  </div>
                  {order.originalCurrency !== 'CDF' && order.originalCurrency !== 'FC' && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Prix original:</span>
                      <span>{order.pricePerUnit.toLocaleString()} {order.originalCurrency}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Livraison */}
          <div className="p-6 border-b">
            <h3 className="font-bold text-lg mb-3">Informations de livraison</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mode:</span>
                <span className="font-semibold">
                  {order.deliveryOption === 'pickup' ? 'Retrait en boutique' : 'Livraison'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Adresse:</span>
                <span className="font-semibold text-right max-w-xs">{order.shippingAddress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Téléphone:</span>
                <span className="font-semibold">{order.shippingPhone}</span>
              </div>
              {order.trackingNumber && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Suivi:</span>
                  <span className="font-semibold text-right max-w-xs font-mono">{order.trackingNumber}</span>
                </div>
              )}
              {order.pickupRoute?.enabled && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Trajet:</span>
                  <span className="font-semibold text-right max-w-xs">{order.pickupRoute.storeLocationLabel}</span>
                </div>
              )}
            </div>
          </div>

          {/* Statut */}
          <div className="p-6 border-b">
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
          <div className="p-6 bg-gray-50 text-center">
            <p className="text-xs text-muted-foreground">
              Merci pour votre achat sur eNkamba Shop
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Pour toute question, contactez le vendeur via la messagerie
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 flex gap-3">
          <Button
            onClick={handleDownload}
            variant="outline"
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            Télécharger
          </Button>
          <Button
            onClick={handleShare}
            variant="outline"
            className="flex-1"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Partager
          </Button>
          {primaryActionLabel && onPrimaryAction && (
            <Button
              onClick={onPrimaryAction}
              className="flex-1 bg-orange-500 hover:bg-orange-600"
            >
              {primaryActionLabel}
            </Button>
          )}
          {onClose && (
            <Button
              onClick={onClose}
              className="flex-1 bg-primary hover:bg-primary"
            >
              Fermer
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

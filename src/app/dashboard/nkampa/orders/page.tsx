'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package, Truck, CheckCircle, XCircle, Download, MapPin, Phone, Calendar, DollarSign, Route, FileText, RotateCcw, ShieldCheck, DownloadCloud } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNkampaEcommerce } from '@/hooks/useNkampaEcommerce';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useReceiptDownload } from '@/hooks/useReceiptDownload';
import { requestOrderRefund } from '@/lib/nkampa-orders';

const STATUS_CONFIG = {
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800', icon: Package },
  paid: { label: 'Payé', color: 'bg-blue-100 text-blue-800', icon: DollarSign },
  shipped: { label: 'Expédié', color: 'bg-purple-100 text-purple-800', icon: Truck },
  delivered: { label: 'Livré', color: 'bg-primary/10 text-primary', icon: CheckCircle },
  cancelled: { label: 'Annulé', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export default function OrdersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { orders, isLoading } = useNkampaEcommerce();
  const { toast } = useToast();
  const { downloadReceipt: downloadReceiptPDF } = useReceiptDownload();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isDownloading, setIsDownloading] = useState(false);
  const [refundBusy, setRefundBusy] = useState(false);

  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status === filterStatus);

  const downloadReceipt = async (order: any) => {
    setIsDownloading(true);
    try {
      if (order.transactionId) {
        // Si on a un transactionId, utiliser la méthode standard
        await downloadReceiptPDF(
          order.transactionId,
          `recu-commande-${order.id.substring(0, 8)}.pdf`
        );
      } else {
        // Sinon, générer un reçu simple directement
        await generateSimpleReceipt(order);
      }
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de télécharger le reçu',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const generateSimpleReceipt = async (order: any) => {
    // Générer les données du QR code (format JSON)
    const qrData = JSON.stringify({
      type: 'ECOMMERCE_ORDER',
      orderId: order.id,
      trackingNumber: order.trackingNumber || '',
      productName: order.productName || 'Produit',
      quantity: order.quantity || 1,
      totalPrice: order.totalPrice || order.totalAmount || 0,
      currency: order.currency || 'CDF',
      status: order.status || 'pending',
      date: order.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    });

    // Générer le QR code en utilisant une API publique
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;

    // Générer un reçu HTML simple et le télécharger
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Reçu de Commande</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { background: #009058; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { border: 2px solid #009058; padding: 30px; border-radius: 0 0 10px 10px; }
          .section { margin: 20px 0; }
          .label { color: #666; font-size: 14px; }
          .value { font-size: 16px; font-weight: bold; margin-top: 5px; }
          .total { background: #f0f9f4; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; color: #666; margin-top: 30px; font-size: 12px; }
          .tracking { background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196F3; }
          .qr-section { text-align: center; margin: 30px 0; padding: 20px; background: #f5f5f5; border-radius: 8px; }
          .qr-section img { border: 3px solid #009058; border-radius: 8px; padding: 10px; background: white; }
          @media print {
            body { margin: 0; padding: 10px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>eNkamba</h1>
          <p>Reçu de Commande</p>
        </div>
        <div class="content">
          <div class="section">
            <div class="label">Numéro de Commande</div>
            <div class="value">#${order.id.substring(0, 8).toUpperCase()}</div>
          </div>
          
          ${order.trackingNumber ? `
          <div class="tracking">
            <div class="label">🔍 Numéro de Suivi</div>
            <div class="value" style="font-family: monospace;">${order.trackingNumber}</div>
            <p style="margin: 10px 0 0 0; font-size: 12px;">Utilisez ce numéro pour suivre votre colis</p>
          </div>
          ` : ''}
          
          <div class="section">
            <div class="label">Produit</div>
            <div class="value">${order.productName}</div>
          </div>
          
          <div class="section">
            <div class="label">Quantité</div>
            <div class="value">${order.quantity}</div>
          </div>
          
          <div class="section">
            <div class="label">Adresse de Livraison</div>
            <div class="value">${order.shippingAddress}</div>
          </div>
          
          <div class="section">
            <div class="label">Téléphone</div>
            <div class="value">${order.shippingPhone}</div>
          </div>
          
          <div class="section">
            <div class="label">Statut</div>
            <div class="value">${STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG]?.label || order.status}</div>
          </div>
          
          <div class="total">
            <div class="label">Total Payé</div>
            <div class="value" style="color: #009058; font-size: 24px;">
              ${(order.totalPrice || order.totalAmount || 0).toLocaleString()} ${order.currency || 'CDF'}
            </div>
          </div>
          
          <div class="section">
            <div class="label">Date de Commande</div>
            <div class="value">${order.createdAt?.toDate?.()?.toLocaleString('fr-FR') || 'N/A'}</div>
          </div>
          
          <div class="section">
            <div class="label">Méthode de Paiement</div>
            <div class="value">Portefeuille eNkamba</div>
          </div>

          <div class="qr-section">
            <div class="label" style="margin-bottom: 15px;">Scannez pour vérifier la commande</div>
            <img src="${qrCodeUrl}" alt="QR Code Commande" width="200" height="200" />
            <p style="margin-top: 15px; font-size: 12px; color: #666;">
              Scannez ce QR code pour accéder aux détails de votre commande
            </p>
          </div>
        </div>
        
        <div class="footer">
          <p>Ce reçu est une preuve officielle de votre commande.</p>
          <p>Veuillez le conserver pour vos dossiers.</p>
          <p style="margin-top: 20px;"><strong>eNkamba</strong> - La vie simplifiée et meilleure</p>
          <p>www.enkamba.io</p>
        </div>
      </body>
      </html>
    `;

    // Créer un blob et télécharger
    const blob = new Blob([receiptHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `recu-commande-${order.id.substring(0, 8)}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Succès',
      description: 'Reçu téléchargé avec succès',
      className: 'bg-primary text-white border-none',
    });
  };

  const trackOrder = (order: any) => {
    if (order.trackingNumber) {
      router.push(`/dashboard/package-tracking?tracking=${order.trackingNumber}`);
    } else {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Numéro de suivi non disponible',
      });
    }
  };

  const openPickupRoute = (order: any) => {
    router.push(`/dashboard/ugavi?orderId=${order.id}&source=nkampa`);
  };

  const handleRefundRequest = async (order: any) => {
    if (!user || !order?.id) return;
    setRefundBusy(true);
    try {
      await requestOrderRefund(order.id, {
        requestedBy: user.uid,
        reason: 'Demande client depuis Marché',
        amount: Number(order.totalPrice || order.totalAmount || 0),
      });
      setSelectedOrder({
        ...order,
        refundStatus: 'requested',
        refundRequest: {
          requestedBy: user.uid,
          reason: 'Demande client depuis Marché',
          amount: Number(order.totalPrice || order.totalAmount || 0),
          status: 'requested',
          requestedAt: new Date().toISOString(),
        },
      });
      toast({
        title: 'Demande envoyée',
        description: 'La demande de remboursement est enregistrée pour contrôle.',
        className: 'bg-primary text-white border-none',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error?.message || 'Impossible de demander le remboursement.',
      });
    } finally {
      setRefundBusy(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Veuillez vous connecter pour voir vos commandes</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-primary via-primary to-primary text-white p-4 shadow-lg">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/nkampa">
            <Button size="icon" variant="ghost" className="text-white hover:bg-white/20">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">Mes Commandes</h1>
            <p className="text-sm text-white/80">{orders.length} commande(s)</p>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          <Button
            size="sm"
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('all')}
            className="flex-shrink-0"
          >
            Toutes ({orders.length})
          </Button>
          {Object.entries(STATUS_CONFIG).map(([status, config]) => {
            const count = orders.filter(o => o.status === status).length;
            return (
              <Button
                key={status}
                size="sm"
                variant={filterStatus === status ? 'default' : 'outline'}
                onClick={() => setFilterStatus(status)}
                className="flex-shrink-0"
              >
                {config.label} ({count})
              </Button>
            );
          })}
        </div>
      </div>

      {/* Liste des commandes */}
      <div className="p-4 space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Chargement...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-2">Aucune commande</p>
            <Link href="/dashboard/nkampa">
              <Button>Commencer à acheter</Button>
            </Link>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const statusConfig = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG];
            const StatusIcon = statusConfig.icon;

            return (
              <Card
                key={order.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedOrder(order)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="font-semibold text-lg">{order.productName}</p>
                      <p className="text-sm text-gray-500">
                        Commande #{order.id.slice(0, 8)}
                      </p>
                    </div>
                    <Badge className={statusConfig.color}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusConfig.label}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div>
                      <p className="text-gray-500">Quantité</p>
                      <p className="font-semibold">{order.quantity}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Total</p>
                      <p className="font-semibold text-primary">
                        {((order as any).totalPrice || (order as any).totalAmount || 0).toLocaleString()} {(order as any).currency || 'CDF'}
                      </p>
                    </div>
                  </div>

                  {order.deliveryOption === 'pickup' && order.pickupRoute?.enabled && (
                    <div className="mb-2 rounded-lg border border-[#FFA500]/30 bg-[#FFA500]/10 p-2">
                      <div className="flex items-center gap-2">
                        <Route className="w-4 h-4 text-[#FFA500]" />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-[#FFA500]">Retrait en boutique</p>
                          <p className="text-xs text-[#FFA500]">Itineraire disponible depuis cette commande</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {(order as any).digitalDelivery?.files?.length ? (
                    <div className="mb-2 rounded-lg border border-primary/20 bg-primary/5 p-2">
                      <div className="flex items-center gap-2">
                        <DownloadCloud className="h-4 w-4 text-primary" />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-primary">Accès digital disponible</p>
                          <p className="text-xs text-primary/80">Téléchargement dans les détails de la commande</p>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {order.trackingNumber && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-blue-600" />
                        <div className="flex-1">
                          <p className="text-xs text-blue-600 font-semibold">Numéro de suivi</p>
                          <p className="text-xs font-mono text-blue-800">{order.trackingNumber}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    {order.createdAt?.toDate?.()?.toLocaleDateString('fr-FR')}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Modal détails commande */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <Card className="w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-lg">
            <CardHeader className="bg-gradient-to-r from-primary to-primary text-white">
              <div className="flex items-center justify-between">
                <CardTitle>Détails de la commande</CardTitle>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                  onClick={() => setSelectedOrder(null)}
                >
                  <XCircle className="h-6 w-6" />
                </Button>
              </div>
              <p className="text-sm text-white/80">#{selectedOrder.id}</p>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Statut */}
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-2">Statut</p>
                <Badge className={`${STATUS_CONFIG[selectedOrder.status as keyof typeof STATUS_CONFIG].color} text-base px-4 py-2`}>
                  {STATUS_CONFIG[selectedOrder.status as keyof typeof STATUS_CONFIG].label}
                </Badge>
              </div>

              {/* Produit */}
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-2">Produit</p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-semibold text-lg">{selectedOrder.productName}</p>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <p className="text-xs text-gray-500">Quantité</p>
                      <p className="font-semibold">{selectedOrder.quantity}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Prix unitaire</p>
                      <p className="font-semibold">
                        {((selectedOrder.totalPrice || selectedOrder.totalAmount || 0) / (selectedOrder.quantity || 1)).toLocaleString()} {selectedOrder.currency || 'CDF'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Livraison */}
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-2">Informations de livraison</p>
                  <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Route className="w-4 h-4 text-gray-400 mt-1" />
                    <div>
                      <p className="text-xs text-gray-500">Mode</p>
                      <p className="text-sm">{selectedOrder.deliveryOption === 'pickup' ? 'Retrait en boutique' : 'Livraison'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                    <div>
                      <p className="text-xs text-gray-500">Adresse</p>
                      <p className="text-sm">{selectedOrder.shippingAddress}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Phone className="w-4 h-4 text-gray-400 mt-1" />
                    <div>
                      <p className="text-xs text-gray-500">Téléphone</p>
                      <p className="text-sm">{selectedOrder.shippingPhone}</p>
                    </div>
                  </div>
                  {selectedOrder.trackingNumber && (
                    <div className="flex items-start gap-2">
                      <Truck className="w-4 h-4 text-gray-400 mt-1" />
                      <div>
                        <p className="text-xs text-gray-500">Numéro de suivi</p>
                        <p className="text-sm font-mono">{selectedOrder.trackingNumber}</p>
                      </div>
                    </div>
                  )}
                  {selectedOrder.pickupRoute?.enabled && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                      <div>
                        <p className="text-xs text-gray-500">Trajet boutique</p>
                        <p className="text-sm">{selectedOrder.pickupRoute.storeLocationLabel}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Paiement */}
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-2">Paiement</p>
                <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Méthode</span>
                    <span className="font-semibold">Portefeuille eNkamba</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total payé</span>
                    <span className="text-xl font-bold text-primary">
                      {(selectedOrder.totalPrice || selectedOrder.totalAmount || 0).toLocaleString()} {selectedOrder.currency || 'CDF'}
                    </span>
                  </div>
                  {selectedOrder.transactionId && (
                    <p className="text-xs text-gray-500 mt-2">
                      Transaction: {selectedOrder.transactionId}
                    </p>
                  )}
                </div>
              </div>

              {/* Facture */}
              <div>
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-600">
                  <FileText className="h-4 w-4" />
                  Facture
                </p>
                <div className="rounded-lg border border-primary/15 bg-white p-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-500">Numéro</span>
                    <span className="font-mono font-bold">{selectedOrder.invoiceNumber || selectedOrder.invoice?.invoiceNumber || 'En préparation'}</span>
                  </div>
                  {selectedOrder.invoice && (
                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                      <div className="rounded-lg bg-gray-50 p-2">
                        <p className="text-gray-500">Sous-total</p>
                        <p className="font-bold">{Number(selectedOrder.invoice.subtotal || 0).toLocaleString()} {selectedOrder.invoice.currency || 'CDF'}</p>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-2">
                        <p className="text-gray-500">Taxe incluse</p>
                        <p className="font-bold">{Number(selectedOrder.invoice.taxAmount || 0).toLocaleString()} {selectedOrder.invoice.currency || 'CDF'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Contrôle */}
              <div>
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-600">
                  <ShieldCheck className="h-4 w-4" />
                  Contrôle
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-primary/5 p-3">
                    <p className="text-gray-500">Vendeur</p>
                    <p className="font-bold text-primary">
                      {selectedOrder.compliance?.sellerVerified ? 'Vérifié' : 'À contrôler'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-primary/5 p-3">
                    <p className="text-gray-500">Douane</p>
                    <p className="font-bold text-primary">
                      {selectedOrder.compliance?.customsRequired ? 'Documents requis' : 'Non requis'}
                    </p>
                  </div>
                  {selectedOrder.stockSnapshot && (
                    <div className="col-span-2 rounded-lg bg-gray-50 p-3">
                      <p className="text-gray-500">Stock réservé</p>
                      <p className="font-bold">
                        {selectedOrder.stockSnapshot.reserved} unité(s)
                        {selectedOrder.stockSnapshot.after !== null && selectedOrder.stockSnapshot.after !== undefined
                          ? ` • reste ${selectedOrder.stockSnapshot.after}`
                          : ''}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Remboursement */}
              <div>
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-600">
                  <RotateCcw className="h-4 w-4" />
                  Remboursement
                </p>
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-gray-600">Statut</span>
                    <Badge variant="outline">
                      {selectedOrder.refundStatus === 'requested'
                        ? 'Demandé'
                        : selectedOrder.refundStatus === 'refunded'
                          ? 'Remboursé'
                          : 'Aucune demande'}
                    </Badge>
                  </div>
                  {!selectedOrder.refundStatus || selectedOrder.refundStatus === 'none' ? (
                    <Button
                      variant="outline"
                      className="mt-3 w-full gap-2"
                      onClick={() => handleRefundRequest(selectedOrder)}
                      disabled={refundBusy || selectedOrder.status === 'cancelled'}
                    >
                      <RotateCcw className="h-4 w-4" />
                      {refundBusy ? 'Envoi...' : 'Demander un remboursement'}
                    </Button>
                  ) : (
                    <p className="mt-2 text-xs text-gray-500">
                      La demande est enregistrée et sera contrôlée avant action financière.
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => downloadReceipt(selectedOrder)}
                  disabled={isDownloading}
                >
                  <Download className="w-4 h-4" />
                  {isDownloading ? 'Téléchargement...' : 'Télécharger reçu'}
                </Button>
                {(selectedOrder.status === 'shipped' || selectedOrder.status === 'paid') && selectedOrder.trackingNumber && (
                  <Button
                    className="flex-1 gap-2 bg-primary"
                    onClick={() => trackOrder(selectedOrder)}
                  >
                    <MapPin className="w-4 h-4" />
                    Suivre la commande
                  </Button>
                )}
                {selectedOrder.pickupRoute?.enabled && (
                  <Button
                    className="flex-1 gap-2 bg-[#FFA500]/100 hover:bg-[#FFA500]"
                    onClick={() => openPickupRoute(selectedOrder)}
                  >
                    <Route className="w-4 h-4" />
                    Voir itineraire
                  </Button>
                )}
                {selectedOrder.digitalDelivery?.files?.length && (
                  <Button
                    className="flex-1 gap-2 bg-primary hover:bg-primary"
                    onClick={() => router.push(`/dashboard/nkampa/orders/${selectedOrder.id}/digital`)}
                  >
                    <DownloadCloud className="w-4 h-4" />
                    Télécharger
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

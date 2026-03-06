'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package, Truck, CheckCircle, XCircle, Download, MapPin, Phone, Mail, Calendar, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNkampaEcommerce } from '@/hooks/useNkampaEcommerce';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const STATUS_CONFIG = {
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800', icon: Package },
  paid: { label: 'Payé', color: 'bg-blue-100 text-blue-800', icon: DollarSign },
  shipped: { label: 'Expédié', color: 'bg-purple-100 text-purple-800', icon: Truck },
  delivered: { label: 'Livré', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Annulé', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export default function OrdersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { orders, isLoading } = useNkampaEcommerce();
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status === filterStatus);

  const downloadReceipt = (order: any) => {
    // TODO: Générer et télécharger le reçu
    console.log('Télécharger reçu pour commande:', order.id);
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
      <div className="sticky top-0 z-10 bg-gradient-to-r from-primary via-primary to-green-800 text-white p-4 shadow-lg">
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
                        {order.totalPrice.toLocaleString()} {order.currency}
                      </p>
                    </div>
                  </div>

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
            <CardHeader className="bg-gradient-to-r from-primary to-green-800 text-white">
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
                        {(selectedOrder.totalPrice / selectedOrder.quantity).toLocaleString()} {selectedOrder.currency}
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
                </div>
              </div>

              {/* Paiement */}
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-2">Paiement</p>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Méthode</span>
                    <span className="font-semibold">Portefeuille eNkamba</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total payé</span>
                    <span className="text-xl font-bold text-primary">
                      {selectedOrder.totalPrice.toLocaleString()} {selectedOrder.currency}
                    </span>
                  </div>
                  {selectedOrder.transactionId && (
                    <p className="text-xs text-gray-500 mt-2">
                      Transaction: {selectedOrder.transactionId}
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
                >
                  <Download className="w-4 h-4" />
                  Télécharger reçu
                </Button>
                {(selectedOrder.status === 'shipped' || selectedOrder.status === 'paid') && (
                  <Button
                    className="flex-1 gap-2 bg-primary"
                    onClick={() => trackOrder(selectedOrder)}
                  >
                    <MapPin className="w-4 h-4" />
                    Suivre la commande
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

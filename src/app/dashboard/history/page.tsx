'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  History as HistoryIcon, 
  ArrowLeft, 
  Search, 
  Filter,
  ArrowUp,
  ArrowDown,
  ArrowDownLeft,
  ArrowUpRight,
  Send,
  Receipt,
  Wallet,
  ArrowRightLeft,
  Calendar,
  Clock,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Trash2,
  Download
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAllTransactions, Transaction } from '@/hooks/useAllTransactions';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useReceiptDownload } from '@/hooks/useReceiptDownload';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

type TransactionTypeFilter = 'all' | 'transfer_sent' | 'transfer_received' | 'deposit' | 'withdrawal' | 'payment_link' | 'contact_payment' | 'money_request_sent' | 'money_request_received';

const getTransactionIcon = (type: Transaction['type']) => {
  switch (type) {
    case 'deposit':
      return <ArrowDown className="h-5 w-5 text-green-500" />;
    case 'transfer_sent':
      return <Send className="h-5 w-5 text-orange-500" />;
    case 'transfer_received':
      return <ArrowDown className="h-5 w-5 text-green-500" />;
    case 'withdrawal':
      return <ArrowUp className="h-5 w-5 text-red-500" />;
    case 'payment_link':
      return <Receipt className="h-5 w-5 text-blue-500" />;
    case 'contact_payment':
      return <Receipt className="h-5 w-5 text-blue-500" />;
    case 'money_request_sent':
      return <Send className="h-5 w-5 text-orange-500" />;
    case 'money_request_received':
      return <ArrowDown className="h-5 w-5 text-green-500" />;
    default:
      return <Wallet className="h-5 w-5" />;
  }
};

const getStatusBadge = (status: Transaction['status']) => {
  const variants: Record<typeof status, { label: string; className: string }> = {
    completed: { label: 'Terminé', className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
    pending: { label: 'En attente', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
    failed: { label: 'Échoué', className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
    cancelled: { label: 'Annulée', className: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300' },
  };
  const { label, className } = variants[status];
  return <Badge className={className}>{label}</Badge>;
};

const getTransactionLabel = (type: Transaction['type']) => {
  const labels: Record<Transaction['type'], string> = {
    deposit: 'Dépôt',
    transfer_sent: 'Envoi',
    transfer_received: 'Réception',
    withdrawal: 'Retrait',
    payment_link: 'Lien de paiement',
    contact_payment: 'Paiement contact',
    money_request_sent: 'Demande envoyée',
    money_request_received: 'Demande reçue',
  };
  return labels[type] || 'Transaction';
};

const canCancelTransaction = (transaction: Transaction): boolean => {
  if (transaction.status !== 'completed') return false;
  if (transaction.type !== 'transfer_sent' && transaction.type !== 'withdrawal') return false;
  
  const transactionTime = transaction.timestamp?.toDate?.() || new Date(transaction.createdAt);
  const now = new Date();
  const diffMs = now.getTime() - transactionTime.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  
  return diffHours < 24;
};

const getTimeRemaining = (transaction: Transaction): string => {
  const transactionTime = transaction.timestamp?.toDate?.() || new Date(transaction.createdAt);
  const now = new Date();
  const diffMs = now.getTime() - transactionTime.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const remainingHours = Math.max(0, 24 - diffHours);
  
  if (remainingHours < 1) {
    const remainingMinutes = Math.ceil(remainingHours * 60);
    return `${remainingMinutes}m`;
  }
  return `${Math.floor(remainingHours)}h`;
};

export default function HistoryPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { downloadReceipt } = useReceiptDownload();
  const { transactions, loading, error } = useAllTransactions();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionTypeFilter>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = 
      tx.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.recipientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.senderName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === 'all' || tx.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const handleCancelTransaction = async () => {
    if (!user || !selectedTransaction) return;

    setIsCancelling(true);
    try {
      const cancelTransactionFn = httpsCallable(functions, 'cancelTransaction');
      const result = await cancelTransactionFn({
        userId: user.uid,
        transactionId: selectedTransaction.id,
      });

      const data = result.data as any;
      if (data.success) {
        toast({
          title: 'Succès',
          description: `Transaction annulée. ${data.refundAmount.toLocaleString('fr-FR')} CDF remboursés.`,
          className: 'bg-green-600 text-white border-none',
        });
        setSelectedTransaction(null);
        // Rafraîchir la page
        window.location.reload();
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Erreur lors de l\'annulation',
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!selectedTransaction) return;

    setIsDownloading(true);
    try {
      const filename = `recu-${selectedTransaction.id}-${new Date().toISOString().split('T')[0]}.pdf`;
      await downloadReceipt(selectedTransaction.id, filename);
    } catch (error: any) {
      console.error('Erreur téléchargement:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="container mx-auto max-w-6xl p-4 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/wallet">
              <ArrowLeft />
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <HistoryIcon className="h-6 w-6 text-[#32BB78]" />
            <h1 className="font-headline text-2xl font-bold bg-gradient-to-r from-[#32BB78] to-[#2a9d63] bg-clip-text text-transparent">
              Historique des Transactions
            </h1>
          </div>
        </div>
      </header>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par description, nom..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as TransactionTypeFilter)}>
              <SelectTrigger>
                <SelectValue placeholder="Type de transaction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="transfer_sent">Envois</SelectItem>
                <SelectItem value="transfer_received">Réceptions</SelectItem>
                <SelectItem value="deposit">Dépôts</SelectItem>
                <SelectItem value="withdrawal">Retraits</SelectItem>
                <SelectItem value="payment_link">Liens de paiement</SelectItem>
                <SelectItem value="money_request_sent">Demandes envoyées</SelectItem>
                <SelectItem value="money_request_received">Demandes reçues</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-lg">
            {filteredTransactions.length} transaction{filteredTransactions.length > 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
              <p className="text-muted-foreground">Chargement des transactions...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600">{error}</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <HistoryIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucune transaction trouvée</p>
              <p className="text-sm text-muted-foreground mt-2">
                Essayez de modifier vos filtres de recherche
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((tx) => {
                const isIncoming = tx.type === 'deposit' || tx.type === 'transfer_received' || tx.type === 'money_request_received';
                const Icon = isIncoming ? ArrowDownLeft : ArrowUpRight;
                const formattedDate = tx.timestamp?.toDate?.() 
                  ? new Date(tx.timestamp.toDate()).toLocaleDateString('fr-FR')
                  : new Date(tx.createdAt).toLocaleDateString('fr-FR');
                
                return (
                  <div
                    key={tx.id}
                    onClick={() => setSelectedTransaction(tx)}
                    className="flex items-center gap-4 p-4 rounded-xl hover:bg-muted/50 transition-colors group cursor-pointer border border-border/50 hover:border-[#32BB78]/50"
                  >
                    <div className={`p-3 rounded-full flex-shrink-0 ${isIncoming ? 'bg-[#32BB78]/20' : 'bg-red-100'}`}>
                      <Icon className={`w-5 h-5 ${isIncoming ? 'text-[#32BB78]' : 'text-red-600'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">{formattedDate}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(tx.status)}
                      </div>
                    </div>
                    <p className={`font-bold text-sm flex-shrink-0 ${isIncoming ? 'text-[#32BB78]' : 'text-foreground'}`}>
                      {isIncoming ? '+' : '-'} {tx.amount.toLocaleString('fr-FR')} {tx.currency || 'CDF'}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
              <CardTitle className="font-headline text-xl">Détails de la Transaction</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedTransaction(null)}
              >
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Statut</span>
                <div>{getStatusBadge(selectedTransaction.status)}</div>
              </div>

              {/* Type */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="font-semibold">{getTransactionLabel(selectedTransaction.type)}</span>
              </div>

              {/* Description */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Description</span>
                <span className="font-semibold text-right">{selectedTransaction.description}</span>
              </div>

              {/* Amount */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Montant</span>
                <span className={cn(
                  "text-lg font-bold",
                  (selectedTransaction.type === 'deposit' || selectedTransaction.type === 'transfer_received' || selectedTransaction.type === 'money_request_received') ? 'text-green-600' : 'text-foreground'
                )}>
                  {(selectedTransaction.type === 'deposit' || selectedTransaction.type === 'transfer_received' || selectedTransaction.type === 'money_request_received') ? '+' : '-'} {selectedTransaction.amount.toLocaleString('fr-FR')} {selectedTransaction.currency || 'CDF'}
                </span>
              </div>

              {/* Amount in CDF */}
              {selectedTransaction.amountInCDF && selectedTransaction.amountInCDF !== selectedTransaction.amount && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Montant en CDF</span>
                  <span className="font-semibold">{selectedTransaction.amountInCDF.toLocaleString('fr-FR')} CDF</span>
                </div>
              )}

              {/* Exchange Rate */}
              {selectedTransaction.exchangeRate && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Taux de change</span>
                  <span className="font-semibold">{selectedTransaction.exchangeRate.toFixed(2)}</span>
                </div>
              )}

              {/* Recipient/Sender */}
              {selectedTransaction.recipientName && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Destinataire</span>
                  <span className="font-semibold">{selectedTransaction.recipientName}</span>
                </div>
              )}

              {selectedTransaction.senderName && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Expéditeur</span>
                  <span className="font-semibold">{selectedTransaction.senderName}</span>
                </div>
              )}

              {/* Transfer Method */}
              {selectedTransaction.transferMethod && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Méthode</span>
                  <span className="font-semibold capitalize">{selectedTransaction.transferMethod}</span>
                </div>
              )}

              {/* Date & Time */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Date & Heure</span>
                <span className="font-semibold">
                  {new Date(selectedTransaction.createdAt).toLocaleDateString('fr-FR')} à {new Date(selectedTransaction.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Transaction ID */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">ID Transaction</span>
                <span className="font-mono text-xs">{selectedTransaction.id}</span>
              </div>

              {/* Balance Info */}
              {selectedTransaction.previousBalance !== undefined && selectedTransaction.newBalance !== undefined && (
                <>
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-muted-foreground">Solde avant</span>
                      <span className="font-semibold">{selectedTransaction.previousBalance.toLocaleString('fr-FR')} CDF</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Solde après</span>
                      <span className="font-semibold text-[#32BB78]">{selectedTransaction.newBalance.toLocaleString('fr-FR')} CDF</span>
                    </div>
                  </div>
                </>
              )}

              {/* Cancel Button */}
              {canCancelTransaction(selectedTransaction) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-blue-900">Annulation possible</p>
                      <p className="text-sm text-blue-800 mt-1">
                        Vous pouvez annuler cette transaction dans les <span className="font-bold">{getTimeRemaining(selectedTransaction)}</span> restantes.
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleCancelTransaction}
                    disabled={isCancelling}
                    className="w-full bg-red-600 hover:bg-red-700 text-white gap-2"
                  >
                    {isCancelling ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Annulation...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        Annuler la transaction
                      </>
                    )}
                  </Button>
                </div>
              )}

              {selectedTransaction.status === 'cancelled' && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Transaction annulée</p>
                    <p className="text-sm text-gray-700 mt-1">
                      Cette transaction a été annulée et remboursée.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>

            <div className="border-t p-4 flex gap-3">
              <Button
                onClick={handleDownloadReceipt}
                disabled={isDownloading}
                className="flex-1 bg-[#32BB78] hover:bg-[#2a9d63] text-white gap-2"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Téléchargement...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Télécharger le reçu
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedTransaction(null)}
                className="flex-1"
              >
                Fermer
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Check, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MoneyTransferMessageProps {
  amount: number;
  currency?: string;
  senderName?: string;
  senderPhoto?: string;
  receiverName?: string;
  receiverPhoto?: string;
  status?: 'pending' | 'completed' | 'failed';
  transactionId?: string;
  timestamp?: Date;
  onAccept?: () => Promise<void>;
  onReject?: () => Promise<void>;
  isReceiver?: boolean;
}

export function MoneyTransferMessage({
  amount,
  currency = 'FC',
  senderName,
  senderPhoto,
  receiverName,
  receiverPhoto,
  status = 'pending',
  transactionId,
  timestamp,
  onAccept,
  onReject,
  isReceiver = false,
}: MoneyTransferMessageProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [transferStatus, setTransferStatus] = useState(status);

  const handleAccept = async () => {
    if (!onAccept) return;
    setIsProcessing(true);
    try {
      await onAccept();
      setTransferStatus('completed');
      toast({
        title: 'Transfert accepté ✅',
        description: `${amount} ${currency} reçus de ${senderName}`,
      });
    } catch (error) {
      setTransferStatus('failed');
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors du transfert',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!onReject) return;
    setIsProcessing(true);
    try {
      await onReject();
      setTransferStatus('failed');
      toast({
        title: 'Transfert refusé',
        description: `Transfert de ${amount} ${currency} annulé`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors du refus',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = () => {
    switch (transferStatus) {
      case 'completed':
        return 'from-green-50 to-emerald-50 border-green-200';
      case 'failed':
        return 'from-red-50 to-pink-50 border-red-200';
      default:
        return 'from-blue-50 to-cyan-50 border-primary/20';
    }
  };

  const getStatusIcon = () => {
    switch (transferStatus) {
      case 'completed':
        return <Check className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <X className="h-5 w-5 text-red-600" />;
      default:
        return <DollarSign className="h-5 w-5 text-primary" />;
    }
  };

  const getStatusText = () => {
    switch (transferStatus) {
      case 'completed':
        return 'Transfert complété';
      case 'failed':
        return 'Transfert refusé';
      default:
        return 'Transfert en attente';
    }
  };

  return (
    <Card className={`w-full max-w-sm overflow-hidden bg-gradient-to-br ${getStatusColor()} border-2`}>
      {/* En-tête */}
      <div className="bg-gradient-to-r from-primary via-primary to-green-700 text-white p-3 flex items-center gap-2">
        {getStatusIcon()}
        <div className="flex-1">
          <p className="font-semibold text-sm">Transfert d'argent</p>
          <p className="text-xs opacity-90">{getStatusText()}</p>
        </div>
      </div>

      {/* Contenu */}
      <div className="p-4 space-y-3">
        {/* Montant */}
        <div className="text-center py-2">
          <p className="text-3xl font-bold text-primary">{amount.toLocaleString('fr-FR')}</p>
          <p className="text-sm text-gray-600">{currency}</p>
        </div>

        {/* Expéditeur et destinataire */}
        <div className="flex items-center justify-between gap-2 bg-white rounded-lg p-3">
          <div className="flex-1 text-center">
            <p className="text-xs text-gray-600 mb-1">De</p>
            <p className="text-sm font-semibold text-gray-900 truncate">{senderName || 'Utilisateur'}</p>
          </div>
          <div className="text-gray-400">→</div>
          <div className="flex-1 text-center">
            <p className="text-xs text-gray-600 mb-1">À</p>
            <p className="text-sm font-semibold text-gray-900 truncate">{receiverName || 'Destinataire'}</p>
          </div>
        </div>

        {/* ID de transaction */}
        {transactionId && (
          <div className="bg-gray-100 rounded-lg p-2">
            <p className="text-xs text-gray-600">ID Transaction</p>
            <p className="text-xs font-mono text-gray-800 truncate">{transactionId}</p>
          </div>
        )}

        {/* Boutons d'action */}
        {isReceiver && transferStatus === 'pending' && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 gap-2 border-red-300 text-red-600 hover:bg-red-50"
              onClick={handleReject}
              disabled={isProcessing}
            >
              <X className="h-4 w-4" />
              Refuser
            </Button>
            <Button
              size="sm"
              className="flex-1 gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
              onClick={handleAccept}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Accepter
            </Button>
          </div>
        )}

        {/* Statut complété */}
        {transferStatus === 'completed' && (
          <div className="bg-green-50 rounded-lg p-3 border border-green-200 text-center">
            <p className="text-sm font-semibold text-green-900">✅ Transfert réussi</p>
            <p className="text-xs text-green-700 mt-1">L'argent a été crédité</p>
          </div>
        )}

        {/* Statut refusé */}
        {transferStatus === 'failed' && (
          <div className="bg-red-50 rounded-lg p-3 border border-red-200 text-center">
            <p className="text-sm font-semibold text-red-900">❌ Transfert refusé</p>
            <p className="text-xs text-red-700 mt-1">L'argent n'a pas été transféré</p>
          </div>
        )}

        {/* Timestamp */}
        {timestamp && (
          <p className="text-xs text-gray-500 text-center">
            {new Date(timestamp).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}
      </div>
    </Card>
  );
}

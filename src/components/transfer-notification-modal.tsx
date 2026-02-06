'use client';

import { useState, useEffect } from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, DollarSign, User } from 'lucide-react';
import { useNotifications, Notification } from '@/hooks/useNotifications';

export function TransferNotificationModal() {
  const { unacknowledgedNotifications, acknowledgeNotification } = useNotifications();
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Afficher la première notification non acquittée
  useEffect(() => {
    console.log('Notifications non acquittées:', unacknowledgedNotifications.length);
    if (unacknowledgedNotifications.length > 0 && !currentNotification) {
      console.log('Affichage de la notification:', unacknowledgedNotifications[0]);
      setCurrentNotification(unacknowledgedNotifications[0]);
      setIsOpen(true);
    }
  }, [unacknowledgedNotifications, currentNotification]);

  const handleAcknowledge = async () => {
    if (currentNotification) {
      console.log('Acquittement de la notification:', currentNotification.id);
      await acknowledgeNotification(currentNotification.id);
      setIsOpen(false);
      setCurrentNotification(null);
      
      // Afficher la prochaine notification après un délai
      setTimeout(() => {
        if (unacknowledgedNotifications.length > 1) {
          console.log('Affichage de la prochaine notification');
          setCurrentNotification(unacknowledgedNotifications[1]);
          setIsOpen(true);
        }
      }, 500);
    }
  };

  if (!currentNotification) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent className="max-w-md border-2 border-green-500/30 bg-gradient-to-br from-green-50 to-background">
        <AlertDialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center animate-pulse">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <AlertDialogTitle className="text-center text-xl">
            {currentNotification.title}
          </AlertDialogTitle>
        </AlertDialogHeader>

        <div className="space-y-4">
          <Card className="bg-green-50/50 border-green-200 p-4 space-y-3">
            {/* Montant */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm">Montant reçu</span>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">
                  {currentNotification.amount?.toLocaleString('fr-FR') || '0'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {currentNotification.currency || 'CDF'}
                </p>
              </div>
            </div>

            {/* Expéditeur */}
            {currentNotification.senderName && (
              <div className="flex items-center justify-between pt-2 border-t border-green-200">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span className="text-sm">De</span>
                </div>
                <p className="font-semibold text-foreground">
                  {currentNotification.senderName}
                </p>
              </div>
            )}

            {/* Message */}
            <div className="pt-2 border-t border-green-200">
              <p className="text-sm text-foreground">
                {currentNotification.message}
              </p>
            </div>
          </Card>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-900">
              ℹ️ Veuillez confirmer la réception de ce transfert en cliquant sur "OK". Cette notification restera visible jusqu'à votre confirmation.
            </p>
          </div>
        </div>

        <AlertDialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="flex-1"
          >
            Plus tard
          </Button>
          <AlertDialogAction
            onClick={handleAcknowledge}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            OK, Confirmé
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

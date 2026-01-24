'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChatNavIcon, AINavIcon } from '@/components/icons/service-icons';

interface ContactsPermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAllow: () => void;
  isLoading?: boolean;
}

export function ContactsPermissionDialog({
  open,
  onOpenChange,
  onAllow,
  isLoading = false,
}: ContactsPermissionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <ChatNavIcon size={32} className="text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center">Accéder à vos contacts</DialogTitle>
          <DialogDescription className="text-center">
            eNkamba a besoin d'accéder à vos contacts pour vous montrer qui utilise déjà l'app et vous permettre d'inviter vos amis.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs">✓</span>
              </div>
              <div>
                <p className="font-medium text-sm text-blue-900">Voir qui utilise eNkamba</p>
                <p className="text-xs text-blue-700">Identifiez vos contacts déjà sur l'app</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs">✓</span>
              </div>
              <div>
                <p className="font-medium text-sm text-blue-900">Inviter facilement</p>
                <p className="text-xs text-blue-700">Envoyez des invitations par SMS en un clic</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs">✓</span>
              </div>
              <div>
                <p className="font-medium text-sm text-blue-900">Sécurisé</p>
                <p className="text-xs text-blue-700">Vos contacts ne sont jamais partagés</p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-3">
            <div className="h-5 w-5 rounded-full bg-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs">!</span>
            </div>
            <p className="text-xs text-amber-800">
              Vous pouvez modifier cette permission à tout moment dans les paramètres de votre appareil.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="flex-1"
            >
              Plus tard
            </Button>
            <Button
              onClick={onAllow}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Chargement...' : 'Autoriser'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

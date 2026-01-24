'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChatNavIcon, AINavIcon } from '@/components/icons/service-icons';

interface StartChatEmptyStateProps {
  onStartChat: () => void;
  isLoading?: boolean;
}

export function StartChatEmptyState({ onStartChat, isLoading = false }: StartChatEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="text-center space-y-6 max-w-md">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <ChatNavIcon size={48} className="text-primary" />
            </div>
            <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-accent flex items-center justify-center shadow-lg">
              <span className="text-white text-lg">+</span>
            </div>
          </div>
        </div>

        {/* Title */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Commencer la discussion
          </h2>
          <p className="text-muted-foreground">
            Connectez-vous avec vos amis et votre famille sur eNkamba
          </p>
        </div>

        {/* Benefits */}
        <Card className="bg-muted/50 border-0 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <ChatNavIcon size={14} className="text-primary" />
            </div>
            <div className="text-left">
              <p className="font-medium text-sm">Messages instantanés</p>
              <p className="text-xs text-muted-foreground">Communiquez en temps réel</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <AINavIcon size={14} className="text-primary" />
            </div>
            <div className="text-left">
              <p className="font-medium text-sm">Groupes et canaux</p>
              <p className="text-xs text-muted-foreground">Créez des conversations de groupe</p>
            </div>
          </div>
        </Card>

        {/* CTA Button */}
        <Button
          onClick={onStartChat}
          disabled={isLoading}
          size="lg"
          className="w-full h-12 rounded-xl font-semibold"
        >
          {isLoading ? 'Chargement...' : 'Commencer maintenant'}
        </Button>

        {/* Secondary text */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Vous aurez besoin d'accéder à vos contacts pour continuer
          </p>
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <span>Tu peux aussi discuter avec eNkamba.ai, notre assistant intelligent</span>
            <AINavIcon size={14} className="text-primary" />
          </p>
        </div>
      </div>
    </div>
  );
}
